// Phase 11 Week 2: Multi-File Upload & Management
// Handles document upload, file cards, quick actions

class MultiFileHandler {
    constructor() {
        this.attachedFiles = [];
        this.maxFiles = 20;
        this.maxFileSize = 20 * 1024 * 1024; // 20 MB per file
        this.maxTotalWords = 100000; // Monica parity
        this.currentWordCount = 0;
        
        this.init();
    }
    
    init() {
        // File input handling
        const docInput = document.getElementById('document-input');
        const clearAllBtn = document.getElementById('clear-all-files');
        
        // Note: attach-document-btn is handled by chat-attachments.js
        // It triggers docInput.click() which fires our change event
        
        if (docInput) {
            docInput.addEventListener('change', (e) => this.handleFileSelection(e));
            // console.log('📎 [MultiFile] File input listener attached');
        }
        
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.clearAllFiles());
        }
    }
    
    async handleFileSelection(event) {
        const files = Array.from(event.target.files || []);
        console.log(`[MultiFile] Selected ${files.length} files`);
        
        // Check total file limit
        if (this.attachedFiles.length + files.length > this.maxFiles) {
            this.showError(`Maximum ${this.maxFiles} files allowed. You have ${this.attachedFiles.length} files already attached.`);
            return;
        }
        
        // Process each file
        for (const file of files) {
            await this.processAndAttachFile(file);
        }
        
        // Clear input for next selection
        event.target.value = '';
        
        // Update UI
        this.updateFileCardsDisplay();
    }
    
    async processAndAttachFile(file) {
        // Validate file size
        if (file.size > this.maxFileSize) {
            this.showError(`File "${file.name}" exceeds 20 MB limit`);
            return;
        }
        
        // Validate file type
        const validTypes = ['.pdf', '.docx', '.doc', '.txt', '.xlsx', '.xls', '.jpg', '.jpeg', '.png', '.gif'];
        const fileExt = '.' + file.name.split('.').pop().toLowerCase();
        if (!validTypes.includes(fileExt)) {
            this.showError(`File type "${fileExt}" not supported`);
            return;
        }
        
        try {
            // For text files, read directly
            let extractedText = null;
            if (file.type === 'text/plain') {
                extractedText = await file.text();
            }
            
            // Client-side metadata (will be replaced by server extraction)
            const metadata = await this.extractFileMetadata(file);
            
            console.log(`[MultiFile] Processing ${file.name}...`);
            
            // Add to attached files (text will be extracted server-side before sending to AI)
            const fileData = {
                id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                file: file,
                name: file.name,
                size: file.size,
                type: file.type,
                extractedText: extractedText, // Only set for .txt files
                ...metadata
            };
            
            this.attachedFiles.push(fileData);
            this.currentWordCount += metadata.wordCount;
            
            console.log(`[MultiFile] ✓ Attached: ${file.name}`);
            
            // For binary files, start extraction immediately in background
            if (metadata.needsExtraction) {
                this.extractFileInBackground(fileData);
            }
        } catch (error) {
            console.error(`[MultiFile] Error processing ${file.name}:`, error);
            this.showError(`Failed to process "${file.name}": ${error.message}`);
        }
    }
    
    async extractFileMetadata(file) {
        // Quick client-side metadata extraction
        const sizeKB = (file.size / 1024).toFixed(2);
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        const sizeDisplay = file.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;
        
        // Estimate page count and word count (rough estimates for UI display)
        // Real extraction happens server-side - don't show fake estimates
        let pageCount = '?';
        let wordCount = null; // null = pending extraction
        
        // Only for plain text files can we extract immediately
        if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
            const text = await file.text();
            wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
            pageCount = Math.max(1, Math.ceil(wordCount / 500));
        }
        // For binary files (PDF, DOCX, images), wordCount remains null until server extraction
        
        return {
            sizeDisplay,
            pageCount,
            wordCount, // Can be null (pending), number (extracted), or 0 (failed)
            needsExtraction: wordCount === null // Flag for UI to show "Extracting..." state
        };
    }
    
    createFileCard(fileData) {
        const card = document.createElement('div');
        card.className = 'file-card';
        card.dataset.fileId = fileData.id;
        
        // File icon based on type
        let icon = '\ud83d\udcc4'; // Default document icon
        if (fileData.type.includes('pdf')) icon = '\ud83d\udcdd';
        else if (fileData.type.includes('word')) icon = '\ud83d\udcc3';
        else if (fileData.type.includes('spreadsheet') || fileData.type.includes('excel')) icon = '\ud83d\udcc8';
        else if (fileData.type.startsWith('image/')) icon = '\ud83d\uddbc\ufe0f';
        
        card.innerHTML = `
            <div class="file-card-icon">${icon}</div>
            <div class="file-card-info">
                <div class="file-card-name" title="${fileData.name}">${fileData.name}</div>
                <div class="file-card-meta">${fileData.sizeDisplay} • ${this.getWordCountDisplay(fileData)} • ${fileData.pageCount} pages</div>
            </div>
            <div class="file-card-actions">
                <button class="quick-action-btn" data-action="summarize" title="Summarize key points">
                    \ud83d\udcca Summarize
                </button>
                <button class="quick-action-btn" data-action="analyze" title="Comprehensive analysis">
                    \ud83d\udd0d Analyze
                </button>
                <button class="file-remove-btn" title="Remove file">×</button>
            </div>
        `;
        
        // Attach event listeners
        const removeBtn = card.querySelector('.file-remove-btn');
        removeBtn.addEventListener('click', () => this.removeFile(fileData.id));
        
        const summarizeBtn = card.querySelector('[data-action="summarize"]');
        summarizeBtn.addEventListener('click', () => this.executeQuickAction('summarize', fileData));
        
        const analyzeBtn = card.querySelector('[data-action="analyze"]');
        analyzeBtn.addEventListener('click', () => this.executeQuickAction('analyze', fileData));
        
        return card;
    }
    
    getWordCountDisplay(fileData) {
        if (fileData.extracting) {
            return '<span style="color: #ffa500;">⏳ Extracting...</span>';
        }
        if (fileData.extractionError) {
            return `<span style="color: #f44336;">⚠️ ${fileData.extractionError}</span>`;
        }
        if (fileData.needsExtraction) {
            return '<span style="color: #888;">Ready to extract</span>';
        }
        if (fileData.wordCount === null || fileData.wordCount === undefined) {
            return '<span style="color: #888;">? words</span>';
        }
        if (fileData.wordCount === 0) {
            return '<span style="color: #f44336;">⚠️ No text</span>';
        }
        return `${fileData.wordCount.toLocaleString()} words`;
    }
    
    async extractFileInBackground(fileData) {
        console.log(`[MultiFile] Background extraction started for ${fileData.name}`);
        
        // Update UI to show extraction in progress
        fileData.extracting = true;
        this.updateFileCardDisplay(fileData);
        
        try {
            const formData = new FormData();
            formData.append('files', fileData.file);
            
            const response = await fetch('/api/extract-documents', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Server extraction failed: ${response.status}`);
            }
            
            const result = await response.json();
            const extracted = result.files[0];
            
            if (extracted && extracted.success) {
                fileData.extractedText = extracted.text;
                fileData.wordCount = extracted.wordCount;
                fileData.pageCount = extracted.pageCount || fileData.pageCount;
                fileData.needsExtraction = false;
                fileData.extracting = false;
                
                console.log(`[MultiFile] ✓ Background extraction complete: ${fileData.name} - ${extracted.wordCount} words`);
                this.updateFileCardDisplay(fileData);
            } else {
                throw new Error(extracted?.error || 'Extraction failed');
            }
        } catch (error) {
            console.error(`[MultiFile] Background extraction failed for ${fileData.name}:`, error);
            fileData.extracting = false;
            fileData.extractionError = error.message;
            this.updateFileCardDisplay(fileData);
        }
    }
    
    updateFileCardDisplay(fileData) {
        // Find the card element for this file
        const cards = document.querySelectorAll('.file-card');
        for (const card of cards) {
            const nameElement = card.querySelector('.file-card-name');
            if (nameElement && nameElement.textContent === fileData.name) {
                // Update the meta display
                const metaElement = card.querySelector('.file-card-meta');
                if (metaElement) {
                    metaElement.innerHTML = `${fileData.sizeDisplay} • ${this.getWordCountDisplay(fileData)} • ${fileData.pageCount} pages`;
                    console.log(`[MultiFile] Updated card display for ${fileData.name}: ${fileData.wordCount} words`);
                }
                break;
            }
        }
    }
    
    updateFileCardsDisplay() {
        console.log('[DEBUG] updateFileCardsDisplay called');
        console.log('[DEBUG] attachedFiles.length:', this.attachedFiles.length);
        
        const container = document.getElementById('file-cards-container');
        const listElement = document.getElementById('file-cards-list');
        const countElement = document.getElementById('file-count');
        
        console.log('[DEBUG] container found:', !!container);
        console.log('[DEBUG] listElement found:', !!listElement);
        console.log('[DEBUG] countElement found:', !!countElement);
        
        if (!container || !listElement) {
            console.error('[ERROR] File cards container or list not found in DOM!');
            return;
        }
        
        // Show/hide container
        if (this.attachedFiles.length > 0) {
            console.log('[DEBUG] Showing container for', this.attachedFiles.length, 'files');
            container.style.display = 'block';
            countElement.textContent = this.attachedFiles.length;
            
            // Clear and rebuild list
            listElement.innerHTML = '';
            this.attachedFiles.forEach(fileData => {
                console.log('[DEBUG] Creating card for:', fileData.name);
                const card = this.createFileCard(fileData);
                listElement.appendChild(card);
            });
            console.log('[DEBUG] ✓ Cards rendered successfully');
        } else {
            console.log('[DEBUG] Hiding container (no files)');
            container.style.display = 'none';
        }
    }
    
    removeFile(fileId) {
        const index = this.attachedFiles.findIndex(f => f.id === fileId);
        if (index !== -1) {
            const removed = this.attachedFiles.splice(index, 1)[0];
            this.currentWordCount -= removed.wordCount;
            console.log(`[MultiFile] Removed: ${removed.name}`);
            this.updateFileCardsDisplay();
        }
    }
    
    clearAllFiles() {
        this.attachedFiles = [];
        this.currentWordCount = 0;
        console.log('[MultiFile] Cleared all files');
        this.updateFileCardsDisplay();
    }
    
    async executeQuickAction(action, fileData) {
        console.log(`[MultiFile] Quick action: ${action} on ${fileData.name}`);
        
        // Get AI input textarea
        const aiInput = document.querySelector('#ai-input');
        if (!aiInput) return;
        
        // PRE-EXTRACT all document text before sending to ensure it's ready
        console.log('[MultiFile] Pre-extracting document text for quick action...');
        try {
            await this.getAllDocumentText();
            console.log('[MultiFile] ✓ Document text pre-extracted successfully');
        } catch (error) {
            console.error('[MultiFile] Pre-extraction failed:', error);
        }
        
        // Generate prompt based on action
        let prompt = '';
        if (action === 'summarize') {
            prompt = `Please summarize the key points from "${fileData.name}" in a concise, bullet-point format.`;
        } else if (action === 'analyze') {
            prompt = `Please provide a comprehensive analysis of "${fileData.name}", including main themes, structure, key insights, and notable patterns.`;
        }
        
        // Set prompt in input
        aiInput.value = prompt;
        
        // Trigger send (if send button exists)
        const sendBtn = document.getElementById('ai-send');
        if (sendBtn && !sendBtn.disabled) {
            sendBtn.click();
        }
    }
    
    getAttachedFiles() {
        return this.attachedFiles;
    }
    
    // Get text content from all attached files for AI context
    async getAllDocumentText() {
        // console.log(`[MultiFile] Extracting text from ${this.attachedFiles.length} files...`);
        
        // Separate text files from binary files
        const textFiles = [];
        const binaryFiles = [];
        
        for (const fileData of this.attachedFiles) {
            if (fileData.extractedText) {
                // Already have text (from .txt files)
                textFiles.push({
                    name: fileData.name,
                    type: fileData.type,
                    text: fileData.extractedText,
                    wordCount: fileData.wordCount
                });
            } else {
                binaryFiles.push(fileData);
            }
        }
        
        // Extract text from binary files (PDF, DOCX, etc.) via server
        if (binaryFiles.length > 0) {
            try {
                const formData = new FormData();
                for (const fileData of binaryFiles) {
                    formData.append('files', fileData.file);
                }
                
                console.log(`[MultiFile] Sending ${binaryFiles.length} files to server for extraction...`);
                
                const response = await fetch('/api/extract-documents', {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error(`Server extraction failed: ${response.status}`);
                }
                
                const result = await response.json();
                console.log(`[MultiFile] ✓ Server extracted ${result.files.length} files`);
                
                // Add extracted text to results AND cache in attachedFiles
                for (const extracted of result.files) {
                    if (extracted.success) {
                        // Find the corresponding file in attachedFiles and cache the extracted text
                        const fileData = this.attachedFiles.find(f => f.name === extracted.filename);
                        if (fileData) {
                            fileData.extractedText = extracted.text;
                            fileData.wordCount = extracted.wordCount;
                            fileData.pageCount = extracted.pageCount || fileData.pageCount;
                            fileData.needsExtraction = false;
                            
                            // Update UI to show real word count
                            this.updateFileCardDisplay(fileData);
                        }
                        
                        textFiles.push({
                            name: extracted.filename,
                            type: extracted.contentType,
                            text: extracted.text,
                            wordCount: extracted.wordCount
                        });
                        console.log(`[MultiFile] ✓ ${extracted.filename}: ${extracted.wordCount} words`);
                    } else {
                        console.error(`[MultiFile] ✗ ${extracted.filename}: ${extracted.error}`);
                        textFiles.push({
                            name: extracted.filename,
                            type: extracted.contentType,
                            text: `[Extraction failed: ${extracted.error}]`,
                            wordCount: 0
                        });
                    }
                }
            } catch (error) {
                console.error(`[MultiFile] Server extraction error:`, error);
                // Fallback: send file names only
                for (const fileData of binaryFiles) {
                    textFiles.push({
                        name: fileData.name,
                        type: fileData.type,
                        text: `[${fileData.name} - extraction pending]`,
                        wordCount: fileData.wordCount
                    });
                }
            }
        }
        
        return textFiles;
    }
    
    // Get files as FormData for upload
    getFilesAsFormData() {
        const formData = new FormData();
        this.attachedFiles.forEach((fileData, index) => {
            formData.append(`file${index}`, fileData.file);
            formData.append(`metadata${index}`, JSON.stringify({
                name: fileData.name,
                type: fileData.type,
                size: fileData.size,
                wordCount: fileData.wordCount,
                pageCount: fileData.pageCount
            }));
        });
        formData.append('fileCount', this.attachedFiles.length);
        return formData;
    }
    
    showError(message) {
        console.error(`[MultiFile] ${message}`);
        // You can integrate with your existing notification system here
        alert(message);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.multiFileHandler = new MultiFileHandler();
    });
} else {
    window.multiFileHandler = new MultiFileHandler();
}
