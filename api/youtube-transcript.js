/**
 * Vercel API Route: YouTube Transcript Fetcher
 * 
 * Scrapes transcript directly from YouTube page HTML (like Monica.ai and Brisk.ai)
 * No external packages needed - just fetch and parse the page
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

    console.log('=== YouTube Transcript Scraper (Monica.ai Method) ===');
    console.log(`Video ID: ${videoId}, Language: ${language}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);

    // Step 1: Fetch YouTube page HTML (same as Monica.ai)
    console.log('Step 1: Fetching YouTube page...');
    const pageUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch YouTube page: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    console.log(`✓ Page fetched (${Math.round(html.length / 1024)}KB)`);
    
    // Step 2: Extract player response from page
    console.log('Step 2: Extracting player response...');
    const match = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
    
    if (!match) {
      throw new Error('Could not find player response in page HTML');
    }
    
    const playerResponse = JSON.parse(match[1]);
    console.log('✓ Player response parsed');
    
    // Step 3: Find caption tracks
    console.log('Step 3: Finding caption tracks...');
    const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    
    if (!captions || captions.length === 0) {
      throw new Error('No captions available for this video');
    }
    
    console.log(`✓ Found ${captions.length} caption track(s)`);
    captions.forEach((track, i) => {
      console.log(`  Track ${i + 1}: ${track.name.simpleText} (${track.languageCode})`);
    });
    
    // Find requested language or fall back to first available
    let captionTrack = captions.find(track => track.languageCode === language);
    if (!captionTrack) {
      captionTrack = captions[0];
      console.log(`Language '${language}' not found, using '${captionTrack.languageCode}'`);
    }
    
    // Step 4: Fetch caption XML
    console.log('Step 4: Fetching caption data...');
    const captionResponse = await fetch(captionTrack.baseUrl);
    const captionXml = await captionResponse.text();
    console.log(`✓ Caption XML fetched (${Math.round(captionXml.length / 1024)}KB)`);
    
    // Step 5: Parse XML captions
    console.log('Step 5: Parsing captions...');
    const textRegex = /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g;
    const segments = [];
    let xmlMatch;
    
    while ((xmlMatch = textRegex.exec(captionXml)) !== null) {
      const start = parseFloat(xmlMatch[1]);
      const duration = parseFloat(xmlMatch[2]);
      let text = xmlMatch[3];
      
      // Decode HTML entities
      text = text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n/g, ' ')
        .trim();
      
      if (text) {
        segments.push({
          text,
          start,
          duration,
          offset: Math.floor(start * 1000),
          lang: captionTrack.languageCode
        });
      }
    }
    
    console.log(`✓ Parsed ${segments.length} caption segments`);
    
    if (segments.length === 0) {
      throw new Error('No caption text found in XML');
    }

    console.log(`First segment: "${segments[0].text.substring(0, 50)}..."`);
    console.log(`Last segment: "${segments[segments.length - 1].text.substring(0, 50)}..."`);

    // Return transcript in expected format
    console.log('=== SUCCESS ===');
    return res.status(200).json({
      transcript: segments,
      videoId,
      language: captionTrack.languageCode,
      success: true
    });

  } catch (error) {
    console.error('=== ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);

    return res.status(500).json({
      error: 'Failed to fetch transcript',
      message: error.message,
      videoId: req.body?.videoId,
      errorType: error.constructor.name,
      debug: {
        timestamp: new Date().toISOString(),
        stack: error.stack
      }
    });
  }
}
