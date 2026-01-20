/**
 * Vercel API Route: YouTube Whisper Transcript
 * Fallback transcript generation using OpenAI Whisper API
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

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  try {
    const { videoId, language = 'en' } = req.body;

    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' });
    }

    console.log(`🎤 Whisper transcription for video: ${videoId}`);

    // Note: Full Whisper transcription requires audio download which is complex in serverless
    // This returns a message directing to use caption-based transcription first
    return res.status(200).json({
      success: false,
      message: 'Whisper transcription requires audio extraction. Please use YouTube captions first.',
      videoId,
      suggestion: 'Try the youtube-transcript endpoint for caption-based transcription.',
      whisperAvailable: false
    });

  } catch (error) {
    console.error('[Whisper Transcript] Error:', error);
    return res.status(500).json({
      error: 'Whisper transcription failed',
      details: error.message
    });
  }
}
