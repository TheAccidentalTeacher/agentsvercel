// ============================================================================
// UNIVERSAL GAME LEVEL EDITOR
// A simple, powerful tool for 2D game level design
// Built for Netlify deployment and local development
// ============================================================================

// ============================================================================
// TOOLTIP DEFINITIONS
// Comprehensive tooltips for every interactive element in the editor
// ============================================================================

const TOOLTIPS = {
    // Toolbar buttons (6 tooltips)
    '#load-background': {
        text: 'Load a background image for your level. Supports PNG, JPG, GIF, WebP. Use <kbd>Ctrl+B</kbd> as shortcut.',
        position: 'bottom'
    },
    '#add-asset': {
        text: 'Add game objects like sprites, enemies, or items. Select multiple files at once. Use <kbd>Ctrl+A</kbd> as shortcut.',
        position: 'bottom'
    },
    '#export-json': {
        text: 'Export level data as clean JSON for your game engine. Auto-copies to clipboard. Use <kbd>Ctrl+E</kbd> as shortcut.',
        position: 'bottom'
    },
    '#save-project': {
        text: 'Save complete project with all images embedded as base64. Can reload later with full fidelity. Use <kbd>Ctrl+S</kbd> as shortcut.',
        position: 'bottom'
    },
    '#load-project': {
        text: 'Load a previously saved project file (.json). Restores all objects, background, and properties. Use <kbd>Ctrl+O</kbd> as shortcut.',
        position: 'bottom'
    },
    '#clear-all': {
        text: 'Remove all objects and background from the canvas. <strong>Cannot be undone</strong> - you will be asked to confirm.',
        position: 'bottom'
    },
    
    // Canvas (1 tooltip)
    '#canvas': {
        text: 'Main editing area. <strong>Click</strong> objects to select. <strong>Drag</strong> to move. <strong>Arrow keys</strong> for precise 1px positioning. <strong>Shift+Arrow</strong> moves 10px. <strong>Delete</strong> to remove.',
        position: 'top'
    },
    
    // Status bar elements (2 tooltips)
    '#mouse-coords': {
        text: 'Current mouse position on canvas in pixels (X, Y). Updates in real-time as you move your cursor.',
        position: 'top'
    },
    '#object-count': {
        text: 'Total number of objects currently placed in your level. Does not include the background image.',
        position: 'top'
    },
    
    // AI Panel elements (7 tooltips)
    '#ai-toggle': {
        text: 'Collapse or expand the AI assistant panel. Use <kbd>Ctrl+Shift+A</kbd> to toggle quickly.',
        position: 'left'
    },
    '#ai-settings': {
        text: 'Configure AI settings including API keys, provider selection, and preferences. Use <kbd>Ctrl+Shift+S</kbd> as shortcut.',
        position: 'left'
    },
    '#ai-clear': {
        text: 'Clear the entire conversation history. This will remove all messages but keep your API configuration.',
        position: 'left'
    },
    '#ai-input': {
        text: 'Type your message to the AI assistant. <strong>Press Enter to send</strong>, Shift+Enter for new line. The AI can analyze your level, answer questions, and manipulate objects.',
        position: 'top'
    },
    '#ai-send': {
        text: 'Send your message to the AI assistant. The AI will respond and can take actions in your level. Use <kbd>Enter</kbd> as shortcut.',
        position: 'top'
    }
};

// Dynamic tooltips for properties panel (added when object selected)
const PROPERTY_TOOLTIPS = {
    name: 'Display name for this object. Used in JSON exports and for organization. Can be any text.',
    x: 'Horizontal position in pixels. 0 = left edge of canvas. Increases toward the right.',
    y: 'Vertical position in pixels. 0 = top edge of canvas. Increases downward.',
    width: 'Object width in pixels. Change to scale the sprite. Original size can be restored by reloading the asset.',
    height: 'Object height in pixels. Change to scale the sprite. Maintains original aspect ratio unless both width and height are manually changed.',
    rotation: 'Rotation angle in degrees. 0 = no rotation. 90 = quarter turn clockwise. 180 = upside down. 360 = full circle (same as 0).'
};

