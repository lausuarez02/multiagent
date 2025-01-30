export const NEWS_REPORT_PROMPT = `
Report Type: News Analysis Report
Date Range: [Insert Date Range]

Instructions:
1. Article Summary: Provide a concise summary of each article that includes key facts, figures, quotes, and major developments.

2. Source Analysis: Include the URL and assess the credibility of each source.

3. Impact Assessment:
   - Market Impact
   - Community Impact
   - Regulatory Implications
   - Freedom/Decentralization Impact

4. Sentiment Analysis:
   - Overall tone (Positive/Negative/Neutral)
   - Market sentiment
   - Community reaction
   - Freedom implications

Report Format:
{
  "articles": [
    {
      "headline": "[Article Title]",
      "summary": "[Brief summary of the article]",
      "source": {
        "url": "[URL]",
        "credibility_assessment": "[Brief assessment of source credibility]"
      },
      "sentiment": {
        "tone": "[Positive/Negative/Neutral]",
        "market_sentiment": "[Bullish/Bearish/Neutral]",
        "community_sentiment": "[Description of community reaction]"
      },
      "impact_analysis": {
        "market_impact": "[Description of potential market effects]",
        "regulatory_impact": "[Any regulatory implications]",
        "freedom_impact": {
          "score": number,  // 1-10 scale where 10 is most positive for freedom
          "assessment": "[How this affects freedom/decentralization]",
          "concerns": ["[List of concerns if any]"],
          "positives": ["[List of positive aspects]"]
        }
      }
    }
  ],
  "overall_analysis": {
    "key_takeaways": ["[List of main points]"],
    "freedom_implications": "[Overall assessment of freedom/decentralization impact]",
    "market_direction": "[Overall market sentiment]",
    "risk_assessment": "[Any risks to freedom/decentralization]"
  }
}

Additional Notes:
- Focus on implications for individual freedom and decentralization
- Assess potential regulatory impacts
- Consider long-term implications for the crypto ecosystem
- Highlight any threats to privacy or autonomy
- Identify opportunities for increasing freedom/decentralization
`.trim();