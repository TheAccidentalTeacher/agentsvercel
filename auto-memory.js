// Phase 10: Auto-Memory System
// Automatically captures and saves user activity summaries

import { supabase } from './supabase-client.js';

// Auto-memory configuration
const AUTO_MEMORY_CONFIG = {
  INTERACTION_THRESHOLD: 10, // Save after N interactions
  TIME_THRESHOLD: 5 * 60 * 1000, // Save every 5 minutes
  MIN_CONTENT_LENGTH: 50, // Minimum content length to save
  ENABLED: true // Global enable/disable
};

// Activity tracking state
let activityLog = [];
let interactionCount = 0;
let lastAutoSave = Date.now();
let currentUser = null;
let autoSaveTimer = null;

// Activity types and their weights (higher = more important)
const ACTIVITY_WEIGHTS = {
  'video-load': 3,
  'video-transcript': 4,
  'video-summary': 5,
  'video-content-create': 5,
  'creative-generate': 5,
  'research-search': 3,
  'ai-chat': 4,
  'project-save': 4,
  'project-load': 2,
  'asset-add': 1,
  'level-edit': 2
};

/**
 * Initialize auto-memory system
 */
export async function initAutoMemory() {
  // console.log('🤖 [Auto-Memory] Initializing...');
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  currentUser = user;
  
  if (!currentUser) {
    console.warn('⚠️ [Auto-Memory] No user logged in - auto-save disabled');
    return;
  }
  
  // Start monitoring
  startActivityMonitoring();
  
  // Set up periodic auto-save
  autoSaveTimer = setInterval(checkAndAutoSave, 60 * 1000); // Check every minute
  
  // Save on page unload
  window.addEventListener('beforeunload', saveBeforeUnload);
  
  console.log('✅ [Auto-Memory] Initialized (save every 10 actions or 5 minutes)');
}

/**
 * Track a user interaction
 */
export function trackActivity(activityType, details = {}) {
  if (!AUTO_MEMORY_CONFIG.ENABLED || !currentUser) return;
  
  const activity = {
    type: activityType,
    timestamp: Date.now(),
    details,
    weight: ACTIVITY_WEIGHTS[activityType] || 1
  };
  
  activityLog.push(activity);
  interactionCount++;
  
  console.log(`📊 [Auto-Memory] Activity: ${activityType} (${interactionCount} interactions)`, details);
  
  // Check if we should auto-save
  if (interactionCount >= AUTO_MEMORY_CONFIG.INTERACTION_THRESHOLD) {
    console.log('🎯 [Auto-Memory] Interaction threshold reached, auto-saving...');
    autoSaveSession();
  }
}

/**
 * Start monitoring DOM for activities
 */
function startActivityMonitoring() {
  // Monitor Video Intelligence usage
  document.addEventListener('click', (e) => {
    const target = e.target;
    
    // Video tab activities
    if (target.closest('#load-video-btn')) {
      const videoId = document.getElementById('video-url-input')?.value.match(/[a-zA-Z0-9_-]{11}/)?.[0];
      if (videoId) {
        trackActivity('video-load', { videoId });
      }
    }
    
    if (target.closest('#load-transcript-btn')) {
      const videoId = getCurrentVideoId();
      if (videoId) {
        trackActivity('video-transcript', { videoId });
      }
    }
    
    if (target.id === 'generate-summary-btn') {
      const videoId = getCurrentVideoId();
      if (videoId) {
        trackActivity('video-summary', { videoId });
      }
    }
    
    if (target.closest('.tool-card')) {
      const toolName = target.closest('.tool-card').querySelector('h3')?.textContent;
      if (toolName) {
        trackActivity('video-content-create', { tool: toolName });
      }
    }
    
    // Creative Studio activities
    if (target.closest('.generate-btn')) {
      const tabName = document.querySelector('.creative-tab.active')?.textContent.trim();
      trackActivity('creative-generate', { type: tabName });
    }
    
    // Project management
    if (target.id === 'save-project') {
      trackActivity('project-save', {});
    }
    
    if (target.id === 'load-project') {
      trackActivity('project-load', {});
    }
    
    if (target.id === 'add-asset') {
      trackActivity('asset-add', {});
    }
  });
  
  // Monitor AI chat submissions
  document.addEventListener('submit', (e) => {
    if (e.target.closest('#agent-chat-form')) {
      const message = e.target.querySelector('textarea')?.value;
      if (message) {
        trackActivity('ai-chat', { messagePreview: message.substring(0, 50) });
      }
    }
  });
}

