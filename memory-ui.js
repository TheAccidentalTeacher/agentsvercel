// Phase 10: Memory & Knowledge Management UI
// Memory tab with search, filters, and display

import { supabase } from './supabase-client.js';
import { memoryDetailsModal } from './memory-details-modal.js';
import { MemoryAnalytics } from './memory-analytics.js';

// Memory UI state
let currentUser = null;
let searchResults = [];
let selectedFilters = {
  contentType: 'all',
  dateFrom: null,
  dateTo: null,
  tags: []
};

/**
 * Initialize Memory UI
 */
export async function initMemoryUI() {
  // console.log('🧠 [Memory UI] Initializing...');
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  currentUser = user;
  
  if (!currentUser) {
    console.warn('⚠️ [Memory UI] No user logged in');
    return;
  }
  
  // Create Memory tab content
  createMemoryTab();
  
  // Load initial memories
  await loadRecentMemories();
  
  // Listen for memory updates and deletions
  window.addEventListener('memory-updated', handleMemoryUpdate);
  window.addEventListener('memory-deleted', handleMemoryDelete);
  
  console.log('✅ [Memory UI] Initialized');
}

/**
 * Handle memory update from modal
 */
function handleMemoryUpdate(event) {
  console.log('🔄 [Memory UI] Memory updated, refreshing...', event.detail);
  // Refresh current view
  if (searchResults.length > 0) {
    performSearch(); // Re-run last search
  } else {
    loadRecentMemories(); // Reload recent
  }
}

/**
 * Handle memory deletion from modal
 */
function handleMemoryDelete(event) {
  console.log('🗑️ [Memory UI] Memory deleted, refreshing...', event.detail);
  // Remove from current results
  searchResults = searchResults.filter(m => m.id !== event.detail.memoryId);
  displaySearchResults(searchResults);
}

/**
 * Create Memory tab UI structure
 */
