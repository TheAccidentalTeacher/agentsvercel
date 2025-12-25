-- ============================================================================
-- AUTONOMOUS TASKS TABLE
-- Phase 12: Autonomous Agents - Task Queue & Scheduling System
-- ============================================================================

-- Create autonomous_tasks table for scheduled and background agent workflows
CREATE TABLE IF NOT EXISTS autonomous_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Task Configuration
  task_type TEXT NOT NULL CHECK (task_type IN ('research', 'workflow', 'monitor', 'scheduled_query')),
  task_name TEXT NOT NULL, -- User-friendly name like "Daily theology research"
  task_description TEXT, -- Optional detailed description
  
  -- Task Payload (flexible JSON for different task types)
  config JSONB NOT NULL, -- Contains query, workflow steps, search params, etc.
  
  -- Scheduling
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('once', 'hourly', 'daily', 'weekly', 'custom')),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL, -- When to execute
  cron_expression TEXT, -- For custom schedules (future enhancement)
  
  -- Execution Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled', 'paused')),
  
  -- Timing Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Execution Progress (for multi-step workflows)
  progress JSONB DEFAULT '{"currentStep": 0, "totalSteps": 0, "message": "Waiting to start..."}',
  
  -- Results
  result_data JSONB, -- Final output from task execution
  error_message TEXT, -- If failed, store error details
  
  -- Safety Limits
  max_execution_time_seconds INTEGER DEFAULT 1800, -- 30 minutes default
  max_cost_usd DECIMAL(10, 2) DEFAULT 5.00, -- $5 default limit
  
  -- Repeat Configuration (for recurring tasks)
  repeat_enabled BOOLEAN DEFAULT FALSE,
  repeat_count INTEGER DEFAULT 0, -- How many times has it repeated
  repeat_max INTEGER, -- Max repetitions (NULL = infinite)
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================

-- Index for finding user's tasks
CREATE INDEX IF NOT EXISTS idx_autonomous_tasks_user_id 
  ON autonomous_tasks(user_id);

-- Index for finding tasks by status
CREATE INDEX IF NOT EXISTS idx_autonomous_tasks_status 
  ON autonomous_tasks(status);

-- Index for scheduler to find pending tasks due to run
CREATE INDEX IF NOT EXISTS idx_autonomous_tasks_scheduled 
  ON autonomous_tasks(scheduled_for, status) 
  WHERE status = 'pending';

-- Index for finding next recurring tasks
CREATE INDEX IF NOT EXISTS idx_autonomous_tasks_next_run 
  ON autonomous_tasks(next_run_at, repeat_enabled) 
  WHERE repeat_enabled = TRUE;

-- Composite index for user task dashboard queries
CREATE INDEX IF NOT EXISTS idx_autonomous_tasks_user_status_created 
  ON autonomous_tasks(user_id, status, created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE autonomous_tasks ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tasks
CREATE POLICY autonomous_tasks_select_policy ON autonomous_tasks
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own tasks
CREATE POLICY autonomous_tasks_insert_policy ON autonomous_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own tasks
CREATE POLICY autonomous_tasks_update_policy ON autonomous_tasks
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own tasks
CREATE POLICY autonomous_tasks_delete_policy ON autonomous_tasks
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_autonomous_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_autonomous_tasks_updated_at
  BEFORE UPDATE ON autonomous_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_autonomous_tasks_updated_at();

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View for active tasks (pending, running, paused)
CREATE OR REPLACE VIEW autonomous_tasks_active AS
SELECT *
FROM autonomous_tasks
WHERE status IN ('pending', 'running', 'paused')
ORDER BY scheduled_for ASC;

-- View for completed tasks (last 30 days)
CREATE OR REPLACE VIEW autonomous_tasks_recent_completed AS
SELECT *
FROM autonomous_tasks
WHERE status IN ('completed', 'failed', 'cancelled')
  AND updated_at > NOW() - INTERVAL '30 days'
ORDER BY updated_at DESC;

-- ============================================================================
-- EXAMPLE DATA (for testing)
-- ============================================================================

-- Example: One-time research task scheduled for tonight
-- INSERT INTO autonomous_tasks (user_id, task_type, task_name, config, schedule_type, scheduled_for)
-- VALUES (
--   auth.uid(),
--   'research',
--   'Research Puritan theology updates',
--   '{"query": "Puritan theology Reformed 2025", "maxSources": 20, "saveToMemory": true}'::jsonb,
--   'once',
--   CURRENT_TIMESTAMP + INTERVAL '8 hours'
-- );

-- Example: Daily monitoring task
-- INSERT INTO autonomous_tasks (user_id, task_type, task_name, config, schedule_type, scheduled_for, repeat_enabled, next_run_at)
-- VALUES (
--   auth.uid(),
--   'monitor',
--   'Daily theology research digest',
--   '{"query": "Reformed theology classical education", "sources": ["arxiv", "scholar"], "alertOnNewFindings": true}'::jsonb,
--   'daily',
--   CURRENT_TIMESTAMP + INTERVAL '1 day',
--   TRUE,
--   CURRENT_TIMESTAMP + INTERVAL '1 day'
-- );

-- ============================================================================
-- NOTES
-- ============================================================================

-- Task Types:
-- - 'research': Deep research with SerpAPI/Tavily/ArXiv/Scholar
-- - 'workflow': Multi-step agent workflow (Research → Analyze → Create)
-- - 'monitor': Background monitoring for new content/changes
-- - 'scheduled_query': Run saved query on schedule

-- Schedule Types:
-- - 'once': Run one time at scheduled_for
-- - 'hourly': Repeat every hour
-- - 'daily': Repeat every 24 hours
-- - 'weekly': Repeat every 7 days
-- - 'custom': Use cron_expression for complex schedules

-- Config Examples:
-- Research: {"query": "topic", "maxSources": 20, "saveToMemory": true}
-- Workflow: {"steps": [{"agent": "Researcher", "action": "search"}, ...]}
-- Monitor: {"url": "...", "checkInterval": "daily", "alertOn": "changes"}

-- Progress Format:
-- {"currentStep": 2, "totalSteps": 5, "message": "Analyzing results...", "percentComplete": 40}
