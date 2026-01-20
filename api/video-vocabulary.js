/**
 * Vercel API Route: Video Vocabulary
 * Generates academic vocabulary lists from video transcripts
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
    const { videoData, transcript, gradeLevel } = req.body;

    if (!transcript || !videoData) {
      return res.status(400).json({ 
        error: 'Missing required fields: videoData and transcript' 
      });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const grade = gradeLevel || 'middle school';
    const videoTitle = videoData.title || 'this video';

    const prompt = `You are an expert vocabulary instructor helping students build academic vocabulary from educational content.

**VIDEO INFORMATION:**
Title: ${videoTitle}
Duration: ${videoData.duration || 'Unknown'}

**TRANSCRIPT:**
${transcript}

**TASK:**
Generate a comprehensive vocabulary list of 15-20 key terms from this video. Focus on:
1. Academic vocabulary (tier 2 & 3 words)
2. Domain-specific terminology
3. Words essential for understanding the content
4. Terms students might not know at ${grade} level

**FOR EACH TERM PROVIDE:**
1. **Term**: The vocabulary word
2. **Part of Speech**: (noun, verb, adjective, etc.)
3. **Definition**: Clear, grade-appropriate definition (${grade} level)
4. **Context from Video**: How the term is used in this specific video
5. **Example Sentence**: Original example showing proper usage
6. **Word Forms**: Related forms (e.g., analyze → analysis, analytical, analyzer)
7. **Synonyms**: 2-3 similar words
8. **Memory Tip**: Mnemonic or connection to help remember

**RETURN AS JSON:**
{
  "vocabulary": [
    {
      "term": "string",
      "partOfSpeech": "string",
      "definition": "string",
      "contextFromVideo": "string",
      "exampleSentence": "string",
      "wordForms": ["string"],
      "synonyms": ["string"],
      "memoryTip": "string"
    }
  ],
  "gradeLevel": "${grade}",
  "totalTerms": 15
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].text;

    let vocabularyData;
    try {
      vocabularyData = JSON.parse(responseText);
    } catch (e) {
      const jsonMatch = responseText.match(/```json\n([\s\S]+?)\n```/) || 
                       responseText.match(/```\n([\s\S]+?)\n```/);
      if (jsonMatch) {
        vocabularyData = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse JSON from response');
      }
    }

    console.log('✅ Vocabulary generated:', vocabularyData.totalTerms, 'terms');

    return res.status(200).json(vocabularyData);

  } catch (error) {
    console.error('❌ Error generating vocabulary:', error);
    return res.status(500).json({
      error: 'Failed to generate vocabulary',
      message: error.message
    });
  }
}
