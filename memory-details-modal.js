/**
 * Memory Details Modal - Phase 10 Week 3 Days 15-17
 * 
 * Features:
 * - View full memory content (no truncation)
 * - Edit mode: Modify title, content, tags, type
 * - Delete with confirmation
 * - Connection visualization (linked memories)
 * - Export: Markdown, JSON, TXT
 * - Metadata display: Dates, content type, similarity score
 * 
 * @module memory-details-modal
 */

import { supabase } from './supabase-client.js';

class MemoryDetailsModal {
  constructor() {
    this.currentMemory = null;
    this.isEditMode = false;
    this.modal = null;
    this.connections = [];
    
    this.init();
  }

  /**
   * Initialize modal
   */
  init() {
    this.createModal();
    this.attachEventListeners();
    console.log('✅ [Memory Details] Modal initialized');
  }

  /**
   * Create modal DOM structure
   */
  createModal() {
    const modalHTML = `
      <div id="memory-details-modal" class="modal-overlay" style="display: none;">
        <div class="modal-container memory-details-container">
          <!-- Header -->
          <div class="modal-header">
            <h2 id="memory-title-display">Memory Details</h2>
            <div class="modal-header-actions">
              <button id="memory-edit-toggle" class="btn-icon" title="Edit memory">✏️</button>
              <button id="memory-export-menu" class="btn-icon" title="Export memory">📥</button>
              <button id="memory-delete-btn" class="btn-icon btn-danger" title="Delete memory">🗑️</button>
              <button id="memory-close-btn" class="btn-icon" title="Close">×</button>
            </div>
          </div>

          <!-- Content -->
          <div class="modal-content">
            <!-- View Mode -->
            <div id="memory-view-mode" class="memory-view-section">
              <!-- Metadata -->
              <div class="memory-metadata">
                <div class="metadata-item">
                  <span class="metadata-label">Type:</span>
                  <span id="memory-type-display" class="metadata-value"></span>
                </div>
                <div class="metadata-item">
                  <span class="metadata-label">Created:</span>
                  <span id="memory-created-display" class="metadata-value"></span>
                </div>
                <div class="metadata-item">
                  <span class="metadata-label">Modified:</span>
                  <span id="memory-modified-display" class="metadata-value"></span>
                </div>
                <div class="metadata-item">
                  <span class="metadata-label">Similarity:</span>
                  <span id="memory-similarity-display" class="metadata-value"></span>
                </div>
              </div>

              <!-- Tags -->
              <div class="memory-tags-container">
                <h4>Tags</h4>
                <div id="memory-tags-display" class="tags-list"></div>
              </div>

              <!-- Content -->
              <div class="memory-content-container">
                <h4>Content</h4>
                <div id="memory-content-display" class="memory-content-text"></div>
              </div>

              <!-- Connections -->
              <div class="memory-connections-container">
                <h4>Connected Memories (<span id="connections-count">0</span>)</h4>
                <div id="memory-connections-list" class="connections-list"></div>
              </div>
            </div>

            <!-- Edit Mode -->
            <div id="memory-edit-mode" class="memory-edit-section" style="display: none;">
              <div class="form-group">
                <label for="memory-title-input">Title</label>
                <input type="text" id="memory-title-input" class="form-input" placeholder="Memory title...">
              </div>

              <div class="form-group">
                <label for="memory-type-input">Type</label>
                <select id="memory-type-input" class="form-select">
                  <option value="research">📚 Research</option>
                  <option value="video">📺 Video</option>
                  <option value="creative">🎨 Creative</option>
                  <option value="conversation">💬 Conversation</option>
                  <option value="manual">📝 Manual</option>
                </select>
              </div>

              <div class="form-group">
                <label for="memory-tags-input">Tags (comma-separated)</label>
                <input type="text" id="memory-tags-input" class="form-input" placeholder="tag1, tag2, tag3...">
              </div>

              <div class="form-group">
                <label for="memory-content-input">Content</label>
                <textarea id="memory-content-input" class="form-textarea" rows="15" placeholder="Memory content..."></textarea>
              </div>

              <div class="form-actions">
                <button id="memory-save-btn" class="btn btn-primary">💾 Save Changes</button>
                <button id="memory-cancel-btn" class="btn btn-secondary">Cancel</button>
              </div>
            </div>
          </div>

          <!-- Export Menu (hidden dropdown) -->
          <div id="export-menu" class="dropdown-menu" style="display: none;">
            <button class="dropdown-item" data-format="markdown">📝 Export as Markdown</button>
            <button class="dropdown-item" data-format="json">📊 Export as JSON</button>
            <button class="dropdown-item" data-format="txt">📄 Export as Text</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = document.getElementById('memory-details-modal');
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Close button
    document.getElementById('memory-close-btn').addEventListener('click', () => this.close());

    // Edit toggle
    document.getElementById('memory-edit-toggle').addEventListener('click', () => this.toggleEditMode());

    // Save changes
    document.getElementById('memory-save-btn').addEventListener('click', () => this.saveChanges());

    // Cancel edit
    document.getElementById('memory-cancel-btn').addEventListener('click', () => this.toggleEditMode(false));

    // Delete button
    document.getElementById('memory-delete-btn').addEventListener('click', () => this.deleteMemory());

    // Export menu toggle
    document.getElementById('memory-export-menu').addEventListener('click', (e) => {
      const menu = document.getElementById('export-menu');
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
      e.stopPropagation();
    });

    // Export format buttons
    document.querySelectorAll('#export-menu .dropdown-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const format = e.currentTarget.dataset.format;
        this.exportMemory(format);
        document.getElementById('export-menu').style.display = 'none';
      });
    });

    // Click outside modal to close
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    // Click outside export menu to close
    document.addEventListener('click', (e) => {
      const menu = document.getElementById('export-menu');
      const exportBtn = document.getElementById('memory-export-menu');
      if (!menu.contains(e.target) && e.target !== exportBtn) {
        menu.style.display = 'none';
      }
    });
  }

  /**
   * Show modal with memory data
   * @param {Object} memory - Memory object with all fields
   * @param {Array} connections - Connected memories
   */
  async show(memory, connections = []) {
    this.currentMemory = memory;
    this.connections = connections;
    this.isEditMode = false;

    // Populate view mode
    this.populateViewMode();

    // Show modal
    this.modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    console.log('📖 [Memory Details] Showing memory:', memory.id);
  }

  /**
   * Populate view mode with memory data
   */
  populateViewMode() {
    const memory = this.currentMemory;

    // Title
    document.getElementById('memory-title-display').textContent = memory.title || 'Untitled Memory';

    // Metadata
    const typeIcons = {
      research: '📚',
      video: '📺',
      creative: '🎨',
      conversation: '💬',
      manual: '📝'
    };
    document.getElementById('memory-type-display').innerHTML = 
      `${typeIcons[memory.content_type] || '📝'} ${memory.content_type || 'manual'}`;
    
    document.getElementById('memory-created-display').textContent = 
      new Date(memory.created_at).toLocaleString();
    
    document.getElementById('memory-modified-display').textContent = 
      new Date(memory.updated_at || memory.created_at).toLocaleString();
    
    if (memory.similarity_score !== undefined) {
      document.getElementById('memory-similarity-display').textContent = 
        `${Math.round(memory.similarity_score * 100)}%`;
    } else {
      document.getElementById('memory-similarity-display').textContent = 'N/A';
    }

    // Tags
    const tagsContainer = document.getElementById('memory-tags-display');
    if (memory.tags && memory.tags.length > 0) {
      tagsContainer.innerHTML = memory.tags.map(tag => 
        `<span class="tag">${tag}</span>`
      ).join('');
    } else {
      tagsContainer.innerHTML = '<span class="text-muted">No tags</span>';
    }

    // Content
    document.getElementById('memory-content-display').textContent = memory.content;

    // Connections
    this.populateConnections();
  }

  /**
   * Populate connections list
   */
  populateConnections() {
    const container = document.getElementById('memory-connections-list');
    const countSpan = document.getElementById('connections-count');
    
    countSpan.textContent = this.connections.length;

    if (this.connections.length === 0) {
      container.innerHTML = '<p class="text-muted">No connected memories</p>';
      return;
    }

    const connectionsHTML = this.connections.map(conn => {
      const typeIcons = {
        research: '📚',
        video: '📺',
        creative: '🎨',
        conversation: '💬',
        manual: '📝'
      };
      
      return `
        <div class="connection-card" data-memory-id="${conn.id}">
          <div class="connection-icon">${typeIcons[conn.content_type] || '📝'}</div>
          <div class="connection-info">
            <div class="connection-title">${conn.title || 'Untitled'}</div>
            <div class="connection-meta">
              ${conn.content_type} • ${new Date(conn.created_at).toLocaleDateString()}
            </div>
          </div>
          <div class="connection-strength">
            ${Math.round((conn.connection_strength || 0) * 100)}%
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = connectionsHTML;

    // Add click handlers to connection cards
    container.querySelectorAll('.connection-card').forEach(card => {
      card.addEventListener('click', async () => {
        const memoryId = card.dataset.memoryId;
        const memory = this.connections.find(c => c.id === memoryId);
        if (memory) {
          // Fetch connections for this memory
          const conns = await this.fetchConnections(memoryId);
          this.show(memory, conns);
        }
      });
    });
  }

