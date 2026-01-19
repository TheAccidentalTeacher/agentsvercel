/**
 * Netlify Function: YouTube Whisper Transcript
 * 
 * Fallback transcript generation using OpenAI Whisper API
 * Used when YouTube captions are not available
 * 
 * Flow:
 * 1. Extract audio URL from YouTube video
 * 2. Download audio (opus format, smallest)
 * 3. Send to OpenAI Whisper API
 * 4. Return formatted transcript with timestamps
 */

const { Innertube } = require('youtubei.js');
const { fetch: undiciFetch } = require('undici');

// OpenAI Whisper API endpoint
const WHISPER_API_URL = 'https://api.openai.com/v1/audio/transcriptions';

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

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'OpenAI API key not configured' })
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

    console.log(`🎤 Whisper transcription for video: ${videoId}`);
    const startTime = Date.now();

    // Initialize YouTube client
    const youtube = await Innertube.create({
      retrieve_player: true,
      generate_session_locally: true
    });

    // Get video info
    const videoInfo = await youtube.getBasicInfo(videoId);
    const duration = videoInfo.basic_info?.duration || 0;
    
    console.log(`   Video duration: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`);

    // Check video length - Whisper has 25MB file limit
    // For very long videos (> 30 min), we may need to warn user
    if (duration > 1800) { // 30 minutes
      console.log(`   ⚠️ Long video detected (${Math.floor(duration / 60)} min)`);
    }

    // Get audio stream URL (audio only, lowest quality for speed)
    const streamingData = videoInfo.streaming_data;
    if (!streamingData) {
      throw new Error('No streaming data available for this video');
    }

    // Find audio-only format (prefer opus for smallest size)
    let audioFormat = streamingData.adaptive_formats?.find(
      f => f.mime_type?.includes('audio/webm') && f.audio_quality === 'AUDIO_QUALITY_LOW'
    );
    
    if (!audioFormat) {
      audioFormat = streamingData.adaptive_formats?.find(
        f => f.mime_type?.includes('audio/')
      );
    }

    if (!audioFormat) {
      throw new Error('No audio format available for this video');
    }

    console.log(`   Audio format: ${audioFormat.mime_type}, bitrate: ${audioFormat.bitrate}`);

    // Download audio
    const audioUrl = audioFormat.decipher(youtube.session.player);
    console.log(`   Downloading audio...`);
    
    const audioResponse = await undiciFetch(audioUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: ${audioResponse.status}`);
    }

    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    console.log(`   Audio size: ${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    // Check file size (Whisper limit is 25MB)
    if (audioBuffer.length > 25 * 1024 * 1024) {
      throw new Error('Audio file too large for Whisper API (> 25MB). Try a shorter video.');
    }

    // Send to OpenAI Whisper
    console.log(`   Sending to Whisper API...`);
    
    // Create form data manually for Node.js
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const formParts = [];
    
    // Add file
    formParts.push(
      `--${boundary}\r\n`,
      `Content-Disposition: form-data; name="file"; filename="audio.webm"\r\n`,
      `Content-Type: audio/webm\r\n\r\n`
    );
    
    const fileHeader = Buffer.from(formParts.join(''));
    const fileFooter = Buffer.from(`\r\n--${boundary}\r\n`);
    
    // Add model parameter
    const modelPart = Buffer.from(
      `Content-Disposition: form-data; name="model"\r\n\r\nwhisper-1\r\n--${boundary}\r\n`
    );
    
    // Add response_format parameter (verbose_json for timestamps)
    const formatPart = Buffer.from(
      `Content-Disposition: form-data; name="response_format"\r\n\r\nverbose_json\r\n--${boundary}\r\n`
    );
    
    // Add language parameter
    const langPart = Buffer.from(
      `Content-Disposition: form-data; name="language"\r\n\r\n${language}\r\n--${boundary}--\r\n`
    );
    
    // Combine all parts
    const formBody = Buffer.concat([
      fileHeader,
      audioBuffer,
      fileFooter,
      modelPart,
      formatPart,
      langPart
    ]);

    const whisperResponse = await undiciFetch(WHISPER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: formBody
    });

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error('Whisper API error:', errorText);
      throw new Error(`Whisper API error: ${whisperResponse.status}`);
    }

    const whisperResult = await whisperResponse.json();
    console.log(`   Whisper transcription complete!`);

    // Transform Whisper response to our transcript format
    const segments = (whisperResult.segments || []).map(seg => ({
      text: seg.text.trim(),
      start: seg.start,
      duration: seg.end - seg.start,
      end: seg.end,
      timestamp: formatTimestamp(seg.start)
    }));

    // Build full text
    const fullText = segments.map(s => s.text).join(' ');

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`   ✅ Complete in ${processingTime}s`);

    // Calculate approximate cost ($0.006 per minute)
    const costEstimate = (duration / 60 * 0.006).toFixed(4);

    const response = {
      videoId,
      language: whisperResult.language || language,
      segments,
      fullText,
      totalDuration: duration,
      wordCount: fullText.split(/\s+/).filter(w => w.length > 0).length,
      segmentCount: segments.length,
      metadata: {
        source: 'whisper',
        model: 'whisper-1',
        processingTime: parseFloat(processingTime),
        costEstimate: parseFloat(costEstimate),
        audioSize: audioBuffer.length,
        detectedLanguage: whisperResult.language
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('❌ Whisper transcript error:', error);

    let errorMessage = error.message;
    let statusCode = 500;

    if (error.message.includes('No streaming data')) {
      errorMessage = 'Video is not available for audio extraction (may be private, age-restricted, or premium content)';
      statusCode = 403;
    } else if (error.message.includes('too large')) {
      errorMessage = 'Video is too long for automatic transcription. Maximum ~25 minutes.';
      statusCode = 413;
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
