/**
 * Vercel API Route: Video Analysis
 * Multi-agent analysis of YouTube video transcripts
 */

import Anthropic from '@anthropic-ai/sdk';

export const config = {
  maxDuration: 60
};

// Persona definitions
const PERSONAS = {
  'master-teacher': { name: '👨‍🏫 Master Teacher', emoji: '👨‍🏫' },
  'classical-educator': { name: '📖 Classical Educator', emoji: '📖' },
  'strategist': { name: '📊 Strategist', emoji: '📊' },
  'theologian': { name: '⛪ Theologian', emoji: '⛪' },
  'technical-architect': { name: '🏗️ Technical Architect', emoji: '🏗️' },
  'writer': { name: '✍️ Writer', emoji: '✍️' },
  'analyst': { name: '🔬 Analyst', emoji: '🔬' },
  'debugger': { name: '🐛 Debugger', emoji: '🐛' },
  'ux-designer': { name: '🎨 UX Designer', emoji: '🎨' },
  'marketing-strategist': { name: '📢 Marketing Strategist', emoji: '📢' },
  'game-designer': { name: '🎮 Game Designer', emoji: '🎮' },
  'gen-alpha-expert': { name: '👾 Gen-Alpha Expert', emoji: '👾' }
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
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const { videoId, title, author, duration, transcript, segments, selectedPersonas, requestedSummaries } = req.body;

    console.log(`📺 Analyzing video: ${title} (${videoId})`);

    // Generate summaries
    const summaries = await generateSummaries(anthropic, title, author, transcript, segments, requestedSummaries);
    
    // Get agent analyses
    const personas = selectedPersonas || Object.keys(PERSONAS);
    const agentAnalyses = await generateAgentAnalyses(anthropic, title, author, transcript, personas.slice(0, 4));
    
    const response = {
      videoId,
      title,
      author,
      duration,
      summaries,
      agentAnalyses,
      analyzedAt: new Date().toISOString()
    };

    console.log(`✅ Analysis complete: ${agentAnalyses.length} agent perspectives`);

    return res.status(200).json(response);

  } catch (error) {
    console.error('Video analysis error:', error);
    return res.status(500).json({
      error: 'Analysis failed',
      message: error.message
    });
  }
}

async function generateSummaries(anthropic, title, author, transcript, segments, requestedTypes) {
  const summaries = {};

  const systemPrompt = `You are an expert at analyzing and summarizing video content. 
Provide clear, concise, and insightful summaries that capture the essence and key points of the content.`;

  try {
    const userPrompt = `Analyze this YouTube video transcript and provide the following summaries:

**Video**: "${title}" by ${author}

**Transcript**:
${transcript.substring(0, 8000)} ${transcript.length > 8000 ? '... (truncated)' : ''}

Please provide:

1. **TLDR** (one sentence): The absolute essence in 15-20 words
2. **Abstract** (one paragraph): A concise 100-150 word summary
3. **Detailed Summary** (5-7 paragraphs): Comprehensive analysis with key points
4. **Key Moments** (5-10 timestamped highlights): Important moments worth noting

Format your response as JSON:
{
  "tldr": "one sentence",
  "abstract": "one paragraph",
  "detailed": "detailed paragraphs",
  "keyMoments": [
    {"timestamp": "MM:SS", "description": "what happens"}
  ]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      temperature: 0.3,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const content = message.content[0].text;
    
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        Object.assign(summaries, parsed);
      }
    } catch (e) {
      summaries.raw = content;
    }

  } catch (error) {
    console.error('Summary generation error:', error);
    summaries.error = error.message;
  }

  return summaries;
}

async function generateAgentAnalyses(anthropic, title, author, transcript, personaKeys) {
  const analyses = [];

  for (const personaKey of personaKeys) {
    const persona = PERSONAS[personaKey];
    if (!persona) continue;

    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1500,
        temperature: 0.7,
        system: `You are ${persona.name}. Analyze content from your unique expert perspective.`,
        messages: [{
          role: 'user',
          content: `Analyze this video from your perspective:\n\n"${title}" by ${author}\n\n${transcript.substring(0, 4000)}`
        }]
      });

      analyses.push({
        persona: personaKey,
        name: persona.name,
        emoji: persona.emoji,
        analysis: message.content[0].text
      });
    } catch (error) {
      console.error(`Error generating ${personaKey} analysis:`, error);
    }
  }

  return analyses;
}