/**
 * Check if auto-save should trigger
 */
function checkAndAutoSave() {
  if (!currentUser || activityLog.length === 0) return;
  
  const timeSinceLastSave = Date.now() - lastAutoSave;
  
  // Time-based trigger
  if (timeSinceLastSave >= AUTO_MEMORY_CONFIG.TIME_THRESHOLD) {
    console.log('⏰ [Auto-Memory] Time threshold reached, auto-saving...');
    autoSaveSession();
  }
}

/**
 * Auto-save current session summary
 */
async function autoSaveSession() {
  if (!currentUser || activityLog.length === 0) return;
  
  try {
    // Generate summary of activity
    const summary = generateActivitySummary();
    
    if (summary.content.length < AUTO_MEMORY_CONFIG.MIN_CONTENT_LENGTH) {
      console.log('⏭️ [Auto-Memory] Not enough activity to save, skipping...');
      return;
    }
    
    console.log('💾 [Auto-Memory] Saving session summary...', summary);
    
    // Save to memory
    const response = await fetch('/api/memory-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        contentType: summary.contentType,
        title: summary.title,
        content: summary.content,
        metadata: {
          activityCount: activityLog.length,
          interactionCount,
          sessionDuration: Date.now() - (activityLog[0]?.timestamp || Date.now()),
          autoSaved: true,
          activities: activityLog.map(a => ({ type: a.type, timestamp: a.timestamp }))
        },
        autoGenerateTags: true // Let AI generate relevant tags
      })
    });
    
    if (!response.ok) {
      throw new Error(`Auto-save failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log('✅ [Auto-Memory] Session saved!', result);
    
    // Show subtle notification
    showAutoSaveNotification(summary.title);
    
    // Reset tracking
    activityLog = [];
    interactionCount = 0;
    lastAutoSave = Date.now();
    
  } catch (error) {
    console.error('❌ [Auto-Memory] Save failed:', error);
  }
}

/**
 * Generate human-readable summary from activity log
 */
function generateActivitySummary() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  
  // Count activity types
  const activityCounts = {};
  let primaryType = 'conversation';
  let primaryActivity = null;
  let maxWeight = 0;
  
  activityLog.forEach(activity => {
    activityCounts[activity.type] = (activityCounts[activity.type] || 0) + 1;
    
    // Track most important activity
    if (activity.weight > maxWeight) {
      maxWeight = activity.weight;
      primaryActivity = activity;
      
      // Determine content type based on most important activity
      if (activity.type.startsWith('video-')) {
        primaryType = 'video';
      } else if (activity.type.startsWith('creative-')) {
        primaryType = 'creative';
      } else if (activity.type.startsWith('research-')) {
        primaryType = 'research';
      } else if (activity.type === 'ai-chat') {
        primaryType = 'conversation';
      } else {
        primaryType = 'manual';
      }
    }
  });
  
  // Build content summary
  let content = `Session at ${timeStr} on ${now.toLocaleDateString()}\n\n`;
  
  // Add primary activity details
  if (primaryActivity) {
    content += describePrimaryActivity(primaryActivity) + '\n\n';
  }
  
  // Add activity breakdown
  content += 'Activities:\n';
  Object.entries(activityCounts).forEach(([type, count]) => {
    content += `- ${formatActivityType(type)}: ${count}x\n`;
  });
  
  content += `\nTotal interactions: ${interactionCount}`;
  
  // Generate title
  const title = generateSessionTitle(primaryActivity, activityCounts);
  
  return {
    title,
    content,
    contentType: primaryType
  };
}

/**
 * Describe the most important activity
 */
function describePrimaryActivity(activity) {
  switch (activity.type) {
    case 'video-load':
      return `Watched YouTube video: ${activity.details.videoId}`;
    
    case 'video-transcript':
      return `Loaded transcript for video analysis`;
    
    case 'video-summary':
      return `Generated AI summary and analysis`;
    
    case 'video-content-create':
      return `Created educational content using ${activity.details.tool}`;
    
    case 'creative-generate':
      return `Generated ${activity.details.type} using Creative Studio`;
    
    case 'ai-chat':
      return `AI conversation: "${activity.details.messagePreview}..."`;
    
    case 'project-save':
      return `Saved game project`;
    
    case 'project-load':
      return `Loaded game project`;
    
    default:
      return `Worked on ${formatActivityType(activity.type)}`;
  }
}

/**
 * Generate descriptive title for session
 */
function generateSessionTitle(primaryActivity, activityCounts) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  
  if (!primaryActivity) {
    return `Session at ${timeStr}`;
  }
  
  switch (primaryActivity.type) {
    case 'video-load':
    case 'video-transcript':
    case 'video-summary':
      return `Video Analysis Session (${timeStr})`;
    
    case 'video-content-create':
      return `Content Creation: ${primaryActivity.details.tool} (${timeStr})`;
    
    case 'creative-generate':
      return `Creative Studio: ${primaryActivity.details.type} (${timeStr})`;
    
    case 'ai-chat':
      return `AI Conversation (${timeStr})`;
    
    case 'project-save':
    case 'project-load':
      return `Game Project Work (${timeStr})`;
    
    default:
      return `Work Session (${timeStr})`;
  }
}

/**
 * Format activity type for display
 */
function formatActivityType(type) {
  const labels = {
    'video-load': 'Video loaded',
    'video-transcript': 'Transcript loaded',
    'video-summary': 'Summary generated',
    'video-content-create': 'Content created',
    'creative-generate': 'Creative generation',
    'research-search': 'Research search',
    'ai-chat': 'AI chat',
    'project-save': 'Project saved',
    'project-load': 'Project loaded',
    'asset-add': 'Asset added',
    'level-edit': 'Level edited'
  };
  
  return labels[type] || type;
}

/**
 * Get current video ID from Video Intelligence modal
 */
function getCurrentVideoId() {
  // Try to find video ID in iframe or stored data
  const iframe = document.querySelector('.video-player iframe');
  if (iframe) {
    const match = iframe.src.match(/embed\/([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];
  }
  
  // Fallback: check input field
  const input = document.getElementById('video-url-input');
  if (input) {
    const match = input.value.match(/[a-zA-Z0-9_-]{11}/);
    if (match) return match[0];
  }
  
  return null;
}

/**
 * Show subtle notification that auto-save occurred
 */
function showAutoSaveNotification(title) {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: var(--bg-secondary);
    border: 1px solid var(--primary-color);
    border-radius: 8px;
    padding: 12px 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 10px;
    animation: slideIn 0.3s ease;
  `;
  
  notification.innerHTML = `
    <div style="font-size: 20px;">💾</div>
    <div>
      <div style="font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 2px;">
        Auto-saved to Memory
      </div>
      <div style="font-size: 11px; color: var(--text-secondary);">
        ${title}
      </div>
    </div>
  `;
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * Save summary before page unload
 */
function saveBeforeUnload() {
  if (activityLog.length > 0) {
    console.log('🚪 [Auto-Memory] Page unloading, saving session...');
    // Use synchronous save or beacon API
    autoSaveSession();
  }
}

/**
 * Manual trigger to save current session
 */
export async function saveSessionNow() {
  console.log('🎯 [Auto-Memory] Manual save triggered');
  await autoSaveSession();
}

/**
 * Enable/disable auto-memory
 */
export function setAutoMemoryEnabled(enabled) {
  AUTO_MEMORY_CONFIG.ENABLED = enabled;
  console.log(`🤖 [Auto-Memory] ${enabled ? 'Enabled' : 'Disabled'}`);
  
  if (enabled && currentUser) {
    startActivityMonitoring();
  }
}

/**
 * Get current activity stats
 */
export function getActivityStats() {
  return {
    activityCount: activityLog.length,
    interactionCount,
    timeSinceLastSave: Date.now() - lastAutoSave,
    nextAutoSave: Math.max(0, AUTO_MEMORY_CONFIG.TIME_THRESHOLD - (Date.now() - lastAutoSave))
  };
}

// Initialize when auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    currentUser = session.user;
    initAutoMemory();
  } else if (event === 'SIGNED_OUT') {
    currentUser = null;
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer);
    }
  }
});
