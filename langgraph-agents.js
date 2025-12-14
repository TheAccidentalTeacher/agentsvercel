/**
 * LangGraph.js Multi-Agent Orchestration System
 * 
 * Manages collaborative discussions between 12 expert personas
 * Modes: Panel Discussion, Debate, Consensus
 * 
 * Dependencies: @langchain/langgraph, @langchain/core, @langchain/anthropic
 */

import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { AgentMemory } from "./agent-memory.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================================
// SECTION 1: State Definition
// ============================================================================

export const MultiAgentState = Annotation.Root({
  question: Annotation({
    value: (x, y) => y || x,
    default: () => ""
  }),
  selectedPersonas: Annotation({
    value: (x, y) => y || x,
    default: () => []
  }),
  mode: Annotation({
    value: (x, y) => y || x,
    default: () => "auto"
  }),
  personaResponses: Annotation({
    value: (x, y) => [...(x || []), ...(y || [])],
    default: () => []
  }),
  synthesisResult: Annotation({
    value: (x, y) => y || x,
    default: () => ""
  }),
  routerDecision: Annotation({
    value: (x, y) => y || x,
    default: () => {}
  }),
  debateRound: Annotation({
    value: (x, y) => (y !== undefined ? y : x),
    default: () => 0
  }),
  executionMetadata: Annotation({
    value: (x, y) => ({ ...(x || {}), ...(y || {}) }),
    default: () => ({
      startTime: new Date(),
      totalTokens: 0,
      agentsExecuted: []
    })
  })
});

// ============================================================================
// SECTION 2: Persona Loading & Caching
// ============================================================================

const personaCache = new Map();
export const allPersonas = [
  "master-teacher",
  "technical-architect",
  "strategist",
  "theologian",
  "writer",
  "analyst",
  "debugger",
  "classical-educator",
  "gen-alpha-expert",
  "ux-designer",
  "marketing-strategist",
  "game-designer"
];

/**
 * Load persona markdown file and cache it
 */
export function loadPersonaContent(personaName) {
  if (personaCache.has(personaName)) {
    return personaCache.get(personaName);
  }

  try {
    const filePath = path.join(__dirname, "personas", `${personaName}.md`);
    const content = fs.readFileSync(filePath, "utf-8");
    personaCache.set(personaName, content);
    return content;
  } catch (error) {
    console.warn(`Failed to load persona ${personaName}:`, error.message);
    // Return default persona if file not found
    return `# ${personaName}
    
You are an expert advisor with deep knowledge and wisdom. Provide thoughtful, 
well-reasoned responses to questions asked by the user.`;
  }
}

/**
 * Get persona display info (name, category, icon)
 */
export function getPersonaInfo(personaName) {
  const personaMap = {
    "master-teacher": { name: "Master Teacher", category: "Core Council", icon: "🧠" },
    "technical-architect": { name: "Technical Architect", category: "Specialists", icon: "🏗️" },
    strategist: { name: "Strategist", category: "Core Council", icon: "🎯" },
    theologian: { name: "Theologian", category: "Core Council", icon: "⛪" },
    writer: { name: "Writer", category: "Specialists", icon: "✍️" },
    analyst: { name: "Analyst", category: "Specialists", icon: "📊" },
    debugger: { name: "Debugger", category: "Specialists", icon: "🐛" },
    "classical-educator": { name: "Classical Educator", category: "Core Council", icon: "📚" },
    "gen-alpha-expert": { name: "Gen-Alpha Expert", category: "Specialists", icon: "🌐" },
    "ux-designer": { name: "UX Designer", category: "Specialists", icon: "🎨" },
    "marketing-strategist": { name: "Marketing Strategist", category: "Specialists", icon: "📢" },
    "game-designer": { name: "Game Designer", category: "Specialists", icon: "🎮" }
  };

  return personaMap[personaName] || {
    name: personaName,
    category: "General",
    icon: "👤"
  };
}

// ============================================================================
// SECTION 3: LLM Model Selection
// ============================================================================

