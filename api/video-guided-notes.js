/**
 * Vercel API Route: Video Guided Notes
 * Creates structured note-taking templates from video transcripts
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
    const { videoData, transcript, noteStyle, gradeLevel } = req.body;

    if (!transcript || !videoData) {
      return res.status(400).json({ 
        error: 'Missing required fields: videoData and transcript' 
      });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const style = noteStyle || 'cornell';
    const grade = gradeLevel || 'middle school';
    const videoTitle = videoData.title || 'this video';

    let styleInstructions = '';
    
    if (style === 'cornell') {
      styleInstructions = `**CORNELL NOTES FORMAT:**
Structure with three sections:
1. **Questions (Left Column)**: Key questions that the notes answer
2. **Notes (Right Column)**: Main content, facts, definitions, examples
3. **Summary (Bottom)**: 3-4 sentence synthesis of main ideas

Return as JSON:
{
  "sections": [
    {
      "topic": "Section title",
      "timestamp": "0:00",
      "questions": ["Question 1?", "Question 2?"],
      "notes": ["Note point 1", "Note point 2"],
      "keyTerms": ["term1", "term2"]
    }
  ],
  "summary": "Overall summary connecting all sections"
}`;
    } else if (style === 'outline') {
      styleInstructions = `**HIERARCHICAL OUTLINE FORMAT:**
Use standard outline structure (I, A, 1, a, etc.)

Return as JSON:
{
  "title": "Main topic",
  "outline": [
    {
      "level": 1,
      "marker": "I",
      "text": "First main topic",
      "timestamp": "0:00",
      "children": []
    }
  ]
}`;
    } else {
      styleInstructions = `**FILL-IN-THE-BLANK FORMAT:**
Create worksheets with key terms removed.

Return as JSON:
{
  "sections": [
    {
      "topic": "Section title",
      "timestamp": "0:00",
      "blanks": [
        {
          "sentence": "The process of _____ converts sunlight into energy.",
          "answer": "photosynthesis",
          "hint": "Begins with 'photo'"
        }
      ]
    }
  ],
  "wordBank": ["term1", "term2"]
}`;
    }

    const prompt = `Create ${style} guided notes from this video transcript for ${grade} students.

**VIDEO:** ${videoTitle}
**DURATION:** ${videoData.duration || 'Unknown'}

**TRANSCRIPT:**
${transcript}

${styleInstructions}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].text;

    let notesData;
    try {
      notesData = JSON.parse(responseText);
    } catch (e) {
      const jsonMatch = responseText.match(/```json\n([\s\S]+?)\n```/) || 
                       responseText.match(/```\n([\s\S]+?)\n```/);
      if (jsonMatch) {
        notesData = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse JSON from response');
      }
    }

    console.log('✅ Guided notes generated');

    return res.status(200).json(notesData);

  } catch (error) {
    console.error('❌ Error generating guided notes:', error);
    return res.status(500).json({
      error: 'Failed to generate guided notes',
      message: error.message
    });
  }
}
