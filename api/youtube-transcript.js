/**
 * Vercel API Route: YouTube Transcript Fetcher
 * 
 * Fetches transcripts from YouTube videos using youtube-transcript-plus
 * This runs server-side to avoid CORS issues
 */

// Dynamic import to handle missing package gracefully
let fetchTranscript;
try {
  const module = await import('youtube-transcript-plus');
  fetchTranscript = module.fetchTranscript;
} catch (e) {
  console.warn('youtube-transcript-plus not available, will return 404 to trigger fallback');
  fetchTranscript = null;
}

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

    // Check if youtube-transcript-plus is available
    if (!fetchTranscript) {
      return res.status(404).json({ 
        error: 'YouTube captions not available (package not loaded). Please use AI fallback.',
        videoId,
        fallbackRequired: true
      });
    }

    // Fetch transcript using youtube-transcript-plus
    const config = {
      lang: language,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };

    const rawSegments = await fetchTranscript(videoId, config);

    // Transform to our format
    const segments = rawSegments.map(segment => ({
      text: segment.text,
      start: parseFloat(segment.offset),
      duration: parseFloat(segment.duration),
      end: parseFloat(segment.offset) + parseFloat(segment.duration),
      timestamp: formatTimestamp(parseFloat(segment.offset))
    }));

    // Calculate full text
    const fullText = segments.map(s => s.text).join(' ');

    const response = {
      videoId,
      language,
      segments,
      fullText,
      totalDuration: segments.length > 0 
        ? segments[segments.length - 1].end 
        : 0,
      wordCount: segments.reduce((count, seg) => count + seg.text.split(/\s+/).length, 0),
      segmentCount: segments.length
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Transcript fetch error:', error);
    console.error('Error name:', error.constructor?.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Handle specific errors
    let errorMessage = error.message || 'Unknown error';
    let statusCode = 500;

    const errorName = error.constructor?.name || '';
    
    if (errorName === 'YoutubeTranscriptNotAvailableError' || errorMessage.includes('not available')) {
      errorMessage = 'No transcript available for this video. The video may not have captions.';
      statusCode = 404;
    } else if (errorName === 'YoutubeTranscriptDisabledError' || errorMessage.includes('disabled')) {
      errorMessage = 'Transcripts are disabled for this video';
      statusCode = 403;
    } else if (errorName === 'YoutubeTranscriptVideoUnavailableError' || errorMessage.includes('unavailable')) {
      errorMessage = 'Video is unavailable or has been removed';
      statusCode = 404;
    }

    return res.status(statusCode).json({ 
      error: errorMessage,
      errorType: errorName,
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
