const https = require('https');

/**
 * Netlify Function: AI Chat Handler
 * Handles AI chat requests and proxies them to Anthropic Claude API
 * Keeps API keys secure on the server side
 * 
 * Enterprise-level debugging enabled for production diagnostics
 */

exports.handler = async (event, context) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  console.log('\n' + '='.repeat(80));
  console.log(`🚀 NETLIFY FUNCTION INVOKED - Request ID: ${requestId}`);
  console.log('='.repeat(80));
  console.log('[Function] Timestamp:', new Date().toISOString());
  console.log('[Function] HTTP Method:', event.httpMethod);
  console.log('[Function] Path:', event.path);
  console.log('[Function] Query params:', JSON.stringify(event.queryStringParameters, null, 2));
  console.log('[Function] Headers:', JSON.stringify(event.headers, null, 2));
  console.log('[Function] Body length:', event.body?.length || 0, 'bytes');
  console.log('[Function] Request context:', JSON.stringify(context, null, 2));
  
  // CORS headers for browser requests
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
  console.log('[Function] ✓ CORS headers configured');

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    console.log('[Function] ℹ️ OPTIONS preflight request - responding with 200');
    console.log('='.repeat(80) + '\n');
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    console.error('[Function] ❌ Invalid HTTP method:', event.httpMethod);
    console.log('='.repeat(80) + '\n');
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  console.log('[Function] ✓ Valid POST request received');

  try {
    console.log('[Function] 📦 Parsing request body...');
    console.log('[Function] Raw body:', event.body?.substring(0, 500) + (event.body?.length > 500 ? '...' : ''));
    
    // Parse request body
    const parsedBody = JSON.parse(event.body);
    console.log('[Function] ✓ Body parsed successfully');
    console.log('[Function] Parsed body keys:', Object.keys(parsedBody));
    
    const { provider, model, messages, editorState, enableImages, persona } = parsedBody;
    console.log('[Function] Provider:', provider || 'anthropic (default)');
    console.log('[Function] Model:', model || 'auto-select');
    console.log('[Function] Persona:', persona || 'default');
    console.log('[Function] Messages array length:', messages?.length || 0);
    console.log('[Function] Messages:', JSON.stringify(messages, null, 2));
    console.log('[Function] Editor state keys:', editorState ? Object.keys(editorState) : 'null');
    console.log('[Function] Editor state:', JSON.stringify(editorState, null, 2));
    console.log('[Function] Image generation:', enableImages ? 'enabled' : 'disabled');

    console.log('[Function] 🔍 Validating request data...');
    
    if (!messages || !Array.isArray(messages)) {
      console.error('[Function] ❌ Validation failed: messages is not an array');
      console.error('[Function] messages type:', typeof messages);
      console.error('[Function] messages value:', messages);
      console.log('='.repeat(80) + '\n');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid request: messages array required' })
      };
    }
    
    console.log('[Function] ✓ Messages validation passed');

    // Determine provider and model
    const selectedProvider = provider || 'anthropic';
    const selectedModel = model || (selectedProvider === 'anthropic' ? 'claude-sonnet-4.5' : 'gpt-5.2-codex');
    
    console.log('[Function] Selected provider:', selectedProvider);
    console.log('[Function] Selected model:', selectedModel);

    // Get appropriate API key
    let apiKey;
    if (selectedProvider === 'anthropic') {
      console.log('[Function] 🔑 Checking for ANTHROPIC_API_KEY in environment...');
      apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        console.error('[Function] ❌ ANTHROPIC_API_KEY not configured');
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Anthropic API key not configured' })
        };
      }
    } else if (selectedProvider === 'openai') {
      console.log('[Function] 🔑 Checking for OPENAI_API_KEY in environment...');
      apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.error('[Function] ❌ OPENAI_API_KEY not configured');
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'OpenAI API key not configured' })
        };
      }
    }
    
    console.log('[Function] Environment variables available:', Object.keys(process.env).filter(k => k.includes('API')));
    console.log('[Function] ✓ API key found (length:', apiKey.length, 'chars)');
    console.log('[Function] API key prefix:', apiKey.substring(0, 12) + '...');

    // Build system prompt with editor context and persona
    console.log('[Function] 📝 Building system prompt with editor context and persona...');
    const systemPromptStartTime = Date.now();
    const systemPrompt = await buildSystemPrompt(editorState, enableImages, persona);
    const systemPromptDuration = Date.now() - systemPromptStartTime;
    console.log('[Function] ✓ System prompt built in', systemPromptDuration, 'ms');
    console.log('[Function] System prompt length:', systemPrompt.length, 'chars');
    console.log('[Function] System prompt preview:', systemPrompt.substring(0, 200) + '...');

    // Call appropriate API
    let response;
    let apiCallDuration;
    
    if (selectedProvider === 'anthropic') {
      // Prepare Anthropic API request
      console.log('[Function] 🎯 Preparing Anthropic API request...');
      
      // Claude 3 models have 4096 max tokens, Claude 4 models have 8096
      const isClaude3 = selectedModel.includes('claude-3');
      const maxTokens = isClaude3 ? 4096 : 8096;
      console.log('[Function] Model type:', isClaude3 ? 'Claude 3' : 'Claude 4+');
      console.log('[Function] Max tokens set to:', maxTokens);
      
      const anthropicRequest = {
        model: selectedModel,
        max_tokens: maxTokens,
        temperature: 0.7,
        system: systemPrompt,
        messages: messages
      };
      
      console.log('[Function] Request configuration:');
      console.log('  - Model:', anthropicRequest.model);
      console.log('  - Max tokens:', anthropicRequest.max_tokens);
      console.log('  - Temperature:', anthropicRequest.temperature);
      console.log('  - System prompt length:', anthropicRequest.system.length);
      console.log('  - Messages count:', anthropicRequest.messages.length);
      console.log('[Function] Full request payload:', JSON.stringify(anthropicRequest, null, 2));

      // Call Anthropic API
      console.log('[Function] 🌐 Calling Anthropic API...');
      const apiCallStartTime = Date.now();
      response = await callAnthropicAPI(apiKey, anthropicRequest);
      apiCallDuration = Date.now() - apiCallStartTime;
    } else if (selectedProvider === 'openai') {
      // Prepare OpenAI API request
      console.log('[Function] 🎯 Preparing OpenAI API request...');
      
      // GPT-5+ models use max_completion_tokens, older models use max_tokens
      const isNewModel = selectedModel.includes('gpt-5') || selectedModel.includes('gpt-4.1');
      const tokenParam = isNewModel ? 'max_completion_tokens' : 'max_tokens';
      console.log('[Function] Model type:', isNewModel ? 'GPT-5/4.1+' : 'Legacy GPT');
      console.log('[Function] Token parameter:', tokenParam);
      
      // GPT-5 models only support temperature=1 (default), older models support 0-2
      const openaiRequest = {
        model: selectedModel,
        [tokenParam]: 8096,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ]
      };
      
      // Only add temperature for older models that support it
      if (!isNewModel) {
        openaiRequest.temperature = 0.7;
        console.log('[Function] Temperature set to 0.7 (legacy model)');
      } else {
        console.log('[Function] Temperature not set (GPT-5+ uses default=1)');
      }
      
      console.log('[Function] Request configuration:');
      console.log('  - Model:', openaiRequest.model);
      console.log('  - Max tokens:', openaiRequest.max_tokens || openaiRequest.max_completion_tokens);
      console.log('  - Token parameter:', openaiRequest.max_tokens ? 'max_tokens' : 'max_completion_tokens');
      console.log('  - Temperature:', openaiRequest.temperature || '(default)');
      console.log('  - Messages count:', openaiRequest.messages.length);
      console.log('[Function] Full request payload:', JSON.stringify(openaiRequest, null, 2));

      // Call OpenAI API
      console.log('[Function] 🌐 Calling OpenAI API...');
      const apiCallStartTime = Date.now();
      response = await callOpenAIAPI(apiKey, openaiRequest);
      apiCallDuration = Date.now() - apiCallStartTime;
    }
    
    console.log('[Function] ✓ API call completed in', apiCallDuration, 'ms');
    console.log('[Function] Response type:', typeof response);
    console.log('[Function] Response keys:', Object.keys(response));
    console.log('[Function] Response:', JSON.stringify(response, null, 2));

    // Return successful response
    const totalDuration = Date.now() - startTime;
    console.log('[Function] ✅ Request completed successfully in', totalDuration, 'ms');
    console.log('[Function] Returning response with status 200');
    console.log('='.repeat(80) + '\n');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    const errorDuration = Date.now() - startTime;
    console.error('\n' + '❌'.repeat(40));
    console.error('[Function] 💥 FATAL ERROR - Request ID:', requestId);
    console.error('❌'.repeat(40));
    console.error('[Function] Error after', errorDuration, 'ms');
    console.error('[Function] Error type:', error.constructor.name);
    console.error('[Function] Error message:', error.message);
    console.error('[Function] Error stack:', error.stack);
    
    if (error.code) {
      console.error('[Function] Error code:', error.code);
    }
    
    if (error.response) {
      console.error('[Function] Error response:', error.response);
    }
    
    console.error('[Function] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error('='.repeat(80) + '\n');
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to process chat request',
        message: error.message,
        requestId: requestId,
        timestamp: new Date().toISOString()
      })
    };
  }
};

