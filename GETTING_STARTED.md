# Getting Started with UCAS Development

**Universal Cognitive Amplification System**  
**For Developers and Future Team Members**  
**Last Updated**: December 14, 2025

---

## 👋 Welcome!

You're about to work on **the most expansive personal AI cognitive amplification tool being built** - a system that combines multi-agent AI, deep research, creative generation, and development tools into one unified platform.

This guide will get you from zero to coding in **15 minutes**.

---

## 🎯 Quick Context

### What Is UCAS?

A cognitive amplification platform that uses **12 specialized AI agents** working together to:
- Have collaborative discussions (like a team meeting)
- Conduct deep research (web search + analysis)
- Create content (images, videos, audio)
- Develop software (code editor + deployment)
- Integrate with productivity tools (Google Docs, etc.)

### Where We Are Now

- ✅ **Phase 1-5 Complete** - Multi-agent conversation system operational
- 🎯 **Phase 6 Next** - Deep research capabilities (2-3 days)
- 🔮 **Phases 7-11** - Video, creative, development, integrations (3-4 months)

### Your First Task

Read these docs in order:
1. [COGNITIVE_AMPLIFICATION_VISION.md](docs/COGNITIVE_AMPLIFICATION_VISION.md) (20 min) - The big picture
2. [CURRENT_CAPABILITIES_INVENTORY.md](docs/CURRENT_CAPABILITIES_INVENTORY.md) (20 min) - What works now
3. [PHASE_6_IMPLEMENTATION_PLAN.md](PHASE_6_IMPLEMENTATION_PLAN.md) (15 min) - Ready-to-code guide

**Total**: 55 minutes to full context

---

## ⚡ Quick Setup (15 minutes)

### Prerequisites

```bash
# Check versions
node --version  # Need v18+
npm --version   # Need v9+
git --version   # Any recent version
```

### Step 1: Clone & Install (5 min)

```bash
# Clone repository
git clone <repo-url>
cd "Game Editor"

# Install dependencies
npm install

# Installed packages (~200MB):
# - @langchain/langgraph - Agent orchestration
# - @langchain/anthropic - Claude integration
# - @langchain/openai - GPT integration
# - cheerio, turndown - Web scraping (Phase 6)
# - And more...
```

### Step 2: Environment Setup (5 min)

Create `.env` file in root:

```env
# Required: LLM Providers
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-proj-...

# Optional: Research (Phase 6)
SERP_API_KEY=...        # Get from serpapi.com
TAVILY_API_KEY=...      # Get from tavily.com

# Optional: Creative (Phase 8)
DALLE_API_KEY=...
ELEVENLABS_API_KEY=...

# Development
NODE_ENV=development
```

**Get API Keys**:
- **Anthropic** (required): https://console.anthropic.com/
- **OpenAI** (optional backup): https://platform.openai.com/
- **SerpAPI** (Phase 6): https://serpapi.com/
- **Tavily** (Phase 6): https://tavily.com/

### Step 3: Test It Works (5 min)

```bash
# Start development server
node server.cjs

# Should see:
# Server running at http://localhost:3000
# Netlify functions available at http://localhost:3000/api/*

# Open browser
start http://localhost:3000

# Try it:
# 1. Click 🤖 Multi-Agent Consortium button
# 2. Select "Conversation" mode
# 3. Enter: "Explain quantum computing simply"
# 4. Watch agents discuss!
```

If that works, **you're ready to code!** 🎉

---

## 📂 Project Structure

