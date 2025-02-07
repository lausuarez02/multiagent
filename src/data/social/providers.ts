import axios from 'axios';
import * as cheerio from 'cheerio';

interface TwitterProfile {
  username: string;
  displayName: string;
  followers: number;
  following: number;
  tweets: number;
  description: string;
  joinDate: string;
  location?: string;
  website?: string;
  verified: boolean;
  profileImage?: string;
}

interface TwitterAgentMetrics {
  followers: number;
  following: number;
  tweets: number;
  engagement: number;
  interval: string;
}

interface NewsSearchResult {
  title: string;
  content: string;
  date: string;
  source: string;
}

export class SocialDataProvider {
  private readonly NITTER_INSTANCES = [
    'https://nitter.net',
    'https://nitter.privacydev.net',
    'https://nitter.1d4.us',
    'https://nitter.kavin.rocks',
  ];

  private readonly apiKey: string;

  constructor() {
    const apiKey = process.env.COOKIE_API_KEY;
    if (!apiKey) {
      throw new Error('COOKIE_API_KEY environment variable is required');
    }
    this.apiKey = apiKey;
  }

  async getTwitterProfile(username: string): Promise<TwitterProfile> {
    let lastError = null;

    for (const instance of this.NITTER_INSTANCES) {
      try {
        console.log(`[SocialDataProvider] Trying ${instance} for user ${username}`);
        
        const response = await axios.get(`${instance}/${username}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 5000
        });

        if (response.status === 200) {
          const profile = this.parseTwitterProfile(response.data, username);
          
          if (this.isValidProfile(profile)) {
            console.log(`[SocialDataProvider] Successfully fetched profile from ${instance}`);
            console.log('profile datab bruv', profile);
            return profile;
          }
        }
      } catch (error: any) {
        lastError = error;
        console.log(`[SocialDataProvider] Failed to fetch from ${instance}, trying next...`);
        continue;
      }
    }

    throw new Error(`Failed to fetch Twitter profile from all instances: ${lastError?.message}`);
  }

  private parseTwitterProfile(html: string, username: string): TwitterProfile {
    const $ = cheerio.load(html);
    
    const profile: TwitterProfile = {
      username,
      displayName: $('.profile-card-fullname').text().trim(),
      followers: this.parseCount($('.profile-stat-num').eq(0).text()),
      following: this.parseCount($('.profile-stat-num').eq(1).text()),
      tweets: this.parseCount($('.profile-stat-num').eq(2).text()),
      description: $('.profile-bio').text().trim(),
      joinDate: $('.profile-joindate').text().trim(),
      location: $('.profile-location').text().trim(),
      website: $('.profile-website').attr('href') || undefined,
      verified: $('.verified-icon').length > 0,
      profileImage: $('.profile-card-avatar').attr('src'),
    };

    return profile;
  }

  private parseCount(countStr: string): number {
    try {
      const baseNumber = parseFloat(countStr.replace(/[,\s]/g, ''));
      
      if (isNaN(baseNumber)) return 0;

      const multipliers = {
        'K': 1000,
        'M': 1000000,
        'B': 1000000000
      };

      const suffix = countStr.slice(-1).toUpperCase();
      
      if (suffix in multipliers) {
        const multiplier = multipliers[suffix as keyof typeof multipliers];
        return Math.round(baseNumber * multiplier);
      }
      
      return Math.round(baseNumber);
    } catch (error) {
      console.error('Error parsing count:', countStr, error);
      return 0;
    }
  }

  private isValidProfile(profile: TwitterProfile): boolean {
    return Boolean(
      profile.displayName &&
      profile.followers >= 0 &&
      profile.following >= 0 &&
      profile.tweets >= 0
    );
  }

  async getAgentMetrics(username: string, interval: string = '_7Days'): Promise<TwitterAgentMetrics> {
    try {
      const response = await axios.get(
        `https://api.cookie.fun/v2/agents/twitterUsername/${username}`,
        {
          params: { interval },
          headers: {
            'x-api-key': this.apiKey
          },
          timeout: 5000
        }
      );

      if (response.status === 200) {
        return response.data;
      }
      throw new Error('Failed to fetch agent metrics');
    } catch (error: any) {
      console.error('[SocialDataProvider] Failed to fetch agent metrics:', error.message);
      throw error;
    }
  }

  async searchNews(query: string, from: string, to: string): Promise<NewsSearchResult[]> {
    try {
      const response = await axios.get(
        `https://api.cookie.fun/v1/hackathon/search/${query}`,
        {
          params: { from, to },
          headers: {
            'x-api-key': this.apiKey
          },
          timeout: 5000
        }
      );

      if (response.status === 200) {
        return response.data;
      }
      throw new Error('Failed to fetch news search results');
    } catch (error: any) {
      console.error('[SocialDataProvider] Failed to fetch news:', error.message);
      throw error;
    }
  }
}