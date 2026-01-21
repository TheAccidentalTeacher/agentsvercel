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
    // Accept both old and new request formats
    const { videoId, videoTitle, videoData, transcript, options = {} } = req.body;

    if (!transcript || (!videoId && !videoData)) {
      return res.status(400).json({ 
        error: 'Missing required fields: transcript and (videoId or videoData)' 
      });
    }

    const title = videoTitle || videoData?.title || 'Video';
    const id = videoId || videoData?.videoId || 'unknown';
    const gradeLevel = options.gradeLevel || req.body.gradeLevel || 'middle school';
    const numTerms = options.numTerms || 15;

    console.log('📚 Generating vocabulary for video:', id);

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const userPrompt = `Create a comprehensive vocabulary list based on this video content.

**VIDEO:** ${title}
**GRADE LEVEL:** ${gradeLevel}

**CONTENT:**
${transcript}

Generate ${numTerms} key vocabulary terms from this video. Focus on:
- Academic vocabulary (tier 2 & 3 words)
- Domain-specific terminology
- Words essential for understanding the content
- Terms students might not know at ${gradeLevel} level

Format your response as clean markdown:

# Vocabulary List: ${title}

**Grade Level:** ${gradeLevel}

---

## 📖 Key Terms

### 1. **[Term]** *(part of speech)*
**Definition:** [Clear, grade-appropriate definition]

**Context from Video:** "[How this term was used in the video]"

**Example Sentence:** [Original example showing proper usage]

**Related Forms:** [word forms like analyze → analysis, analytical]

**Synonyms:** [2-3 similar words]

💡 **Memory Tip:** [Mnemonic or connection to help remember]

---

(Repeat for all ${numTerms} terms with the same format)

---

## 📝 Practice Activities

### Fill in the Blank
Use the vocabulary words to complete these sentences:

1. _______________: [sentence with blank]
2. _______________: [sentence with blank]
3. _______________: [sentence with blank]

### Matching
Match each term to its definition.

---
*Vocabulary extracted from video content*`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const markdown = message.content[0].text;
    console.log('✅ Vocabulary generated successfully');

    return res.status(200).json({
      markdown: markdown,
      videoId: id,
      videoTitle: title
    });

  } catch (error) {
    console.error('❌ Error generating vocabulary:', error);
    return res.status(500).json({
      error: 'Failed to generate vocabulary',
      message: error.message
    });
  }
}
