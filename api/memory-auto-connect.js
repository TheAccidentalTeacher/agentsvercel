/**
 * Vercel API Route: Memory Auto-Connect
 * Automatic connection detection between memories
 */

import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 60
};

// Thresholds for connection detection
const THRESHOLDS = {
  semantic: 0.75,
  tag: 0.3,
  temporal: 0.1,
  combined: 0.5
};

const WEIGHTS = {
  semantic: 0.5,
  tag: 0.3,
  temporal: 0.2
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
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { userId, memoryIds } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    console.log(`🔗 [Auto-Connect] Starting for user: ${userId}`);

    // Fetch all user memories with embeddings
    const { data: memories, error: fetchError } = await supabase
      .from('user_memories')
      .select('id, title, content, content_type, tags, embedding, created_at')
      .eq('user_id', userId);

    if (fetchError) {
      throw new Error(`Failed to fetch memories: ${fetchError.message}`);
    }

    console.log(`📊 [Auto-Connect] Found ${memories.length} memories`);

    const targetMemories = memoryIds 
      ? memories.filter(m => memoryIds.includes(m.id))
      : memories;

    if (targetMemories.length === 0) {
      return res.status(200).json({ 
        connectionsCreated: 0,
        message: 'No memories to process'
      });
    }

    const connections = await detectConnections(supabase, targetMemories, memories, userId);

    console.log(`✅ [Auto-Connect] Created ${connections.length} new connections`);

    return res.status(200).json({
      success: true,
      connectionsCreated: connections.length,
      connections: connections.map(c => ({
        sourceId: c.source_memory_id,
        targetId: c.target_memory_id,
        strength: c.strength,
        type: c.connection_type
      }))
    });

  } catch (error) {
    console.error('❌ [Auto-Connect] Error:', error);
    return res.status(500).json({
      error: 'Failed to auto-connect memories',
      details: error.message
    });
  }
}

async function detectConnections(supabase, targetMemories, allMemories, userId) {
  const newConnections = [];

  for (const source of targetMemories) {
    for (const target of allMemories) {
      if (source.id === target.id) continue;

      // Calculate semantic similarity
      const semanticStrength = calculateSemanticSimilarity(source.embedding, target.embedding);
      
      // Calculate tag overlap
      const tagStrength = calculateTagOverlap(source.tags || [], target.tags || []);
      
      // Calculate temporal proximity
      const temporalStrength = calculateTemporalProximity(source.created_at, target.created_at);
      
      // Combined strength
      const combinedStrength = 
        semanticStrength * WEIGHTS.semantic +
        tagStrength * WEIGHTS.tag +
        temporalStrength * WEIGHTS.temporal;

      if (combinedStrength >= THRESHOLDS.combined) {
        // Check if connection already exists
        const { data: existing } = await supabase
          .from('memory_connections')
          .select('id')
          .or(`and(source_memory_id.eq.${source.id},target_memory_id.eq.${target.id}),and(source_memory_id.eq.${target.id},target_memory_id.eq.${source.id})`)
          .limit(1);

        if (!existing || existing.length === 0) {
          const connectionType = semanticStrength >= THRESHOLDS.semantic ? 'semantic' 
            : tagStrength >= THRESHOLDS.tag ? 'tag' 
            : 'temporal';

          const { data: newConn, error } = await supabase
            .from('memory_connections')
            .insert({
              source_memory_id: source.id,
              target_memory_id: target.id,
              connection_type: connectionType,
              strength: combinedStrength,
              user_id: userId
            })
            .select()
            .single();

          if (!error && newConn) {
            newConnections.push(newConn);
          }
        }
      }
    }
  }

  return newConnections;
}

function calculateSemanticSimilarity(embedding1, embedding2) {
  if (!embedding1 || !embedding2) return 0;
  
  // Cosine similarity
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }
  
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2)) || 0;
}

function calculateTagOverlap(tags1, tags2) {
  if (!tags1.length || !tags2.length) return 0;
  
  const set1 = new Set(tags1.map(t => t.toLowerCase()));
  const set2 = new Set(tags2.map(t => t.toLowerCase()));
  
  let overlap = 0;
  for (const tag of set1) {
    if (set2.has(tag)) overlap++;
  }
  
  return overlap / Math.max(set1.size, set2.size);
}

function calculateTemporalProximity(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffDays = Math.abs(d1 - d2) / (1000 * 60 * 60 * 24);
  
  // Decay over 30 days
  return Math.max(0, 1 - diffDays / 30);
}
