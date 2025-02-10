import axios from 'axios';
import { NAVISDKClient, USDC, USDT } from 'navi-sdk';
import dotenv from 'dotenv';

dotenv.config();

interface SolscanConfig {
  apiKey: string;
  baseUrl: string;
}

interface ModeConfig {
  baseUrl: string;
}

interface NaviConfig {
  mnemonic: string;
  networkType: 'mainnet' | 'testnet';
  numberOfAccounts: number;
}

interface WalletInfo {
  address: string;
  publicKey: string;
  derivationPath: string;
  balances: any;
  coins: any;
  portfolio?: any;
  healthFactor?: number;
}

interface PoolInfo {
  poolData: any;
  reserves: any;
  apy: any;
  tvl: number;
  volume24h: number;
}

// Provider configurations
const config = {
  mode: {
    baseUrl: 'https://explorer-mode-mainnet-0.t.conduit.xyz/api/v2'
  }
};

export class MarketDataProvider {
  private solscanApi: SolscanAPI;
  private modeApi: ModeAPI;
  private naviClient: NAVISDKClient;
  private suiClient: NAVISDKClient;

  constructor() {
    this.solscanApi = new SolscanAPI();
    this.modeApi = new ModeAPI(config.mode);

    // Initialize NAVI SDK for Sui
    this.suiClient = new NAVISDKClient({
      mnemonic: process.env.SUI_MNEMONIC || "",
      networkType: "mainnet",
      numberOfAccounts: 5
    });
  }

  async getDetailedWalletInfo(network: 'mode' | 'sui'): Promise<WalletInfo> {
    try {
      const client = this.suiClient;
      const account = client.accounts[0];

      const [
        allCoins,
        specificCoins,
        walletBalance,
        portfolio,
        healthFactor
      ] = await Promise.all([
        account.getAllCoins(true),
        account.getCoins(),
        account.getWalletBalance(true),
        account.getNAVIPortfolio(account.address, true),
        account.getHealthFactor(account.address)
      ]);

      return {
        address: account.address,
        publicKey: account.getPublicKey(),
        derivationPath: account.getDerivationPath(),
        balances: {
          all: allCoins,
          specific: specificCoins,
          total: walletBalance
        },
        coins: await this.getDetailedCoinInfo(account),
        portfolio,
        healthFactor
      };
    } catch (error) {
      console.error(`Error fetching detailed wallet info for ${network}:`, error);
      throw error;
    }
  }

  async getDetailedCoinInfo(account: any) {
    try {
      const coins = await account.getAllCoins(true);
      const enrichedCoins = await Promise.all(
        coins.map(async (coin: any) => {
          const specificInfo = await account.getCoins(coin.type);
          return {
            ...coin,
            details: specificInfo
          };
        })
      );
      return enrichedCoins;
    } catch (error) {
      console.error('Error fetching detailed coin info:', error);
      throw error;
    }
  }

  async getPoolsInfo(network: 'mode' | 'sui'): Promise<Record<string, PoolInfo>> {
    try {
      const client = network === 'mode' ? this.naviClient : this.suiClient;
      
      // Get info for major stablecoin pools
      const pools = [USDC, USDT];
      const poolsInfo: Record<string, PoolInfo> = {};

      for (const pool of pools) {
        const [poolData, reserves] = await Promise.all([
          client.getPoolInfo(pool),
          client.getReserves(pool)
        ]);

        poolsInfo[pool] = {
          poolData,
          reserves,
          apy: this.calculatePoolAPY(poolData, reserves),
          tvl: this.calculatePoolTVL(poolData),
          volume24h: this.calculate24hVolume(poolData)
        };
      }

      return poolsInfo;
    } catch (error) {
      console.error(`Error fetching pools info for ${network}:`, error);
      throw error;
    }
  }

  async getRewardsInfo(address: string, network: 'mode' | 'sui') {
    try {
      const client = network === 'mode' ? this.naviClient : this.suiClient;
      
      const [availableRewards, rewardHistory] = await Promise.all([
        client.getAddressAvailableRewards(address, 1),
        client.getUserRewardHistory(address, 1, 400)
      ]);

      return {
        available: availableRewards,
        history: rewardHistory,
        analysis: this.analyzeRewards(rewardHistory)
      };
    } catch (error) {
      console.error(`Error fetching rewards info for ${network}:`, error);
      throw error;
    }
  }

