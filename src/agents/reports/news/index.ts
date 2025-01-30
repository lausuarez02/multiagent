import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NEWS_REPORT_PROMPT } from "../../../prompts/newsReport";
import { getNewsToolkit } from "./toolkit";
import { db } from "../../../memory/db";

export class NewsAgent {
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
  async handleNewsRequest(data: any): Promise<any> {
    try {
      // console.log(`[${this.name}] Starting news request with data:`, JSON.stringify(data, null, 2));


      const response = await this.generateNewsReport(data);
      // console.log(`[${this.name}] Raw response from generateNewsReport:`, JSON.stringify(response, null, 2));

      let parsedReport;
      try {
        parsedReport = JSON.parse(response.text);
      } catch (e) {
        console.error(`[${this.name}] Error parsing report JSON:`, e);
        // console.log(`[${this.name}] Raw text that failed to parse:`, response.text);
        parsedReport = response.text;
      }

      const metadata = {
        usage: response.usage || {},
        finishReason: response.finishReason,
        toolResults: response.toolResults || [],
      };

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
      console.error(`[${this.name}] Error handling news request:`, {
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
   * @dev Generates a news report
   * @param newsData - The data for the news report generation
   */
  async generateNewsReport(newsData: any): Promise<any> {
    try {
      // console.log(`[${this.name}] Starting news report generation with data:`, JSON.stringify(newsData, null, 2));
      
      const toolkit = getNewsToolkit();
      // console.log(`[${this.name}] Toolkit initialized`);

      // Create a bound version of onStepFinish that preserves 'this' context
      const boundOnStepFinish = this.onStepFinish.bind(this);

      const response = await generateText({
        model: openai("gpt-4o-mini"),
        system: NEWS_REPORT_PROMPT,
        messages: [
          {
            role: "user",
            content: `Asset: ${newsData.asset}`,
          },
        ],
        tools: toolkit,
        maxSteps: 50,
        onStepFinish: boundOnStepFinish,  // Use the bound version
      });

      // console.log(`[${this.name}] Generation completed with response:`, JSON.stringify(response, null, 2));
      return response;

    } catch (error: any) {
      console.error(`[${this.name}] Error in generateNewsReport:`, {
        message: error.message,
        stack: error.stack,
        error
      });
      throw error;
    }
  }

  /**
   * @param data - The data to handle
   */
  async onStepFinish({ text, toolCalls, toolResults }: any) {
    try {
      console.log(`[${this.name}] Step details:`, {
        hasText: !!text,
        toolCallsCount: toolCalls?.length,
        toolResultsCount: toolResults?.length
      });

      console.log(
        `[${this.name}] Tools called:`,
        toolCalls?.length > 0
          ? toolCalls.map((tool: any) => tool.toolName).join(", ")
          : "none"
      );

      if (text) {
        await db.saveMemory(text, 'Analysis');
      }
    } catch (error: any) {
      console.error(`[${this.name}] Error in onStepFinish:`, {
        message: error.message,
        stack: error.stack,
        error
      });
    }
  }
}
