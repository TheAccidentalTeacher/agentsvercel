# OAuth Configuration Fix - Vercel Deployment

## Problem Summary
After migrating from Netlify to Vercel, GitHub OAuth authentication is redirecting users back to the old Netlify site instead of the new Vercel deployment. The issue is caused by missing callback URLs in the GitHub OAuth application settings.

**Error:** "Be careful! The redirect_uri is not associated with this application"

---

## Critical Information

### Vercel Production URL
- **Site:** https://agentsvercel-beta.vercel.app

### GitHub OAuth App (NEW - Agents Vercel)
- **Client ID:** `Ov23liff9pGfLoVbMBMWy`
- **Client Secret:** `d7a7a97a411ffd8eff009dff3352406fe8867eda`
- **Settings:** https://github.com/settings/developers

### Supabase Configuration
- **Project URL:** https://kxctrosgcockwtrteizd.supabase.co
- **Callback URL:** `https://kxctrosgcockwtrteizd.supabase.co/auth/v1/callback`
- **Dashboard:** https://supabase.com/dashboard/project/kxctrosgcockwtrteizd

---

## Fix Checklist

### Step 1: GitHub OAuth App Configuration
- [ ] Navigate to: https://github.com/settings/developers
- [ ] Click on "Agents Vercel" OAuth app (or the app with Client ID: `Ov23liff9pGfLoVbMBMWy`)
- [ ] Verify **Homepage URL** is set to: `https://agentsvercel-beta.vercel.app`
- [ ] In **Authorization callback URL** field, add BOTH URLs (GitHub allows multiple):
  - [ ] `https://kxctrosgcockwtrteizd.supabase.co/auth/v1/callback`
  - [ ] `https://agentsvercel-beta.vercel.app`
- [ ] Click **Update application**
- [ ] Take screenshot of saved configuration for verification

### Step 2: Supabase Configuration Verification
- [ ] Go to: https://supabase.com/dashboard/project/kxctrosgcockwtrteizd/auth/providers
- [ ] Click on **GitHub** provider
- [ ] Verify **Client ID** is: `Ov23liff9pGfLoVbMBMWy`
- [ ] Verify **Client Secret** is: `d7a7a97a411ffd8eff009dff3352406fe8867eda`
- [ ] Click **Save**
- [ ] Go to: https://supabase.com/dashboard/project/kxctrosgcockwtrteizd/auth/url-configuration
- [ ] Verify **Site URL** is: `https://agentsvercel-beta.vercel.app`
- [ ] Verify **Redirect URLs** includes: `https://agentsvercel-beta.vercel.app/**`
- [ ] Click **Save**

