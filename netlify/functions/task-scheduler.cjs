// ============================================================================
// TASK SCHEDULER - Netlify Scheduled Function
// Runs every 15 minutes to execute due autonomous tasks
// Configure in netlify.toml: [functions."task-scheduler"].schedule = "*/15 * * * *"
// ============================================================================

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role to bypass RLS
);

// ============================================================================
// MAIN HANDLER
// ============================================================================

exports.handler = async (event, context) => {
  console.log('🤖 Task Scheduler running at:', new Date().toISOString());

  try {
    // Find tasks that are due to run
    const { data: dueTasks, error: fetchError } = await supabase
      .from('autonomous_tasks')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .limit(10); // Process max 10 tasks per run

    if (fetchError) {
      console.error('❌ Error fetching tasks:', fetchError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: fetchError.message })
      };
    }

    if (!dueTasks || dueTasks.length === 0) {
      console.log('✅ No tasks due to run');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No tasks due', tasksProcessed: 0 })
      };
    }

    console.log(`📋 Found ${dueTasks.length} tasks to execute`);

    // Execute each task
    const results = await Promise.allSettled(
      dueTasks.map(task => executeTask(task))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`✅ Executed ${successful} tasks successfully`);
    if (failed > 0) {
      console.log(`❌ ${failed} tasks failed`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Task execution complete',
        tasksProcessed: dueTasks.length,
        successful,
        failed
      })
    };

  } catch (error) {
    console.error('❌ Scheduler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// ============================================================================
// TASK EXECUTION
// ============================================================================

async function executeTask(task) {
  console.log(`🚀 Executing task ${task.id}: ${task.task_name}`);

  // Update status to running
  await supabase
    .from('autonomous_tasks')
    .update({
      status: 'running',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', task.id);

  try {
    let result;

    // Execute based on task type
    switch (task.task_type) {
      case 'research':
        result = await executeResearchTask(task);
        break;
      case 'workflow':
        result = await executeWorkflowTask(task);
        break;
      case 'monitor':
        result = await executeMonitorTask(task);
        break;
      case 'scheduled_query':
        result = await executeScheduledQuery(task);
        break;
      default:
        throw new Error(`Unknown task type: ${task.task_type}`);
    }

    // Update as completed
    await supabase
      .from('autonomous_tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        result_data: result,
        progress: {
          currentStep: 1,
          totalSteps: 1,
          percentComplete: 100,
          message: 'Completed successfully'
        }
      })
      .eq('id', task.id);

    // Handle recurring tasks
    if (task.repeat_enabled) {
      await scheduleNextRun(task);
    }

    console.log(`✅ Task ${task.id} completed successfully`);
    return result;

  } catch (error) {
    console.error(`❌ Task ${task.id} failed:`, error);

    // Update as failed
    await supabase
      .from('autonomous_tasks')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        error_message: error.message
      })
      .eq('id', task.id);

    throw error;
  }
}

// ============================================================================
// TASK TYPE EXECUTORS
// ============================================================================

async function executeResearchTask(task) {
  console.log('🔍 Running research task:', task.config.query);

  const config = task.config;

  // Call deep search API
  const searchResponse = await fetch(`${process.env.NETLIFY_DEV ? 'http://localhost:8888' : process.env.URL}/.netlify/functions/deep-search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: config.query,
      maxResults: config.maxSources || 20,
      sources: config.sources || ['serpapi', 'tavily', 'arxiv', 'scholar']
    })
  });

  if (!searchResponse.ok) {
    throw new Error(`Research failed: ${searchResponse.statusText}`);
  }

  const searchResults = await searchResponse.json();

  // Save to memory if configured
  if (config.saveToMemory) {
    await saveResultsToMemory(task, searchResults);
  }

  return {
    type: 'research',
    query: config.query,
    sourcesSearched: config.maxSources,
    resultsFound: searchResults.results?.length || 0,
    savedToMemory: config.saveToMemory,
    timestamp: new Date().toISOString()
  };
}

async function executeWorkflowTask(task) {
  console.log('⚙️ Running workflow task:', task.task_name);

  const config = task.config;
  const steps = config.steps || [];

  const workflowResults = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    
    // Update progress
    await supabase
      .from('autonomous_tasks')
      .update({
        progress: {
          currentStep: i + 1,
          totalSteps: steps.length,
          percentComplete: Math.round(((i + 1) / steps.length) * 100),
          message: `Executing step ${i + 1}: ${step.action || step.agent}`
        }
      })
      .eq('id', task.id);

    // Execute step
    const stepResult = await executeWorkflowStep(step, workflowResults);
    workflowResults.push(stepResult);
  }

  return {
    type: 'workflow',
    stepsCompleted: steps.length,
    results: workflowResults,
    timestamp: new Date().toISOString()
  };
}

async function executeWorkflowStep(step, previousResults) {
  // Workflow step execution will be implemented in Phase 2
  console.log('Executing workflow step:', step);
  
  return {
    step: step.action || step.agent,
    status: 'simulated',
    message: 'Workflow orchestration coming in Phase 2'
  };
}

async function executeMonitorTask(task) {
  console.log('👁️ Running monitor task:', task.task_name);

  const config = task.config;

  // Monitoring implementation will be in Phase 4
  return {
    type: 'monitor',
    target: config.url || config.query,
    changesDetected: false,
    message: 'Monitoring implementation coming in Phase 4',
    timestamp: new Date().toISOString()
  };
}

async function executeScheduledQuery(task) {
  console.log('📅 Running scheduled query:', task.task_name);

  const config = task.config;

  // Execute the saved query
  const chatResponse = await fetch(`${process.env.NETLIFY_DEV ? 'http://localhost:8888' : process.env.URL}/.netlify/functions/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: config.query }],
      model: config.model || 'claude-3-5-sonnet-20241022'
    })
  });

  if (!chatResponse.ok) {
    throw new Error(`Query failed: ${chatResponse.statusText}`);
  }

  const queryResults = await chatResponse.json();

  // Save to memory if configured
  if (config.saveToMemory) {
    await saveResultsToMemory(task, queryResults);
  }

  return {
    type: 'scheduled_query',
    query: config.query,
    savedToMemory: config.saveToMemory,
    timestamp: new Date().toISOString()
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function saveResultsToMemory(task, results) {
  try {
    const memoryContent = `
# Autonomous Task Results: ${task.task_name}

**Task ID:** ${task.id}
**Executed:** ${new Date().toISOString()}
**Type:** ${task.task_type}

## Configuration
${JSON.stringify(task.config, null, 2)}

## Results
${JSON.stringify(results, null, 2)}
    `.trim();

    const { data: { user } } = await supabase.auth.admin.getUserById(task.user_id);

    await supabase
      .from('memories')
      .insert({
        user_id: task.user_id,
        title: `[Autonomous] ${task.task_name}`,
        content: memoryContent,
        category: 'autonomous_task_results',
        tags: ['autonomous', task.task_type, 'scheduled']
      });

    console.log('✅ Results saved to memory');
  } catch (error) {
    console.error('❌ Failed to save to memory:', error);
    // Don't throw - memory save failure shouldn't fail the task
  }
}

async function scheduleNextRun(task) {
  try {
    let nextRunTime = new Date();

    switch (task.schedule_type) {
      case 'hourly':
        nextRunTime.setHours(nextRunTime.getHours() + 1);
        break;
      case 'daily':
        nextRunTime.setDate(nextRunTime.getDate() + 1);
        break;
      case 'weekly':
        nextRunTime.setDate(nextRunTime.getDate() + 7);
        break;
      default:
        console.log('Unknown schedule type, not rescheduling');
        return;
    }

    // Check if we've hit max repetitions
    const newRepeatCount = (task.repeat_count || 0) + 1;
    if (task.repeat_max && newRepeatCount >= task.repeat_max) {
      console.log(`Task ${task.id} reached max repetitions (${task.repeat_max})`);
      return;
    }

    // Create new task for next run
    await supabase
      .from('autonomous_tasks')
      .insert({
        user_id: task.user_id,
        task_type: task.task_type,
        task_name: task.task_name,
        task_description: task.task_description,
        config: task.config,
        schedule_type: task.schedule_type,
        scheduled_for: nextRunTime.toISOString(),
        repeat_enabled: true,
        repeat_count: newRepeatCount,
        repeat_max: task.repeat_max,
        status: 'pending'
      });

    console.log(`✅ Task ${task.id} rescheduled for ${nextRunTime.toISOString()}`);
  } catch (error) {
    console.error('❌ Failed to schedule next run:', error);
  }
}
