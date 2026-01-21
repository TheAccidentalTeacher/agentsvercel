/**
 * Vercel API Route: Video Guided Notes
 * Creates structured note-taking templates from video transcripts
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
    const { videoData, transcript, noteStyle, gradeLevel } = req.body;

    if (!transcript || !videoData) {
      return res.status(400).json({ 
        error: 'Missing required fields: videoData and transcript' 
      });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const style = noteStyle || 'cornell';
    const grade = gradeLevel || 'middle school';
    const videoTitle = videoData.title || 'Video';

    console.log(`📝 Generating ${style} notes for ${grade}...`);

    const userPrompt = getStylePrompt(style, videoTitle, grade, transcript);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const markdown = message.content[0].text;
    console.log('✅ Guided notes generated');

    return res.status(200).json({
      markdown: markdown,
      videoTitle: videoTitle,
      noteStyle: style
    });

  } catch (error) {
    console.error('❌ Error generating guided notes:', error);
    return res.status(500).json({
      error: 'Failed to generate guided notes',
      message: error.message
    });
  }
}

function getStylePrompt(style, videoTitle, grade, transcript) {
  const prompts = {
    cornell: `Create Cornell Notes based on this video content.

**VIDEO:** ${videoTitle}
**GRADE LEVEL:** ${grade}

**CONTENT:**
${transcript}

Format as clean markdown for Cornell Notes:

# Cornell Notes: ${videoTitle}

| Questions | Notes |
|-----------|-------|
| *Write questions here* | *Write notes here* |

---

## Section 1: [Topic Name]

### ❓ Questions (Left Column)
- [Key question 1]
- [Key question 2]
- [Key question 3]

### 📝 Notes (Right Column)
- [Main point 1]
- [Main point 2]
- [Supporting detail]
- [Example or definition]

### 🔑 Key Terms
- **[Term 1]** - definition
- **[Term 2]** - definition

---

(Repeat for each major section of the video - aim for 5-8 sections)

---

## 📋 Summary
[3-5 sentences summarizing the main ideas from all sections. This should synthesize the key takeaways.]

---
*Cornell Notes help you organize information for better retention and review.*`,

    outline: `Create a Hierarchical Outline based on this video content.

**VIDEO:** ${videoTitle}
**GRADE LEVEL:** ${grade}

**CONTENT:**
${transcript}

Format as a clean markdown outline:

# Outline: ${videoTitle}

## I. [First Main Topic]
   A. [Subtopic]
      1. [Detail]
      2. [Detail]
   B. [Subtopic]
      1. [Detail]
         a. [Sub-detail]
         b. [Sub-detail]
      2. [Detail]

## II. [Second Main Topic]
   A. [Subtopic]
      1. [Detail]
      2. [Detail]
   B. [Subtopic]

## III. [Third Main Topic]
   A. [Subtopic]
   B. [Subtopic]

(Continue with all major topics from the video)

---

### 📌 Key Takeaways
1. [Most important point]
2. [Second most important point]
3. [Third most important point]

---
*Outlines help you see the structure and hierarchy of information.*`,

    fillinblank: `Create a Fill-in-the-Blank Worksheet based on this video content.

**VIDEO:** ${videoTitle}
**GRADE LEVEL:** ${grade}

**CONTENT:**
${transcript}

Format as a clean markdown worksheet:

# Fill-in-the-Blank: ${videoTitle}

**Instructions:** Use the words from the Word Bank to complete each sentence.

---

## 📚 Word Bank
| | | | |
|---|---|---|---|
| [word1] | [word2] | [word3] | [word4] |
| [word5] | [word6] | [word7] | [word8] |
| [word9] | [word10] | [word11] | [word12] |

---

## Section 1: [Topic]

1. The process of ______________ involves [context clue].

2. According to the video, ______________ is important because [reason].

3. ______________ and ______________ work together to [action].

4. The main difference between ______________ and ______________ is [explanation].

5. Scientists discovered that ______________ when they [context].

---

## Section 2: [Topic]

6. [Another fill-in-blank sentence with clear context clues]

7. [Another sentence]

8. [Another sentence]

(Continue with 15-20 total blanks organized by topic)

---

## ✅ Answer Key

| # | Answer |
|---|--------|
| 1 | [answer] |
| 2 | [answer] |
| 3 | [answer, answer] |
(Continue for all blanks)

---
*Fill-in-the-blank worksheets help reinforce key vocabulary and concepts.*`,

    guided: `Create Guided Questions with content summaries based on this video.

**VIDEO:** ${videoTitle}
**GRADE LEVEL:** ${grade}

**CONTENT:**
${transcript}

Format as clean markdown:

# Guided Questions: ${videoTitle}

**Instructions:** Read each section summary, then answer the questions that follow.

---

## Section 1: [Topic Name] *(0:00 - 3:00)*

### 📖 Content Summary
[2-3 paragraph summary of this section of the video. Include key facts, concepts, and examples mentioned.]

### ❓ Comprehension Questions

1. **Recall:** [Question testing basic recall]
   
   *Space for answer:* _______________________________________________

2. **Understand:** [Question testing understanding]
   
   *Space for answer:* _______________________________________________

3. **Apply:** [Question asking students to apply the concept]
   
   *Space for answer:* _______________________________________________

---

## Section 2: [Topic Name] *(3:00 - 6:00)*

### 📖 Content Summary
[2-3 paragraph summary]

### ❓ Comprehension Questions

1. [Question]
   *Space for answer:* _______________________________________________

2. [Question]
   *Space for answer:* _______________________________________________

3. [Question]
   *Space for answer:* _______________________________________________

---

(Continue for 4-6 sections covering the whole video)

---

## 🎯 Reflection Questions

1. What was the most surprising thing you learned from this video?

2. How does this connect to something you already knew?

3. What questions do you still have after watching?

---
*Guided questions help you actively engage with video content.*`
  };

  return prompts[style] || prompts.cornell;
}
