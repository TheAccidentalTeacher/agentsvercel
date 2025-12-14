# Phase 2: Multi-Agent Orchestration - Implementation Roadmap

**Status**: 🚀 READY TO START  
**Estimated Timeline**: 12-16 hours (split into 4 sprints)  
**Date Started**: December 13, 2025  
**Architecture**: LangGraph.js + Existing 12 Expert Personas

---

## 🎯 Phase 2 Vision

Transform the current **individual persona system** into a **dynamic multi-agent council** where:

✅ Personas collaborate and debate on complex questions
✅ Memory system helps agents learn from past interactions  
✅ Multiple interaction modes: Panel Discussion, Debate, Consensus
✅ Synthesis agent combines perspectives into coherent answers
✅ Each persona maintains distinct personality and expertise
✅ Real-time UI shows which agents are thinking/responding

---

## 📊 Current Foundation (Phase 1.5 ✅ Complete)

What we're building on:

- **12 Expert Personas**: Master Teacher, Technical Architect, Strategist, Theologian, Writer, Analyst, Debugger, Classical Educator, Gen-Alpha Expert, UX Designer, Marketing Strategist, Game Designer
- **Persona-Specific Memory**: AgentMemory class with localStorage persistence
- **Professional UI**: Resizable AI panel, badge system, timestamps, dark theme
- **Branding**: "The Consortium" logo and identity
- **Backend Ready**: Node.js dev server, Anthropic API, Netlify Functions

---

## 🏗️ Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface                          │
├─────────────────────────────────────────────────────────────┤
│ • Multi-agent mode toggle                                   │
│ • Mode selection (Panel/Debate/Consensus)                   │
│ • Live agent status display                                 │
│ • Individual response containers                            │
│ • Synthesis display                                         │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────────────┐
│              Multi-Agent API Layer                          │
├─────────────────────────────────────────────────────────────┤
│ POST /api/multi-agent                                       │
│ • Question, selected personas, mode                         │
│ • Streaming responses                                       │
│ • Real-time agent status                                    │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────────────┐
│           LangGraph.js Orchestrator                         │
├─────────────────────────────────────────────────────────────┤
│ Router Agent → Orchestrator → [Agent Pool] → Synthesizer   │
│                                    ↓                        │
│                           Memory Integration               │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────────────┐
│            LLM Provider Layer                               │
├─────────────────────────────────────────────────────────────┤
│ • Anthropic Claude (multi-model)                            │
│ • OpenAI GPT (fallback)                                     │
│ • Model selection per agent                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Implementation Sprints

### **Sprint 1: LangGraph Setup & Agent Wrapper** (4 hours)

**Goal**: Create foundational LangGraph infrastructure and agent factory

#### 1.1 Install Dependencies (30 min)

```bash
npm install @langchain/langgraph @langchain/core @langchain/anthropic @langchain/openai
```

#### 1.2 Create Agent Wrapper (`langgraph-agents.js`) (2 hours)

**Purpose**: Bridge existing personas to LangGraph agents

```javascript
// Key functions to implement:

// 1. Agent Factory - Convert persona files to agents
function createPersonaAgent(personaName) {
  // Load persona markdown from personas/{name}.md
  // Create LangGraph agent node with persona as system context
  // Include memory integration
}

// 2. State Management
const MultiAgentState = {
  question: string,
  selectedPersonas: string[],
  mode: 'panel' | 'debate' | 'consensus' | 'auto',
  personaResponses: { persona: string, response: string, timestamp: Date }[],
  synthesisResult: string,
  metadata: { executionTime, tokenUsage, etc }
}

// 3. Graph Workflow
function buildMultiAgentGraph() {
  // Create StateGraph with nodes and edges
  // Define routers and conditional logic
  // Return compiled graph ready to invoke
}

// 4. Execution Wrapper
async function executeMultiAgentWorkflow(state) {
  // Load graph
  // Execute with streaming support
  // Collect and format results
}
```

**File**: `C:\Users\scoso\WEBSITES\Game Editor\langgraph-agents.js` (400-500 lines)

#### 1.3 Update package.json (30 min)

Add new dependencies and ensure compatibility with existing setup.

---

### **Sprint 2: Agent Nodes & Orchestration Logic** (4 hours)

