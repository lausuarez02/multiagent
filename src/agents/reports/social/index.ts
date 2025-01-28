import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { SOCIAL_REPORT_PROMPT } from "../../../prompts/socialReport";
import { getSocialToolkit } from "./toolkit";
import { db } from "../../../memory/db";

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

      console.log(
        `[${this.name}] received social report request:`, data.dateRange
      );

      const response = await this.generateSocialReport(data);
      
      // Check if we have a valid response with text
      // if (!response?.text) {
      //   return {
      //     success: false,
      //     error: 'No report text generated',
      //     timestamp: new Date().toISOString()
      //   };
      // }

      console.log(`[${response.text}] Social report generated successfully`);
      
      // Parse the JSON text
      let parsedReport;
      try {
        parsedReport = JSON.parse(response.text);
      } catch (e) {
        console.error(`[${this.name}] Error parsing report JSON:`, e);
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

      // Save the final response text
      // await db.saveMemory(response.text, 'Analysis');

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
