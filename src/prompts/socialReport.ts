export const SOCIAL_REPORT_PROMPT = `
Report Type: Social Media Profile Stats
Date Range: [Insert Date Range]

Instructions:
Generate a simple social media profile report with the following metrics:
- Username
- Display Name
- Followers Count
- Following Count
- Total Tweets
- Join Date
- Verification Status
- Location (if available)
- Description (if available)

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
  }
}

Additional Notes: Only include data that is actually available from the API. Do not invent or estimate missing data.
`.trim();