# Phase 7: Supabase Cloud Sync & Multi-Device Access

**Date**: December 14, 2024  
**Status**: 📋 PLANNING  
**Goal**: Enable research access from ANY device (desktop, laptop, tablet, mobile)

---

## 🎯 Why Supabase?

### User Requirements
- ✅ Access from multiple computers
- ✅ Access from mobile devices
- ✅ No data loss if browser cache cleared
- ✅ Cloud backup of all research
- ✅ Fast sync across devices
- ✅ Future: Share research with others

### Why Supabase Over MongoDB
1. **PostgreSQL** - Rock-solid reliability
2. **Free Tier** - 500MB storage, unlimited API calls
3. **Built-in Auth** - Google, GitHub, email login ready
4. **Real-time** - Changes sync instantly across devices
5. **Row-Level Security** - Your data stays private
6. **Easy Setup** - Great docs, simple API
7. **No Server Needed** - Direct from browser

---

## 📊 Architecture

### Current (Phase 6)
```
Browser → localStorage (5-10MB limit, single device)
```

### Phase 7
```
Browser → Supabase PostgreSQL (500MB, all devices)
         ↓
    Real-time sync → Other devices update automatically
```

### Hybrid Approach (Best of Both)
```
Browser → localStorage (instant, offline)
         ↓
    Auto-sync → Supabase (backup, multi-device)
         ↓
    Fallback → localStorage if offline
```

---

## 🗄️ Database Schema

### Table: `research_sessions`
```sql
CREATE TABLE research_sessions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership (who created this research)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Research Data
  query TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  personas TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Results (JSONB for flexible storage)
  results JSONB DEFAULT '[]'::JSONB,
  extracted_content JSONB DEFAULT '[]'::JSONB,
  chunks JSONB DEFAULT '[]'::JSONB,
  analysis JSONB,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  
  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Soft Delete (keep deleted sessions for 30 days)
  deleted_at TIMESTAMPTZ,
  
  -- Search Optimization
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', query)
  ) STORED
);

-- Indexes for Performance
CREATE INDEX idx_research_user ON research_sessions(user_id);
CREATE INDEX idx_research_timestamp ON research_sessions(timestamp DESC);
CREATE INDEX idx_research_deleted ON research_sessions(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_research_search ON research_sessions USING GIN(search_vector);

-- Row-Level Security (RLS)
ALTER TABLE research_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own research
CREATE POLICY "Users can view own research"
  ON research_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own research
CREATE POLICY "Users can insert own research"
  ON research_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own research
CREATE POLICY "Users can update own research"
  ON research_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own research (soft delete)
CREATE POLICY "Users can delete own research"
  ON research_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Function: Update updated_at on row update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_research_sessions_updated_at
  BEFORE UPDATE ON research_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Table: `user_preferences`
```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Settings
  default_personas TEXT[] DEFAULT ARRAY[]::TEXT[],
  auto_sync BOOLEAN DEFAULT TRUE,
  theme TEXT DEFAULT 'dark',
  
  -- Storage Limits
  max_sessions INTEGER DEFAULT 100,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences"
  ON user_preferences
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## 🔧 Implementation Plan

