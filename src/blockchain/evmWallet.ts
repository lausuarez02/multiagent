import type { BlockchainWallet } from './wallet';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { modeTestnet } from 'viem/chains';
import { encodeFunctionData, parseAbi } from 'viem';

export class EvmWallet implements BlockchainWallet {
  private walletClient;
  private publicClient;
  private account;

  // Mode Testnet Uniswap V2 Router address
  private DEX_ROUTER = "0x5951479fE3235b689E392E9BC6E968CE10637A52" as `0x${string}`;
  
  // Standard Uniswap V2 Router ABI functions
  private ROUTER_ABI = parseAbi([
    'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
    'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
    'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
    'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
    'function factory() external view returns (address)'
  ]);

  // Mode Testnet token addresses
  private MODE_TOKEN = "0xbf6c50889d3a620eb42C0F188b65aDe90De958c4" as `0x${string}`;
  private WETH_ADDRESS = "0x4200000000000000000000000000000000000006" as `0x${string}`;
  
  constructor(privateKey: string) {
    this.account = privateKeyToAccount(privateKey as `0x${string}`);
    this.publicClient = createPublicClient({
      chain: modeTestnet,
      transport: http()
    });
    this.walletClient = createWalletClient({
      chain: modeTestnet,
      transport: http(),
      account: this.account
    });
  }

  async getBalance(): Promise<number> {
    const balance = await this.publicClient.getBalance({
      address: this.account.address,
    });
    return Number(balance);
  }

  async sendTransaction(to: string, amount: number): Promise<string> {
    const hash = await this.walletClient.sendTransaction({
      to: to as `0x${string}`,
      value: BigInt(amount),
    });
    return hash;
  }

  async bridgeAssets(toNetwork: string, amount: number): Promise<string> {
    // Implement EVM-specific asset bridging
    return 'evm-bridge-id'; // Placeholder
  }

  async swap(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    minAmountOut: bigint
  ): Promise<any> {
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);
    
    // Debug current setup
    console.log('DEX Router:', this.DEX_ROUTER);
    console.log('WETH Address:', this.WETH_ADDRESS);
    console.log('MODE Token:', this.MODE_TOKEN);
    
    let path: `0x${string}`[];
    if (tokenIn === 'ETH') {
      path = [this.WETH_ADDRESS, this.MODE_TOKEN];
    } else if (tokenOut === 'ETH') {
      path = [this.MODE_TOKEN, this.WETH_ADDRESS];
    } else {
      throw new Error('Invalid token pair');
    }

    // Try to check if the pool exists first
    try {
      const factoryAddress = await this.publicClient.readContract({
        address: this.DEX_ROUTER,
        abi: this.ROUTER_ABI,
        functionName: 'factory',
      });
      
      console.log('Factory address:', factoryAddress);
      
      // Check if pool exists
      const pairAddress = await this.publicClient.readContract({
        address: factoryAddress,
        abi: [
          {
            name: 'getPair',
            type: 'function',
            stateMutability: 'view',
            inputs: [
              { name: 'tokenA', type: 'address' },
              { name: 'tokenB', type: 'address' }
            ],
            outputs: [{ name: '', type: 'address' }]
          }
        ],
        functionName: 'getPair',
        args: [path[0], path[1]]
      });

      console.log('Pair address:', pairAddress);
      
      if (pairAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('No liquidity pool exists for this pair');
      }

      // If pool exists, try to get amounts
      const amounts = await this.publicClient.readContract({
        address: this.DEX_ROUTER,
        abi: this.ROUTER_ABI,
        functionName: 'getAmountsOut',
        args: [amountIn, path]
      });
      
      console.log('Expected output amount:', amounts[1].toString());
      
      // Continue with swap...
      // ... rest of the function
    } catch (error: any) {
      console.error('Swap preparation failed:', error);
      if (error.message.includes('No liquidity pool exists')) {
        throw new Error('No liquidity pool exists for ETH/MODE pair. You might need to add liquidity first.');
      }
      throw error;
    }
  }

  // Helper function to approve tokens
  private async approveToken(
    tokenAddress: `0x${string}`,
    spenderAddress: `0x${string}`,
    amount: bigint
  ): Promise<string> {
    const erc20Abi = parseAbi([
      'function approve(address spender, uint256 amount) external returns (bool)'
    ]);

    const txHash = await this.walletClient.sendTransaction({
      to: tokenAddress,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [spenderAddress, amount]
      })
    });

    return txHash;
  }
} 