```
Game Editor/
├── 📄 Core Application
│   ├── index.html              - Main UI
│   ├── editor.js               - Game editor logic
│   ├── style.css               - Styles
│   └── server.cjs              - Development server
│
├── 🤖 Multi-Agent System (Phase 1-5) ✅
│   ├── langgraph-agents.js     - Orchestration engine (726 lines)
│   ├── langgraph-conversation.js - Conversation mode (351 lines)
│   ├── multi-agent-client.js   - Frontend client (209 lines)
│   ├── multi-agent-ui.js       - UI controller (500+ lines)
│   └── agent-memory.js         - Conversation memory
│
├── 🔍 Research Module (Phase 6) 🎯 NEXT
│   └── research/
│       ├── search-orchestrator.js    - Multi-source search
│       ├── content-extractor.js      - Web scraping
│       ├── content-chunker.js        - Smart chunking
│       ├── research-analyzer.js      - Multi-agent analysis
│       ├── research-memory.js        - Save sessions
│       └── research-exporter.js      - Export formats
│
├── 🎨 Personas
│   └── personas/
│       ├── README.md           - Persona system docs
│       ├── analyst.md          - Data & evidence expert
│       ├── master-teacher.md   - Educational expert
│       ├── strategist.md       - Big picture thinker
│       ├── debugger.md         - Critical thinker
│       └── ... (12 total personas)
│
├── ⚡ API Functions (Netlify Serverless)
│   └── netlify/functions/
│       ├── multi-agent.js      - Panel/consensus/debate API
│       ├── multi-agent-conversation.js - Conversation API
│       └── research.js         - Research API (Phase 6)
│
├── 📚 Documentation
│   └── docs/
│       ├── MASTER_INDEX.md                    - Start here
│       ├── COGNITIVE_AMPLIFICATION_VISION.md  - The dream
│       ├── CURRENT_CAPABILITIES_INVENTORY.md  - What we have
│       ├── FUTURE_CAPABILITIES_ROADMAP.md     - What's coming
│       ├── TECHNICAL_ARCHITECTURE.md          - How it works
│       ├── RESEARCH_CAPABILITIES_SPEC.md      - Phase 6 details
│       └── ai/
│           ├── PHASE_5_COMPLETE.md            - Latest status
│           └── AI_CONTEXT.md                  - For AI assistants
│
├── 📋 Project Management
│   ├── README.md                   - Project overview
│   ├── PROJECT_STATUS.md           - Current status
│   ├── PHASE_6_IMPLEMENTATION_PLAN.md - Next steps (detailed!)
│   ├── PHASE_2_FINAL_STATUS.md     - Historical context
│   └── CHANGELOG.md                - Version history
│
└── 🧪 Testing
    ├── test-agents.js          - Test multi-agent system
    ├── test-api.js             - Test API endpoints
    └── test-multi-agent-ui.html - UI testing page
```

---

## 🎓 Understanding the Codebase

### Key Concepts

#### 1. Multi-Agent System

**12 Specialized Personas**:
- Core Council: Master Teacher, Classical Educator, Strategist, Theologian
- Specialists: Technical Architect, Writer, Analyst, Debugger, UX Designer, Marketing Strategist, Gamification Designer, Gen-Alpha Expert

**Three Modes**:
1. **Panel** - All agents respond sequentially
2. **Consensus** - Agents vote and reach agreement
3. **Conversation** - Turn-taking discussion (most engaging!)

**Architecture**:
```
User Question
    ↓
Router Agent (selects personas)
    ↓
Orchestrator Agent (manages flow)
    ↓
12 Specialized Agents (respond)
    ↓
Synthesizer Agent (combines responses)
    ↓
Result to User
```

#### 2. LangGraph State Machine

**What**: Framework for building agentic workflows as state machines

**Why**: Perfect for multi-step agent interactions

**Example**:
```javascript
const graph = new StateGraph(State)
  .addNode("router", routerAgent)
  .addNode("orchestrator", orchestratorAgent)
  .addNode("synthesizer", synthesizerAgent)
  .addEdge(START, "router")
  .addEdge("router", "orchestrator")
  .addEdge("orchestrator", "synthesizer")
  .addEdge("synthesizer", END)
  .compile();

const result = await graph.invoke({ question: "..." });
```

#### 3. Persona System

**How It Works**:
- Each persona defined in `.md` file in `personas/`
- File loaded as system prompt for that agent
- Defines: communication style, expertise, personality

**Creating New Persona**:
1. Copy `personas/_TEMPLATE.md`
2. Fill in details
3. Add to `langgraph-agents.js` PERSONAS object
4. Done!

---

## 🛠️ Development Workflow

### Making Changes

