import axios from 'axios';

interface SolscanConfig {
  apiKey: string;
  baseUrl: string;
}

interface ModeConfig {
  baseUrl: string;
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

  constructor() {
    this.solscanApi = new SolscanAPI();
    this.modeApi = new ModeAPI(config.mode);
  }

  async getTokenMetrics(tokenAddress: string, network: 'solana' | 'mode') {
    if (network === 'solana') {
      const solscanData = await this.solscanApi.getTokenData(tokenAddress);
      return {
        network,
        ...solscanData
      };
    } else {
      const [tokenInfo, tokenCounters, marketStats] = await Promise.all([
        this.modeApi.getTokenData(tokenAddress),
        this.modeApi.getTokenCounters(tokenAddress),
        this.modeApi.getMarketStats()
      ]);

      return {
        network,
        ...tokenInfo,
        counters: tokenCounters,
        market: marketStats
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