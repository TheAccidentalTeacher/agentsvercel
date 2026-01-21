/**
 * ResearchMemory - Hybrid localStorage + Supabase research session management
 * 
 * Phase 7: Multi-Device Cloud Sync
 * 
 * Architecture:
 * - Save to localStorage INSTANTLY (no waiting, works offline)
 * - Auto-sync to Supabase in background (cloud backup, multi-device access)
 * - Load from Supabase first (get latest from any device)
 * - Fallback to localStorage if offline or error
 * 
 * Benefits:
 * - ⚡ Instant saves (no network delay)
 * - ☁️ Cloud backup (never lose data)
 * - 📱 Multi-device access (desktop, laptop, tablet, mobile)
 * - 🔄 Real-time sync across devices
 * - ⚠️ Works offline (localStorage fallback)
 */

import { 
  supabase, 
  isAuthenticated, 
  getUserId,
  isOnline,
  setSyncStatus,
  SyncStatus
} from './supabase-client.js';

export class ResearchMemory {
  constructor() {
    // localStorage keys
    this.storageKey = 'ucas-research-sessions';
    this.syncQueueKey = 'ucas-sync-queue';
    this.lastSyncKey = 'ucas-last-sync';
    
    // Limits
    this.maxSessions = 50; // localStorage limit
    
    // Sync state
    this.syncInProgress = false;
    this.syncQueue = this.loadSyncQueue();
    
    // Auto-sync every 30 seconds if changes pending
    this.startAutoSync();
  }

  /**
   * Save a research session (hybrid: localStorage + Supabase queue)
   */
  async save(sessionData) {
    try {
      const session = {
        id: `research_${Date.now()}`,
        query: sessionData.query,
        timestamp: new Date().toISOString(),
        personas: sessionData.personas || [],
        results: sessionData.results || [],
        extractedContent: sessionData.extractedContent || [],
        chunks: sessionData.chunks || [],
        analysis: sessionData.analysis || null,
        metadata: {
          resultCount: sessionData.results?.length || 0,
          extractedCount: sessionData.extractedContent?.filter(e => !e.error).length || 0,
          analysisCount: sessionData.analysis?.analyses?.length || 0,
          duration: sessionData.metadata?.duration || 0
        }
      };

      // 1. Save to localStorage IMMEDIATELY (instant, no waiting)
      const sessions = this.listLocal();
      sessions.unshift(session);
      if (sessions.length > this.maxSessions) {
        sessions.splice(this.maxSessions);
      }
      localStorage.setItem(this.storageKey, JSON.stringify(sessions));
      console.log(`💾 localStorage: Saved ${session.id}`);

      // 2. Queue for Supabase sync (background, async)
      if (isAuthenticated()) {
        this.addToSyncQueue({ action: 'save', session });
        this.syncToSupabase(); // Start sync (non-blocking)
      } else {
        console.log('⚠️ Not authenticated - localStorage only (will sync after login)');
      }

      return session.id;

    } catch (error) {
      console.error('❌ Error saving research session:', error);
      
      if (error.name === 'QuotaExceededError') {
        console.warn('⚠️ localStorage quota exceeded - removing oldest sessions');
        this.cleanup();
        return this.save(sessionData);
      }
      
      throw error;
    }
  }