/**
 * Create appropriate LLM client based on model preference
 */
function createLLMClient(model = "gpt-4o") {
  if (model.startsWith("gpt")) {
    return new ChatOpenAI({
      model: model,
      temperature: 0.7,
      maxTokens: 500
    });
  }

  // Default to Anthropic Claude
  return new ChatAnthropic({
    model: model,
    temperature: 0.7,
    maxTokens: 500
  });
}

// ============================================================================
// SECTION 4: Agent Factory
// ============================================================================

/**
 * Create a persona agent node function
 */
export function createPersonaAgent(
  personaName,
  model = "gpt-4o",
  memory = null
) {
  const personaContent = loadPersonaContent(personaName);
  const personaInfo = getPersonaInfo(personaName);
  const llm = createLLMClient(model);

  return async (state) => {
    try {
      let memoryContext = "";
      if (memory) {
        const recentContext = memory.getRecentContext(5);
        memoryContext = `\n## Your Memory\n${recentContext}`;
      }

      // Build system prompt
      const systemPrompt = `${personaContent}${memoryContext}

You are participating in a discussion with other expert personas. 
Keep your response focused (2-3 paragraphs max).
Reference specific expertise from your background.`;

      // Get response from LLM
      const response = await llm.invoke([
        { role: "system", content: systemPrompt },
        { role: "user", content: state.question }
      ]);

      const responseText =
        response.content && typeof response.content === "string"
          ? response.content
          : response.text || "";

      // Add to responses
      const newResponse = {
        persona: personaName,
        personaInfo: personaInfo,
        response: responseText,
        timestamp: new Date().toISOString()
      };

      // Update memory if available
      if (memory) {
        memory.addInteraction("assistant", responseText);
      }

      return {
        personaResponses: [newResponse],
        executionMetadata: {
          agentsExecuted: [...(state.executionMetadata?.agentsExecuted || []), personaName]
        }
      };
    } catch (error) {
      console.error(`Error in ${personaName} agent:`, error);
      throw error;
    }
  };
}

// ============================================================================
// SECTION 5: Router Agent
// ============================================================================

/**
 * Router analyzes question and decides:
 * - Which personas should respond
 * - Which interaction mode is best
 */
export async function routerAgent(state) {
  const llm = createLLMClient("gpt-4o");

  const personas = allPersonas
    .map((p) => getPersonaInfo(p))
    .map((p) => `- ${p.icon} ${p.name} (${p.category})`)
    .join("\n");

  const routingPrompt = `Analyze this question and decide:
1. Which 2-4 expert personas should respond
2. What discussion mode is best: 'panel' (sequential), 'debate' (back-and-forth), or 'consensus' (parallel voting)

Available personas:
${personas}

Question: "${state.question}"

Respond in JSON format:
{
  "selectedPersonas": ["persona-name-1", "persona-name-2"],
  "mode": "panel|debate|consensus",
  "reasoning": "brief explanation"
}`;

  try {
    const response = await llm.invoke([
      { role: "user", content: routingPrompt }
    ]);

    const text = response.content || response.text || "{}";
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const decision = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      selectedPersonas: allPersonas.slice(0, 3),
      mode: "panel",
      reasoning: "Default selection"
    };

    return {
      routerDecision: decision,
      selectedPersonas: decision.selectedPersonas,
      mode: decision.mode
    };
  } catch (error) {
    console.error("Router agent error:", error);
    return {
      routerDecision: { reasoning: "Router failed, using defaults" },
      selectedPersonas: allPersonas.slice(0, 3),
      mode: "panel"
    };
  }
}

// ============================================================================
// SECTION 6: Synthesizer Agent
// ============================================================================

/**
 * Synthesizer combines multiple persona responses into coherent answer
 */
