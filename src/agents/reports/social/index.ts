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
  async handleSocialRequest(data: any): Promise<void> {
    if (data) {
      console.log(
        `[${this.name}] received social report request: ${data.dateRange}`
      );
    }

    const response = await this.generateSocialReport(data);

    console.log(`[${this.name}] Social report generated: ${response.text}`);

    await db.saveMemory(response.text, 'Analysis');
  }

  /**
   * @dev Generates a social report
   * @param socialData - The data for the social report generation
   */
  async generateSocialReport(socialData: any): Promise<any> {
    const toolkit = getSocialToolkit();

    const response = await generateText({
      model: openai(process.env.OPENAI_API_KEY!),
      system: SOCIAL_REPORT_PROMPT,
      messages: [
        {
          role: "user",
          content: `Date Range: ${socialData.dateRange}`,
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
      `[social] step finished. tools called: ${
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
