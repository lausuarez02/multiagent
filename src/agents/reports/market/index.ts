import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { MARKET_REPORT_PROMPT } from "../../../prompts/marketReport";
import { getMarketToolkit } from "./toolkit";
import { db } from "../../../memory/db";

export class MarketAgent {
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
  async handleMarketRequest(data: any): Promise<void> {
    if (data) {
      console.log(
        `[${this.name}] received market report request: ${data.dateRange}`
      );
    }

    const response = await this.generateMarketReport(data);

    console.log(`[${this.name}] Market report generated: ${response.text}`);

    await db.saveMemory(response.text, 'Analysis');
  }

  /**
   * @dev Generates a market report
   * @param marketData - The data for the market report generation
   */
  async generateMarketReport(marketData: any): Promise<any> {
    const toolkit = getMarketToolkit();

    const response = await generateText({
      model: openai("gpt-4o-mini"!),
      system: MARKET_REPORT_PROMPT,
      messages: [
        {
          role: "user",
          content: `Date Range: ${marketData.dateRange}`,
        },
      ],
      tools: toolkit,
      maxSteps: 50,
      onStepFinish: this.onStepFinish,
    });

    return response;
  }

  /**
   * @param data - The data to handle
   */
  async onStepFinish({ text, toolCalls, toolResults }: any) {
    console.log(
      `[market] step finished. tools called: ${
        toolCalls.length > 0
          ? toolCalls.map((tool: any) => tool.toolName).join(", ")
          : "none"
      }`
    );
    if (text) {
      await db.saveMemory(text, 'Analysis');
    }
  }
}
