/**
 * Document Upload & Management UI
 * Phase 11 Week 1-2: Document Intelligence
 * 
 * Features:
 * - Upload PDF, DOCX, TXT, EPUB files
 * - Drag & drop interface
 * - File validation and size limits
 * - Document list with preview
 * - Delete and manage documents
 */

import { supabase } from './supabase-client.js';

// State
let currentUser = null;
let uploadedDocuments = [];

/**
 * Initialize Document Upload UI
 */
export async function initDocumentUpload() {
  // console.log('📄 [Document Upload] Initializing...');
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  currentUser = user;
  
  if (!currentUser) {
    console.warn('⚠️ [Document Upload] No user logged in');
    return;
  }
  
  // Create Documents tab
  createDocumentsTab();
  
  // Load existing documents
  await loadDocuments();
  
  // console.log('✅ [Document Upload] Initialized');
}

/**
 * Create Documents tab in AI panel
 */
function createDocumentsTab() {
  // Find the tabs container
  const tabsContainer = document.querySelector('.ai-tabs');
  if (!tabsContainer) {
    console.error('❌ [Document Upload] Could not find .ai-tabs container');
    return;
  }
  
  // Check if Documents tab already exists
  const existingTab = tabsContainer.querySelector('[data-tab="documents"]');
  if (existingTab) {
    // console.log('ℹ️ [Document Upload] Documents tab already exists, skipping creation');
    return;
  }
  
  // Add Documents tab button (using ai-tab-btn class to match existing tabs)
  const docsTab = document.createElement('button');
  docsTab.className = 'ai-tab-btn';
  docsTab.setAttribute('data-tab', 'documents');
  docsTab.innerHTML = '📄 Documents';
  
  // Insert after Video tab
  const videoTab = tabsContainer.querySelector('[data-tab="video"]');
  if (videoTab) {
    videoTab.after(docsTab);
  } else {
    tabsContainer.appendChild(docsTab);
  }
  
  // Find the content container (parent of chat-tab)
  const chatTab = document.getElementById('chat-tab');
  if (!chatTab || !chatTab.parentElement) {
    console.error('❌ [Document Upload] Could not find tab content container');
    return;
  }
  
  const contentContainer = chatTab.parentElement;
  
  // Check if Documents tab content already exists
  const existingContent = document.getElementById('documents-tab');
  if (existingContent) {
    console.log('ℹ️ [Document Upload] Documents tab content already exists, skipping creation');
    return;
  }
  
  const docsContent = document.createElement('div');
  docsContent.className = 'ai-tab-content';
  docsContent.id = 'documents-tab';
  docsContent.style.display = 'none';
  
  docsContent.innerHTML = `
    <div class="documents-container" style="display: flex; flex-direction: column; height: 100%; overflow: hidden;">
      <!-- Header -->
      <div class="documents-header" style="padding: 20px; border-bottom: 1px solid var(--border-color); background: var(--bg-secondary);">
        <h2 style="margin: 0 0 8px 0; font-size: 20px; color: var(--text-primary);">📄 Document Intelligence</h2>
        <p style="margin: 0; font-size: 14px; color: var(--text-secondary);">Upload and chat with your documents (PDF, Word, text files)</p>
      </div>
      
      <!-- Upload Area -->
      <div class="upload-section" style="padding: 20px; border-bottom: 1px solid var(--border-color);">
        <div id="drop-zone" class="drop-zone" style="
          border: 2px dashed var(--border-color);
          border-radius: 12px;
          padding: 40px;
          text-align: center;
          background: var(--bg-primary);
          transition: all 0.3s ease;
          cursor: pointer;
        ">
          <div class="drop-zone-content" style="pointer-events: none;">
            <div style="font-size: 48px; margin-bottom: 16px; cursor: pointer;">📁</div>
            <h3 style="margin: 0 0 8px 0; color: var(--text-primary);">Drop files here or click to browse</h3>
            <p style="margin: 0 0 12px 0; color: var(--text-secondary); font-size: 14px;">
              Supported: PDF, Word (.docx), Text (.txt), ePub
            </p>
            <p style="margin: 0; color: var(--text-secondary); font-size: 12px;">
              Maximum file size: 10 MB
            </p>
          </div>
          <input 
            type="file" 
            id="file-input" 
            accept=".pdf,.docx,.txt,.epub" 
            multiple
            style="display: none;"
          />
        </div>
        
        <!-- Upload Progress -->
        <div id="upload-progress" style="display: none; margin-top: 16px;">
          <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
            <div class="spinner" style="width: 20px; height: 20px; border: 3px solid var(--border-color); border-top-color: var(--accent-color); border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <div style="flex: 1;">
              <div id="upload-filename" style="font-size: 14px; color: var(--text-primary); margin-bottom: 4px;"></div>
              <div id="upload-status" style="font-size: 12px; color: var(--text-secondary);"></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Documents List -->
      <div class="documents-list-section" style="flex: 1; overflow-y: auto; padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="margin: 0; font-size: 16px; color: var(--text-primary);">Your Documents</h3>
          <span id="document-count" style="font-size: 14px; color: var(--text-secondary);">0 documents</span>
        </div>
        
        <div id="documents-list" class="documents-list">
          <!-- Documents will be rendered here -->
        </div>
        
        <!-- Empty State -->
        <div id="documents-empty" class="documents-empty" style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
          <div style="font-size: 64px; margin-bottom: 16px; opacity: 0.5;">📚</div>
          <h3 style="margin: 0 0 8px 0; color: var(--text-primary);">No documents yet</h3>
          <p style="margin: 0; font-size: 14px;">Upload a document to get started</p>
        </div>
      </div>
    </div>
  `;
  
  contentContainer.appendChild(docsContent);
  
  // Attach event listeners
  attachDocumentEventListeners();
}

