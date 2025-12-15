-- ============================================================================
-- UCAS Research Engine - Supabase Database Schema
-- Phase 7: Cloud Sync & Multi-Device Access
-- ============================================================================
-- 
-- This schema creates:
-- 1. research_sessions table (store all research with RLS security)
-- 2. user_preferences table (user settings)
-- 3. Indexes for performance
-- 4. Row-Level Security policies
-- 5. Auto-update triggers
--
-- Run this in your Supabase SQL Editor:
-- 1. Go to https://app.supabase.com
-- 2. Select your project
-- 3. Click "SQL Editor" in left sidebar
-- 4. Create new query
-- 5. Paste this entire file
-- 6. Click "Run" (or press Cmd/Ctrl + Enter)
-- ============================================================================

-- ============================================================================
-- TABLE: research_sessions
-- Stores all research sessions with full data
-- ============================================================================

CREATE TABLE IF NOT EXISTS research_sessions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership (References Supabase auth.users automatically)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Research Query & Timestamp
  query TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Personas used for analysis
  personas TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Research Results (stored as JSONB for flexibility)
  results JSONB DEFAULT '[]'::JSONB NOT NULL,
  extracted_content JSONB DEFAULT '[]'::JSONB NOT NULL,
  chunks JSONB DEFAULT '[]'::JSONB NOT NULL,
  analysis JSONB,
  
  -- Metadata (result counts, duration, etc.)
  metadata JSONB DEFAULT '{}'::JSONB NOT NULL,
  
  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Soft Delete (keep for 30 days, then purge)
  deleted_at TIMESTAMPTZ,
  
  -- Full-Text Search Vector (auto-generated from query)
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(query, ''))
  ) STORED,
  
  -- Constraints
  CONSTRAINT query_not_empty CHECK (length(trim(query)) > 0)
);

-- ============================================================================
-- INDEXES: research_sessions
-- Optimize common queries
-- ============================================================================

-- User's research (most common query)
CREATE INDEX IF NOT EXISTS idx_research_user_timestamp 
  ON research_sessions(user_id, timestamp DESC);

-- Non-deleted sessions only
CREATE INDEX IF NOT EXISTS idx_research_active 
  ON research_sessions(user_id, timestamp DESC) 
  WHERE deleted_at IS NULL;

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_research_search 
  ON research_sessions USING GIN(search_vector);

-- Find by ID (already indexed as PRIMARY KEY, but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_research_id 
  ON research_sessions(id);

-- ============================================================================
-- ROW-LEVEL SECURITY: research_sessions
-- Users can ONLY access their own research
-- ============================================================================

ALTER TABLE research_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can SELECT their own research
CREATE POLICY "Users can view own research"
  ON research_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can INSERT their own research
CREATE POLICY "Users can insert own research"
  ON research_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can UPDATE their own research
CREATE POLICY "Users can update own research"
  ON research_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can DELETE their own research (soft delete)
CREATE POLICY "Users can delete own research"
  ON research_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS: research_sessions
-- Auto-update timestamps
-- ============================================================================

-- Function: Update updated_at on every row update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Call function before each UPDATE
CREATE TRIGGER update_research_sessions_updated_at
  BEFORE UPDATE ON research_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: user_preferences
-- Store user settings and preferences
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  -- Primary Key (one row per user)
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Research Preferences
  default_personas TEXT[] DEFAULT ARRAY[]::TEXT[],
  auto_sync BOOLEAN DEFAULT TRUE,
  sync_frequency_minutes INTEGER DEFAULT 5,
  
  -- UI Preferences
  theme TEXT DEFAULT 'dark',
  results_per_page INTEGER DEFAULT 10,
  
  -- Storage Settings
  max_sessions INTEGER DEFAULT 100,
  auto_cleanup_old BOOLEAN DEFAULT FALSE,
  cleanup_after_days INTEGER DEFAULT 90,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_theme CHECK (theme IN ('dark', 'light')),
  CONSTRAINT valid_sync_frequency CHECK (sync_frequency_minutes >= 1),
  CONSTRAINT valid_max_sessions CHECK (max_sessions >= 10 AND max_sessions <= 1000),
  CONSTRAINT valid_cleanup_days CHECK (cleanup_after_days >= 1)
);

-- ============================================================================
-- ROW-LEVEL SECURITY: user_preferences
-- Users can only access their own preferences
-- ============================================================================

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own preferences
CREATE POLICY "Users can manage own preferences"
  ON user_preferences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS: user_preferences
