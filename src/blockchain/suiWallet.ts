import { Ed25519Keypair, JsonRpcProvider, RawSigner, Connection } from '@mysten/sui.js';
import type { BlockchainWallet } from './wallet';

export class SuiWallet implements BlockchainWallet {
  private provider: JsonRpcProvider;
  private signer: RawSigner;
  private keypair: Ed25519Keypair;

  constructor(privateKey: string) {
    // Initialize Sui provider with mainnet or testnet
    const connection = new Connection({
      fullnode: process.env.SUI_RPC_URL || 'https://fullnode.mainnet.sui.io',
    });
    this.provider = new JsonRpcProvider(connection);

    // Create keypair from private key
    this.keypair = Ed25519Keypair.fromSecretKey(
      Buffer.from(privateKey.replace('0x', ''), 'hex')
    );

    // Initialize signer
    this.signer = new RawSigner(this.keypair, this.provider);
  }

  async getBalance(): Promise<number> {
    try {
      const address = this.keypair.getPublicKey().toSuiAddress();
      const balance = await this.provider.getBalance({
        owner: address,
        coinType: '0x2::sui::SUI'
      });
      
      return Number(balance.totalBalance);
    } catch (error) {
      console.error('Error getting Sui balance:', error);
      throw error;
    }
  }

  async sendTransaction(to: string, amount: number): Promise<string> {
    try {
      const tx = await this.signer.transferObject({
        recipient: to,
        objectId: '0x2::sui::SUI',
        amount: BigInt(amount),
        gasBudget: 2000000
      });

      return tx.digest;
    } catch (error) {
      console.error('Error sending Sui transaction:', error);
      throw error;
    }
  }

  async bridgeAssets(toNetwork: string, amount: number): Promise<string> {
    try {
      // Example implementation for Sui bridge (using Wormhole or similar)
      const bridgeContractId = process.env.SUI_BRIDGE_CONTRACT;
      if (!bridgeContractId) {
        throw new Error('Bridge contract not configured');
      }

      const tx = await this.signer.executeMoveCall({
        packageObjectId: bridgeContractId,
        module: 'bridge',
        function: 'bridge_tokens',
        typeArguments: ['0x2::sui::SUI'],
        arguments: [amount.toString(), toNetwork],
        gasBudget: 2000000
      });

      return tx.digest;
    } catch (error) {
      console.error('Error bridging Sui assets:', error);
      throw error;
    }
  }

  async swap(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    minAmountOut: bigint
  ): Promise<string> {
    try {
      // Example implementation for DEX swap on Sui
      const dexContractId = process.env.SUI_DEX_CONTRACT;
      if (!dexContractId) {
        throw new Error('DEX contract not configured');
      }

      const tx = await this.signer.executeMoveCall({
        packageObjectId: dexContractId,
        module: 'dex',
        function: 'swap_exact_input',
        typeArguments: [tokenIn, tokenOut],
        arguments: [
          amountIn.toString(),
          minAmountOut.toString()
        ],
        gasBudget: 2000000
      });

      return tx.digest;
    } catch (error) {
      console.error('Error performing Sui swap:', error);
      throw error;
    }
  }

  // Helper methods
  async getTokenBalance(tokenType: string): Promise<number> {
    try {
      const address = this.keypair.getPublicKey().toSuiAddress();
      const balance = await this.provider.getBalance({
        owner: address,
        coinType: tokenType
      });
      
      return Number(balance.totalBalance);
    } catch (error) {
      console.error('Error getting token balance:', error);
      throw error;
    }
  }

  async getTransactionStatus(txId: string): Promise<'success' | 'failure' | 'pending'> {
    try {
      const txInfo = await this.provider.getTransactionBlock({
        digest: txId,
        options: {
          showEffects: true
        }
      });

      if (!txInfo) return 'pending';
      return txInfo.effects?.status?.status === 'success' ? 'success' : 'failure';
    } catch (error) {
      console.error('Error getting transaction status:', error);
      throw error;
    }
  }
}
