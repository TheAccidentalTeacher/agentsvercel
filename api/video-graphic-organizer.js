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
    const { videoId, videoTitle, videoData, transcript, organizerType, gradeLevel } = req.body;

    const title = videoTitle || videoData?.title || 'Video';
    const id = videoId || videoData?.videoId || 'unknown';
    const type = organizerType || 'Concept Map';
    const grade = gradeLevel || 'middle school';

    console.log('[Graphic Organizer] Request received:', { type, grade, title });

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

    const userPrompt = `Create a ${type} graphic organizer based on this video content.

**VIDEO:** ${title}
**GRADE LEVEL:** ${grade}
**ORGANIZER TYPE:** ${type}

**CONTENT:**
${transcriptText}

Create a detailed ${type} in markdown format that helps students visualize the key concepts and relationships.

${getOrganizerInstructions(type)}

Format your response as clean, printable markdown that teachers can use directly.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const markdown = message.content[0].text;
    console.log('✅ Graphic organizer generated');

    return res.status(200).json({
      markdown: markdown,
      videoId: id,
      videoTitle: title,
      organizerType: type
    });

  } catch (error) {
    console.error('❌ Error generating graphic organizer:', error);
    return res.status(500).json({
      error: 'Failed to generate graphic organizer',
      message: error.message
    });
  }
}

function getOrganizerInstructions(type) {
  const instructions = {
    'Concept Map': `
# Concept Map: [Title]

## 🎯 Central Concept
**[Main Topic]**

## 🔗 Connected Concepts

### Branch 1: [Subtopic]
- Key idea 1
- Key idea 2
  - Supporting detail
  - Supporting detail

### Branch 2: [Subtopic]
- Key idea 1
- Key idea 2

(Continue with all major branches)

## 📝 Relationships
- [Concept A] → relates to → [Concept B] because...
- [Concept C] → leads to → [Concept D] because...`,

    'Timeline': `
# Timeline: [Title]

## 📅 Chronological Events

| Time/Date | Event | Significance |
|-----------|-------|--------------|
| [time] | [event] | [why it matters] |

## Detailed Timeline

### ⏱️ [Time 1]: [Event]
**What happened:** [Description]
**Why it matters:** [Significance]

(Continue for each major event)`,

    'Venn Diagram': `
# Venn Diagram: Comparing [Topic A] and [Topic B]

## 🔵 [Topic A] Only
- Unique characteristic 1
- Unique characteristic 2
- Unique characteristic 3

## 🟡 Both [Topic A] AND [Topic B]
- Shared characteristic 1
- Shared characteristic 2
- Shared characteristic 3

## 🔴 [Topic B] Only
- Unique characteristic 1
- Unique characteristic 2
- Unique characteristic 3`,

    'Cause and Effect': `
# Cause and Effect: [Title]

## 🔄 Cause-Effect Relationships

### Cause 1: [What happened]
**Effects:**
- → Effect 1
- → Effect 2
- → Effect 3

### Cause 2: [What happened]
**Effects:**
- → Effect 1
- → Effect 2

## 📊 Chain Reactions
[Event A] → leads to → [Event B] → leads to → [Event C]`,

    'KWL Chart': `
# KWL Chart: [Title]

## 🤔 K - What I KNOW
(Prior knowledge about the topic)
- [Known fact 1]
- [Known fact 2]
- [Known fact 3]

## ❓ W - What I WANT to Know
(Questions to explore)
- [Question 1]
- [Question 2]
- [Question 3]

## 📚 L - What I LEARNED
(Key takeaways from the video)
- [Learned fact 1]
- [Learned fact 2]
- [Learned fact 3]`,

    'Mind Map': `
# Mind Map: [Title]

## 🧠 Central Topic
**[Main Subject]**

---

## Branch 1: [Major Theme]
- Sub-idea 1.1
  - Detail
  - Detail
- Sub-idea 1.2
- Sub-idea 1.3

## Branch 2: [Major Theme]
- Sub-idea 2.1
- Sub-idea 2.2
  - Detail
  - Detail

(Continue for all major branches)`
  };

  return instructions[type] || instructions['Concept Map'];
}
