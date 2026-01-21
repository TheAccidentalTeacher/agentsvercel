/**
 * Vercel API Route: Simple Video Summary (Monica.ai style)
 * One button, simple output: summary + timestamps
 */

import Anthropic from '@anthropic-ai/sdk';

export const config = {
  maxDuration: 60
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { videoId, title, author, transcript } = req.body;

    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' });
    }

    console.log(`📺 Creating simple summary for: ${title || videoId}`);

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    // Build prompt based on what we have
    let contentToAnalyze = '';
    
    if (transcript && transcript.fullText) {
      // Use transcript if available
      contentToAnalyze = transcript.fullText.substring(0, 12000);
      console.log(`✓ Using transcript (${transcript.fullText.length} chars)`);
    } else {
      // No transcript - just analyze based on title/metadata
      contentToAnalyze = `Video Title: "${title}"\nChannel: ${author}\nVideo URL: https://www.youtube.com/watch?v=${videoId}`;
      console.log(`⚠️ No transcript - analyzing from metadata only`);
    }

    const systemPrompt = `You are an expert at analyzing video content. Create concise, actionable summaries with clear timestamps.`;

    const userPrompt = `Analyze this YouTube video and provide:

**Video**: "${title}" by ${author}
**Content**:
${contentToAnalyze}

Create a summary in this EXACT format:

## Summary
[One paragraph, 100-150 words explaining what the video is about]

## Highlights
- **[00:00]** [Brief description of what happens at this timestamp]
- **[02:35]** [Brief description]
- **[05:13]** [Brief description]
- **[07:45]** [Brief description]
- **[10:20]** [Brief description]
(Include 5-10 key moments with timestamps)

Keep it simple, clear, and actionable like Monica.ai does.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      temperature: 0.3,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const summaryText = message.content[0].text;

    console.log(`✓ Summary generated (${summaryText.length} chars)`);

    return res.status(200).json({
      videoId,
      title,
      author,
      summary: summaryText,
      hasTranscript: !!(transcript && transcript.fullText),
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Video summary error:', error);
    return res.status(500).json({
      error: 'Summary generation failed',
      message: error.message
    });
  }
}
