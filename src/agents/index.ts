import type { Account } from "viem";
import { MarketAgent } from "./reports/market";
import { NewsAgent } from "./reports/news";
import { SocialAgent } from "./reports/social";
import figlet from "figlet";

/**
 * Registers the agents and returns factory functions to initialize them on demand
 * @returns The agent factories
 */
export const registerAgentFactories = () => {
  console.log(figlet.textSync("VCMILEI"));
  console.log("======== Preparing agent factories =========");

  // Factory functions to initialize agents on demand
  const createMarketAgent = () => {
    console.log(`[registerAgentFactories] initializing market agent...`);
    const agent = new MarketAgent("MarketLady");
    console.log(`[registerAgentFactories] MarketLady agent initialized.`);
    return agent;
  };

  const createNewsAgent = () => {
    console.log(`[registerAgentFactories] initializing news agent...`);
    const agent = new NewsAgent("NewsAgent");
    console.log(`[registerAgentFactories] NewsAgent initialized.`);
    return agent;
  };

  const createSocialAgent = () => {
    console.log(`[registerAgentFactories] initializing social agent...`);
    const agent = new SocialAgent("SocialAgent");
    console.log(`[registerAgentFactories] SocialAgent initialized.`);
    return agent;
  };

  console.log(`[registerAgentFactories] all agent factories prepared.`);

  return {
    createMarketAgent,
    createNewsAgent,
    createSocialAgent,
  };
};