/**
 * Vercel API Route: Memory Analytics
 * Calculate and return memory analytics
 */

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const userId = req.query.userId || 'demo-user';

    console.log(`📊 Calculating analytics for user: ${userId}`);

    // Fetch all memories
    const { data: memories, error: memoriesError } = await supabase
      .from('user_memories')
      .select('*')
      .eq('user_id', userId);

    if (memoriesError) {
      throw new Error(`Memories fetch failed: ${memoriesError.message}`);
    }

    // Fetch connections
    let connections = [];
    if (memories && memories.length > 0) {
      const memoryIds = memories.map(m => m.id);
      const { data: conns, error: connectionsError } = await supabase
        .from('memory_connections')
        .select('*')
        .or(`source_memory_id.in.(${memoryIds.join(',')}),target_memory_id.in.(${memoryIds.join(',')})`);

      if (!connectionsError) {
        connections = conns || [];
      }
    }

    const analytics = calculateAnalytics(memories || [], connections);

    console.log('✅ Analytics calculated:', {
      totalMemories: analytics.totalMemories,
      totalConnections: analytics.totalConnections,
      uniqueTags: analytics.uniqueTags
    });

    return res.status(200).json(analytics);

  } catch (error) {
    console.error('❌ Analytics error:', error);
    return res.status(500).json({
      error: 'Failed to calculate analytics',
      details: error.message
    });
  }
}

function calculateAnalytics(memories, connections) {
  const totalMemories = memories.length;
  const totalConnections = connections.length;

  const allTags = memories.flatMap(m => m.tags || []);
  const uniqueTags = [...new Set(allTags)].length;

  const dates = memories.map(m => new Date(m.created_at)).sort((a, b) => a - b);
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];
  const daysActive = firstDate && lastDate 
    ? Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)) + 1
    : 1;

  // Type distribution
  const typeDistribution = memories.reduce((acc, m) => {
    const type = m.content_type || 'Manual';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  // Tag frequency
  const tagFrequency = allTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {});

  const topTags = Object.entries(tagFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  // Timeline (by month)
  const timeline = memories.reduce((acc, m) => {
    const date = new Date(m.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    acc[monthKey] = (acc[monthKey] || 0) + 1;
    return acc;
  }, {});

  return {
    totalMemories,
    totalConnections,
    uniqueTags,
    daysActive,
    typeDistribution,
    topTags,
    timeline: Object.entries(timeline)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count })),
    avgConnectionsPerMemory: totalMemories > 0 
      ? (totalConnections / totalMemories).toFixed(2) 
      : 0
  };
}
