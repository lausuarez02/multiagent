import { EvmWallet } from './evmWallet';
import { SolanaWallet } from './solanaWallet';
import { SuiWallet } from './suiWallet';
import type { BlockchainWallet } from './wallet';

export type WalletType = 'evm' | 'solana' | 'sui';

export function createWallet(type: WalletType, privateKey: string): BlockchainWallet {
  switch (type) {
    case 'evm':
      return new EvmWallet(privateKey);
    case 'solana':
      return new SolanaWallet(privateKey);
    case 'sui':
      return new SuiWallet(privateKey);
    default:
      throw new Error(`Unsupported wallet type: ${type}`);
  }
}

export { EvmWallet, SolanaWallet, SuiWallet };