class GameEditor {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.canvas.width = 1280;
        this.canvas.height = 720;

        // Editor state
        this.background = null;
        this.objects = [];
        this.selectedObject = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };

        // UI elements
        this.canvasContainer = document.getElementById('canvas-container');
        this.statusText = document.getElementById('status-text');
        this.mouseCoords = document.getElementById('mouse-coords');
        this.objectCount = document.getElementById('object-count');
        this.propertiesContent = document.getElementById('properties-content');

        // File inputs
        this.backgroundInput = document.getElementById('background-input');
        this.assetInput = document.getElementById('asset-input');
        this.projectInput = document.getElementById('project-input');

        // Tooltip system
        this.tooltipManager = null;

        // AI panel elements
        this.aiPanel = document.getElementById('ai-panel');
        this.aiMessages = document.getElementById('ai-messages');
        this.aiInput = document.getElementById('ai-input');
        this.aiStatus = document.getElementById('ai-status');
        this.aiSettingsModal = document.getElementById('ai-settings-modal');

        // Initialize
        this.setupEventListeners();
        this.initializeTooltips();
        this.initializeAIPanel();
        this.startRenderLoop();
        this.updateObjectCount();

        console.log('🎮 Game Editor initialized successfully!');
        this.updateStatus('Ready to create! Load a background or add an asset to begin.');
    }

    // ========================================================================
    // TOOLTIP SYSTEM
    // ========================================================================

    initializeTooltips() {
        // Create tooltip manager
        this.tooltipManager = new TooltipManager();
        this.tooltipManager.init();
        
        // Register all static tooltips
        const registered = this.tooltipManager.registerAll(TOOLTIPS);
        
        console.log(`✓ Initialized ${registered} tooltips`);
    }
    
    // Called when properties panel is updated with selected object
    registerPropertyTooltips() {
        // Register tooltips for property input fields
        for (const [property, tooltipText] of Object.entries(PROPERTY_TOOLTIPS)) {
            const input = document.getElementById(`prop-${property}`);
            if (input) {
                this.tooltipManager.register(input, tooltipText, 'right');
            }
        }
        
        // Register tooltips for property action buttons
        const duplicateBtn = document.getElementById('btn-duplicate-obj');
        if (duplicateBtn) {
            this.tooltipManager.register(
                duplicateBtn,
                'Create a copy of this object offset by 20px. Uses <kbd>Ctrl+D</kbd> shortcut. Shares same image data.',
                'right'
            );
        }
        
        const deleteBtn = document.getElementById('btn-delete-obj');
        if (deleteBtn) {
            this.tooltipManager.register(
                deleteBtn,
                'Remove this object from the level permanently. Uses <kbd>Delete</kbd> or <kbd>Backspace</kbd> key. <strong>Cannot be undone.</strong>',
                'right'
            );
        }
    }

    // ========================================================================
    // AI PANEL SYSTEM
    // ========================================================================

    initializeAIPanel() {
        // Set up AI panel event listeners
        this.setupAIPanelListeners();
        
        // Load saved configuration if exists
        this.loadAIConfig();
        
        console.log('✓ AI Panel initialized');
    }

    setupAIPanelListeners() {
        // Toggle collapse/expand
        document.getElementById('ai-toggle').addEventListener('click', () => {
            this.aiPanel.classList.toggle('collapsed');
            const btn = document.getElementById('ai-toggle');
            btn.title = this.aiPanel.classList.contains('collapsed') 
                ? 'Expand AI panel' 
                : 'Collapse AI panel';
        });

        // Open settings modal
        document.getElementById('ai-settings').addEventListener('click', () => {
            this.openAISettings();
        });

        // Clear conversation
        document.getElementById('ai-clear').addEventListener('click', () => {
            if (confirm('Clear entire conversation history?')) {
                this.clearAIConversation();
            }
        });

        // Settings modal controls
        document.getElementById('close-ai-settings').addEventListener('click', () => {
            this.closeAISettings();
        });

        document.getElementById('cancel-ai-settings').addEventListener('click', () => {
            this.closeAISettings();
        });

        document.getElementById('save-ai-settings').addEventListener('click', () => {
            this.saveAIConfig();
        });

        // Provider switching
        document.getElementById('ai-provider').addEventListener('change', (e) => {
            this.switchAIProvider(e.target.value);
        });

        // Close modal on overlay click
        this.aiSettingsModal.querySelector('.modal-overlay').addEventListener('click', () => {
            this.closeAISettings();
        });

        // AI input handling (Phase 3 will implement actual sending)
        this.aiInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                // Will implement in Phase 3
                console.log('Send message (not yet implemented)');
            }
        });

        document.getElementById('ai-send').addEventListener('click', () => {
            // Will implement in Phase 3
            console.log('Send message (not yet implemented)');
        });
    }

    openAISettings() {
        this.aiSettingsModal.classList.remove('hidden');
        // Focus first input
        setTimeout(() => {
            const firstInput = this.aiSettingsModal.querySelector('input:not([type="checkbox"])');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    closeAISettings() {
        this.aiSettingsModal.classList.add('hidden');
    }

    switchAIProvider(provider) {
        const anthropicGroup = document.getElementById('anthropic-group');
        const openaiGroup = document.getElementById('openai-group');
        
        if (provider === 'anthropic') {
            anthropicGroup.classList.remove('hidden');
            openaiGroup.classList.add('hidden');
        } else {
            anthropicGroup.classList.add('hidden');
            openaiGroup.classList.remove('hidden');
        }
    }

    loadAIConfig() {
        try {
            const stored = localStorage.getItem('ai_config');
            if (stored) {
                const config = JSON.parse(stored);
                
                // Populate form
                if (config.provider) {
                    document.getElementById('ai-provider').value = config.provider;
                    this.switchAIProvider(config.provider);
                }
                if (config.anthropic_key) {
                    document.getElementById('anthropic-key').value = config.anthropic_key;
                }
                if (config.openai_key) {
                    document.getElementById('openai-key').value = config.openai_key;
                }
                if (config.auto_analyze !== undefined) {
                    document.getElementById('ai-auto-analyze').checked = config.auto_analyze;
                }
                
                // Update status if configured
                if ((config.provider === 'anthropic' && config.anthropic_key) ||
                    (config.provider === 'openai' && config.openai_key)) {
                    this.aiStatus.textContent = 'Ready';
                    this.aiStatus.classList.add('ready');
                    this.aiInput.disabled = false;
                    document.getElementById('ai-send').disabled = false;
                    this.aiInput.placeholder = 'Ask about your level or request changes...';
                }
            }
        } catch (error) {
            console.warn('Failed to load AI config:', error);
        }
    }

    saveAIConfig() {
        const config = {
            provider: document.getElementById('ai-provider').value,
            anthropic_key: document.getElementById('anthropic-key').value,
            openai_key: document.getElementById('openai-key').value,
            auto_analyze: document.getElementById('ai-auto-analyze').checked
        };

        try {
            localStorage.setItem('ai_config', JSON.stringify(config));
            
            // Update UI
            const hasKey = (config.provider === 'anthropic' && config.anthropic_key) ||
                          (config.provider === 'openai' && config.openai_key);
            
            if (hasKey) {
                this.aiStatus.textContent = 'Ready';
                this.aiStatus.classList.add('ready');
                this.aiInput.disabled = false;
                document.getElementById('ai-send').disabled = false;
                this.aiInput.placeholder = 'Ask about your level or request changes...';
                this.updateStatus('AI Assistant configured and ready!');
            } else {
                this.aiStatus.textContent = 'Not Configured';
                this.aiStatus.classList.remove('ready');
            }
            
            this.closeAISettings();
        } catch (error) {
            alert('Failed to save configuration: ' + error.message);
        }
    }

    clearAIConversation() {
        // Clear all messages except welcome
        this.aiMessages.innerHTML = `
            <div class="ai-message system">
                <p><strong>👋 Welcome to AI-Powered Level Design!</strong></p>
                <p>I'm your collaborative AI assistant. I can:</p>
                <ul>
                    <li>Answer questions about game design</li>
                    <li>Analyze your level layout</li>
                    <li><strong>Actually manipulate objects</strong> in your level</li>
                    <li>Suggest improvements and implement them</li>
                </ul>
                <p style="margin-top: 12px;">Click the ⚙️ settings button to configure your API key and get started!</p>
            </div>
        `;
        this.updateStatus('Conversation cleared');
    }

    // ========================================================================
    // EVENT LISTENERS
    // ========================================================================

    setupEventListeners() {
        // Toolbar buttons
        document.getElementById('load-background').addEventListener('click', () => {
            this.backgroundInput.click();
        });

        document.getElementById('add-asset').addEventListener('click', () => {
            this.assetInput.click();
        });

        document.getElementById('export-json').addEventListener('click', () => {
            this.exportJSON();
        });

        document.getElementById('save-project').addEventListener('click', () => {
            this.saveProject();
        });

        document.getElementById('load-project').addEventListener('click', () => {
            this.projectInput.click();
        });

        document.getElementById('clear-all').addEventListener('click', () => {
            if (confirm('Clear everything? This cannot be undone.')) {
                this.clearAll();
            }
        });

        // File inputs
        this.backgroundInput.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.loadBackground(e.target.files[0]);
            }
        });

        this.assetInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                Array.from(e.target.files).forEach(file => {
                    this.loadAsset(file);
                });
            }
        });

        this.projectInput.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.loadProject(e.target.files[0]);
            }
        });

        // Canvas mouse events
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.onMouseUp(e));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.onKeyDown(e));

        // Prevent default file drop on document
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => e.preventDefault());
    }

    // ========================================================================
    // ASSET LOADING
    // ========================================================================

    loadBackground(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.background = img;
                this.canvasContainer.classList.add('has-content');
                this.updateStatus(`Background loaded: ${file.name}`);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    loadAsset(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Create new object at center of canvas
                const obj = {
                    id: Date.now() + Math.random(),
                    name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
                    image: img,
                    x: this.canvas.width / 2 - img.width / 2,
                    y: this.canvas.height / 2 - img.height / 2,
                    width: img.width,
                    height: img.height,
                    rotation: 0,
                    imageSrc: e.target.result // Store base64 for export/save
                };
                this.objects.push(obj);
                this.selectedObject = obj;
                this.canvasContainer.classList.add('has-content');
                this.updateProperties();
                this.updateObjectCount();
                this.updateStatus(`Asset added: ${file.name}`);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // ========================================================================
    // RENDERING
    // ========================================================================

    startRenderLoop() {
        const render = () => {
            this.render();
            requestAnimationFrame(render);
        };
        requestAnimationFrame(render);
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#2d2d2d';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background
        if (this.background) {
            this.ctx.drawImage(this.background, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            // Draw grid if no background
            this.drawGrid();
        }

        // Draw all objects
        this.objects.forEach(obj => {
            this.drawObject(obj);
        });

        // Draw selection highlight
        if (this.selectedObject) {
            this.drawSelection(this.selectedObject);
        }
    }

    drawGrid() {
        const gridSize = 50;
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x <= this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawObject(obj) {
        this.ctx.save();

        // Apply transformations
        this.ctx.translate(obj.x + obj.width / 2, obj.y + obj.height / 2);
        this.ctx.rotate(obj.rotation * Math.PI / 180);
        this.ctx.translate(-obj.width / 2, -obj.height / 2);

        // Draw image
        this.ctx.drawImage(obj.image, 0, 0, obj.width, obj.height);

        this.ctx.restore();
    }

    drawSelection(obj) {
        // Selection box
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(obj.x - 1, obj.y - 1, obj.width + 2, obj.height + 2);

        // Resize handles
        const handleSize = 8;
        this.ctx.fillStyle = '#00ff00';
        
        // Corner handles
        const corners = [
            { x: obj.x, y: obj.y }, // Top-left
            { x: obj.x + obj.width, y: obj.y }, // Top-right
            { x: obj.x, y: obj.y + obj.height }, // Bottom-left
            { x: obj.x + obj.width, y: obj.y + obj.height } // Bottom-right
        ];

        corners.forEach(corner => {
            this.ctx.fillRect(
                corner.x - handleSize / 2, 
                corner.y - handleSize / 2, 
                handleSize, 
                handleSize
            );
        });
    }

    // ========================================================================
    // MOUSE INTERACTION
    // ========================================================================

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    onMouseDown(e) {
        const pos = this.getMousePos(e);

        // Check if clicked on an object (reverse order - top to bottom)
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            if (this.isPointInObject(pos, obj)) {
                this.selectedObject = obj;
                this.isDragging = true;
                this.dragOffset = {
                    x: pos.x - obj.x,
                    y: pos.y - obj.y
                };
                this.updateProperties();
                return;
            }
        }

        // Clicked empty space - deselect
        this.selectedObject = null;
        this.updateProperties();
    }

    onMouseMove(e) {
        const pos = this.getMousePos(e);

        // Update mouse coordinates display
        this.mouseCoords.textContent = `X: ${Math.round(pos.x)}, Y: ${Math.round(pos.y)}`;

        // Change cursor if hovering over object
        let hovering = false;
        for (let i = this.objects.length - 1; i >= 0; i--) {
            if (this.isPointInObject(pos, this.objects[i])) {
                hovering = true;
                break;
            }
        }
        this.canvas.style.cursor = hovering ? 'move' : 'crosshair';

        // Drag object if dragging
        if (this.isDragging && this.selectedObject) {
            this.selectedObject.x = pos.x - this.dragOffset.x;
            this.selectedObject.y = pos.y - this.dragOffset.y;
            this.updatePropertiesQuiet();
        }
    }

    onMouseUp(e) {
        if (this.isDragging) {
            this.updateProperties(); // Final update with status
        }
        this.isDragging = false;
    }

    isPointInObject(point, obj) {
        return point.x >= obj.x && 
               point.x <= obj.x + obj.width &&
               point.y >= obj.y && 
               point.y <= obj.y + obj.height;
    }

    // ========================================================================
    // KEYBOARD SHORTCUTS
    // ========================================================================

    onKeyDown(e) {
        // Global shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch(e.key.toLowerCase()) {
                case 'b':
                    e.preventDefault();
                    this.backgroundInput.click();
                    break;
                case 'a':
                    e.preventDefault();
                    this.assetInput.click();
                    break;
                case 'e':
                    e.preventDefault();
                    this.exportJSON();
                    break;
                case 's':
                    e.preventDefault();
                    this.saveProject();
                    break;
                case 'o':
                    e.preventDefault();
                    this.projectInput.click();
                    break;
                case 'd':
                    e.preventDefault();
                    if (this.selectedObject) {
                        this.duplicateObject();
                    }
                    break;
            }
            return;
        }

        // Object-specific shortcuts (only if object selected)
        if (!this.selectedObject) return;

        const step = e.shiftKey ? 10 : 1;

        switch(e.key) {
            case 'Delete':
            case 'Backspace':
                e.preventDefault();
                this.deleteSelected();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.selectedObject.y -= step;
                this.updateProperties();
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.selectedObject.y += step;
                this.updateProperties();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.selectedObject.x -= step;
                this.updateProperties();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.selectedObject.x += step;
                this.updateProperties();
                break;
        }
    }

    deleteSelected() {
        if (!this.selectedObject) return;
        const index = this.objects.indexOf(this.selectedObject);
        if (index > -1) {
            this.objects.splice(index, 1);
            this.selectedObject = null;
            this.updateProperties();
            this.updateObjectCount();
            this.updateStatus('Object deleted');
        }
    }

    duplicateObject() {
        if (!this.selectedObject) return;
        const original = this.selectedObject;
        const duplicate = {
            id: Date.now() + Math.random(),
            name: original.name + ' (copy)',
            image: original.image,
            x: original.x + 20,
            y: original.y + 20,
            width: original.width,
            height: original.height,
            rotation: original.rotation,
            imageSrc: original.imageSrc
        };
        this.objects.push(duplicate);
        this.selectedObject = duplicate;
        this.updateProperties();
        this.updateObjectCount();
        this.updateStatus('Object duplicated (Ctrl+D)');
    }

    clearAll() {
        this.objects = [];
        this.selectedObject = null;
        this.background = null;
        this.canvasContainer.classList.remove('has-content');
        this.updateProperties();
        this.updateObjectCount();
        this.updateStatus('All cleared');
    }

    // ========================================================================
    // PROPERTIES PANEL
    // ========================================================================

    updateProperties() {
        this.updatePropertiesQuiet();
        if (this.selectedObject) {
            this.updateStatus(`Selected: ${this.selectedObject.name}`);
        }
    }

    updatePropertiesQuiet() {
        if (!this.selectedObject) {
            this.propertiesContent.innerHTML = '<p style="color: #999;">Select an object to view properties</p>';
            return;
        }

        const obj = this.selectedObject;
        this.propertiesContent.innerHTML = `
            <div class="property-group">
                <label>Name</label>
                <input type="text" id="prop-name" value="${obj.name}">
            </div>
            <div class="property-group">
                <label>X Position</label>
                <input type="number" id="prop-x" value="${Math.round(obj.x)}" step="1">
            </div>
            <div class="property-group">
                <label>Y Position</label>
                <input type="number" id="prop-y" value="${Math.round(obj.y)}" step="1">
            </div>
            <div class="property-group">
                <label>Width</label>
                <input type="number" id="prop-width" value="${Math.round(obj.width)}" step="1" min="1">
            </div>
            <div class="property-group">
                <label>Height</label>
                <input type="number" id="prop-height" value="${Math.round(obj.height)}" step="1" min="1">
            </div>
            <div class="property-group">
                <label>Rotation (degrees)</label>
                <input type="number" id="prop-rotation" value="${obj.rotation}" step="1">
            </div>
            <div class="property-buttons">
                <button class="btn-duplicate" id="btn-duplicate-obj">Duplicate</button>
                <button class="btn-delete" id="btn-delete-obj">Delete</button>
            </div>
        `;

        // Add event listeners to property inputs
        document.getElementById('prop-name').addEventListener('input', (e) => {
            obj.name = e.target.value;
        });
        
        document.getElementById('prop-x').addEventListener('input', (e) => {
            obj.x = parseFloat(e.target.value) || 0;
        });
        
        document.getElementById('prop-y').addEventListener('input', (e) => {
            obj.y = parseFloat(e.target.value) || 0;
        });
        
        document.getElementById('prop-width').addEventListener('input', (e) => {
            obj.width = Math.max(1, parseFloat(e.target.value) || 1);
        });
        
        document.getElementById('prop-height').addEventListener('input', (e) => {
            obj.height = Math.max(1, parseFloat(e.target.value) || 1);
        });
        
        document.getElementById('prop-rotation').addEventListener('input', (e) => {
            obj.rotation = parseFloat(e.target.value) || 0;
        });
        
        document.getElementById('btn-duplicate-obj').addEventListener('click', () => {
            this.duplicateObject();
        });
        
        document.getElementById('btn-delete-obj').addEventListener('click', () => {
            this.deleteSelected();
        });
        
        // Register tooltips for all property elements
        this.registerPropertyTooltips();
    }

    // ========================================================================
    // EXPORT / SAVE / LOAD
    // ========================================================================

    exportJSON() {
        const data = {
            meta: {
                editor: 'Universal Game Level Editor',
                version: '1.0',
                exported: new Date().toISOString()
            },
            canvas: {
                width: this.canvas.width,
                height: this.canvas.height
            },
            background: this.background ? 'background.png' : null,
            objects: this.objects.map(obj => ({
                name: obj.name,
                x: Math.round(obj.x),
                y: Math.round(obj.y),
                width: Math.round(obj.width),
                height: Math.round(obj.height),
                rotation: obj.rotation
            }))
        };

        const json = JSON.stringify(data, null, 2);
        
        // Copy to clipboard
        navigator.clipboard.writeText(json).then(() => {
            this.updateStatus('✅ JSON copied to clipboard!');
        }).catch(() => {
            this.updateStatus('⚠️ Could not copy to clipboard, downloading file...');
        });

        // Also download as file
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'level-' + Date.now() + '.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    saveProject() {
        const project = {
            meta: {
                editor: 'Universal Game Level Editor',
                version: '1.0',
                saved: new Date().toISOString()
            },
            canvas: {
                width: this.canvas.width,
                height: this.canvas.height
            },
            background: this.background ? this.canvasToDataURL(this.background) : null,
            objects: this.objects.map(obj => ({
                id: obj.id,
                name: obj.name,
                x: obj.x,
                y: obj.y,
                width: obj.width,
                height: obj.height,
                rotation: obj.rotation,
                imageSrc: obj.imageSrc
            }))
        };

        const json = JSON.stringify(project);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'project-' + Date.now() + '.json';
        a.click();
        URL.revokeObjectURL(url);

        this.updateStatus('💾 Project saved!');
    }

    canvasToDataURL(image) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(image, 0, 0, this.canvas.width, this.canvas.height);
        return tempCanvas.toDataURL();
    }

    loadProject(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const project = JSON.parse(e.target.result);
                
                // Clear current state
                this.objects = [];
                this.selectedObject = null;

                // Restore canvas size
                this.canvas.width = project.canvas.width || 1280;
                this.canvas.height = project.canvas.height || 720;

                // Restore background
                if (project.background) {
                    const img = new Image();
                    img.onload = () => {
                        this.background = img;
                        this.canvasContainer.classList.add('has-content');
                    };
                    img.src = project.background;
                }

                // Restore objects
                let loadedCount = 0;
                project.objects.forEach(objData => {
                    const img = new Image();
                    img.onload = () => {
                        const obj = {
                            id: objData.id || Date.now() + Math.random(),
                            name: objData.name,
                            image: img,
                            x: objData.x,
                            y: objData.y,
                            width: objData.width,
                            height: objData.height,
                            rotation: objData.rotation || 0,
                            imageSrc: objData.imageSrc
                        };
                        this.objects.push(obj);
                        loadedCount++;
                        
                        if (loadedCount === project.objects.length) {
                            this.canvasContainer.classList.add('has-content');
                            this.updateObjectCount();
                            this.updateStatus(`📂 Project loaded! ${loadedCount} objects restored.`);
                        }
                    };
                    img.src = objData.imageSrc;
                });

                if (project.objects.length === 0) {
                    this.updateStatus('📂 Project loaded (no objects)');
                }

            } catch (error) {
                console.error('Load error:', error);
                this.updateStatus('❌ Error loading project: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    updateStatus(message) {
        this.statusText.textContent = message;
    }

    updateObjectCount() {
        this.objectCount.textContent = `Objects: ${this.objects.length}`;
        
        if (this.objects.length === 0 && !this.background) {
            this.canvasContainer.classList.remove('has-content');
        }
    }
}

// ============================================================================
// INITIALIZE EDITOR
// ============================================================================

window.addEventListener('DOMContentLoaded', () => {
    try {
        window.editor = new GameEditor();
    } catch (error) {
        console.error('Failed to initialize editor:', error);
        alert('Failed to start editor. Check console for details.');
    }
});
