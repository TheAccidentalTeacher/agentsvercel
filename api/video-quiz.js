/**
 * Vercel API Route: Video Quiz
 * Generate comprehensive quiz from video transcript
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
    const { videoId, videoTitle, transcript, prompt, options } = req.body;

    if (!videoId || !transcript) {
      return res.status(400).json({ 
        error: 'Missing required fields: videoId, transcript' 
      });
    }

    console.log('🎯 Generating quiz for video:', videoId);

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      temperature: 0.7,
      system: `You are an expert educator specializing in creating comprehensive, educationally sound assessments. You create quizzes that:
- Test understanding at multiple cognitive levels (Bloom's Taxonomy)
- Include clear, unambiguous questions
- Provide detailed explanations for correct answers
- Address common misconceptions
- Reference video content with timestamps
- Are appropriate for the target grade level
- Follow best practices in assessment design

Return your response ONLY as valid JSON matching the requested structure. Do not include markdown formatting or code blocks.`,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].text;
    console.log('📝 Claude response received, parsing...');

    // Parse JSON response
    let quizData;
    try {
      quizData = JSON.parse(responseText);
    } catch (e) {
      const jsonMatch = responseText.match(/```json\n([\s\S]+?)\n```/) || 
                       responseText.match(/```\n([\s\S]+?)\n```/);
      if (jsonMatch) {
        quizData = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse JSON from response');
      }
    }

    console.log('✅ Quiz generated successfully');

    return res.status(200).json(quizData);

  } catch (error) {
    console.error('❌ Error generating quiz:', error);
    return res.status(500).json({
      error: 'Failed to generate quiz',
      message: error.message
    });
  }
}
