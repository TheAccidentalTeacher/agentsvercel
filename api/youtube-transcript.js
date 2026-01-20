/**
 * Vercel API Route: YouTube Transcript Fetcher
 * 
 * Uses youtubei.js (already in package.json) to fetch transcripts
 * More reliable on Vercel serverless than youtube-transcript-plus
 */

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

    console.log(`Fetching transcript for video: ${videoId}, language: ${language}`);

    // Use youtubei.js which is already in package.json
    const { Innertube } = await import('youtubei.js');
    const yt = await Innertube.create();
    
    const info = await yt.getInfo(videoId);
    const transcriptData = await info.getTranscript();
    
    if (!transcriptData || !transcriptData.transcript) {
      return res.status(404).json({ 
        error: 'No transcript available for this video',
        videoId
      });
    }

    // Transform to our format
    const segments = transcriptData.transcript.content.body.initial_segments.map(seg => ({
      text: seg.snippet.text,
      start: seg.start_ms / 1000,
      duration: seg.end_ms / 1000 - seg.start_ms / 1000,
      end: seg.end_ms / 1000,
      timestamp: formatTimestamp(seg.start_ms / 1000)
    }));

    const fullText = segments.map(s => s.text).join(' ');

    const response = {
      videoId,
      language,
      segments,
      fullText,
      totalDuration: segments.length > 0 ? segments[segments.length - 1].end : 0,
      wordCount: segments.reduce((count, seg) => count + seg.text.split(/\s+/).length, 0),
      segmentCount: segments.length
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Transcript fetch error:', error);
    console.error('Error message:', error.message);

    return res.status(404).json({ 
      error: 'No transcript available for this video',
      errorType: error.constructor?.name,
      videoId: req.body?.videoId
    });
  }
}

/**
 * Format seconds to HH:MM:SS or MM:SS timestamp
 */
function formatTimestamp(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
