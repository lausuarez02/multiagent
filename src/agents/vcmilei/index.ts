import { AtomaSDK } from "atoma-sdk";
import { VC_MILEI_PROMPT } from "../../prompts/vcMilei";
import { getVCMileiToolkit } from "./toolkit";
import { db } from "../../memory/db";
import { TwitterClient } from "../../utils/twitter";
import * as fs from 'fs/promises';
import * as path from 'path';
import { getTwitterClient } from "../../utils/twitter/singleton";

const atomaSDK = new AtomaSDK({
  bearerAuth: process.env["ATOMASDK_BEARER_AUTH"] ?? "",
});

interface ProcessedTweets {
  processedIds: string[];
  lastUpdated: string;
}

export class VCMileiAgent {
  private processedTweetsPath: string;
  private twitter!: TwitterClient;
  private processedTweets: ProcessedTweets = {
    processedIds: [],
    lastUpdated: new Date().toISOString()
  };

  name: string;

  /**
   * @param name - The name of the agent
   */
  constructor() {
    this.name = "VCMilei";
    this.processedTweetsPath = path.join(process.cwd(), 'data', 'processed_tweets.json');
  }

  async init() {
    console.log(`[${this.name}] Initializing...`);
    
    // Ensure data directory exists
    await this.ensureDataDirectory();
    
    // Load processed tweets
    await this.loadProcessedTweets();

    // Initialize Twitter client
    console.log(`[${this.name}] Initializing Twitter client...`);
    this.twitter = await getTwitterClient();
    
    console.log(`[${this.name}] Initialization complete!!!!!!!`);
  }