-- Auto-update timestamps
-- ============================================================================

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: Get user's research count
-- Useful for dashboard/stats
-- ============================================================================

CREATE OR REPLACE FUNCTION get_research_count(target_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM research_sessions
  WHERE user_id = target_user_id
    AND deleted_at IS NULL;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Get user's storage usage (approximate)
-- Returns size in bytes
-- ============================================================================

CREATE OR REPLACE FUNCTION get_storage_usage(target_user_id UUID)
RETURNS BIGINT AS $$
  SELECT COALESCE(
    SUM(
      length(query::text) + 
      length(results::text) + 
      length(extracted_content::text) + 
      length(chunks::text) + 
      COALESCE(length(analysis::text), 0)
    ),
    0
  )
  FROM research_sessions
  WHERE user_id = target_user_id
    AND deleted_at IS NULL;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Cleanup old soft-deleted sessions
-- Run this periodically (e.g., via Supabase cron job)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_deleted_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete sessions that were soft-deleted more than 30 days ago
  DELETE FROM research_sessions
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Search research sessions
-- Full-text search across queries
-- ============================================================================

CREATE OR REPLACE FUNCTION search_research(
  target_user_id UUID,
  search_query TEXT
)
RETURNS TABLE (
  id UUID,
  query TEXT,
  timestamp TIMESTAMPTZ,
  personas TEXT[],
  metadata JSONB,
  rank REAL
) AS $$
  SELECT 
    id,
    query,
    timestamp,
    personas,
    metadata,
    ts_rank(search_vector, to_tsquery('english', search_query)) AS rank
  FROM research_sessions
  WHERE user_id = target_user_id
    AND deleted_at IS NULL
    AND search_vector @@ to_tsquery('english', search_query)
  ORDER BY rank DESC, timestamp DESC
  LIMIT 20;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================================
-- VIEW: recent_research
-- Quick access to user's recent research
-- ============================================================================

CREATE OR REPLACE VIEW recent_research AS
  SELECT 
    id,
    user_id,
    query,
    timestamp,
    personas,
    metadata,
    created_at
  FROM research_sessions
  WHERE deleted_at IS NULL
  ORDER BY timestamp DESC;

-- ============================================================================
-- GRANTS: Ensure authenticated users can use functions
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_research_count TO authenticated;
GRANT EXECUTE ON FUNCTION get_storage_usage TO authenticated;
GRANT EXECUTE ON FUNCTION search_research TO authenticated;
GRANT SELECT ON recent_research TO authenticated;

-- ============================================================================
-- INITIAL DATA: Create default preferences for new users
-- ============================================================================

-- Function to create default preferences on user signup
CREATE OR REPLACE FUNCTION create_default_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Create preferences when new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_preferences();

-- ============================================================================
-- VERIFICATION QUERIES
-- Run these to verify setup
-- ============================================================================

-- Check tables exist
DO $$
BEGIN
  RAISE NOTICE '✅ Tables created successfully';
  RAISE NOTICE '  - research_sessions: % rows', (SELECT COUNT(*) FROM research_sessions);
  RAISE NOTICE '  - user_preferences: % rows', (SELECT COUNT(*) FROM user_preferences);
END $$;

-- Check RLS is enabled
DO $$
BEGIN
  IF (SELECT relrowsecurity FROM pg_class WHERE relname = 'research_sessions') THEN
    RAISE NOTICE '✅ RLS enabled on research_sessions';
  ELSE
    RAISE WARNING '⚠️ RLS NOT enabled on research_sessions';
  END IF;
  
  IF (SELECT relrowsecurity FROM pg_class WHERE relname = 'user_preferences') THEN
    RAISE NOTICE '✅ RLS enabled on user_preferences';
  ELSE
    RAISE WARNING '⚠️ RLS NOT enabled on user_preferences';
  END IF;
END $$;

-- ============================================================================
-- SUCCESS!
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Database schema created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Enable authentication in Supabase dashboard';
  RAISE NOTICE '2. Add Project URL and anon key to .env.local';
  RAISE NOTICE '3. Install @supabase/supabase-js in your project';
  RAISE NOTICE '4. Update ResearchMemory class to use Supabase';
  RAISE NOTICE '';
  RAISE NOTICE 'Ready to sync! 🚀';
END $$;
