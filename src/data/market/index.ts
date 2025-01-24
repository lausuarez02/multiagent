import { MarketDataProvider } from './providers';

interface TokenMetrics {
  // Price metrics
  current_price: number;
  price_change_24h: number;
  price_change_7d: number;
  price_change_30d: number;
  ath: number;
  ath_date: string;
  atl: number;
  atl_date: string;
  
  // Volume metrics
  total_volume_24h: number;
  volume_change_24h: number;
  
  // Market metrics
  market_cap: number;
  fully_diluted_valuation: number;
  market_cap_rank: number;
  
  // Supply metrics
  circulating_supply: number;
  total_supply: number;
  max_supply: number | null;
}

const marketDataProvider = new MarketDataProvider();

export async function collectMarketData(
  tokenAddress: string,
  network: 'solana' | 'mode'
) {
  try {
    // Collect all metrics in parallel
    const [tokenMetrics, liquidityMetrics, holderMetrics] = await Promise.all([
      marketDataProvider.getTokenMetrics(tokenAddress, network),
      marketDataProvider.getLiquidityMetrics(tokenAddress, network),
      marketDataProvider.getHolderStats(tokenAddress, network)
    ]);

    // Calculate risk metrics based on collected data
    const riskMetrics = calculateRiskMetrics({
      tokenMetrics,
      liquidityMetrics,
      holderMetrics,
    });

    return {
      token_address: tokenAddress,
      network,
      timestamp: new Date().toISOString(),
      metrics: {
        token: tokenMetrics,
        liquidity: liquidityMetrics,
        holders: holderMetrics,
      },
      analysis: {
        liquidity_score: calculateLiquidityScore(liquidityMetrics),
        centralization_risk: calculateCentralizationRisk(holderMetrics),
        overall_risk_score: calculateOverallRisk(riskMetrics),
      }
    };
  } catch (error) {
    console.error('Error collecting market data:', error);
    throw error;
  }
}

function calculateRiskMetrics(data: {
  tokenMetrics: any;
  liquidityMetrics: any;
  holderMetrics: any;
}) {
  return {
    volatility_risk: calculateVolatilityRisk(data.tokenMetrics),
    liquidity_risk: calculateLiquidityRisk(data.liquidityMetrics),
    concentration_risk: calculateConcentrationRisk(data.holderMetrics),
    market_cap_risk: calculateMarketCapRisk(data.tokenMetrics),
    volume_stability: calculateVolumeStability(data.tokenMetrics),
  };
}

// Risk calculation functions
function calculateVolatilityRisk(metrics: any): number {
  // Calculate volatility risk based on price changes
  const priceChanges = [
    Math.abs(metrics.price_change_24h || 0),
    Math.abs(metrics.price_change_7d || 0),
    Math.abs(metrics.price_change_30d || 0)
  ];
  
  const avgVolatility = priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length;
  return Math.min(avgVolatility / 10, 1); // Normalize to 0-1
}

function calculateLiquidityRisk(metrics: any): number {
  // Calculate liquidity risk based on total liquidity and distribution
  const totalLiquidity = metrics.total_liquidity || 0;
  const riskScore = Math.max(1 - (totalLiquidity / 1000000), 0); // Example threshold
  return riskScore;
}

function calculateConcentrationRisk(metrics: any): number {
  // Calculate concentration risk based on holder distribution
  const whalePercentage = metrics.holder_distribution?.whale_percentage || 0;
  return Math.min(whalePercentage / 100, 1);
}

function calculateMarketCapRisk(metrics: any): number {
  // Calculate market cap risk
  const marketCap = metrics.market_cap || 0;
  return Math.max(1 - (marketCap / 10000000), 0); // Example threshold
}

function calculateVolumeStability(metrics: any): number {
  // Calculate volume stability
  const volumeChange = Math.abs(metrics.volume_change_24h || 0);
  return Math.min(volumeChange / 100, 1);
}

// Scoring helper functions
function calculateLiquidityScore(metrics: any): number {
  const totalLiquidity = metrics.total_liquidity || 0;
  const volumeRatio = (metrics.total_volume_24h || 0) / totalLiquidity;
  return Math.min((totalLiquidity / 1000000) * (1 - volumeRatio), 1);
}

function calculateCentralizationRisk(metrics: any): number {
  const topHoldersPercentage = 
    (metrics.holder_distribution?.whale_percentage || 0) +
    (metrics.holder_distribution?.large_holders_percentage || 0);
  return Math.min(topHoldersPercentage / 100, 1);
}

function calculateOverallRisk(riskMetrics: any): number {
  const weights = {
    volatility: 0.2,
    liquidity: 0.3,
    concentration: 0.2,
    marketCap: 0.2,
    volume: 0.1
  };

  return (
    riskMetrics.volatility_risk * weights.volatility +
    riskMetrics.liquidity_risk * weights.liquidity +
    riskMetrics.concentration_risk * weights.concentration +
    riskMetrics.market_cap_risk * weights.marketCap +
    riskMetrics.volume_stability * weights.volume
  );
}
