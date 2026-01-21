# OAuth Setup Guide - Starting Fresh

## Critical Information

### Application URL
- **Vercel Site URL:** https://agentsvercel-beta.vercel.app

### GitHub OAuth App (To Be Created)
- **App Name:** [FILL IN AFTER STEP 1]
- **Client ID:** [FILL IN AFTER STEP 1]
- **Client Secret:** [FILL IN AFTER STEP 1]
- **App Settings URL:** [FILL IN AFTER STEP 1]

### Supabase Configuration (To Be Gathered)
- **Project URL:** [FILL IN FROM SUPABASE DASHBOARD]
- **Anon Key:** [FILL IN FROM SUPABASE DASHBOARD]
- **Callback URL:** [WILL BE: https://YOUR_PROJECT.supabase.co/auth/v1/callback]

---

## Step-by-Step Setup Process

### STEP 1: Create New GitHub OAuth Application

1. **Navigate to GitHub Developer Settings**
   - [ ] Go to: https://github.com/settings/developers
   - [ ] Click **"OAuth Apps"** tab
   - [ ] Click **"New OAuth App"** button

2. **Fill in Application Details**
   - [ ] **Application name:** `UCAS Vercel Production` (or your preferred name)
   - [ ] **Homepage URL:** `https://agentsvercel-beta.vercel.app`
   - [ ] **Application description:** (optional) `Universal Cognitive Amplification System`
   - [ ] **Authorization callback URL:** `https://agentsvercel-beta.vercel.app`
   - [ ] Click **"Register application"**

3. **Copy Your Credentials**
   - [ ] **Client ID:** Copy this and paste above in "Critical Information"
   - [ ] Click **"Generate a new client secret"**
   - [ ] **Client Secret:** Copy this immediately (you won't see it again!) and paste above
   - [ ] Copy the OAuth app settings URL (e.g., `https://github.com/settings/applications/XXXXXXX`) and paste above

4. **IMPORTANT:** Keep this browser tab open - we'll come back to add the Supabase callback URL

---

### STEP 2: Get Supabase Configuration Details

1. **Go to Supabase Dashboard**
   - [ ] Navigate to: https://supabase.com/dashboard/projects
   - [ ] Click on your project: `kxctrosgcockwtrteizd` (or whichever project you're using)

2. **Get Project URL and Keys**
   - [ ] Click **"Settings"** (gear icon in left sidebar)
   - [ ] Click **"API"** under Project Settings
   - [ ] **Copy Project URL:** Paste this above in "Critical Information" → Project URL
   - [ ] **Copy anon/public key:** Paste this above in "Critical Information" → Anon Key
   - [ ] The Callback URL will be: `[YOUR_PROJECT_URL]/auth/v1/callback`
   - [ ] Write out the full callback URL above (example: `https://kxctrosgcockwtrteizd.supabase.co/auth/v1/callback`)

---

### STEP 3: Configure Supabase GitHub Provider

1. **Go to Authentication Providers**
   - [ ] In Supabase Dashboard, click **"Authentication"** in left sidebar
   - [ ] Click **"Providers"** tab
   - [ ] Find **"GitHub"** in the provider list and click on it

2. **Enable and Configure GitHub Provider**
   - [ ] Toggle **"Enable Sign in with GitHub"** to ON
   - [ ] **GitHub client ID:** Paste the Client ID from Step 1 (from "Critical Information" above)
   - [ ] **GitHub client secret:** Paste the Client Secret from Step 1 (from "Critical Information" above)
   - [ ] Click **"Save"**

3. **Configure URL Settings**
   - [ ] Still in Supabase, click **"URL Configuration"** under Authentication
   - [ ] **Site URL:** Enter `https://agentsvercel-beta.vercel.app`
   - [ ] **Redirect URLs:** Click "Add URL" and enter `https://agentsvercel-beta.vercel.app/**`
   - [ ] Click **"Save"**

---

### STEP 4: Update GitHub OAuth App with Supabase Callback

1. **Go Back to GitHub OAuth App Settings**
   - [ ] Return to the GitHub OAuth app settings tab (or use the URL you saved in Step 1)
   - [ ] Scroll down to **"Authorization callback URL"**

2. **Add Supabase Callback URL**
   - [ ] You should see `https://agentsvercel-beta.vercel.app` already there
   - [ ] GitHub allows multiple callback URLs - look for a way to add another OR edit the field
   - [ ] Add a new line and enter your Supabase callback URL: `https://[YOUR_PROJECT].supabase.co/auth/v1/callback`
   - [ ] **You should now have TWO callback URLs:**
     - `https://agentsvercel-beta.vercel.app`
     - `https://[YOUR_PROJECT].supabase.co/auth/v1/callback`
   - [ ] Click **"Update application"**

---

### STEP 5: Update Vercel Environment Variables

1. **Go to Vercel Project Settings**
   - [ ] Navigate to: https://vercel.com/dashboard
   - [ ] Find and click on your project: `agentsvercel-beta`
   - [ ] Click **"Settings"** tab
   - [ ] Click **"Environment Variables"** in left sidebar

2. **Add/Update Environment Variables**
   - [ ] Add or update `GITHUB_CLIENT_ID` = [Your Client ID from Step 1]
   - [ ] Add or update `GITHUB_CLIENT_SECRET` = [Your Client Secret from Step 1]
   - [ ] Add or update `SUPABASE_URL` = [Your Supabase Project URL from Step 2]
   - [ ] Add or update `SUPABASE_ANON_KEY` = [Your Supabase Anon Key from Step 2]
   - [ ] Click **"Save"** for each

3. **Redeploy if Variables Changed**
   - [ ] If you changed any variables, go to **"Deployments"** tab
   - [ ] Click on the latest deployment
   - [ ] Click the **"..."** menu → **"Redeploy"**
   - [ ] Wait for deployment to complete

---

### STEP 6: Update Local .env File

1. **Open Your Local .env File**
   - [ ] Open: `c:\Users\scoso\WEBSITES\AI Agents Vercel\AI Agents\Ai-Agent\.env`

2. **Update These Variables**
   ```env
   GITHUB_CLIENT_ID=[Your Client ID from Step 1]
   GITHUB_CLIENT_SECRET=[Your Client Secret from Step 1]
   SUPABASE_URL=[Your Supabase Project URL from Step 2]
   SUPABASE_ANON_KEY=[Your Supabase Anon Key from Step 2]
   ```
   - [ ] Save the file

---

### STEP 7: Clear Browser Cache and Test

1. **Clear Browser Data**
   - [ ] Open your browser settings
   - [ ] Clear cookies and cached data for:
     - `https://agentsvercel-beta.vercel.app`
     - `https://github.com`
     - `https://*.supabase.co`
   - [ ] Close all browser tabs
   - [ ] Restart browser

2. **Test OAuth Flow**
   - [ ] Open a new browser tab (incognito/private mode recommended)
   - [ ] Navigate to: `https://agentsvercel-beta.vercel.app`
   - [ ] Click **"Sign In"** or **"Login with GitHub"** button
   - [ ] You should be redirected to GitHub authorization page
   - [ ] Click **"Authorize"** on GitHub
   - [ ] **CRITICAL CHECK:** After authorization, you should be redirected BACK to `https://agentsvercel-beta.vercel.app` (NOT to any other site)
   - [ ] Verify you are signed in (check for username/avatar in the UI)

---

## Troubleshooting

### If You Get "redirect_uri is not associated with this application"
- Go back to Step 4 and verify BOTH callback URLs are in your GitHub OAuth app
- Make sure there are no typos in the URLs
- Make sure the Supabase callback URL ends with `/auth/v1/callback`

### If You're Redirected to the Wrong Site
- Check Supabase URL Configuration (Step 3.3) - Site URL must be your Vercel URL
- Check Redirect URLs in Supabase includes your Vercel URL with `/**` at the end
- Clear browser cache completely and try again

### If Sign In Doesn't Work At All
- Check Vercel Environment Variables (Step 5) - make sure all 4 variables are set
- Check that Supabase GitHub provider is enabled (Step 3.2)
- Check browser console for error messages
- Check Vercel Function Logs for authentication errors

---

## Success Checklist

- [ ] GitHub OAuth app created with proper callback URLs
- [ ] Supabase GitHub provider configured with correct Client ID/Secret
- [ ] Supabase URL configuration points to Vercel site
- [ ] Vercel environment variables updated
- [ ] Local .env file updated
- [ ] Browser cache cleared
- [ ] Successfully signed in via GitHub on Vercel site
- [ ] After sign in, remained on Vercel site (not redirected elsewhere)

---

## Next Steps After OAuth Working

Once OAuth is working, you can test the YouTube transcript functionality:
1. Search for a video on your Vercel site
2. Load the video
3. Click "Load Transcript" button manually
4. Verify transcript loads from YouTube captions (no AI fallback)
