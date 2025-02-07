export const SOCIAL_REPORT_PROMPT = `
Report Type: Social Media Profile Stats
Date Range: [Insert Date Range]

Instructions:
Generate a detailed social media profile report with the following metrics and analysis:

1. Basic Profile Stats:
- Username
- Display Name
- Followers Count
- Following Count
- Total Tweets
- Join Date
- Verification Status
- Location (if available)
- Description (if available)

2. Engagement Metrics:
- Engagement Rate (per 100 followers)
- Activity Score (0-100 scale)

3. Agent-Specific Metrics:
- Agent Follower Growth
- Agent Engagement Rate
- Tweet Activity Trends
- Performance Analysis

4. News Analysis:
- Recent News Mentions
- News Sentiment
- Key Topics Coverage
- Impact on Social Metrics

5. Risk Assessment:
- Legitimacy Score (0-100)
- Risk Factors (if any)
- Trust Signals
- Potential Red Flags

6. Analysis:
- Account Age Analysis
- Follower/Following Ratio Analysis
- Engagement Pattern Analysis
- Overall Trust Assessment
- News Impact Assessment
- Agent Performance Trends

Report Format:
{
  "date_range": "[Date Range]",
  "profile_stats": {
    "username": "string",
    "display_name": "string",
    "followers": number,
    "following": number,
    "tweets": number,
    "join_date": "string",
    "verified": boolean,
    "location": "string",
    "description": "string"
  },
  "engagement_metrics": {
    "engagement_rate": {
      "value": number,
      "per_100_followers": number,
      "assessment": "string"  // e.g., "High", "Low", "Suspicious"
    },
    "activity_score": {
      "value": number,
      "assessment": "string"
    }
  },
  "agent_metrics": {
    "followers_growth": number,
    "engagement_rate": number,
    "tweet_activity": number,
    "performance_score": number,
    "trend_analysis": "string"
  },
  "news_analysis": {
    "mention_count": number,
    "sentiment_score": number,
    "key_topics": string[],
    "impact_assessment": "string"
  },
  "risk_assessment": {
    "legitimacy_score": number,
    "risk_level": "string",  // "Low", "Medium", "High"
    "trust_signals": string[],
    "red_flags": string[]
  }
}

Additional Notes: 
- Provide clear explanations for any suspicious patterns
- Highlight both positive and negative indicators
- Include specific examples of concerning behavior if found
- Make a final assessment on the account's likely legitimacy
- Analyze correlation between news mentions and social metrics
- Evaluate agent performance trends over time
`.trim();