  /**
   * Fetch connections for a memory
   */
  async fetchConnections(memoryId) {
    try {
      const { data, error } = await supabase
        .from('memory_connections')
        .select(`
          source_memory_id,
          target_memory_id,
          connection_type,
          connection_strength,
          source:user_memories!source_memory_id(*),
          target:user_memories!target_memory_id(*)
        `)
        .or(`source_memory_id.eq.${memoryId},target_memory_id.eq.${memoryId}`);

      if (error) throw error;

      // Format connections (get the "other" memory in each connection)
      return data.map(conn => {
        const isSource = conn.source_memory_id === memoryId;
        const otherMemory = isSource ? conn.target : conn.source;
        return {
          ...otherMemory,
          connection_strength: conn.connection_strength
        };
      });
    } catch (error) {
      console.error('❌ [Memory Details] Failed to fetch connections:', error);
      return [];
    }
  }

  /**
   * Toggle edit mode
   */
  toggleEditMode(enable = null) {
    this.isEditMode = enable !== null ? enable : !this.isEditMode;

    const viewMode = document.getElementById('memory-view-mode');
    const editMode = document.getElementById('memory-edit-mode');

    if (this.isEditMode) {
      // Switch to edit mode
      viewMode.style.display = 'none';
      editMode.style.display = 'block';

      // Populate edit fields
      document.getElementById('memory-title-input').value = this.currentMemory.title || '';
      document.getElementById('memory-type-input').value = this.currentMemory.content_type || 'manual';
      document.getElementById('memory-tags-input').value = (this.currentMemory.tags || []).join(', ');
      document.getElementById('memory-content-input').value = this.currentMemory.content || '';
    } else {
      // Switch to view mode
      viewMode.style.display = 'block';
      editMode.style.display = 'none';
    }
  }

