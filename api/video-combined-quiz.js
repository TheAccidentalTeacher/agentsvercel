/**
 * Vercel API Route: Video Combined Quiz
 * Generate quiz covering multiple selected videos
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

    console.log(`[Combined Quiz] Processing ${videos.length} videos`);

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

${transcript.substring(0, 3000)}

---
`;
    }).join('\n\n');

    const questionsPerVideo = Math.max(4, Math.floor(25 / videos.length));

    const prompt = `You are an expert quiz creator. Generate a comprehensive quiz covering these ${videos.length} YouTube videos.

**Videos:**
${combinedContent}

**Task:** Create a quiz with ${questionsPerVideo * videos.length} questions total.

**Requirements:**
1. Balanced across all ${videos.length} videos
2. Mix of difficulty levels (40% easy, 40% medium, 20% hard)
3. Question types: 50% Multiple Choice, 25% Short Answer, 15% True/False, 10% Fill-in-the-Blank

Return as JSON:
{
  "title": "Combined Quiz: [topic]",
  "videoCount": ${videos.length},
  "questions": [
    {
      "videoNumber": 1,
      "videoTitle": "string",
      "type": "multiple-choice|short-answer|true-false|fill-blank",
      "difficulty": "easy|medium|hard",
      "question": "string",
      "options": ["string"] (for multiple choice),
      "correctAnswer": "string",
      "explanation": "string"
    }
  ],
  "totalQuestions": number
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].text;

    let quizData;
    try {
      quizData = JSON.parse(responseText);
    } catch (e) {
      const jsonMatch = responseText.match(/```json\n([\s\S]+?)\n```/) || 
                       responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        quizData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        throw new Error('Failed to parse JSON from response');
      }
    }

    console.log(`✅ Combined quiz generated: ${quizData.questions?.length || 0} questions`);

    return res.status(200).json(quizData);

  } catch (error) {
    console.error('❌ Error generating combined quiz:', error);
    return res.status(500).json({
      error: 'Failed to generate combined quiz',
      message: error.message
    });
  }
}
