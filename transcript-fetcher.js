/**
 * YouTube Transcript Fetcher Module (Browser Version)
 * 
 * Handles transcript/caption extraction with timestamps
 * Browser version uses CLIENT-SIDE scraping (like Monica.ai)
 * 
 * Phase 8: Video Intelligence
 * Phase 8.5: Multi-tier fallback system:
 *   1. YouTube Captions CLIENT-SIDE (free, instant, bypasses CORS)
 *   2. OpenAI Whisper (audio extraction)
 *   3. Google Gemini (video understanding - most reliable)
 */

import { extractVideoId } from './youtube-api.js';
import { fetchYouTubeCaptions } from './youtube-caption-scraper.js';

/**
 * Transcript source types
 */
export const TRANSCRIPT_SOURCE = {
  YOUTUBE_CAPTIONS: 'youtube-captions',
  WHISPER_AI: 'whisper-ai',
  GEMINI_AI: 'gemini-ai'
};

/**
 * Fetch transcript for a YouTube video with multi-tier fallback
 * @param {string} videoIdOrUrl - YouTube video ID or full URL
 * @param {string} language - Language code (e.g., 'en', 'es', 'fr')
 * @param {Object} options - Options for transcript fetching
 * @param {boolean} options.allowFallback - Enable AI fallbacks (default: true)
 * @param {Function} options.onStatusUpdate - Callback for status updates
 * @returns {Promise<Object>} Transcript data with segments and source metadata
 */
export async function getTranscript(videoIdOrUrl, language = 'en', options = {}) {
  const { 
    allowFallback = true,
    allowWhisperFallback = true,  // Legacy support
    onStatusUpdate = null 
  } = options;
  
  const videoId = extractVideoId(videoIdOrUrl) || videoIdOrUrl;
  const enableFallback = allowFallback && allowWhisperFallback;
  
  // TIER 1: Try YouTube captions (CLIENT-SIDE - like Monica.ai)
  try {
    if (onStatusUpdate) onStatusUpdate('Fetching YouTube captions...');
    
    const transcriptData = await fetchYouTubeCaptions(videoId, language);
    
    // Format to match expected structure
    const result = {
      transcript: transcriptData.transcript,
      metadata: {
        source: TRANSCRIPT_SOURCE.YOUTUBE_CAPTIONS,
        language: transcriptData.language,
        videoId: transcriptData.videoId,
        costEstimate: 0,
        fallbackUsed: false,
        method: 'client-side-scraping'
      }
    };
    
    if (onStatusUpdate) onStatusUpdate('YouTube captions loaded successfully!');
    return result;

  } catch (error) {
    console.log('📝 Client-side YouTube captions failed:', error.message);
  }

  if (!enableFallback) {
    throw new Error('No YouTube captions available and fallbacks are disabled');
  }

  // TIER 2: Try Whisper (works for shorter videos when audio extraction works)
  try {
    if (onStatusUpdate) onStatusUpdate('Trying Whisper AI transcription...');
    
    const whisperResult = await getTranscriptWithWhisper(videoId, language, onStatusUpdate);
    return whisperResult;
    
  } catch (whisperError) {
    console.log('📝 Whisper failed:', whisperError.message);
    if (onStatusUpdate) onStatusUpdate('Whisper unavailable, trying Gemini AI...');
  }

  // TIER 3: Gemini Video Understanding (most reliable - Google owns YouTube)
  try {
    if (onStatusUpdate) onStatusUpdate('Using Gemini AI to transcribe video (30-90 seconds)...');
    
    const geminiResult = await getTranscriptWithGemini(videoId, language, onStatusUpdate);
    return geminiResult;
    
  } catch (geminiError) {
    console.error('📝 Gemini failed:', geminiError.message);
    throw new Error(`All transcription methods failed. Last error: ${geminiError.message}`);
  }
}

/**
 * Fetch transcript using OpenAI Whisper API
 * @param {string} videoId - YouTube video ID
 * @param {string} language - Language code
 * @param {Function} onStatusUpdate - Callback for status updates
 * @returns {Promise<Object>} Transcript data with segments
 */
export async function getTranscriptWithWhisper(videoId, language = 'en', onStatusUpdate = null) {
  try {
    if (onStatusUpdate) onStatusUpdate('Extracting audio from video...');
    
    const response = await fetch('/api/youtube-whisper-transcript', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videoId, language })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Whisper transcription failed');
    }

    const transcriptData = await response.json();
    
    // Check if Whisper actually returned a valid transcript
    if (!transcriptData.segments || transcriptData.success === false) {
      throw new Error(transcriptData.message || 'Whisper did not return a valid transcript');
    }
    
    // Ensure metadata shows Whisper was used
    transcriptData.metadata = {
      ...transcriptData.metadata,
      source: TRANSCRIPT_SOURCE.WHISPER_AI,
      fallbackUsed: true
    };
    
    if (onStatusUpdate) {
      const cost = transcriptData.metadata?.costEstimate || 0;
      onStatusUpdate(`Whisper transcript generated! (Est. cost: $${cost.toFixed(4)})`);
    }
    
    return transcriptData;

  } catch (error) {
    console.error('Whisper transcript error:', error);
    throw new Error(`Whisper AI transcription failed: ${error.message}`);
  }
}

