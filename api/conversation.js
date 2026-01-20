/**
 * Vercel API Route: Conversation
 * Multi-persona AI conversation orchestration
 */

export const config = {
  maxDuration: 60
};

export default async function handler(req, res) {
  const requestId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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

  console.log('🎙️ CONVERSATION API - Request ID:', requestId);

  try {
    const {
      question,
      selectedPersonas = [],
      provider = 'anthropic',
      model,
      conversationHistory = [],
      userInterjection = null,
      expandOnPersona = null,
      roundLimit = 3
    } = req.body;

    console.log(`[API] Question: "${question?.substring(0, 50)}..."`);
    console.log(`[API] Provider: ${provider}`);
    console.log(`[API] Personas: ${selectedPersonas.length}`);

    if (!question || question.trim().length === 0) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Simple conversation response for now
    // Full LangGraph integration would require additional setup
    const response = await generateConversationResponse(
      question,
      selectedPersonas,
      provider,
      model,
      conversationHistory
    );

    console.log('[API] ✅ Conversation completed');

    return res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('[API] ❌ Error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function generateConversationResponse(question, personas, provider, model, history) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  
  if (!anthropicKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const selectedPersonas = personas.length > 0 ? personas : ['master-teacher', 'strategist', 'analyst'];
  
  const systemPrompt = `You are facilitating a multi-perspective conversation. 
The following expert personas will respond to the question:
${selectedPersonas.map(p => `- ${p}`).join('\n')}

For each persona, provide their unique perspective on the question. Format as JSON array.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model || 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        ...history.map(h => ({
          role: h.role === 'user' ? 'user' : 'assistant',
          content: h.content
        })),
        { role: 'user', content: question }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Conversation failed');
  }

  const data = await response.json();
  const responseText = data.content[0].text;

  const newMessage = {
    role: 'assistant',
    content: responseText,
    timestamp: new Date().toISOString()
  };

  return {
    conversationHistory: [...history, { role: 'user', content: question }, newMessage],
    lastMessages: [newMessage],
    roundCount: Math.floor(history.length / 2) + 1,
    nextSuggestedActions: ['Continue discussion', 'Ask follow-up', 'Request synthesis'],
    stats: {
      personasUsed: selectedPersonas.length,
      provider
    }
  };
}
