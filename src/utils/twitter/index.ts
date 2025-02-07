import { Scraper, SearchMode } from 'agent-twitter-client';
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import mileiCharacter from '../../character/milei.character.json';

const MAX_TWEET_LENGTH = 280;

export class TwitterClient {
    private scraper: Scraper;
    private profile: any;
    
    constructor() {
        this.scraper = new Scraper();
    }

    async init() {
        const username = process.env.TWITTER_USERNAME;
        const password = process.env.TWITTER_PASSWORD;
        const email = process.env.TWITTER_EMAIL;
        const cookiesEnv = process.env.TWITTER_COOKIES;

        if (!username || !password || !email) {
            throw new Error('Twitter credentials not configured');
        }

        console.log("Initializing Twitter client...");
        
        if (cookiesEnv) {
            try {
                console.log("Found cookies in environment, attempting to restore session...");
                const cookiesArray = JSON.parse(cookiesEnv.replace(/\n/g, '').trim());
                
                // Only keep essential cookies with minimal properties
                const essentialCookies = cookiesArray
                    .filter((cookie: any) => ['auth_token', 'ct0'].includes(cookie.key))
                    .map((cookie: any) => `${cookie.key}=${cookie.value}`);
                
                if (essentialCookies.length === 2) {  // Must have both auth_token and ct0
                    console.log('Setting essential cookies:', essentialCookies);
                    await this.setCookies(essentialCookies);
                    
                    if (await this.isLoggedIn()) {
                        console.log("Successfully restored Twitter session from cookies");
                        this.profile = await this.fetchProfile(username);
                        return;
                    }
                }
            } catch (error) {
                console.error("Error restoring cookies:", error);
            }
        }

        // Fallback to password login
        console.log("Cookie login failed, falling back to password login...");
        await this.scraper.login(username, password, email);
        
        // Save only essential cookies after login
        const newCookies = await this.scraper.getCookies();
        const essentialCookies = newCookies
            .filter(cookie => ['auth_token', 'ct0'].includes(cookie.key))
            .map(cookie => ({
                key: cookie.key,
                value: cookie.value
            }));
        
        console.log('Save these cookies in your .env file:', JSON.stringify(essentialCookies));
        
        this.profile = await this.fetchProfile(username);
    }

    private async fetchProfile(username: string) {
        try {
            const profile = await this.scraper.getProfile(username);
            return {
                id: profile.userId,
                username,
                screenName: profile.name,
                bio: profile.biography
            };
        } catch (error) {
            console.error("Error fetching Twitter profile:", error);
            return undefined;
        }
    }

    private truncateToCompleteSentence(text: string): string {
        if (text.length <= MAX_TWEET_LENGTH) {
            return text;
        }

        const truncatedAtPeriod = text.slice(
            0,
            text.lastIndexOf(".", MAX_TWEET_LENGTH) + 1
        );

        if (truncatedAtPeriod.trim().length > 0) {
            return truncatedAtPeriod.trim();
        }

        const truncatedAtSpace = text.slice(
            0,
            text.lastIndexOf(" ", MAX_TWEET_LENGTH)
        );

        if (truncatedAtSpace.trim().length > 0) {
            return truncatedAtSpace.trim() + "...";
        }

        return text.slice(0, MAX_TWEET_LENGTH - 3).trim() + "...";
    }

    async setCookies(cookies: string[]) {
        return this.scraper.setCookies(cookies);
    }

    async isLoggedIn() {
        return this.scraper.isLoggedIn();
    }

    async fetchSearchTweets(query: string, limit: number, mode: SearchMode) {
        return this.scraper.fetchSearchTweets(query, limit, mode);
    }

