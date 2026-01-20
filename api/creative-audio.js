/**
 * Vercel API Route: Creative Audio (TTS)
 * Supports OpenAI TTS, ElevenLabs
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
    const { text, engine, voice, language, speed } = req.body;

    console.log('[TTS Generation] Request received:', { engine, voice, textLength: text?.length });

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (text.length > 5000) {
      return res.status(400).json({ error: 'Text too long. Maximum 5000 characters.' });
    }

    let result;
    switch (engine) {
      case 'elevenlabs':
        result = await generateWithElevenLabs(text, voice, speed);
        break;
      case 'openai':
      default:
        result = await generateWithOpenAI(text, voice, speed);
        break;
    }

    console.log('[TTS Generation] ✓ Generation successful');

    return res.status(200).json({
      success: true,
      url: result.url,
      duration: result.duration,
      metadata: {
        engine,
        voice,
        language,
        textLength: text.length,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[TTS Generation] ✗ Error:', error);
    return res.status(500).json({
      error: error.message || 'TTS generation failed'
    });
  }
}

async function generateWithOpenAI(text, voice, speed) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice: voice || 'alloy',
      speed: speed || 1.0
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI TTS failed');
  }

  const audioBuffer = await response.arrayBuffer();
  const base64Audio = Buffer.from(audioBuffer).toString('base64');
  
  return {
    url: `data:audio/mp3;base64,${base64Audio}`,
    duration: Math.ceil(text.length / 15) // Rough estimate
  };
}

async function generateWithElevenLabs(text, voice, speed) {
  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
  
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY not configured');
  }

  const voiceId = voice || '21m00Tcm4TlvDq8ikWAM'; // Default voice

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    })
  });

  if (!response.ok) {
    throw new Error('ElevenLabs TTS failed');
  }

  const audioBuffer = await response.arrayBuffer();
  const base64Audio = Buffer.from(audioBuffer).toString('base64');
  
  return {
    url: `data:audio/mp3;base64,${base64Audio}`,
    duration: Math.ceil(text.length / 15)
  };
}
