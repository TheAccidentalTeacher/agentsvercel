/**
 * Vercel API Route: Video Guided Notes
 * Creates structured note-taking templates from video transcripts
 * Now includes optional reading passage and exit ticket
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
    const { videoData, transcript, noteStyle, gradeLevel, includeReading, includeExitTicket } = req.body;

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
    if (includeReading) console.log('📖 Including reading passage');
    if (includeExitTicket) console.log('🎫 Including exit ticket');

    // Build the combined prompt
    let fullPrompt = getStylePrompt(style, videoTitle, grade, transcript);
    
    // Add reading passage request if enabled
    if (includeReading) {
      fullPrompt += getReadingPassagePrompt(videoTitle, grade);
    }
    
    // Add exit ticket request if enabled
    if (includeExitTicket) {
      fullPrompt += getExitTicketPrompt(videoTitle, grade);
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 6000, // Increased for additional content
      temperature: 0.7,
      messages: [{ role: 'user', content: fullPrompt }]
    });

    const markdown = message.content[0].text;
    console.log('✅ Guided notes generated');

    return res.status(200).json({
      markdown: markdown,
      videoTitle: videoTitle,
      noteStyle: style,
      includesReading: includeReading,
      includesExitTicket: includeExitTicket
    });

  } catch (error) {
    console.error('❌ Error generating guided notes:', error);
    return res.status(500).json({
      error: 'Failed to generate guided notes',
      message: error.message
    });
  }
}

/**
 * Reading Passage Prompt - 3 paragraphs at accessible reading level
 * Target: 7th grade below grade level = approximately 5th-6th grade Lexile
 */
function getReadingPassagePrompt(videoTitle, grade) {
  return `

---

## ADDITIONAL REQUEST: INFORMATIONAL READING PASSAGE

After the notes above, create a **3-paragraph informational reading passage** based on the same video content.

**CRITICAL READING LEVEL REQUIREMENTS:**
This reading is for 7th grade students who read BELOW grade level. Write at a 5th-6th grade reading level (Lexile 700-900).

**Readability Guidelines - YOU MUST FOLLOW:**
- Use SHORT sentences (10-15 words average)
- Use SIMPLE, common vocabulary (avoid jargon, define any necessary terms)
- Use HIGH-FREQUENCY words that struggling readers recognize
- Keep paragraphs to 4-6 sentences each
- Use clear topic sentences that state the main idea directly
- Use concrete examples instead of abstract concepts
- Avoid complex sentence structures (no multiple embedded clauses)
- Use transition words students know (First, Next, Then, Also, Finally)
- Define any technical terms in parentheses immediately after using them

**Structure:**
- **Paragraph 1 (Introduction):** Hook the reader and introduce the main topic. State what the passage is about in simple terms.
- **Paragraph 2 (Body):** Explain the most important information from the video. Include 2-3 key facts with specific details.
- **Paragraph 3 (Conclusion):** Summarize why this matters and connect to students' lives or the bigger picture.

Format as:

---

# 📖 Reading Passage: ${videoTitle}

[Paragraph 1 - Introduction]

[Paragraph 2 - Key Information]

[Paragraph 3 - Conclusion and Connection]

---`;
}

/**
 * Exit Ticket Prompt - 2 DOK 3 questions
 * DOK 3 = Strategic Thinking: requires reasoning, planning, using evidence
 */
function getExitTicketPrompt(videoTitle, grade) {
  return `

---

## ADDITIONAL REQUEST: DOK 3 EXIT TICKET

After everything above, create **2 DOK Level 3 (Strategic Thinking) exit ticket questions** based on the reading passage.

**WHAT IS DOK 3?**
DOK 3 questions require:
- Reasoning and planning
- Explaining WHY or HOW (not just WHAT)
- Using evidence to support thinking
- Making connections or comparisons
- Drawing conclusions based on multiple pieces of information
- Solving non-routine problems

**DOK 3 is NOT:**
- Simple recall (DOK 1): "What is the capital of Russia?"
- Basic comprehension (DOK 2): "Describe two features of Siberia"

**DOK 3 Examples:**
- "Based on what you read, why might [X] lead to [Y]? Use evidence from the passage."
- "How does [concept A] connect to [concept B]? Explain your reasoning."
- "If [situation changed], how would that affect [outcome]? Support your answer."

**READING LEVEL REQUIREMENTS:**
Write questions at 5th-6th grade reading level:
- Use simple, clear language
- Avoid complex vocabulary in the question itself
- Provide sentence starters to scaffold responses

Format as:

---

# 🎫 Exit Ticket: ${videoTitle}

**Directions:** Answer BOTH questions in complete sentences. Use evidence from the reading to support your answers.

---

**Question 1:** [DOK 3 question requiring reasoning and evidence]

*Sentence starter:* Based on the reading, I think... because...

**Your answer:** _________________________________________________

_________________________________________________

_________________________________________________

---

**Question 2:** [DOK 3 question requiring connections or conclusions]

*Sentence starter:* This connects to... because the passage shows that...

**Your answer:** _________________________________________________

_________________________________________________

_________________________________________________

---

*Remember: Strong answers explain your thinking AND include evidence from the reading!*`;
}

/**
 * Get the style-specific prompt for guided notes
 */
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
