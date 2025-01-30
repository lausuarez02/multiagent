import { tool } from "ai";
import { z } from "zod";
import { collectNews } from "../../../data/news";

export const getNewsToolkit = () => {
  return {
    fetchLatestNews: tool({
      description: "Fetches the latest news articles",
      parameters: z.object({
        asset: z.string().optional().describe("Currency or company name to fetch news for"),
      }),
      execute: async ({ asset }) => {
        console.log(`[fetchLatestNews] Fetching news for currency: ${asset || 'all'}`);
        
        try {
          const newsData = await collectNews(asset);
          return {
            success: true,
            data: {
              news: newsData.items.map((article:any) => ({
                title: article.title,
                url: article.url,
                source: article.source,
                published_at: article.published_at,
                description: article.description,
                thumbnail: article.thumbnail
              }))
            }
          };
        } catch (error: any) {
          console.error(`[fetchLatestNews] Error:`, error.message);
          return {
            success: false,
            error: error.message
          };
        }
      },
    }),

    analyzeNewsContent: tool({
      description: "Analyzes news content",
      parameters: z.object({
        news: z.array(z.object({
          title: z.string(),
          url: z.string(),
          source: z.string(),
          published_at: z.string(),
          description: z.string().optional(),
          thumbnail: z.string().optional(),
        })).describe("News articles to analyze"),
      }),
      execute: async ({ news }) => {
        console.log(`[analyzeNewsContent] Analyzing ${news.length} articles`);
        return {
          success: true,
          data: {
            total: news.length,
            sources: [...new Set(news.map(article => article.source))],
            latest_date: news[0]?.published_at
          }
        };
      },
    }),
  };
}; 