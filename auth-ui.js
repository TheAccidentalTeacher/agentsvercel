/**
 * Authentication UI - Simple OAuth integration for Supabase
 * 
 * Features:
 * - One-click Google/GitHub sign-in
 * - Profile dropdown with user info
 * - Sync status indicator
 * - Auto-sync on login
 */

import { 
  supabase,
  isAuthenticated,
  getCurrentUser,
  getUserEmail,
  signInWithGoogle,
  signInWithGitHub,
  signOut,
  onAuthStateChange,
  onSyncStatusChange,
  SyncStatus
} from './supabase-client.js';

import { ResearchMemory } from './research-memory.js';

// Initialize ResearchMemory for sync
const researchMemory = new ResearchMemory();

// ============================================================================
// DOM Elements
// ============================================================================

const authContainer = document.getElementById('auth-container');
const signInBtn = document.getElementById('sign-in-btn');
const userProfile = document.getElementById('user-profile');
const profileBtn = document.getElementById('profile-btn');
const userAvatar = document.getElementById('user-avatar');
const userEmail = document.getElementById('user-email');
const profileDropdown = document.getElementById('profile-dropdown');
const profileEmail = document.getElementById('profile-email');
const signOutBtn = document.getElementById('sign-out-btn');
const authModal = document.getElementById('auth-modal');
const googleSignInBtn = document.getElementById('google-sign-in');
const githubSignInBtn = document.getElementById('github-sign-in');
const cancelAuthBtn = document.getElementById('cancel-auth');
const syncStatus = document.getElementById('sync-status');
const syncIcon = document.getElementById('sync-icon');
const syncText = document.getElementById('sync-text');

// ============================================================================
// Authentication State Management
// ============================================================================

/**
 * Update UI based on authentication state
 */
