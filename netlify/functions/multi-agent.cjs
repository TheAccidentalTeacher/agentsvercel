/**
 * Netlify Function: Multi-Agent Orchestration API
 * Sprint 3: Backend Integration
 * 
 * Handles multi-agent requests with support for:
 * - Panel mode: Sequential responses from selected personas
 * - Consensus mode: Parallel voting/analysis from selected personas
 * - Debate mode: Alternating back-and-forth discussion
 * 
 * Uses LangGraph.js for agent orchestration
 * Provides streaming response support for real-time updates
 * 
 * NOTE: This is CommonJS (.cjs) to work with the local dev server
 * For Netlify production, esbuild will handle the ES module conversion
 */

/**
 * CORS headers for browser requests
 */
const getCorsHeaders = () => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
});

/**
 * Validate request payload
 */
const validateRequest = (body) => {
  if (!body.question || typeof body.question !== 'string') {
    return { valid: false, error: 'question field is required and must be a string' };
  }

  if (body.mode && !['panel', 'consensus', 'debate'].includes(body.mode)) {
    return { valid: false, error: 'mode must be one of: panel, consensus, debate' };
  }

  if (body.personas && !Array.isArray(body.personas)) {
    return { valid: false, error: 'personas must be an array' };
  }

  return { valid: true };
};

/**
 * Format response for API
 */
const formatResponse = (result, executionTime) => ({
  success: true,
  data: {
    question: result.question,
    mode: result.mode,
    personas: result.personas,
    responses: result.personaResponses.map(r => ({
      persona: r.persona,
      content: r.response
    })),
    synthesis: result.synthesisResult,
    metadata: {
      executionTime,
      agentsExecuted: result.personas.length,
      timestamp: new Date().toISOString()
    }
  }
});

/**
 * Main handler - using async/await for both CommonJS and compatibility
 */
exports.handler = async (event, context) => {
  const requestId = `multi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  console.log('\n' + '='.repeat(80));
  console.log(`🤖 MULTI-AGENT API INVOKED - Request ID: ${requestId}`);
  console.log('='.repeat(80));
  console.log(`[API] Timestamp: ${new Date().toISOString()}`);
  console.log(`[API] HTTP Method: ${event.httpMethod}`);
  console.log(`[API] Path: ${event.path}`);

  const headers = getCorsHeaders();

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    console.log('[API] ℹ️ OPTIONS preflight request');
    console.log('='.repeat(80) + '\n');
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    console.error(`[API] ❌ Invalid HTTP method: ${event.httpMethod}`);
    console.log('='.repeat(80) + '\n');
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Method not allowed. Use POST.' 
      })
    };
  }

  try {
    console.log('[API] 📦 Parsing request body...');
    
    // Parse request body
    let parsedBody;
    try {
      parsedBody = JSON.parse(event.body);
    } catch (e) {
      console.error('[API] ❌ JSON parse error:', e.message);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Invalid JSON in request body' 
        })
      };
    }

    console.log('[API] ✓ Body parsed successfully');
    console.log(`[API] Request keys: ${Object.keys(parsedBody).join(', ')}`);
    
    const { question, mode = 'panel', personas } = parsedBody;
    
    console.log(`[API] Question: ${question.substring(0, 100)}${question.length > 100 ? '...' : ''}`);
    console.log(`[API] Mode: ${mode}`);
    console.log(`[API] Custom personas: ${personas ? personas.join(', ') : 'none (auto-select)'}`);

    // Validate request
    console.log('[API] 🔍 Validating request...');
    const validation = validateRequest(parsedBody);
    if (!validation.valid) {
      console.error(`[API] ❌ Validation failed: ${validation.error}`);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: validation.error 
        })
      };
    }
    console.log('[API] ✓ Request validation passed');

    // Execute multi-agent workflow
    console.log('[API] 🚀 Executing multi-agent workflow...');
    console.log('[API] ▶️ Starting agent orchestration');
    
    // Dynamic import of ESM module
    const { executeMultiAgentWorkflow } = await import('../../langgraph-agents.js');
    const result = await executeMultiAgentWorkflow(question, mode, personas);
    
    const executionTime = Date.now() - startTime;
    console.log(`[API] ✅ Workflow completed in ${executionTime}ms`);
    console.log(`[API] ✅ Agents executed: ${result.personas.length}`);
    console.log(`[API] ✅ Synthesis generated: ${result.synthesisResult.length} characters`);

    // Format and return response
    const response = formatResponse(result, executionTime);
    
    console.log('[API] 📤 Returning response');
    console.log('='.repeat(80) + '\n');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('\n' + '!'.repeat(80));
    console.error(`[API] ❌ EXECUTION ERROR - Request ID: ${requestId}`);
    console.error('!'.repeat(80));
    console.error(`[API] Error type: ${error.constructor.name}`);
    console.error(`[API] Error message: ${error.message}`);
    console.error(`[API] Error stack:`, error.stack);
    console.error(`[API] Execution time before error: ${executionTime}ms`);
    console.error('!'.repeat(80) + '\n');

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Multi-agent execution failed',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        requestId
      })
    };
  }
};

/**
 * Streaming endpoint for real-time agent responses (future enhancement)
 * Would allow streaming synthesis as agents complete
 */
exports.handlerStreaming = async (event, context) => {
  // Future: Implement streaming response using event streams
  // Currently Netlify Functions don't support streaming, but this structure
  // allows for migration to Netlify Edge Functions or other serverless platforms
  
  console.log('[API] Streaming endpoint - not yet implemented');
  return {
    statusCode: 501,
    body: JSON.stringify({ 
      success: false, 
      error: 'Streaming responses not yet supported. Use POST /api/multi-agent' 
    })
  };
};
