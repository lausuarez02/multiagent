import { describe, it, expect, beforeEach } from 'vitest';
import { SocialDataProvider } from '../providers';
import { collectSocialMetrics, initializeSocialProvider } from '../index';

describe('Social Data Collection', () => {
  let socialProvider: SocialDataProvider;

  beforeEach(() => {
    // Initialize both the local provider and the global one in testing mode
    socialProvider = new SocialDataProvider(true);
    initializeSocialProvider(true);
  });

  describe('Twitter Profile Collection', () => {
    it('should fetch Twitter profile data', async () => {
      const profile = await socialProvider.getTwitterProfile('elonmusk');
      
      expect(profile).toBeDefined();
      expect(profile).not.toBeNull();
      
      // Check all required fields
      expect(profile?.username).toBe('elonmusk');
      expect(profile?.displayName).toBeDefined();
      expect(profile?.followers).toBeGreaterThan(0);
      expect(profile?.following).toBeGreaterThan(0);
      expect(profile?.tweets).toBeGreaterThan(0);
      expect(profile?.description).toBeDefined();
      expect(profile?.joinDate).toBeDefined();
      
      console.log('Twitter Profile Example:', profile);
    });

    it('should handle non-existent profiles gracefully', async () => {
      const profile = await socialProvider.getTwitterProfile('nonexistentuser123456789');
      expect(profile).toBeNull();
    });
  });

  describe('Social Metrics Collection', () => {
    it('should collect and analyze Twitter metrics', async () => {
      const metrics = await collectSocialMetrics('elonmusk');
      
      expect(metrics).toBeDefined();
      expect(metrics.timestamp).toBeDefined();
      expect(metrics.twitter).toBeDefined();
      
      const twitter = metrics.twitter;
      expect(twitter?.profile).toBeDefined();
      expect(twitter?.analysis).toBeDefined();
      expect(twitter?.analysis.engagement_rate).toBeGreaterThan(0);
      expect(twitter?.analysis.activity_score).toBeGreaterThan(0);
      
      console.log('Social Metrics Analysis:', metrics.twitter?.analysis);
    });

    it('should handle missing username gracefully', async () => {
      const metrics = await collectSocialMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.timestamp).toBeDefined();
      expect(metrics.twitter).toBeUndefined();
    });

    it('should calculate engagement rate correctly', async () => {
      const metrics = await collectSocialMetrics('elonmusk');
      const twitter = metrics.twitter;
      
      if (twitter) {
        const { followers, tweets } = twitter.profile;
        const expectedEngagementRate = (followers / tweets) * 100;
        expect(twitter.analysis.engagement_rate).toBe(expectedEngagementRate);
      }
    });
  });

  describe('Count Parser', () => {
    it('should parse different number formats', async () => {
      const profile = await socialProvider.getTwitterProfile('elonmusk');
      
      expect(profile).toBeDefined();
      expect(typeof profile?.followers).toBe('number');
      expect(typeof profile?.following).toBe('number');
      expect(typeof profile?.tweets).toBe('number');
      
      console.log('Number parsing example:', {
        followers: profile?.followers,
        following: profile?.following,
        tweets: profile?.tweets
      });
    });
  });
}); 