### Step 1: Supabase Setup (You + Me)
- [ ] Create Supabase account (free)
- [ ] Create new project
- [ ] Copy project URL and anon key
- [ ] Run SQL schema (I'll provide)
- [ ] Enable authentication
- [ ] Test connection

### Step 2: ResearchMemory Refactor (Me)
- [ ] Keep existing localStorage methods
- [ ] Add Supabase methods (save, load, sync)
- [ ] Implement hybrid sync strategy
- [ ] Handle offline/online transitions
- [ ] Add sync status indicator

### Step 3: Authentication (Me)
- [ ] Add login button to UI
- [ ] Implement Google/GitHub OAuth
- [ ] Add "Sign In to Sync" modal
- [ ] Handle anonymous → authenticated transition
- [ ] Show user profile in UI

### Step 4: Sync UI (Me)
- [ ] Add sync status indicator (🔄 syncing, ✅ synced)
- [ ] Manual sync button
- [ ] Conflict resolution UI
- [ ] Offline indicator
- [ ] Last sync timestamp

### Step 5: Testing
- [ ] Test multi-device sync
- [ ] Test offline mode
- [ ] Test conflict resolution
- [ ] Test mobile browser
- [ ] Test performance

---

## 🎨 UI Changes

### New UI Elements

**Header Addition**:
```
[💾 Save] [📄 Markdown] [📋 JSON] [📚 History] | [🔄 Synced] [👤 Profile]
```

**Profile Dropdown**:
```
┌─────────────────────────┐
│ 👤 Your Name            │
│ your@email.com          │
├─────────────────────────┤
│ ⚙️ Preferences          │
│ 🔄 Sync Status: Online  │
│ 💾 Storage: 234 KB      │
├─────────────────────────┤
│ 🚪 Sign Out             │
└─────────────────────────┘
```

**Sync Status Indicator**:
- 🔄 Blue pulse: Syncing
- ✅ Green check: Synced
- ⚠️ Yellow: Offline (localStorage only)
- ❌ Red: Sync error

**Login Modal** (if not authenticated):
```
┌─────────────────────────────────────────┐
│   🔒 Sign In to Sync Research           │
│                                         │
│   Sync your research across all devices │
│                                         │
│   [Continue with Google]                │
│   [Continue with GitHub]                │
│   [Continue with Email]                 │
│                                         │
│   Or continue without sync (localStorage)│
└─────────────────────────────────────────┘
```

---

## 🔄 Sync Strategy

### Hybrid Approach
1. **Write**: Save to localStorage immediately (fast)
2. **Background**: Sync to Supabase (reliable)
3. **Read**: Check Supabase first, fallback to localStorage
4. **Conflict**: Last-write-wins (with timestamp)

### Offline Support
- All features work offline (localStorage)
- Queue syncs when offline
- Auto-sync when back online
- Show offline indicator

### Performance
- Debounced sync (don't sync on every keystroke)
- Batch operations
- Incremental sync (only changed data)
- Background worker for sync

---

## 📱 Mobile Considerations

### Responsive Design
- Touch-friendly buttons (44px minimum)
- Swipe gestures for history
- Mobile-optimized modals
- Reduced data loading on cellular

### PWA Features (Future)
- Install as app
- Offline mode
- Push notifications for sync
- Native feel

---

## 🔐 Security

### Row-Level Security (RLS)
- Users can ONLY see their own research
- No way to access other users' data
- Enforced at database level
- Even if client is compromised

### Authentication
- OAuth (Google/GitHub) - secure, no password storage
- JWT tokens - secure, expiring
- HTTPS only - encrypted in transit
- Supabase handles all security

### Data Privacy
- No analytics on research content
- No AI training on user data
- User owns their data
- Export anytime, delete anytime

---

## 💰 Cost Estimate

### Free Tier (Supabase)
- **Storage**: 500MB (≈1,250 research sessions)
- **Bandwidth**: 5GB/month
- **API Calls**: Unlimited
- **Users**: Unlimited
- **Cost**: $0/month ✅

### When to Upgrade ($25/month)
- More than 500MB storage needed
- More than 5GB bandwidth/month
- Need advanced features (backups, support)

**Reality**: You'll likely never need to upgrade for personal use

---

## 📝 Migration Path

### Existing localStorage Data
1. User signs in for first time
2. Detect existing localStorage sessions
3. Show: "Import 15 saved sessions to cloud?"
4. Batch upload to Supabase
5. Mark as synced
6. Keep localStorage as backup

### No Data Loss
- localStorage still works as fallback
- Supabase is additive, not replacement
- Can always export to files

---

## 🚀 Timeline

**Estimated Time**: 3-4 hours total

### Session 1: Setup (30 min)
- Create Supabase project
- Run SQL schema
- Test connection
- Add environment variables

### Session 2: Code (2 hours)
- Refactor ResearchMemory class
- Add Supabase client
- Implement sync methods
- Add authentication UI

### Session 3: Testing (1 hour)
- Test multi-device sync
- Test offline mode
- Fix bugs
- Polish UI

### Session 4: Documentation (30 min)
- Update docs
- Create user guide
- Commit and celebrate 🎉

---

## ✅ Success Criteria

Phase 7 is COMPLETE when:
- [ ] User can sign in with Google/GitHub
- [ ] Research saves to Supabase automatically
- [ ] Same research appears on all devices
- [ ] Works offline (localStorage fallback)
- [ ] Sync status visible in UI
- [ ] No data loss during migration
- [ ] Mobile browser works perfectly
- [ ] Documentation updated

---

## 🎯 Next Steps (RIGHT NOW)

### Your Tasks:
1. **Create Supabase Account**
   - Go to https://supabase.com
   - Sign up (free)
   - Create new project
   - Name: "UCAS Research Engine" (or whatever you like)
   - Choose region closest to you
   - Generate strong password (save it!)

2. **Get Credentials**
   - Go to Project Settings → API
   - Copy `Project URL` (e.g., https://xxxxx.supabase.co)
   - Copy `anon` `public` key (long string)
   - Don't share these publicly!

### My Tasks (After You Set Up):
1. You give me: Project URL + anon key
2. I add to your `.env.local` file
3. I run SQL schema in your Supabase project
4. I refactor ResearchMemory to use Supabase
5. I add authentication UI
6. We test together!

---

## 📚 Reference

### Supabase Docs
- Auth: https://supabase.com/docs/guides/auth
- JavaScript Client: https://supabase.com/docs/reference/javascript
- RLS: https://supabase.com/docs/guides/auth/row-level-security

### Our Current Stack
- Frontend: Vanilla JS (no build step)
- Backend: Supabase (PostgreSQL + Auth + Storage)
- Sync: Hybrid (localStorage + Supabase)
- Auth: OAuth (Google/GitHub)

---

**Status**: 📋 READY TO START  
**Waiting On**: You to create Supabase project  
**Next**: Run SQL schema + add credentials

Let's do this! 🚀
