import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { createVCMileiAgent } from './agents';
import { NotificationListener } from './jobs/listener';
import chalk from 'chalk';
const app = new Hono();
const port = process.env.PORT || 3078;

const startSystem = async () => {
  console.log('[🚀] starting VCMILEI multiagent system...');
  
  console.log(`
  ██╗   ██╗ ██████╗███╗   ███╗██╗██╗     ███████╗██╗
  ██║   ██║██╔════╝████╗ ████║██║██║     ██╔════╝██║
  ██║   ██║██║     ██╔████╔██║██║██║     █████╗  ██║
  ╚██╗ ██╔╝██║     ██║╚██╔╝██║██║██║     ██╔══╝  ██║
   ╚████╔╝ ╚██████╗██║ ╚═╝ ██║██║███████╗███████╗██║
    ╚═══╝   ╚═════╝╚═╝     ╚═╝╚═╝╚══════╝╚══════╝╚═╝
  `);

    console.log(chalk.magenta.bgMagenta(`
          ##%%%%#####                         
        #%%@@%%######*                       
        %%@@@@%%%#%%#%##                      
      #%@@#++=-::::-%###                     
      #%%@#+=--::::::+###                     
      #%%*#@@%*+#%%#-%%#                     
      %%#*%@@@*-@@@%*%%                      
        %%*+**+=-=++=+*#                      
        %*+=-===:-:--#                       
        #@@*+==+=--=+%+-                      
      #*#@@%*+===+%%#+-                      
      ##%%%%%%@@@@@@%@@%%#*+===                  
      @@%%%#%%%%%%%%@@@@@@%%#***++#+=                
      %%%@@#########%%%%%##***+++*%#*=               
      %@@@@%#***##**#%@@*******++*%%%*+              
      %@@@@%##*******%@##**+***++*@%%%*              
      %@@@@@%##*******#@********+*#%%%%#+             
      @@@@%@#-====+**+*%***++====-=%%%%%+             
      %@%@@@@@=========---==---=---+@@%%%#+            
      @@@@@@@@@#+++=======-====-=----@@@@%%#*           
      %@%%%%%%++++++======-=======---=*##*##**          
      %@%@@@@*+++++++==========+++++=--+#####*          
      **@@@@@@%**+++#%%##########*+====+#%%%%%*          
      *#@@%@@@%@@%@%#####%%##*##%%%%#++@@@@@@#++         
`));
  console.log("======== Initializing VCMilei System =========");
  
  // Create VCMilei agent instance first
  const vcMileiAgent = await createVCMileiAgent();
  
  // Initialize notification listeners for Twitter mentions
  const notificationListener = new NotificationListener({
    twitter: {
      enabled: true,
      interval: 60000,
      callback: async (notification) => {
        await vcMileiAgent.handleRequest({
          type: 'general',
          query: notification.data.text,
          context: {
            notificationType: 'mention',
            fromUser: notification.data.author,
            tweetId: notification.data.id
          }
        });
      }
    }
  });

  // Set up periodic news check
  setInterval(async () => {
    try {
      await vcMileiAgent.handleRequest({
        type: 'news',
        context: {
          notificationType: 'news_update'
        }
      });
    } catch (error) {
      console.error('[News Check] Error:', error);
    }
  }, 1000000); // Every 5 minutes

  await notificationListener.start();
  console.log("======== VCMilei System Initialized =========");

  // Set up API routes
  app.post('/api/chat', async (c) => {
    try {
      const body = await c.req.json();
      const response = await vcMileiAgent.handleRequest(body);
      return c.json(response);
    } catch (error) {
      console.error('Error handling request:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // Start server
  serve({
    fetch: app.fetch,
    port: Number(port)
  }, (info) => {
    console.log(`[🚀] Server is running on http://localhost:${info.port}`);
  });
};

startSystem().catch(console.error);