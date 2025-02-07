import { privateKeyToAccount } from "viem/accounts";
import { EvmWallet } from "./blockchain/evmWallet";

const wallet = new EvmWallet(process.env.PRIVATE_KEY as string);

export { wallet };
