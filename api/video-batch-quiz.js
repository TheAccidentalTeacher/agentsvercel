/**
 * Vercel API Route: Video Batch Quiz
 * Generate quiz covering all selected videos
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
      return res.status(400).json({ error: 'Need at least 2 videos for combined quiz' });
    }

    console.log(`[Batch Quiz] Processing ${videos.length} videos`);

    const videoContexts = videos.map((v, i) => {
      const transcript = typeof v.transcript === 'string' 
        ? v.transcript 
        : (v.transcript?.full_text || '');
      
      return `
VIDEO ${i + 1}: ${v.title}
${transcript.substring(0, 8000)}...
`;
    }).join('\n\n');

    const prompt = `You are creating a comprehensive quiz covering ${videos.length} educational videos.

${videoContexts}

Create a quiz with:

**SECTION 1: MULTIPLE CHOICE (10 questions)**
- Cover all ${videos.length} videos proportionally
- Mix difficulty levels (some easy, some challenging)
- Include answer key with explanations

**SECTION 2: SHORT ANSWER (5 questions)**
- Require synthesis across multiple videos
- Test deeper understanding
- Include sample answers

**SECTION 3: CONNECTIONS (3 questions)**
- Ask students to connect concepts across videos
- Identify common themes
- Compare/contrast ideas

**SECTION 4: TRUE/FALSE (8 questions)**
- Mix easy and tricky questions
- Include answer key with explanations

Format in clear Markdown with:
- Question numbers
- Clear spacing between questions
- Answer key at the end
- Video references (e.g., "From Video 2:")

Make questions educational, fair, and well-balanced across all videos.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    });

    const quiz = message.content[0].text;

    console.log(`[Batch Quiz] ✅ Generated quiz (${quiz.length} chars)`);

    return res.status(200).json({
      quiz,
      videoCount: videos.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Batch Quiz] ❌ Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate combined quiz'
    });
  }
}