/**
 * Build system prompt with current editor state and persona
 */
async function buildSystemPrompt(editorState, enableImages = true, personaName = 'default') {
  console.log('\n' + '🎭'.repeat(40));
  console.log('🎭 [PERSONA SYSTEM] Building system prompt...');
  console.log('🎭 [PERSONA SYSTEM] Active Persona:', personaName);
  console.log('🎭 [PERSONA SYSTEM] Image generation:', enableImages ? 'enabled' : 'disabled');
  console.log('🎭'.repeat(40));
  
  const state = editorState || {};
  const fs = require('fs');
  const path = require('path');
  
  // Load persona definition
  let personaContent = '';
  try {
    const personaPath = path.join(__dirname, '..', '..', 'personas', `${personaName}.md`);
    console.log('[buildSystemPrompt] Loading persona from:', personaPath);
    
    if (fs.existsSync(personaPath)) {
      personaContent = fs.readFileSync(personaPath, 'utf-8');
      console.log('🎭 [PERSONA SYSTEM] ✅ Persona file loaded successfully!');
      console.log('🎭 [PERSONA SYSTEM] File path:', personaPath);
      console.log('🎭 [PERSONA SYSTEM] Content length:', personaContent.length, 'characters');
      console.log('🎭 [PERSONA SYSTEM] First 200 chars:', personaContent.substring(0, 200) + '...');
    } else {
      console.log('🎭 [PERSONA SYSTEM] ⚠️ Persona file not found at:', personaPath);
      console.log('🎭 [PERSONA SYSTEM] Using fallback default persona');
      personaContent = `# Default Persona
A conversational AI assistant for game design and development.`;
    }
  } catch (error) {
    console.error('[buildSystemPrompt] ❌ Error loading persona:', error);
    personaContent = `# Default Persona
A conversational AI assistant for game design and development.`;
  }
  
  // For Fellowship mode, load the full guide
  if (personaName === 'fellowship') {
    try {
      const fellowshipPath = path.join(__dirname, '..', '..', 'FELLOWSHIP_GUIDE.md');
      console.log('[buildSystemPrompt] Loading Fellowship Guide from:', fellowshipPath);
      
      if (fs.existsSync(fellowshipPath)) {
        const fellowshipGuide = fs.readFileSync(fellowshipPath, 'utf-8');
        personaContent += '\n\n---\n\n' + fellowshipGuide;
        console.log('[buildSystemPrompt] ✓ Fellowship Guide loaded, total length:', personaContent.length, 'chars');
      }
    } catch (error) {
      console.error('[buildSystemPrompt] ❌ Error loading Fellowship Guide:', error);
    }
  }
  
  // Note: Agent memory will be managed client-side via localStorage
  // Backend can optionally load from database in future phases
  
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
 * Call Anthropic API using Node.js https module
 */
function callAnthropicAPI(apiKey, requestData) {
  console.log('[callAnthropicAPI] 🚀 Initiating API call...');
  console.log('[callAnthropicAPI] API key length:', apiKey.length);
  console.log('[callAnthropicAPI] Request data keys:', Object.keys(requestData));
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(requestData);
    console.log('[callAnthropicAPI] POST data size:', postData.length, 'bytes');
    console.log('[callAnthropicAPI] POST data preview:', postData.substring(0, 300) + '...');

    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    console.log('[callAnthropicAPI] Request options:');
    console.log('  - Hostname:', options.hostname);
    console.log('  - Port:', options.port);
    console.log('  - Path:', options.path);
    console.log('  - Method:', options.method);
    console.log('  - Headers:', JSON.stringify({
      'Content-Type': options.headers['Content-Type'],
      'x-api-key': options.headers['x-api-key'].substring(0, 12) + '...',
      'anthropic-version': options.headers['anthropic-version'],
      'Content-Length': options.headers['Content-Length']
    }, null, 2));

    const req = https.request(options, (res) => {
      console.log('[callAnthropicAPI] ✓ Response received');
      console.log('[callAnthropicAPI] Status code:', res.statusCode);
      console.log('[callAnthropicAPI] Status message:', res.statusMessage);
      console.log('[callAnthropicAPI] Response headers:', JSON.stringify(res.headers, null, 2));
      
      let data = '';
      let chunkCount = 0;

      res.on('data', (chunk) => {
        chunkCount++;
        const chunkSize = chunk.length;
        data += chunk;
        console.log(`[callAnthropicAPI] Received chunk ${chunkCount} (${chunkSize} bytes, total: ${data.length} bytes)`);
      });

      res.on('end', () => {
        console.log('[callAnthropicAPI] ✓ Response fully received');
        console.log('[callAnthropicAPI] Total chunks:', chunkCount);
        console.log('[callAnthropicAPI] Total data size:', data.length, 'bytes');
        console.log('[callAnthropicAPI] Response preview:', data.substring(0, 500) + (data.length > 500 ? '...' : ''));
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('[callAnthropicAPI] ✅ Success status code:', res.statusCode);
          try {
            console.log('[callAnthropicAPI] Parsing JSON response...');
            const parsed = JSON.parse(data);
            console.log('[callAnthropicAPI] ✓ JSON parsed successfully');
            console.log('[callAnthropicAPI] Response object keys:', Object.keys(parsed));
            console.log('[callAnthropicAPI] Full response:', JSON.stringify(parsed, null, 2));
            resolve(parsed);
          } catch (e) {
            console.error('[callAnthropicAPI] ❌ Failed to parse JSON response');
            console.error('[callAnthropicAPI] Parse error:', e.message);
            console.error('[callAnthropicAPI] Raw data:', data);
            reject(new Error('Failed to parse API response'));
          }
        } else {
          console.error('[callAnthropicAPI] ❌ Error status code:', res.statusCode);
          console.error('[callAnthropicAPI] Error response data:', data);
          try {
            const error = JSON.parse(data);
            console.error('[callAnthropicAPI] Parsed error:', JSON.stringify(error, null, 2));
            const errorMsg = error.error?.message || `API error: ${res.statusCode}`;
            console.error('[callAnthropicAPI] Error message:', errorMsg);
            reject(new Error(errorMsg));
          } catch (e) {
            console.error('[callAnthropicAPI] Could not parse error response');
            reject(new Error(`API error: ${res.statusCode}`));
          }
        }
      });
    });

    req.on('error', (e) => {
      console.error('[callAnthropicAPI] ❌ Request error event triggered');
      console.error('[callAnthropicAPI] Error code:', e.code);
      console.error('[callAnthropicAPI] Error message:', e.message);
      console.error('[callAnthropicAPI] Error stack:', e.stack);
      reject(new Error(`Request failed: ${e.message}`));
    });

    console.log('[callAnthropicAPI] ✍️ Writing POST data to request...');
    req.write(postData);
    console.log('[callAnthropicAPI] ✓ Data written');
    
    console.log('[callAnthropicAPI] 🏁 Ending request...');
    req.end();
    console.log('[callAnthropicAPI] ✓ Request sent, awaiting response...');
  });
}

