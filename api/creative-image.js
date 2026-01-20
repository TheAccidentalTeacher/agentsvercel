/**
 * Vercel API Route: Creative Image
 * Supports Flux 2, DALL-E 3, Stable Diffusion via Replicate
 */

export const config = {
  maxDuration: 60
};

const MODELS = {
  'flux-2': {
    replicateModel: 'black-forest-labs/flux-2-pro',
    provider: 'replicate'
  },
  'dall-e-3': {
    openaiModel: 'dall-e-3',
    provider: 'openai'
  },
  'stable-diffusion': {
    replicateModel: 'stability-ai/sdxl',
    provider: 'replicate'
  }
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
    const { prompt, negativePrompt, model, style, dimensions, quantity, steps, guidance } = req.body;

    console.log('[Image Generation] Request received:', { model, dimensions });

    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const enhancedPrompt = enhancePrompt(prompt, style);
    const modelConfig = MODELS[model] || MODELS['flux-2'];

    let result;
    if (modelConfig.provider === 'replicate') {
      result = await generateWithReplicate(enhancedPrompt, negativePrompt, modelConfig, dimensions, steps, guidance);
    } else if (modelConfig.provider === 'openai') {
      result = await generateWithOpenAI(enhancedPrompt, dimensions, quantity);
    } else {
      throw new Error(`Unsupported provider: ${modelConfig.provider}`);
    }

    console.log('[Image Generation] ✓ Generation successful');

    return res.status(200).json({
      success: true,
      url: result.url,
      thumbnail: result.thumbnail || result.url,
      metadata: {
        model,
        dimensions,
        prompt: enhancedPrompt,
        negativePrompt,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Image Generation] ✗ Error:', error);
    return res.status(500).json({
      error: error.message || 'Image generation failed'
    });
  }
}

function enhancePrompt(prompt, style) {
  const styleModifiers = {
    'photorealistic': 'photorealistic, highly detailed, 8k, professional photography',
    'artistic': 'artistic, painterly, expressive brushstrokes, fine art',
    'anime': 'anime style, cel-shaded, vibrant colors',
    'cinematic': 'cinematic, movie still, dramatic lighting',
    'fantasy': 'fantasy art, magical, ethereal, highly detailed'
  };
  
  if (style && styleModifiers[style]) {
    return `${prompt}, ${styleModifiers[style]}`;
  }
  return prompt;
}

async function generateWithReplicate(prompt, negativePrompt, modelConfig, dimensions, steps, guidance) {
  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
  
  if (!REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN not configured');
  }

  const [width, height] = (dimensions || '1024x1024').split('x').map(Number);

  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      version: modelConfig.replicateModel,
      input: {
        prompt,
        negative_prompt: negativePrompt,
        width,
        height,
        num_inference_steps: steps || 30,
        guidance_scale: guidance || 7.5
      }
    })
  });

  const prediction = await response.json();

  // Poll for completion
  let result = prediction;
  while (result.status !== 'succeeded' && result.status !== 'failed') {
    await new Promise(r => setTimeout(r, 1000));
    const pollResponse = await fetch(result.urls.get, {
      headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` }
    });
    result = await pollResponse.json();
  }

  if (result.status === 'failed') {
    throw new Error(result.error || 'Image generation failed');
  }

  return { url: result.output[0] || result.output };
}

async function generateWithOpenAI(prompt, dimensions, quantity) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt,
      n: quantity || 1,
      size: dimensions || '1024x1024',
      quality: 'standard'
    })
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message);
  }

  return { url: data.data[0].url };
}
