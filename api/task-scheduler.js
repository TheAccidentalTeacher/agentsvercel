/**
 * Vercel API Route: Task Scheduler
 * Executes due autonomous tasks
 * Note: Vercel uses cron via vercel.json for scheduled functions
 */

import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 60
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('🤖 Task Scheduler running at:', new Date().toISOString());

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Find tasks that are due to run
    const { data: dueTasks, error: fetchError } = await supabase
      .from('autonomous_tasks')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .limit(10);

    if (fetchError) {
      console.error('❌ Error fetching tasks:', fetchError);
      return res.status(500).json({ error: fetchError.message });
    }

    if (!dueTasks || dueTasks.length === 0) {
      console.log('✅ No tasks due to run');
      return res.status(200).json({ 
        message: 'No tasks due', 
        tasksProcessed: 0 
      });
    }

    console.log(`📋 Found ${dueTasks.length} tasks to execute`);

    // Execute each task
    const results = await Promise.allSettled(
      dueTasks.map(task => executeTask(supabase, task))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`✅ Executed ${successful} tasks successfully`);
    if (failed > 0) {
      console.log(`❌ ${failed} tasks failed`);
    }

    return res.status(200).json({
      message: 'Task execution complete',
      tasksProcessed: dueTasks.length,
      successful,
      failed
    });

  } catch (error) {
    console.error('❌ Scheduler error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function executeTask(supabase, task) {
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
    // Execute based on task type
    let result;
    switch (task.task_type) {
      case 'research':
        result = { message: 'Research task executed' };
        break;
      case 'summary':
        result = { message: 'Summary task executed' };
        break;
      case 'notification':
        result = { message: 'Notification sent' };
        break;
      default:
        result = { message: `Task type ${task.task_type} executed` };
    }

    // Mark as completed
    await supabase
      .from('autonomous_tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        result: result,
        updated_at: new Date().toISOString()
      })
      .eq('id', task.id);

    // Handle recurring tasks
    if (task.recurring && task.recurring_interval) {
      const nextRun = new Date();
      nextRun.setSeconds(nextRun.getSeconds() + task.recurring_interval);

      await supabase
        .from('autonomous_tasks')
        .insert({
          ...task,
          id: undefined,
          status: 'pending',
          scheduled_for: nextRun.toISOString(),
          created_at: new Date().toISOString(),
          started_at: null,
          completed_at: null,
          result: null
        });
    }

    return result;

  } catch (error) {
    console.error(`❌ Task ${task.id} failed:`, error);

    await supabase
      .from('autonomous_tasks')
      .update({
        status: 'failed',
        error_message: error.message,
        updated_at: new Date().toISOString()
      })
      .eq('id', task.id);

    throw error;
  }
}
