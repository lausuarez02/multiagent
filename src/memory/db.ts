import { createClient } from '@supabase/supabase-js';
import { OpenAIEmbeddings } from '@ai-sdk/openai';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// Initialize OpenAI embeddings
const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY!
});

export interface Investment {
  id: string;
  project_name: string;
  amount: number;
  network: 'Solana' | 'Mode';
  decision_date: Date;
  status: 'Completed' | 'Pending' | 'Failed';
  reasoning: string;
  bullish_summary: string;
  bearish_summary: string;
  legal_validation: boolean;
  transaction_hash?: string;
}

export interface AnalysisReport {
  id: string;
  investment_id: string;
  report_type: 'Market' | 'News' | 'Social';
  content: any;
  date: Date;
  embedding: number[];
}

export interface Memory {
  id: string;
  content: string;
  type: 'Investment' | 'Analysis' | 'Learning';
  embedding: number[];
  created_at: Date;
  relevance_score?: number;
}

// Database operations
export const db = {
  // Investment operations
  async saveInvestment(investment: Omit<Investment, 'id'>) {
    const { data, error } = await supabase
      .from('investments')
      .insert(investment)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getInvestmentHistory() {
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .order('decision_date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Analysis operations
  async saveAnalysisReport(report: Omit<AnalysisReport, 'id' | 'embedding'>) {
    const embedding = await embeddings.embedQuery(JSON.stringify(report.content));
    
    const { data, error } = await supabase
      .from('analysis_reports')
      .insert({ ...report, embedding })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Memory operations with RAG support
  async saveMemory(content: string, type: Memory['type']) {
    const embedding = await embeddings.embedQuery(content);
    
    const { data, error } = await supabase
      .from('memories')
      .insert({
        content,
        type,
        embedding,
        created_at: new Date()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async searchSimilarMemories(query: string, limit: number = 5) {
    const queryEmbedding = await embeddings.embedQuery(query);
    
    const { data, error } = await supabase.rpc('match_memories', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: limit
    });
    
    if (error) throw error;
    return data;
  }
};