**Goal**: Implement Router, Orchestrator, and Synthesizer agents

#### 2.1 Router Agent (1 hour)

**Purpose**: Analyze user question and decide:
- Which personas should respond
- Which interaction mode to use
- Any special handling needed

```javascript
// Router decides:
// "How do I design engaging levels?" 
//   → Game Designer, UX Designer, Master Teacher
//   → Mode: "panel" (sequential expertise)

// "OOP vs ECS: which is better?"
//   → Technical Architect, Analyst, Strategist
//   → Mode: "debate" (opposing viewpoints)

// "Is this code good?"
//   → All Specialists (5-7 agents)
//   → Mode: "consensus" (votes + scores)
```

#### 2.2 Orchestrator Agent (1 hour)

**Purpose**: Manage conversation flow between agents

- Sequential ordering in panel mode
- Turn management in debate mode
- Parallel execution in consensus mode
- Timeout handling
- Token limit awareness

#### 2.3 Synthesizer Agent (1 hour)

**Purpose**: Combine multiple perspectives into coherent answer

```javascript
// Input: Array of persona responses + question
// Output: Coherent synthesis that:
//   • Highlights agreements
//   • Acknowledges disagreements
//   • Prioritizes most relevant insights
//   • Maintains Consortium voice/branding
//   • Actionable for user
```

#### 2.4 Moderator Agent (1 hour)

**Purpose**: Facilitate debates and manage back-and-forth

- Request rebuttals
- Keep debate on topic
- Count rounds (max 3)
- Prepare final summary

---

### **Sprint 3: Backend Integration** (3 hours)

**Goal**: Create multi-agent API endpoint and integrate with existing system

#### 3.1 Create Multi-Agent Endpoint (2 hours)

**File**: `C:\Users\scoso\WEBSITES\Game Editor\netlify\functions\multi-agent.js`

```javascript
// POST /api/multi-agent
// Body: {
//   question: string,
//   selectedPersonas?: string[],
//   mode?: 'panel' | 'debate' | 'consensus' | 'auto',
//   conversationId?: string,
//   includeMemory?: boolean
// }

// Response (streaming):
// [
//   { type: 'router_decision', data: { personas, mode } },
//   { type: 'agent_start', agent: 'Master Teacher', timestamp },
//   { type: 'agent_response', agent: 'Master Teacher', content, timestamp },
//   { type: 'agent_end', agent: 'Master Teacher' },
//   { type: 'synthesis_start', timestamp },
//   { type: 'synthesis_response', content, timestamp },
//   { type: 'synthesis_end', metadata: { totalTime, tokenUsage } }
// ]
```

#### 3.2 Memory Integration (1 hour)

- Load AgentMemory for each persona
- Include memory context in system prompts
- Save responses to memory for all participating agents
- Handle memory conflicts gracefully