function createMemoryTab() {
  const aiPanel = document.querySelector('.ai-assistant-panel');
  if (!aiPanel) return;
  
  // Add Memory tab button
  const tabsContainer = aiPanel.querySelector('.ai-tabs');
  if (!tabsContainer) return;
  
  const memoryTab = document.createElement('button');
  memoryTab.className = 'ai-tab';
  memoryTab.setAttribute('data-tab', 'memory');
  memoryTab.innerHTML = '🧠 Memory';
  tabsContainer.appendChild(memoryTab);
  
  // Create Memory tab content
  const contentContainer = aiPanel.querySelector('.ai-content');
  if (!contentContainer) return;
  
  const memoryContent = document.createElement('div');
  memoryContent.className = 'ai-tab-content';
  memoryContent.id = 'memory-tab';
  memoryContent.style.display = 'none';
  
  memoryContent.innerHTML = `
    <div class="memory-container" style="display: flex; flex-direction: column; height: 100%; overflow: hidden;">
      <!-- Sub-tabs for Search and Graph -->
      <div class="memory-subtabs" style="display: flex; gap: 5px; padding: 10px 15px; border-bottom: 1px solid var(--border-color); background: var(--bg-secondary);">
        <button class="memory-subtab active" data-subtab="search" style="padding: 8px 16px; border: none; border-radius: 6px; background: var(--accent-color); color: white; font-size: 14px; font-weight: 500; cursor: pointer;">
          🔍 Search
        </button>
        <button class="memory-subtab" data-subtab="graph" style="padding: 8px 16px; border: none; border-radius: 6px; background: transparent; color: var(--text-secondary); font-size: 14px; font-weight: 500; cursor: pointer;">
          🔗 Graph
        </button>
        <button class="memory-subtab" data-subtab="analytics" style="padding: 8px 16px; border: none; border-radius: 6px; background: transparent; color: var(--text-secondary); font-size: 14px; font-weight: 500; cursor: pointer;">
          📊 Analytics
        </button>
      </div>
      
      <!-- Search View -->
      <div class="memory-subtab-content" id="memory-search-view" style="display: flex; flex-direction: column; flex: 1; overflow: hidden;">
        <!-- Search Section -->
        <div class="memory-search-section" style="padding: 15px; border-bottom: 1px solid var(--border-color);">
          <div style="display: flex; gap: 10px; margin-bottom: 12px;">
            <input 
              type="text" 
              id="memory-search-input" 
              placeholder="Search memories (semantic + keyword)..."
              style="flex: 1; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-secondary); color: var(--text-primary); font-size: 14px;"
            />
            <button 
              id="memory-search-btn" 
              class="btn-primary" 
              style="padding: 10px 20px; white-space: nowrap;"
            >
              🔍 Search
            </button>
          </div>
        
        <!-- Filters -->
        <div class="memory-filters" style="display: flex; gap: 10px; flex-wrap: wrap;">
          <select 
            id="memory-filter-type" 
            style="padding: 6px 10px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-secondary); color: var(--text-primary); font-size: 13px;"
          >
            <option value="all">All Types</option>
            <option value="research">📚 Research</option>
            <option value="video">🎥 Video</option>
            <option value="creative">🎨 Creative</option>
            <option value="conversation">💬 Chat</option>
            <option value="manual">📝 Manual</option>
          </select>
          
          <input 
            type="date" 
            id="memory-filter-date-from" 
            placeholder="From Date"
            style="padding: 6px 10px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-secondary); color: var(--text-primary); font-size: 13px;"
          />
          
          <input 
            type="date" 
            id="memory-filter-date-to" 
            placeholder="To Date"
            style="padding: 6px 10px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-secondary); color: var(--text-primary); font-size: 13px;"
          />
          
          <button 
            id="memory-clear-filters" 
            style="padding: 6px 12px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-secondary); color: var(--text-secondary); font-size: 13px; cursor: pointer;"
          >
            Clear Filters
          </button>
        </div>
        </div>
        
        <!-- Results Section -->
        <div class="memory-results-section" style="flex: 1; overflow-y: auto; padding: 15px;">
          <div id="memory-results-container">
            <!-- Memory cards will be inserted here -->
          </div>
          
          <!-- Empty State -->
          <div id="memory-empty-state" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary); text-align: center; padding: 40px;">
            <div style="font-size: 64px; margin-bottom: 20px;">🧠</div>
            <h3 style="margin: 0 0 10px 0; font-size: 18px; color: var(--text-primary);">No Memories Yet</h3>
            <p style="margin: 0 0 20px 0; font-size: 14px; max-width: 400px;">
              Save important information from Research, Video, Creative Studio, or Chat to build your knowledge base.
            </p>
            <p style="font-size: 13px; color: var(--text-secondary);">
              Use the "Save to Memory" buttons in other tabs to get started.
            </p>
          </div>
        </div>
      </div>
      
      <!-- Graph View -->
      <div class="memory-subtab-content" id="memory-graph-view" style="display: none; flex-direction: column; flex: 1; overflow: hidden;">
        <!-- Graph Controls -->
        <div class="memory-graph-controls" style="padding: 15px; border-bottom: 1px solid var(--border-color); display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
          <h3 style="margin: 0; font-size: 16px; color: var(--text-primary); flex: 1;">Knowledge Graph</h3>
          
          <!-- Filter Controls -->
          <select 
            id="graph-filter-type" 
            style="padding: 6px 10px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-secondary); color: var(--text-primary); font-size: 13px;"
          >
            <option value="all">All Types</option>
            <option value="research">📚 Research</option>
            <option value="video">🎥 Video</option>
            <option value="creative">🎨 Creative</option>
            <option value="conversation">💬 Chat</option>
            <option value="manual">📝 Manual</option>
          </select>
          
          <!-- Date Filters -->
          <input 
            type="date" 
            id="graph-filter-date-from" 
            placeholder="From Date"
            style="padding: 6px 10px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-secondary); color: var(--text-primary); font-size: 13px;"
            title="Filter memories from this date"
          />
          
          <input 
            type="date" 
            id="graph-filter-date-to" 
            placeholder="To Date"
            style="padding: 6px 10px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-secondary); color: var(--text-primary); font-size: 13px;"
            title="Filter memories until this date"
          />
          
          <!-- Auto-Connect Button -->
          <button 
            id="graph-auto-connect" 
            style="padding: 6px 12px; border: 1px solid var(--accent-color); border-radius: 4px; background: rgba(33, 150, 243, 0.1); color: var(--accent-color); font-size: 13px; cursor: pointer; font-weight: 500;"
            title="Automatically detect connections between memories"
          >
            🔗 Auto-Connect
          </button>
          
          <!-- Export Controls -->
          <button 
            id="graph-export-png" 
            style="padding: 6px 12px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-secondary); color: var(--text-secondary); font-size: 13px; cursor: pointer;"
            title="Export graph as PNG image"
          >
            📸 PNG
          </button>
          <button 
            id="graph-export-svg" 
            style="padding: 6px 12px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-secondary); color: var(--text-secondary); font-size: 13px; cursor: pointer;"
            title="Export graph as SVG"
          >
            📊 SVG
          </button>
          <button 
            id="graph-export-json" 
            style="padding: 6px 12px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-secondary); color: var(--text-secondary); font-size: 13px; cursor: pointer;"
            title="Export graph data as JSON"
          >
            💾 JSON
          </button>
        </div>
        
        <!-- Graph Container -->
        <div id="memory-graph-container" style="flex: 1; position: relative; background: white; overflow: hidden;">
          <!-- D3 graph will render here -->
        </div>
        
        <!-- Graph Legend -->
        <div class="memory-graph-legend" style="padding: 10px 15px; border-top: 1px solid var(--border-color); background: var(--bg-secondary); display: flex; gap: 15px; flex-wrap: wrap; font-size: 12px;">
          <div style="display: flex; align-items: center; gap: 5px;">
            <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #3b82f6;"></span>
            <span style="color: var(--text-secondary);">Research</span>
          </div>
          <div style="display: flex; align-items: center; gap: 5px;">
            <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #ef4444;"></span>
            <span style="color: var(--text-secondary);">Video</span>
          </div>
          <div style="display: flex; align-items: center; gap: 5px;">
            <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #a855f7;"></span>
            <span style="color: var(--text-secondary);">Creative</span>
          </div>
          <div style="display: flex; align-items: center; gap: 5px;">
            <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #10b981;"></span>
            <span style="color: var(--text-secondary);">Chat</span>
          </div>
          <div style="display: flex; align-items: center; gap: 5px;">
            <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #6b7280;"></span>
            <span style="color: var(--text-secondary);">Manual</span>
          </div>
          <div style="margin-left: auto; color: var(--text-secondary);">
            💡 <strong>Drag</strong> to move | <strong>Double-click</strong> to unpin | <strong>Hover</strong> to highlight | <strong>Click</strong> for details
          </div>
        </div>
      </div>
      
      <!-- Analytics View -->
      <div class="memory-subtab-content" id="memory-analytics-view" style="display: none; flex-direction: column; flex: 1; overflow: hidden;">
        <div id="memory-analytics-container" style="flex: 1; overflow-y: auto; background: var(--bg-primary);">
          <!-- Analytics dashboard will render here -->
          <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary);">
            <div style="text-align: center;">
              <div style="font-size: 48px; margin-bottom: 20px;">📊</div>
              <p>Loading analytics...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  contentContainer.appendChild(memoryContent);
  
  // Attach event listeners
  attachMemoryEventListeners();
  
  // Attach subtab switching
  attachSubtabListeners();
  
  // Attach graph event listeners
  attachGraphEventListeners();
}

/**
 * Attach event listeners for Memory UI
 */
function attachMemoryEventListeners() {
  // Search button
  const searchBtn = document.getElementById('memory-search-btn');
  const searchInput = document.getElementById('memory-search-input');
  
  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSearch();
    });
  }
  
  // Filter changes
  const typeFilter = document.getElementById('memory-filter-type');
  const dateFromFilter = document.getElementById('memory-filter-date-from');
  const dateToFilter = document.getElementById('memory-filter-date-to');
  
  if (typeFilter) {
    typeFilter.addEventListener('change', (e) => {
      selectedFilters.contentType = e.target.value;
      if (searchResults.length > 0) applyFilters();
    });
  }
  
  if (dateFromFilter) {
    dateFromFilter.addEventListener('change', (e) => {
      selectedFilters.dateFrom = e.target.value;
      if (searchResults.length > 0) applyFilters();
    });
  }
  
  if (dateToFilter) {
    dateToFilter.addEventListener('change', (e) => {
      selectedFilters.dateTo = e.target.value;
      if (searchResults.length > 0) applyFilters();
    });
  }
  
  // Clear filters
  const clearBtn = document.getElementById('memory-clear-filters');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearFilters);
  }
}

/**
 * Attach subtab switching listeners
 */
function attachSubtabListeners() {
  const subtabButtons = document.querySelectorAll('.memory-subtab');
  
  subtabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetSubtab = btn.getAttribute('data-subtab');
      
      // Update button states
      subtabButtons.forEach(b => {
        b.classList.remove('active');
        b.style.background = 'transparent';
        b.style.color = 'var(--text-secondary)';
      });
      btn.classList.add('active');
      btn.style.background = 'var(--accent-color)';
      btn.style.color = 'white';
      
      // Show/hide content
      const searchView = document.getElementById('memory-search-view');
      const graphView = document.getElementById('memory-graph-view');
      const analyticsView = document.getElementById('memory-analytics-view');
      
      if (targetSubtab === 'search') {
        searchView.style.display = 'flex';
        graphView.style.display = 'none';
        analyticsView.style.display = 'none';
      } else if (targetSubtab === 'graph') {
        searchView.style.display = 'none';
        graphView.style.display = 'flex';
        analyticsView.style.display = 'none';
        
        // Initialize graph on first view
        if (!window.memoryGraphInitialized) {
          initializeGraph();
          window.memoryGraphInitialized = true;
        }
      } else if (targetSubtab === 'analytics') {
        searchView.style.display = 'none';
        graphView.style.display = 'none';
        analyticsView.style.display = 'flex';
        
        // Initialize analytics on first view
        if (!window.memoryAnalyticsInitialized) {
          initializeAnalytics();
          window.memoryAnalyticsInitialized = true;
        }
      }
    });
  });
}

/**
 * Attach graph event listeners
 */
function attachGraphEventListeners() {
  // Type filter change
  const graphFilterType = document.getElementById('graph-filter-type');
  if (graphFilterType) {
    graphFilterType.addEventListener('change', async (e) => {
      const contentTypes = e.target.value === 'all' 
        ? ['research', 'video', 'creative', 'conversation', 'manual']
        : [e.target.value];
      
      if (window.MemoryGraph && currentUser) {
        await window.MemoryGraph.updateFilters({ contentTypes }, currentUser.id);
      }
    });
  }
  
  // Date filter changes
  const graphFilterDateFrom = document.getElementById('graph-filter-date-from');
  const graphFilterDateTo = document.getElementById('graph-filter-date-to');
  
  if (graphFilterDateFrom) {
    graphFilterDateFrom.addEventListener('change', async (e) => {
      if (window.MemoryGraph && currentUser) {
        await window.MemoryGraph.updateFilters({ dateFrom: e.target.value }, currentUser.id);
      }
    });
  }
  
  if (graphFilterDateTo) {
    graphFilterDateTo.addEventListener('change', async (e) => {
      if (window.MemoryGraph && currentUser) {
        await window.MemoryGraph.updateFilters({ dateTo: e.target.value }, currentUser.id);
      }
    });
  }
  
  // Auto-Connect button
  const autoConnectBtn = document.getElementById('graph-auto-connect');
  if (autoConnectBtn) {
    autoConnectBtn.addEventListener('click', async () => {
      if (!currentUser) {
        showToast('⚠️ Please sign in to use auto-connect', 'warning');
        return;
      }
      
      autoConnectBtn.disabled = true;
      autoConnectBtn.textContent = '⏳ Detecting connections...';
      
      try {
        const response = await fetch('/api/memory-auto-connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id })
        });
        
        if (!response.ok) {
          throw new Error(`Auto-connect failed: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.connectionsCreated === 0) {
          showToast('ℹ️ No new connections found', 'info');
        } else {
          showToast(`✅ Found ${result.connectionsCreated} new connections!`, 'success');
          
          // Reload graph to show new connections
          if (window.MemoryGraph && window.memoryGraphInitialized) {
            await window.MemoryGraph.init('memory-graph-container', currentUser.id);
          }
        }
      } catch (error) {
        console.error('Auto-connect error:', error);
        showToast('❌ Auto-connect failed: ' + error.message, 'error');
      } finally {
        autoConnectBtn.disabled = false;
        autoConnectBtn.textContent = '🔗 Auto-Connect';
      }
    });
  }
  
  // Export buttons
  const exportPng = document.getElementById('graph-export-png');
  const exportSvg = document.getElementById('graph-export-svg');
  const exportJson = document.getElementById('graph-export-json');
  
  if (exportPng) {
    exportPng.addEventListener('click', async () => {
      if (window.MemoryGraph) {
        exportPng.disabled = true;
        exportPng.textContent = '⏳ Exporting...';
        try {
          await window.MemoryGraph.exportPNG();
          showToast('✅ Graph exported as PNG', 'success');
        } catch (error) {
          showToast('❌ Export failed: ' + error.message, 'error');
        } finally {
          exportPng.disabled = false;
          exportPng.textContent = '📸 PNG';
        }
      } else {
        showToast('⚠️ Graph not initialized yet', 'warning');
      }
    });
  }
  
  if (exportSvg) {
    exportSvg.addEventListener('click', async () => {
      if (window.MemoryGraph) {
        exportSvg.disabled = true;
        exportSvg.textContent = '⏳ Exporting...';
        try {
          await window.MemoryGraph.exportSVG();
          showToast('✅ Graph exported as SVG', 'success');
        } catch (error) {
          showToast('❌ Export failed: ' + error.message, 'error');
        } finally {
          exportSvg.disabled = false;
          exportSvg.textContent = '📊 SVG';
        }
      } else {
        showToast('⚠️ Graph not initialized yet', 'warning');
      }
    });
  }
  
  if (exportJson) {
    exportJson.addEventListener('click', async () => {
      if (window.MemoryGraph) {
        exportJson.disabled = true;
        exportJson.textContent = '⏳ Exporting...';
        try {
          await window.MemoryGraph.exportJSON();
          showToast('✅ Graph data exported as JSON', 'success');
        } catch (error) {
          showToast('❌ Export failed: ' + error.message, 'error');
        } finally {
          exportJson.disabled = false;
          exportJson.textContent = '💾 JSON';
        }
      } else {
        showToast('⚠️ Graph not initialized yet', 'warning');
      }
    });
  }
}

