import { AtomaSDK } from "atoma-sdk";
import { NEWS_REPORT_PROMPT } from "../../../prompts/newsReport";
import { getNewsToolkit } from "./toolkit";
import { db } from "../../../memory/db";

const atomaSDK = new AtomaSDK({
  bearerAuth: process.env["ATOMASDK_BEARER_AUTH"] ?? "",
});

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
      const toolkit = getNewsToolkit();
      const boundOnStepFinish = this.onStepFinish.bind(this);

      const completion = await atomaSDK.chat.create({
        messages: [
          { role: "system", content: NEWS_REPORT_PROMPT },
          {
            role: "user",
            content: `Asset: ${newsData.asset}`
          }
        ],
        model: "meta-llama/Llama-3.3-70B-Instruct"
      });

      return {
        text: completion.choices[0].message.content,
        usage: completion.usage,
        finishReason: completion.choices[0].finishReason
      };

    } catch (error: any) {
      console.error(`[${this.name}] Error in generateNewsReport:`, error);
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
