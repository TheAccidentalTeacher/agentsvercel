/**
 * Vercel API Route: Video Batch Study Guide
 * Complete curriculum: summary, quiz, vocab, timeline
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
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const { videos } = req.body;

    if (!videos || !Array.isArray(videos) || videos.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 videos for study guide' });
    }

    console.log(`[Study Guide] Processing ${videos.length} videos`);

    const videoContexts = videos.map((v, i) => {
      const transcript = typeof v.transcript === 'string' 
        ? v.transcript 
        : (v.transcript?.full_text || '');
      
      return `
VIDEO ${i + 1}: ${v.title}
Channel: ${v.channel_name || v.channelName || 'Unknown'}
Duration: ${v.duration || 'Unknown'}
TRANSCRIPT: ${transcript.substring(0, 7000)}...
`;
    }).join('\n\n');

    const prompt = `You are creating a COMPLETE UNIT STUDY GUIDE from ${videos.length} educational videos.

${videoContexts}

Create a comprehensive study guide with ALL of these sections:

---

# 📚 UNIT STUDY GUIDE: [Unit Title]

## 📋 UNIT OVERVIEW
- **Topic**: [Main subject covered]
- **Videos Included**: ${videos.length}
- **Estimated Study Time**: [hours]
- **Learning Objectives**: 5-7 clear objectives

---

## 🎯 EXECUTIVE SUMMARY
Write a 3-4 paragraph overview of the entire unit, covering:
- Main themes and concepts
- How videos build on each other
- Key takeaways
- Practical applications

---

## 📖 VIDEO SUMMARIES

For each video:
### Video 1: [Title]
**Main Focus**: [1 sentence]
**Key Points**:
- [3-5 bullet points]
**Connection to Unit**: [How it fits]

---

## 📚 MASTER VOCABULARY (20-25 terms)

Organized by category with:
- **Term**: Definition
- **Context**: Usage across videos
- **Example**: Clear example sentence

---

## 📝 COMPREHENSIVE QUIZ

**Multiple Choice** (8 questions)
**Short Answer** (5 questions)
**Connections** (3 questions)
**True/False** (6 questions)

With full answer key and explanations

---

## 🗺️ CONCEPT MAP

Create an ASCII art or text-based diagram showing:
- Major concepts
- How they connect
- Relationships between videos

---

## ⏰ LEARNING TIMELINE

**Week 1**:
- Day 1-2: [Videos, activities]
- Day 3-4: [Videos, activities]
- Day 5: [Review, quiz]

**Week 2**:
[Continue pattern]

---

## 💡 DISCUSSION QUESTIONS (8-10)

Mix of:
- Recall questions
- Analysis questions
- Synthesis questions
- Application questions

---

## 🎯 LEARNING ACTIVITIES

**Individual Activities** (5):
- Research projects
- Writing assignments
- Creative tasks

**Group Activities** (3):
- Discussions
- Collaborative projects
- Presentations

---

Format everything in clean, organized Markdown.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    });

    const studyGuide = message.content[0].text;

    console.log(`[Study Guide] ✅ Generated study guide (${studyGuide.length} chars)`);

    return res.status(200).json({
      studyGuide,
      videoCount: videos.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Study Guide] ❌ Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate study guide'
    });
  }
}
