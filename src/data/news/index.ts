import { NewsDataProvider } from './providers';

const newsProvider = new NewsDataProvider();

export async function collectNews(currency?: string) {
  try {
    // If no currency specified, get latest news without any search term
    const news = await newsProvider.getAllNews(currency || undefined);
    
    return {
      timestamp: new Date().toISOString(),
      total_items: news.length,
      items: news,
      // analysis: {
      //   sentiment: calculateNewsSentiment(news),
      //   trending_topics: extractTrendingTopics(news)
      // }
    };
  } catch (error) {
    console.error('Error collecting news:', error);
    throw error;
  }
}

function calculateNewsSentiment(news: any[]): number {
  // Simple sentiment calculation based on keywords
  const positiveWords = ['bullish', 'surge', 'gain', 'rally', 'up', 'high', 'positive'];
  const negativeWords = ['bearish', 'crash', 'drop', 'fall', 'down', 'low', 'negative'];
  
  let sentimentScore = 0;
  
  news.forEach(item => {
    const text = `${item.title} ${item.description || ''}`.toLowerCase();
    
    positiveWords.forEach(word => {
      if (text.includes(word)) sentimentScore += 1;
    });
    
    negativeWords.forEach(word => {
      if (text.includes(word)) sentimentScore -= 1;
    });
  });
  
  // Normalize to -1 to 1 range
  return news.length > 0 ? sentimentScore / news.length : 0;
}

function extractTrendingTopics(news: any[]): string[] {
  const topics = new Map<string, number>();
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
  
  news.forEach(item => {
    const text = `${item.title} ${item.description || ''}`.toLowerCase();
    const words = text.split(/\W+/).filter(word => 
      word.length > 3 && !commonWords.has(word)
    );
    
    words.forEach(word => {
      topics.set(word, (topics.get(word) || 0) + 1);
    });
  });
  
  // Sort by frequency and get top 10
  return Array.from(topics.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([topic]) => topic);
}
