/**
 * Search Orchestrator - Multi-Source Search with Deduplication
 * 
 * Combines results from multiple search providers:
 * - SerpAPI (Google Search)
 * - Tavily (AI-optimized search)
 * 
 * Features:
 * - Parallel search execution
 * - URL deduplication
 * - Relevance scoring and ranking
 * - Source attribution
 */

class SearchOrchestrator {
  constructor(options = {}) {
    this.serpApiKey = options.serpApiKey || process.env.SERP_API_KEY;
    this.tavilyApiKey = options.tavilyApiKey || process.env.TAVILY_API_KEY;
    this.maxResults = options.maxResults || 10;
  }

  /**
   * Search across all available providers
   * @param {string} query - Search query
   * @param {object} options - Search options
   * @returns {Promise<Array>} - Deduplicated and ranked results
   */
  async search(query, options = {}) {
    const startTime = Date.now();
    console.log(`[SearchOrchestrator] Starting search for: "${query}"`);

    // Execute searches in parallel
    const searchPromises = [];

    if (this.serpApiKey) {
      searchPromises.push(this.searchSerpAPI(query, options));
    }

    if (this.tavilyApiKey) {
      searchPromises.push(this.searchTavily(query, options));
    }

    if (searchPromises.length === 0) {
      throw new Error('No search API keys configured. Please add SERP_API_KEY or TAVILY_API_KEY to .env');
    }

    // Wait for all searches to complete
    const results = await Promise.allSettled(searchPromises);

    // Extract successful results
    const allResults = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allResults.push(...result.value);
      } else {
        console.error(`[SearchOrchestrator] Search provider ${index} failed:`, result.reason);
      }
    });

    // Deduplicate by URL
    const deduplicated = this.deduplicateResults(allResults);

    // Score and rank
    const ranked = this.rankResults(deduplicated, query);

    // Limit to max results
    const final = ranked.slice(0, this.maxResults);

    const duration = Date.now() - startTime;
    console.log(`[SearchOrchestrator] Search complete: ${final.length} results in ${duration}ms`);

    return {
      results: final,
      stats: {
        totalSources: allResults.length,
        afterDeduplication: deduplicated.length,
        finalResults: final.length,
        duration,
        query
      }
    };
  }

  /**
   * Search using SerpAPI (Google Search)
   */
  async searchSerpAPI(query, options = {}) {
    if (!this.serpApiKey) return [];

    try {
      console.log('[SearchOrchestrator] Searching SerpAPI...');
      
      const params = new URLSearchParams({
        q: query,
        api_key: this.serpApiKey,
        engine: 'google',
        num: options.numResults || 10,
        gl: options.country || 'us',
        hl: options.language || 'en'
      });

      const response = await fetch(`https://serpapi.com/search?${params}`);
      
      if (!response.ok) {
        throw new Error(`SerpAPI error: ${response.status}`);
      }

      const data = await response.json();
      
      // Extract organic results
      const results = (data.organic_results || []).map(result => ({
        title: result.title,
        url: result.link,
        snippet: result.snippet,
        source: 'serpapi',
        position: result.position,
        displayedLink: result.displayed_link,
        date: result.date || null
      }));

      console.log(`[SearchOrchestrator] SerpAPI returned ${results.length} results`);
      return results;

    } catch (error) {
      console.error('[SearchOrchestrator] SerpAPI error:', error.message);
      return [];
    }
  }

  /**
   * Search using Tavily (AI-optimized search)
   */
  async searchTavily(query, options = {}) {
    if (!this.tavilyApiKey) return [];

    try {
      console.log('[SearchOrchestrator] Searching Tavily...');

      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: this.tavilyApiKey,
          query: query,
          search_depth: options.searchDepth || 'basic', // 'basic' or 'advanced'
          max_results: options.numResults || 10,
          include_answer: true,
          include_raw_content: false,
          include_images: false
        })
      });

      if (!response.ok) {
        throw new Error(`Tavily error: ${response.status}`);
      }

      const data = await response.json();

      // Store the AI-generated answer separately
      const aiAnswer = data.answer || null;

      // Extract results
      const results = (data.results || []).map((result, index) => ({
        title: result.title,
        url: result.url,
        snippet: result.content,
        source: 'tavily',
        position: index + 1,
        score: result.score || 0,
        publishedDate: result.published_date || null
      }));

      console.log(`[SearchOrchestrator] Tavily returned ${results.length} results`);
      
      // Return both results and AI answer
      return results.map(r => ({ ...r, aiAnswer: aiAnswer }));

    } catch (error) {
      console.error('[SearchOrchestrator] Tavily error:', error.message);
      return [];
    }
  }

  /**
   * Deduplicate results by URL
   */
  deduplicateResults(results) {
    const seen = new Map();

    for (const result of results) {
      const normalizedUrl = this.normalizeUrl(result.url);
      
      if (!seen.has(normalizedUrl)) {
        seen.set(normalizedUrl, result);
      } else {
        // If duplicate, merge data (prefer higher scores)
        const existing = seen.get(normalizedUrl);
        if ((result.score || 0) > (existing.score || 0)) {
          // Keep result with higher score, but track sources
          result.sources = [existing.source, result.source];
          seen.set(normalizedUrl, result);
        } else {
          existing.sources = existing.sources || [existing.source];
          if (!existing.sources.includes(result.source)) {
            existing.sources.push(result.source);
          }
        }
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Normalize URL for comparison
   */
  normalizeUrl(url) {
    try {
      const parsed = new URL(url);
      // Remove www, trailing slashes, common tracking params
      let normalized = parsed.hostname.replace(/^www\./, '') + parsed.pathname;
      normalized = normalized.replace(/\/$/, '');
      return normalized.toLowerCase();
    } catch (error) {
      return url.toLowerCase();
    }
  }

  /**
   * Rank results by relevance
   */
  rankResults(results, query) {
    const queryTerms = query.toLowerCase().split(/\s+/);

    return results.map(result => {
      let score = 0;

      // Base score from Tavily if available
      if (result.score) {
        score += result.score * 10;
      }

      // Position bonus (earlier = better)
      if (result.position) {
        score += Math.max(0, 10 - result.position);
      }

      // Title relevance
      const titleLower = (result.title || '').toLowerCase();
      queryTerms.forEach(term => {
        if (titleLower.includes(term)) score += 5;
      });

      // Snippet relevance
      const snippetLower = (result.snippet || '').toLowerCase();
      queryTerms.forEach(term => {
        if (snippetLower.includes(term)) score += 2;
      });

      // Multiple source bonus
      if (result.sources && result.sources.length > 1) {
        score += 3;
      }

      // Recency bonus (if date available)
      if (result.date || result.publishedDate) {
        const dateStr = result.date || result.publishedDate;
        const date = new Date(dateStr);
        const daysSince = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < 30) score += 5;
        else if (daysSince < 90) score += 3;
        else if (daysSince < 365) score += 1;
      }

      return { ...result, relevanceScore: score };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Get search statistics
   */
  getStats() {
    return {
      serpApiConfigured: !!this.serpApiKey,
      tavilyConfigured: !!this.tavilyApiKey,
      maxResults: this.maxResults
    };
  }
}

// Export for CommonJS (Netlify Functions)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SearchOrchestrator };
}
