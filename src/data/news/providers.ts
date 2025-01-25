import axios from 'axios';
import * as cheerio from 'cheerio';

interface NewsItem {
  title: string;
  url: string;
  source: string;
  published_at: string;
  description?: string;
  thumbnail?: string;
}

export class NewsDataProvider {
  private cryptoPanicApiKey: string;
  private cryptoPanicBaseUrl = 'https://cryptopanic.com/api/v1';
  private cointelegraphBaseUrl = 'https://cointelegraph.com';

  constructor() {
    this.cryptoPanicApiKey = process.env.CRYPTOPANIC_API_KEY || '';
    if (!this.cryptoPanicApiKey) {
      throw new Error('CRYPTOPANIC_API_KEY environment variable is not set');
    }
  }

  async getCryptoPanicNews(currency?: string, filter?: 'rising'|'hot'|'important') {
    try {
      const response = await axios.get(`${this.cryptoPanicBaseUrl}/posts/`, {
        params: {
          auth_token: this.cryptoPanicApiKey,
          currencies: currency,
          filter: filter,
          public: true
        }
      });

      return response.data.results.map((item: any) => ({
        title: item.title,
        url: item.url,
        source: item.source.title,
        published_at: item.published_at,
        description: item.metadata?.description,
        thumbnail: item.metadata?.thumbnail
      }));
    } catch (error) {
      console.error('CryptoPanic API error:', error);
      return [];
    }
  }

  async getCointelegraphNews(searchTerm?: string) {
    try {
      // If searchTerm is provided, use the search URL, otherwise use the main page
      const url = searchTerm 
        ? `${this.cointelegraphBaseUrl}/search?q=${encodeURIComponent(searchTerm)}`
        : `${this.cointelegraphBaseUrl}/rss`; // Use RSS only for main page

      const response = await axios.get(url);
      const news: NewsItem[] = [];

      if (searchTerm) {
        // Keep existing search page scraping logic
        const $ = cheerio.load(response.data);
        $('.search-results__item').each((_, element) => {
          const $element = $(element);
          const title = $element.find('.search-results__title').text().trim();
          const relativeUrl = $element.find('a').attr('href') || '';
          const url = relativeUrl.startsWith('http') 
            ? relativeUrl 
            : this.cointelegraphBaseUrl + relativeUrl;
          
          const published_at = $element.find('time').attr('datetime') || new Date().toISOString();
          const description = $element.find('.search-results__text').text().trim();
          const thumbnail = $element.find('img').attr('src');

          if (title && url) {
            news.push({
              title,
              url,
              source: 'Cointelegraph',
              published_at,
              description,
              thumbnail
            });
          }
        });
      } else {
        // Parse RSS for main page
        const $ = cheerio.load(response.data, { xmlMode: true });
        $('item').each((_, element) => {
          const $element = $(element);
          const title = $element.find('title').text();
          const url = $element.find('link').text();
          const published_at = new Date($element.find('pubDate').text()).toISOString();
          const description = $element.find('description').text();
          const thumbnail = $element.find('media\\:content, content').attr('url');

          if (title && url) {
            news.push({
              title,
              url,
              source: 'Cointelegraph',
              published_at,
              description,
              thumbnail
            });
          }
        });
      }

      return news;
    } catch (error) {
      console.error('Cointelegraph error:', error);
      return [];
    }
  }

  async getAllNews(currency?: string) {
    try {
      const [cryptoPanicNews, cointelegraphNews] = await Promise.all([
        this.getCryptoPanicNews(currency),
        this.getCointelegraphNews(currency) // Now passing the currency as search term
      ]);

      // Combine and sort by date
      return [...cryptoPanicNews, ...cointelegraphNews]
        .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
    } catch (error) {
      console.error('Error fetching news:', error);
      return [];
    }
  }
} 