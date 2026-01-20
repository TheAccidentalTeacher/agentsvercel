/**
 * Vercel API Route: Deep Research
 * Multi-source search with AI consortium analysis
 */

import Anthropic from '@anthropic-ai/sdk';

export const config = {
  maxDuration: 60
};

export default async function handler(req, res) {
  const startTime = Date.now();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, options = {} } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`[Deep Research] Starting for: "${query}"`);

    // Phase 1: Search
    const searchResults = await performSearch(query, options);
    console.log(`[Deep Research] Found ${searchResults.length} results`);

    if (searchResults.length === 0) {
      return res.status(200).json({
        query,
        results: [],
        analysis: null,
        message: 'No search results found',
        stats: { duration: Date.now() - startTime }
      });
    }

    // Phase 2: Extract content from top results
    const extractedContent = await extractContent(searchResults.slice(0, 5));
    console.log(`[Deep Research] Extracted ${extractedContent.length} pages`);

    // Phase 3: AI Analysis
    const analysis = await analyzeWithAI(query, extractedContent, options);

    const totalDuration = Date.now() - startTime;

    return res.status(200).json({
      query,
      timestamp: new Date().toISOString(),
      searchResults: {
        count: searchResults.length,
        results: searchResults.slice(0, 10)
      },
      contentAnalysis: {
        urlsExtracted: extractedContent.length,
        sources: extractedContent.map(c => ({
          url: c.url,
          title: c.title,
          contentLength: c.content?.length || 0
        }))
      },
      analysis,
      stats: {
        totalDuration,
        resultCount: searchResults.length
      }
    });

  } catch (error) {
    console.error('[Deep Research] Error:', error);
    return res.status(500).json({
      error: 'Deep research failed',
      details: error.message
    });
  }
}

async function performSearch(query, options) {
  const results = [];
  const tavilyKey = process.env.TAVILY_API_KEY;

  if (tavilyKey) {
    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: tavilyKey,
          query,
          search_depth: 'advanced',
          max_results: options.maxResults || 20,
          include_answer: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        results.push(...(data.results || []).map(r => ({
          title: r.title,
          url: r.url,
          snippet: r.content,
          source: 'tavily'
        })));
      }
    } catch (error) {
      console.error('[Deep Research] Tavily error:', error.message);
    }
  }

  return results;
}

async function extractContent(results) {
  const extracted = [];

  for (const result of results) {
    try {
      const response = await fetch(result.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ResearchBot/1.0)'
        }
      });

      if (response.ok) {
        const html = await response.text();
        const text = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 8000);

        extracted.push({
          url: result.url,
          title: result.title,
          content: text
        });
      }
    } catch (error) {
      console.error(`[Deep Research] Extract error for ${result.url}:`, error.message);
    }
  }

  return extracted;
}

async function analyzeWithAI(query, content, options) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  
  if (!anthropicKey) {
    return {
      summary: 'AI analysis not available - ANTHROPIC_API_KEY not configured',
      insights: []
    };
  }

  const anthropic = new Anthropic({ apiKey: anthropicKey });

  const contentSummary = content.map(c => 
    `Source: ${c.title}\nURL: ${c.url}\nContent: ${c.content.substring(0, 2000)}`
  ).join('\n\n---\n\n');

  const message = await anthropic.messages.create({
    model: options.model || 'claude-sonnet-4-5-20250929',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `You are a research analyst. Analyze these sources to answer: "${query}"

${contentSummary}

Provide:
1. A comprehensive summary
2. Key insights and findings
3. Areas of consensus and disagreement
4. Recommendations for further research

Format as JSON with keys: summary, insights (array), consensus, disagreements, recommendations`
    }]
  });

  try {
    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { summary: responseText, insights: [] };
  } catch {
    return { summary: message.content[0].text, insights: [] };
  }
}
