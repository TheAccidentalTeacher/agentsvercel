/**
 * Vercel API Route: Research API
 * Multi-source search and content extraction
 */

export const config = {
  maxDuration: 60
};

export default async function handler(req, res) {
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
    console.log('[Research API] Request received');
    
    const { query, options = {} } = req.body;
    const { 
      maxResults = 10, 
      extractContent = false,
      maxExtract = 5
    } = options;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Query is required and must be a non-empty string' 
      });
    }

    console.log(`[Research API] Query: "${query}"`);

    const tavilyKey = process.env.TAVILY_API_KEY;
    const serpApiKey = process.env.SERP_API_KEY;

    if (!tavilyKey && !serpApiKey) {
      return res.status(500).json({
        error: 'No search API keys configured',
        message: 'Please add TAVILY_API_KEY or SERP_API_KEY to your environment variables'
      });
    }

    const startTime = Date.now();
    let searchResults = [];

    // Try Tavily first
    if (tavilyKey) {
      try {
        const tavilyResponse = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: tavilyKey,
            query: query,
            search_depth: 'advanced',
            max_results: maxResults,
            include_answer: true
          })
        });

        if (tavilyResponse.ok) {
          const data = await tavilyResponse.json();
          searchResults = (data.results || []).map(r => ({
            title: r.title,
            url: r.url,
            snippet: r.content,
            source: 'tavily'
          }));
        }
      } catch (error) {
        console.error('[Research API] Tavily error:', error.message);
      }
    }

    // Fallback to SerpAPI if Tavily failed or not configured
    if (searchResults.length === 0 && serpApiKey) {
      try {
        const serpUrl = new URL('https://serpapi.com/search');
        serpUrl.searchParams.append('q', query);
        serpUrl.searchParams.append('api_key', serpApiKey);
        serpUrl.searchParams.append('num', maxResults.toString());

        const serpResponse = await fetch(serpUrl.toString());
        
        if (serpResponse.ok) {
          const data = await serpResponse.json();
          searchResults = (data.organic_results || []).map(r => ({
            title: r.title,
            url: r.link,
            snippet: r.snippet,
            source: 'serpapi'
          }));
        }
      } catch (error) {
        console.error('[Research API] SerpAPI error:', error.message);
      }
    }

    const searchDuration = Date.now() - startTime;
    console.log(`[Research API] Search completed in ${searchDuration}ms: ${searchResults.length} results`);

    // Extract content if requested
    let extractedContent = [];
    if (extractContent && searchResults.length > 0) {
      const urlsToExtract = searchResults.slice(0, maxExtract).map(r => r.url);
      extractedContent = await extractContentFromUrls(urlsToExtract);
    }

    const totalDuration = Date.now() - startTime;

    return res.status(200).json({
      query,
      results: searchResults,
      extractedContent,
      stats: {
        totalResults: searchResults.length,
        extractedCount: extractedContent.filter(e => !e.error).length,
        searchDuration,
        totalDuration
      }
    });

  } catch (error) {
    console.error('[Research API] Error:', error);
    return res.status(500).json({
      error: 'Research request failed',
      details: error.message
    });
  }
}

async function extractContentFromUrls(urls) {
  const results = [];
  
  for (const url of urls) {
    try {
      const response = await fetch(url, {
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
          .substring(0, 5000);

        results.push({
          url,
          text,
          wordCount: text.split(/\s+/).length,
          success: true
        });
      } else {
        results.push({ url, error: `HTTP ${response.status}`, success: false });
      }
    } catch (error) {
      results.push({ url, error: error.message, success: false });
    }
  }
  
  return results;
}
