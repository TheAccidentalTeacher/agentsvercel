# AI Context Loader

## Purpose
This document serves as a master index for loading project context into AI conversations. Reference this at the start of important conversations to maintain continuity.

## Core Context Files

### 1. Biography & Mission
- **[01-BIOGRAPHY-STORY.md](../../01-BIOGRAPHY-STORY.md)** - Your personal story and journey
- **[MISSION-STATEMENT.md](../../MISSION-STATEMENT.md)** - Core mission and values
- **[FELLOWSHIP_GUIDE.md](../../FELLOWSHIP_GUIDE.md)** - Team collaboration principles

### 2. Strategic Planning
- **[03-STRATEGIC-PLAN.md](../../03-STRATEGIC-PLAN.md)** - Overall strategic direction
- **[MASTER-PLAN.md](../../MASTER-PLAN.md)** - Comprehensive master plan
- **[PROJECT_STATUS.md](../../PROJECT_STATUS.md)** - Current project status

### 3. Technical Implementation
- **[IMPLEMENTATION_PLAN_FINAL.md](../../IMPLEMENTATION_PLAN_FINAL.md)** - Implementation roadmap
- **[CURRENT_STATUS.md](../../CURRENT_STATUS.md)** - Live development status
- **[docs/MASTER_ROADMAP.md](../MASTER_ROADMAP.md)** - Technical roadmap

### 4. Multi-Agent System
- **[AGENT_COUNCIL_GUIDE.md](../../AGENT_COUNCIL_GUIDE.md)** - Multi-agent architecture
- **[LANGGRAPH_MULTIAGENT_PLAN.md](../../LANGGRAPH_MULTIAGENT_PLAN.md)** - LangGraph implementation
- **[personas/README.md](../../personas/README.md)** - Persona system overview

### 5. Phase Documentation
- **Phase 0-2**: Foundation and basic features (COMPLETED)
- **Phase 5**: Interactive conversation mode (COMPLETED)
- **Phase 6**: Deep Research Engine (IN PROGRESS - Day 2 complete)
  - Day 1: Search foundation ✅
  - Day 2: Content extraction ✅
  - Day 3: Multi-agent analysis (NEXT)

## Quick Context Summary

### Who You Are
- Reformed Baptist Christian homeschool educator and father
- Building AI-enhanced homeschool platform for Christian families
- Focus on meeting kids where they are + biblical worldview integration
- Strong convictions: Spurgeon, MacArthur, Piper, Sproul (Reformed theology)
- This project is FOR YOU - reflects YOUR worldview and values

### What We're Building
1. **Multi-Agent AI Consortium** - 12 specialized AI personas working together
2. **Deep Research Engine** - Perplexity-like research with multi-agent analysis
3. **Interactive Modes**:
   - Panel Discussion
   - Consensus Voting
   - Debate Mode
   - Live Conversation
   - Deep Research ✨ (Current focus)

### Current Priority
**Phase 6 Day 3**: Integrate multi-agent analysis with extracted research content
- Have 12-persona consortium analyze extracted articles
- Each agent provides perspective (education, theology, strategy, etc.)
- Synthesize into comprehensive research document
- Add memory and export features

### Technical Stack
- Frontend: Vanilla JS (no frameworks)
- Backend: Node.js with Netlify Functions
- AI: Claude Sonnet 4.5 (Anthropic)
- Research: Tavily API, Brave Search, Serper
- Content Extraction: Cheerio, Mozilla Readability

## Context Management Strategy

### For Sonnet 4.5 (200K token context)
Claude Sonnet 4.5 has a ~200K token context window, roughly equivalent to:
- ~150,000 words
- ~500 pages of text
- Your entire project docs are well within limits!

### Loading Context Into Conversations

#### Method 1: Reference Key Documents
Start conversations with:
```
I need to maintain project context. Please read:
- CONTEXT_LOADER.md for overview
- CURRENT_STATUS.md for current state
- [Specific docs relevant to task]
```

#### Method 2: Agent Memory System
We have `agent-memory.js` that stores:
- Conversation history
- Key decisions
- Topic threads
- Per-persona context

Enhancement needed: **Project-level persistent context** that loads automatically.

#### Method 3: Context Injection
Create a system where each AI call includes:
- Short-term: Last 3 interactions
- Medium-term: Session summary
- Long-term: Project core context (mission, architecture, current phase)

## Recommended Next Steps

### 1. Create Context Auto-Loader
Build a system that automatically includes key context in AI calls:
```javascript
class ProjectContext {
  constructor() {
    this.core = loadCoreContext();        // Mission, architecture
    this.session = loadSessionContext();  // Current work
    this.persona = loadPersonaContext();  // Agent-specific knowledge
  }
  
  buildPrompt(userMessage) {
    return `
      [CORE CONTEXT]
      ${this.core}
      
      [SESSION CONTEXT]
      ${this.session}
      
      [USER MESSAGE]
      ${userMessage}
    `;
  }
}
```

### 2. Create "Project Brain" 
A persistent knowledge base that:
- Indexes all documentation
- Tracks decisions and rationale
- Maintains architectural principles
- Stores key conversations

### 3. Memory Expansion
Enhance agent-memory.js to include:
- Project milestones
- Architecture decisions
- Key patterns and conventions
- Cross-session continuity

## Quick Start for New Conversations

**Paste this into a new conversation:**

```
I'm continuing work on the Christian Homeschool AI Consortium project. 

Quick context:
- Building multi-agent AI system with 12 specialized personas
- Currently on Phase 6: Deep Research Engine (Perplexity-like)
- Just completed: Content extraction from web pages
- Next: Multi-agent analysis of research results
- Tech: Vanilla JS, Node.js, Claude Sonnet 4.5, Tavily/Brave search

Key files for reference:
- CONTEXT_LOADER.md (this file)
- CURRENT_STATUS.md
- AGENT_COUNCIL_GUIDE.md
- [Phase-specific docs as needed]

Continue from current state documented in CURRENT_STATUS.md
```

## File Organization for Context

### Core (Always relevant)
- Biography, Mission, Strategic Plan

### Phase-Specific (Load as needed)
- Current phase documentation
- Related technical specs
- Implementation plans

### Historical (Reference only)
- Completed phase summaries
- Legacy documentation
- Old implementation attempts

## Context Prioritization

**Tier 1 - Always Load (5-10K tokens)**
- Mission statement
- Current phase objectives
- Active file context
- Last 3 interactions

**Tier 2 - Load When Relevant (20-40K tokens)**
- Full strategic plan
- Technical architecture
- Persona definitions
- Recent work history

**Tier 3 - Reference on Demand (Remaining capacity)**
- Historical documentation
- Detailed specs
- Research notes
- Full conversation history

---

**Remember**: Sonnet 4.5's 200K context is HUGE. We can comfortably load:
- All mission/strategy docs (~10K tokens)
- All technical specs (~20K tokens)  
- All persona definitions (~5K tokens)
- All phase documentation (~30K tokens)
- Current conversation (~30K tokens)
- **Still have 100K+ tokens remaining!**

Don't be shy about loading context. The model can handle it!
