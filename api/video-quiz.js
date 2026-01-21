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
    const { videoId, videoTitle, transcript, options = {} } = req.body;

    if (!videoId || !transcript) {
      return res.status(400).json({ 
        error: 'Missing required fields: videoId, transcript' 
      });
    }

    console.log('🎯 Generating quiz for video:', videoId);

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const numMC = options.numMultipleChoice || 5;
    const numSA = options.numShortAnswer || 3;
    const numTF = options.numTrueFalse || 5;
    const numFIB = options.numFillInBlank || 5;

    const userPrompt = `Create a comprehensive quiz based on this video content.

**VIDEO:** ${videoTitle}

**CONTENT:**
${transcript}

Create a quiz with:
- ${numMC} Multiple Choice questions (4 options each, mark correct answer)
- ${numTF} True/False questions
- ${numFIB} Fill-in-the-Blank questions (use _____ for blanks)
- ${numSA} Short Answer questions

Format your response as clean markdown:

# Quiz: ${videoTitle}

## Multiple Choice

**1. [Question text]**
- A) [Option]
- B) [Option]
- C) [Option]
- D) [Option]

*Correct Answer: [Letter]*

(Repeat for all multiple choice)

## True or False

**1. [Statement]**
*Answer: True/False*

(Repeat for all T/F)

## Fill in the Blank

**1. [Sentence with _____ for the blank]**
*Answer: [correct word/phrase]*

(Repeat for all fill-in-blank)

## Short Answer

**1. [Question requiring a brief explanation]**
*Sample Answer: [2-3 sentence answer]*

(Repeat for all short answer)

---
## Answer Key
(List all answers in order for easy grading)`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const markdown = message.content[0].text;
    console.log('✅ Quiz generated successfully');

    return res.status(200).json({
      markdown: markdown,
      videoId: videoId,
      videoTitle: videoTitle
    });

  } catch (error) {
    console.error('❌ Error generating quiz:', error);
    return res.status(500).json({
      error: 'Failed to generate quiz',
      message: error.message
    });
  }
}
