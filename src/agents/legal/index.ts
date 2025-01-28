import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { LEGAL_CONTRACT_PROMPT } from "../../prompts/legal";
import type { Hex } from "viem";
import { db } from "../../memory/db";

const CONTRACT_STARTING_PROMPT =
  "Generate a legal contract for the specified company based on the provided requirements.";

/**
 * @dev The legal agent is responsible for generating legal contracts for companies.
 */
export class LegalAgent {
  address?: Hex;
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
  async handleContractRequest(data: any): Promise<void> {
    if (data) {
      console.log(
        `[${this.name}] received contract request: ${data.requirements}`
      );
    }

    await this.start(this.address!, data);
  }

  /**
   * @dev Starts the legal agent to generate a contract
   * @param address - The address of the company
   * @param contractData - The data for the contract generation
   */
  async start(address: Hex, contractData?: any): Promise<any> {
    this.address = address;

    const response = await generateText({
      model: openai("gpt-4o-mini"!),
      system: LEGAL_CONTRACT_PROMPT,
      prompt: CONTRACT_STARTING_PROMPT,
      messages: [
        {
          role: "user",
          content: contractData.requirements,
        },
      ],
      maxSteps: 50,
      onStepFinish: this.onStepFinish,
    });

    console.log(`[${this.name}] Contract generated: ${response.text}`);
  }

  /**
   * @param data - The data to handle
   */
  async onStepFinish({ text, toolCalls, toolResults }: any) {
    console.log(
      `[legal] step finished. tools called: ${
        toolCalls.length > 0
          ? toolCalls.map((tool: any) => tool.toolName).join(", ")
          : "none"
      }`
    );
    if (text) {
      await db.saveMemory(text, 'Legal');
    }
  }
}
