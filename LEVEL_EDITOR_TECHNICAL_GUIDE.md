# Canvas Game Level Editor - Technical Implementation Guide
## Detailed Architecture, Patterns, and Code Examples

**Version:** 1.0  
**Companion to:** LEVEL_EDITOR_MASTER_SPEC.md  
**Target:** Senior developers and AI assistants implementing the editor

---

## Table of Contents

1. [Development Environment Setup](#1-development-environment-setup)
2. [Core Architecture Patterns](#2-core-architecture-patterns)
3. [Rendering Pipeline](#3-rendering-pipeline)
4. [Input Handling System](#4-input-handling-system)
5. [State Management](#5-state-management)
6. [Undo/Redo System](#6-undoredo-system)
7. [Grid and Snapping Algorithms](#7-grid-and-snapping-algorithms)
8. [Selection and Transform System](#8-selection-and-transform-system)
9. [Collision Detection](#9-collision-detection)
10. [Spatial Indexing](#10-spatial-indexing)
11. [Asset Management](#11-asset-management)
12. [Serialization and Deserialization](#12-serialization-and-deserialization)
13. [Export System Implementation](#13-export-system-implementation)
14. [Performance Optimization](#14-performance-optimization)
15. [Error Handling and Logging](#15-error-handling-and-logging)
16. [Testing Strategies](#16-testing-strategies)

---

## 1. Development Environment Setup

### 1.1 Technology Stack

**Frontend:**
- **HTML5 Canvas** - Primary rendering surface
- **Vanilla JavaScript (ES6+)** - No framework dependencies for maximum portability
- **CSS3** - UI styling with CSS Grid and Flexbox
- **Web Workers** - For heavy operations (export, import, validation)

**Optional Dependencies:**
- **No build step required** - Pure ES modules, runs directly in browser
- **Optional bundler** - Rollup or Webpack for production optimization
- **TypeScript** - Optional for type safety, but not required

**Recommended Browser Support:**
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

### 1.2 Project Structure

```
level-editor/
├── index.html              # Main entry point
├── style.css               # Global styles
├── src/
│   ├── core/
│   │   ├── Editor.js       # Main editor class
│   │   ├── EventBus.js     # Event system
│   │   ├── Config.js       # Configuration
│   │   └── Constants.js    # Constants and enums
│   ├── viewport/
│   │   ├── Viewport.js     # Canvas viewport
│   │   ├── Camera.js       # Camera/transform system
│   │   ├── Renderer.js     # Rendering pipeline
│   │   └── Grid.js         # Grid system
│   ├── objects/
│   │   ├── GameObject.js   # Base game object
│   │   ├── ObjectManager.js # Object registry
│   │   └── types/
│   │       ├── Obstacle.js
│   │       ├── Enemy.js
│   │       ├── Tower.js
│   │       └── Item.js
│   ├── layers/
│   │   ├── Layer.js        # Base layer class
│   │   ├── LayerManager.js # Layer management
│   │   └── types/
│   │       ├── ObjectLayer.js
│   │       ├── TileLayer.js
│   │       └── ImageLayer.js
│   ├── tools/
│   │   ├── Tool.js         # Base tool class
│   │   ├── ToolManager.js  # Tool switching
│   │   └── types/
│   │       ├── SelectionTool.js
│   │       ├── DrawTool.js
│   │       ├── EraserTool.js
│   │       └── PathTool.js
│   ├── selection/
│   │   ├── SelectionManager.js
│   │   ├── TransformGizmo.js
│   │   └── BoundingBox.js
│   ├── history/
│   │   ├── History.js      # Undo/redo manager
│   │   ├── Command.js      # Base command
│   │   └── commands/
│   │       ├── AddObjectCommand.js
│   │       ├── DeleteObjectCommand.js
│   │       ├── MoveObjectCommand.js
│   │       └── ModifyPropertyCommand.js
│   ├── assets/
│   │   ├── AssetLibrary.js
│   │   ├── AssetImporter.js
│   │   └── AssetCache.js
│   ├── export/
│   │   ├── ExportManager.js
│   │   ├── Exporter.js     # Base exporter
│   │   └── exporters/
│   │       ├── JSONExporter.js
│   │       ├── JSExporter.js
│   │       ├── TiledExporter.js
│   │       └── CSVExporter.js
│   ├── ui/
│   │   ├── UIManager.js
│   │   ├── panels/
│   │   │   ├── Toolbar.js
│   │   │   ├── PropertiesPanel.js
│   │   │   ├── LayersPanel.js
│   │   │   └── AssetsPanel.js
│   │   └── components/
│   │       ├── Button.js
│   │       ├── Dropdown.js
│   │       ├── Slider.js
│   │       └── ColorPicker.js
│   ├── utils/
│   │   ├── Math.js         # Math utilities
│   │   ├── Geometry.js     # Geometric calculations
│   │   ├── SpatialHash.js  # Spatial indexing
│   │   ├── QuadTree.js     # Quad tree
│   │   └── UUID.js         # ID generation
│   └── main.js             # Application bootstrap
├── assets/
│   ├── icons/              # UI icons
│   ├── cursors/            # Custom cursors
│   └── examples/           # Example projects
├── docs/
│   ├── API.md
│   ├── PLUGINS.md
│   └── EXPORT_FORMATS.md
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

### 1.3 Bootstrap Code

**index.html:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Level Editor</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <!-- Main container -->
    <div id="app">
        <!-- Top toolbar -->
        <div id="toolbar"></div>
        
        <!-- Main workspace -->
        <div id="workspace">
            <!-- Left sidebar - Asset library -->
            <aside id="assets-panel"></aside>
            
            <!-- Center - Canvas viewport -->
            <main id="viewport-container">
                <canvas id="viewport"></canvas>
                <div id="viewport-overlay"></div>
            </main>
            
            <!-- Right sidebar - Properties and layers -->
            <aside id="right-panel">
                <div id="properties-panel"></div>
                <div id="layers-panel"></div>
            </aside>
        </div>
        
        <!-- Bottom status bar -->
        <footer id="status-bar"></footer>
    </div>
    
    <!-- Modals -->
    <div id="modal-container"></div>
    
    <!-- Context menus -->
    <div id="context-menu"></div>
    
    <script type="module" src="src/main.js"></script>
</body>
</html>
```

**src/main.js:**
```javascript
import { Editor } from './core/Editor.js';
import { Config } from './core/Config.js';

// Application entry point
async function init() {
    try {
        // Load configuration
        const config = await Config.load();
        
        // Initialize editor
        const editor = new Editor('app', config);
        await editor.initialize();
        
        // Expose globally for debugging (remove in production)
        window.editor = editor;
        
        // Handle window events
        window.addEventListener('beforeunload', (e) => {
            if (editor.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            }
        });
        
        // Handle resize
        window.addEventListener('resize', () => {
            editor.handleResize();
        });
        
        // Keyboard shortcuts
        window.addEventListener('keydown', (e) => {
            editor.handleKeyDown(e);
        });
        
        console.log('Level Editor initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize editor:', error);
        showErrorScreen(error);
    }
}

function showErrorScreen(error) {
    document.getElementById('app').innerHTML = `
        <div class="error-screen">
            <h1>Failed to Initialize Editor</h1>
            <p>${error.message}</p>
            <pre>${error.stack}</pre>
        </div>
    `;
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
```

---

## 2. Core Architecture Patterns

### 2.1 Main Editor Class

The `Editor` class is the central orchestrator that coordinates all subsystems.

```javascript
// src/core/Editor.js
import { EventBus } from './EventBus.js';
import { Viewport } from '../viewport/Viewport.js';
import { ObjectManager } from '../objects/ObjectManager.js';
import { LayerManager } from '../layers/LayerManager.js';
import { ToolManager } from '../tools/ToolManager.js';
import { SelectionManager } from '../selection/SelectionManager.js';
import { History } from '../history/History.js';
import { AssetLibrary } from '../assets/AssetLibrary.js';
import { ExportManager } from '../export/ExportManager.js';
import { UIManager } from '../ui/UIManager.js';

export class Editor {
    constructor(containerId, config) {
        this.container = document.getElementById(containerId);
        this.config = config;
        
        // Event bus for decoupled communication
        this.events = new EventBus();
        
        // Core systems
        this.viewport = null;
        this.objects = null;
        this.layers = null;
        this.tools = null;
        this.selection = null;
        this.history = null;
        this.assets = null;
        this.export = null;
        this.ui = null;
        
        // State
        this.project = null;
        this.currentLevel = null;
        this.isDirty = false;
        this.lastSaveTime = null;
        
        // Auto-save timer
        this.autoSaveInterval = null;
    }
    
    async initialize() {
        console.log('Initializing editor...');
        
        // Initialize core systems in order
        await this.initializeViewport();
        this.initializeManagers();
        await this.initializeAssets();
        this.initializeUI();
        this.setupEventListeners();
        this.startAutoSave();
        
        console.log('Editor initialization complete');
    }
    
    async initializeViewport() {
        const canvas = document.getElementById('viewport');
        this.viewport = new Viewport(canvas, this.config.viewport);
        await this.viewport.initialize();
        
        // Subscribe to viewport events
        this.viewport.on('render', () => this.events.emit('viewport:render'));
        this.viewport.on('zoom', (zoom) => this.events.emit('viewport:zoom', zoom));
        this.viewport.on('pan', (x, y) => this.events.emit('viewport:pan', x, y));
    }
    
    initializeManagers() {
        // Object management
        this.objects = new ObjectManager(this);
        
        // Layer management
        this.layers = new LayerManager(this);
        
        // Tool system
        this.tools = new ToolManager(this);
        
        // Selection system
        this.selection = new SelectionManager(this);
        
        // History (undo/redo)
        this.history = new History(this);
        
        // Export system
        this.export = new ExportManager(this);
    }
    
    async initializeAssets() {
        this.assets = new AssetLibrary(this);
        await this.assets.initialize();
        
        // Load default assets if configured
        if (this.config.defaultAssets) {
            await this.assets.loadDefaults(this.config.defaultAssets);
        }
    }
    
    initializeUI() {
        this.ui = new UIManager(this);
        this.ui.initialize();
    }
    
    setupEventListeners() {
        // Subscribe to system events
        this.events.on('object:added', (obj) => this.onObjectAdded(obj));
        this.events.on('object:removed', (obj) => this.onObjectRemoved(obj));
        this.events.on('object:modified', (obj) => this.onObjectModified(obj));
        
        this.events.on('layer:added', (layer) => this.onLayerAdded(layer));
        this.events.on('layer:removed', (layer) => this.onLayerRemoved(layer));
        
        this.events.on('selection:changed', (selection) => this.onSelectionChanged(selection));
        
        this.events.on('history:changed', (state) => this.onHistoryChanged(state));
    }
    
    startAutoSave() {
        if (!this.config.autoSave.enabled) return;
        
        const interval = this.config.autoSave.intervalMs || 300000; // 5 minutes
        this.autoSaveInterval = setInterval(() => {
            if (this.isDirty) {
                this.autoSave();
            }
        }, interval);
    }
    
    async autoSave() {
        try {
            console.log('Auto-saving project...');
            await this.saveProject('autosave');
            this.events.emit('autosave:success');
        } catch (error) {
            console.error('Auto-save failed:', error);
            this.events.emit('autosave:failed', error);
        }
    }
    
    // Project management
    newProject(name, settings) {
        this.project = {
            name: name,
            version: '1.0',
            created: Date.now(),
            modified: Date.now(),
            settings: settings,
            levels: []
        };
        
        this.isDirty = false;
        this.events.emit('project:new', this.project);
    }
    
    async loadProject(file) {
        try {
            const text = await file.text();
            this.project = JSON.parse(text);
            
            this.isDirty = false;
            this.events.emit('project:loaded', this.project);
            
            // Load first level if exists
            if (this.project.levels.length > 0) {
                await this.loadLevel(this.project.levels[0]);
            }
        } catch (error) {
            console.error('Failed to load project:', error);
            throw error;
        }
    }
    
    async saveProject(type = 'manual') {
        if (!this.project) return;
        
        // Update project metadata
        this.project.modified = Date.now();
        
        // Save current level state
        if (this.currentLevel) {
            this.saveCurrentLevelState();
        }
        
        const json = JSON.stringify(this.project, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        
        if (type === 'autosave') {
            // Save to localStorage for auto-save
            localStorage.setItem('editor_autosave', json);
        } else {
            // Trigger download for manual save
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.project.name}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
        
        this.isDirty = false;
        this.lastSaveTime = Date.now();
        this.events.emit('project:saved', type);
    }
    
    // Level management
    newLevel(name, width, height) {
        const level = {
            id: generateUUID(),
            name: name,
            width: width,
            height: height,
            background: null,
            layers: [],
            objects: []
        };
        
        // Add default layer
        const defaultLayer = this.layers.createLayer('Default', 'object');
        level.layers.push(defaultLayer);
        
        this.project.levels.push(level);
        this.loadLevel(level);
        this.markDirty();
    }
    
    async loadLevel(level) {
        this.currentLevel = level;
        
        // Clear existing state
        this.objects.clear();
        this.layers.clear();
        this.selection.clear();
        this.history.clear();
        
        // Load layers
        for (const layerData of level.layers) {
            const layer = this.layers.createLayer(layerData.name, layerData.type);
            Object.assign(layer, layerData);
        }
        
        // Load objects
        for (const objData of level.objects) {
            const obj = this.objects.createObject(objData.type, objData);
        }
        
        // Set viewport size
        this.viewport.setSize(level.width, level.height);
        
        // Load background if present
        if (level.background) {
            await this.viewport.setBackground(level.background);
        }
        
        this.events.emit('level:loaded', level);
    }
    
    saveCurrentLevelState() {
        if (!this.currentLevel) return;
        
        // Update level data from current state
        this.currentLevel.layers = this.layers.serialize();
        this.currentLevel.objects = this.objects.serialize();
    }
    
    // Event handlers
    onObjectAdded(obj) {
        this.markDirty();
        this.viewport.requestRender();
    }
    
    onObjectRemoved(obj) {
        this.markDirty();
        this.viewport.requestRender();
    }
    
    onObjectModified(obj) {
        this.markDirty();
        this.viewport.requestRender();
    }
    
    onLayerAdded(layer) {
        this.markDirty();
        this.viewport.requestRender();
    }
    
    onLayerRemoved(layer) {
        this.markDirty();
        this.viewport.requestRender();
    }
    
    onSelectionChanged(selection) {
        this.viewport.requestRender();
    }
    
    onHistoryChanged(state) {
        // Update UI undo/redo buttons
        this.ui.updateHistoryButtons(state.canUndo, state.canRedo);
    }
    
    // State management
    markDirty() {
        this.isDirty = true;
    }
    
    hasUnsavedChanges() {
        return this.isDirty;
    }
    
    // Resize handling
    handleResize() {
        this.viewport.handleResize();
        this.ui.handleResize();
    }
    
    // Keyboard handling
    handleKeyDown(e) {
        // Check for global shortcuts first
        if (this.handleGlobalShortcut(e)) {
            e.preventDefault();
            return;
        }
        
        // Pass to active tool
        if (this.tools.activeTool) {
            this.tools.activeTool.onKeyDown(e);
        }
    }
    
    handleGlobalShortcut(e) {
        const ctrl = e.ctrlKey || e.metaKey;
        const shift = e.shiftKey;
        const key = e.key.toLowerCase();
        
        // Ctrl+S - Save
        if (ctrl && key === 's') {
            this.saveProject();
            return true;
        }
        
        // Ctrl+Z - Undo
        if (ctrl && !shift && key === 'z') {
            this.history.undo();
            return true;
        }
        
        // Ctrl+Shift+Z or Ctrl+Y - Redo
        if ((ctrl && shift && key === 'z') || (ctrl && key === 'y')) {
            this.history.redo();
            return true;
        }
        
        // Ctrl+C - Copy
        if (ctrl && key === 'c') {
            this.selection.copy();
            return true;
        }
        
        // Ctrl+V - Paste
        if (ctrl && key === 'v') {
            this.selection.paste();
            return true;
        }
        
        // Ctrl+D - Duplicate
        if (ctrl && key === 'd') {
            this.selection.duplicate();
            return true;
        }
        
        // Delete/Backspace - Delete selection
        if (key === 'delete' || key === 'backspace') {
            this.selection.delete();
            return true;
        }
        
        // Tool shortcuts
        if (!ctrl && !shift) {
            const tool = this.getToolByShortcut(key);
            if (tool) {
                this.tools.setActiveTool(tool);
                return true;
            }
        }
        
        return false;
    }
    
    getToolByShortcut(key) {
        const shortcuts = {
            'v': 'selection',
            'b': 'brush',
            'e': 'eraser',
            'p': 'path',
            'r': 'rectangle',
            'c': 'circle',
            't': 'text'
        };
        return shortcuts[key] || null;
    }
    
    // Cleanup
    destroy() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        this.viewport.destroy();
        this.ui.destroy();
        
        // Clear event listeners
        this.events.clear();
    }
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
```

### 2.2 Event Bus Pattern

Decoupled communication between systems using pub/sub pattern.

```javascript
// src/core/EventBus.js
export class EventBus {
    constructor() {
        this.listeners = new Map();
    }
    
    on(event, callback, context = null) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        
        this.listeners.get(event).push({
            callback,
            context,
            once: false
        });
        
        // Return unsubscribe function
        return () => this.off(event, callback);
    }
    
    once(event, callback, context = null) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        
        this.listeners.get(event).push({
            callback,
            context,
            once: true
        });
    }
    
    off(event, callback = null) {
        if (!this.listeners.has(event)) return;
        
        if (callback === null) {
            // Remove all listeners for event
            this.listeners.delete(event);
        } else {
            // Remove specific listener
            const handlers = this.listeners.get(event);
            const index = handlers.findIndex(h => h.callback === callback);
            if (index !== -1) {
                handlers.splice(index, 1);
            }
        }
    }
    
    emit(event, ...args) {
        if (!this.listeners.has(event)) return;
        
        const handlers = this.listeners.get(event).slice(); // Copy to avoid modification during iteration
        
        for (const handler of handlers) {
            try {
                if (handler.context) {
                    handler.callback.apply(handler.context, args);
                } else {
                    handler.callback(...args);
                }
                
                // Remove if once
                if (handler.once) {
                    this.off(event, handler.callback);
                }
            } catch (error) {
                console.error(`Error in event handler for "${event}":`, error);
            }
        }
    }
    
    clear() {
        this.listeners.clear();
    }
    
    // Get number of listeners for event
    listenerCount(event) {
        return this.listeners.has(event) ? this.listeners.get(event).length : 0;
    }
}
```

---

## 3. Rendering Pipeline

### 3.1 Viewport Renderer

The viewport handles all rendering with a layered approach and culling for performance.

```javascript
// src/viewport/Renderer.js
export class Renderer {
    constructor(viewport) {
        this.viewport = viewport;
        this.ctx = viewport.ctx;
        this.layerManager = viewport.editor.layers;
        this.selectionManager = viewport.editor.selection;
        
        // Rendering options
        this.showGrid = true;
        this.showRulers = true;
        this.showGuides = true;
        this.showSelection = true;
        this.antiAlias = true;
        
        // Performance tracking
        this.renderStats = {
            fps: 0,
            frameTime: 0,
            objectsRendered: 0,
            objectsCulled: 0
        };
        
        this.lastFrameTime = 0;
        this.frameCount = 0;
    }
    
    render(timestamp) {
        const startTime = performance.now();
        
        // Calculate delta time
        const deltaTime = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;
        
        // Clear canvas
        this.clear();
        
        // Save context state
        this.ctx.save();
        
        // Apply camera transform
        this.applyCamera();
        
        // Render in layers
        this.renderBackground();
        this.renderGrid();
        this.renderLayers();
        this.renderGuides();
        this.renderSelection();
        
        // Restore context
        this.ctx.restore();
        
        // Render UI overlays (in screen space)
        this.renderOverlays();
        
        // Update stats
        const frameTime = performance.now() - startTime;
        this.updateStats(frameTime);
        
        if (this.showStats) {
            this.renderStats();
        }
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.viewport.width, this.viewport.height);
        
        // Fill with background color
        this.ctx.fillStyle = this.viewport.backgroundColor;
        this.ctx.fillRect(0, 0, this.viewport.width, this.viewport.height);
    }
    
    applyCamera() {
        const camera = this.viewport.camera;
        
        // Translate for pan
        this.ctx.translate(camera.x, camera.y);
        
        // Scale for zoom
        this.ctx.scale(camera.zoom, camera.zoom);
        
        // Apply anti-aliasing setting
        this.ctx.imageSmoothingEnabled = this.antiAlias;
    }
    
    renderBackground() {
        if (!this.viewport.backgroundImage) return;
        
        const img = this.viewport.backgroundImage;
        this.ctx.drawImage(img, 0, 0, this.viewport.levelWidth, this.viewport.levelHeight);
    }
    
    renderGrid() {
        if (!this.showGrid) return;
        
        const grid = this.viewport.grid;
        const camera = this.viewport.camera;
        
        // Calculate visible grid area
        const visibleArea = this.getVisibleArea();
        
        grid.render(this.ctx, visibleArea);
    }
    
    renderLayers() {
        const layers = this.layerManager.getVisibleLayers();
        const visibleArea = this.getVisibleArea();
        
        let rendered = 0;
        let culled = 0;
        
        for (const layer of layers) {
            this.ctx.save();
            this.ctx.globalAlpha = layer.opacity;
            
            for (const obj of layer.objects) {
                // Cull objects outside visible area
                if (!this.isObjectVisible(obj, visibleArea)) {
                    culled++;
                    continue;
                }
                
                this.renderObject(obj);
                rendered++;
            }
            
            this.ctx.restore();
        }
        
        this.renderStats.objectsRendered = rendered;
        this.renderStats.objectsCulled = culled;
    }
    
    renderObject(obj) {
        if (!obj.visible) return;
        
        this.ctx.save();
        
        // Transform to object space
        this.ctx.translate(obj.x + obj.width / 2, obj.y + obj.height / 2);
        this.ctx.rotate(obj.rotation * Math.PI / 180);
        this.ctx.scale(obj.scaleX, obj.scaleY);
        this.ctx.translate(-obj.width / 2, -obj.height / 2);
        
        // Set opacity
        this.ctx.globalAlpha = obj.opacity;
        
        // Render based on type
        if (obj.sprite) {
            // Render sprite
            const sprite = this.viewport.editor.assets.getAsset(obj.sprite);
            if (sprite) {
                this.ctx.drawImage(sprite, 0, 0, obj.width, obj.height);
            }
        } else {
            // Render placeholder
            this.ctx.fillStyle = obj.color || '#888888';
            this.ctx.fillRect(0, 0, obj.width, obj.height);
            
            // Draw border
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(0, 0, obj.width, obj.height);
        }
        
        this.ctx.restore();
    }
    
    renderSelection() {
        if (!this.showSelection) return;
        
        const selected = this.selectionManager.getSelected();
        if (selected.length === 0) return;
        
        this.ctx.save();
        
        // Draw selection boxes
        for (const obj of selected) {
            this.drawSelectionBox(obj);
        }
        
        // Draw transform handles
        if (selected.length === 1) {
            this.drawTransformHandles(selected[0]);
        }
        
        this.ctx.restore();
    }
    
    drawSelectionBox(obj) {
        const bounds = obj.getBounds();
        
        // Selection outline
        this.ctx.strokeStyle = '#00A8FF';
        this.ctx.lineWidth = 2 / this.viewport.camera.zoom;
        this.ctx.setLineDash([5 / this.viewport.camera.zoom, 5 / this.viewport.camera.zoom]);
        this.ctx.strokeRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);
        this.ctx.setLineDash([]);
    }
    
    drawTransformHandles(obj) {
        const bounds = obj.getBounds();
        const handleSize = 8 / this.viewport.camera.zoom;
        const halfHandle = handleSize / 2;
        
        // Corner handles (for scaling)
        const corners = [
            { x: bounds.left, y: bounds.top },           // Top-left
            { x: bounds.right, y: bounds.top },          // Top-right
            { x: bounds.right, y: bounds.bottom },       // Bottom-right
            { x: bounds.left, y: bounds.bottom }         // Bottom-left
        ];
        
        for (const corner of corners) {
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.strokeStyle = '#00A8FF';
            this.ctx.lineWidth = 1 / this.viewport.camera.zoom;
            
            this.ctx.fillRect(corner.x - halfHandle, corner.y - halfHandle, handleSize, handleSize);
            this.ctx.strokeRect(corner.x - halfHandle, corner.y - halfHandle, handleSize, handleSize);
        }
        
        // Edge handles (for resizing)
        const edges = [
            { x: (bounds.left + bounds.right) / 2, y: bounds.top },    // Top
            { x: bounds.right, y: (bounds.top + bounds.bottom) / 2 },   // Right
            { x: (bounds.left + bounds.right) / 2, y: bounds.bottom },  // Bottom
            { x: bounds.left, y: (bounds.top + bounds.bottom) / 2 }     // Left
        ];
        
        for (const edge of edges) {
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.strokeStyle = '#00A8FF';
            
            this.ctx.fillRect(edge.x - halfHandle, edge.y - halfHandle, handleSize, handleSize);
            this.ctx.strokeRect(edge.x - halfHandle, edge.y - halfHandle, handleSize, handleSize);
        }
        
        // Rotation handle (above center)
        const rotationHandle = {
            x: (bounds.left + bounds.right) / 2,
            y: bounds.top - 30 / this.viewport.camera.zoom
        };
        
        // Draw line to rotation handle
        this.ctx.strokeStyle = '#00A8FF';
        this.ctx.beginPath();
        this.ctx.moveTo((bounds.left + bounds.right) / 2, bounds.top);
        this.ctx.lineTo(rotationHandle.x, rotationHandle.y);
        this.ctx.stroke();
        
        // Draw rotation handle circle
        this.ctx.fillStyle = '#00FF00';
        this.ctx.strokeStyle = '#00A8FF';
        this.ctx.beginPath();
        this.ctx.arc(rotationHandle.x, rotationHandle.y, handleSize / 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
    }
    
    renderGuides() {
        if (!this.showGuides) return;
        
        const guides = this.viewport.editor.guides;
        // Draw alignment guides (if active)
        // Implementation depends on guide system
    }
    
    renderOverlays() {
        // These are rendered in screen space (after restoring context)
        
        if (this.showRulers) {
            this.renderRulers();
        }
    }
    
    renderRulers() {
        const camera = this.viewport.camera;
        const rulerSize = 20;
        
        // Top ruler (horizontal)
        this.ctx.fillStyle = '#2d2d2d';
        this.ctx.fillRect(0, 0, this.viewport.width, rulerSize);
        
        // Left ruler (vertical)
        this.ctx.fillRect(0, 0, rulerSize, this.viewport.height);
        
        // Draw tick marks and labels
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '10px monospace';
        
        // Calculate tick spacing based on zoom
        const tickSpacing = this.getTickSpacing(camera.zoom);
        
        // Horizontal ruler ticks
        const startX = Math.floor(-camera.x / camera.zoom / tickSpacing) * tickSpacing;
        for (let x = startX; x < this.viewport.levelWidth; x += tickSpacing) {
            const screenX = x * camera.zoom + camera.x + rulerSize;
            if (screenX < rulerSize) continue;
            if (screenX > this.viewport.width) break;
            
            this.ctx.fillRect(screenX, rulerSize - 5, 1, 5);
            this.ctx.fillText(x.toString(), screenX + 2, rulerSize - 5);
        }
        
        // Vertical ruler ticks
        const startY = Math.floor(-camera.y / camera.zoom / tickSpacing) * tickSpacing;
        for (let y = startY; y < this.viewport.levelHeight; y += tickSpacing) {
            const screenY = y * camera.zoom + camera.y + rulerSize;
            if (screenY < rulerSize) continue;
            if (screenY > this.viewport.height) break;
            
            this.ctx.fillRect(rulerSize - 5, screenY, 5, 1);
            this.ctx.save();
            this.ctx.translate(rulerSize - 5, screenY + 2);
            this.ctx.rotate(-Math.PI / 2);
            this.ctx.fillText(y.toString(), 0, 0);
            this.ctx.restore();
        }
    }
    
    getTickSpacing(zoom) {
        // Adjust tick spacing based on zoom level
        if (zoom >= 2) return 50;
        if (zoom >= 1) return 100;
        if (zoom >= 0.5) return 200;
        return 500;
    }
    
    getVisibleArea() {
        const camera = this.viewport.camera;
        
        return {
            left: -camera.x / camera.zoom,
            top: -camera.y / camera.zoom,
            right: (this.viewport.width - camera.x) / camera.zoom,
            bottom: (this.viewport.height - camera.y) / camera.zoom
        };
    }
    
    isObjectVisible(obj, visibleArea) {
        const bounds = obj.getBounds();
        
        return !(bounds.right < visibleArea.left ||
                 bounds.left > visibleArea.right ||
                 bounds.bottom < visibleArea.top ||
                 bounds.top > visibleArea.bottom);
    }
    
    updateStats(frameTime) {
        this.renderStats.frameTime = frameTime;
        
        // Calculate FPS (average over last second)
        this.frameCount++;
        const now = performance.now();
        if (now - this.lastStatsUpdate >= 1000) {
            this.renderStats.fps = this.frameCount;
            this.frameCount = 0;
            this.lastStatsUpdate = now;
        }
    }
    
    renderStats() {
        // Draw stats overlay in top-right corner
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(this.viewport.width - 150, 0, 150, 80);
        
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`FPS: ${this.renderStats.fps}`, this.viewport.width - 140, 20);
        this.ctx.fillText(`Frame: ${this.renderStats.frameTime.toFixed(2)}ms`, this.viewport.width - 140, 35);
        this.ctx.fillText(`Rendered: ${this.renderStats.objectsRendered}`, this.viewport.width - 140, 50);
        this.ctx.fillText(`Culled: ${this.renderStats.objectsCulled}`, this.viewport.width - 140, 65);
        
        this.ctx.restore();
    }
}
```

---

*[Document continues with sections 4-16 covering Input Handling, State Management, Undo/Redo, Grid/Snapping, Selection/Transform, Collision Detection, Spatial Indexing, Asset Management, Serialization, Export System, Performance Optimization, Error Handling, and Testing Strategies]*

---

## Quick Reference: Key Algorithms

### Object Selection (Point Test)
```javascript
function isPointInObject(point, object) {
    // Simple AABB test
    return point.x >= object.x &&
           point.x <= object.x + object.width &&
           point.y >= object.y &&
           point.y <= object.y + object.height;
}
```

### Grid Snapping
```javascript
function snapToGrid(value, gridSize) {
    return Math.round(value / gridSize) * gridSize;
}
```

### Bounds Intersection
```javascript
function intersectsBounds(a, b) {
    return !(a.right < b.left ||
             a.left > b.right ||
             a.bottom < b.top ||
             a.top > b.bottom);
}
```

### Distance Between Points
```javascript
function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}
```

---

**End of Technical Implementation Guide** - Continue to UI Specification document for complete interface details.