/**
 * Attach event listeners for document upload
 */
function attachDocumentEventListeners() {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  
  if (!dropZone || !fileInput) return;
  
  // Click to open file picker
  dropZone.addEventListener('click', () => {
    fileInput.click();
  });
  
  // File input change
  fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  });
  
  // Drag and drop events
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.style.borderColor = 'var(--accent-color)';
    dropZone.style.background = 'var(--bg-secondary)';
  });
  
  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.style.borderColor = 'var(--border-color)';
    dropZone.style.background = 'var(--bg-primary)';
  });
  
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.style.borderColor = 'var(--border-color)';
    dropZone.style.background = 'var(--bg-primary)';
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  });
}

/**
 * Handle file upload
 */
async function handleFiles(files) {
  console.log('📤 [Upload] Processing files:', files.length);
  
  // Validate files
  const validFiles = files.filter(file => validateFile(file));
  
  if (validFiles.length === 0) {
    alert('❌ No valid files selected. Please upload PDF, Word, text, or ePub files under 10 MB.');
    return;
  }
  
  // Upload each file
  for (const file of validFiles) {
    await uploadFile(file);
  }
  
  // Reload documents list
  await loadDocuments();
}

/**
 * Validate file type and size
 */
function validateFile(file) {
  const validTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/epub+zip'
  ];
  
  const validExtensions = ['.pdf', '.docx', '.txt', '.epub'];
  const extension = '.' + file.name.split('.').pop().toLowerCase();
  
  // Check type and extension
  if (!validTypes.includes(file.type) && !validExtensions.includes(extension)) {
    console.warn('⚠️ Invalid file type:', file.name, file.type);
    return false;
  }
  
  // Check size (10 MB limit)
  const maxSize = 10 * 1024 * 1024; // 10 MB
  if (file.size > maxSize) {
    console.warn('⚠️ File too large:', file.name, file.size);
    alert(`❌ File "${file.name}" is too large. Maximum size is 10 MB.`);
    return false;
  }
  
  return true;
}

/**
 * Upload file to server
 */
