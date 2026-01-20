/**
 * Vercel API Route: YouTube Transcript Fetcher
 * Uses youtube-transcript package - PROVEN to work on Vercel
 */

import { YoutubeTranscript } from 'youtube-transcript';

export const config = {
  maxDuration: 60
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { videoId, language = 'en' } = req.body || {};

    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' });
    }

    console.log(`[Transcript] Fetching for video: ${videoId}, language: ${language}`);

    // Fetch transcript using youtube-transcript package
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: language
    });

    console.log(`[Transcript] ✓ Got ${transcript.length} segments`);

    // Return in expected format
    return res.status(200).json({
      transcript: transcript.map(seg => ({
        text: seg.text,
        start: seg.offset / 1000,
        duration: seg.duration / 1000,
        offset: seg.offset,
        lang: language
      })),
      videoId,
      language,
      success: true
    });

  } catch (error) {
    console.error('[Transcript] Error:', error.message);

    return res.status(500).json({
      error: 'Failed to fetch transcript',
      message: error.message,
      videoId: req.body?.videoId
    });
  }
}
