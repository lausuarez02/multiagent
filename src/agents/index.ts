import type { Account } from "viem";
import { MarketAgent } from "./reports/market";
import { NewsAgent } from "./reports/news";
import { SocialAgent } from "./reports/social";
import figlet from "figlet";
import chalk from "chalk";
import { VCMileiAgent } from "./vcmilei";

/**
 * Registers the agents and returns factory functions to initialize them on demand
 * @returns The agent factories
 */
export const registerAgentFactories = () => {
  console.log(chalk.white.bgMagenta(figlet.textSync("VCMILEI")));
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
  console.log(chalk.magenta("======== Preparing agent factories ========="));

  // Factory functions to initialize agents on demand
  const createMarketAgent = () => {
    console.log(chalk.cyan(`[registerAgentFactories] initializing market agent...`));
    const agent = new MarketAgent("MarketLady");
    console.log(chalk.green(`[registerAgentFactories] MarketLady agent initialized.`));
    return agent;
  };

  const createNewsAgent = () => {
    console.log(chalk.yellow(`
       _________
      |_________|  📰
      |  NEWS   |==)     
      |         |        
      | .-"""-. |        
      | | O O | |        
      | |  ^  | |        
      |_|     |_|        
    `));
    console.log(chalk.cyan(`[registerAgentFactories] initializing news agent...`));
    const agent = new NewsAgent("NewsAgent");
    console.log(chalk.green(`[registerAgentFactories] NewsAgent initialized.`));
    return agent;
  };

  const createSocialAgent = () => {
    console.log(chalk.blue(`
         ___________
        /  .-.-.   \\
       /  (  0 0  ) \\
      /    |  ^  |   \\
     /      \\---/     \\
    /        📱        \\
    \\________________/
          |  |
          |  |
          |  |
          |__|
    `));
    console.log(chalk.cyan(`[registerAgentFactories] initializing social agent...`));
    const agent = new SocialAgent("SocialAgent");
    console.log(chalk.green(`[registerAgentFactories] SocialAgent initialized.`));
    return agent;
  };

  const createVCMileiAgent = () => {
    // Simulate animation with multiple frames
    const frames = [
      chalk.magenta(`
                       ##%%%%#####     VIVA            
                      #%%@@%%######*   LA              
                     %%@@@@%%%#%%#%##  LIBERTAD       
                    #%@@#++=-::::-%### CARAJO!!!     
                   #%%@#+=--::::::+###               
                    #%%*#@@%*+#%%#-%%#               
                    %%#*%@@@*-@@@%*%%   🚀 TO    
                     %%*+**+=-=++=+*#      MARS!     
                      %*+=-===:-:--#                 
                     #@@*+==+=--=+%+-                
                    #*#@@%*+===+%%#+-                
                ##%%%%%%@@@@@@%@@%%#*+===            
            @@%%%#%%%%%%%%@@@@@@%%#***++#+=          
      `),
      chalk.magenta(`
                       ##%%%%#####     VIVA            
                      #%%@@%%######*   LA              
                     %%@@@@%%%#%%#%##  LIBERTAD       
                    #%@@#++=-::::-%### CARAJO!!!     
                   #%%@#+=--::::::+###     🌟         
                    #%%*#@@%*+#%%#-%%#               
                    %%#*%@@@*-@@@%*%%   🚀 TO    
                     %%*+**+=-=++=+*#      MARS!     
                      %*+=-===:-:--#        ⭐        
                     #@@*+==+=--=+%+-                
                    #*#@@%*+===+%%#+-       💫       
                ##%%%%%%@@@@@@%@@%%#*+===            
            @@%%%#%%%%%%%%@@@@@@%%#***++#+=     ✨    
      `)
    ];

    // Print each frame
    frames.forEach((frame, i) => {
      console.log('\x1Bc'); // Clear console
      console.log(frame);
      if (i < frames.length - 1) {
        setTimeout(() => {}, 500); // Add small delay between frames
      }
    });

    console.log(chalk.cyan(`[registerAgentFactories] initializing VCMilei agent...`));
    const agent = new VCMileiAgent("VCMilei");
    console.log(chalk.green(`[registerAgentFactories] VCMilei agent initialized.`));
    return agent;
  };

  console.log(chalk.magenta(`[registerAgentFactories] all agent factories prepared.`));

  return {
    createMarketAgent,
    createNewsAgent,
    createSocialAgent,
    createVCMileiAgent,
  };
};