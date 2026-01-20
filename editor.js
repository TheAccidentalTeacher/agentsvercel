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
        
        // Update persona indicator after config loaded
        const config = JSON.parse(localStorage.getItem('ai_config') || '{}');
        this.updatePersonaIndicator(config.persona || 'default');
        
        // Update memory stats
        this.updateMemoryStats();
        
        // Restore saved panel width
        const savedWidth = localStorage.getItem('ai_panel_width') || '450px';
        document.getElementById('workspace').style.gridTemplateColumns = `1fr 320px ${savedWidth}`;
        
        console.log('✓ AI Panel initialized');
    }

    setupAIPanelListeners() {
        // Toggle collapse/expand
        document.getElementById('ai-toggle').addEventListener('click', () => {
            this.closeAIPanel();
        });
        
        // Reopen AI panel
        document.getElementById('ai-reopen').addEventListener('click', () => {
            this.openAIPanel();
        });
        
        // Setup resize functionality
        this.setupAIPanelResize();

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

        // Quick model switch in header
        document.getElementById('quick-model-switch').addEventListener('change', (e) => {
            this.quickSwitchModel(e.target.value);
        });

        // Quick persona switch in header
        document.getElementById('quick-persona-switch').addEventListener('change', (e) => {
            this.quickSwitchPersona(e.target.value);
        });
        
        // Keyboard shortcuts for AI
        document.addEventListener('keydown', (e) => {
            // Ctrl+K: Clear chat
            if (e.ctrlKey && e.key === 'k' && document.getElementById('ai-input') === document.activeElement) {
                e.preventDefault();
                this.clearConversation();
            }
        });

        // Close modal on overlay click
        this.aiSettingsModal.querySelector('.modal-overlay').addEventListener('click', () => {
            this.closeAISettings();
        });

        // Memory UI handlers
        document.getElementById('view-memory').addEventListener('click', () => {
            this.showMemoryViewer();
        });

        document.getElementById('clear-memory').addEventListener('click', () => {
            if (confirm('Clear all memory for this persona? This cannot be undone.')) {
                const config = JSON.parse(localStorage.getItem('ai_config') || '{}');
                const memory = new AgentMemory(config.persona || 'default');
                memory.clearMemory();
                this.updateMemoryStats();
                this.updateStatus('Memory cleared');
            }
        });

        document.getElementById('close-memory-modal').addEventListener('click', () => {
            document.getElementById('memory-modal').style.display = 'none';
        });

        document.getElementById('export-memory').addEventListener('click', () => {
            this.exportMemory();
        });

        // AI input handling
        this.aiInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendAIMessage();
            }
        });

        document.getElementById('ai-send').addEventListener('click', () => {
            this.sendAIMessage();
        });

        // Auto-save web search preference when toggled
        const webSearchToggle = document.getElementById('web-search-toggle');
        if (webSearchToggle) {
            webSearchToggle.addEventListener('change', () => {
                const config = JSON.parse(localStorage.getItem('ai_config') || '{}');
                config.web_search = webSearchToggle.checked;
                localStorage.setItem('ai_config', JSON.stringify(config));
                console.log('[Web Search] Toggle saved:', webSearchToggle.checked);
            });
        }

        // Checkpoint controls
        document.getElementById('ai-checkpoint').addEventListener('click', () => {
            this.saveCheckpoint();
        });

        document.getElementById('ai-restore').addEventListener('click', () => {
            this.restoreCheckpoint();
        });
    }

    openAISettings() {
        this.aiSettingsModal.classList.remove('hidden');
        
        // Update memory stats when opening settings
        this.updateMemoryStats();
        
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
        console.log('[AI Provider] Switching to:', provider);
        const anthropicModels = document.getElementById('anthropic-models');
        const openaiModels = document.getElementById('openai-models');
        
        if (provider === 'anthropic') {
            anthropicModels.classList.remove('hidden');
            openaiModels.classList.add('hidden');
            console.log('[AI Provider] ✓ Anthropic models shown');
        } else if (provider === 'openai') {
            anthropicModels.classList.add('hidden');
            openaiModels.classList.remove('hidden');
            console.log('[AI Provider] ✓ OpenAI models shown');
        }
    }

    quickSwitchModel(value) {
        console.group('🔄 Quick Model Switch');
        console.log('[Quick Switch] Selected:', value);
        
        const [provider, model] = value.split(':');
        console.log('[Quick Switch] Provider:', provider);
        console.log('[Quick Switch] Model:', model);
        
        // Get current config
        const config = JSON.parse(localStorage.getItem('ai_config') || '{}');
        
        // Update provider and model
        config.provider = provider;
        if (provider === 'anthropic') {
            config.anthropic_model = model;
        } else {
            config.openai_model = model;
        }
        
        // Save to localStorage
        localStorage.setItem('ai_config', JSON.stringify(config));
        console.log('[Quick Switch] ✓ Config saved:', config);
        
        // Update settings modal to match
        document.getElementById('ai-provider').value = provider;
        this.switchAIProvider(provider);
        if (provider === 'anthropic') {
            document.getElementById('anthropic-model').value = model;
        } else {
            document.getElementById('openai-model').value = model;
        }
        
        // Show notification
        const modelName = document.getElementById('quick-model-switch').selectedOptions[0].text;
        this.addMessage('system', `Switched to ${modelName}. This will apply to your next message.`);
        console.log('[Quick Switch] ✓ Switched to:', modelName);
        
        console.groupEnd();
    }

    quickSwitchPersona(value) {
        console.group('🎭 Quick Persona Switch');
        console.log('[Quick Persona] Selected:', value);
        
        // Get current config
        const config = JSON.parse(localStorage.getItem('ai_config') || '{}');
        const oldPersona = config.persona || 'default';
        
        // Update persona
        config.persona = value;
        
        // Save to localStorage
        localStorage.setItem('ai_config', JSON.stringify(config));
        console.log('[Quick Persona] ✓ Config saved:', config);
        
        // Update settings modal to match
        document.getElementById('ai-persona').value = value;
        
        // Update persona indicator
        this.updatePersonaIndicator(value);
        
        // Update memory stats for new persona
        this.updateMemoryStats();
        
        // Show notification
        const personaName = document.getElementById('quick-persona-switch').selectedOptions[0].text;
        this.addMessage('system', `🎭 Switched to ${personaName}. Memory and conversation context are now persona-specific.`);
        console.log('[Quick Persona] ✓ Switched to:', personaName);
        
        console.groupEnd();
    }

    loadAIConfig() {
        console.group('🔧 AI Configuration Loading');
        console.time('loadAIConfig');
        
        try {
            console.log('[AI Config] Checking localStorage for saved config...');
            const stored = localStorage.getItem('ai_config');
            
            if (stored) {
                console.log('[AI Config] Found stored config:', stored);
                const config = JSON.parse(stored);
                console.log('[AI Config] Parsed config:', config);
                
                // Load provider
                if (config.provider) {
                    document.getElementById('ai-provider').value = config.provider;
                    this.switchAIProvider(config.provider);
                    console.log('[AI Config] Set provider to:', config.provider);
                }
                
                // Load model selections
                if (config.anthropic_model) {
                    document.getElementById('anthropic-model').value = config.anthropic_model;
                    console.log('[AI Config] Set Anthropic model to:', config.anthropic_model);
                }
                if (config.openai_model) {
                    document.getElementById('openai-model').value = config.openai_model;
                    console.log('[AI Config] Set OpenAI model to:', config.openai_model);
                }
                
                // Load persona
                if (config.persona) {
                    document.getElementById('ai-persona').value = config.persona;
                    console.log('[AI Config] Set persona to:', config.persona);
                }
                
                // Load checkboxes
                if (config.auto_analyze !== undefined) {
                    document.getElementById('ai-auto-analyze').checked = config.auto_analyze;
                    console.log('[AI Config] Set auto_analyze to:', config.auto_analyze);
                }
                if (config.enable_images !== undefined) {
                    document.getElementById('ai-enable-images').checked = config.enable_images;
                    console.log('[AI Config] Set enable_images to:', config.enable_images);
                }
            } else {
                console.log('[AI Config] No stored config found, using defaults');
            }
            
            // AI is always ready (server-side keys)
            this.aiStatus.textContent = 'Ready';
            this.aiStatus.classList.add('ready');
            this.aiInput.disabled = false;
            document.getElementById('ai-send').disabled = false;
            this.aiInput.placeholder = 'Ask about your level or request changes...';
            console.log('[AI Config] ✓ AI Status set to Ready');
            console.log('[AI Config] ✓ Input enabled, send button enabled');
            
            // Show and update quick model switcher
            const config = JSON.parse(stored || '{}');
            const provider = config.provider || 'anthropic';
            const model = provider === 'anthropic' ? 
                (config.anthropic_model || 'claude-sonnet-4-5-20250929') : 
                (config.openai_model || 'gpt-5.2');
            
            const quickSwitch = document.getElementById('quick-model-switch');
            quickSwitch.value = `${provider}:${model}`;
            document.getElementById('ai-model-switcher').style.display = 'block';
            console.log('[AI Config] ✓ Quick switcher set to:', `${provider}:${model}`);
            
            // Show and update quick persona switcher
            const persona = config.persona || 'default';
            const quickPersonaSwitch = document.getElementById('quick-persona-switch');
            quickPersonaSwitch.value = persona;
            document.getElementById('ai-persona-switcher').style.display = 'block';
            console.log('[AI Config] ✓ Quick persona switcher set to:', persona);
            
            // Show keyboard hints
            const hints = document.getElementById('keyboard-hints');
            if (hints) hints.style.display = 'flex';
            
            // Load web search preference (default to disabled for user control)
            const webSearchToggle = document.getElementById('web-search-toggle');
            if (webSearchToggle) {
                const webSearchEnabled = config.web_search !== undefined ? config.web_search : false;
                webSearchToggle.checked = webSearchEnabled;
                console.log('[AI Config] ✓ Web search toggle set to:', webSearchEnabled);
            }
            
            // Initialize conversation history
            this.conversationHistory = [];
            console.log('[AI Config] ✓ Conversation history initialized (empty array)');
            
            console.timeEnd('loadAIConfig');
            console.log('[AI Config] ✅ Configuration loaded successfully');
            
        } catch (error) {
            console.error('[AI Config] ❌ Failed to load AI config:', error);
            console.error('[AI Config] Error stack:', error.stack);
        } finally {
            console.groupEnd();
        }
    }

    saveAIConfig() {
        const config = {
            provider: document.getElementById('ai-provider').value,
            anthropic_model: document.getElementById('anthropic-model').value,
            openai_model: document.getElementById('openai-model').value,
            persona: document.getElementById('ai-persona').value,
            auto_analyze: document.getElementById('ai-auto-analyze').checked,
            enable_images: document.getElementById('ai-enable-images').checked,
            web_search: document.getElementById('web-search-toggle')?.checked || false
        };

        try {
            localStorage.setItem('ai_config', JSON.stringify(config));
            console.log('[AI Config] Saved:', config);
            this.updateStatus('AI preferences saved!');
            
            // Update persona indicator when settings saved
            this.updatePersonaIndicator(config.persona);
            
            // Update memory stats
            this.updateMemoryStats();
            
            this.closeAISettings();
        } catch (error) {
            alert('Failed to save configuration: ' + error.message);
        }
    }

    updatePersonaIndicator(persona) {
        // Update badge
        const badge = document.getElementById('ai-persona-badge');
        const personaNameEl = document.getElementById('active-persona-name');
        
        if (badge && personaNameEl) {
            const personaInfo = this.getPersonaInfo(persona);
            
            // Update badge content
            personaNameEl.textContent = personaInfo.name;
            badge.className = `ai-persona-badge ${personaInfo.category}`;
            
            // Update icon
            const iconEl = badge.querySelector('.persona-icon');
            if (iconEl) iconEl.textContent = personaInfo.icon;
            
            // Show badge
            badge.style.display = 'flex';
            
            console.log('🎭 [Persona Badge] Updated to:', personaInfo.name, personaInfo.category);
        }
    }
    
    getPersonaInfo(persona) {
        const personaMap = {
            'default': { name: 'Default', icon: '👤', category: 'general' },
            'fellowship': { name: 'Fellowship', icon: '⚔️', category: 'general' },
            'master-teacher': { name: 'Dr. Sarah', icon: '🎓', category: 'core-council' },
            'technical-architect': { name: 'Alex', icon: '💻', category: 'core-council' },
            'strategist': { name: 'Marcus', icon: '📊', category: 'core-council' },
            'theologian': { name: 'Pastor Jonathan', icon: '✝️', category: 'core-council' },
            'writer': { name: 'Emma', icon: '✍️', category: 'core-council' },
            'analyst': { name: 'Dr. Priya', icon: '📈', category: 'core-council' },
            'debugger': { name: 'Max', icon: '🔧', category: 'core-council' },
            'classical-educator': { name: 'Prof. Helena', icon: '📚', category: 'specialist' },
            'gen-alpha-expert': { name: 'Zara', icon: '🎮', category: 'specialist' },
            'ux-designer': { name: 'Riley', icon: '🎨', category: 'specialist' },
            'marketing-strategist': { name: 'David', icon: '📣', category: 'specialist' },
            'game-designer': { name: 'Jordan', icon: '🕹️', category: 'specialist' }
        };
        
        return personaMap[persona] || { name: 'Unknown', icon: '❓', category: 'general' };
    }

    updateMemoryStats() {
        const config = JSON.parse(localStorage.getItem('ai_config') || '{}');
        const persona = config.persona || 'default';
        const memory = new AgentMemory(persona);
        const stats = memory.getMemoryStats();

        document.getElementById('memory-count').textContent = stats.interactionCount || 0;
        
        const topTopics = stats.topTopics.map(t => t.topic).slice(0, 3).join(', ') || 'None yet';
        document.getElementById('memory-topics').textContent = topTopics;
        
        const firstSeen = stats.firstSeen ? new Date(stats.firstSeen).toLocaleDateString() : 'Never';
        document.getElementById('memory-since').textContent = firstSeen;

        console.log(`🧠 [Memory Stats] ${stats.interactionCount} conversations, ${stats.topTopics.length} topics`);
    }

    showMemoryViewer() {
        const config = JSON.parse(localStorage.getItem('ai_config') || '{}');
        const persona = config.persona || 'default';
        const memory = new AgentMemory(persona);
        const memoryData = memory.exportMemory();

        // Set persona name
        document.getElementById('memory-persona-name').textContent = persona;

        // Populate short-term memory
        const shortTermDiv = document.getElementById('memory-short-term');
        if (memoryData.shortTerm.length === 0) {
            shortTermDiv.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">No conversations yet. Start chatting to build memory!</p>';
        } else {
            shortTermDiv.innerHTML = memoryData.shortTerm.map(item => {
                const color = item.role === 'user' ? '#2196F3' : '#4CAF50';
                const preview = item.content.length > 200 ? item.content.substring(0, 200) + '...' : item.content;
                return `
                    <div style="margin: 12px 0; padding: 12px; background: #333; border-radius: 4px; border-left: 3px solid ${color};">
                        <strong style="color: ${color}; text-transform: capitalize;">${item.role}:</strong>
                        <p style="margin: 8px 0; white-space: pre-wrap;">${preview}</p>
                        <small style="color: #888;">${new Date(item.timestamp).toLocaleString()}</small>
                    </div>
                `;
            }).join('');
        }

        // Populate long-term insights
        const profileList = document.getElementById('memory-profile');
        if (memoryData.longTerm.userProfile.preferences.length === 0) {
            profileList.innerHTML = '<li style="color: #888; padding: 8px;">Learning about you...</li>';
        } else {
            profileList.innerHTML = memoryData.longTerm.userProfile.preferences.map(p => 
                `<li style="padding: 4px 0;">✓ ${p}</li>`
            ).join('');
        }

        // Populate project context
        const projectList = document.getElementById('memory-project');
        const projectItems = [];
        if (memoryData.longTerm.projectContext.gameType) {
            projectItems.push(`<li style="padding: 4px 0;"><strong>Type:</strong> ${memoryData.longTerm.projectContext.gameType}</li>`);
        }
        if (memoryData.longTerm.projectContext.keyFeatures.length > 0) {
            projectItems.push(`<li style="padding: 4px 0;"><strong>Features:</strong> ${memoryData.longTerm.projectContext.keyFeatures.join(', ')}</li>`);
        }
        if (memoryData.longTerm.projectContext.challenges.length > 0) {
            projectItems.push(`<li style="padding: 4px 0;"><strong>Challenges:</strong> ${memoryData.longTerm.projectContext.challenges.join(', ')}</li>`);
        }
        projectList.innerHTML = projectItems.length > 0 ? projectItems.join('') : '<li style="color: #888; padding: 8px;">No project details yet</li>';

        // Populate topics
        const topicsList = document.getElementById('memory-topics-list');
        if (memoryData.longTerm.interactionStats.topTopics.length === 0) {
            topicsList.innerHTML = '<li style="color: #888; padding: 8px;">No topics tracked yet</li>';
        } else {
            topicsList.innerHTML = memoryData.longTerm.interactionStats.topTopics.map(t => 
                `<li style="padding: 4px 0;">📌 ${t.topic} <span style="color: #888;">(${t.count}x)</span></li>`
            ).join('');
        }

        // Show modal
        document.getElementById('memory-modal').style.display = 'flex';
        console.log('🧠 [Memory Viewer] Opened with', memoryData.shortTerm.length, 'interactions');
    }

    exportMemory() {
        const config = JSON.parse(localStorage.getItem('ai_config') || '{}');
        const persona = config.persona || 'default';
        const memory = new AgentMemory(persona);
        const memoryData = memory.exportMemory();

        const dataStr = JSON.stringify(memoryData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `memory-${persona}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.updateStatus('Memory exported!');
        console.log('🧠 [Memory Export] Saved as', a.download);
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
    
    closeAIPanel() {
        this.aiPanel.classList.add('collapsed');
        document.getElementById('ai-reopen').style.display = 'block';
        // Update workspace grid to give more space
        document.getElementById('workspace').style.gridTemplateColumns = '1fr 320px';
    }
    
    openAIPanel() {
        this.aiPanel.classList.remove('collapsed');
        document.getElementById('ai-reopen').style.display = 'none';
        // Restore AI panel in grid
        const savedWidth = localStorage.getItem('ai_panel_width') || '450px';
        document.getElementById('workspace').style.gridTemplateColumns = `1fr 320px ${savedWidth}`;
    }
    
    setupAIPanelResize() {
        const resizeHandle = document.getElementById('ai-resize-handle');
        const workspace = document.getElementById('workspace');
        const aiPanel = this.aiPanel;
        
        let isResizing = false;
        let startX = 0;
        let startWidth = 0;
        
        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = aiPanel.offsetWidth;
            
            // Add resizing class for visual feedback
            aiPanel.style.transition = 'none';
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const deltaX = startX - e.clientX; // Inverted because we're dragging from left edge
            const newWidth = Math.max(350, Math.min(600, startWidth + deltaX));
            
            // Update grid template
            workspace.style.gridTemplateColumns = `1fr 320px ${newWidth}px`;
            
            e.preventDefault();
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                aiPanel.style.transition = '';
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                
                // Save width preference
                const currentWidth = aiPanel.offsetWidth;
                localStorage.setItem('ai_panel_width', `${currentWidth}px`);
                
                console.log(`📐 AI Panel resized to ${currentWidth}px`);
            }
        });
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

    // ========================================================================
    // AI MESSAGING
    // ========================================================================

    async sendAIMessage() {
        console.group('💬 Sending AI Message');
        console.time('sendAIMessage');
        
        const message = this.aiInput.value.trim();
        console.log('[AI Message] Raw input value:', this.aiInput.value);
        console.log('[AI Message] Trimmed message:', message);
        console.log('[AI Message] Message length:', message.length);
        
        if (!message) {
            console.warn('[AI Message] ⚠️ Empty message, aborting send');
            console.groupEnd();
            return;
        }

        // Add user message to chat
        console.log('[AI Message] Adding user message to chat UI...');
        this.addMessage('user', message);
        this.aiInput.value = '';
        console.log('[AI Message] ✓ User message added, input cleared');

        // Save user message to persistent chat history
        try {
            if (window.chatHistory) {
                await window.chatHistory.saveMessage('user', message);
                console.log('[Editor] ✓ Saved user message to database');
            }
        } catch (error) {
            console.error('[Editor] ❌ Failed to save user message:', error);
        }

        // Get config for persona
        const config = JSON.parse(localStorage.getItem('ai_config') || '{}');
        const persona = config.persona || 'default';
        
        // Save user message to memory
        const memory = new AgentMemory(persona);
        memory.addInteraction('user', message, {
            editorState: this.getEditorState(),
            timestamp: new Date().toISOString()
        });

        // Show thinking indicator
        this.aiStatus.textContent = 'Thinking...';
        this.aiStatus.classList.remove('ready');
        console.log('[AI Message] ✓ Status changed to "Thinking..."');

        try {
            // Build request payload
            const messageHistory = this.buildMessageHistory();
            const editorState = this.getEditorState();
            
            console.log('[AI Message] 📦 Request payload prepared:');
            console.log('  - Message history length:', messageHistory.length);
            console.log('  - Message history:', messageHistory);
            console.log('  - Editor state:', editorState);
            
            // Get current AI config
            const config = JSON.parse(localStorage.getItem('ai_config') || '{}');
            const provider = config.provider || 'anthropic';
            const model = provider === 'anthropic' ? 
                (config.anthropic_model || 'claude-sonnet-4-5-20250929') : 
                (config.openai_model || 'gpt-5.2');
            const enableImages = config.enable_images !== false; // default true
            const persona = config.persona || 'default';
            
            console.log('[AI Message] Provider:', provider);
            console.log('[AI Message] Model:', model);
            console.log('🎭 [AI Message] Active Persona:', persona);
            console.log('[AI Message] Image generation:', enableImages ? 'enabled' : 'disabled');
            console.log('='.repeat(60));
            
            // Update UI to show active persona
            this.updatePersonaIndicator(persona);
            
            // Check if web search is enabled
            const webSearchEnabled = document.getElementById('web-search-toggle')?.checked || false;
            
        // Show web search indicator if enabled
        let searchIndicatorId = null;
        if (webSearchEnabled) {
            searchIndicatorId = this.addSearchingIndicator();
        }
        
        const requestBody = {
            provider: provider,
            model: model,
            messages: messageHistory,
            editorState: editorState,
            enableImages: enableImages,
            persona: persona,
            webSearch: webSearchEnabled
        };
        
        console.log('[AI Message] 🌐 Making fetch request to /api/chat');
        console.log('[AI Message] Request body:', JSON.stringify(requestBody, null, 2));
        
        const fetchStartTime = performance.now();
        
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        
        const fetchEndTime = performance.now();
        const fetchDuration = (fetchEndTime - fetchStartTime).toFixed(2);
        
        console.log(`[AI Message] ✓ Fetch completed in ${fetchDuration}ms`);
        console.log('[AI Message] Response status:', response.status, response.statusText);
        console.log('[AI Message] Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                console.error('[AI Message] ❌ Response not OK:', response.status);
                const errorText = await response.text();
                console.error('[AI Message] Error response body (raw):', errorText);
                
                let error;
                try {
                    error = JSON.parse(errorText);
                    console.error('[AI Message] Error response body (parsed):', error);
                } catch (e) {
                    console.error('[AI Message] Could not parse error as JSON');
                    error = { error: errorText };
                }
                
                throw new Error(error.error || `HTTP ${response.status}`);
            }

            const responseText = await response.text();
            console.log('[AI Message] Response body (raw):', responseText);
            
            const data = JSON.parse(responseText);
            console.log('[AI Message] Response body (parsed):', data);
            console.log('[AI Message] Response content type:', typeof data);
            console.log('[AI Message] Response has content array:', Array.isArray(data.content));
            
            if (data.content && data.content[0]) {
                console.log('[AI Message] First content block:', data.content[0]);
                console.log('[AI Message] Assistant response text length:', data.content[0].text?.length || 0);
            }
            
            // Add assistant response
            console.log('[AI Message] Adding assistant response to chat UI...');
            
            // Remove searching indicator if it exists
            if (searchIndicatorId) {
                this.removeSearchingIndicator(searchIndicatorId);
            }
            
            // Get friendly model name
            const modelName = this.getFriendlyModelName(data.model);
            
            // Add message with web search badge if it was used
            this.addMessage('assistant', data.content[0].text, true, modelName, webSearchEnabled, data.sources);
            console.log('[AI Message] ✅ Assistant response added successfully');
            
            // Save assistant response to persistent chat history
            try {
                if (window.chatHistory) {
                    await window.chatHistory.saveMessage('assistant', data.content[0].text);
                    console.log('[Editor] ✓ Saved assistant message to database');
                }
            } catch (error) {
                console.error('[Editor] ❌ Failed to save assistant message:', error);
            }
            
            // Save assistant response to memory
            memory.addInteraction('assistant', data.content[0].text, {
                model: model,
                tokensUsed: data.usage?.output_tokens || 0,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('[AI Message] ❌ Request failed with error:', error);
            console.error('[AI Message] Error type:', error.constructor.name);
            console.error('[AI Message] Error message:', error.message);
            console.error('[AI Message] Error stack:', error.stack);
            
            this.addMessage('system', `Error: ${error.message}`);
            console.log('[AI Message] ✓ Error message added to chat UI');
        } finally {
            // Restore status
            this.aiStatus.textContent = 'Ready';
            this.aiStatus.classList.add('ready');
            console.log('[AI Message] ✓ Status restored to "Ready"');
            
            console.timeEnd('sendAIMessage');
            console.groupEnd();
        }
    }

    addMessage(role, content, isEditable = true, modelName = null, webSearchUsed = false, sources = null) {
        console.group(`💭 Adding ${role} message`);
        
        console.log('[Add Message] Role:', role);
        console.log('[Add Message] Content length:', content?.length || 0);
        console.log('[Add Message] Content preview:', content?.substring(0, 100) + (content?.length > 100 ? '...' : ''));
        console.log('[Add Message] Editable:', isEditable);
        console.log('[Add Message] Model:', modelName);
        console.log('[Add Message] Web Search Used:', webSearchUsed);
        console.log('[Add Message] Sources:', sources?.length || 0);
        
        const messagesContainer = document.getElementById('ai-messages');
        console.log('[Add Message] Messages container found:', !!messagesContainer);
        console.log('[Add Message] Current message count:', messagesContainer?.children.length || 0);
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ${role}`;
        console.log('[Add Message] Created message div with class:', messageDiv.className);
        
        // Add message header with timestamp
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        
        // Show model badge for assistant messages
        const modelBadge = (role === 'assistant' && modelName) 
            ? `<span class="ai-model-badge">${modelName}</span>` 
            : '';
        
        // Show web search badge if used
        const webSearchBadge = (role === 'assistant' && webSearchUsed)
            ? `<span class="web-search-badge" title="This response used real-time web search">🌐 Web Search</span>`
            : '';
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'ai-message-header';
        headerDiv.innerHTML = `
            <span class="ai-message-role">${role === 'user' ? 'You' : (role === 'system' ? 'System' : 'AI')}</span>
            ${modelBadge}
            ${webSearchBadge}
            <span class="ai-message-time">${timeStr}</span>
        `;
        messageDiv.appendChild(headerDiv);
        
        // Add sources if available
        if (role === 'assistant' && sources && sources.length > 0) {
            const sourcesDiv = document.createElement('div');
            sourcesDiv.className = 'web-search-sources';
            sourcesDiv.innerHTML = '<strong>Sources:</strong> ' + 
                sources.map(s => `<a href="${s.url}" target="_blank" title="${s.title}">${new URL(s.url).hostname}</a>`).join(' • ');
            messageDiv.appendChild(sourcesDiv);
        }
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Parse markdown for assistant messages, plain text for user/system
        if (role === 'assistant') {
            contentDiv.innerHTML = this.parseMarkdown(content);
        } else {
            contentDiv.textContent = content;
        }
        console.log('[Add Message] Created content div');
        
        messageDiv.appendChild(contentDiv);
        
        // Add edit button for user messages
        if (role === 'user' && isEditable) {
            const editBtn = document.createElement('button');
            editBtn.className = 'message-edit-btn';
            editBtn.textContent = '✏️';
            editBtn.title = 'Edit message';
            editBtn.onclick = () => this.editMessage(messageDiv, contentDiv);
            messageDiv.appendChild(editBtn);
            console.log('[Add Message] ✓ Edit button added');
        }
        
        messagesContainer.appendChild(messageDiv);
        console.log('[Add Message] ✓ Message appended to DOM');
        
        // Scroll to bottom
        const scrollBefore = messagesContainer.scrollTop;
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        const scrollAfter = messagesContainer.scrollTop;
        console.log('[Add Message] ✓ Scrolled to bottom:', scrollBefore, '→', scrollAfter);

        // Store in conversation history (skip system messages)
        if (role !== 'system') {
            this.conversationHistory.push({ role, content });
            console.log('[Add Message] ✓ Added to conversation history');
            console.log('[Add Message] Conversation history length:', this.conversationHistory.length);
        } else {
            console.log('[Add Message] ℹ️ System message, not added to history');
        }
        
        console.groupEnd();
    }

    buildMessageHistory() {
        console.group('📚 Building Message History');
        
        console.log('[Message History] Total messages in history:', this.conversationHistory.length);
        console.log('[Message History] Full history:', this.conversationHistory);
        
        // Return last 10 messages to keep context manageable
        const recentMessages = this.conversationHistory.slice(-10);
        console.log('[Message History] Returning last 10 messages:', recentMessages.length);
        console.log('[Message History] Recent messages:', recentMessages);
        
        console.groupEnd();
        return recentMessages;
    }

    editMessage(messageDiv, contentDiv) {
        console.group('✏️ Editing Message');
        
        const originalText = contentDiv.textContent;
        console.log('[Edit Message] Original text:', originalText);
        
        // Create textarea for editing
        const textarea = document.createElement('textarea');
        textarea.className = 'message-edit-textarea';
        textarea.value = originalText;
        textarea.rows = Math.max(3, originalText.split('\n').length);
        
        // Create button container
        const btnContainer = document.createElement('div');
        btnContainer.className = 'message-edit-buttons';
        
        const saveBtn = document.createElement('button');
        saveBtn.textContent = '✓ Save';
        saveBtn.className = 'btn-primary btn-sm';
        saveBtn.onclick = () => {
            const newText = textarea.value.trim();
            if (!newText) {
                console.warn('[Edit Message] Empty message, canceling');
                this.cancelEdit(messageDiv, contentDiv, originalText);
                return;
            }
            
            console.log('[Edit Message] New text:', newText);
            contentDiv.textContent = newText;
            
            // Update conversation history
            const messageIndex = Array.from(messageDiv.parentElement.children)
                .filter(el => el.classList.contains('ai-message'))
                .filter(el => el.classList.contains('user') || el.classList.contains('assistant'))
                .indexOf(messageDiv);
            
            if (messageIndex !== -1 && messageIndex < this.conversationHistory.length) {
                this.conversationHistory[messageIndex].content = newText;
                console.log('[Edit Message] ✓ Updated conversation history at index:', messageIndex);
            }
            
            this.cancelEdit(messageDiv, contentDiv, newText);
            this.addMessage('system', '✏️ Message edited. Re-send to get a new response with your changes.');
            console.groupEnd();
        };
        
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '✕ Cancel';
        cancelBtn.className = 'btn-secondary btn-sm';
        cancelBtn.onclick = () => {
            console.log('[Edit Message] Canceled');
            this.cancelEdit(messageDiv, contentDiv, originalText);
            console.groupEnd();
        };
        
        btnContainer.appendChild(saveBtn);
        btnContainer.appendChild(cancelBtn);
        
        // Replace content with edit UI
        contentDiv.style.display = 'none';
        messageDiv.querySelector('.message-edit-btn').style.display = 'none';
        messageDiv.appendChild(textarea);
        messageDiv.appendChild(btnContainer);
        
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        
        console.log('[Edit Message] ✓ Edit mode activated');
    }
    
    cancelEdit(messageDiv, contentDiv, originalText) {
        contentDiv.textContent = originalText;
        contentDiv.style.display = 'block';
        messageDiv.querySelector('.message-edit-btn').style.display = 'block';
        
        const textarea = messageDiv.querySelector('.message-edit-textarea');
        const buttons = messageDiv.querySelector('.message-edit-buttons');
        if (textarea) textarea.remove();
        if (buttons) buttons.remove();
    }
    
    saveCheckpoint() {
        console.group('💾 Saving Checkpoint');
        
        const checkpoint = {
            conversation: [...this.conversationHistory],
            timestamp: Date.now(),
            messageCount: this.conversationHistory.length
        };
        
        localStorage.setItem('ai_checkpoint', JSON.stringify(checkpoint));
        console.log('[Checkpoint] ✓ Saved:', checkpoint);
        
        // Show restore button
        document.getElementById('ai-restore').style.display = 'inline-block';
        
        // Update checkpoint button to show saved state
        const checkpointBtn = document.getElementById('ai-checkpoint');
        checkpointBtn.textContent = '✓';
        setTimeout(() => {
            checkpointBtn.textContent = '💾';
        }, 1000);
        
        this.addMessage('system', `💾 Checkpoint saved with ${checkpoint.messageCount} messages.`);
        console.groupEnd();
    }
    
    restoreCheckpoint() {
        console.group('↩️ Restoring Checkpoint');
        
        const stored = localStorage.getItem('ai_checkpoint');
        if (!stored) {
            console.warn('[Checkpoint] No checkpoint found');
            this.addMessage('system', '⚠️ No checkpoint to restore.');
            console.groupEnd();
            return;
        }
        
        const checkpoint = JSON.parse(stored);
        console.log('[Checkpoint] Loading checkpoint:', checkpoint);
        
        // Clear current conversation
        const messagesContainer = document.getElementById('ai-messages');
        while (messagesContainer.firstChild) {
            messagesContainer.removeChild(messagesContainer.firstChild);
        }
        
        // Restore conversation history
        this.conversationHistory = [...checkpoint.conversation];
        console.log('[Checkpoint] ✓ Restored', checkpoint.messageCount, 'messages');
        
        // Rebuild UI
        checkpoint.conversation.forEach(msg => {
            this.addMessage(msg.role, msg.content, false);
        });
        
        const timeSince = Math.round((Date.now() - checkpoint.timestamp) / 1000);
        this.addMessage('system', `↩️ Checkpoint restored (saved ${timeSince}s ago, ${checkpoint.messageCount} messages).`);
        
        console.groupEnd();
    }

    addSearchingIndicator() {
        const messagesContainer = document.getElementById('ai-messages');
        const indicatorDiv = document.createElement('div');
        const indicatorId = 'search-indicator-' + Date.now();
        indicatorDiv.id = indicatorId;
        indicatorDiv.className = 'ai-message system searching-indicator';
        indicatorDiv.innerHTML = `
            <div class="ai-message-header">
                <span class="ai-message-role">System</span>
            </div>
            <div class="message-content">
                <div class="searching-animation">
                    <span class="search-icon">🔍</span>
                    <span class="search-text">Searching the web...</span>
                    <div class="search-dots">
                        <span>.</span><span>.</span><span>.</span>
                    </div>
                </div>
            </div>
        `;
        messagesContainer.appendChild(indicatorDiv);
        
        // Scroll to show the indicator
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        console.log('[Web Search] Added searching indicator:', indicatorId);
        return indicatorId;
    }

    removeSearchingIndicator(indicatorId) {
        const indicator = document.getElementById(indicatorId);
        if (indicator) {
            indicator.remove();
            console.log('[Web Search] Removed searching indicator:', indicatorId);
        }
    }

    getEditorState() {
        console.group('🎮 Getting Editor State');
        console.time('getEditorState');
        
        console.log('[Editor State] Canvas dimensions:', this.canvas.width, 'x', this.canvas.height);
        console.log('[Editor State] Zoom scale:', this.scale);
        console.log('[Editor State] Pan offset:', { x: this.panX, y: this.panY });
        console.log('[Editor State] Has background:', !!this.background);
        
        if (this.background) {
            console.log('[Editor State] Background:', {
                width: this.background.width,
                height: this.background.height,
                opacity: this.backgroundOpacity
            });
        }
        
        console.log('[Editor State] Object count:', this.objects.length);
        console.log('[Editor State] Selected object:', this.selectedObject ? 'Yes' : 'No');
        
        const state = {
            canvas: {
                width: this.canvas.width,
                height: this.canvas.height,
                scale: this.scale,
                panX: this.panX,
                panY: this.panY
            },
            background: this.background ? {
                width: this.background.width,
                height: this.background.height,
                opacity: this.backgroundOpacity
            } : null,
            objects: this.objects.map((obj, index) => {
                const objState = {
                    x: obj.x,
                    y: obj.y,
                    width: obj.width,
                    height: obj.height,
                    rotation: obj.rotation,
                    layer: obj.layer,
                    locked: obj.locked,
                    name: obj.asset ? obj.asset.name : 'unknown'
                };
                console.log(`[Editor State] Object ${index}:`, objState);
                return objState;
            }),
            selectedObject: this.selectedObject ? {
                x: this.selectedObject.x,
                y: this.selectedObject.y,
                width: this.selectedObject.width,
                height: this.selectedObject.height
            } : null
        };
        
        console.log('[Editor State] Complete state object:', state);
        console.log('[Editor State] State JSON size:', JSON.stringify(state).length, 'bytes');
        
        console.timeEnd('getEditorState');
        console.groupEnd();
        
        return state;
    }

    // ========================================================================
    // MODEL NAME HELPER
    // ========================================================================
    
    getFriendlyModelName(modelId) {
        if (!modelId) return null;
        const modelMap = {
            'claude-sonnet-4-5-20250929': 'Sonnet 4.5',
            'claude-opus-4-5-20251101': 'Opus 4.5',
            'claude-haiku-4-5-20251001': 'Haiku 4.5',
            'gpt-4o': 'GPT-4o',
            'gpt-4o-mini': 'GPT-4o Mini',
            'gpt-5.2': 'GPT-5.2',
            'o1-preview': 'o1 Preview',
            'o1-mini': 'o1 Mini'
        };
        return modelMap[modelId] || modelId;
    }
    
    // ========================================================================
    // MARKDOWN PARSER
    // ========================================================================
    
    parseMarkdown(text) {
        if (!text) return '';
        
        let html = text;
        
        // Escape HTML to prevent XSS
        html = html.replace(/&/g, '&amp;')
                   .replace(/</g, '&lt;')
                   .replace(/>/g, '&gt;');
        
        // Headers (### Header, ## Header, # Header)
        html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
        
        // Bold (**text** or __text__)
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
        
        // Italic (*text* or _text_)
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        html = html.replace(/_(.+?)_/g, '<em>$1</em>');
        
        // Code blocks (```code```)
        html = html.replace(/```(\w*)\n([\s\S]+?)```/g, (match, lang, code) => {
            return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
        });
        
        // Inline code (`code`)
        html = html.replace(/`(.+?)`/g, '<code>$1</code>');
        
        // Links ([text](url))
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
        
        // Unordered lists (- item or * item)
        html = html.replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
        
        // Ordered lists (1. item)
        html = html.replace(/^\s*\d+\.\s+(.+)$/gm, '<li>$1</li>');
        
        // Blockquotes (> text)
        html = html.replace(/^&gt;\s+(.+)$/gm, '<blockquote>$1</blockquote>');
        
        // Horizontal rules (--- or ***)
        html = html.replace(/^(---|\*\*\*)$/gm, '<hr>');
        
        // Line breaks (double newline = paragraph)
        html = html.split('\n\n').map(para => {
            if (para.trim() && !para.startsWith('<')) {
                return `<p>${para.trim()}</p>`;
            }
            return para;
        }).join('\n');
        
        // Single line breaks
        html = html.replace(/\n/g, '<br>');
        
        return html;
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
