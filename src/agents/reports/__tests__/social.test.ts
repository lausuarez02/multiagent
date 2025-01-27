import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { SocialAgent } from '../social/index';
import { db } from '../../../memory/db';
import { generateText } from 'ai';

// Mock the db and generateText functions
vi.mock('../../../memory/db', () => ({
  db: {
    saveMemory: vi.fn().mockResolvedValueOnce(undefined),
  },
}));

vi.mock('ai', async () => {
  const actual = await import('ai');
  return {
    ...actual,
    generateText: vi.fn(),
  };
});

describe('SocialAgent', () => {
  let socialAgent: SocialAgent;

  beforeEach(() => {
    socialAgent = new SocialAgent('TestSocialAgent');
    vi.clearAllMocks();
  });

  it('should handle social request and generate a report', async () => {
    const mockData = { dateRange: '2023-01-01 to 2023-01-31' };
    const mockResponse = { text: 'Social report content' };

    // Mock the generateText function to return a predefined response
    (generateText as Mock).mockResolvedValueOnce(mockResponse);

    await socialAgent.handleSocialRequest(mockData);

    // Check if generateText was called with the correct parameters
    expect(generateText).toHaveBeenCalledWith(expect.objectContaining({
      messages: [
        {
          role: "user",
          content: `Date Range: ${mockData.dateRange}`,
        },
      ],
    }));

    // Check if the report was saved to the database
    expect(db.saveMemory).toHaveBeenCalledWith(mockResponse.text, 'Analysis');
  });

  it('should log the correct message when generating a report', async () => {
    const consoleSpy = vi.spyOn(console, 'log');
    const mockData = { dateRange: '2023-01-01 to 2023-01-31' };
    const mockResponse = { text: 'Social report content' };

    (generateText as Mock).mockResolvedValueOnce(mockResponse);

    await socialAgent.handleSocialRequest(mockData);

    expect(consoleSpy).toHaveBeenCalledWith(`[TestSocialAgent] Social report generated: ${mockResponse.text}`);
  });
});