  private async ensureDataDirectory() {
    const dataDir = path.dirname(this.processedTweetsPath);
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }
  }

  private async loadProcessedTweets() {
    try {
      const data = await fs.readFile(this.processedTweetsPath, 'utf-8');
      this.processedTweets = JSON.parse(data);
      console.log(`[${this.name}] Loaded ${this.processedTweets.processedIds.length} processed tweets`);
    } catch (error) {
      // If file doesn't exist or is invalid, use default empty state
      console.log(`[${this.name}] No existing processed tweets file, starting fresh`);
      await this.saveProcessedTweets();
    }
  }

  private async saveProcessedTweets() {
    try {
      // Update the lastUpdated timestamp
      this.processedTweets.lastUpdated = new Date().toISOString();
      
      // Save to file
      await fs.writeFile(
        this.processedTweetsPath,
        JSON.stringify(this.processedTweets, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error(`[${this.name}] Error saving processed tweets:`, error);
    }
  }

  private async markTweetAsProcessed(tweetId: string) {
    if (!this.processedTweets.processedIds.includes(tweetId)) {
      this.processedTweets.processedIds.push(tweetId);
      // Keep only the last 1000 processed tweets
      if (this.processedTweets.processedIds.length > 1000) {
        this.processedTweets.processedIds = this.processedTweets.processedIds.slice(-1000);
      }
      await this.saveProcessedTweets();
    }
  }

  private isTweetProcessed(tweetId: string): boolean {
    return this.processedTweets.processedIds.includes(tweetId);
  }

  /**
   * @param request - The request to handle
   */
  async handleRequest(request: any) {
    try {
        const toolkit = getVCMileiToolkit();

        // For mentions/replies
        if (request.context?.notificationType === 'mention') {
            const newsReport = await toolkit.getNewsReport.execute({
                asset: '',
                timeframe: '24h',
                limit: 5
            }, { toolCallId: '', messages: [] });
            
            const completion = await atomaSDK.chat.create({
                messages: [
                    { role: "system", content: VC_MILEI_PROMPT },
                    { 
                        role: "user", 
                        content: `Context: ${JSON.stringify(newsReport.data)}\n\nSomeone tweeted at you: "${request.query}"\nRespond naturally as VCMilei, using relevant news context if applicable. NO JSON, NO ANALYSIS STRUCTURE, just a natural tweet response.`
                    }
                ],
                model: "meta-llama/Llama-3.3-70B-Instruct"
            });

            // Reply to the tweet
            if (request.context.tweetId) {
                await this.twitter.replyToTweet(completion.choices[0].message.content, request.context.tweetId);
            }
            return { text: completion.choices[0].message.content };
        }
        
        // For news updates
        if (request.type === 'news') {
            const newsReport = await toolkit.getNewsReport.execute({
                asset: '',
                timeframe: '24h',
                limit: 5
            }, { toolCallId: '', messages: [] });
            
            if (newsReport.success && newsReport.data) {
                const completion = await atomaSDK.chat.create({
                    messages: [
                        { role: "system", content: VC_MILEI_PROMPT },
                        { 
                            role: "user", 
                            content: `
Analyze this news and create a tweet in ENGLISH with Javier Milei's distinctive style: ${JSON.stringify(newsReport.data)}

IMPORTANT MILEI STYLE GUIDELINES:
1. ALWAYS tweet in ENGLISH
2. Use CAPS LOCK for emphasis and strong opinions
3. Include "LONG LIVE LIBERTY DAMN IT! 🗽" for strong libertarian statements
4. Use terms like "LEFTISTS" or "THE ESTABLISHMENT" when criticizing
5. Add "!" and "!!" for emphasis
6. Include emojis like 🚀💥🔥🗽
7. Be passionate and direct
8. Reference Austrian economics when relevant
9. Use "..." for dramatic pauses
10. Start threads with "🧵" when needed

Create a tweet that captures this energy and style while discussing the news. MUST BE IN ENGLISH. NO JSON format.`
                        }
                    ],
                    model: "meta-llama/Llama-3.3-70B-Instruct"
                });

                if (completion.choices[0].message.content.trim()) {
                    await this.twitter.postTweetThread([completion.choices[0].message.content]);
                }
                return { text: completion.choices[0].message.content };
            }
        }

        return null;
    } catch (error) {
        console.error(`[${this.name}] Error handling request:`, error);
        throw error;
    }
  }

  /**
   * @dev Generates a response using the VCMilei persona
   * @param requestData - The data for generating the response
   */
  async generateResponse(request: any) {
    try {
      // If it's a mention/reply, format as a conversational response
      if (request.context?.notificationType === 'mention') {
        const response = await atomaSDK.chat.create({
          messages: [
            { role: "system", content: VC_MILEI_PROMPT },
            { 
              role: "user", 
              content: `Someone tweeted at you: "${request.query}"\nRespond naturally as VCMilei, in a conversational way. NO JSON, NO ANALYSIS STRUCTURE, just a natural tweet response.`
            }
          ],
          model: "meta-llama/Llama-3.3-70B-Instruct"
        });

        return {
          text: response.choices[0].message.content
        };
      }
      
      const toolkit = getVCMileiToolkit();
      
      // Always check wallet balance first
      const balanceCheck = await toolkit.checkWalletBalance.execute(
        {},
        { toolCallId: '', messages: [] }
      );

      // Get market metrics
      // const marketMetrics = await toolkit.getMarketMetrics.execute(
      //   { metric: 'all' },
      //   { toolCallId: '', messages: [] }
      // );

      // Always fetch relevant news first
      let newsContext = '';
      try {
        const newsReport = await toolkit.getNewsReport.execute({
            asset: '',  // Empty string for latest news
            timeframe: '24h',
            limit: 5
        }, { toolCallId: '', messages: [] });
        
        if (newsReport.success && newsReport.data) {
          newsContext = `Recent news context:\n${JSON.stringify(newsReport.data, null, 2)}\n\n`;
        }
      } catch (error) {
        console.warn(`[${this.name}] Failed to fetch news context:`, error);
      }

//       Market Metrics:
// ${JSON.stringify(marketMetrics.data, null, 2)}
      const context = `
Current Portfolio Status:
${JSON.stringify(balanceCheck.data, null, 2)}


${newsContext}
      `.trim();

      // Update response structure to include investment actions
      const responseStructure = {
        type: "AUTONOMOUS_INVESTMENT",
        market_analysis: {
          sentiment: null,
          key_metrics: null,
          opportunities: [],
        },
        investment_action: {
          type: null, // "SWAP" | "HOLD" | "INVEST"
          fromToken: null,
          toToken: null,
          amount: null,
          reasoning: [],
        },
        execution_results: null,
        future_outlook: {
          short_term: null,
          mid_term: null,
          risks: [],
        },
        milei_catchphrase: null
      };

      const content = request.isInvestmentQuery
        ? `Investment Analysis Request:
           Project: ${request.project}
           Description: ${request.description}
           Requested Amount: ${request.amount}
           Network: ${request.network}
           Expected Response Structure: ${JSON.stringify(responseStructure, null, 2)}`
        : `Query: ${request.query}
           Expected Response Structure: ${JSON.stringify(responseStructure, null, 2)}`;

      const response = await atomaSDK.chat.create({
        messages: [
          {
            role: "system",
            content: context + VC_MILEI_PROMPT
          },
          {
            role: "user",
            content
          },
        ],
        model: "meta-llama/Llama-3.3-70B-Instruct"
      });

      // Parse and validate the response structure
      let parsedResponse: any = response.choices[0].message.content;
      try {
        // First try to extract JSON if the response contains both text and JSON
        const jsonMatch = response.choices[0].message.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          parsedResponse = JSON.parse(response.choices[0].message.content);
        }

        // Merge with the expected structure to ensure all fields exist
        parsedResponse = {
          ...responseStructure,
          ...parsedResponse
        };

        // Format the response with proper indentation and line breaks
        const formattedResponse = {
          commentary: response.choices[0].message.content.replace(/\{[\s\S]*\}/, '').trim(), // Extract any text before/after JSON
          analysis: parsedResponse
        };

        return {
          ...response,
          text: JSON.stringify(formattedResponse, null, 2)
        };

      } catch (e) {
        console.warn(`[${this.name}] Response wasn't JSON, using text format`);
        // If parsing fails, return the original text in a structured format
        return {
          ...response,
          text: JSON.stringify({
            commentary: response.choices[0].message.content,
            analysis: null
          }, null, 2)
        };
      }

    } catch (error: any) {
      console.error(`[${this.name}] Error in generateResponse:`, error);
      throw error;
    }
  }

  /**
   * @param data - The data to handle from each step
   */
  async onStepFinish({ text, toolCalls, toolResults }: any) {
    try {
    //   if (text) {
    //     await db.saveMemory(text, 'VCMilei');
    //   }
      
      // Log tool usage for monitoring
      if (toolCalls?.length) {
        console.log(
          `[${this.name}] Tools called:`,
          toolCalls.map((tool: any) => tool.toolName).join(", ")
        );
      }
    } catch (error: any) {
      console.error(`[${this.name}] Error in onStepFinish:`, error);
    }
  }
}
