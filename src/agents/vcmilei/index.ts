import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { VC_MILEI_PROMPT } from "../../prompts/vcMilei";
import { getVCMileiToolkit } from "./toolkit";
import { db } from "../../memory/db";

export class VCMileiAgent {
  name: string;

  /**
   * @param name - The name of the agent
   */
  constructor(name: string) {
    this.name = name;
  }

  /**
   * @param data - The data to handle
   */
  async handleRequest(data: any): Promise<any> {
    try {
      // Determine if this is an investment analysis or general query
      const isInvestmentQuery = data.type === 'investment';
      
      const response = await this.generateResponse({
        ...data,
        isInvestmentQuery
      });

      let parsedResponse: any;
      try {
        parsedResponse = JSON.parse(response.text);
      } catch (e) {
        // If it's not JSON (like for general queries), use raw text
        parsedResponse = response.text;
      }

      const metadata = {
        usage: response.usage || {},
        finishReason: response.finishReason,
        toolResults: response.toolResults || [],
        queryType: isInvestmentQuery ? 'investment' : 'general'
      };

      // Save to memory with appropriate context
    //   await db.saveMemory(JSON.stringify({
    //     query: data,
    //     response: parsedResponse,
    //     timestamp: new Date().toISOString()
    //   }), isInvestmentQuery ? 'Investment' : 'Commentary');

      return {
        success: true,
        data: {
          response: parsedResponse,
          metadata
        },
        timestamp: new Date().toISOString()
      };

    } catch (error: any) {
      console.error(`[${this.name}] Error handling request:`, {
        message: error.message,
        stack: error.stack,
        error
      });
      return {
        success: false,
        error: error.message || "An unknown error occurred",
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * @dev Generates a response using the VCMilei persona
   * @param requestData - The data for generating the response
   */
  async generateResponse(requestData: any): Promise<any> {
    try {
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
        const newsResponse = await toolkit.getNewsReport.execute(
          { 
            asset: requestData.isInvestmentQuery ? requestData.project : requestData.query,
          },
          { toolCallId: '', messages: [] }
        );
        
        if (newsResponse.success && newsResponse.data) {
          newsContext = `Recent news context:\n${JSON.stringify(newsResponse.data, null, 2)}\n\n`;
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

      const content = requestData.isInvestmentQuery
        ? `Investment Analysis Request:
           Project: ${requestData.project}
           Description: ${requestData.description}
           Requested Amount: ${requestData.amount}
           Network: ${requestData.network}
           Expected Response Structure: ${JSON.stringify(responseStructure, null, 2)}`
        : `Query: ${requestData.query}
           Expected Response Structure: ${JSON.stringify(responseStructure, null, 2)}`;

      const response = await generateText({
        model: openai("gpt-4o-mini"),
        system: context + VC_MILEI_PROMPT,
        messages: [
          {
            role: "user",
            content
          },
        ],
        tools: toolkit,
        maxSteps: 50,
        temperature: 0.9,
        onStepFinish: this.onStepFinish.bind(this),
      });

      // Parse and validate the response structure
      let parsedResponse: any = response.text;
      try {
        // First try to extract JSON if the response contains both text and JSON
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          parsedResponse = JSON.parse(response.text);
        }

        // Merge with the expected structure to ensure all fields exist
        parsedResponse = {
          ...responseStructure,
          ...parsedResponse
        };

        // Format the response with proper indentation and line breaks
        const formattedResponse = {
          commentary: response.text.replace(/\{[\s\S]*\}/, '').trim(), // Extract any text before/after JSON
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
            commentary: response.text,
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
