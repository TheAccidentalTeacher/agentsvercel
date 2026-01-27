/**
 * Vercel API Route: Simple Video Summary (Monica.ai style)
 * Uses Claude for transcript-based summaries
 * Uses Gemini REST API to WATCH video when no transcript (same as gemini-transcript.js)
 */

import Anthropic from '@anthropic-ai/sdk';

// Gemini REST API - use faster model for video processing
const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

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

    const hasTranscript = transcript && transcript.fullText;

    // If NO transcript, use Gemini to WATCH the video directly
    if (!hasTranscript) {
      console.log(`🎥 No transcript - using Gemini to watch video directly`);
      const geminiSummary = await generateGeminiVideoSummary(videoId, title, author);
      return res.status(200).json({
        videoId,
        title,
        author,
        summary: geminiSummary,
        hasTranscript: false,
        source: 'gemini-video-watch',
        generatedAt: new Date().toISOString()
      });
    }

    // Has transcript - use Claude for fast, accurate summary
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const contentToAnalyze = transcript.fullText.substring(0, 12000);
    console.log(`✓ Using transcript (${transcript.fullText.length} chars)`);

    const systemPrompt = `You are an expert at analyzing video content. Create concise, actionable summaries with clear timestamps.`;

    const userPrompt = `Analyze this YouTube video and provide:

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
      hasTranscript: true,
      source: 'claude-transcript',
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

/**
 * Use Gemini REST API to WATCH the video directly and generate a summary
 * Same approach as gemini-transcript.js
 */
async function generateGeminiVideoSummary(videoId, title, author) {
  const googleKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  
  if (!googleKey) {
    throw new Error('Gemini API key not configured');
  }

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  console.log(`🎥 Gemini watching video: ${videoUrl}`);

  const prompt = `Watch this YouTube video and summarize it.

VIDEO: "${title}" by ${author}

Provide:

## Summary
2-3 paragraphs covering the main topic, key points, and important takeaways.

## Highlights
List 6-8 key moments with timestamps:
- **[MM:SS]** Brief description of what happens
(Use real timestamps from the video)

VIDEO URL: ${videoUrl}`;

  const requestBody = {
    contents: [{
      parts: [
        { text: prompt },
        { file_data: { file_uri: videoUrl } }
      ]
    }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 4000,
      topP: 0.95
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
    ]
  };

  // Create AbortController for timeout (55 seconds to leave buffer)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 55000);

  let response;
  try {
    response = await fetch(`${GEMINI_API_URL}?key=${googleKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
  } catch (fetchError) {
    clearTimeout(timeoutId);
    if (fetchError.name === 'AbortError') {
      throw new Error('Video analysis timed out - try a shorter video');
    }
    throw fetchError;
  }
  clearTimeout(timeoutId);

  console.log(`   Gemini response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
    throw new Error('Invalid response from Gemini API');
  }

  const summaryText = data.candidates[0].content.parts[0].text;
  console.log(`✓ Gemini video summary generated (${summaryText.length} chars)`);
  
  return summaryText;
}