```bash
# 1. Create feature branch
git checkout -b feature/phase-6-search

# 2. Make changes
# ... code ...

# 3. Test locally
node server.cjs
# Test in browser

# 4. Commit with descriptive message
git add -A
git commit -m "Phase 6: Add search orchestrator

- Integrate SerpAPI and Tavily
- Implement deduplication and ranking
- Add research API endpoint
- Test with real queries"

# 5. Push and create PR (if team) or merge (if solo)
git push origin feature/phase-6-search
```

### Testing

**Manual Testing** (current approach):
```bash
# Start server
node server.cjs

# Open browser
# 1. Test multi-agent conversation
# 2. Test new feature
# 3. Check console for errors
# 4. Verify API responses
```

**Automated Testing** (Phase 11+):
```bash
# Will add later:
npm test              # Unit tests
npm run test:e2e      # End-to-end tests
npm run test:api      # API tests
```

### Debugging

**Browser Console**:
- `multiAgentClient` - Access client directly
- `console.log` - Extensive logging throughout code

**Server Logs**:
- Run `node server.cjs` to see all API logs
- Each function logs start, progress, completion

**Common Issues**:
1. **API Key Error** - Check `.env` file
2. **Network Error** - Check Netlify functions running
3. **LLM Timeout** - Claude/GPT taking too long, try Haiku

---

## 📖 Documentation Conventions

### File Naming

- `UPPERCASE.md` - Project management docs (root)
- `PascalCase.md` - Concept/architecture docs (docs/)
- `kebab-case.js` - Code files
- `lowercase.md` - In personas/, ai/

### Doc Structure

Every doc should have:
```markdown
# Title

**Key Metadata**
Status: ...
Last Updated: ...

---

## Section 1
Content...

## Section 2
Content...

---

**Footer with status or next steps**
```

### Commit Messages

Format:
```
Phase/Feature: Brief description (max 50 chars)

- Bullet point 1 (what changed)
- Bullet point 2 (what changed)
- Bullet point 3 (what changed)

Optional longer explanation if needed.
```

Examples:
```
Phase 6: Add search orchestrator

- Integrate SerpAPI for Google search
- Add Tavily for AI-optimized results
- Implement deduplication by URL
- Add scoring and ranking algorithm
```

---

## 🚀 Your First Contribution

### Task: Implement Phase 6 Day 1 (Search Foundation)

**Time**: 3-4 hours  
**Difficulty**: Medium (mostly API integration)  
**Doc**: [PHASE_6_IMPLEMENTATION_PLAN.md](PHASE_6_IMPLEMENTATION_PLAN.md)

**Steps**:
1. Sign up for SerpAPI and Tavily (free tiers)
2. Add API keys to `.env`
3. Create `research/search-orchestrator.js` (copy from implementation plan)
4. Create `netlify/functions/research.js` (copy from implementation plan)
5. Test with `curl` or Postman
6. Add research tab to UI (follow implementation plan)
7. Test end-to-end in browser
8. Commit with good message
9. High five yourself 🎉

**Expected Result**:
- Can search for any topic
- See results from Google and Tavily
- Results deduplicated and ranked
- Ready for Day 2 (content extraction)

---

## 💡 Tips for Success

### Do

