import { TwitterClient } from './index';

let twitterClientInstance: TwitterClient | null = null;

export const getTwitterClient = async () => {
    if (!twitterClientInstance) {
        twitterClientInstance = new TwitterClient();
        
        // Clean up cookies before initializing
        const cookiesEnv = process.env.TWITTER_COOKIES;
        if (cookiesEnv) {
            const cleanCookies = [
                `auth_token=${cookiesEnv.match(/auth_token=([^;]+)/)?.[1]}`,
                `ct0=${cookiesEnv.match(/ct0=([^;]+)/)?.[1]}`
            ].filter(Boolean);
            
            console.log('Using cleaned cookies:', cleanCookies);
        }
        
        await twitterClientInstance.init();
    }
    return twitterClientInstance;
}; 