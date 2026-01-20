/**
 * Netlify Edge Function: YouTube Gemini Transcript
 * 
 * Uses Google Gemini 2.0 to generate transcripts from YouTube videos
 * Edge Functions have much longer timeout (up to 120 seconds vs 10 seconds)
 */

export default async (request, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response('', { status: 200, headers });
  }

  // Only allow POST
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers }
    );
  }

  // Check for Gemini API key
  const geminiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_API_KEY') || Deno.env.get('GOOGLE_CLOUD_API_KEY');
  if (!geminiKey) {
    return new Response(
      JSON.stringify({ error: 'Gemini API key not configured. Set GEMINI_API_KEY in Netlify environment variables.' }),
      { status: 500, headers }
    );
  }

  try {
    const body = await request.json();
    const { videoId, language = 'en' } = body;

    if (!videoId) {
      return new Response(
        JSON.stringify({ error: 'videoId is required' }),
        { status: 400, headers }
      );
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

    const GEMINI_MODEL = 'gemini-2.0-flash';
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

    console.log('   Sending to Gemini API...');

    const response = await fetch(`${GEMINI_API_URL}?key=${geminiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

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
          errorMessage = 'Gemini API returned an error page. The API key may be invalid.';
          errorDetails = 'HTML error page received';
        }
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: errorDetails.substring(0, 500),
          apiStatus: response.status
        }),
        { status: response.status, headers }
      );
    }

    const result = await response.json();
    
    // Extract transcript text from Gemini response
    const transcriptText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!transcriptText || transcriptText.length < 50) {
      return new Response(
        JSON.stringify({ 
          error: 'Gemini did not return a valid transcript',
          details: 'Response was empty or too short',
          rawResponse: JSON.stringify(result).substring(0, 500)
        }),
        { status: 500, headers }
      );
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
        costEstimate: 0.02,
        note: 'AI-generated transcript - timestamps are approximate'
      }
    };

    return new Response(
      JSON.stringify(transcriptResponse),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('❌ Gemini transcript error:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Unknown error',
        stack: error.stack?.substring(0, 300)
      }),
      { status: 500, headers }
    );
  }
};

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

// Configure the edge function path
export const config = {
  path: "/api/gemini-transcript"
};