export async function synthesizerAgent(state) {
  const llm = createLLMClient("gpt-4o");

  const personaResponses = state.personaResponses
    .map(
      (r) =>
        `**${r.personaInfo.icon} ${r.personaInfo.name}:**\n${r.response}`
    )
    .join("\n\n---\n\n");

  const synthesisPrompt = `You are synthesizing perspectives from multiple expert advisors.

Original Question: "${state.question}"

Individual Perspectives:
${personaResponses}

Create a unified synthesis that:
1. Highlights key agreements
2. Acknowledges valuable disagreements
3. Provides actionable guidance
4. Maintains the Consortium voice (collaborative, expert, welcoming)
5. Cites which experts contributed each insight

Format with clear sections and emphasis on most important points.`;

  try {
    const response = await llm.invoke([
      { role: "user", content: synthesisPrompt }
    ]);

    const text = response.content || response.text || "";
    return { synthesisResult: text };
  } catch (error) {
    console.error("Synthesizer agent error:", error);
    return {
      synthesisResult: "Unable to synthesize responses. Please review individual responses above."
    };
  }
}

// ============================================================================
// SECTION 7: Moderator Agent (for debates)
// ============================================================================

/**
 * Moderator facilitates debate between personas
 */
export async function moderatorAgent(
  state,
  persona1,
  persona2,
  round = 1
) {
  const maxRounds = 3;
  if (round > maxRounds) {
    return {
      debateRound: round,
      personaResponses: [
        {
          persona: "moderator",
          personaInfo: { name: "Moderator", icon: "🎤" },
          response: "The debate has concluded. See the synthesis for a final summary.",
          timestamp: new Date().toISOString()
        }
      ]
    };
  }

  const llm = createLLMClient("gpt-4o");
  const getInfo = (name) => getPersonaInfo(name);

  const debatePrompt = `Continue the debate for Round ${round}/${maxRounds}.

Original question: "${state.question}"

You are facilitating a discussion between:
- ${getInfo(persona1).icon} ${getInfo(persona1).name}
- ${getInfo(persona2).icon} ${getInfo(persona2).name}

Ask a probing question that pushes both sides to strengthen their arguments.
Keep it brief and focused.`;

  try {
    const response = await llm.invoke([
      { role: "user", content: debatePrompt }
    ]);

    const text = response.content || response.text || "";
    return {
      debateRound: round,
      personaResponses: [
        {
          persona: "moderator",
          personaInfo: { name: "Moderator", icon: "🎤" },
          response: text,
          timestamp: new Date().toISOString()
        }
      ]
    };
  } catch (error) {
    console.error("Moderator agent error:", error);
    return {
      debateRound: round,
      personaResponses: [
        {
          persona: "moderator",
          personaInfo: { name: "Moderator", icon: "🎤" },
          response: "Moving to next round...",
          timestamp: new Date().toISOString()
        }
      ]
    };
  }
}

// ============================================================================
// SECTION 8: Graph Builders
// ============================================================================

/**
 * Build panel discussion workflow
 */
export function buildPanelGraph(selectedPersonas) {
  const workflow = new StateGraph(MultiAgentState);

  // Add router node
  workflow.addNode("router", routerAgent);

  // Add persona nodes
  selectedPersonas.forEach((persona) => {
    workflow.addNode(persona, createPersonaAgent(persona));
  });

  // Add synthesizer
  workflow.addNode("synthesizer", synthesizerAgent);

  // Define edges
  workflow.addEdge(START, "router");

  // Router to personas (sequential)
  selectedPersonas.forEach((persona, index) => {
    if (index === 0) {
      workflow.addEdge("router", persona);
    } else {
      workflow.addEdge(selectedPersonas[index - 1], persona);
    }
  });

  // Last persona to synthesizer
  workflow.addEdge(selectedPersonas[selectedPersonas.length - 1], "synthesizer");
  workflow.addEdge("synthesizer", END);

  return workflow.compile();
}

/**
 * Build consensus discussion workflow
 */
