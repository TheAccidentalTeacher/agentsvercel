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

    console.log('=== YouTube Transcript Debug ===');
    console.log(`Video ID: ${videoId}, Language: ${language}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);

    // Use youtubei.js which is already in package.json
    console.log('Step 1: Importing youtubei.js...');
    const { Innertube } = await import('youtubei.js');
    console.log('✓ Import successful');
    
    console.log('Step 2: Creating Innertube instance...');
    const yt = await Innertube.create();
    console.log('✓ Innertube created');
    
    console.log('Step 3: Getting video info...');
    const info = await yt.getInfo(videoId);
    console.log('✓ Video info retrieved');
    console.log(`Video title: ${info.basic_info?.title || 'Unknown'}`);
    console.log(`Video duration: ${info.basic_info?.duration || 'Unknown'}`);
    
    console.log('Step 4: Getting transcript...');
    const transcriptData = await info.getTranscript();
    console.log('✓ Transcript data received');
    console.log(`Transcript object keys: ${Object.keys(transcriptData || {}).join(', ')}`);
    
    if (!transcriptData) {
      console.error('❌ No transcript data returned');
      return res.status(404).json({ 
        error: 'No transcript available - transcriptData is null',
        videoId,
        debug: {
          hasInfo: !!info,
          infoKeys: Object.keys(info || {})
        }
      });
    }

    console.log(`Transcript content keys: ${Object.keys(transcriptData.transcript?.content || {}).join(', ')}`);
    
    if (!transcriptData.transcript || !transcriptData.transcript.content) {
      console.error('❌ Invalid transcript structure');
      console.error(`Transcript structure: ${JSON.stringify(transcriptData, null, 2).substring(0, 500)}`);
      return res.status(404).json({ 
        error: 'Invalid transcript structure',
        videoId,
        debug: {
          hasTranscript: !!transcriptData.transcript,
          hasContent: !!transcriptData.transcript?.content,
          structure: Object.keys(transcriptData)
        }
      });
    }

    console.log('Step 5: Extracting segments...');
    const rawSegments = transcriptData.transcript.content.body.initial_segments;
    console.log(`Found ${rawSegments?.length || 0} segments`);
    
    if (!rawSegments || rawSegments.length === 0) {
      console.error('❌ No segments in transcript');
      return res.status(404).json({ 
        error: 'Transcript has no segments',
        videoId
      });
    }

    // Transform to our format
    const segments = rawSegments.map(seg => ({
      text: seg.snippet.text,
      start: seg.start_ms / 1000,
      duration: seg.end_ms / 1000 - seg.start_ms / 1000,
      end: seg.end_ms / 1000,
      timestamp: formatTimestamp(seg.start_ms / 1000)
    }));

    console.log(`✓ Transformed ${segments.length} segments`);
    console.log(`First segment: "${segments[0]?.text?.substring(0, 50)}..."`);

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

    console.log('=== Success ===');
    console.log(`Total segments: ${response.segmentCount}`);
    console.log(`Total words: ${response.wordCount}`);
    console.log(`Duration: ${response.totalDuration}s`);

    return res.status(200).json(response);

  } catch (error) {
    console.error('=== ERROR ===');
    console.error('Error type:', error.constructor?.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack?.substring(0, 500));

    return res.status(404).json({ 
      error: 'Transcript fetch failed',
      errorType: error.constructor?.name,
      errorMessage: error.message,
      videoId: req.body?.videoId,
      debug: {
        timestamp: new Date().toISOString(),
        stack: error.stack?.split('\n').slice(0, 3)
      }
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