/**
 * Call OpenAI API using Node.js https module
 */
function callOpenAIAPI(apiKey, requestData) {
  console.log('[callOpenAIAPI] 🚀 Initiating API call...');
  console.log('[callOpenAIAPI] API key length:', apiKey.length);
  console.log('[callOpenAIAPI] Request data keys:', Object.keys(requestData));
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(requestData);
    console.log('[callOpenAIAPI] POST data size:', postData.length, 'bytes');
    console.log('[callOpenAIAPI] POST data preview:', postData.substring(0, 300) + '...');

    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    console.log('[callOpenAIAPI] Request options:');
    console.log('  - Hostname:', options.hostname);
    console.log('  - Port:', options.port);
    console.log('  - Path:', options.path);
    console.log('  - Method:', options.method);

    const req = https.request(options, (res) => {
      console.log('[callOpenAIAPI] ✓ Response received');
      console.log('[callOpenAIAPI] Status code:', res.statusCode);
      console.log('[callOpenAIAPI] Status message:', res.statusMessage);
      console.log('[callOpenAIAPI] Response headers:', JSON.stringify(res.headers, null, 2));
      
      let data = '';
      let chunkCount = 0;

      res.on('data', (chunk) => {
        chunkCount++;
        const chunkSize = chunk.length;
        data += chunk;
        console.log(`[callOpenAIAPI] Received chunk ${chunkCount} (${chunkSize} bytes, total: ${data.length} bytes)`);
      });

      res.on('end', () => {
        console.log('[callOpenAIAPI] ✓ Response fully received');
        console.log('[callOpenAIAPI] Total chunks:', chunkCount);
        console.log('[callOpenAIAPI] Total data size:', data.length, 'bytes');
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('[callOpenAIAPI] ✅ Success status code:', res.statusCode);
          try {
            const parsed = JSON.parse(data);
            console.log('[callOpenAIAPI] ✓ JSON parsed successfully');
            
            // Convert OpenAI format to Anthropic-like format for consistency
            const anthropicFormat = {
              content: [
                {
                  type: 'text',
                  text: parsed.choices[0].message.content
                }
              ],
              model: parsed.model,
              usage: parsed.usage
            };
            
            console.log('[callOpenAIAPI] ✓ Converted to standard format');
            resolve(anthropicFormat);
          } catch (e) {
            console.error('[callOpenAIAPI] ❌ Failed to parse JSON response');
            console.error('[callOpenAIAPI] Parse error:', e.message);
            reject(new Error('Failed to parse API response'));
          }
        } else {
          console.error('[callOpenAIAPI] ❌ Error status code:', res.statusCode);
          console.error('[callOpenAIAPI] Error response data:', data);
          try {
            const error = JSON.parse(data);
            const errorMsg = error.error?.message || `API error: ${res.statusCode}`;
            console.error('[callOpenAIAPI] Error message:', errorMsg);
            reject(new Error(errorMsg));
          } catch (e) {
            reject(new Error(`API error: ${res.statusCode}`));
          }
        }
      });
    });

    req.on('error', (e) => {
      console.error('[callOpenAIAPI] ❌ Request error event triggered');
      console.error('[callOpenAIAPI] Error code:', e.code);
      console.error('[callOpenAIAPI] Error message:', e.message);
      reject(new Error(`Request failed: ${e.message}`));
    });

    console.log('[callOpenAIAPI] ✍️ Writing POST data to request...');
    req.write(postData);
    console.log('[callOpenAIAPI] ✓ Data written');
    
    console.log('[callOpenAIAPI] 🏁 Ending request...');
    req.end();
    console.log('[callOpenAIAPI] ✓ Request sent, awaiting response...');
  });
}
