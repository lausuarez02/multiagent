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
  };
}

let socialProvider: SocialDataProvider;

export function initializeSocialProvider(isTesting = false) {
  socialProvider = new SocialDataProvider(isTesting);
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
      const profile = await socialProvider.getTwitterProfile(username);
      
      if (profile) {
        metrics.twitter = {
          profile,
          analysis: {
            engagement_rate: calculateEngagementRate(profile),
            activity_score: calculateActivityScore(profile)
          }
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
