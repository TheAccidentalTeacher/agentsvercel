/**
 * Vercel API Route: Video Lesson Plan
 * Generate comprehensive lesson plan from video
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

    console.log('📚 Generating lesson plan for video:', videoId);

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const gradeLevel = options.gradeLevel || '9-12';
    const duration = options.duration || '45 minutes';
    const subject = options.subject || 'General';

    const userPrompt = `Create a comprehensive, ready-to-use lesson plan based on this video content.

**VIDEO:** ${videoTitle}
**GRADE LEVEL:** ${gradeLevel}
**CLASS DURATION:** ${duration}
**SUBJECT AREA:** ${subject}

**CONTENT:**
${transcript}

Format your response as clean markdown:

# Lesson Plan: ${videoTitle}

## Overview
| | |
|---|---|
| **Grade Level** | ${gradeLevel} |
| **Duration** | ${duration} |
| **Subject** | ${subject} |

## Learning Objectives
By the end of this lesson, students will be able to:
1. [Measurable objective using Bloom's verbs]
2. [Measurable objective using Bloom's verbs]
3. [Measurable objective using Bloom's verbs]

## Standards Alignment
- [Relevant standard 1]
- [Relevant standard 2]

## Materials Needed
- [ ] Video: ${videoTitle}
- [ ] [Additional materials]

## Lesson Outline

### 🎯 Hook/Anticipatory Set (5 minutes)
[Engaging activity to capture student interest]

### 📺 Video Viewing (10-15 minutes)
**Before viewing:**
- [Pre-viewing questions or focus areas]

**During viewing:**
- [Note-taking instructions]

**After viewing:**
- [Reflection prompt]

### 📝 Guided Practice (10-15 minutes)
[Activity where teacher guides students through applying concepts]

### 🎓 Independent Practice (10 minutes)
[Activity students complete on their own]

### 🔄 Closure (5 minutes)
[Summarization activity, exit ticket, or reflection]

## Assessment
**Formative:**
- [How you'll check understanding during the lesson]

**Summative:**
- [End-of-lesson assessment]

## Differentiation

### For Struggling Learners:
- [Accommodations and supports]

### For Advanced Learners:
- [Extensions and challenges]

### For English Language Learners:
- [Language supports]

## Extension Activities
1. [Optional follow-up activity]
2. [Optional homework]

---
*Lesson plan generated from video content*`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const markdown = message.content[0].text;
    console.log('✅ Lesson plan generated successfully');

    return res.status(200).json({
      markdown: markdown,
      videoId: videoId,
      videoTitle: videoTitle
    });

  } catch (error) {
    console.error('❌ Error generating lesson plan:', error);
    return res.status(500).json({
      error: 'Failed to generate lesson plan',
      message: error.message
    });
  }
}
