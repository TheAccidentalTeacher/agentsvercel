/**
 * Vercel API Route: Video DOK Project
 * Generate DOK 3-4 extended projects from videos
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
    
    console.log(`📊 Generating DOK ${options?.dokLevel || 3} project for video: ${videoTitle}`);

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8192,
      temperature: 0.7,
      system: `You are an expert educator specializing in creating rigorous, DOK 3-4 level projects that promote deep thinking and real-world application. You understand Depth of Knowledge framework and create projects that truly require strategic or extended thinking.

For DOK 3 projects: Require reasoning, planning, evidence use, and abstract thinking
For DOK 4 projects: Require investigation over time, synthesis, and real-world application

Always return valid JSON with all required components.`,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].text;
    console.log('✅ Claude response received');

    let projectData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        projectData = JSON.parse(jsonMatch[0]);
      } else {
        projectData = {
          title: `DOK ${options?.dokLevel || 3} Project: ${videoTitle}`,
          dokLevel: options?.dokLevel || 3,
          duration: options?.duration,
          gradeLevel: options?.gradeLevel,
          subject: options?.subject,
          videoId: videoId,
          rawContent: responseText
        };
      }
    } catch (parseError) {
      console.warn('⚠️ JSON parsing failed, returning structured markdown');
      projectData = {
        title: `DOK ${options?.dokLevel || 3} Project: ${videoTitle}`,
        videoId: videoId,
        rawContent: responseText
      };
    }

    return res.status(200).json(projectData);

  } catch (error) {
    console.error('❌ Error generating DOK project:', error);
    return res.status(500).json({
      error: 'Failed to generate DOK project',
      message: error.message
    });
  }
}
