import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { SOCIAL_REPORT_PROMPT } from "../../../prompts/socialReport";
import { getSocialToolkit } from "./toolkit";
import { db } from "../../../memory/db";

interface SocialReport {
  profile: any;
  engagement: any;
  risk_assessment: any;
  analysis: any;
  dateRange: any;
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

      console.log(`[${this.name}] received social report request:`, data.dateRange);
      const response = await this.generateSocialReport(data);
      
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
          dateRange: rawReport.date_range
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

      const response = await generateText({
        model: openai("gpt-4o-mini", { parallelToolCalls: false }),
        system: SOCIAL_REPORT_PROMPT,
        messages: [
          {
            role: "user",
            content: `Generate a social media analysis report for user ${socialData.username} during ${socialData.dateRange || '30d'}. Include engagement metrics and trends.`,
          },
        ],
        tools: toolkit,
        maxSteps: 50,
        maxRetries: 10,
        experimental_continueSteps: true,
        onStepFinish: this.onStepFinish.bind(this),
      });

      if (!response?.text) {
        throw new Error('No response text from AI model');
      }

      console.log('check otu all the response', response);

      return response;
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