**Key Decision**: Should all agents update memory, or only primary one?
- **Answer**: All agents should learn (they're a council)
- But each maintains their own memory instance

---

### **Sprint 4: Frontend UI & Testing** (4-5 hours)

**Goal**: Build intuitive multi-agent UI and comprehensive testing

#### 4.1 UI Components (2 hours)

**File**: `C:\Users\scoso\WEBSITES\Game Editor\multi-agent-ui.js` (200-300 lines)

Components to build:

1. **Mode Selector**
   - Toggle between single-agent and multi-agent
   - Select mode (Panel/Debate/Consensus)
   - Show mode descriptions/tips

2. **Persona Selector**
   - Which personas to include?
   - Auto-select or manual?
   - Quick presets (e.g., "Game Design Council")

3. **Live Agent Display**
   ```
   Master Teacher 🧠  ⏳ Thinking...
   Technical Architect 🏗️  [Response rendered with markdown]
   Strategist 🎯  ⏳ Thinking...
   [Final Synthesis Section]
   ═══════════════════════════════════════
   The Consortium Says:
   Based on the collective expertise of Master Teacher, 
   Technical Architect, and Strategist, here are our recommendations...
   ```

4. **Response Containers**
   - Persona badge + name
   - Timestamp
   - Markdown-rendered response
   - Collapse/expand
   - "Copy" button per response
   - "Only show synthesis" toggle

5. **Status Indicators**
   - Which agents are active
   - Real-time progress (Agent 2/5)
   - Estimated time remaining
   - Stop button (cancel execution)

#### 4.2 HTML Structure Updates (1 hour)

**File**: `C:\Users\scoso\WEBSITES\Game Editor\index.html`

Add to AI panel:

```html
<!-- Mode Selection -->
<div class="multi-agent-controls">
  <button id="mode-single" class="mode-btn active">Single Agent</button>
  <button id="mode-panel" class="mode-btn">Panel Discussion</button>
  <button id="mode-debate" class="mode-btn">Debate</button>
  <button id="mode-consensus" class="mode-btn">Consensus</button>
</div>

<!-- Response Container -->
<div id="agent-responses" class="agent-responses">
  <!-- Dynamically populated -->
  <div class="agent-response">
    <div class="agent-header">
      <span class="agent-badge">Master Teacher 🧠</span>
      <span class="agent-time">10:30 AM</span>
    </div>
    <div class="agent-body">
      <!-- Markdown content -->
    </div>
  </div>
</div>

<!-- Synthesis Display -->
<div class="synthesis-section">
  <h3>The Consortium Says:</h3>
  <div class="synthesis-content">
    <!-- Final synthesis -->
  </div>
</div>
```

#### 4.3 JavaScript Integration (1 hour)

**Modify**: `C:\Users\scoso\WEBSITES\Game Editor\editor.js`

```javascript
// New functions to add:

// 1. Multi-agent mode handling
function toggleMultiAgentMode(enabled) {
  // Switch UI between single and multi-agent
  // Save preference to localStorage
}

// 2. Send multi-agent request
async function sendMultiAgentMessage(question, selectedPersonas, mode) {
  // Call POST /api/multi-agent
  // Handle streaming responses
  // Update UI in real-time
}

// 3. Handle streaming responses
function handleMultiAgentStream(reader) {
  // Parse JSON stream
  // Update UI for each event type
  // Show agent responses as they arrive
}

// 4. Display agent responses
function addAgentResponse(agent, response, timestamp) {
  // Create agent response container
  // Render markdown
  // Add to DOM
}

// 5. Display synthesis
function displaySynthesis(synthesisContent, metadata) {
  // Highlight final answer
  // Show execution stats
  // Add copy button
}
```

#### 4.4 CSS Styling (30 min)

**Modify**: `C:\Users\scoso\WEBSITES\Game Editor\style.css`

Add styles for:
- `.multi-agent-controls` - Mode selector buttons
- `.agent-response` - Individual agent response container
- `.agent-header` - Agent badge and timestamp
- `.agent-body` - Response content
- `.synthesis-section` - Final answer highlight
- `.agent-status` - Loading/thinking indicators
- `.mode-active` - Active mode button style

#### 4.5 Testing & Refinement (1-2 hours)

**Manual Testing Checklist**:

- [ ] Panel mode: All selected personas respond sequentially
- [ ] Debate mode: Back-and-forth exchanges work correctly
- [ ] Consensus mode: All agents respond, votes displayed
- [ ] Auto mode: Router correctly selects personas + mode
- [ ] Memory integration: Agents reference past conversations
- [ ] Error handling: Graceful fallback if persona fails
- [ ] Streaming: Responses appear in real-time
- [ ] Performance: Full discussion < 30 seconds
- [ ] UI: All components render correctly
- [ ] Switching modes: State resets appropriately
- [ ] Mobile: Responses stack properly
- [ ] Accessibility: Keyboard navigation works

**Performance Optimization**:
- Token limits per agent (avoid long-windedness)
- Parallel agent execution where possible
- Response caching for common questions
- Timeout for individual agents (prevent hanging)

---

## 📝 Detailed File Modifications

### File 1: `langgraph-agents.js` (NEW - 400-500 lines)

```javascript
// SECTION 1: Imports
import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import fs from "fs";
import path from "path";
import { AgentMemory } from "./agent-memory.js";

// SECTION 2: State Definition
const MultiAgentState = Annotation.Root({
  question: Annotation.String,
  selectedPersonas: Annotation.Array,
  mode: Annotation.String, // 'panel', 'debate', 'consensus', 'auto'
  personaResponses: Annotation.Array,
  synthesisResult: Annotation.String,
  executionMetadata: Annotation.Object
});

// SECTION 3: Agent Factory
function createPersonaAgent(personaName, memory = null) {
  // Load persona file
  // Create LLM client
  // Return async agent function
  // Integrate memory context
}

// SECTION 4: Router Agent
async function routerAgent(state) {
  // Analyze question
  // Select best personas for question type
  // Choose optimal interaction mode
  // Return updated state with recommendations
}

// SECTION 5: Orchestrator Agent
async function orchestratorAgent(state) {
  // Manage execution flow
  // Route to appropriate agents
  // Handle timeouts
  // Aggregate responses
}

// SECTION 6: Synthesizer Agent
async function synthesizerAgent(state) {
  // Read all persona responses
  // Generate coherent synthesis
  // Highlight key points and agreements
  // Return final answer
}

// SECTION 7: Moderator Agent (for debates)
async function moderatorAgent(state) {
  // Manage debate rounds
  // Request rebuttals
  // Keep discussion on track
  // Generate summary
}

// SECTION 8: Graph Builder
function buildMultiAgentGraph(allPersonas = []) {
  // Create StateGraph
  // Add all agent nodes
  // Define edges and routing logic
  // Compile and return
}

// SECTION 9: Execution Function
async function executeMultiAgentWorkflow(
  question,
  selectedPersonas = [],
  mode = "auto",
  conversationId = null
) {
  // Build graph if not cached
  // Prepare initial state
  // Execute with streaming
  // Return results
}

// SECTION 10: Exports
export {
  createPersonaAgent,
  buildMultiAgentGraph,
  executeMultiAgentWorkflow,
  MultiAgentState
};
```

### File 2: `netlify/functions/multi-agent.js` (NEW - 300-400 lines)

```javascript
// Multi-agent endpoint for Netlify Functions

import { executeMultiAgentWorkflow } from "../../langgraph-agents.js";

export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const {
      question,
      selectedPersonas = [],
      mode = "auto",
      conversationId = null,
      includeMemory = true
    } = JSON.parse(event.body);

    // Stream response
    const encoder = new TextEncoder();
    let { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    // Execute workflow and stream results
    (async () => {
      try {
        const result = await executeMultiAgentWorkflow(
          question,
          selectedPersonas,
          mode,
          conversationId,
          includeMemory
        );

        // Send events
        await writer.write(encoder.encode(`data: ${JSON.stringify(result)}\n\n`));
        await writer.close();
      } catch (error) {
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({ error: error.message })}\n\n`
          )
        );
        await writer.close();
      }
    })();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive"
      },
      body: readable
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
```

### File 3: `multi-agent-ui.js` (NEW - 200-300 lines)

```javascript
// Frontend multi-agent UI logic