/**
 * Fetch transcript using Google Gemini Video Understanding
 * This is the most reliable method as Google owns YouTube
 * @param {string} videoId - YouTube video ID
 * @param {string} language - Language code
 * @param {Function} onStatusUpdate - Callback for status updates
 * @returns {Promise<Object>} Transcript data with segments
 */
export async function getTranscriptWithGemini(videoId, language = 'en', onStatusUpdate = null) {
  try {
    if (onStatusUpdate) onStatusUpdate('Gemini is watching the video...');
    
    // Use edge function for longer timeout (120s vs 10s)
    const response = await fetch('/api/gemini-transcript', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videoId, language })
    });

    const responseData = await response.json().catch(() => ({ error: 'Invalid response from server' }));

    if (!response.ok) {
      // Log detailed error for debugging
      console.error('Gemini API error details:', responseData);
      const errorMsg = responseData.error || 'Gemini transcription failed';
      const details = responseData.details ? ` Details: ${responseData.details.substring(0, 100)}` : '';
      throw new Error(errorMsg + details);
    }

    const transcriptData = responseData;
    
    // Ensure metadata shows Gemini was used
    transcriptData.metadata = {
      ...transcriptData.metadata,
      source: TRANSCRIPT_SOURCE.GEMINI_AI,
      fallbackUsed: true
    };
    
    if (onStatusUpdate) {
      const cost = transcriptData.metadata?.costEstimate || 0;
      onStatusUpdate(`Gemini transcript generated! (Est. cost: ~$${cost.toFixed(2)})`);
    }
    
    return transcriptData;

  } catch (error) {
    console.error('Gemini transcript error:', error);
    throw new Error(`Gemini AI transcription failed: ${error.message}`);
  }
}

/**
 * Get transcript using only YouTube captions (no fallback)
 * @param {string} videoIdOrUrl - YouTube video ID or full URL
 * @param {string} language - Language code
 * @returns {Promise<Object>} Transcript data
 */
export async function getTranscriptCaptionsOnly(videoIdOrUrl, language = 'en') {
  return getTranscript(videoIdOrUrl, language, { allowWhisperFallback: false });
}

/**
 * Check if a video has YouTube captions available
 * @param {string} videoIdOrUrl - YouTube video ID or URL
 * @returns {Promise<boolean>} True if captions are available
 */
