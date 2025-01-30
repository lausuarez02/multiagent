import { privateKeyToAccount } from "viem/accounts";
import { registerAgentFactories } from "./agents";
import { EvmWallet } from "./blockchain/evmWallet";

const wallet = new EvmWallet(process.env.PRIVATE_KEY as string);

// Register agent factories

// Example of initializing agents when needed

export { wallet };