async function uploadFile(file) {
  const progressDiv = document.getElementById('upload-progress');
  const filenameDiv = document.getElementById('upload-filename');
  const statusDiv = document.getElementById('upload-status');
  
  try {
    // Show progress
    progressDiv.style.display = 'block';
    filenameDiv.textContent = file.name;
    statusDiv.textContent = 'Uploading...';
    
    console.log('📤 [Upload] Starting upload:', file.name);
    
    // Create FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', currentUser.id);
    formData.append('filename', file.name);
    formData.append('fileType', file.type);
    formData.append('fileSize', file.size);
    
    // Upload to server
    const response = await fetch('/api/document-upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
    
    const result = await response.json();
    
    console.log('✅ [Upload] Success:', result);
    
    // Extract document ID from response (it's in result.document.id)
    const documentId = result.document?.id || result.documentId;
    console.log('📋 [Upload] Document ID:', documentId);
    
    // Check if documentId exists
    if (!documentId) {
      console.error('❌ [Upload] No documentId in response:', result);
      statusDiv.textContent = 'Upload succeeded but no ID returned';
      await new Promise(resolve => setTimeout(resolve, 2000));
      progressDiv.style.display = 'none';
      await loadDocuments();
      return;
    }
    
    // Update status
    statusDiv.textContent = 'Extracting text...';
    
    // Trigger document processing
    try {
      console.log('🔄 [Process] Sending request with documentId:', documentId);
      const processResponse = await fetch('/api/document-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: documentId })
      });
      
      console.log('📥 [Process] Response status:', processResponse.status);
      
      if (processResponse.ok) {
        const processResult = await processResponse.json();
        console.log('✅ [Process] Text extracted:', processResult);
        statusDiv.textContent = `✅ Processed: ${processResult.wordCount} words`;
      } else {
        const errorData = await processResponse.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ [Process] Processing failed:', processResponse.status, errorData);
        statusDiv.textContent = `Processing failed: ${errorData.error || 'Unknown error'}`;
      }
    } catch (processError) {
      console.error('❌ [Process] Exception:', processError);
      statusDiv.textContent = 'Uploaded (processing pending)';
    }
    
    // Wait a moment to show success
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Hide progress
    progressDiv.style.display = 'none';
    
    // Reload documents to show updated status
    await loadDocuments();
    
    // Show success notification
    showNotification(`✅ Uploaded: ${file.name}`, 'success');
    
  } catch (error) {
    console.error('❌ [Upload] Error:', error);
    statusDiv.textContent = `Error: ${error.message}`;
    
    setTimeout(() => {
      progressDiv.style.display = 'none';
    }, 3000);
    
    showNotification(`❌ Upload failed: ${file.name}`, 'error');
  }
}

/**
 * Load user's documents from database
 */
async function loadDocuments() {
  try {
    // console.log('📚 [Documents] Loading...');
    
    const { data, error } = await supabase
      .from('user_documents')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    uploadedDocuments = data || [];
    
    // console.log('✅ [Documents] Loaded:', uploadedDocuments.length);
    
    // Update UI
    renderDocumentsList();
    
  } catch (error) {
    console.error('❌ [Documents] Load error:', error);
  }
}

/**
 * Render documents list
 */
function renderDocumentsList() {
  const listContainer = document.getElementById('documents-list');
  const emptyState = document.getElementById('documents-empty');
  const countSpan = document.getElementById('document-count');
  
  if (!listContainer) return;
  
  // Update count
  countSpan.textContent = `${uploadedDocuments.length} document${uploadedDocuments.length !== 1 ? 's' : ''}`;
  
  // Show/hide empty state
  if (uploadedDocuments.length === 0) {
    emptyState.style.display = 'block';
    listContainer.style.display = 'none';
    return;
  }
  
  emptyState.style.display = 'none';
  listContainer.style.display = 'block';
  
  // Render documents
  listContainer.innerHTML = uploadedDocuments.map(doc => `
    <div class="document-card" data-doc-id="${doc.id}" style="
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      transition: all 0.2s;
      cursor: pointer;
    ">
      <div style="display: flex; align-items: start; gap: 12px;">
        <div style="font-size: 32px;">${getFileIcon(doc.file_type)}</div>
        <div style="flex: 1; min-width: 0;">
          <h4 style="margin: 0 0 4px 0; font-size: 14px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${doc.filename}
          </h4>
          <div style="display: flex; gap: 12px; font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
            <span>${formatFileSize(doc.file_size)}</span>
            <span>•</span>
            <span>${formatDate(doc.created_at)}</span>
            ${doc.word_count ? `<span>•</span><span>${doc.word_count.toLocaleString()} words</span>` : ''}
          </div>
          <div style="font-size: 12px;">
            ${getStatusBadge(doc.processing_status, doc.page_count)}
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button 
            class="doc-chat-btn" 
            data-doc-id="${doc.id}"
            style="padding: 6px 12px; border: 1px solid var(--accent-color); border-radius: 6px; background: transparent; color: var(--accent-color); font-size: 12px; cursor: pointer;"
            title="Chat with this document"
            ${doc.processing_status !== 'completed' ? 'disabled opacity: 0.5;' : ''}
          >
            💬 Chat
          </button>
          <button 
            class="doc-delete-btn" 
            data-doc-id="${doc.id}"
            style="padding: 6px 12px; border: 1px solid #ef4444; border-radius: 6px; background: transparent; color: #ef4444; font-size: 12px; cursor: pointer;"
            title="Delete document"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  `).join('');
  
  // Attach click handlers
  attachDocumentCardListeners();
}