  // Helper methods for calculations
  private calculatePoolAPY(poolData: any, reserves: any): number {
    try {
      // Extract required values from pool data
      const { totalFeesUSD = 0, volumeUSD = 0 } = poolData;
      const { reserve0 = 0, reserve1 = 0 } = reserves;
      
      // Calculate daily fee earnings (0.3% fee)
      const dailyFees = (Number(totalFeesUSD) / 365);
      
      // Calculate total liquidity
      const totalLiquidity = Number(reserve0) + Number(reserve1);
      
      if (totalLiquidity === 0) return 0;
      
      // APY = (Daily Fees * 365 / Total Liquidity) * 100
      const apy = ((dailyFees * 365) / totalLiquidity) * 100;
      
      // Cap APY at 1000% to avoid unrealistic values
      return Math.min(Math.max(apy, 0), 1000);
    } catch (error) {
      console.error('Error calculating APY:', error);
      return 0;
    }
  }

  private calculatePoolTVL(poolData: any): number {
    try {
      const { 
        token0Price = 0, 
        token1Price = 0,
        reserve0 = 0,
        reserve1 = 0 
      } = poolData;

      // Calculate TVL in USD
      const token0TVL = Number(reserve0) * Number(token0Price);
      const token1TVL = Number(reserve1) * Number(token1Price);
      
      const totalTVL = token0TVL + token1TVL;
      
      // Return TVL rounded to 2 decimal places
      return Math.round(totalTVL * 100) / 100;
    } catch (error) {
      console.error('Error calculating TVL:', error);
      return 0;
    }
  }

  private calculate24hVolume(poolData: any): number {
    try {
      const {
        volumeUSD = 0,
        volumeToken0 = 0,
        volumeToken1 = 0,
        token0Price = 0,
        token1Price = 0
      } = poolData;

      // If volumeUSD is available, use it directly
      if (Number(volumeUSD) > 0) {
        return Math.round(Number(volumeUSD) * 100) / 100;
      }

      // Otherwise calculate from token volumes
      const volume0USD = Number(volumeToken0) * Number(token0Price);
      const volume1USD = Number(volumeToken1) * Number(token1Price);
      
      const totalVolume = volume0USD + volume1USD;
      
      return Math.round(totalVolume * 100) / 100;
    } catch (error) {
      console.error('Error calculating 24h volume:', error);
      return 0;
    }
  }

  private analyzeRewards(history: any) {
    try {
      if (!Array.isArray(history) || history.length === 0) {
        return {
          totalClaimed: 0,
          averagePerClaim: 0,
          claimFrequency: '0',
          trend: 'stable'
        };
      }

      // Sort history by timestamp
      const sortedHistory = [...history].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // Calculate total claimed
      const totalClaimed = sortedHistory.reduce((sum, claim) => 
        sum + Number(claim.amount), 0
      );

      // Calculate average per claim
      const averagePerClaim = totalClaimed / sortedHistory.length;

      // Calculate claim frequency (average days between claims)
      const timestamps = sortedHistory.map(h => new Date(h.timestamp).getTime());
      const timeDiffs = timestamps.slice(0, -1).map((time, i) => 
        (time - timestamps[i + 1]) / (1000 * 60 * 60 * 24)
      );
      const avgDaysBetweenClaims = timeDiffs.length > 0 
        ? (timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length).toFixed(1)
        : '0';

      // Analyze trend
      const recentClaims = sortedHistory.slice(0, Math.ceil(sortedHistory.length / 2));
      const olderClaims = sortedHistory.slice(Math.ceil(sortedHistory.length / 2));
      
      const recentAvg = recentClaims.reduce((sum, claim) => 
        sum + Number(claim.amount), 0) / recentClaims.length;
      const olderAvg = olderClaims.reduce((sum, claim) => 
        sum + Number(claim.amount), 0) / olderClaims.length;

      let trend = 'stable';
      if (recentAvg > olderAvg * 1.1) trend = 'increasing';
      if (recentAvg < olderAvg * 0.9) trend = 'decreasing';

      return {
        totalClaimed: Math.round(totalClaimed * 100) / 100,
        averagePerClaim: Math.round(averagePerClaim * 100) / 100,
        claimFrequency: avgDaysBetweenClaims,
        trend
      };
    } catch (error) {
      console.error('Error analyzing rewards:', error);
      return {
        totalClaimed: 0,
        averagePerClaim: 0,
        claimFrequency: '0',
        trend: 'stable'
      };
    }
  }