✅ Read the docs FIRST (especially vision and current capabilities)  
✅ Follow the implementation plan (it's detailed for a reason)  
✅ Test incrementally (don't wait until end)  
✅ Ask questions (via issues, comments, or AI assistant)  
✅ Keep commits small and focused  
✅ Document as you go (update docs when you change things)

### Don't

❌ Skip reading the docs (you'll be lost)  
❌ Change architecture without understanding it first  
❌ Make massive commits (hard to review/debug)  
❌ Break existing features (test before committing)  
❌ Ignore console errors (fix them!)  
❌ Forget to update documentation

### When Stuck

1. **Read the relevant doc** - Usually answers your question
2. **Check similar code** - See how it's done elsewhere
3. **Test in isolation** - Narrow down the problem
4. **Ask AI assistant** - Copilot/Claude know this codebase
5. **Create minimal reproduction** - Often reveals the issue
6. **Take a break** - Fresh eyes help

---

## 🎯 Next Steps

### Immediate (Today)

1. ✅ Complete setup (above)
2. ✅ Read vision doc (20 min)
3. ✅ Read current capabilities (20 min)
4. ✅ Read Phase 6 plan (15 min)
5. ✅ Try using the current system
6. 🎯 Start Phase 6 Day 1

### This Week

- Day 1: Search foundation (3-4 hours)
- Day 2: Content extraction (3-4 hours)
- Day 3: Multi-agent analysis & memory (3-4 hours)
- Result: Working research engine!

### This Month

- Week 1: Phase 6 (Research) ✅
- Week 2: Phase 7 (YouTube/Video)
- Week 3: Phase 8 (Creative content)
- Week 4: Polish and test

### This Quarter

- Month 1: Phases 6-7
- Month 2: Phases 8-9
- Month 3: Phases 10-11
- Result: Replace VS Code + Perplexity + more!

---

## 📚 Essential Reading

### Must Read (Before Coding)

1. [COGNITIVE_AMPLIFICATION_VISION.md](docs/COGNITIVE_AMPLIFICATION_VISION.md)
2. [CURRENT_CAPABILITIES_INVENTORY.md](docs/CURRENT_CAPABILITIES_INVENTORY.md)
3. [PHASE_6_IMPLEMENTATION_PLAN.md](PHASE_6_IMPLEMENTATION_PLAN.md)

### Important (This Week)

4. [TECHNICAL_ARCHITECTURE.md](docs/TECHNICAL_ARCHITECTURE.md)
5. [RESEARCH_CAPABILITIES_SPEC.md](docs/RESEARCH_CAPABILITIES_SPEC.md)
6. [PHASE_5_COMPLETE.md](docs/ai/PHASE_5_COMPLETE.md)

### Reference (As Needed)

7. [FUTURE_CAPABILITIES_ROADMAP.md](docs/FUTURE_CAPABILITIES_ROADMAP.md)
8. [MASTER_INDEX.md](docs/MASTER_INDEX.md)
9. [LangGraph Technical Reference](LANGGRAPH_TECHNICAL_REFERENCE.md)

---

## 🤝 Communication

### With AI Assistants (Copilot, Claude, etc.)

This repo has extensive documentation that AI assistants can read. When asking for help:

**Good**: "Read docs/COGNITIVE_AMPLIFICATION_VISION.md and help me implement the search orchestrator from PHASE_6_IMPLEMENTATION_PLAN.md"

**Bad**: "How do I add search to this app?"

### With Team (Future)

- Use GitHub Issues for bugs/features
- Use PR descriptions for context
- Reference docs in discussions
- Keep discussions in code comments

---

## 🎉 You're Ready!

You now have:
- ✅ Complete context on what we're building
- ✅ Working development environment
- ✅ Understanding of codebase structure
- ✅ Clear next steps (Phase 6)
- ✅ All documentation at your fingertips

**Time to build the future of cognitive amplification!** 🚀

**Start here**: [PHASE_6_IMPLEMENTATION_PLAN.md](PHASE_6_IMPLEMENTATION_PLAN.md)

---

## ❓ FAQs

**Q: How long will Phase 6 take?**  
A: 2-3 days with AI assistance. Traditional dev: 1-2 weeks.

**Q: Do I need to know LangGraph?**  
A: Nice to have, not required. Read LANGGRAPH_TECHNICAL_REFERENCE.md for basics.

**Q: Can I use GPT instead of Claude?**  
A: Yes! Set `provider: 'openai'` in API calls. Both supported.

**Q: What if I break something?**  
A: Git reset! `git reset --hard HEAD` returns to last commit.

**Q: Where do I ask questions?**  
A: GitHub Issues, or ask AI assistant with context from docs.

**Q: Can I change the architecture?**  
A: Read TECHNICAL_ARCHITECTURE.md first, then propose changes with reasoning.

**Q: How do I add a new persona?**  
A: See personas/README.md - it's easy!

---

**Welcome to UCAS development. Let's build something amazing.** ✨
