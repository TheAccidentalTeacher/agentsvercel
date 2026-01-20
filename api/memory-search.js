/**
 * Vercel API Route: Memory Search
 * Hybrid vector + full-text search across saved memories
 */

import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 30
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const {
      query,
      userId,
      filters = {},
      limit = 20,
      similarityThreshold = 0.7
    } = req.body;

    console.log('[Memory Search] Query:', query, 'User:', userId);

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query text is required' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Generate embedding for search query
    const queryEmbedding = await generateQueryEmbedding(query);
    console.log('[Memory Search] Embedding generated');

    // Call the search_memories database function
    const { data: searchResults, error: searchError } = await supabase
      .rpc('search_memories', {
        query_embedding: queryEmbedding,
        query_text: query,
        p_user_id: userId,
        similarity_threshold: similarityThreshold,
        match_limit: limit,
        content_type_filter: filters.contentType || null
      });

    if (searchError) {
      console.error('[Memory Search] Search error:', searchError);
      throw new Error(`Search failed: ${searchError.message}`);
    }

    console.log(`[Memory Search] Found ${searchResults?.length || 0} results`);

    // Format results
    const formattedResults = (searchResults || []).map(memory => ({
      id: memory.id,
      content: memory.content,
      contentType: memory.content_type,
      tags: memory.tags || [],
      similarity: memory.similarity,
      createdAt: memory.created_at,
      metadata: memory.metadata
    }));

    return res.status(200).json({
      success: true,
      query,
      results: formattedResults,
      count: formattedResults.length
    });

  } catch (error) {
    console.error('[Memory Search] Error:', error);
    return res.status(500).json({
      error: 'Memory search failed',
      details: error.message
    });
  }
}

async function generateQueryEmbedding(query) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: query,
      encoding_format: 'float'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}
