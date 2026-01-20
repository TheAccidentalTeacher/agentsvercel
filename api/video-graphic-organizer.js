/**
 * Vercel API Route: Video Graphic Organizer
 * Generate visual graphic organizers from video transcripts
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
    const { videoData, transcript, organizerType, gradeLevel } = req.body;

    console.log('[Graphic Organizer] Request received:', {
      organizerType,
      gradeLevel,
      videoTitle: videoData?.title
    });

    if (!transcript || transcript.length === 0) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    // Prepare transcript text
    let transcriptText;
    if (Array.isArray(transcript)) {
      transcriptText = transcript.map(t => `[${t.timestamp}] ${t.text}`).join('\n');
    } else if (typeof transcript === 'string') {
      transcriptText = transcript;
    } else {
      return res.status(400).json({ error: 'Invalid transcript format' });
    }

    const maxLength = 12000;
    const truncatedTranscript = transcriptText.length > maxLength 
      ? transcriptText.substring(0, maxLength) + '\n\n[Transcript truncated for length...]'
      : transcriptText;

    const prompt = `You are an expert educator creating visual graphic organizers for ${gradeLevel || 'middle school'} students.

**VIDEO:** ${videoData?.title || 'Video'}
**ORGANIZER TYPE:** ${organizerType || 'concept-map'}

**TRANSCRIPT:**
${truncatedTranscript}

Create a ${organizerType || 'concept-map'} graphic organizer that helps students visualize the key concepts and relationships from this video.

Return as JSON with appropriate structure for the organizer type:
- For concept-map: { "centerConcept": "string", "branches": [{ "concept": "string", "connections": ["string"] }] }
- For venn-diagram: { "left": { "label": "string", "items": ["string"] }, "right": { "label": "string", "items": ["string"] }, "overlap": ["string"] }
- For timeline: { "events": [{ "date": "string", "event": "string", "details": "string" }] }
- For cause-effect: { "causes": [{ "cause": "string", "effects": ["string"] }] }
- For compare-contrast: { "items": [{ "name": "string", "attributes": {} }], "categories": ["string"] }`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].text;

    let organizerData;
    try {
      organizerData = JSON.parse(responseText);
    } catch (e) {
      const jsonMatch = responseText.match(/```json\n([\s\S]+?)\n```/) || 
                       responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        organizerData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        throw new Error('Failed to parse JSON from response');
      }
    }

    console.log('✅ Graphic organizer generated');

    return res.status(200).json(organizerData);

  } catch (error) {
    console.error('❌ Error generating graphic organizer:', error);
    return res.status(500).json({
      error: 'Failed to generate graphic organizer',
      message: error.message
    });
  }
}
