/**
 * Research API Endpoint
 * 
 * Provides multi-source search capabilities for the research module.
 * 
 * POST /api/research
 * Body: { query, options }
 * Returns: { results, stats }
 */

const { SearchOrchestrator } = require('../../research/search-orchestrator.cjs');

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('[Research API] Request received');
    
    // Parse request body
    const { query, options = {} } = JSON.parse(event.body || '{}');

    // Validate query
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Query is required and must be a non-empty string' 
        })
      };
    }

    console.log(`[Research API] Query: "${query}"`);

    // Initialize search orchestrator
    const orchestrator = new SearchOrchestrator({
      serpApiKey: process.env.SERP_API_KEY,
      tavilyApiKey: process.env.TAVILY_API_KEY,
      maxResults: options.maxResults || 10
    });

    // Check if any API keys are configured
    const stats = orchestrator.getStats();
    if (!stats.serpApiConfigured && !stats.tavilyConfigured) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'No search API keys configured',
          message: 'Please add SERP_API_KEY or TAVILY_API_KEY to your environment variables',
          documentation: 'See PHASE_6_IMPLEMENTATION_PLAN.md for setup instructions'
        })
      };
    }

    // Execute search
    const startTime = Date.now();
    const searchResults = await orchestrator.search(query, options);
    const duration = Date.now() - startTime;

    console.log(`[Research API] Search completed in ${duration}ms: ${searchResults.results.length} results`);

    // Return results
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        query,
        results: searchResults.results,
        stats: {
          ...searchResults.stats,
          apiStats: stats,
          totalDuration: duration
        },
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('[Research API] Error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