export async function hasCaptions(videoIdOrUrl) {
  const videoId = extractVideoId(videoIdOrUrl) || videoIdOrUrl;
  
  try {
    const response = await fetch('/api/youtube-transcript', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId, language: 'en' })
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Format seconds to HH:MM:SS or MM:SS timestamp
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted timestamp
 */
export function formatTimestamp(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Parse timestamp string to seconds
 * @param {string} timestamp - Timestamp in HH:MM:SS or MM:SS format
 * @returns {number} Time in seconds
 */
export function parseTimestamp(timestamp) {
  const parts = timestamp.split(':').map(p => parseInt(p, 10));
  
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  
  return 0;
}

/**
 * Search transcript for specific text
 * @param {Object} transcript - Transcript object from getTranscript()
 * @param {string} query - Search term
 * @param {boolean} caseSensitive - Case sensitive search (default: false)
 * @returns {Array} Array of matching segments with context
 */
export function searchTranscript(transcript, query, caseSensitive = false) {
  if (!transcript || !transcript.segments || !query) {
    return [];
  }
  
  const searchTerm = caseSensitive ? query : query.toLowerCase();
  const results = [];
  
  transcript.segments.forEach((segment, index) => {
    const text = caseSensitive ? segment.text : segment.text.toLowerCase();
    
    if (text.includes(searchTerm)) {
      // Include previous and next segment for context
      const contextStart = Math.max(0, index - 1);
      const contextEnd = Math.min(transcript.segments.length - 1, index + 1);
      
      results.push({
        match: segment,
        context: {
          before: index > 0 ? transcript.segments[index - 1] : null,
          after: index < transcript.segments.length - 1 ? transcript.segments[index + 1] : null
        },
        index
      });
    }
  });
  
  return results;
}

/**
 * Get transcript segment at specific time
 * @param {Object} transcript - Transcript object
 * @param {number} timeInSeconds - Time position
 * @returns {Object|null} Segment at that time
 */
export function getSegmentAtTime(transcript, timeInSeconds) {
  if (!transcript || !transcript.segments) {
    return null;
  }
  
  return transcript.segments.find(seg => 
    seg.start <= timeInSeconds && seg.end >= timeInSeconds
  ) || null;
}

/**
 * Get transcript segments within time range
 * @param {Object} transcript - Transcript object
 * @param {number} startTime - Start time in seconds
 * @param {number} endTime - End time in seconds
 * @returns {Array} Segments within range
 */
export function getSegmentsInRange(transcript, startTime, endTime) {
  if (!transcript || !transcript.segments) {
    return [];
  }
  
  return transcript.segments.filter(seg => 
    seg.start >= startTime && seg.end <= endTime
  );
}

/**
 * Split transcript into chunks for AI processing
 * @param {Object} transcript - Transcript object
 * @param {number} maxDuration - Maximum duration per chunk in seconds
 * @returns {Array} Array of transcript chunks
 */
export function chunkTranscript(transcript, maxDuration = 300) { // 5 min default
  if (!transcript || !transcript.segments) {
    return [];
  }
  
  const chunks = [];
  let currentChunk = {
    segments: [],
    startTime: 0,
    endTime: 0,
    text: ''
  };
  
  for (const segment of transcript.segments) {
    if (currentChunk.segments.length === 0) {
      currentChunk.startTime = segment.start;
    }
    
    currentChunk.segments.push(segment);
    currentChunk.endTime = segment.end;
    
    // If chunk exceeds max duration, start new chunk
    if (currentChunk.endTime - currentChunk.startTime >= maxDuration) {
      currentChunk.text = currentChunk.segments.map(s => s.text).join(' ');
      chunks.push({ ...currentChunk });
      
      currentChunk = {
        segments: [],
        startTime: 0,
        endTime: 0,
        text: ''
      };
    }
  }
  
  // Add last chunk if not empty
  if (currentChunk.segments.length > 0) {
    currentChunk.text = currentChunk.segments.map(s => s.text).join(' ');
    chunks.push(currentChunk);
  }
  
  return chunks;
}

/**
 * Get transcript statistics
 * @param {Object} transcript - Transcript object
 * @returns {Object} Statistics about the transcript
 */
export function getTranscriptStats(transcript) {
  if (!transcript || !transcript.segments) {
    return null;
  }
  
  const words = transcript.fullText.split(/\s+/).filter(w => w.length > 0);
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  
  // Estimate reading time (avg 200 words per minute)
  const readingTimeMinutes = Math.ceil(words.length / 200);
  
  // Average segment duration
  const avgSegmentDuration = transcript.segments.length > 0
    ? transcript.totalDuration / transcript.segments.length
    : 0;
  
  return {
    totalDuration: transcript.totalDuration,
    segmentCount: transcript.segments.length,
    wordCount: words.length,
    uniqueWordCount: uniqueWords.size,
    averageWordsPerSegment: words.length / transcript.segments.length,
    averageSegmentDuration: avgSegmentDuration,
    estimatedReadingTime: readingTimeMinutes,
    language: transcript.language
  };
}

/**
 * Export transcript as plain text with timestamps
 * @param {Object} transcript - Transcript object
 * @param {boolean} includeTimestamps - Include timestamps in output
 * @returns {string} Formatted text
 */
export function exportAsText(transcript, includeTimestamps = true) {
  if (!transcript || !transcript.segments) {
    return '';
  }
  
  if (!includeTimestamps) {
    return transcript.fullText;
  }
  
  return transcript.segments
    .map(seg => `[${seg.timestamp}] ${seg.text}`)
    .join('\n');
}

/**
 * Export transcript as SRT subtitle format
 * @param {Object} transcript - Transcript object
 * @returns {string} SRT formatted string
 */
export function exportAsSRT(transcript) {
  if (!transcript || !transcript.segments) {
    return '';
  }
  
  return transcript.segments.map((seg, index) => {
    const startTime = formatSRTTimestamp(seg.start);
    const endTime = formatSRTTimestamp(seg.end);
    
    return `${index + 1}\n${startTime} --> ${endTime}\n${seg.text}\n`;
  }).join('\n');
}

/**
 * Format timestamp for SRT subtitle format (HH:MM:SS,mmm)
 * @param {number} seconds - Time in seconds
 * @returns {string} SRT formatted timestamp
 */
function formatSRTTimestamp(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${millis.toString().padStart(3, '0')}`;
}

export default {
  getTranscript,
  formatTimestamp,
  parseTimestamp,
  searchTranscript,
  getSegmentAtTime,
  getSegmentsInRange,
  chunkTranscript,
  getTranscriptStats,
  exportAsText,
  exportAsSRT
};