function updateAuthUI() {
  const authenticated = isAuthenticated();
  const user = authenticated ? getCurrentUser() : null;
  
  // Update header auth UI
  if (authenticated) {
    // Hide sign-in button, show profile
    signInBtn.style.display = 'none';
    userProfile.style.display = 'block';
    syncStatus.style.display = 'flex';
    
    // Set user info
    userEmail.textContent = user.email || 'User';
    profileEmail.textContent = user.email || 'User';
    
    // Set avatar (from OAuth provider or default)
    const avatarUrl = user.user_metadata?.avatar_url || 
                      user.user_metadata?.picture || 
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=4285f4&color=fff`;
    userAvatar.src = avatarUrl;
    
    console.log('✅ Authenticated as:', user.email);
    
    // Trigger full sync on login
    researchMemory.fullSync().then(() => {
      console.log('✅ Initial sync complete');
    });
    
  } else {
    // Show sign-in button, hide profile
    signInBtn.style.display = 'block';
    userProfile.style.display = 'none';
    syncStatus.style.display = 'none';
    
    console.log('⚠️ Not authenticated - localStorage only');
  }
  
  // Update settings modal auth section
  updateSettingsAuthUI(authenticated, user);
}

/**
 * Update auth section in settings modal
 */
function updateSettingsAuthUI(authenticated, user) {
  const authNotSignedIn = document.getElementById('auth-not-signed-in');
  const authSignedIn = document.getElementById('auth-signed-in');
  const settingsUserEmail = document.getElementById('settings-user-email');
  
  if (!authNotSignedIn || !authSignedIn) return; // Elements not loaded yet
  
  if (authenticated && user) {
    authNotSignedIn.style.display = 'none';
    authSignedIn.style.display = 'block';
    if (settingsUserEmail) {
      settingsUserEmail.textContent = user.email || 'User';
    }
  } else {
    authNotSignedIn.style.display = 'block';
    authSignedIn.style.display = 'none';
  }
}

/**
 * Update sync status indicator
 */
function updateSyncStatusUI(status, lastSyncTime) {
  switch (status) {
    case SyncStatus.IDLE:
      syncIcon.textContent = '💾';
      syncText.textContent = 'Ready';
      syncStatus.style.color = '#888';
      break;
      
    case SyncStatus.SYNCING:
      syncIcon.textContent = '🔄';
      syncText.textContent = 'Syncing...';
      syncStatus.style.color = '#4285f4';
      break;
      
    case SyncStatus.SYNCED:
      syncIcon.textContent = '✅';
      const timeAgo = lastSyncTime ? formatTimeAgo(lastSyncTime) : 'just now';
      syncText.textContent = `Synced ${timeAgo}`;
      syncStatus.style.color = '#4caf50';
      break;
      
    case SyncStatus.ERROR:
      syncIcon.textContent = '⚠️';
      syncText.textContent = 'Sync error';
      syncStatus.style.color = '#ff6b6b';
      break;
      
    case SyncStatus.OFFLINE:
      syncIcon.textContent = '📵';
      syncText.textContent = 'Offline';
      syncStatus.style.color = '#888';
      break;
  }
}

/**
 * Format time ago (e.g., "2m ago", "1h ago")
 */
function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// ============================================================================
// Event Handlers
// ============================================================================

/**
 * Show authentication modal
 */
function showAuthModal() {
  authModal.style.display = 'flex';
}

/**
 * Hide authentication modal
 */
function hideAuthModal() {
  authModal.style.display = 'none';
}

/**
 * Handle Google sign-in
 */
async function handleGoogleSignIn() {
  try {
    console.log('🔐 Starting Google sign-in...');
    const { error } = await signInWithGoogle();
    
    if (error) {
      console.error('❌ Google sign-in error:', error);
      alert(`Sign-in failed: ${error.message}`);
      return;
    }
    
    // OAuth redirect will happen automatically
    console.log('🔄 Redirecting to Google...');
    hideAuthModal();
    
  } catch (error) {
    console.error('❌ Google sign-in error:', error);
    alert(`Sign-in failed: ${error.message}`);
  }
}

/**
 * Handle GitHub sign-in
 */
async function handleGitHubSignIn() {
  try {
    console.log('🔐 Starting GitHub sign-in...');
    const { error } = await signInWithGitHub();
    
    if (error) {
      console.error('❌ GitHub sign-in error:', error);
      alert(`Sign-in failed: ${error.message}`);
      return;
    }
    
    // OAuth redirect will happen automatically
    console.log('🔄 Redirecting to GitHub...');
    hideAuthModal();
    
  } catch (error) {
    console.error('❌ GitHub sign-in error:', error);
    alert(`Sign-in failed: ${error.message}`);
  }
}

/**
 * Handle sign-out
 */
async function handleSignOut() {
  try {
    console.log('🚪 Signing out...');
    const { error } = await signOut();
    
    if (error) {
      console.error('❌ Sign-out error:', error);
      alert(`Sign-out failed: ${error.message}`);
      return;
    }
    
    // Close dropdown
    profileDropdown.style.display = 'none';
    
    console.log('✅ Signed out successfully');
    
  } catch (error) {
    console.error('❌ Sign-out error:', error);
    alert(`Sign-out failed: ${error.message}`);
  }
}

/**
 * Toggle profile dropdown
 */
function toggleProfileDropdown() {
  const isVisible = profileDropdown.style.display === 'block';
  profileDropdown.style.display = isVisible ? 'none' : 'block';
}

// ============================================================================
// Event Listeners
// ============================================================================

// Sign-in button (header)
signInBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  // console.log('🔓 Sign-in button clicked');
  showAuthModal();
});

// Sign-in button (settings modal)
const settingsSignInBtn = document.getElementById('settings-sign-in-btn');
if (settingsSignInBtn) {
  settingsSignInBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    // console.log('🔓 Settings sign-in button clicked');
    showAuthModal();
  });
}

// OAuth provider buttons
googleSignInBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  handleGoogleSignIn();
});
githubSignInBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  handleGitHubSignIn();
});

// Cancel auth modal
cancelAuthBtn.addEventListener('click', hideAuthModal);

// Close modal on outside click
authModal.addEventListener('click', (e) => {
  if (e.target === authModal) {
    hideAuthModal();
  }
});

// Profile button (toggle dropdown)
profileBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleProfileDropdown();
});

// Sign-out button
signOutBtn.addEventListener('click', handleSignOut);

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!userProfile.contains(e.target)) {
    profileDropdown.style.display = 'none';
  }
});

// Listen for auth state changes
onAuthStateChange((event, session) => {
  // console.log('🔐 Auth state changed:', event);
  // console.log('   Session:', session?.user?.email || 'null');
  // console.log('   User ID:', session?.user?.id || 'null');
  
  updateAuthUI();
  
  if (event === 'SIGNED_IN') {
    console.log('✅ Signed in successfully as:', session.user.email);
  } else if (event === 'SIGNED_OUT') {
    console.log('👋 Signed out');
  }
});

// Listen for sync status changes
onSyncStatusChange((status, lastSyncTime) => {
  updateSyncStatusUI(status, lastSyncTime);
});

// ============================================================================
// Initialization
// ============================================================================

// Initialize UI on page load
async function initializeAuth() {
  // Don't check session immediately - let Supabase process OAuth callback first
  // The auth state change listener will handle session detection automatically
  console.log('✅ Auth UI initialized - waiting for auth state...');
  
  // Give Supabase a moment to process OAuth callback if present
  setTimeout(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      console.log('✅ Session detected after OAuth callback:', session.user.email);
      updateAuthUI();
    } else {
      console.log('ℹ️ No session - user needs to sign in');
      updateAuthUI();
    }
  }, 500);
}

// Run initialization
initializeAuth();
