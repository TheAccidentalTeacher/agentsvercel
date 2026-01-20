/**
 * Vercel API Route: AI Chat Handler
 * Handles AI chat requests and proxies them to AI APIs
 * Keeps API keys secure on the server side
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function handler(req, res) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  console.log(`🚀 CHAT API INVOKED - Request ID: ${requestId}`);
  
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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { provider, model, messages, editorState, enableImages, persona, webSearch } = req.body;
    
    console.log('[Chat] Provider:', provider || 'anthropic (default)');
    console.log('[Chat] Model:', model || 'auto-select');
    console.log('[Chat] Persona:', persona || 'default');
    console.log('[Chat] Web Search:', webSearch ? 'enabled' : 'disabled');
    console.log('[Chat] Messages count:', messages?.length || 0);

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request: messages array required' });
    }

    // Determine provider and model
    const selectedProvider = provider || 'anthropic';
    const selectedModel = model || (selectedProvider === 'anthropic' ? 'claude-sonnet-4-5-20250929' : 'gpt-5.2');

    // Get appropriate API key
    let apiKey;
    if (selectedProvider === 'anthropic') {
      apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'Anthropic API key not configured' });
      }
    } else if (selectedProvider === 'openai') {
      apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'OpenAI API key not configured' });
      }
    }

    // Perform web search if enabled
    let webSearchResults = '';
    let searchSources = [];
    if (webSearch && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage.role === 'user') {
        const tavilyKey = process.env.TAVILY_API_KEY;
        if (tavilyKey) {
          try {
            const searchResults = await performTavilySearch(lastUserMessage.content, tavilyKey);
            webSearchResults = formatSearchResults(searchResults);
            searchSources = searchResults.map(r => ({ title: r.title, url: r.url }));
            console.log('[Chat] Web search completed:', searchResults.length, 'results');
          } catch (error) {
            console.error('[Chat] Web search failed:', error.message);
          }
        }
      }
    }

    // Build system prompt
    let systemPrompt = buildSystemPrompt(editorState, enableImages, persona);
    
    if (webSearchResults) {
      systemPrompt += `\n\n## Web Search Results\n${webSearchResults}`;
    }

    // Call appropriate API
    let response;
    
    if (selectedProvider === 'anthropic') {
      const isClaude3 = selectedModel.includes('claude-3');
      const maxTokens = isClaude3 ? 4096 : 8096;
      
      const anthropicRequest = {
        model: selectedModel,
        max_tokens: maxTokens,
        temperature: 0.7,
        system: systemPrompt,
        messages: messages
      };

      response = await callAnthropicAPI(apiKey, anthropicRequest);
    } else if (selectedProvider === 'openai') {
      const isNewModel = selectedModel.includes('gpt-5') || selectedModel.includes('gpt-4.1');
      const isReasoningModel = selectedModel.startsWith('o3') || selectedModel.startsWith('o4');
      const isCodexModel = selectedModel.includes('codex');
      
      const tokenParam = (isNewModel || isReasoningModel || isCodexModel) ? 'max_completion_tokens' : 'max_tokens';
      
      const openaiRequest = {
        model: selectedModel,
        [tokenParam]: 8096,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ]
      };
      
      if (!isNewModel && !isReasoningModel && !isCodexModel) {
        openaiRequest.temperature = 0.7;
      }

      response = await callOpenAIAPI(apiKey, openaiRequest);
    }

    // Add sources to response if web search was used
    if (searchSources.length > 0) {
      response.sources = searchSources;
    }

    const totalDuration = Date.now() - startTime;
    console.log('[Chat] Request completed in', totalDuration, 'ms');
    
    return res.status(200).json(response);

  } catch (error) {
    console.error('[Chat] Error:', error.message);
    
    return res.status(500).json({ 
      error: 'Failed to process chat request',
      message: error.message,
      requestId: requestId
    });
  }
}

/**
 * Build system prompt with current editor state and persona
 */
function buildSystemPrompt(editorState, enableImages = true, personaName = 'default') {
  const state = editorState || {};
  
  // Try to load persona (Vercel bundles from project root)
  let personaContent = `# ${personaName.charAt(0).toUpperCase() + personaName.slice(1)} Persona
A conversational AI assistant for game design and development.`;
  
  try {
    const personaPath = path.join(process.cwd(), 'personas', `${personaName}.md`);
    if (fs.existsSync(personaPath)) {
      personaContent = fs.readFileSync(personaPath, 'utf-8');
    }
  } catch (error) {
    console.log('[buildSystemPrompt] Using default persona');
  }
  
  return `${personaContent}

## Current Editor State
${JSON.stringify(state, null, 2)}

## Additional Context
- Image generation: ${enableImages ? 'ENABLED - You can suggest and generate images' : 'DISABLED'}
- Agent memory is managed client-side and included in conversation history
- Future updates will enable direct editor manipulation
- For now, provide guidance and suggestions`;
}

/**
 * Call Anthropic API
 */
async function callAnthropicAPI(apiKey, requestData) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(requestData)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Call OpenAI API
 */
async function callOpenAIAPI(apiKey, requestData) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestData)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  const parsed = await response.json();
  
  // Convert OpenAI format to Anthropic-like format for consistency
  return {
    content: [
      {
        type: 'text',
        text: parsed.choices[0].message.content
      }
    ],
    model: parsed.model,
    usage: parsed.usage
  };
}

/**
 * Perform Tavily web search
 */
async function performTavilySearch(query, apiKey) {
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      api_key: apiKey,
      query: query,
      search_depth: 'basic',
      max_results: 5,
      include_answer: true,
      include_raw_content: false
    })
  });

  if (!response.ok) {
    throw new Error('Tavily search failed');
  }

  const data = await response.json();
  return data.results || [];
}

/**
 * Format search results for inclusion in system prompt
 */
function formatSearchResults(results) {
  if (!results || results.length === 0) {
    return 'No search results found.';
  }

  let formatted = 'The following information was found from recent web searches:\n\n';
  
  results.forEach((result, index) => {
    formatted += `**Source ${index + 1}**: ${result.title}\n`;
    formatted += `URL: ${result.url}\n`;
    formatted += `${result.content}\n\n`;
  });

  formatted += '\nUse this information to provide accurate, up-to-date responses. Cite sources when appropriate.';
  
  return formatted;
}
