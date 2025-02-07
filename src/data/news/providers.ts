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
    this.cryptoPanicApiKey = process.env.CRYPTO_PANIC_API_KEY || '';
    if (!this.cryptoPanicApiKey) {
      throw new Error('CRYPTOPANIC_API_KEY environment variable is not set');
    }
  }

  async getCryptoPanicNews(searchTerm?: string, filter?: 'rising'|'hot'|'important') {
    try {
      console.log(`[CryptoPanic] Searching for: ${searchTerm || 'latest news'}`);
      
      const response = await axios.get(`${this.cryptoPanicBaseUrl}/posts/`, {
        params: {
          auth_token: this.cryptoPanicApiKey,
          currencies: searchTerm?.toUpperCase(), // Convert to uppercase for currency symbols
          filter: filter,
          public: true,
          limit: 2,
          // Add search term to metadata if it's not a currency
          q: !this.isCurrencySymbol(searchTerm) ? searchTerm : undefined
        }
      });

      console.log(`[CryptoPanic] Found ${response.data.results.length} results`);

      return response.data.results
        .slice(0, 2)
        .map((item: any) => ({
          title: item.title,
          url: item.url,
          source: item.source.title,
          published_at: item.published_at,
          description: item.metadata?.description,
          thumbnail: item.metadata?.thumbnail
        }));
    } catch (error: any) {
      console.error('[CryptoPanic] API error:', error.message);
      return [];
    }
  }

  async getCointelegraphNews(searchTerm?: string) {
    try {
      console.log(`[Cointelegraph] Searching for: ${searchTerm || 'latest news'}`);
      
      const url = searchTerm 
        ? `${this.cointelegraphBaseUrl}/search?q=${encodeURIComponent(searchTerm)}`
        : `${this.cointelegraphBaseUrl}/rss`;

      const response = await axios.get(url);
      const news: NewsItem[] = [];

      if (searchTerm) {
        const $ = cheerio.load(response.data);
        console.log(`[Cointelegraph] Processing search results for: ${searchTerm}`);
        
        $('.search-results__item')
          .slice(0, 2)
          .each((_, element) => {
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
        const $ = cheerio.load(response.data, { xmlMode: true });
        console.log('[Cointelegraph] Processing RSS feed');
        
        $('item')
          .slice(0, 2)
          .each((_, element) => {
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

      console.log(`[Cointelegraph] Found ${news.length} results`);
      return news;
    } catch (error: any) {
      console.error('[Cointelegraph] Error:', error.message);
      return [];
    }
  }

  async getAllNews(searchTerm?: string) {
    try {
      console.log(`[NewsProvider] Fetching ${searchTerm ? `news for: ${searchTerm}` : 'latest news'}`);
      
      const [cryptoPanicNews, cointelegraphNews] = await Promise.all([
        this.getCryptoPanicNews(searchTerm),
        this.getCointelegraphNews(searchTerm)
      ]);

      const allNews = [...cryptoPanicNews, ...cointelegraphNews]
        .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
        .slice(0, 2);

      console.log(`[NewsProvider] Total news items found: ${allNews.length}`);
      return allNews;
    } catch (error: any) {
      console.error('[NewsProvider] Error fetching news:', error.message);
      return [];
    }
  }

  private isCurrencySymbol(term?: string): boolean {
    if (!term) return false;
    // Common crypto currency symbols
    const currencySymbols = ['BTC', 'ETH', 'USDT', 'BNB', 'XRP', 'ADA', 'DOGE', 'SOL'];
    return currencySymbols.includes(term.toUpperCase());
  }
} 