class MultiAgentUI {
  constructor() {
    this.mode = "single"; // single, panel, debate, consensus
    this.selectedPersonas = [];
    this.isExecuting = false;
    this.currentStream = null;
    this.init();
  }

  init() {
    // Setup event listeners
    // Initialize controls
  }

  setMode(newMode) {
    // Update mode selection
    // Clear previous responses
    // Update UI
  }

  async executeMultiAgent(question) {
    // Validate inputs
    // Call /api/multi-agent
    // Handle streaming
  }

  handleStreamEvent(event) {
    // Parse event
    // Update UI based on type
  }

  addAgentResponse(agent, content, timestamp) {
    // Create response element
    // Render markdown
    // Add to container
  }

  displaySynthesis(content, metadata) {
    // Highlight final answer
    // Show stats
  }

  clearResponses() {
    // Clear all agent responses
  }
}

export const multiAgentUI = new MultiAgentUI();
```

---

## 🔄 Integration Points with Existing Code

### With `editor.js`

- Add `multiAgentMode` toggle to settings
- Create `sendMultiAgentMessage()` function
- Handle both single-agent and multi-agent responses
- Update message display to show agent source
- Integrate with memory system

### With `index.html`

- Add mode selector buttons to AI panel header
- Create agent response container
- Update settings modal with multi-agent options
- Add synthesis display section

### With `style.css`

- Style mode selector buttons
- Style agent response containers
- Highlight synthesis section
- Animation for agent responses arriving
- Responsive design for stacked responses

### With `agent-memory.js`

- Load memory for multiple agents
- Update memory for all participating agents
- Use memory context in agent system prompts

---

## 🎓 Key Decision Points

### Decision 1: Persona Selection Strategy

**Options**:
A. **Router decides** (AI analyzes question, auto-selects best personas)
B. **User selects** (Manual checkbox selection in UI)
C. **Presets** (Quick buttons for common combinations like "Game Design Council")

**Recommendation**: **A + C combo**
- Default: Router AI decides best personas for question type
- Option: Users can manually override with quick presets
- Advanced: Experts can manually select specific personas

### Decision 2: Response Display

**Options**:
A. **Sequential** (Show responses one at a time as they arrive)
B. **All at once** (Wait for all, show together)
C. **Hybrid** (Show synthesis prominently, collapse individual responses)

**Recommendation**: **Hybrid**
- Stream individual responses as they arrive (live feel)
- Keep synthesis floating at top
- Default: Show synthesis, individual responses collapsed
- Allow expand to see all details

### Decision 3: Memory Scope

**Options**:
A. **Per-conversation** (Memory resets each conversation)
B. **Per-session** (Memory within one browser session)
C. **Persistent** (Memory across browser sessions)

**Recommendation**: **C (Persistent)**
- Each persona learns across conversations
- Can reference previous discussions
- Builds relationship with user
- User can clear memory if desired

### Decision 4: Error Handling

**Options**:
A. **Fail fast** (One agent fails, whole thing fails)
B. **Partial success** (Some agents fail, continue with others)
C. **Graceful degradation** (Failed agents replaced with fallback persona)

**Recommendation**: **B + C**
- Try partial success first
- If too few agents respond (< 30%), use fallbacks
- Inform user which agents failed
- Allow retry

---

## ✅ Success Criteria

### Functional Requirements

- [ ] Router agent correctly identifies personas for question types
- [ ] All 12 personas can participate in multi-agent discussions
- [ ] Panel mode: Sequential responses from selected personas
- [ ] Debate mode: 3-round back-and-forth exchanges
- [ ] Consensus mode: Parallel responses with voting/scoring
- [ ] Synthesizer combines perspectives into coherent answer
- [ ] Memory system integrates with multi-agent workflow
- [ ] Responses stream in real-time to UI

### Performance Requirements

- [ ] Individual agent response time: < 15 seconds
- [ ] Full panel discussion (3 agents): < 30 seconds
- [ ] Debate round: < 45 seconds
- [ ] Token usage: Optimized to prevent API limits

### UX Requirements

- [ ] Mode switching is intuitive
- [ ] Users see which agent is responding
- [ ] Clear visual hierarchy (synthesis prominent)
- [ ] Can collapse/expand individual responses
- [ ] Copy button for each response
- [ ] Works on mobile (responsive)
- [ ] No console errors
- [ ] Fallback if JS disabled

### Code Quality Requirements

- [ ] LangGraph integration is clean and maintainable
- [ ] State management is clear and trackable
- [ ] Error handling is comprehensive
- [ ] Comments explain complex logic
- [ ] No memory leaks
- [ ] Follows existing code style

---

## 📅 Timeline & Milestones

**Sprint 1** (4 hours): Foundation & Agent Wrapper
- Day 1 morning: Install deps, start agent wrapper
- Day 1 afternoon: Complete agent wrapper, test basic agents

**Sprint 2** (4 hours): Orchestration Logic  
- Day 2 morning: Router & Orchestrator agents
- Day 2 afternoon: Synthesizer & Moderator agents

**Sprint 3** (3 hours): Backend Integration
- Day 3 morning: Multi-agent endpoint
- Day 3 early afternoon: Memory integration, testing

**Sprint 4** (4-5 hours): Frontend & Polish
- Day 3 afternoon/evening: UI components
- Day 4 morning: HTML/CSS updates
- Day 4 afternoon: Testing & refinement

**Total**: 12-16 hours over 2-3 days of development

---

## 🚀 Starting Phase 2

Ready to begin? Let's start with **Sprint 1**:

1. Install LangGraph dependencies
2. Create `langgraph-agents.js` framework
3. Test basic agent creation
4. Build Router and Orchestrator shells

**Proceed?** → Ready to start Sprint 1!
