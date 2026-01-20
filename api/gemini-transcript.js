/**
 * Vercel API Route: YouTube Gemini Transcript
 * 
 * Uses Google Gemini 2.0 to generate transcripts from YouTube videos
 * Gemini can "watch" videos directly via YouTube URLs
 * 
 * This is the most reliable fallback because:
 * 1. Google owns YouTube - no access restrictions
 * 2. Handles any video length up to ~1 hour
 * 3. Works even when audio extraction fails
 * 4. No need to download audio locally
 * 
 * Vercel Pro provides 60-second timeout (vs Netlify's 10s)
 */

// Gemini API endpoint - using gemini-2.0-flash for YouTube video understanding
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Vercel function config - 60 second timeout for video processing
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

  // Check for Google API key (prioritize Gemini-specific key)
  const googleKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_CLOUD_API_KEY;
  if (!googleKey) {
    return res.status(500).json({ 
      error: 'Gemini API key not configured. Set GEMINI_API_KEY in Vercel environment variables.' 
    });
  }

  try {
    const { videoId, language = 'en' } = req.body;

    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' });
    }

    console.log(`🎬 Gemini video transcription for: ${videoId}`);
    const startTime = Date.now();

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Use Gemini to generate a detailed transcript
    const prompt = `You are a professional transcription service. Watch this YouTube video and create a detailed transcript.

IMPORTANT INSTRUCTIONS:
1. Transcribe ALL spoken words in the video as accurately as possible
2. Include timestamps every 30-60 seconds in [MM:SS] format
3. Capture the COMPLETE content - do not summarize or skip sections
4. If there are multiple speakers, try to indicate speaker changes
5. Include any important on-screen text that's spoken about
6. Maintain the original language unless translation is requested

OUTPUT FORMAT:
Return ONLY the transcript in this exact format:
[0:00] First words of the video...
[0:30] Continuing transcription...
[1:00] More content...

Do not include any introduction, commentary, or summary. Just the pure transcript with timestamps.

VIDEO URL: ${videoUrl}`;

    // Request body for Gemini API with YouTube URL
    const requestBody = {
      contents: [{
        parts: [
          {
            text: prompt
          },
          {
            file_data: {
              file_uri: videoUrl
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 32000,
        topP: 0.95
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ]
    };

    console.log('   Sending to Gemini API...');
    console.log('   API URL:', GEMINI_API_URL);
    console.log('   Video URL:', videoUrl);

    // Create AbortController for timeout (55 seconds to leave buffer)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000);

    let response;
    try {
      response = await fetch(`${GEMINI_API_URL}?key=${googleKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('❌ Request timed out after 55 seconds');
        return res.status(504).json({ 
          error: 'Gemini API request timed out. The video may be too long for real-time processing.',
          suggestion: 'Try a shorter video or use YouTube captions if available.'
        });
      }
      throw fetchError;
    }
    clearTimeout(timeoutId);

    console.log('   Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error response:', errorText);
      
      let errorMessage = `Gemini API error: ${response.status}`;
      let errorDetails = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
          errorDetails = JSON.stringify(errorJson.error, null, 2);
        }
      } catch {
        if (errorText.includes('<HTML') || errorText.includes('<!DOCTYPE')) {
          errorMessage = 'Gemini API returned an error page. The API key may be invalid or the service unavailable.';
          errorDetails = 'HTML error page received';
        }
      }
      
      return res.status(response.status).json({ 
        error: errorMessage,
        details: errorDetails.substring(0, 500),
        apiStatus: response.status
      });
    }

    const result = await response.json();
    
    const transcriptText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!transcriptText || transcriptText.length < 50) {
      throw new Error('Gemini did not return a valid transcript');
    }

    console.log(`   Gemini response received: ${transcriptText.length} characters`);

    const segments = parseTranscriptToSegments(transcriptText);
    const fullText = segments.map(s => s.text).join(' ');

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`   ✅ Complete in ${processingTime}s - ${segments.length} segments`);

    const lastSegment = segments[segments.length - 1];
    const estimatedDuration = lastSegment ? lastSegment.start + 60 : 0;
    const costEstimate = 0.02;

    const transcriptResponse = {
      videoId,
      language,
      segments,
      fullText,
      totalDuration: estimatedDuration,
      wordCount: fullText.split(/\s+/).filter(w => w.length > 0).length,
      segmentCount: segments.length,
      metadata: {
        source: 'gemini',
        model: GEMINI_MODEL,
        processingTime: parseFloat(processingTime),
        costEstimate,
        note: 'AI-generated transcript - timestamps are approximate'
      }
    };

    return res.status(200).json(transcriptResponse);

  } catch (error) {
    console.error('❌ Gemini transcript error:', error);

    let errorMessage = error.message;
    let statusCode = 500;

    if (error.message.includes('quota') || error.message.includes('limit')) {
      errorMessage = 'API quota exceeded. Please try again later.';
      statusCode = 429;
    } else if (error.message.includes('not found') || error.message.includes('unavailable')) {
      errorMessage = 'Video not accessible to Gemini';
      statusCode = 404;
    }

    return res.status(statusCode).json({
      error: errorMessage,
      videoId: req.body?.videoId
    });
  }
}

/**
 * Parse Gemini's transcript output into structured segments
 */
function parseTranscriptToSegments(text) {
  const segments = [];
  const timestampRegex = /\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]/g;
  
  const matches = [];
  let match;
  while ((match = timestampRegex.exec(text)) !== null) {
    const hours = match[3] ? parseInt(match[1]) : 0;
    const minutes = match[3] ? parseInt(match[2]) : parseInt(match[1]);
    const seconds = match[3] ? parseInt(match[3]) : parseInt(match[2]);
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    
    matches.push({
      index: match.index,
      endIndex: match.index + match[0].length,
      timestamp: totalSeconds
    });
  }
  
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];
    
    const textStart = current.endIndex;
    const textEnd = next ? next.index : text.length;
    
    let segmentText = text.substring(textStart, textEnd).trim()
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (segmentText.length > 0) {
      const duration = next ? next.timestamp - current.timestamp : 30;
      
      segments.push({
        text: segmentText,
        start: current.timestamp,
        duration: duration,
        end: current.timestamp + duration,
        timestamp: formatTimestamp(current.timestamp)
      });
    }
  }
  
  if (segments.length === 0 && text.trim().length > 0) {
    segments.push({
      text: text.trim().replace(/\n+/g, ' ').replace(/\s+/g, ' '),
      start: 0,
      duration: 60,
      end: 60,
      timestamp: '0:00'
    });
  }
  
  return segments;
}

function formatTimestamp(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
