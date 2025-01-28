import { tool } from "ai";
import { z } from "zod";
import { collectSocialMetrics } from "../../../data/social";

export const getSocialToolkit = () => {
  return {
    fetchSocialTrends: tool({
      description: "Fetches social media metrics and trends for a specific user",
      parameters: z.object({
        username: z.string().describe("Twitter username to fetch metrics for"),
        platform: z.enum(["twitter"]).describe("Social media platform (only twitter supported)"),
        dateRange: z.string().describe("Date range for the trends"),
      }),
      execute: async ({ username, platform, dateRange }) => {
        console.log(`[fetchSocialTrends] Fetching ${platform} metrics for user: ${username}`);
        
        try {
          const metrics = await collectSocialMetrics(username);
          return {
            success: true,
            data: {
              profile: metrics
            }
          };
        } catch (error: any) {
          console.error(`[fetchSocialTrends] Error:`, error.message);
          return {
            success: false,
            error: error.message
          };
        }
      },
    }),

    analyzeSocialMetrics: tool({
      description: "Analyzes social media metrics and provides insights",
      parameters: z.object({
        metrics: z.object({
          username: z.string(),
          displayName: z.string(),
          followers: z.number(),
          following: z.number(),
          tweets: z.number(),
          description: z.string(),
          joinDate: z.string(),
          location: z.string(),
          website: z.string().optional(),
          verified: z.boolean(),
          profileImage: z.string().optional(),
        }).describe("Social metrics to analyze"),
      }),
      execute: async ({ metrics }) => {
        console.log(`[analyzeSocialMetrics] Analyzing metrics for ${metrics.username}`);
        return {
          success: true,
          data: metrics
        };
      },
    }),
  };
}; 