/**
 * ResearchAnalyzer - Phase 6 Day 3
 * 
 * Orchestrates multi-agent analysis of extracted research content.
 * Each persona analyzes the content from their unique expertise.
 */

class ResearchAnalyzer {
  constructor(apiKey, model = 'claude-sonnet-4-5') {
    this.apiKey = apiKey;
    this.model = model;
    this.anthropicUrl = 'https://api.anthropic.com/v1/messages';
    
    // Define analysis roles for each persona
    this.analysisRoles = {
      'master-teacher': {
        name: '👨‍🏫 Master Teacher',
        focus: 'Pedagogical Applications',
        prompt: 'Analyze how these tools could be used in teaching. Consider: ease of learning, student engagement, differentiation capabilities, assessment integration, and practical classroom/homeschool implementation.'
      },
      'classical-educator': {
        name: '📖 Classical Educator',
        focus: 'Educational Philosophy',
        prompt: 'Evaluate from a classical education perspective. Consider: alignment with trivium/quadrivium, development of critical thinking, exposure to primary sources, cultivation of wisdom and virtue.'
      },
      'strategist': {
        name: '📊 Strategist',
        focus: 'Strategic Opportunities',
        prompt: 'Analyze the competitive landscape and strategic opportunities. Consider: market positioning, unique value propositions, competitive advantages, pricing models, scalability, and business sustainability.'
      },
      'theologian': {
        name: '⛪ Theologian',
        focus: 'Worldview & Values',
        prompt: 'Examine from a biblical worldview (Reformed Baptist perspective). Consider: alignment with Christian values, potential theological concerns, opportunities for biblical integration, and impact on character formation.'
      },
      'technical-architect': {
        name: '🏗️ Technical Architect',
        focus: 'Technical Architecture',
        prompt: 'Evaluate technical implementation and architecture. Consider: technology stack, scalability, integration capabilities, API design, data security, and technical sustainability.'
      },
      'debugger': {
        name: '🐛 Debugger',
        focus: 'Problems & Gaps',
        prompt: 'Identify problems, limitations, contradictions, and gaps. Consider: what\'s missing, what doesn\'t make sense, potential pitfalls, oversights, and areas needing further research. Be critical and thorough.'
      },
      'writer': {
        name: '✍️ Writer',
        focus: 'Executive Summary',
        prompt: 'Create a clear, compelling executive summary. Distill key findings, highlight most important insights, and present actionable recommendations. Write for clarity and impact.'
      },
      'ux-designer': {
        name: '🎨 UX Designer',
        focus: 'User Experience',
        prompt: 'Analyze user experience and interface design. Consider: usability, accessibility, user flow, visual design, learning curve, and overall user satisfaction potential.'
      },
      'analyst': {
        name: '🔬 Analyst',
        focus: 'Data & Evidence',
        prompt: 'Examine data, evidence, and measurable outcomes. Consider: effectiveness metrics, research backing, user testimonials, comparative data, and quantifiable benefits.'
      },
      'gen-alpha-expert': {
        name: '🎮 Gen-Alpha Expert',
        focus: 'Engagement & Relevance',
        prompt: 'Evaluate appeal and effectiveness for Gen-Alpha learners. Consider: gamification, engagement mechanics, attention span accommodation, digital native preferences, and motivational design.'
      },
      'marketing-strategist': {
        name: '📢 Marketing Strategist',
        focus: 'Market Positioning',
        prompt: 'Analyze marketing approach and positioning. Consider: target audience fit, messaging effectiveness, brand differentiation, customer acquisition potential, and market messaging.'
      },
      'game-designer': {
        name: '🎯 Game Designer',
        focus: 'Engagement Mechanics',
        prompt: 'Evaluate engagement and gamification elements. Consider: motivation systems, feedback loops, progression mechanics, reward structures, and sustained engagement potential.'
      }
    };
  }

