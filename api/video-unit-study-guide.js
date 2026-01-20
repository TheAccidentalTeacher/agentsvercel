/**
 * Vercel API Route: Video Unit Study Guide
 * Generate comprehensive unit study guide from multiple videos
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

    console.log(`[Unit Study Guide] Processing ${videos.length} videos`);

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

    const prompt = `You are an expert educational curriculum designer. Create a comprehensive unit study guide from these ${videos.length} YouTube videos.

**Videos:**
${combinedContent}

**Task:** Generate a complete unit study guide that synthesizes all content into a cohesive learning resource.

Return as JSON:
{
  "title": "Unit Study Guide: [topic]",
  "overview": {
    "introduction": "string",
    "learningObjectives": ["string"],
    "essentialQuestions": ["string"],
    "connections": "string"
  },
  "timeline": [
    { "date": "string", "event": "string", "significance": "string", "videoSources": [1, 2] }
  ],
  "mainTopics": [
    {
      "topic": "string",
      "content": "string",
      "keyPoints": ["string"],
      "videoSources": [1, 3]
    }
  ],
  "keyConcepts": [
    { "term": "string", "definition": "string", "videoSource": 1 }
  ],
  "studyQuestions": [
    { "question": "string", "answer": "string", "bloomsLevel": "string" }
  ],
  "videoCount": ${videos.length}
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].text;

    let guideData;
    try {
      guideData = JSON.parse(responseText);
    } catch (e) {
      const jsonMatch = responseText.match(/```json\n([\s\S]+?)\n```/) || 
                       responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        guideData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        throw new Error('Failed to parse JSON from response');
      }
    }

    console.log('✅ Unit study guide generated');

    return res.status(200).json(guideData);

  } catch (error) {
    console.error('❌ Error generating unit study guide:', error);
    return res.status(500).json({
      error: 'Failed to generate unit study guide',
      message: error.message
    });
  }
}
