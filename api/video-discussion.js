/**
 * Vercel API Route: Video Discussion
 * Generate discussion questions from video transcript
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

    console.log('💬 Generating discussion questions for video:', videoId);

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16000,
      temperature: 0.8,
      system: `You are an expert educator specializing in Socratic questioning and facilitating meaningful classroom discussions. You create questions that:
- Progress through Bloom's Taxonomy (remember → understand → apply → analyze → evaluate → create)
- Encourage critical thinking and deeper understanding
- Connect to students' lives and experiences
- Promote respectful debate and multiple perspectives
- Build on each other (follow-up questions)
- Are open-ended and thought-provoking
- Support classical education's emphasis on dialectic (logic) stage
- Foster intellectual curiosity

Return your response ONLY as valid JSON matching the requested structure. Do not include markdown formatting or code blocks.`,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].text;
    console.log('📝 Claude response received, parsing...');

    let questions;
    try {
      questions = JSON.parse(responseText);
    } catch (e) {
      const jsonMatch = responseText.match(/```json\n([\s\S]+?)\n```/) || 
                       responseText.match(/```\n([\s\S]+?)\n```/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse JSON from response');
      }
    }

    console.log('✅ Discussion questions generated successfully');

    return res.status(200).json(questions);

  } catch (error) {
    console.error('❌ Error generating discussion questions:', error);
    return res.status(500).json({
      error: 'Failed to generate discussion questions',
      message: error.message
    });
  }
}
