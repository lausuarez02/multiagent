import { Scraper, SearchMode } from 'agent-twitter-client';
import * as fs from 'fs/promises';
import * as path from 'path';
import { getTwitterClient } from '../utils/twitter/singleton';
import { TwitterClient } from '../utils/twitter';

interface NotificationConfig {
  enabled: boolean;
  interval: number;
  callback: (notification: any) => Promise<void>;
}

interface ListenerConfig {
  twitter?: NotificationConfig;
  news?: NotificationConfig;
  // Add other notification types as needed
}

interface ProcessedTweets {
  processedIds: string[];
  lastUpdated: string;
}

export class NotificationListener {
  private config: ListenerConfig;
  private intervals: NodeJS.Timeout[] = [];
  private twitter!: TwitterClient;
  private lastCheckTime: Date = new Date(0);
  private processedTweetsPath: string;
  private processedTweets: ProcessedTweets = {
    processedIds: [],
    lastUpdated: new Date().toISOString()
  };

  constructor(config: ListenerConfig) {
    this.config = config;
    this.processedTweetsPath = path.join(process.cwd(), 'data', 'processed_tweets.json');
  }

  async init() {
    this.twitter = await getTwitterClient();
  }

  async start() {
    console.log('[🎧] Starting notification listeners...');

    // Ensure data directory exists
    await this.ensureDataDirectory();
    
    // Load processed tweets
    await this.loadProcessedTweets();

    // Initialize Twitter client
    if (this.config.twitter?.enabled) {
      try {
        await this.initializeTwitterClient();
        this.startTwitterListener();
      } catch (error) {
        console.error('[Twitter Listener] Failed to initialize:', error);
      }
    }

    if (this.config.news?.enabled) {
      this.startNewsListener();
    }
  }

  private async ensureDataDirectory() {
    const dataDir = path.dirname(this.processedTweetsPath);
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }
  }

  private async loadProcessedTweets() {
    try {
      const data = await fs.readFile(this.processedTweetsPath, 'utf-8');
      this.processedTweets = JSON.parse(data);
      console.log(`[Twitter Listener] Loaded ${this.processedTweets.processedIds.length} processed tweets`);
    } catch (error) {
      // If file doesn't exist or is invalid, use default empty state
      console.log('[Twitter Listener] No existing processed tweets file, starting fresh');
      await this.saveProcessedTweets();
    }
  }

  private async saveProcessedTweets() {
    try {
      // Update the lastUpdated timestamp
      this.processedTweets.lastUpdated = new Date().toISOString();
      
      // Save to file
      await fs.writeFile(
        this.processedTweetsPath,
        JSON.stringify(this.processedTweets, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('[Twitter Listener] Error saving processed tweets:', error);
    }
  }

  private async markTweetAsProcessed(tweetId: string) {
    if (!this.processedTweets.processedIds.includes(tweetId)) {
      this.processedTweets.processedIds.push(tweetId);
      // Keep only the last 1000 processed tweets to prevent the file from growing too large
      if (this.processedTweets.processedIds.length > 1000) {
        this.processedTweets.processedIds = this.processedTweets.processedIds.slice(-1000);
      }
      await this.saveProcessedTweets();
    }
  }

  private isTweetProcessed(tweetId: string): boolean {
    return this.processedTweets.processedIds.includes(tweetId);
  }

  private async initializeTwitterClient() {
    const username = process.env.TWITTER_USERNAME;
    if (!username) throw new Error('Twitter username not configured');

    console.log('[Twitter Listener] Initializing...');
    this.twitter = await getTwitterClient();
    console.log('[Twitter Listener] Successfully initialized');
  }

  private async checkTwitterNotifications() {
    try {
      const username = process.env.TWITTER_USERNAME;
      if (!username) throw new Error('Twitter username not configured');

      // Fetch mentions using searchTweets
      const mentions = await this.twitter.fetchSearchTweets(
        `@${username}`,
        20,  // Limit to 20 tweets
        SearchMode.Latest
      );

      // Sort mentions by timestamp in descending order (newest first)
      const sortedMentions = mentions.tweets.sort((a, b) => {
        const timeA = new Date(a.timestamp as any * 1000).getTime();
        const timeB = new Date(b.timestamp as any * 1000).getTime();
        return timeB - timeA;
      });

      // Process mentions until we find one we've already handled
      for (const mention of sortedMentions) {
        if (!mention.id || !mention.timestamp) continue;
        
        // If we find a processed tweet, stop checking older ones
        if (this.isTweetProcessed(mention.id)) {
          break;
        }

        console.log(`[Twitter Listener] Processing new mention from @${mention.username}`);
        
        await this.config.twitter!.callback({
          type: 'mention',
          data: {
            id: mention.id,
            text: mention.text,
            author: mention.username,
            timestamp: mention.timestamp
          }
        });

        // Mark tweet as processed after handling it
        await this.markTweetAsProcessed(mention.id);
      }

      this.lastCheckTime = new Date();
    } catch (error) {
      console.error('[Twitter Listener] Error checking mentions:', error);
    }
  }

  private startTwitterListener() {
    const interval = setInterval(async () => {
      await this.checkTwitterNotifications();
    }, this.config.twitter!.interval);

    this.intervals.push(interval);
    console.log('[Twitter Listener] Started monitoring mentions');
  }

  private startNewsListener() {
    const interval = setInterval(async () => {
      try {
        // Implement your news checking logic here
        const newsUpdates = await this.checkNewsUpdates();
        if (newsUpdates.length > 0) {
          await this.config.news!.callback(newsUpdates);
        }
      } catch (error) {
        console.error('[News Listener] Error:', error);
      }
    }, this.config.news!.interval);

    this.intervals.push(interval);
  }

  private async checkNewsUpdates() {
    // Implement your news checking logic here
    return [];
  }

  stop() {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    console.log('[🎧] Notification listeners stopped');
  }
} 