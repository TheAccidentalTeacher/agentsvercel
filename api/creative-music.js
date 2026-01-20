/**
 * Vercel API Route: Creative Music
 * Music generation via Replicate (MusicGen)
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
    const { prompt, genre, duration, tempo, mood } = req.body;

    console.log('[Music Generation] Request received:', { genre, duration, tempo, mood });

    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Music description is required' });
    }

    if (prompt.length > 1000) {
      return res.status(400).json({ error: 'Description too long. Maximum 1000 characters.' });
    }

    const enhancedPrompt = buildMusicPrompt(prompt, genre, tempo, mood);
    const result = await generateMusicWithReplicate(enhancedPrompt, duration);

    console.log('[Music Generation] ✓ Generation successful');

    return res.status(200).json({
      success: true,
      url: result.url,
      duration: duration || 30,
      metadata: {
        genre,
        tempo,
        mood,
        duration,
        prompt: enhancedPrompt,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Music Generation] ✗ Error:', error);
    return res.status(500).json({
      error: error.message || 'Music generation failed'
    });
  }
}

function buildMusicPrompt(prompt, genre, tempo, mood) {
  const parts = [prompt];
  
  if (genre) parts.push(`${genre} genre`);
  if (tempo) parts.push(`${tempo} tempo`);
  if (mood) parts.push(`${mood} mood`);
  
  return parts.join(', ');
}

async function generateMusicWithReplicate(prompt, duration) {
  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
  
  if (!REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN not configured');
  }

  // Use Meta's MusicGen model
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      version: 'facebook/musicgen:melody-large',
      input: {
        prompt,
        duration: duration || 30,
        temperature: 1.0,
        top_k: 250,
        top_p: 0.0
      }
    })
  });

  const prediction = await response.json();

  // Poll for completion
  let result = prediction;
  while (result.status !== 'succeeded' && result.status !== 'failed') {
    await new Promise(r => setTimeout(r, 2000));
    const pollResponse = await fetch(result.urls.get, {
      headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` }
    });
    result = await pollResponse.json();
  }

  if (result.status === 'failed') {
    throw new Error(result.error || 'Music generation failed');
  }

  return { url: result.output };
}
