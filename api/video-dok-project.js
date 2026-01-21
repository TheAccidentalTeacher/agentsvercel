/**
 * Vercel API Route: Video DOK Project
 * Generate DOK 3-4 extended projects from videos
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
    const { videoId, videoTitle, transcript, dokLevel = 3, projectType = 'research', duration = '1-2 weeks', gradeLevel = '9-12' } = req.body;
    
    console.log(`📊 Generating DOK ${dokLevel} ${projectType} project for video: ${videoTitle}`);

    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const dokDescription = dokLevel === 4 
      ? 'Extended Thinking - requires investigation over time, synthesis from multiple sources, and real-world application'
      : 'Strategic Thinking - requires reasoning, planning, evidence use, and abstract thinking';

    const userPrompt = `Create a rigorous DOK ${dokLevel} (${dokDescription}) ${projectType} project based on this video content.

**VIDEO:** ${videoTitle}
**DOK LEVEL:** ${dokLevel}
**PROJECT TYPE:** ${projectType}
**DURATION:** ${duration}
**GRADE LEVEL:** ${gradeLevel}

**CONTENT:**
${transcript}

Create a comprehensive project in markdown format:

# DOK ${dokLevel} Project: [Creative Project Title]

## 📋 Project Overview
| | |
|---|---|
| **DOK Level** | ${dokLevel} - ${dokLevel === 4 ? 'Extended Thinking' : 'Strategic Thinking'} |
| **Type** | ${projectType.charAt(0).toUpperCase() + projectType.slice(1)} |
| **Duration** | ${duration} |
| **Grade Level** | ${gradeLevel} |

## 🎯 Essential Question
[Big, open-ended question that drives inquiry]

## 📚 Learning Objectives
Students will:
1. [Objective with Bloom's verb]
2. [Objective with Bloom's verb]
3. [Objective with Bloom's verb]

## 🔍 Project Description
[Detailed description of what students will do, create, or investigate]

## 📅 Project Timeline

### Week 1: Research & Planning
- [ ] Day 1-2: [Task]
- [ ] Day 3-4: [Task]
- [ ] Day 5: [Checkpoint]

### Week 2: Development & Creation
- [ ] Day 1-2: [Task]
- [ ] Day 3-4: [Task]
- [ ] Day 5: [Final submission]

## ✅ Requirements

### Research Component
- [Requirement 1]
- [Requirement 2]

### Analysis Component
- [Requirement 1]
- [Requirement 2]

### Creation/Synthesis Component
- [Requirement 1]
- [Requirement 2]

## 📊 Assessment Rubric

| Criteria | Exceeds (4) | Meets (3) | Approaching (2) | Beginning (1) |
|----------|-------------|-----------|-----------------|---------------|
| Research | [description] | [description] | [description] | [description] |
| Analysis | [description] | [description] | [description] | [description] |
| Synthesis | [description] | [description] | [description] | [description] |
| Presentation | [description] | [description] | [description] | [description] |

## 🔗 Resources
- [Resource 1]
- [Resource 2]
- [Resource 3]

## 💡 Differentiation

### For Struggling Learners:
- [Support/scaffold]

### For Advanced Learners:
- [Extension/challenge]

---
*This project requires ${dokLevel === 4 ? 'extended investigation over time with synthesis from multiple sources' : 'strategic thinking with reasoning and evidence-based conclusions'}.*`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 6000,
      temperature: 0.7,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const markdown = message.content[0].text;
    console.log('✅ DOK project generated successfully');

    return res.status(200).json({
      markdown: markdown,
      videoId: videoId,
      videoTitle: videoTitle,
      dokLevel: dokLevel,
      projectType: projectType
    });

  } catch (error) {
    console.error('❌ Error generating DOK project:', error);
    return res.status(500).json({
      error: 'Failed to generate DOK project',
      message: error.message
    });
  }
}
