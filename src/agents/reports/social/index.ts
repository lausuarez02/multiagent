import { AtomaSDK } from "atoma-sdk";
import { SOCIAL_REPORT_PROMPT } from "../../../prompts/socialReport";
import { getSocialToolkit } from "./toolkit";
import { db } from "../../../memory/db";
import { collectSocialMetrics } from "../../../data/social";

const atomaSDK = new AtomaSDK({
  bearerAuth: process.env["ATOMASDK_BEARER_AUTH"] ?? "",
});

interface SocialReport {
  profile: any;
  engagement: any;
  risk_assessment: any;
  analysis: any;
  dateRange: any;
  agent_metrics?: {
    followers: number;
    following: number;
    tweets: number;
    engagement: number;
  };
  related_news?: {
    title: string;
    content: string;
    date: string;
    source: string;
  }[];
  additionalNotes?: string[];
}

export class SocialAgent {
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
  async handleSocialRequest(data: any): Promise<any> {
    try {
      if (!data?.username) {
        return {
          success: false,
          error: 'Username is required',
          timestamp: new Date().toISOString()
        };
      }

      // Collect metrics before generating report
      const socialMetrics = await collectSocialMetrics(data.username);
      
      console.log(`[${this.name}] received social report request:`, {
        dateRange: data.dateRange,
        metrics: socialMetrics
      });

      const response = await this.generateSocialReport({
        ...data,
        metrics: socialMetrics
      });
      
      let parsedReport: SocialReport;
      try {
        // Extract JSON from the response
        const jsonMatch = response.text.match(/```json\n([\s\S]*?)\n```/);
        const jsonStr = jsonMatch ? jsonMatch[1] : response.text;
        const rawReport = JSON.parse(jsonStr);

        // Format the report maintaining the AI's analysis
        parsedReport = {
          profile: rawReport.profile_stats,
          engagement: rawReport.engagement_metrics,
          risk_assessment: rawReport.risk_assessment,
          analysis: rawReport.analysis || {},
          dateRange: rawReport.date_range,
          agent_metrics: socialMetrics.twitter?.agent_metrics,
          related_news: socialMetrics.twitter?.related_news
        };

        // Extract any additional notes if present
        const notesMatch = response.text.match(/### Additional Notes:\n([\s\S]*?)$/);
        if (notesMatch) {
          parsedReport.additionalNotes = notesMatch[1]
            .split('\n')
            .filter((note:any) => note.trim())
            .map((note:any) => note.replace('- ', '').trim());
        }

      } catch (e) {
        console.error(`[${this.name}] Error parsing report JSON:`, e);
        console.log(`[${this.name}] Raw text that failed to parse:`, response.text);
        parsedReport = response.text;
      }

      // Extract useful metadata from the response
      const metadata = {
        usage: response.usage || {},
        finishReason: response.finishReason,
        toolResults: response.toolResults || [],
        steps: response.steps?.map((step:any) => ({
          type: step.stepType,
          toolCalls: step.toolCalls?.map((call:any) => call.function?.name) || []
        })) || []
      };

      return {
        success: true,
        data: {
          report: parsedReport,
          metadata
        },
        timestamp: new Date().toISOString()
      };

    } catch (error: any) {
      console.error(`[${this.name}] Error handling social request:`, error);
      return {
        success: false,
        error: error?.message || 'An error occurred while generating the report',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * @dev Generates a social report
   * @param socialData - The data for the social report generation
   */
  async generateSocialReport(socialData: any): Promise<any> {
    try {
      const toolkit = getSocialToolkit();

      const completion = await atomaSDK.chat.create({
        messages: [
          { role: "system", content: SOCIAL_REPORT_PROMPT },
          {
            role: "user",
            content: `Generate a social media analysis report for user ${socialData.username} during ${socialData.dateRange || '30d'}. Include engagement metrics, agent-specific trends, and relevant news analysis. Here is the collected data: ${JSON.stringify(socialData.metrics)}`
          }
        ],
        model: "meta-llama/Llama-3.3-70B-Instruct"
      });

      if (!completion.choices[0].message.content) {
        throw new Error('No response text from AI model');
      }

      return {
        text: completion.choices[0].message.content,
        usage: completion.usage,
        finishReason: completion.choices[0].finishReason
      };
    } catch (error: any) {
      console.error(`[${this.name}] Error generating social report:`, error);
      throw new Error(error?.message || 'Failed to generate social report');
    }
  }

  /**
   * @param data - The data to handle
   */
  async onStepFinish({ text, toolCalls, toolResults }: any) {
    try {
      const toolNames = toolCalls?.length > 0
        ? toolCalls.map((tool: any) => tool.toolName || tool.function?.name).join(", ")
        : "none";

      console.log(`[social] step finished. tools called: ${toolNames}`);
      
      if (text) {
        await db.saveMemory(text, 'Analysis');
      }
    } catch (error: any) {
      console.error('[social] Error in onStepFinish:', error?.message || error);
    }
  }
}
