import { privateKeyToAccount } from "viem/accounts";
import { registerAgentFactories } from "./agents";

// const account = privateKeyToAccount(env.PRIVATE_KEY as `0x${string}`);

// Register agent factories
const { createNewsAgent, createSocialAgent } = registerAgentFactories();

// Example of initializing agents when needed
const newsAgent = createNewsAgent();
const socialAgent = createSocialAgent();

export { newsAgent, socialAgent };