/**
 * Show toast notification
 * @param {string} message - Toast message
 * @param {string} type - Toast type (success, error, warning, info)
 */
function showToast(message, type = 'info') {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `memory-toast ${type}`;
  
  // Toast icon based on type
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  toast.innerHTML = `
    <span class="memory-toast-icon">${icons[type] || icons.info}</span>
    <span class="memory-toast-message">${message}</span>
    <button class="memory-toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  
  document.body.appendChild(toast);
  
  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * Initialize knowledge graph visualization
 */
async function initializeGraph() {
  console.log('🔗 [Memory Graph] Initializing...');
  
  if (!currentUser) {
    console.warn('⚠️ [Memory Graph] No user logged in');
    return;
  }
  
  if (!window.MemoryGraph) {
    console.error('❌ [Memory Graph] MemoryGraph module not loaded');
    return;
  }
  
  try {
    await window.MemoryGraph.init('memory-graph-container', currentUser.id);
    console.log('✅ [Memory Graph] Initialized successfully');
  } catch (error) {
    console.error('❌ [Memory Graph] Initialization failed:', error);
  }
}

/**
 * Initialize analytics dashboard
 */
async function initializeAnalytics() {
  console.log('📊 [Memory Analytics] Initializing...');
  
  if (!currentUser) {
    console.warn('⚠️ [Memory Analytics] No user logged in');
    return;
  }
  
  const container = document.getElementById('memory-analytics-container');
  if (!container) {
    console.error('❌ [Memory Analytics] Container not found');
    return;
  }
  
  try {
    const analytics = new MemoryAnalytics(container);
    window.memoryAnalytics = analytics; // Store globally for access
    await analytics.fetchAnalyticsData(currentUser.id);
    await analytics.render();
    console.log('✅ [Memory Analytics] Initialized successfully');
  } catch (error) {
    console.error('❌ [Memory Analytics] Initialization failed:', error);
    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary);">
        <div style="text-align: center;">
          <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
          <h3 style="margin: 10px 0; color: var(--text-primary);">Analytics Error</h3>
          <p style="margin: 10px 0;">${error.message}</p>
          <button onclick="initializeAnalytics()" style="margin-top: 20px; padding: 10px 20px; background: var(--accent-color); color: white; border: none; border-radius: 6px; cursor: pointer;">
            Retry
          </button>
        </div>
      </div>
    `;
  }
}

