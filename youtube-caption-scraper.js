/**
 * Client-Side YouTube Caption Scraper
 * 
 * Fetches captions directly in the browser (like Monica.ai)
 * Bypasses CORS by using YouTube's public caption endpoints
 */

/**
 * Fetch YouTube captions client-side
 * @param {string} videoId - YouTube video ID
 * @param {string} language - Language code (default: 'en')
 * @returns {Promise<Object>} Transcript with segments
 */
export async function fetchYouTubeCaptions(videoId, language = 'en') {
  try {
    console.log(`[Caption Scraper] Fetching captions for ${videoId}...`);
    
    // Step 1: Fetch video page to get caption track URLs
    const pageUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const corsProxy = `https://corsproxy.io/?${encodeURIComponent(pageUrl)}`;
    
    const pageResponse = await fetch(corsProxy, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!pageResponse.ok) {
      throw new Error(`Failed to fetch video page: ${pageResponse.status}`);
    }
    
    const html = await pageResponse.text();
    console.log(`[Caption Scraper] Page fetched (${Math.round(html.length / 1024)}KB)`);
    
    // Step 2: Extract player response
    const match = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
    if (!match) {
      throw new Error('Could not find player response in page');
    }
    
    const playerResponse = JSON.parse(match[1]);
    const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    
    if (!captions || captions.length === 0) {
      throw new Error('No captions available for this video');
    }
    
    console.log(`[Caption Scraper] Found ${captions.length} caption tracks`);
    
    // Step 3: Find requested language or use first available
    let captionTrack = captions.find(track => track.languageCode === language);
    if (!captionTrack) {
      captionTrack = captions[0];
      console.log(`[Caption Scraper] Language '${language}' not found, using '${captionTrack.languageCode}'`);
    }
    
    // Step 4: Fetch caption XML (through CORS proxy)
    const captionUrl = captionTrack.baseUrl;
    const captionProxyUrl = `https://corsproxy.io/?${encodeURIComponent(captionUrl)}`;
    
    const captionResponse = await fetch(captionProxyUrl);
    const captionXml = await captionResponse.text();
    console.log(`[Caption Scraper] Caption XML fetched (${Math.round(captionXml.length / 1024)}KB)`);
    
    // Step 5: Parse XML
    const segments = parseCaptionXml(captionXml, captionTrack.languageCode);
    
    console.log(`[Caption Scraper] ✓ Parsed ${segments.length} segments`);
    
    return {
      transcript: segments,
      videoId,
      language: captionTrack.languageCode,
      source: 'youtube-captions-client',
      success: true
    };
    
  } catch (error) {
    console.error('[Caption Scraper] Error:', error);
    throw error;
  }
}

/**
 * Parse YouTube caption XML into segments
 * @param {string} xml - Caption XML string
 * @param {string} lang - Language code
 * @returns {Array} Array of caption segments
 */
function parseCaptionXml(xml, lang) {
  const textRegex = /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g;
  const segments = [];
  let match;
  
  while ((match = textRegex.exec(xml)) !== null) {
    const start = parseFloat(match[1]);
    const duration = parseFloat(match[2]);
    let text = match[3];
    
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
        lang
      });
    }
  }
  
  return segments;
}

/**
 * Alternative: Use YouTube Player API to get captions
 * This works without CORS proxies but requires loading the YouTube IFrame API
 */
export async function fetchCaptionsViaPlayerAPI(videoId) {
  return new Promise((resolve, reject) => {
    // This would require the YouTube IFrame API to be loaded
    // For now, we'll use the direct scraping method above
    reject(new Error('Player API method not yet implemented'));
  });
}
