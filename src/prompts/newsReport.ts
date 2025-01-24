export const NEWS_REPORT_PROMPT = `
Report Type: News Summary Report
Date Range: [Insert Start Date] - [Insert End Date]
Target Audience: Research Agents (for analysis of trends, sentiment, and relevancy to the project's goals)

Instructions:
1. Article Summary: Provide a concise summary of each article that includes key facts, figures, quotes, and any major developments relevant to the project.
2. Source Link: Include the URL of each source for easy verification.
3. Tone & Sentiment: Evaluate whether the tone of the article is positive, negative, or neutral regarding the project's focus. Provide a short explanation of your assessment.
4. Impact: Briefly discuss any potential implications of the news for the project. Is it supportive or harmful to the project's objectives?
5. Keywords: Extract and list key terms that are mentioned frequently in the article. These will be used for trend analysis.
6. Regional Relevance: Indicate if the news is region-specific or has global importance.

Report Format:
{
  "date_range": "[Insert Start Date] - [Insert End Date]",
  "articles": [
    {
      "headline": "[Article Title]",
      "summary": "[Brief summary of the article]",
      "source_link": "[URL]",
      "sentiment": "[Positive/Negative/Neutral]",
      "impact": "[Brief explanation of potential impact]",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "regional_relevance": "[Local/Global/Specific Region]"
    }
  ]
}

Additional Notes: Please ensure that the sources are credible and that the summaries focus on the most relevant details for the research agents.
`.trim();