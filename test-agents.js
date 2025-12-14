/**
 * Quick test for langgraph-agents.js
 * Run with: node test-agents.js
 */

import dotenv from "dotenv";
dotenv.config();

import { executeMultiAgentWorkflow, allPersonas, getPersonaInfo } from "./langgraph-agents.js";

async function runTest() {
  console.log("🚀 Testing LangGraph Multi-Agent System\n");
  console.log("Available personas:", allPersonas.length);
  allPersonas.forEach((persona) => {
    const info = getPersonaInfo(persona);
    console.log(`  ${info.icon} ${info.name} (${info.category})`);
  });

  console.log("\n📝 Test Question:");
  const testQuestion = "What are the best practices for optimizing collision detection in game engines?";
  console.log(`"${testQuestion}"\n`);

  console.log("🔄 Executing panel discussion...\n");

  try {
    const result = await executeMultiAgentWorkflow(
      testQuestion,
      [], // Empty = router decides
      "panel",
      null,
      false
    );

    if (result.success) {
      console.log(`✅ SUCCESS!\n`);
      console.log(`Mode: ${result.mode}`);
      console.log(`Personas: ${result.selectedPersonas.join(", ")}`);
      console.log(`Execution Time: ${result.metadata.executionTime}`);
      console.log(`Agents Executed: ${result.metadata.agentsExecuted.join(", ")}`);

      console.log("\n" + "=".repeat(70));
      console.log("INDIVIDUAL RESPONSES");
      console.log("=".repeat(70) + "\n");

      result.personaResponses.forEach((response) => {
        console.log(
          `${response.personaInfo.icon} ${response.personaInfo.name}:`
        );
        console.log(response.response);
        console.log();
      });

      console.log("=".repeat(70));
      console.log("SYNTHESIS");
      console.log("=".repeat(70) + "\n");
      console.log(result.synthesis);
    } else {
      console.log(`❌ FAILED: ${result.error}`);
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

runTest();
