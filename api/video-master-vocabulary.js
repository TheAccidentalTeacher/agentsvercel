/**
 * Vercel API Route: Video Master Vocabulary
 * Build comprehensive vocabulary from multiple videos
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
    const { videos, gradeLevel } = req.body;

    if (!videos || !Array.isArray(videos) || videos.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 videos' });
    }

    console.log(`[Master Vocabulary] Processing ${videos.length} videos`);

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    // Build combined transcript
    const combinedContent = videos.map((video, index) => {
      const transcript = Array.isArray(video.transcript) 
        ? video.transcript.map(seg => seg.text).join(' ')
        : (typeof video.transcript === 'string' ? video.transcript : '');
      
      return `
## VIDEO ${index + 1}: ${video.title}
${transcript.substring(0, 2000)}
---
`;
    }).join('\n\n');

    const grade = gradeLevel || 'middle school';

    const prompt = `You are an expert vocabulary instructor. Create a comprehensive master vocabulary list from these ${videos.length} educational videos.

**Videos:**
${combinedContent}

**Task:** Generate 30-40 key academic vocabulary terms that appear across these videos.

Return as JSON:
{
  "title": "Master Vocabulary: [topic]",
  "gradeLevel": "${grade}",
  "vocabulary": [
    {
      "term": "string",
      "partOfSpeech": "string",
      "definition": "string",
      "videoSources": [1, 2],
      "contextExample": "string",
      "synonyms": ["string"],
      "memoryTip": "string",
      "difficulty": "basic|intermediate|advanced"
    }
  ],
  "categorizedTerms": {
    "category1": ["term1", "term2"],
    "category2": ["term3", "term4"]
  },
  "totalTerms": number,
  "videoCount": ${videos.length}
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].text;

    let vocabularyData;
    try {
      vocabularyData = JSON.parse(responseText);
    } catch (e) {
      const jsonMatch = responseText.match(/```json\n([\s\S]+?)\n```/) || 
                       responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        vocabularyData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        throw new Error('Failed to parse JSON from response');
      }
    }

    console.log(`✅ Master vocabulary generated: ${vocabularyData.totalTerms || vocabularyData.vocabulary?.length} terms`);

    return res.status(200).json(vocabularyData);

  } catch (error) {
    console.error('❌ Error generating master vocabulary:', error);
    return res.status(500).json({
      error: 'Failed to generate master vocabulary',
      message: error.message
    });
  }
}
