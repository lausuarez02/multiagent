import 'dotenv/config';
import { serve } from '@hono/node-server';
import { app } from "./app";
import { registerAgentFactories } from "./agents";

console.log(`[🚀] starting VCMILEI multiagent system...`);

// Initialize agent factories but don't run them
const { createNewsAgent, createSocialAgent, createVCMileiAgent } = registerAgentFactories();

// Set up your API endpoints to trigger the agents
app.post('/api/news', async (c) => {
  try {
    const newsAgent = createNewsAgent();
    const body = await c.req.json();
    const response = await newsAgent.handleNewsRequest(body);

    if (!response.success) {
      return c.json({ 
        success: false, 
        error: response.error 
      }, 400);
    }

    return c.json({
      success: true,
      data: response.data,
      timestamp: response.timestamp
    }, 200);

  } catch (error: any) {
    console.error('[API] News endpoint error:', error.message);
    return c.json({ 
      success: false, 
      error: error.message || 'Internal server error'
    }, 500);
  }
});

app.post('/api/social', async (c) => {
  try {
    const socialAgent = createSocialAgent();
    const body = await c.req.json();
    const response = await socialAgent.handleSocialRequest(body);

    if (!response.success) {
      return c.json({ 
        success: false, 
        error: response.error 
      }, 400);
    }

    return c.json({
      success: true,
      data: response.data,
      timestamp: response.timestamp
    }, 200);

  } catch (error: any) {
    console.error('[API] Social endpoint error:', error.message);
    return c.json({ 
      success: false, 
      error: error.message || 'Internal server error'
    }, 500);
  }
});

app.post('/api/vcmilei', async (c) => {
  try {
    const vcmileiAgent = createVCMileiAgent();
    const body = await c.req.json();
    const response = await vcmileiAgent.handleRequest(body);

    if (!response.success) {
      return c.json({ 
        success: false, 
        error: response.error 
      }, 400);
    }

    return c.json({
      success: true,
      data: response.data,
      timestamp: response.timestamp
    }, 200);

  } catch (error: any) {
    console.error('[API] VCMilei endpoint error:', error.message);
    return c.json({ 
      success: false, 
      error: error.message || 'Internal server error'
    }, 500);
  }
});

// Start the server
const port = process.env.PORT || 3000;
serve({
  fetch: app.fetch,
  port: Number(port),
}, (info:any) => {
  console.log(`[🚀] Server is running on http://localhost:${info.port}`);
});