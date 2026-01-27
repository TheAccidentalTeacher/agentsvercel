/**
 * Vercel API Route: Simple Video Summary (Monica.ai style)
 * One button, simple output: summary + timestamps
 * Uses Claude for transcript-based summaries, Gemini to WATCH video when no transcript
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
 * Use Gemini to WATCH the video directly and generate a summary
 */
async function generateGeminiVideoSummary(videoId, title, author) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  
  console.log(`🎥 Gemini watching video: ${videoUrl}`);
  
  const prompt = `Watch this YouTube video and create a comprehensive summary.

Video: "${title}" by ${author}

Create a detailed summary in this EXACT format:

## Summary
Write 3-4 detailed paragraphs (400-500 words total) covering:
- Main topic and purpose of the video
- Key themes, concepts, and important information presented
- Major insights, findings, examples, or demonstrations shown
- Overall structure and flow of the content
- Why this content is valuable or interesting

Be specific about what is ACTUALLY shown and discussed in the video.

## Highlights
Create 8-12 key moments with REAL timestamps from the video:
- **[MM:SS]** [Detailed 2-3 sentence description of what happens at this moment]
- **[MM:SS]** [Detailed 2-3 sentence description]
(Continue for all key moments)

Be comprehensive and detailed. This summary will be used by teachers for educational purposes.`;

  try {
    const result = await model.generateContent([
      prompt,
      {
        fileData: {
          fileUri: videoUrl,
          mimeType: 'video/mp4'
        }
      }
    ]);
    
    const response = result.response;
    const summaryText = response.text();
    
    console.log(`✓ Gemini video summary generated (${summaryText.length} chars)`);
    return summaryText;
    
  } catch (error) {
    console.error('❌ Gemini video watch error:', error);
    throw new Error(`Gemini could not watch video: ${error.message}`);
  }
}