/**
 * Handle memory search
 */
async function handleSearch() {
  const searchInput = document.getElementById('memory-search-input');
  const query = searchInput?.value.trim();
  
  if (!query) {
    alert('Please enter a search query');
    return;
  }
  
  if (!currentUser) {
    alert('Please sign in to search memories');
    return;
  }
  
  showLoadingState();
  
  try {
    // Call memory-search API
    const response = await fetch('/api/memory-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        userId: currentUser.id,
        limit: 50,
        filters: {
          contentType: selectedFilters.contentType !== 'all' ? selectedFilters.contentType : undefined,
          dateFrom: selectedFilters.dateFrom || undefined,
          dateTo: selectedFilters.dateTo || undefined
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    searchResults = data.results || [];
    
    console.log(`🔍 [Memory Search] Found ${searchResults.length} results`);
    displaySearchResults(searchResults);
    
  } catch (error) {
    console.error('❌ [Memory Search] Error:', error);
    showErrorState(error.message);
  }
}

/**
 * Load recent memories (default view)
 */
async function loadRecentMemories() {
  if (!currentUser) return;
  
  try {
    const { data, error } = await supabase
      .from('memory_entries')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) throw error;
    
    searchResults = data || [];
    
    if (searchResults.length === 0) {
      showEmptyState();
    } else {
      displaySearchResults(searchResults);
    }
    
  } catch (error) {
    console.error('❌ [Load Recent] Error:', error);
    showErrorState(error.message);
  }
}

/**
 * Display search results
 */
function displaySearchResults(results) {
  const container = document.getElementById('memory-results-container');
  const emptyState = document.getElementById('memory-empty-state');
  
  if (!container) return;
  
  // Hide empty state
  if (emptyState) emptyState.style.display = 'none';
  
  // Clear container
  container.innerHTML = '';
  
  if (results.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
        <div style="font-size: 48px; margin-bottom: 15px;">🔍</div>
        <h4 style="margin: 0 0 8px 0; font-size: 16px; color: var(--text-primary);">No Results Found</h4>
        <p style="margin: 0; font-size: 14px;">Try a different search query or adjust your filters.</p>
      </div>
    `;
    return;
  }
  
  // Create memory cards
  results.forEach(memory => {
    const card = createMemoryCard(memory);
    container.appendChild(card);
  });
}

/**
 * Create a memory card element
 */
function createMemoryCard(memory) {
  const card = document.createElement('div');
  card.className = 'memory-card';
  card.style.cssText = `
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  `;
  
  // Type icon
  const typeIcons = {
    research: '📚',
    video: '🎥',
    creative: '🎨',
    conversation: '💬',
    manual: '📝'
  };
  
  const typeIcon = typeIcons[memory.content_type] || '📝';
  
  // Format date
  const date = new Date(memory.created_at);
  const formattedDate = date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  
  // Truncate content
  const contentPreview = memory.content.length > 200 
    ? memory.content.substring(0, 200) + '...' 
    : memory.content;
  
  // Similarity score (if available)
  const scoreHtml = memory.combined_score 
    ? `<span style="margin-left: 10px; padding: 2px 8px; background: var(--primary-color); color: white; border-radius: 10px; font-size: 11px; font-weight: 600;">
         ${Math.round(memory.combined_score * 100)}% match
       </span>`
    : '';
  
  card.innerHTML = `
    <div style="display: flex; align-items: start; gap: 12px;">
      <div style="font-size: 24px;">${typeIcon}</div>
      <div style="flex: 1; min-width: 0;">
        <div style="display: flex; align-items: center; margin-bottom: 6px;">
          <h4 style="margin: 0; font-size: 15px; font-weight: 600; color: var(--text-primary);">
            ${escapeHtml(memory.title)}
          </h4>
          ${scoreHtml}
        </div>
        <p style="margin: 0 0 10px 0; font-size: 13px; color: var(--text-secondary); line-height: 1.5;">
          ${escapeHtml(contentPreview)}
        </p>
        <div style="display: flex; align-items: center; gap: 15px; font-size: 12px; color: var(--text-secondary);">
          <span>📅 ${formattedDate}</span>
          <span style="text-transform: capitalize;">${memory.content_type}</span>
          ${memory.source_url ? `<a href="${memory.source_url}" target="_blank" style="color: var(--primary-color); text-decoration: none;">🔗 Source</a>` : ''}
        </div>
      </div>
    </div>
  `;
  
  // Hover effect
  card.addEventListener('mouseenter', () => {
    card.style.background = 'var(--bg-tertiary)';
    card.style.borderColor = 'var(--primary-color)';
  });
  
  card.addEventListener('mouseleave', () => {
    card.style.background = 'var(--bg-secondary)';
    card.style.borderColor = 'var(--border-color)';
  });
  
  // Click to expand
  card.addEventListener('click', () => showMemoryDetails(memory));
  
  return card;
}

/**
 * Show detailed memory view (modal)
 */
async function showMemoryDetails(memory) {
  console.log('📖 [Memory Details] Opening modal for:', memory.title);
  
  try {
    // Fetch connections for this memory
    const { data: connections, error } = await supabase
      .from('memory_connections')
      .select(`
        connection_strength,
        target_memory_id,
        target:user_memories!target_memory_id(*)
      `)
      .eq('source_memory_id', memory.id)
      .order('connection_strength', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Error fetching connections:', error);
      // Show modal without connections
      memoryDetailsModal.show(memory, []);
      return;
    }
    
    // Format connections for modal
    const formattedConnections = (connections || []).map(conn => ({
      ...conn.target,
      connection_strength: conn.connection_strength
    }));
    
    // Show modal with connections
    memoryDetailsModal.show(memory, formattedConnections);
    
  } catch (err) {
    console.error('❌ Error opening memory details:', err);
    // Fallback to showing without connections
    memoryDetailsModal.show(memory, []);
  }
}

/**
 * Apply filters to current results
 */
function applyFilters() {
  let filtered = [...searchResults];
  
  // Filter by content type
  if (selectedFilters.contentType !== 'all') {
    filtered = filtered.filter(m => m.content_type === selectedFilters.contentType);
  }
  
  // Filter by date range
  if (selectedFilters.dateFrom) {
    const fromDate = new Date(selectedFilters.dateFrom);
    filtered = filtered.filter(m => new Date(m.created_at) >= fromDate);
  }
  
  if (selectedFilters.dateTo) {
    const toDate = new Date(selectedFilters.dateTo);
    toDate.setHours(23, 59, 59, 999); // End of day
    filtered = filtered.filter(m => new Date(m.created_at) <= toDate);
  }
  
  displaySearchResults(filtered);
}

/**
 * Clear all filters
 */
function clearFilters() {
  selectedFilters = {
    contentType: 'all',
    dateFrom: null,
    dateTo: null,
    tags: []
  };
  
  document.getElementById('memory-filter-type').value = 'all';
  document.getElementById('memory-filter-date-from').value = '';
  document.getElementById('memory-filter-date-to').value = '';
  
  if (searchResults.length > 0) {
    displaySearchResults(searchResults);
  }
}

/**
 * Show loading state
 */
function showLoadingState() {
  const container = document.getElementById('memory-results-container');
  if (!container) return;
  
  container.innerHTML = `
    <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
      <div class="loading-spinner" style="margin: 0 auto 20px;"></div>
      <p style="margin: 0; font-size: 14px;">Searching memories...</p>
    </div>
  `;
}

/**
 * Show empty state
 */
function showEmptyState() {
  const container = document.getElementById('memory-results-container');
  const emptyState = document.getElementById('memory-empty-state');
  
  if (container) container.innerHTML = '';
  if (emptyState) emptyState.style.display = 'flex';
}

/**
 * Show error state
 */
function showErrorState(message) {
  const container = document.getElementById('memory-results-container');
  if (!container) return;
  
  container.innerHTML = `
    <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
      <div style="font-size: 48px; margin-bottom: 15px; color: var(--danger-color);">⚠️</div>
      <h4 style="margin: 0 0 8px 0; font-size: 16px; color: var(--text-primary);">Error Loading Memories</h4>
      <p style="margin: 0; font-size: 14px;">${escapeHtml(message)}</p>
    </div>
  `;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Add "Save to Memory" button to a container
 */
export function addSaveToMemoryButton(container, contentData) {
  const button = document.createElement('button');
  button.className = 'btn-secondary';
  button.innerHTML = '💾 Save to Memory';
  button.style.cssText = 'padding: 8px 16px; font-size: 13px;';
  
  button.addEventListener('click', async () => {
    await saveToMemory(contentData);
  });
  
  container.appendChild(button);
  return button;
}

/**
 * Save content to memory
 */
async function saveToMemory(contentData) {
  if (!currentUser) {
    alert('Please sign in to save memories');
    return;
  }
  
  try {
    const response = await fetch('/api/memory-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        contentType: contentData.contentType,
        title: contentData.title,
        content: contentData.content,
        metadata: contentData.metadata || {},
        sourceUrl: contentData.sourceUrl || null,
        autoGenerateTags: true
      })
    });
    
    if (!response.ok) {
      throw new Error(`Save failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log('✅ [Memory Saved]', result);
    alert(`✅ Memory saved: "${contentData.title}"`);
    
    // Reload memories if Memory tab is active
    const memoryTab = document.getElementById('memory-tab');
    if (memoryTab && memoryTab.style.display !== 'none') {
      await loadRecentMemories();
    }
    
  } catch (error) {
    console.error('❌ [Save Memory] Error:', error);
    alert(`❌ Failed to save: ${error.message}`);
  }
}

// Initialize when auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    currentUser = session.user;
    initMemoryUI();
  } else if (event === 'SIGNED_OUT') {
    currentUser = null;
  }
});