  async getWalletData(address: string, network: 'mode' | 'sui') {
    try {
      const client = this.suiClient;
      const account = client.accounts[0]; // Using first account

      const balances = await account.getBalances();
      const transactions = await account.getTransactions();
      const tokens = await account.getTokens();

      return {
        network,
        address,
        balances,
        transactions,
        tokens,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error fetching wallet data for ${network}:`, error);
      throw error;
    }
  }

  async getTokenMetrics(tokenAddress: string, network: 'solana' | 'sui') {
    if (network === 'solana') {
      const solscanData = await this.solscanApi.getTokenData(tokenAddress);
      return {
        network,
        ...solscanData
      };
    }else {
      // Sui network handling
      const tokenData = await this.suiClient.accounts[0].getTokenInfo(tokenAddress);
      return {
        network,
        ...tokenData
      };
    }
  }

  async getLiquidityMetrics(tokenAddress: string, network: 'solana' | 'mode') {
    if (network === 'solana') {
      const solscanLiquidity = await this.solscanApi.getLiquidityData(tokenAddress);
      return {
        network,
        ...solscanLiquidity
      };
    } else {
      const [transfers, holders] = await Promise.all([
        this.modeApi.getTokenTransfers(tokenAddress),
        this.modeApi.getTokenHolders(tokenAddress)
      ]);

      return {
        network,
        transfers,
        holders,
      };
    }
  }

  public async getHolderStats(tokenAddress: string, network: 'solana' | 'mode') {
    return network === 'solana'
      ? this.solscanApi.getHolderStats(tokenAddress)
      : this.modeApi.getTokenHolders(tokenAddress);
  }
}

class SolscanAPI {
  private jupiterBaseUrl = 'https://quote-api.jup.ag/v6';
  private heliusBaseUrl = 'https://api.helius.xyz/v0';
  private heliusApiKey = process.env.HELIUS_API_KEY || '';

  constructor() {
    if (!this.heliusApiKey) {
      throw new Error('HELIUS_API_KEY environment variable is not set');
    }
  }

  async getTokenData(tokenAddress: string) {
    try {
      // Get token price from Jupiter using USDC as quote token
      const response = await axios.get(
        `${this.jupiterBaseUrl}/quote?inputMint=${tokenAddress}&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=1000000`
      );
      
      return {
        price: response.data.price,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Jupiter API error:', error);
      return {
        price: 0,
        timestamp: new Date().toISOString()
      };
    }
  }

  async getLiquidityData(tokenAddress: string) {
    try {
      // Using Jupiter's price endpoint as a simpler alternative
      const response = await axios.get(
        `${this.jupiterBaseUrl}/price?ids=${tokenAddress}`
      );
      
      return {
        liquidity: response.data?.[tokenAddress]?.market_cap || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Jupiter API error:', error);
      return {
        liquidity: 0,
        timestamp: new Date().toISOString()
      };
    }
  }

  async getHolderStats(tokenAddress: string) {
    try {
      const response = await axios.get(
        `${this.heliusBaseUrl}/token-metadata?api-key=${this.heliusApiKey}`,
        {
          params: {
            tokenAddresses: [tokenAddress]
          }
        }
      );
      
      if (!response.data || response.data.length === 0) {
        throw new Error('No token metadata found');
      }
      
      return response.data[0];
    } catch (error) {
      console.error('Helius API error:', error);
      // Return a minimal response instead of throwing
      return {
        mint: tokenAddress,
        supply: 0,
        holders: 0,
        timestamp: new Date().toISOString()
      };
    }
  }
}

class ModeAPI {
  constructor(private config: ModeConfig) {}

  async getTokenData(tokenAddress: string) {
    const response = await axios.get(
      `${this.config.baseUrl}/tokens/${tokenAddress}`
    );
    return response.data;
  }

  async getTokenCounters(tokenAddress: string) {
    const response = await axios.get(
      `${this.config.baseUrl}/tokens/${tokenAddress}/counters`
    );
    return response.data;
  }

  async getTokenTransfers(tokenAddress: string, params?: { page?: number; limit?: number }) {
    const response = await axios.get(
      `${this.config.baseUrl}/tokens/${tokenAddress}/transfers`,
      { params }
    );
    return response.data;
  }

  async getTokenHolders(tokenAddress: string, params?: { page?: number; limit?: number }) {
    const response = await axios.get(
      `${this.config.baseUrl}/tokens/${tokenAddress}/holders`,
      { params }
    );
    return response.data;
  }

  async getMarketStats() {
    const response = await axios.get(
      `${this.config.baseUrl}/stats/charts/market`
    );
    return response.data;
  }

  async getAddressTokenBalances(address: string) {
    const response = await axios.get(
      `${this.config.baseUrl}/addresses/${address}/token-balances`
    );
    return response.data;
  }

  async getSmartContractInfo(address: string) {
    const response = await axios.get(
      `${this.config.baseUrl}/smart-contracts/${address}`
    );
    return response.data;
  }
} 