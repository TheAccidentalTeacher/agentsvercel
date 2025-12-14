/**
 * Research API Endpoint
 * 
 * Provides multi-source search and content extraction capabilities.
 * 
 * POST /api/research
 * Body: { query, options: { maxResults, extractContent } }
 * Returns: { results, extractedContent, stats }
 */

const { SearchOrchestrator } = require('../../research/search-orchestrator.cjs');
const { ContentExtractor } = require('../../research/content-extractor.cjs');
const { ContentChunker } = require('../../research/content-chunker.cjs');

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
    const { 
      maxResults = 10, 
      extractContent = false,
      maxExtract = 5 
    } = options;

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
    console.log(`[Research API] Options:`, { maxResults, extractContent, maxExtract });

    // Initialize search orchestrator
    const orchestrator = new SearchOrchestrator({
      serpApiKey: process.env.SERP_API_KEY,
      tavilyApiKey: process.env.TAVILY_API_KEY,
      maxResults: maxResults
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
          documentation: 'See PHASE_6_SETUP.md for setup instructions'
        })
      };
    }

    // Execute search
    const startTime = Date.now();
    const searchResults = await orchestrator.search(query, options);
    const searchDuration = Date.now() - startTime;

    console.log(`[Research API] Search completed in ${searchDuration}ms: ${searchResults.results.length} results`);

    // Extract content if requested
    let extractedContent = [];
    let chunks = [];
    let extractDuration = 0;

    if (extractContent && searchResults.results.length > 0) {
      console.log(`[Research API] Extracting content from top ${maxExtract} results...`);
      
      const extractStartTime = Date.now();
      const extractor = new ContentExtractor({ timeout: 15000 });
      
      // Get top N URLs
      const urlsToExtract = searchResults.results
        .slice(0, Math.min(maxExtract, searchResults.results.length))
        .map(r => r.url);

      extractedContent = await extractor.extractMultiple(urlsToExtract, {
        batchSize: 3
      });

      extractDuration = Date.now() - extractStartTime;

      const successfulExtractions = extractedContent.filter(e => !e.error);
      console.log(`[Research API] Content extraction completed in ${extractDuration}ms: ${successfulExtractions.length}/${urlsToExtract.length} successful`);

      // Chunk the extracted content
      if (successfulExtractions.length > 0) {
        console.log(`[Research API] Chunking content for LLM processing...`);
        const chunker = new ContentChunker({
          maxChunkSize: 4000,
          minChunkSize: 1000,
          overlapSize: 200
        });

        chunks = chunker.chunkMultiple(successfulExtractions);
        console.log(`[Research API] Created ${chunks.length} chunks`);
      }
    }

    const totalDuration = Date.now() - startTime;

    // Return results
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        query,
        results: searchResults.results,
        extractedContent,
        chunks,
        stats: {
          ...searchResults.stats,
          apiStats: stats,
          searchDuration,
          extractDuration,
          totalDuration,
          extractedCount: extractedContent.filter(e => !e.error).length,
          chunkCount: chunks.length
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
