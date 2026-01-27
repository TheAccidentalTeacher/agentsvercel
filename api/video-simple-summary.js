/**
 * Vercel API Route: Simple Video Summary (Monica.ai style)
 * One button, simple output: summary + timestamps
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
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { videoId, title, author, transcript } = req.body;

    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' });
    }

    console.log(`📺 Creating simple summary for: ${title || videoId}`);

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const hasTranscript = transcript && transcript.fullText;
    let systemPrompt, userPrompt;

    if (hasTranscript) {
      // Use transcript for accurate summary
      const contentToAnalyze = transcript.fullText.substring(0, 12000);
      console.log(`✓ Using transcript (${transcript.fullText.length} chars)`);

      systemPrompt = `You are an expert at analyzing video content. Create concise, actionable summaries with clear timestamps.`;

      userPrompt = `Analyze this YouTube video and provide:

**Video**: "${title}" by ${author}
**Content**:
${contentToAnalyze}

Create a detailed, comprehensive summary in this EXACT format:

## Summary
[Two to three detailed paragraphs, 250-350 words total. Include:
- Main topic and purpose of the video
- Key themes and important concepts covered
- Major insights, findings, or takeaways
- Overall structure and flow of content
Make it substantive and informative.]

## Highlights
- **[00:00]** [Detailed description of the opening and what this section covers - 2-3 sentences]
- **[03:15]** [Comprehensive explanation of this key point or segment - 2-3 sentences]
- **[06:45]** [Thorough description of what's discussed here - 2-3 sentences]
- **[10:20]** [Detailed coverage of this important moment - 2-3 sentences]
- **[13:50]** [In-depth explanation of this section - 2-3 sentences]
- **[17:30]** [Complete description of what happens here - 2-3 sentences]
- **[21:00]** [Detailed breakdown of this key moment - 2-3 sentences]
- **[24:15]** [Thorough explanation of this segment - 2-3 sentences]
(Include 8-12 key moments with substantial descriptions for each)

Make this comprehensive, detailed, and highly informative.`;

    } else {
      // No transcript - generate comprehensive topic-based content using Claude's knowledge
      console.log(`⚠️ No transcript - generating topic-based summary for: "${title}"`);

      systemPrompt = `You are an expert educator with comprehensive knowledge across all subjects including history, science, literature, technology, and more. When asked about a video topic, provide substantive educational content based on your knowledge.`;

      userPrompt = `A teacher needs educational content about the topic: "${title}" (YouTube video by ${author}).

Since the video's captions are not available, please provide a COMPREHENSIVE educational guide about this topic based on your knowledge.

Create detailed, substantive content in this format:

## Summary
Write 3-4 paragraphs (400-500 words) covering:
- What this topic is about and why it matters
- Major themes, events, concepts, or key ideas
- Historical context, scientific principles, or foundational knowledge as relevant
- Important figures, dates, discoveries, or developments
- How this connects to broader themes or modern relevance
- Why this is valuable learning material

## Key Topics & Concepts
- **[Topic 1]**: [2-3 sentence detailed explanation]
- **[Topic 2]**: [2-3 sentence detailed explanation]
- **[Topic 3]**: [2-3 sentence detailed explanation]
- **[Topic 4]**: [2-3 sentence detailed explanation]
- **[Topic 5]**: [2-3 sentence detailed explanation]
- **[Topic 6]**: [2-3 sentence detailed explanation]
- **[Topic 7]**: [2-3 sentence detailed explanation]
- **[Topic 8]**: [2-3 sentence detailed explanation]
(Include 8-10 major topics with substantial explanations)

## Key Vocabulary
[List 10-15 important terms with brief definitions]

## Discussion Questions
1. [Thought-provoking question]
2. [Critical thinking question]
3. [Connection to modern day]
4. [Analysis question]
5. [Synthesis question]

---
*Note: This educational content is based on the video title since captions were not available. The actual video may cover additional aspects.*

Be thorough and genuinely educational - this will be used by teachers.`;
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8000,
      temperature: 0.3,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const summaryText = message.content[0].text;

    console.log(`✓ Summary generated (${summaryText.length} chars)`);

    return res.status(200).json({
      videoId,
      title,
      author,
      summary: summaryText,
      hasTranscript: !!(transcript && transcript.fullText),
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Video summary error:', error);
    return res.status(500).json({
      error: 'Summary generation failed',
      message: error.message
    });
  }
}
