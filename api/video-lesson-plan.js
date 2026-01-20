/**
 * Vercel API Route: Video Lesson Plan
 * Generate comprehensive lesson plan from video
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
    const { videoId, videoTitle, transcript, duration, prompt, options } = req.body;

    if (!videoId || !transcript) {
      return res.status(400).json({ 
        error: 'Missing required fields: videoId, transcript' 
      });
    }

    console.log('📚 Generating lesson plan for video:', videoId);

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      temperature: 0.7,
      system: `You are an expert educator and curriculum designer specializing in creating comprehensive, practical lesson plans. You create plans that:
- Use backward design principles (start with objectives)
- Include engaging hooks and anticipatory sets
- Incorporate active learning strategies
- Provide differentiation for diverse learners
- Include formative and summative assessments
- Follow educational best practices (Bloom's Taxonomy, Webb's DOK, etc.)
- Are immediately usable by teachers
- Integrate technology effectively
- Support classical education principles when appropriate

Return your response ONLY as valid JSON matching the requested structure. Do not include markdown formatting or code blocks.`,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].text;
    console.log('📝 Claude response received, parsing...');

    let lessonPlan;
    try {
      lessonPlan = JSON.parse(responseText);
    } catch (e) {
      const jsonMatch = responseText.match(/```json\n([\s\S]+?)\n```/) || 
                       responseText.match(/```\n([\s\S]+?)\n```/);
      if (jsonMatch) {
        lessonPlan = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse JSON from response');
      }
    }

    console.log('✅ Lesson plan generated successfully');

    return res.status(200).json(lessonPlan);

  } catch (error) {
    console.error('❌ Error generating lesson plan:', error);
    return res.status(500).json({
      error: 'Failed to generate lesson plan',
      message: error.message
    });
  }
}