    async sendTweet(content: string, replyToId?: string) {
        try {
            // Clean and truncate the content
            const cleanContent = content
                .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII chars (emojis)
                .replace(/#\w+/g, '')         // Remove hashtags
                .trim();
            
            console.log('Attempting to send tweet:', {
                originalContent: content,
                cleanContent,
                replyToId,
                isLoggedIn: await this.isLoggedIn()
            });
            
            const result = await this.scraper.sendTweet(cleanContent, replyToId);
            console.log('Tweet sent successfully:', result);
            return result;
        } catch (error) {
            console.error("Error sending tweet:", error);
            throw error;
        }
    }

    async formatTweetThread(response: any): Promise<string[]> {
        console.log('Formatting tweet thread from response:', response);
        const tweets: string[] = [];
        
        try {
            let analysisData;
            let commentary;
            if (typeof response.text === 'string') {
                try {
                    const parsed = JSON.parse(response.text);
                    analysisData = parsed.analysis;
                    commentary = parsed.commentary;
                } catch (e) {
                    console.error('Failed to parse response text:', e);
                    return tweets;
                }
            }

            if (!analysisData) {
                console.log('No analysis data found in response');
                return tweets;
            }

            // Generate tweet using character style and analysis data
            const prompt = `
                You are a venture capitalist Javier Milei, you are an agent doing impersonation of Javier Milei as he were a venture capitalist.
                Generate a tweet about the following data:
                POST as if you just find something on the internet like a normal human being.
                - MAIN DATA to be considered and commented: ${commentary}
                - Market Sentiment: ${analysisData.market_analysis}
                - Investment Action: ${analysisData.investment_action}
                - Future Outlook: ${analysisData.future_outlook}
                
                DO NOT USE A LOT OF EMOJIS OR HASHTAGS.
                
                Follow these style guidelines:
                ${mileiCharacter.style.post.join('\n')}
                
                Include some of these catchphrases:
                ${mileiCharacter.bio.join('\n')}
            `;

            const tweetContent = await generateText({
                model: openai("gpt-4-turbo"),
                messages: [{
                    role: "user",
                    content: prompt
                }],
                temperature: 0.9
            });

            // Split the generated content into tweets
            const generatedTweets = tweetContent.text.split('\n\n')
                .filter((tweet:string) => tweet.trim().length > 0)
                .map((tweet:string) => this.truncateToCompleteSentence(tweet));

            tweets.push(...generatedTweets);

            console.log('Final tweet thread:', tweets);
        } catch (error) {
            console.error('Error formatting tweet thread:', error);
        }

        return tweets.filter(tweet => tweet.trim().length > 0);
    }

    async postTweetThread(tweets: string[]) {
        try {
            // Test with a very basic tweet
            const formattedContent = this.truncateToCompleteSentence(tweets[0]);
            const testTweet = "Hello world! Testing at " + new Date().toISOString();
            console.log('Test tweet:', formattedContent);
            
            // Add delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Send tweet and get response directly
            const result = await this.scraper.sendTweet(formattedContent);
            console.log('Tweet response:', result);
            
            return {
                success: true,
                lastTweetId: result || 'unknown'
            };
        } catch (error) {
            console.error('Error posting tweet:', error);
            console.error('Tweet content that failed:');
            throw error;
        }
    }

    async replyToTweet(content: string, replyToTweetId: string) {
        try {
            const formattedContent = this.truncateToCompleteSentence(content);
            console.log(`Attempting to reply to tweet:`, {
                replyToTweetId,
                content: formattedContent,
                isLoggedIn: await this.isLoggedIn()
            });

            if (process.env.TWITTER_DRY_RUN === 'true') {
                console.log(`[DRY RUN] Would have replied to ${replyToTweetId}: ${formattedContent}`);
                return;
            }

            // Add a small delay before replying
            await new Promise(resolve => setTimeout(resolve, 5000));

            const result = await this.scraper.sendTweet(formattedContent, replyToTweetId);
            console.log('Reply sent successfully:', result);
            
            return {
                success: true,
                text: formattedContent,
                inReplyTo: replyToTweetId
            };
        } catch (error: any) {
            console.error("Error replying to tweet - Full details:", {
                error,
                errorMessage: error.message,
                errorStack: error.stack,
                tweetId: replyToTweetId,
                content
            });
            throw error;
        }
    }

    async handleTweetInteraction(response: any, replyToTweetId?: string) {
        try {
            if (replyToTweetId) {
                // This is a reply to someone's tweet
                return await this.replyToTweet(response.text, replyToTweetId);
            } else {
                // This is a new tweet thread (for news etc)
                const tweets = await this.formatTweetThread(response);
                return await this.postTweetThread(tweets);
            }
        } catch (error) {
            console.error("Error handling tweet interaction:", error);
            throw error;
        }
    }
}