  /**
   * Save changes
   */
  async saveChanges() {
    const title = document.getElementById('memory-title-input').value.trim();
    const contentType = document.getElementById('memory-type-input').value;
    const tagsInput = document.getElementById('memory-tags-input').value;
    const content = document.getElementById('memory-content-input').value.trim();

    // Validate
    if (!content) {
      alert('Content cannot be empty');
      return;
    }

    // Parse tags
    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    try {
      // Update memory
      const { error } = await supabase
        .from('user_memories')
        .update({
          title,
          content_type: contentType,
          content,
          tags,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.currentMemory.id);

      if (error) throw error;

      // Update current memory object
      this.currentMemory = {
        ...this.currentMemory,
        title,
        content_type: contentType,
        content,
        tags,
        updated_at: new Date().toISOString()
      };

      // Refresh view mode
      this.populateViewMode();
      this.toggleEditMode(false);

      // Show success message
      this.showToast('✅ Memory updated successfully');

      // Trigger refresh in parent components
      window.dispatchEvent(new CustomEvent('memory-updated', { 
        detail: { memoryId: this.currentMemory.id } 
      }));

      console.log('✅ [Memory Details] Memory updated:', this.currentMemory.id);
    } catch (error) {
      console.error('❌ [Memory Details] Failed to save changes:', error);
      alert('Failed to save changes: ' + error.message);
    }
  }

  /**
   * Delete memory with confirmation
   */
  async deleteMemory() {
    const confirmed = confirm(
      `Are you sure you want to delete this memory?\n\n"${this.currentMemory.title || 'Untitled'}"\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      // Delete memory
      const { error } = await supabase
        .from('user_memories')
        .delete()
        .eq('id', this.currentMemory.id);

      if (error) throw error;

      // Show success message
      this.showToast('✅ Memory deleted successfully');

      // Trigger refresh in parent components
      window.dispatchEvent(new CustomEvent('memory-deleted', { 
        detail: { memoryId: this.currentMemory.id } 
      }));

      // Close modal
      this.close();

      console.log('✅ [Memory Details] Memory deleted:', this.currentMemory.id);
    } catch (error) {
      console.error('❌ [Memory Details] Failed to delete memory:', error);
      alert('Failed to delete memory: ' + error.message);
    }
  }

  /**
   * Export memory in specified format
   */
  exportMemory(format) {
    let content, filename, mimeType;

    switch (format) {
      case 'markdown':
        content = this.exportAsMarkdown();
        filename = `memory-${this.currentMemory.id}.md`;
        mimeType = 'text/markdown';
        break;

      case 'json':
        content = this.exportAsJSON();
        filename = `memory-${this.currentMemory.id}.json`;
        mimeType = 'application/json';
        break;

      case 'txt':
        content = this.exportAsText();
        filename = `memory-${this.currentMemory.id}.txt`;
        mimeType = 'text/plain';
        break;

      default:
        console.error('Unknown export format:', format);
        return;
    }

    // Create download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showToast(`✅ Exported as ${format.toUpperCase()}`);
    console.log('📥 [Memory Details] Exported as', format);
  }

  /**
   * Export as Markdown
   */
  exportAsMarkdown() {
    const m = this.currentMemory;
    return `# ${m.title || 'Untitled Memory'}

**Type:** ${m.content_type}  
**Created:** ${new Date(m.created_at).toLocaleString()}  
**Modified:** ${new Date(m.updated_at || m.created_at).toLocaleString()}  
**Tags:** ${(m.tags || []).join(', ') || 'None'}

---

## Content

${m.content}

---

## Connected Memories (${this.connections.length})

${this.connections.map(conn => 
  `- [${conn.content_type}] ${conn.title || 'Untitled'} (${Math.round((conn.connection_strength || 0) * 100)}%)`
).join('\n')}
`;
  }

  /**
   * Export as JSON
   */
  exportAsJSON() {
    return JSON.stringify({
      ...this.currentMemory,
      connections: this.connections.map(conn => ({
        id: conn.id,
        title: conn.title,
        content_type: conn.content_type,
        created_at: conn.created_at,
        connection_strength: conn.connection_strength
      }))
    }, null, 2);
  }

  /**
   * Export as plain text
   */
  exportAsText() {
    const m = this.currentMemory;
    return `${m.title || 'Untitled Memory'}

Type: ${m.content_type}
Created: ${new Date(m.created_at).toLocaleString()}
Modified: ${new Date(m.updated_at || m.created_at).toLocaleString()}
Tags: ${(m.tags || []).join(', ') || 'None'}

---

${m.content}

---

Connected Memories (${this.connections.length}):

${this.connections.map(conn => 
  `- [${conn.content_type}] ${conn.title || 'Untitled'} (${Math.round((conn.connection_strength || 0) * 100)}%)`
).join('\n')}
`;
  }

  /**
   * Show toast notification
   */
  showToast(message) {
    // Reuse existing toast system if available
    if (window.showToast) {
      window.showToast(message);
    } else {
      // Fallback: simple alert
      console.log(message);
    }
  }

  /**
   * Close modal
   */
  close() {
    this.modal.style.display = 'none';
    document.body.style.overflow = '';
    this.isEditMode = false;
    document.getElementById('export-menu').style.display = 'none';
  }
}

// Create singleton instance
const memoryDetailsModal = new MemoryDetailsModal();

// Export for use in other modules
export { memoryDetailsModal };

// Also expose globally for easy access
window.memoryDetailsModal = memoryDetailsModal;