  /**
   * Load a specific research session (Supabase first, localStorage fallback)
   */
  async load(sessionId) {
    try {
      // 1. Try Supabase first (get latest from any device)
      if (isAuthenticated() && isOnline()) {
        const { data, error } = await supabase
          .from('research_sessions')
          .select('*')
          .eq('id', sessionId)
          .is('deleted_at', null)
          .single();

        if (!error && data) {
          console.log(`☁️ Supabase: Loaded ${sessionId}`);
          return this.mapSupabaseToLocal(data);
        }

        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
          console.error('⚠️ Supabase load error:', error);
        }
      }

      // 2. Fallback to localStorage
      const sessions = this.listLocal();
      const session = sessions.find(s => s.id === sessionId);

      if (!session) {
        console.warn(`⚠️ Session not found: ${sessionId}`);
        return null;
      }

      console.log(`📂 localStorage: Loaded ${sessionId}`);
      return session;

    } catch (error) {
      console.error('❌ Error loading research session:', error);
      return null;
    }
  }

  /**
   * List all research sessions (Supabase first, localStorage fallback)
   */
  async list() {
    try {
      // 1. Try Supabase first (get latest from any device)
      if (isAuthenticated() && isOnline()) {
        const { data, error } = await supabase
          .from('research_sessions')
          .select('*')
          .is('deleted_at', null)
          .order('timestamp', { ascending: false });

        if (!error && data) {
          console.log(`☁️ Supabase: Loaded ${data.length} sessions`);
          return data.map(s => this.mapSupabaseToLocal(s));
        }

        if (error) {
          console.error('⚠️ Supabase list error:', error);
        }
      }

      // 2. Fallback to localStorage
      return this.listLocal();

    } catch (error) {
      console.error('❌ Error listing research sessions:', error);
      return this.listLocal();
    }
  }

  /**
   * List sessions from localStorage only (internal use)
   */
  listLocal() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) {
        return [];
      }

      const sessions = JSON.parse(data);
      
      // Sort by timestamp (newest first)
      sessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return sessions;

    } catch (error) {
      console.error('❌ Error listing research sessions:', error);
      return [];
    }
  }

  /**
   * Delete a specific research session (soft delete in Supabase)
   */
  async delete(sessionId) {
    try {
      // 1. Delete from localStorage immediately
      let sessions = this.listLocal();
      const initialLength = sessions.length;
      sessions = sessions.filter(s => s.id !== sessionId);

      if (sessions.length === initialLength) {
        console.warn(`⚠️ Session not found for deletion: ${sessionId}`);
        return false;
      }

      localStorage.setItem(this.storageKey, JSON.stringify(sessions));
      console.log(`🗑️ localStorage: Deleted ${sessionId}`);

      // 2. Queue for Supabase sync (soft delete)
      if (isAuthenticated()) {
        this.addToSyncQueue({ action: 'delete', sessionId });
        this.syncToSupabase(); // Start sync (non-blocking)
      }

      return true;

    } catch (error) {
      console.error('❌ Error deleting research session:', error);
      return false;
    }
  }

  /**
   * Delete all research sessions
   */
  clear() {
    try {
      localStorage.removeItem(this.storageKey);
      console.log('🗑️ All research sessions cleared');
      return true;
    } catch (error) {
      console.error('❌ Error clearing research sessions:', error);
      return false;
    }
  }

  /**
   * Get session count (Supabase first, localStorage fallback)
   */
  async count() {
    if (isAuthenticated() && isOnline()) {
      try {
        const { count, error } = await supabase
          .from('research_sessions')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null);

        if (!error) {
          return count || 0;
        }
      } catch (error) {
        console.error('⚠️ Supabase count error:', error);
      }
    }

    return this.listLocal().length;
  }

  /**
   * Get storage usage estimate (Supabase first, localStorage fallback)
   */
  async getStorageSize() {
    // Supabase storage usage
    if (isAuthenticated() && isOnline()) {
      try {
        const { data, error } = await supabase.rpc('get_storage_usage', {
          target_user_id: getUserId()
        });

        if (!error && data !== null) {
          const sizeBytes = data;
          const sizeKB = (sizeBytes / 1024).toFixed(2);
          const sizeMB = (sizeBytes / 1024 / 1024).toFixed(2);

          return {
            bytes: sizeBytes,
            kb: sizeKB,
            mb: sizeMB,
            formatted: sizeBytes > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`,
            source: 'supabase'
          };
        }
      } catch (error) {
        console.error('⚠️ Supabase storage error:', error);
      }
    }

    // localStorage fallback
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return { bytes: 0, kb: 0, mb: 0, formatted: '0 KB', source: 'localStorage' };

      const sizeBytes = new Blob([data]).size;
      const sizeKB = (sizeBytes / 1024).toFixed(2);
      const sizeMB = (sizeBytes / 1024 / 1024).toFixed(2);

      return {
        bytes: sizeBytes,
        kb: sizeKB,
        mb: sizeMB,
        formatted: sizeBytes > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`,
        source: 'localStorage'
      };

    } catch (error) {
      console.error('❌ Error calculating storage size:', error);
      return { bytes: 0, kb: 0, mb: 0, formatted: '0 KB', source: 'error' };
    }
  }

  /**
   * Cleanup old sessions when quota exceeded
   */
  cleanup() {
    try {
      let sessions = this.list();
      
      // Keep only 25% of sessions (remove oldest 75%)
      const keepCount = Math.floor(this.maxSessions * 0.25);
      sessions = sessions.slice(0, keepCount);

      localStorage.setItem(this.storageKey, JSON.stringify(sessions));
      console.log(`🧹 Cleaned up old sessions - kept ${sessions.length} most recent`);

    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      // Last resort: clear everything
      this.clear();
    }
  }

  /**
   * Export session as Markdown
   */
  exportMarkdown(session) {
    if (!session) return '';

    let md = `# Research: ${session.query}\n\n`;
    md += `**Date**: ${new Date(session.timestamp).toLocaleString()}\n`;
    md += `**Personas**: ${session.personas.join(', ') || 'All 12'}\n\n`;

    // Analysis Synthesis
    if (session.analysis?.synthesis?.report) {
      md += `## Executive Summary\n\n`;
      md += `${session.analysis.synthesis.report}\n\n`;
    }

    // Individual Analyses
    if (session.analysis?.analyses?.length > 0) {
      md += `## Expert Analyses\n\n`;
      session.analysis.analyses.forEach(analysis => {
        md += `### ${analysis.icon} ${analysis.name}\n`;
        md += `**Focus**: ${analysis.focus}\n\n`;
        md += `${analysis.analysis}\n\n`;
        md += `---\n\n`;
      });
    }

    // Extracted Content
    if (session.extractedContent?.length > 0) {
      md += `## Extracted Content\n\n`;
      session.extractedContent.forEach((content, i) => {
        if (!content.error) {
          md += `### ${i + 1}. ${content.title}\n`;
          md += `**URL**: ${content.url}\n`;
          if (content.author) md += `**Author**: ${content.author}\n`;
          if (content.publishedDate) md += `**Published**: ${content.publishedDate}\n`;
          md += `**Word Count**: ${content.wordCount}\n\n`;
          md += `${content.excerpt || content.content.substring(0, 500)}...\n\n`;
        }
      });
    }

    // Search Results
    if (session.results?.length > 0) {
      md += `## Search Results\n\n`;
      session.results.forEach((result, i) => {
        md += `${i + 1}. **[${result.title}](${result.url})**\n`;
        md += `   ${result.snippet}\n`;
        md += `   *Source: ${result.sources?.join(', ') || result.source}* • Score: ${result.relevanceScore?.toFixed(1) || 'N/A'}\n\n`;
      });
    }

    md += `---\n\n`;
    md += `*Generated by UCAS Research Engine • ${new Date().toLocaleString()}*\n`;

    return md;
  }

  /**
   * Export session as JSON
   */
  exportJSON(session) {
    if (!session) return '';
    return JSON.stringify(session, null, 2);
  }

  /**
   * Get recent sessions (last N)
   */
  async getRecent(count = 10) {
    const sessions = await this.list();
    return sessions.slice(0, count);
  }

  /**
   * Search sessions by query text (Supabase full-text search first, localStorage fallback)
   */
  async search(searchText) {
    // Supabase full-text search
    if (isAuthenticated() && isOnline()) {
      try {
        const { data, error } = await supabase.rpc('search_research', {
          target_user_id: getUserId(),
          search_query: searchText
        });

        if (!error && data) {
          console.log(`☁️ Supabase: Found ${data.length} results for "${searchText}"`);
          return data.map(s => this.mapSupabaseToLocal(s));
        }
      } catch (error) {
        console.error('⚠️ Supabase search error:', error);
      }
    }

    // localStorage fallback
    const sessions = this.listLocal();
    const lowerSearch = searchText.toLowerCase();

    return sessions.filter(session => 
      session.query.toLowerCase().includes(lowerSearch)
    );
  }

  // ============================================================================
  // SUPABASE SYNC METHODS
  // ============================================================================

  /**
   * Sync localStorage to Supabase (background, non-blocking)
   */
  async syncToSupabase() {
    // Don't sync if already in progress, offline, or not authenticated
    if (this.syncInProgress || !isOnline() || !isAuthenticated()) {
      return;
    }

    try {
      this.syncInProgress = true;
      setSyncStatus(SyncStatus.SYNCING);

      const queue = this.loadSyncQueue();
      if (queue.length === 0) {
        setSyncStatus(SyncStatus.SYNCED);
        this.syncInProgress = false;
        return;
      }

      console.log(`🔄 Syncing ${queue.length} operations to Supabase...`);

      // Process queue
      for (const operation of queue) {
        try {
          if (operation.action === 'save') {
            await this.syncSaveToSupabase(operation.session);
          } else if (operation.action === 'delete') {
            await this.syncDeleteToSupabase(operation.sessionId);
          }
        } catch (error) {
          console.error('⚠️ Sync operation failed:', operation, error);
          // Continue with other operations
        }
      }

      // Clear queue on success
      this.clearSyncQueue();
      this.updateLastSync();
      setSyncStatus(SyncStatus.SYNCED);
      console.log('✅ Sync complete');

    } catch (error) {
      console.error('❌ Sync error:', error);
      setSyncStatus(SyncStatus.ERROR);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync a save operation to Supabase
   */
  async syncSaveToSupabase(session) {
    const supabaseSession = this.mapLocalToSupabase(session);

    const { error } = await supabase
      .from('research_sessions')
      .upsert(supabaseSession, { onConflict: 'id' });

    if (error) {
      throw error;
    }

    console.log(`☁️ Supabase: Synced ${session.id}`);
  }

  /**
   * Sync a delete operation to Supabase (soft delete)
   */
  async syncDeleteToSupabase(sessionId) {
    const { error } = await supabase
      .from('research_sessions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (error) {
      throw error;
    }

    console.log(`☁️ Supabase: Soft deleted ${sessionId}`);
  }

  /**
   * Pull all sessions from Supabase and merge with localStorage
   */
  async pullFromSupabase() {
    if (!isAuthenticated() || !isOnline()) {
      console.warn('⚠️ Cannot pull from Supabase - offline or not authenticated');
      return;
    }

    try {
      setSyncStatus(SyncStatus.SYNCING);

      const { data, error } = await supabase
        .from('research_sessions')
        .select('*')
        .is('deleted_at', null)
        .order('timestamp', { ascending: false });

      if (error) {
        throw error;
      }

      // console.log(`☁️ Supabase: Pulled ${data.length} sessions`);

      // Merge with localStorage (Supabase wins on conflicts)
      const localSessions = this.listLocal();
      const supabaseSessions = data.map(s => this.mapSupabaseToLocal(s));

      // Create merged list (deduplicate by ID, prefer Supabase version)
      const mergedMap = new Map();

      localSessions.forEach(s => mergedMap.set(s.id, s));
      supabaseSessions.forEach(s => mergedMap.set(s.id, s)); // Overwrites local

      const merged = Array.from(mergedMap.values());
      merged.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Save merged list to localStorage
      if (merged.length > this.maxSessions) {
        merged.splice(this.maxSessions);
      }
      localStorage.setItem(this.storageKey, JSON.stringify(merged));

      this.updateLastSync();
      setSyncStatus(SyncStatus.SYNCED);
      // console.log(`✅ Merged ${merged.length} sessions (${supabaseSessions.length} from cloud, ${localSessions.length} from local)`);

    } catch (error) {
      console.error('❌ Pull error:', error);
      setSyncStatus(SyncStatus.ERROR);
    }
  }

  /**
   * Full sync: Pull from Supabase, then push any local changes
   */
  async fullSync() {
    await this.pullFromSupabase();
    await this.syncToSupabase();
  }

  // ============================================================================
  // SYNC QUEUE MANAGEMENT
  // ============================================================================

  /**
   * Add operation to sync queue
   */
  addToSyncQueue(operation) {
    const queue = this.loadSyncQueue();
    queue.push(operation);
    localStorage.setItem(this.syncQueueKey, JSON.stringify(queue));
  }

  /**
   * Load sync queue from localStorage
   */
  loadSyncQueue() {
    try {
      const data = localStorage.getItem(this.syncQueueKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ Error loading sync queue:', error);
      return [];
    }
  }

  /**
   * Clear sync queue
   */
  clearSyncQueue() {
    localStorage.setItem(this.syncQueueKey, JSON.stringify([]));
  }

  /**
   * Update last sync timestamp
   */
  updateLastSync() {
    localStorage.setItem(this.lastSyncKey, new Date().toISOString());
  }

  /**
   * Get last sync timestamp
   */
  getLastSync() {
    const timestamp = localStorage.getItem(this.lastSyncKey);
    return timestamp ? new Date(timestamp) : null;
  }

  /**
   * Start auto-sync timer (every 30 seconds)
   */
  startAutoSync() {
    setInterval(() => {
      if (this.loadSyncQueue().length > 0) {
        this.syncToSupabase();
      }
    }, 30000); // 30 seconds
  }

  // ============================================================================
  // DATA MAPPING (localStorage ↔ Supabase)
  // ============================================================================

  /**
   * Map localStorage format to Supabase format
   */
  mapLocalToSupabase(session) {
    return {
      id: session.id,
      user_id: getUserId(),
      query: session.query,
      timestamp: session.timestamp,
      personas: session.personas,
      results: session.results,
      extracted_content: session.extractedContent,
      chunks: session.chunks,
      analysis: session.analysis,
      metadata: session.metadata
    };
  }

  /**
   * Map Supabase format to localStorage format
   */
  mapSupabaseToLocal(session) {
    return {
      id: session.id,
      query: session.query,
      timestamp: session.timestamp,
      personas: session.personas || [],
      results: session.results || [],
      extractedContent: session.extracted_content || [],
      chunks: session.chunks || [],
      analysis: session.analysis || null,
      metadata: session.metadata || {}
    };
  }
}
