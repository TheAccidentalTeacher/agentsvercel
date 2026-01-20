/**
 * Netlify Function: YouTube Gemini Transcript
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
 * Note: Configured to run as a standard function with extended timeout
 */

const { fetch: undiciFetch } = require('undici');

// Gemini API endpoint - using gemini-2.0-flash for YouTube video understanding
// Note: YouTube URL feature is in preview and requires v1beta endpoint
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Netlify config for extended timeout (up to 26 seconds on paid plans)
exports.config = {
  type: 'default'
};

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Check for Google API key (prioritize Gemini-specific key)
  const googleKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_CLOUD_API_KEY;
  if (!googleKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Gemini API key not configured. Set GEMINI_API_KEY in Netlify environment variables.' })
    };
  }

  try {
    const { videoId, language = 'en' } = JSON.parse(event.body);

    if (!videoId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'videoId is required' })
      };
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
    // Note: For YouTube URLs, we use file_data with fileUri (no mimeType needed)
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
        temperature: 0.1,  // Low temperature for accuracy
        maxOutputTokens: 32000,  // Allow long transcripts
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

    // Create an AbortController for timeout (Netlify has 10s limit)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

    let response;
    try {
      response = await undiciFetch(`${GEMINI_API_URL}?key=${googleKey}`, {
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
        console.error('❌ Request timed out after 25 seconds');
        return {
          statusCode: 504,
          headers,
          body: JSON.stringify({ 
            error: 'Gemini API request timed out. The video may be too long for real-time processing.',
            suggestion: 'Try a shorter video or use YouTube captions if available.'
          })
        };
      }
      throw fetchError;
    }
    clearTimeout(timeoutId);

    console.log('   Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error response:', errorText);
      console.error('Response status:', response.status);
      console.error('Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));
      
      // Parse error for better messaging
      let errorMessage = `Gemini API error: ${response.status}`;
      let errorDetails = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
          errorDetails = JSON.stringify(errorJson.error, null, 2);
        }
      } catch {
        // If not JSON, it might be an HTML error page
        if (errorText.includes('<HTML') || errorText.includes('<!DOCTYPE')) {
          errorMessage = 'Gemini API returned an error page. The API key may be invalid or the service unavailable.';
          errorDetails = 'HTML error page received';
        }
      }
      
      // Return the error with details for debugging
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: errorMessage,
          details: errorDetails.substring(0, 500), // Limit size
          apiStatus: response.status
        })
      };
    }

    const result = await response.json();
    
    // Extract transcript text from Gemini response
    const transcriptText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!transcriptText || transcriptText.length < 50) {
      throw new Error('Gemini did not return a valid transcript');
    }

    console.log(`   Gemini response received: ${transcriptText.length} characters`);

    // Parse the transcript into segments
    const segments = parseTranscriptToSegments(transcriptText);
    
    // Build full text (without timestamps)
    const fullText = segments.map(s => s.text).join(' ');

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`   ✅ Complete in ${processingTime}s - ${segments.length} segments`);

    // Estimate duration from last timestamp
    const lastSegment = segments[segments.length - 1];
    const estimatedDuration = lastSegment ? lastSegment.start + 60 : 0;

    // Estimate cost (rough - depends on video length, typically $0.01-0.05)
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(transcriptResponse)
    };

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

    return {
      statusCode,
      headers,
      body: JSON.stringify({
        error: errorMessage,
        videoId: JSON.parse(event.body || '{}').videoId
      })
    };
  }
};

/**
 * Parse Gemini's transcript output into structured segments
 * Expected format: [MM:SS] Text content here...
 */
function parseTranscriptToSegments(text) {
  const segments = [];
  
  // Split by timestamp pattern [MM:SS] or [H:MM:SS]
  const timestampRegex = /\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]/g;
  
  let lastIndex = 0;
  let lastTimestamp = 0;
  let match;
  
  // Find all timestamps and their positions
  const matches = [];
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
  
  // Extract text between timestamps
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];
    
    const textStart = current.endIndex;
    const textEnd = next ? next.index : text.length;
    
    let segmentText = text.substring(textStart, textEnd).trim();
    
    // Clean up the text
    segmentText = segmentText
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
  
  // If no timestamps found, treat entire text as one segment
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

/**
 * Format seconds to MM:SS or HH:MM:SS timestamp
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
