export const SOCIAL_REPORT_PROMPT = `
Report Type: Social Media Activity Report
Date Range: [Insert Start Date] - [Insert End Date]
Target Audience: Research Agents (for sentiment analysis and trend tracking)

Instructions:
1. Post Summary: Summarize significant social media posts, including the context and content of each post.
2. Sentiment Analysis: Evaluate the sentiment of the posts (positive, negative, or neutral). Briefly explain the sentiment for each post.
3. Engagement Metrics: Provide data on likes, shares, comments, or any other relevant engagement statistics.
4. Trending Hashtags/Topics: List any hashtags or topics that are trending, especially those related to the project. Include the volume of mentions.
5. Influencer Mentions: Identify any influencers or notable figures discussing the project. Provide their sentiment and reach.
6. Regional Focus: Mention if there are any regional patterns to the conversations.

Report Format:
{
  "date_range": "[Insert Start Date] - [Insert End Date]",
  "social_posts": [
    {
      "platform": "[Platform Name]",
      "content_summary": "[Brief description of the post]",
      "sentiment": "[Positive/Negative/Neutral]",
      "engagement_metrics": {
        "likes": "[Number]",
        "shares": "[Number]",
        "comments": "[Number]"
      },
      "hashtags_trending": ["#hashtag1", "#hashtag2"],
      "influencer_mentions": ["@influencer1", "@influencer2"],
      "regional_focus": "[Region or Global]"
    }
  ]
}

Additional Notes: Please focus on tracking posts with high engagement or posts that may significantly influence the project's reputation. Make sure the data is sourced from reliable and verified platforms.
`.trim();