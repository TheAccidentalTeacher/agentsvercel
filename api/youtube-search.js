/**
 * Vercel API Route: YouTube Search
 * 
 * Searches YouTube using the Data API v3
 * Requires YOUTUBE_API_KEY environment variable
 */

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
    const { query, maxResults = 10 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      console.error('YOUTUBE_API_KEY not configured');
      return res.status(500).json({ error: 'YouTube API key not configured' });
    }

    console.log(`Searching YouTube for: "${query}", maxResults: ${maxResults}`);

    // Search for videos
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.append('part', 'snippet');
    searchUrl.searchParams.append('q', query);
    searchUrl.searchParams.append('maxResults', maxResults.toString());
    searchUrl.searchParams.append('type', 'video');
    searchUrl.searchParams.append('key', apiKey);

    const searchResponse = await fetch(searchUrl.toString());

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json();
      console.error('YouTube API error:', errorData);
      throw new Error(errorData.error?.message || 'YouTube API request failed');
    }

    const searchData = await searchResponse.json();

    // Get video IDs
    const videoIds = searchData.items.map(item => item.id.videoId).join(',');

    // Fetch video details (for duration, view count)
    const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    detailsUrl.searchParams.append('part', 'contentDetails,statistics');
    detailsUrl.searchParams.append('id', videoIds);
    detailsUrl.searchParams.append('key', apiKey);

    const detailsResponse = await fetch(detailsUrl.toString());
    const detailsData = await detailsResponse.json();

    // Merge data
    const videos = searchData.items.map(item => {
      const details = detailsData.items?.find(d => d.id === item.id.videoId);
      
      return {
        id: item.id.videoId,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.medium.url,
        publishedAt: item.snippet.publishedAt,
        duration: details ? formatDuration(details.contentDetails.duration) : null,
        views: details ? parseInt(details.statistics.viewCount) : null
      };
    });

    return res.status(200).json({
      query,
      totalResults: searchData.pageInfo.totalResults,
      items: videos
    });

  } catch (error) {
    console.error('YouTube search error:', error);

    return res.status(500).json({ 
      error: error.message || 'Failed to search YouTube'
    });
  }
}

/**
 * Format ISO 8601 duration to readable format
 * PT1H30M15S -> 1:30:15
 */
function formatDuration(isoDuration) {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;

  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
