/**
 * Vercel API Route: Memory Graph
 * Fetches memories and connections in D3-compatible format
 */

import { createClient } from '@supabase/supabase-js';

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

    const { userId, filters } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    console.log(`[Memory Graph] Fetching graph for user: ${userId}`);

    // Build query for memories
    let memoriesQuery = supabase
      .from('user_memories')
      .select('id, content, content_type, tags, created_at, metadata')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters) {
      if (filters.contentType && filters.contentType !== 'all') {
        memoriesQuery = memoriesQuery.eq('content_type', filters.contentType);
      }
      if (filters.dateFrom) {
        memoriesQuery = memoriesQuery.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        memoriesQuery = memoriesQuery.lte('created_at', filters.dateTo);
      }
    }

    memoriesQuery = memoriesQuery.limit(100);

    const { data: memories, error: memoriesError } = await memoriesQuery;

    if (memoriesError) {
      throw new Error(`Failed to fetch memories: ${memoriesError.message}`);
    }

    console.log(`[Memory Graph] Found ${memories.length} memories`);

    // Color map for content types
    const colorMap = {
      'research': '#3b82f6',
      'video': '#ef4444',
      'creative': '#a855f7',
      'conversation': '#10b981',
      'panel': '#10b981',
      'consensus': '#10b981',
      'debate': '#10b981',
      'code': '#f59e0b',
      'settings': '#6b7280',
      'manual': '#6b7280'
    };

    // Convert memories to D3 nodes
    const nodes = memories.map(memory => ({
      id: memory.id,
      label: memory.content.substring(0, 50) + (memory.content.length > 50 ? '...' : ''),
      fullContent: memory.content,
      type: memory.content_type,
      tags: memory.tags || [],
      color: colorMap[memory.content_type] || '#6b7280',
      createdAt: memory.created_at,
      size: 10,
      metadata: memory.metadata
    }));

    // Calculate connections based on shared tags
    const links = [];
    if (memories.length > 1) {
      for (let i = 0; i < memories.length - 1; i++) {
        for (let j = i + 1; j < memories.length; j++) {
          const memory1 = memories[i];
          const memory2 = memories[j];
          
          const tags1 = memory1.tags || [];
          const tags2 = memory2.tags || [];
          const sharedTags = tags1.filter(tag => tags2.includes(tag));

          if (sharedTags.length > 0) {
            const strength = sharedTags.length / Math.max(tags1.length, tags2.length);
            
            links.push({
              source: memory1.id,
              target: memory2.id,
              strength,
              sharedTags,
              type: 'tag-based'
            });
          }
        }
      }
    }

    // Try to fetch stored connections
    if (memories.length > 0) {
      const memoryIds = memories.map(m => m.id);
      const { data: storedConnections } = await supabase
        .from('memory_connections')
        .select('*')
        .or(`source_memory_id.in.(${memoryIds.join(',')}),target_memory_id.in.(${memoryIds.join(',')})`);

      if (storedConnections && storedConnections.length > 0) {
        for (const conn of storedConnections) {
          // Avoid duplicates
          const exists = links.some(l => 
            (l.source === conn.source_memory_id && l.target === conn.target_memory_id) ||
            (l.source === conn.target_memory_id && l.target === conn.source_memory_id)
          );

          if (!exists) {
            links.push({
              source: conn.source_memory_id,
              target: conn.target_memory_id,
              strength: conn.strength,
              type: conn.connection_type
            });
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      nodes,
      links,
      stats: {
        nodeCount: nodes.length,
        linkCount: links.length,
        contentTypes: [...new Set(memories.map(m => m.content_type))]
      }
    });

  } catch (error) {
    console.error('[Memory Graph] Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch memory graph',
      details: error.message
    });
  }
}
