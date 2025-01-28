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
  async handleNewsRequest(data: any): Promise<void> {
    try {
      if (data) {
        console.log(
          `[${this.name}] received news report request: ${data.dateRange}`
      );
    }

    const response = await this.generateNewsReport(data);

    console.log(`[${this.name}] News report generated: ${response.text}`);

    await db.saveMemory(response.text, 'Analysis');
  } catch (error:any) {
    console.error(`[${this.name}] Error handling news request:`, error);
    throw error; // Re-throw if you want to handle it at a higher level
  }
}

  /**
   * @dev Generates a news report
   * @param newsData - The data for the news report generation
   */
  async generateNewsReport(newsData: any): Promise<any> {
    try {
      const toolkit = getNewsToolkit();

    const response = await generateText({
      model: openai("gpt-4o-mini"!),
      system: NEWS_REPORT_PROMPT,
      messages: [
        {
          role: "user",
          content: `Date Range: ${newsData.dateRange}`,
        },
      ],
      tools: toolkit,
      maxSteps: 50,
      onStepFinish: this.onStepFinish,
    });

    return response;
  }catch (error:any) {
    console.error(`[${this.name}] Error generating news report:`, error);
    throw error;
  }
}

  /**
   * @param data - The data to handle
   */
  async onStepFinish({ text, toolCalls, toolResults }: any) {
    console.log(
      `[news] step finished. tools called: ${
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
