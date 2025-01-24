import { describe, it, expect, beforeEach } from 'vitest';
import { MarketDataProvider } from '../providers';
import { collectMarketData } from '../index';

describe('Market Data Collection', () => {
  let marketDataProvider: MarketDataProvider;

  beforeEach(() => {
    marketDataProvider = new MarketDataProvider();
  });

  describe('Solana Token Tests', () => {
    const SOLANA_TEST_TOKEN = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC on Solana

    it('should fetch complete token metrics', async () => {
      const metrics = await marketDataProvider.getTokenMetrics(SOLANA_TEST_TOKEN, 'solana');
      
      expect(metrics).toBeDefined();
      expect(metrics.network).toBe('solana');
      console.log('Solana Token Metrics:', JSON.stringify(metrics, null, 2));
    });

    it('should fetch liquidity metrics', async () => {
      const liquidity = await marketDataProvider.getLiquidityMetrics(SOLANA_TEST_TOKEN, 'solana');
      
      expect(liquidity).toBeDefined();
      expect(liquidity.network).toBe('solana');
      console.log('Solana Liquidity Metrics:', JSON.stringify(liquidity, null, 2));
    }, 10000);

    it('should fetch holder statistics', async () => {
      const holders = await marketDataProvider.getHolderStats(SOLANA_TEST_TOKEN, 'solana');
      
      expect(holders).toBeDefined();
      console.log('Solana Holder Stats:', JSON.stringify(holders, null, 2));
    });

    it('should collect complete market data', async () => {
      const marketData = await collectMarketData(SOLANA_TEST_TOKEN, 'solana');
      
      expect(marketData).toBeDefined();
      expect(marketData.token_address).toBe(SOLANA_TEST_TOKEN);
      expect(marketData.network).toBe('solana');
      expect(marketData.metrics).toBeDefined();
      expect(marketData.analysis).toBeDefined();
      
      console.log('Complete Solana Market Data:', JSON.stringify(marketData, null, 2));
    });
  });

  describe('Mode Token Tests', () => {
    // Using USDC on Mode as test token
    const MODE_TEST_TOKEN = '0xd988097fb8612cc24eeC14542bC03424c656005f';

    it('should fetch complete token metrics', async () => {
      const metrics = await marketDataProvider.getTokenMetrics(MODE_TEST_TOKEN, 'mode');
      
      expect(metrics).toBeDefined();
      expect(metrics.network).toBe('mode');
      
      // Log the response for debugging
      console.log('Mode Token Metrics:', JSON.stringify(metrics, null, 2));
      
      // Add specific expectations based on the actual response structure
      expect(metrics.counters).toBeDefined();
      expect(metrics.market).toBeDefined();
    }, 10000); // Increased timeout for API calls

    it('should fetch liquidity metrics', async () => {
      const liquidity = await marketDataProvider.getLiquidityMetrics(MODE_TEST_TOKEN, 'mode');
      
      expect(liquidity).toBeDefined();
      expect(liquidity.network).toBe('mode');
      
      // Log the response for debugging
      console.log('Mode Liquidity Metrics:', JSON.stringify(liquidity, null, 2));
      
      // Add specific expectations
      expect(liquidity.transfers).toBeDefined();
      expect(liquidity.holders).toBeDefined();
    }, 10000);

    it('should fetch holder statistics', async () => {
      const holders = await marketDataProvider.getHolderStats(MODE_TEST_TOKEN, 'mode');
      
      expect(holders).toBeDefined();
      
      // Log the response for debugging
      console.log('Mode Holder Stats:', JSON.stringify(holders, null, 2));
      
      // Add specific expectations
      expect(Array.isArray(holders.items)).toBe(true);
    }, 10000);

    it('should collect complete market data', async () => {
      const marketData = await collectMarketData(MODE_TEST_TOKEN, 'mode');
      
      expect(marketData).toBeDefined();
      expect(marketData.token_address).toBe(MODE_TEST_TOKEN);
      expect(marketData.network).toBe('mode');
      expect(marketData.metrics).toBeDefined();
      expect(marketData.analysis).toBeDefined();
      
      // Log the response for debugging
      console.log('Complete Mode Market Data:', JSON.stringify(marketData, null, 2));
    }, 10000);
  });

  describe('Error Handling', () => {
    it('should handle invalid token addresses', async () => {
      await expect(collectMarketData('0xinvalid', 'mode'))
        .rejects
        .toThrow();
    });

    it('should handle API failures gracefully', async () => {
      const brokenProvider = new MarketDataProvider();
      // @ts-ignore - accessing private property for testing
      brokenProvider.modeApi.config.baseUrl = 'https://invalid-url';
      
      await expect(brokenProvider.getTokenMetrics('any-token', 'mode'))
        .rejects
        .toThrow();
    });
  });
});