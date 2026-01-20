/**
 * Vercel API Route: Video Batch Vocabulary
 * Merge vocabulary from multiple videos
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
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const { videos } = req.body;

    if (!videos || !Array.isArray(videos) || videos.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 videos for master vocabulary' });
    }

    console.log(`[Batch Vocabulary] Processing ${videos.length} videos`);

    const videoContexts = videos.map((v, i) => {
      const transcript = typeof v.transcript === 'string' 
        ? v.transcript 
        : (v.transcript?.full_text || '');
      
      return `
VIDEO ${i + 1}: ${v.title}
${transcript.substring(0, 6000)}...
`;
    }).join('\n\n');

    const prompt = `You are creating a master vocabulary list from ${videos.length} educational videos.

${videoContexts}

Create a comprehensive vocabulary list with **25-30 key terms** that:

1. Cover the most important concepts across ALL videos
2. Remove duplicates (same concept from different videos)
3. Group related terms together
4. Include terms that appear in multiple videos

For each term provide:

**TERM**: [The word/phrase]
**FROM**: Videos [#, #] (which videos use this term)
**DEFINITION**: Clear, grade-appropriate definition
**CONTEXT**: How it's used across the videos
**EXAMPLE**: One sentence showing usage
**CONNECTIONS**: How this term relates to other terms in the list
**WHY IT MATTERS**: Why this concept is important

Organize terms into logical categories:
- Core Concepts (terms used in multiple videos)
- Technical Terms (specialized vocabulary)
- Supporting Terms (important but less central)

Format in clean Markdown with:
- Category headers
- Clear spacing
- Bold term names
- Bullet points for details

Make this a comprehensive study resource that shows how vocabulary connects across all ${videos.length} videos.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    });

    const vocabulary = message.content[0].text;

    console.log(`[Batch Vocabulary] ✅ Generated vocabulary (${vocabulary.length} chars)`);

    return res.status(200).json({
      vocabulary,
      videoCount: videos.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Batch Vocabulary] ❌ Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate master vocabulary'
    });
  }
}
