import { SocialDataProvider } from './providers';

export interface SocialMetrics {
  timestamp: string;
  twitter?: {
    profile: {
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
    };
    analysis: {
      engagement_rate: number;
      activity_score: number;
    };
    agent_metrics?: {
      followers: number;
      following: number;
      tweets: number;
      engagement: number;
      interval: string;
    };
    related_news?: {
      title: string;
      content: string;
      date: string;
      source: string;
    }[];
  };
}

let socialProvider: SocialDataProvider;

export function initializeSocialProvider(isTesting = false) {
  socialProvider = new SocialDataProvider();
}

export async function collectSocialMetrics(username?: string): Promise<SocialMetrics> {
  if (!socialProvider) {
    initializeSocialProvider();
  }

  const metrics: SocialMetrics = {
    timestamp: new Date().toISOString()
  };

  if (username) {
    try {
      const [profile, agentMetrics, news] = await Promise.all([
        socialProvider.getTwitterProfile(username),
        socialProvider.getAgentMetrics(username),
        socialProvider.searchNews(username, 
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
          new Date().toISOString().split('T')[0] // today
        )
      ]);
      
      if (profile) {
        metrics.twitter = {
          profile,
          analysis: {
            engagement_rate: calculateEngagementRate(profile),
            activity_score: calculateActivityScore(profile)
          },
          agent_metrics: agentMetrics,
          related_news: news
        };
      }
    } catch (error) {
      console.error('Error collecting social metrics:', error);
    }
  }

  return metrics;
}

function calculateEngagementRate(profile: NonNullable<SocialMetrics['twitter']>['profile']): number {
  if (profile.tweets === 0) return 0;
  return (profile.followers / profile.tweets) * 100;
}

function calculateActivityScore(profile: NonNullable<SocialMetrics['twitter']>['profile']): number {
  const joinDate = new Date(profile.joinDate);
  const now = new Date();
  const accountAgeInDays = (now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24);
  
  if (accountAgeInDays === 0) return 0;
  return (profile.tweets / accountAgeInDays) * 100;
}
