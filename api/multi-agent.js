/**
 * Vercel API Route: Multi-Agent Orchestration API
 * 
 * Handles multi-agent requests with support for:
 * - Panel mode: Sequential responses from selected personas
 * - Consensus mode: Parallel voting/analysis from selected personas
 * - Debate mode: Alternating back-and-forth discussion
 */

export const config = {
  maxDuration: 60
};

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
    personas: result.selectedPersonas,
    responses: (result.personaResponses || []).map(r => ({
      persona: r.persona,
      content: r.response || r.content || ''
    })),
    synthesis: result.synthesis || result.synthesisResult,
    metadata: {
      executionTime,
      agentsExecuted: (result.selectedPersonas || []).length,
      timestamp: result.metadata?.timestamp || new Date().toISOString()
    }
  }
});

export default async function handler(req, res) {
  const requestId = `multi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  console.log(`🤖 MULTI-AGENT API INVOKED - Request ID: ${requestId}`);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const { question, mode = 'panel', personas, provider = 'anthropic', model } = req.body;
    
    console.log(`[API] Question: ${question.substring(0, 100)}${question.length > 100 ? '...' : ''}`);
    console.log(`[API] Mode: ${mode}`);
    console.log(`[API] Provider: ${provider}`);
    console.log(`[API] Model: ${model || '(default)'}`);

    // Validate request
    const validation = validateRequest(req.body);
    if (!validation.valid) {
      return res.status(400).json({ 
        success: false, 
        error: validation.error 
      });
    }

    // Execute multi-agent workflow
    console.log('[API] 🚀 Executing multi-agent workflow...');
    
    // Dynamic import of the workflow module
    const { executeMultiAgentWorkflow } = await import('../langgraph-agents.js');
    const result = await executeMultiAgentWorkflow(question, personas, mode, { provider, model });
    
    const executionTime = Date.now() - startTime;
    console.log(`[API] ✅ Workflow completed in ${executionTime}ms`);

    // Format and return response
    const response = formatResponse(result, executionTime);
    
    return res.status(200).json(response);

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`[API] ❌ EXECUTION ERROR - Request ID: ${requestId}`);
    console.error(`[API] Error: ${error.message}`);

    return res.status(500).json({
      success: false,
      error: 'Multi-agent execution failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      requestId
    });
  }
}
