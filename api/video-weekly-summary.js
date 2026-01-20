/**
 * Vercel API Route: Video Weekly Summary
 * Generate comprehensive weekly summary from multiple videos
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
    const { videos } = req.body;

    if (!videos || !Array.isArray(videos) || videos.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 videos' });
    }

    console.log(`[Weekly Summary] Processing ${videos.length} videos`);

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    // Build combined transcript
    const combinedContent = videos.map((video, index) => {
      const transcript = Array.isArray(video.transcript) 
        ? video.transcript.map(seg => seg.text).join(' ')
        : (typeof video.transcript === 'string' ? video.transcript : JSON.stringify(video.transcript));
      
      return `
## VIDEO ${index + 1}: ${video.title}
**Channel:** ${video.channelName || video.channel_name || 'Unknown'}
**Duration:** ${Math.floor((video.duration || 0) / 60)} minutes

${transcript.substring(0, 3000)}

---
`;
    }).join('\n\n');

    const prompt = `You are an expert educational content synthesizer. Create a comprehensive weekly summary from these ${videos.length} YouTube videos.

**Videos to Synthesize:**
${combinedContent}

**Task:** Generate a cohesive weekly summary.

Return as JSON:
{
  "title": "Weekly Summary: [topic/theme]",
  "overview": "string (2-3 paragraphs)",
  "mainThemes": [
    {
      "theme": "string",
      "content": "string",
      "videoSources": [1, 2, 3]
    }
  ],
  "keyConcepts": [
    { "concept": "string", "definition": "string", "importance": "string" }
  ],
  "connections": [
    { "connection": "string", "videos": [1, 3] }
  ],
  "reviewQuestions": [
    { "question": "string", "answer": "string" }
  ],
  "vocabulary": [
    { "term": "string", "definition": "string" }
  ],
  "nextSteps": ["string"],
  "videoCount": ${videos.length}
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].text;

    let summaryData;
    try {
      summaryData = JSON.parse(responseText);
    } catch (e) {
      const jsonMatch = responseText.match(/```json\n([\s\S]+?)\n```/) || 
                       responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        summaryData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        throw new Error('Failed to parse JSON from response');
      }
    }

    console.log('✅ Weekly summary generated');

    return res.status(200).json(summaryData);

  } catch (error) {
    console.error('❌ Error generating weekly summary:', error);
    return res.status(500).json({
      error: 'Failed to generate weekly summary',
      message: error.message
    });
  }
}
