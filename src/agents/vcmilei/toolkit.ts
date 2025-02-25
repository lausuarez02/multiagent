import { tool } from "ai";
import { z } from "zod";
import { NewsAgent } from "../reports/news";
import { SocialAgent } from "../reports/social";
import { wallet } from "../../setup";
// Import other agents as needed

const newsAgent = new NewsAgent("NewsAssistant");
const socialAgent = new SocialAgent("SocialAssistant");

// Mode token address on Mode Testnet
const MODE_TOKEN_ADDRESS = "0x4FFa6cDEB4deF980b75e3F4764797A2CAd1fAEF3";

export const getVCMileiToolkit = () => {
  return {
    getNewsReport: tool({
      description: "Fetches and analyzes news reports for specific assets or topics",
      parameters: z.object({
        asset: z.string().describe("Asset, location, or topic to get news about"),
        timeframe: z.string().optional().describe("Timeframe for news (e.g., '24h', '7d', '30d')"),
        limit: z.union([z.string(), z.number()]).transform(val => Number(val)).optional().describe("Maximum number of news items to return")
      }),
      execute: async ({ asset, timeframe = '7d', limit = 5 }) => {
        console.log(`[getNewsReport] Requesting news report for: ${asset}, timeframe: ${timeframe}`);
        
        try {
          const newsReport = await newsAgent.handleNewsRequest({ 
            asset,
            timeframe,
            limit
          });
          
          // Add JSON parsing with error handling
          let parsedData;
          try {
            parsedData = typeof newsReport.data === 'string' 
              ? JSON.parse(newsReport.data)
              : newsReport.data;
          } catch (parseError) {
            console.log('[getNewsReport] Failed to parse JSON response, using raw data');
            parsedData = newsReport.data;
          }

          return {
            success: true,
            data: parsedData
          };
        } catch (error: any) {
          console.error(`[getNewsReport] Error:`, error.message);
          return {
            success: false,
            error: error.message
          };
        }
      },
    }),
    
    getMarketData: tool({
      description: "Fetches market data and trends for assets or regions",
      parameters: z.object({
        target: z.string().describe("Asset or region to analyze"),
        type: z.enum(['economic', 'social', 'political']).optional(),
      }),
      execute: async ({ target, type }) => {
        // Implement market data fetching logic
        return {
          success: true,
          data: {
            // Add relevant market data structure
          }
        };
      },
    }),

    sendInvestment: tool({
      description: "Sends an investment transaction to a specified address",
      parameters: z.object({
        toAddress: z.string().describe("The recipient's ethereum address"),
        amount: z.number().describe("Amount to send in ETH"),
        reason: z.string().describe("Reason for the investment"),
      }),
      execute: async ({ toAddress, amount, reason }) => {
        console.log(`[sendInvestment] Initiating investment: ${amount} ETH to ${toAddress} for ${reason}`);
        
        try {
          // Convert ETH to Wei (1 ETH = 10^18 Wei)
          const amountInWei = BigInt(amount * 10**18);
          
          // Check wallet balance first
          const balance = await wallet.getBalance();
          if (balance < Number(amountInWei)) {
            throw new Error("Insufficient funds for investment");
          }

          const txHash = await wallet.sendTransaction(toAddress, Number(amountInWei));
          
          return {
            success: true,
            data: {
              transactionHash: txHash,
              amount,
              recipient: toAddress,
              reason,
            }
          };
        } catch (error: any) {
          console.error(`[sendInvestment] Error:`, error.message);
          return {
            success: false,
            error: error.message
          };
        }
      },
    }),

    checkWalletBalance: tool({
      description: "Checks the current wallet balance",
      parameters: z.object({}),
      execute: async () => {
        try {
          const balanceInWei = await wallet.getBalance();
          const balanceInEth = balanceInWei / 10**18;
          
          return {
            success: true,
            data: {
              balanceInEth,
              balanceInWei,
            }
          };
        } catch (error: any) {
          console.error(`[checkWalletBalance] Error:`, error.message);
          return {
            success: false,
            error: error.message
          };
        }
      },
    }),

    swapTokens: tool({
      description: "Swaps between ETH and MODE tokens on Mode Network",
      parameters: z.object({
        fromToken: z.enum(['ETH', 'MODE']).describe("Input token (ETH or MODE)"),
        toToken: z.enum(['ETH', 'MODE']).describe("Output token (ETH or MODE)"),
        amount: z.string().describe("Amount of input token to swap"),
        slippage: z.string().describe("Maximum slippage tolerance in percentage"),
      }),
      execute: async ({ fromToken, toToken, amount, slippage }) => {
        console.log(`[swapTokens] Initiating swap: ${amount} ${fromToken} to ${toToken}`);
        
        try {
          if (fromToken === toToken) {
            throw new Error('Cannot swap same tokens');
          }

          // Convert amount to Wei
          const amountInWei = BigInt(Math.floor(parseFloat(amount) * 10**18));
          const slippagePercent = parseFloat(slippage);

          // Calculate minAmountOut with slippage tolerance
          const minAmountOut = BigInt(Number(amountInWei) * (1 - slippagePercent/100));

          // Get token addresses
          const tokenAddresses = {
            'ETH': 'ETH',
            'MODE': MODE_TOKEN_ADDRESS,
          };

          const tokenInAddress = tokenAddresses[fromToken];
          const tokenOutAddress = tokenAddresses[toToken];

          const txHash = await wallet.swap(
            tokenInAddress,
            tokenOutAddress,
            amountInWei,
            minAmountOut
          );
          
          return {
            success: true,
            data: {
              transactionHash: txHash,
              amountIn: Number(amountInWei) / 10**18,
              tokenIn: fromToken,
              tokenOut: toToken,
              slippageTolerance: slippagePercent,
              expectedMinimumOut: Number(minAmountOut) / 10**18
            }
          };
        } catch (error: any) {
          console.error(`[swapTokens] Error:`, error.message);
          return {
            success: false,
            error: error.message,
            details: {
              fromToken,
              toToken,
              amount,
              slippage
            }
          };
        }
      },
    }),

    getSocialAnalysis: tool({
      description: "Analyzes social media profiles and metrics for specific agents or accounts",
      parameters: z.object({
        username: z.string().describe("Twitter username to analyze"),
        dateRange: z.string().optional().describe("Date range for analysis (e.g., '7d', '30d')")
      }),
      execute: async ({ username, dateRange = '7d' }) => {
        console.log(`[getSocialAnalysis] Analyzing social profile for: ${username}`);
        
        try {
          const socialReport = await socialAgent.handleSocialRequest({
            username,
            dateRange
          });

          return {
            success: true,
            data: socialReport.data
          };
        } catch (error: any) {
          console.error(`[getSocialAnalysis] Error:`, error.message);
          return {
            success: false,
            error: error.message
          };
        }
      },
    }),
  };
}; 