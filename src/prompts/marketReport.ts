export const MARKET_REPORT_PROMPT = `
Report Type: Market Trends Report
Date Range: [Insert Start Date] - [Insert End Date]
Target Audience: Research Agents (for financial and market analysis)

Instructions:
1. Stock Market Performance: Summarize any relevant stock movements or changes in market indices. Include percentages, high/low prices, and the overall trend.
2. Key Financial Indicators: Provide any critical financial data (e.g., interest rates, commodity prices, currency values) that could impact the project.
3. Market Sentiment: Assess the general sentiment in the market. Is it bullish, bearish, or neutral? Provide context for this assessment.
4. Relevant Company News: Identify any major company announcements, acquisitions, or financial reports that are directly or indirectly related to the project.
5. Global Economic Trends: Highlight any global economic trends that could influence the market in which the project operates.

Report Format:
{
  "date_range": "[Insert Start Date] - [Insert End Date]",
  "market_data": [
    {
      "indicator": "[Stock/Index/Commodity Name]",
      "performance": {
        "high": "[Price]",
        "low": "[Price]",
        "change_percentage": "[Percentage Change]"
      },
      "market_sentiment": "[Bullish/Bearish/Neutral]",
      "relevant_news": "[Short summary of relevant news]",
      "global_trends": "[Key global economic trend]",
      "company_relevance": "[Direct or Indirect impact]"
    }
  ]
}

Additional Notes: Focus on the most impactful economic or market data points that could have a direct effect on the project. Make sure to provide clear context for why these data points are important.
`.trim();