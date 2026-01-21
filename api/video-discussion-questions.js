/**
 * Vercel API Route: Video Discussion Questions
 * Generate Bloom's taxonomy discussion questions from video content
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

    console.log('💬 Generating discussion questions for video:', videoId);

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const numPerLevel = options.numPerLevel || 3;
    const includeSocratic = options.includeSocratic !== false;
    const includeDebate = options.includeDebate !== false;

    const userPrompt = `Create comprehensive discussion questions based on this video content.

**VIDEO:** ${videoTitle}

**CONTENT:**
${transcript}

Generate discussion questions organized by Bloom's Taxonomy levels. For each level, create ${numPerLevel} thought-provoking questions.

Format your response as clean markdown:

# Discussion Questions: ${videoTitle}

## 🧠 Remember (Recall Facts)
Questions that ask students to recall specific information from the video.

**1.** [Question]
**2.** [Question]
**3.** [Question]

## 📖 Understand (Comprehension)
Questions that check if students grasp the main concepts and can explain them.

**1.** [Question]
**2.** [Question]
**3.** [Question]

## 🔧 Apply (Use Knowledge)
Questions that ask students to apply what they learned to new situations.

**1.** [Question]
**2.** [Question]
**3.** [Question]

## 🔍 Analyze (Break Down)
Questions that require students to examine relationships, compare/contrast, or identify patterns.

**1.** [Question]
**2.** [Question]
**3.** [Question]

## ⚖️ Evaluate (Judge/Justify)
Questions that ask students to make judgments, defend positions, or assess value.

**1.** [Question]
**2.** [Question]
**3.** [Question]

## 💡 Create (Synthesize New Ideas)
Questions that challenge students to propose solutions, design something new, or imagine alternatives.

**1.** [Question]
**2.** [Question]
**3.** [Question]

${includeSocratic ? `
## 🏛️ Socratic Questions
Deep, probing questions that challenge assumptions and encourage philosophical thinking.

**1.** [Question that challenges a key assumption]
**2.** [Question that explores implications]
**3.** [Question that considers alternative perspectives]
` : ''}

${includeDebate ? `
## 🎭 Debate Topics
Controversial or debatable topics from the video that students can argue multiple sides.

**1.** [Debate topic with brief context for both sides]
**2.** [Debate topic with brief context for both sides]
` : ''}

---
*These questions progress from basic recall to higher-order thinking.*`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      temperature: 0.8,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const markdown = message.content[0].text;
    console.log('✅ Discussion questions generated successfully');

    return res.status(200).json({
      markdown: markdown,
      videoId: videoId,
      videoTitle: videoTitle
    });

  } catch (error) {
    console.error('❌ Error generating discussion questions:', error);
    return res.status(500).json({
      error: 'Failed to generate discussion questions',
      message: error.message
    });
  }
}