### Step 3: Vercel Environment Variables
- [ ] Go to: https://vercel.com/your-username/agentsvercel/settings/environment-variables
- [ ] Verify these variables are set:
  - [ ] `GITHUB_CLIENT_ID` = `Ov23liff9pGfLoVbMBMWy`
  - [ ] `GITHUB_CLIENT_SECRET` = `d7a7a97a411ffd8eff009dff3352406fe8867eda`
  - [ ] `SUPABASE_URL` = `https://kxctrosgcockwtrteizd.supabase.co`
  - [ ] `SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (from .env file)
- [ ] If any changed, click **Save**
- [ ] If any changed, redeploy: Go to Deployments tab → Latest deployment → ... menu → Redeploy

### Step 4: Clear Browser Cache
- [ ] Open your browser
- [ ] Clear cookies and cache for:
  - [ ] https://agentsvercel-beta.vercel.app
  - [ ] https://github.com
  - [ ] https://kxctrosgcockwtrteizd.supabase.co
- [ ] Close all browser tabs
- [ ] Restart browser

### Step 5: Test Authentication Flow
- [ ] Open new browser tab (incognito/private mode recommended)
- [ ] Navigate to: https://agentsvercel-beta.vercel.app
- [ ] Click **Sign In** or **Login** button
- [ ] Click **Continue with GitHub**
- [ ] Should redirect to GitHub authorization page
- [ ] Click **Authorize** on GitHub
- [ ] Should redirect back to: https://agentsvercel-beta.vercel.app (NOT Netlify!)
- [ ] Verify you are signed in (check for username/avatar in UI)
- [ ] Check browser URL - should stay on `agentsvercel-beta.vercel.app`

---

## Testing YouTube Transcript (After OAuth Fixed)

### Step 6: Test YouTube Transcript Functionality
- [ ] On https://agentsvercel-beta.vercel.app (signed in)
- [ ] Search for video: "Geography Now! RUSSIA" or video ID: `K8zAbdYx9SU`
- [ ] Click to load video
- [ ] **VERIFY:** Transcript does NOT auto-load (UX fix implemented)
- [ ] Click **"Load Transcript"** button manually
- [ ] Check browser console for API call to: `/api/youtube-transcript?videoId=K8zAbdYx9SU`
- [ ] Transcript should load successfully from YouTube captions
- [ ] **VERIFY:** No automatic Gemini AI fallback (unless you explicitly click it)

### Step 7: Check Vercel Function Logs (If Issues)
- [ ] Go to: https://vercel.com/your-username/agentsvercel/logs
- [ ] Filter by function: `/api/youtube-transcript`
- [ ] Look for recent invocations
- [ ] Check for errors or success messages
- [ ] Debug output should show `youtube-transcript` package calls

---

## Rollback Plan (If Needed)

### If OAuth Still Fails After All Steps:
- [ ] Delete "Agents Vercel" OAuth app from GitHub
- [ ] Create brand new OAuth app:
  - **Name:** UCAS Vercel Production
  - **Homepage URL:** https://agentsvercel-beta.vercel.app
  - **Callback URLs:** 
    - https://kxctrosgcockwtrteizd.supabase.co/auth/v1/callback
    - https://agentsvercel-beta.vercel.app
- [ ] Copy new Client ID and Secret
- [ ] Update Supabase GitHub provider with new credentials
- [ ] Update Vercel environment variables
- [ ] Update `.env` file locally
- [ ] Redeploy Vercel
- [ ] Test again

---

## Success Criteria

✅ User can sign in via GitHub on https://agentsvercel-beta.vercel.app  
✅ After OAuth, user stays on Vercel site (not redirected to Netlify)  
✅ YouTube transcript loads manually when user clicks "Load Transcript"  
✅ No automatic expensive Gemini AI fallback  
✅ Transcript fetching uses `/api/youtube-transcript` endpoint  
✅ youtube-transcript npm package works on Vercel serverless  

---

## Technical Notes

### Why Two Callback URLs Are Needed
1. **Supabase Callback:** `https://kxctrosgcockwtrteizd.supabase.co/auth/v1/callback`
   - GitHub redirects here after user authorizes
   - Supabase processes the OAuth code
   - Supabase creates user session

2. **App Callback:** `https://agentsvercel-beta.vercel.app`
   - Supabase redirects here after creating session
   - User lands back on your application
   - Session cookie is set

### OAuth Flow Diagram
```
User clicks "Sign In with GitHub"
    ↓
Redirects to GitHub: github.com/login/oauth/authorize?client_id=Ov23liff9pGfLoVbMBMWy
    ↓
User authorizes app
    ↓
GitHub redirects to: kxctrosgcockwtrteizd.supabase.co/auth/v1/callback?code=xxx
    ↓
Supabase exchanges code for access token
    ↓
Supabase redirects to: agentsvercel-beta.vercel.app?access_token=xxx
    ↓
User is signed in! ✅
```

---

## Contact Information

- **GitHub Repo:** https://github.com/TheAccidentalTeacher/agentsvercel
- **Vercel Project:** agentsvercel-beta
- **Last Updated:** 2026-01-20
- **Latest Commits:**
  - `800d7e2`: ACTUAL FIX: Use youtube-transcript npm package that works on Vercel
  - `8d4d0a0`: FIX UX: Stop auto-loading transcript, add manual buttons like Monica.ai
