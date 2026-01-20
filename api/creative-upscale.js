/**
 * Vercel API Route: Creative Upscale
 * Image upscaling via Real-ESRGAN on Replicate
 */

export const config = {
  maxDuration: 60
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
    const { imageUrl, scale, faceRestore } = req.body;

    console.log('[Image Upscale] Request received:', { scale, faceRestore });

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    const result = await upscaleWithReplicate(imageUrl, scale || 4, faceRestore || false);

    console.log('[Image Upscale] ✓ Upscaling successful');

    return res.status(200).json({
      success: true,
      url: result.url,
      originalSize: result.originalSize,
      newSize: result.newSize,
      metadata: {
        scale: scale || 4,
        faceRestore,
        upscaledAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Image Upscale] ✗ Error:', error);
    return res.status(500).json({
      error: error.message || 'Image upscaling failed'
    });
  }
}

async function upscaleWithReplicate(imageUrl, scale, faceRestore) {
  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
  
  if (!REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN not configured');
  }

  // Use appropriate model based on face restoration need
  const modelVersion = faceRestore 
    ? 'tencentarc/gfpgan:9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3'
    : 'nightmareai/real-esrgan:42186ee6d4fe5b7e45f3e08c88a4d2b3c56e5a4d7b2fd8cc0f9f0c8a2a8a9c';

  console.log('[Upscale] Using model:', faceRestore ? 'GFPGAN' : 'Real-ESRGAN');

  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      version: modelVersion,
      input: {
        image: imageUrl,
        scale: scale,
        face_enhance: faceRestore
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
    throw new Error(result.error || 'Upscaling failed');
  }

  return {
    url: result.output,
    originalSize: 'unknown',
    newSize: `${scale}x upscaled`
  };
}