/**
 * Attach event listeners to document cards
 */
function attachDocumentCardListeners() {
  // Chat buttons
  document.querySelectorAll('.doc-chat-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const docId = btn.getAttribute('data-doc-id');
      startDocumentChat(docId);
    });
  });
  
  // Delete buttons
  document.querySelectorAll('.doc-delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const docId = btn.getAttribute('data-doc-id');
      deleteDocument(docId);
    });
  });
  
  // Card click (view details)
  document.querySelectorAll('.document-card').forEach(card => {
    card.addEventListener('click', () => {
      const docId = card.getAttribute('data-doc-id');
      viewDocumentDetails(docId);
    });
  });
}

/**
 * Get file icon based on type
 */
function getFileIcon(fileType) {
  if (fileType.includes('pdf')) return '📕';
  if (fileType.includes('word') || fileType.includes('document')) return '📘';
  if (fileType.includes('text')) return '📄';
  if (fileType.includes('epub')) return '📚';
  return '📄';
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Format date
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

/**
 * Start chat with document
 */
function startDocumentChat(docId) {
  const doc = uploadedDocuments.find(d => d.id === docId);
  if (!doc) return;
  
  console.log('💬 [Chat] Starting chat with:', doc.filename);
  
  // TODO: Implement document chat (Week 2)
  alert(`💬 Chat with "${doc.filename}" - Coming in Week 2!`);
}

/** * Get status badge HTML
 */
function getStatusBadge(status, pageCount) {
  const badges = {
    pending: '<span style="display: inline-block; padding: 2px 8px; background: #f59e0b; color: white; border-radius: 4px; font-size: 11px;">⏳ Pending</span>',
    processing: '<span style="display: inline-block; padding: 2px 8px; background: #3b82f6; color: white; border-radius: 4px; font-size: 11px;">⚡ Processing...</span>',
    completed: `<span style="display: inline-block; padding: 2px 8px; background: #10b981; color: white; border-radius: 4px; font-size: 11px;">✅ Ready${pageCount ? ' • ' + pageCount + ' pages' : ''}</span>`,
    error: '<span style="display: inline-block; padding: 2px 8px; background: #ef4444; color: white; border-radius: 4px; font-size: 11px;">❌ Error</span>'
  };
  
  return badges[status] || badges.pending;
}

/** * View document details
 */
function viewDocumentDetails(docId) {
  const doc = uploadedDocuments.find(d => d.id === docId);
  if (!doc) return;
  
  console.log('👁️ [View] Document details:', doc);
  
  // TODO: Implement document viewer (Week 2)
  alert(`👁️ View "${doc.filename}" - Coming in Week 2!`);
}

/**
 * Delete document
 */
async function deleteDocument(docId) {
  const doc = uploadedDocuments.find(d => d.id === docId);
  if (!doc) return;
  
  if (!confirm(`Delete "${doc.filename}"?`)) return;
  
  try {
    console.log('🗑️ [Delete] Deleting:', doc.filename);
    
    const { error } = await supabase
      .from('user_documents')
      .delete()
      .eq('id', docId);
    
    if (error) throw error;
    
    console.log('✅ [Delete] Success');
    
    showNotification(`🗑️ Deleted: ${doc.filename}`, 'success');
    
    // Reload documents
    await loadDocuments();
    
  } catch (error) {
    console.error('❌ [Delete] Error:', error);
    showNotification('❌ Delete failed', 'error');
  }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
  // Use existing toast notification system
  if (window.showToast) {
    window.showToast(message);
  } else {
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
}

// Initialize when auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    currentUser = session.user;
    initDocumentUpload();
  } else if (event === 'SIGNED_OUT') {
    currentUser = null;
  }
});