  /**
   * Analyze research results with multi-agent consortium
   */
  async analyze(query, extractedContent, chunks, selectedPersonas = null) {
    console.log(`[ResearchAnalyzer] Starting analysis for query: "${query}"`);
    console.log(`[ResearchAnalyzer] Extracted content: ${extractedContent.length} sources`);
    console.log(`[ResearchAnalyzer] Chunks: ${chunks.length}`);
    
    // Use all personas if none selected, otherwise use selected ones
    const personasToUse = selectedPersonas || Object.keys(this.analysisRoles);
    console.log(`[ResearchAnalyzer] Analyzing with ${personasToUse.length} personas`);

    const startTime = Date.now();

    // Prepare content summary for analysis
    const contentSummary = this.prepareContentSummary(extractedContent, chunks);

    // Analyze with ALL personas IN PARALLEL (much faster!)
    console.log(`[ResearchAnalyzer] Starting ${personasToUse.length} analyses in parallel...`);
    
    const analysisPromises = personasToUse.map(async (personaId) => {
      const role = this.analysisRoles[personaId];
      if (!role) {
        console.warn(`[ResearchAnalyzer] Unknown persona: ${personaId}`);
        return null;
      }

      try {
        console.log(`[ResearchAnalyzer] 🔄 ${role.name} starting...`);
        const analysis = await this.analyzeWithPersona(query, contentSummary, personaId);
        console.log(`[ResearchAnalyzer] ✓ ${role.name} complete`);
        return {
          persona: personaId,
          name: role.name,
          focus: role.focus,
          analysis: analysis,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error(`[ResearchAnalyzer] ✗ ${role.name} failed:`, error.message);
        return {
          persona: personaId,
          name: role.name,
          focus: role.focus,
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    });

    // Wait for all analyses to complete
    const analysisResults = await Promise.all(analysisPromises);
    const analyses = analysisResults.filter(a => a !== null);

    const analysisDuration = Date.now() - startTime;
    console.log(`[ResearchAnalyzer] ✅ All ${analyses.length} analyses complete in ${analysisDuration}ms`);

    // Synthesize all analyses
    const synthesis = await this.synthesizeAnalyses(query, analyses, contentSummary);

    return {
      query,
      analyses,
      synthesis,
      metadata: {
        analysisDuration,
        personaCount: personasToUse.length,
        successfulAnalyses: analyses.filter(a => !a.error).length,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Prepare content summary for analysis
   */
  prepareContentSummary(extractedContent, chunks) {
    const sources = extractedContent
      .filter(c => !c.error)
      .map((content, index) => ({
        number: index + 1,
        title: content.title,
        url: content.url,
        wordCount: content.wordCount,
        excerpt: content.excerpt || content.content?.substring(0, 500) + '...',
        author: content.author,
        date: content.publishedDate
      }));

    // CRITICAL: Claude has 200K token limit, system prompt + user prompt + response must fit
    // Safe approach: Use only 100K tokens for content (~400K chars, but we'll be conservative)
    // Strategy: Sample chunks intelligently rather than just truncating
    
    let fullContent = '';
    const maxContentChars = 300000; // ~75K tokens for content (leaving room for prompts)
    
    if (chunks.length <= 10) {
      // Few chunks: use them all
      fullContent = chunks.map(chunk => chunk.content).join('\n\n---\n\n');
    } else {
      // Many chunks: sample strategically
      // Take first 3, last 3, and evenly spaced middle samples
      const sampled = [];
      sampled.push(...chunks.slice(0, 3)); // Beginning
      
      if (chunks.length > 10) {
        const middleStart = Math.floor(chunks.length / 3);
        const middleEnd = Math.floor(2 * chunks.length / 3);
        sampled.push(...chunks.slice(middleStart, middleStart + 3)); // Middle
        sampled.push(...chunks.slice(middleEnd, middleEnd + 3)); // Late middle
      }
      
      sampled.push(...chunks.slice(-3)); // End
      
      fullContent = sampled.map((chunk, idx) => {
        const chunkNum = chunks.indexOf(chunk) + 1;
        return `[Chunk ${chunkNum}/${chunks.length}]\n${chunk.content}`;
      }).join('\n\n---\n\n');
      
      console.log(`[ResearchAnalyzer] Sampled ${sampled.length}/${chunks.length} chunks for analysis`);
    }
    
    // Final safety: hard truncate if still too large
    if (fullContent.length > maxContentChars) {
      fullContent = fullContent.substring(0, maxContentChars) + '\n\n[Content truncated due to length...]';
      console.log(`[ResearchAnalyzer] Content truncated to ${maxContentChars} chars`);
    }

    return {
      sources,
      fullContent,
      totalWords: extractedContent.reduce((sum, c) => sum + (c.wordCount || 0), 0),
      totalChunks: chunks.length,
      sampledChunks: chunks.length > 10 ? 12 : chunks.length
    };
  }

  /**
   * Analyze content with a specific persona
   */
  async analyzeWithPersona(query, contentSummary, personaId) {
    const role = this.analysisRoles[personaId];
    
    const systemPrompt = `You are ${role.name}, an expert analyst specializing in ${role.focus}.

Your task: ${role.prompt}

You are analyzing research content related to this query: "${query}"

Be thorough, specific, and actionable. Cite specific examples from the sources when relevant.`;

    const userPrompt = `# Research Query
"${query}"

# Sources Analyzed
${contentSummary.sources.map(s => `
**Source ${s.number}: ${s.title}**
- URL: ${s.url}
- Word Count: ${s.wordCount}
${s.author ? `- Author: ${s.author}` : ''}
${s.date ? `- Published: ${s.date}` : ''}
- Excerpt: ${s.excerpt}
`).join('\n')}

# Full Extracted Content
${contentSummary.totalChunks > 10 ? `Note: Large content (${contentSummary.totalChunks} chunks total). Analyzed ${contentSummary.sampledChunks} representative samples.\n\n` : ''}${contentSummary.fullContent}

---

Please provide your analysis focusing on ${role.focus}. Be specific, cite sources by number when relevant, and provide actionable insights.`;

    const response = await this.callClaude(systemPrompt, userPrompt);
    return response;
  }

  /**
   * Synthesize all analyses into coherent report
   */
  async synthesizeAnalyses(query, analyses, contentSummary) {
    console.log(`[ResearchAnalyzer] Synthesizing ${analyses.length} analyses...`);

    const successfulAnalyses = analyses.filter(a => !a.error);
    
    if (successfulAnalyses.length === 0) {
      return {
        error: 'No successful analyses to synthesize',
        timestamp: new Date().toISOString()
      };
    }

    const systemPrompt = `You are a research synthesis expert. Your task is to combine multiple expert analyses into a single, coherent, comprehensive research report.

Create a well-structured report that:
1. Starts with an executive summary
2. Organizes findings by theme/category
3. Highlights key insights and patterns across analyses
4. Provides clear, actionable recommendations
5. Notes areas of consensus and disagreement among experts
6. Identifies gaps for further research

Be thorough, clear, and actionable.`;

    const userPrompt = `# Research Query
"${query}"

# Sources Analyzed
${contentSummary.sources.map(s => `- **Source ${s.number}**: ${s.title} (${s.wordCount} words)`).join('\n')}

# Expert Analyses

${successfulAnalyses.map(a => `
## ${a.name} - ${a.focus}

${a.analysis}

---
`).join('\n')}

Please synthesize these expert analyses into a comprehensive research report with:
- Executive Summary
- Key Findings (organized by theme)
- Recommendations
- Areas for Further Research
- Source Citations

Format in clear Markdown with appropriate headings.`;

    const synthesis = await this.callClaude(systemPrompt, userPrompt);
    
    return {
      report: synthesis,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Call Claude API
   */
  async callClaude(systemPrompt, userPrompt) {
    const response = await fetch(this.anthropicUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }
}

module.exports = ResearchAnalyzer;