export function buildConsensusGraph(selectedPersonas) {
  const workflow = new StateGraph(MultiAgentState);

  // Add router
  workflow.addNode("router", routerAgent);

  // Add personas (parallel execution)
  selectedPersonas.forEach((persona) => {
    workflow.addNode(persona, createPersonaAgent(persona));
  });

  // Add synthesizer
  workflow.addNode("synthesizer", synthesizerAgent);

  // Define edges
  workflow.addEdge(START, "router");
  selectedPersonas.forEach((persona) => {
    workflow.addEdge("router", persona);
  });

  // All personas to synthesizer
  selectedPersonas.forEach((persona) => {
    workflow.addEdge(persona, "synthesizer");
  });

  workflow.addEdge("synthesizer", END);

  return workflow.compile();
}

/**
 * Build debate workflow
 */
export function buildDebateGraph(personaA, personaB) {
  const workflow = new StateGraph(MultiAgentState);

  workflow.addNode("router", routerAgent);
  workflow.addNode(personaA, createPersonaAgent(personaA));
  workflow.addNode(personaB, createPersonaAgent(personaB));
  workflow.addNode("synthesizer", synthesizerAgent);

  workflow.addEdge(START, "router");
  workflow.addEdge("router", personaA);
  workflow.addEdge(personaA, personaB);
  workflow.addEdge(personaB, "synthesizer");
  workflow.addEdge("synthesizer", END);

  return workflow.compile();
}

// ============================================================================
// SECTION 9: Main Execution Function
// ============================================================================

/**
 * Execute multi-agent workflow
 */
export async function executeMultiAgentWorkflow(
  question,
  selectedPersonas = [],
  mode = "auto",
  conversationId = null,
  includeMemory = true
) {
  const startTime = new Date();

  try {
    // If no personas selected or mode is auto, use router to decide
    let actualPersonas = selectedPersonas;
    let actualMode = mode;

    if (actualPersonas.length === 0 || actualMode === "auto") {
      const initialState = {
        question: question,
        selectedPersonas: [],
        mode: "auto",
        personaResponses: [],
        synthesisResult: "",
        routerDecision: {},
        debateRound: 0,
        executionMetadata: {
          startTime: startTime,
          totalTokens: 0,
          agentsExecuted: []
        }
      };

      const routerResult = await routerAgent(initialState);
      actualPersonas = routerResult.selectedPersonas;
      actualMode = routerResult.mode;
    }

    // Create appropriate graph based on mode
    let graph;
    if (actualMode === "debate" && actualPersonas.length >= 2) {
      graph = buildDebateGraph(actualPersonas[0], actualPersonas[1]);
    } else if (actualMode === "consensus") {
      graph = buildConsensusGraph(actualPersonas);
    } else {
      graph = buildPanelGraph(actualPersonas);
    }

    // Prepare initial state
    const initialState = {
      question: question,
      selectedPersonas: actualPersonas,
      mode: actualMode,
      personaResponses: [],
      synthesisResult: "",
      routerDecision: {},
      debateRound: 0,
      executionMetadata: {
        startTime: startTime,
        totalTokens: 0,
        agentsExecuted: []
      }
    };

    // Execute graph
    const result = await graph.invoke(initialState);

    // Calculate execution time
    const endTime = new Date();
    const executionTime = (endTime - startTime) / 1000;

    return {
      success: true,
      question: question,
      mode: actualMode,
      selectedPersonas: actualPersonas,
      personaResponses: result.personaResponses,
      synthesis: result.synthesisResult,
      metadata: {
        executionTime: `${executionTime.toFixed(2)}s`,
        agentsExecuted: result.executionMetadata.agentsExecuted,
        timestamp: endTime.toISOString()
      }
    };
  } catch (error) {
    console.error("Multi-agent workflow error:", error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// ============================================================================
// SECTION 10: Additional Notes
// ============================================================================

// All main functions are exported inline above:
// - export const MultiAgentState
// - export const allPersonas
// - export function loadPersonaContent()
// - export function getPersonaInfo()
// - export function createPersonaAgent()
// - export async function routerAgent()
// - export async function synthesizerAgent()
// - export async function moderatorAgent()
// - export function buildPanelGraph()
// - export function buildConsensusGraph()
// - export function buildDebateGraph()
// - export async function executeMultiAgentWorkflow()
