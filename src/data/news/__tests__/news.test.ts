import { describe, it, expect, beforeEach } from 'vitest';
import { NewsDataProvider } from '../providers';
import { collectNews } from '../index';

describe('News Data Collection', () => {
  let newsProvider: NewsDataProvider;

  beforeEach(() => {
    newsProvider = new NewsDataProvider();
  });

  describe('CryptoPanic Integration', () => {
    it('should fetch general CryptoPanic news', async () => {
      const news = await newsProvider.getCryptoPanicNews();
      expect(news).toBeDefined();
      expect(Array.isArray(news)).toBe(true);
      expect(news.length).toBeGreaterThan(0);
      console.log('CryptoPanic General News:', news.slice(0, 2));
    }, 10000);

    it('should fetch currency-specific CryptoPanic news', async () => {
      const news = await newsProvider.getCryptoPanicNews('BTC');
      expect(news).toBeDefined();
      expect(Array.isArray(news)).toBe(true);
      news.forEach((item: any) => {
        expect(item).toHaveProperty('title');
        expect(item).toHaveProperty('url');
        expect(item).toHaveProperty('published_at');
      });
      console.log('CryptoPanic BTC News:', news.slice(0, 2));
    }, 10000);

    it('should handle different filters', async () => {
      const hotNews = await newsProvider.getCryptoPanicNews(undefined, 'hot');
      expect(hotNews).toBeDefined();
      expect(Array.isArray(hotNews)).toBe(true);
      console.log('CryptoPanic Hot News:', hotNews.slice(0, 1));
    }, 10000);
  });

  describe('Cointelegraph Integration', () => {
    it('should fetch general Cointelegraph news', async () => {
        const news = await newsProvider.getCointelegraphNews();
        expect(news).toBeDefined();
        expect(Array.isArray(news)).toBe(true);
        expect(news.length).toBeGreaterThan(0);
        
        // Test the first news item structure
        const firstNews = news[0];
        expect(firstNews).toHaveProperty('title');
        expect(firstNews).toHaveProperty('url');
        expect(firstNews.url).toContain('cointelegraph.com');
        expect(firstNews.source).toBe('Cointelegraph');
        expect(firstNews).toHaveProperty('published_at');
        expect(firstNews).toHaveProperty('description');
        
        console.log('Cointelegraph RSS News Example:', firstNews);
    }, 10000);

    it('should fetch news with search term', async () => {
      const searchTerm = 'Bitcoin';
      const news = await newsProvider.getCointelegraphNews(searchTerm);
      expect(news).toBeDefined();
      expect(Array.isArray(news)).toBe(true);
      news.forEach((item: any) => {
        expect(item.source).toBe('Cointelegraph');
        expect(item).toHaveProperty('title');
        expect(item).toHaveProperty('url');
      });
      console.log(`Cointelegraph ${searchTerm} News:`, news.slice(0, 2));
    }, 10000);

    it('should handle empty search results gracefully', async () => {
      const news = await newsProvider.getCointelegraphNews('xyznonexistentterm123');
      expect(news).toBeDefined();
      expect(Array.isArray(news)).toBe(true);
      expect(news.length).toBe(0);
    }, 10000);
  });

  describe('Combined News Collection', () => {
    it('should collect and analyze general news', async () => {
      const result = await collectNews();
      expect(result).toBeDefined();
      expect(result.items).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.analysis).toBeDefined();
      expect(result.analysis).toHaveProperty('sentiment');
      expect(result.analysis).toHaveProperty('trending_topics');
      console.log('News Analysis:', result.analysis);
    }, 15000);

    it('should collect and analyze currency-specific news', async () => {
      const result = await collectNews('BTC');
      expect(result).toBeDefined();
      expect(result.items).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.analysis).toBeDefined();
      console.log('BTC News Analysis:', result.analysis);
    }, 15000);

    it('should handle errors gracefully', async () => {
      // Temporarily break the API key to test error handling
      const originalKey = process.env.CRYPTOPANIC_API_KEY;
      process.env.CRYPTOPANIC_API_KEY = 'invalid_key';
      
      const result = await collectNews();
      expect(result).toBeDefined();
      expect(result.items).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      
      // Restore the API key
      process.env.CRYPTOPANIC_API_KEY = originalKey;
    }, 15000);
  });
}); 