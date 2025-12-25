/**
 * Memory Auto-Connect API
 * Phase 10 Week 3: Automatic connection detection between memories
 * 
 * Detects relationships using:
 * 1. Semantic similarity (embedding-based cosine similarity)
 * 2. Tag-based connections (shared topics)
 * 3. Temporal connections (created within time windows)
 * 
 * Combined strength formula:
 * final_strength = semantic * 0.5 + tag * 0.3 + temporal * 0.2
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Thresholds for connection detection
const THRESHOLDS = {
    semantic: 0.75,      // Min cosine similarity (0-1)
    tag: 0.3,            // Min tag overlap ratio
    temporal: 0.1,       // Min temporal strength
    combined: 0.5        // Min combined strength to save
};

// Weights for combined strength calculation
const WEIGHTS = {
    semantic: 0.5,
    tag: 0.3,
    temporal: 0.2
};

/**
 * Main handler
 */
async function handler(event, context) {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
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
        // Parse request body
        const { userId, memoryIds } = JSON.parse(event.body || '{}');

        if (!userId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'userId is required' })
            };
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

        // Filter to specific memories if requested
        const targetMemories = memoryIds 
            ? memories.filter(m => memoryIds.includes(m.id))
            : memories;

        if (targetMemories.length === 0) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    connectionsCreated: 0,
                    message: 'No memories to process'
                })
            };
        }

        // Detect all connections
        const connections = await detectConnections(targetMemories, memories, userId);

        console.log(`✅ [Auto-Connect] Created ${connections.length} new connections`);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                connectionsCreated: connections.length,
                connections: connections.map(c => ({
                    sourceId: c.source_memory_id,
                    targetId: c.target_memory_id,
                    strength: c.strength,
                    type: c.connection_type
                }))
            })
        };

    } catch (error) {
        console.error('❌ [Auto-Connect] Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Auto-connect failed',
                details: error.message 
            })
        };
    }
}

/**
 * Detect connections between target memories and all memories
 */
async function detectConnections(targetMemories, allMemories, userId) {
    const newConnections = [];
    const processedPairs = new Set();

    // Get existing connections to avoid duplicates
    const { data: existingConnections } = await supabase
        .from('memory_connections')
        .select('source_memory_id, target_memory_id')
        .eq('user_id', userId);

    const existingPairs = new Set(
        existingConnections?.map(c => 
            `${c.source_memory_id}:${c.target_memory_id}`
        ) || []
    );

    // Check each target memory against all others
    for (const targetMemory of targetMemories) {
        for (const otherMemory of allMemories) {
            // Skip self-connections
            if (targetMemory.id === otherMemory.id) continue;

            // Create unique pair key (sorted to avoid A->B and B->A duplicates)
            const pairKey = [targetMemory.id, otherMemory.id].sort().join(':');
            
            // Skip if already processed or exists
            if (processedPairs.has(pairKey) || existingPairs.has(pairKey)) {
                continue;
            }
            processedPairs.add(pairKey);

            // Calculate connection strengths
            const semanticStrength = calculateSemanticSimilarity(
                targetMemory.embedding, 
                otherMemory.embedding
            );
            
            const tagStrength = calculateTagSimilarity(
                targetMemory.tags || [], 
                otherMemory.tags || []
            );
            
            const temporalStrength = calculateTemporalProximity(
                targetMemory.created_at, 
                otherMemory.created_at
            );

            // Calculate combined strength
            const combinedStrength = 
                semanticStrength * WEIGHTS.semantic +
                tagStrength * WEIGHTS.tag +
                temporalStrength * WEIGHTS.temporal;

            // Only create connection if above threshold
            if (combinedStrength >= THRESHOLDS.combined) {
                // Determine primary connection type
                let connectionType = 'combined';
                if (semanticStrength >= THRESHOLDS.semantic) {
                    connectionType = 'semantic';
                } else if (tagStrength >= THRESHOLDS.tag) {
                    connectionType = 'tag';
                } else if (temporalStrength >= THRESHOLDS.temporal) {
                    connectionType = 'temporal';
                }

                newConnections.push({
                    source_memory_id: targetMemory.id,
                    target_memory_id: otherMemory.id,
                    user_id: userId,
                    connection_type: connectionType,
                    strength: Math.round(combinedStrength * 100) / 100, // 2 decimal places
                    metadata: {
                        semantic: Math.round(semanticStrength * 100) / 100,
                        tag: Math.round(tagStrength * 100) / 100,
                        temporal: Math.round(temporalStrength * 100) / 100
                    }
                });
            }
        }
    }

    // Batch insert new connections
    if (newConnections.length > 0) {
        const { error: insertError } = await supabase
            .from('memory_connections')
            .insert(newConnections);

        if (insertError) {
            console.error('Failed to insert connections:', insertError);
            throw insertError;
        }
    }

    return newConnections;
}

/**
 * Calculate semantic similarity using cosine similarity
 * Returns 0-1 (1 = identical, 0 = orthogonal)
 */
function calculateSemanticSimilarity(embedding1, embedding2) {
    if (!embedding1 || !embedding2) return 0;
    if (embedding1.length !== embedding2.length) return 0;

    // Cosine similarity: dot(A,B) / (||A|| * ||B||)
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
        dotProduct += embedding1[i] * embedding2[i];
        magnitude1 += embedding1[i] * embedding1[i];
        magnitude2 += embedding2[i] * embedding2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) return 0;

    const similarity = dotProduct / (magnitude1 * magnitude2);
    
    // Normalize to 0-1 range (cosine can be -1 to 1)
    return Math.max(0, similarity);
}

/**
 * Calculate tag-based similarity
 * Returns 0-1 based on Jaccard similarity (intersection/union)
 */
function calculateTagSimilarity(tags1, tags2) {
    if (!tags1.length || !tags2.length) return 0;

    const set1 = new Set(tags1.map(t => t.toLowerCase()));
    const set2 = new Set(tags2.map(t => t.toLowerCase()));

    // Calculate intersection
    const intersection = new Set([...set1].filter(x => set2.has(x)));

    // Calculate union
    const union = new Set([...set1, ...set2]);

    // Jaccard similarity
    return intersection.size / union.size;
}

/**
 * Calculate temporal proximity
 * Returns 0-1 based on how close in time the memories were created
 */
function calculateTemporalProximity(date1, date2) {
    const time1 = new Date(date1).getTime();
    const time2 = new Date(date2).getTime();
    
    const diffMs = Math.abs(time1 - time2);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    // Decay function: higher strength for closer dates
    if (diffDays <= 1) return 0.8;        // Same day
    if (diffDays <= 7) return 0.6;        // Same week
    if (diffDays <= 30) return 0.4;       // Same month
    if (diffDays <= 90) return 0.2;       // Same quarter
    return 0.1;                            // Older than 90 days
}

module.exports = { handler };
