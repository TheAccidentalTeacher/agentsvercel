# Canvas Game Level Editor - Implementation Plan
## Step-by-Step Build Guide with Milestones and Testing

**Version:** 1.0  
**Companion to:** All previous level editor documentation  
**Target:** Implementers, AI assistants building the editor

---

## Table of Contents

1. [Implementation Strategy](#1-implementation-strategy)
2. [Development Phases](#2-development-phases)
3. [Phase 1: Foundation (Days 1-3)](#3-phase-1-foundation-days-1-3)
4. [Phase 2: Core Features (Days 4-7)](#4-phase-2-core-features-days-4-7)
5. [Phase 3: Advanced Features (Days 8-10)](#5-phase-3-advanced-features-days-8-10)
6. [Phase 4: Polish & Testing (Days 11-14)](#6-phase-4-polish--testing-days-11-14)
7. [Testing Strategy](#7-testing-strategy)
8. [Deployment Guide](#8-deployment-guide)
9. [Troubleshooting Common Issues](#9-troubleshooting-common-issues)
10. [Post-Launch Roadmap](#10-post-launch-roadmap)

---

## 1. Implementation Strategy

### 1.1 Core Principles

**Build Incrementally:**
- Start with simplest working version
- Add features one at a time
- Test after each feature
- Never break existing functionality

**Vertical Slices:**
Rather than building "all UI, then all logic, then all data", build complete features:
- ✅ Feature 1: Place single object on canvas
- ✅ Feature 2: Move object with mouse
- ✅ Feature 3: Export object to JSON
- ✅ Feature 4: Load object from JSON
- ... and so on

**Constant Validation:**
- Test in real browser after every major change
- Use Tower Defense JSON format from day 1
- Import test level, verify it works in game
- Fix issues immediately, don't accumulate bugs

### 1.2 Technology Stack

**Required Technologies:**
```
Browser:    Chrome/Firefox/Edge (latest)
Language:   JavaScript ES6+ (no TypeScript needed)
Canvas:     HTML5 Canvas API
Storage:    localStorage + File API
No Build:   No webpack, no npm, pure HTML/CSS/JS
```

**Development Tools:**
```
Editor:     VS Code (or any text editor)
Server:     Live Server extension (VS Code) or Python http.server
Debugging:  Chrome DevTools
Version:    Git (optional but recommended)
```

**File Structure:**
```
level-editor/
├── index.html              # Main HTML file
├── css/
│   ├── main.css           # Layout and theme
│   ├── panels.css         # Panel-specific styles
│   └── components.css     # Reusable components
├── js/
│   ├── main.js            # Entry point
│   ├── core/
│   │   ├── Editor.js      # Main editor class
│   │   ├── EventBus.js    # Event system
│   │   └── Config.js      # Configuration
│   ├── viewport/
│   │   ├── Renderer.js    # Canvas rendering
│   │   ├── Viewport.js    # Viewport management
│   │   └── Camera.js      # Pan/zoom camera
│   ├── objects/
│   │   ├── GameObject.js  # Base object class
│   │   └── ObjectManager.js
│   ├── layers/
│   │   ├── Layer.js
│   │   └── LayerManager.js
│   ├── tools/
│   │   ├── Tool.js        # Base tool class
│   │   ├── SelectionTool.js
│   │   ├── PenTool.js
│   │   └── BrushTool.js
│   ├── selection/
│   │   └── SelectionManager.js
│   ├── history/
│   │   └── HistoryManager.js
│   ├── assets/
│   │   └── AssetManager.js
│   ├── export/
│   │   ├── Exporter.js
│   │   └── JSONExporter.js
│   └── ui/
│       ├── UIManager.js
│       ├── Toolbar.js
│       ├── AssetPanel.js
│       ├── PropertiesPanel.js
│       └── LayersPanel.js
└── assets/
    ├── icons/             # UI icons
    └── test/              # Test images
```

### 1.3 Development Environment Setup

**Step 1: Create project folder**
```powershell
mkdir level-editor
cd level-editor
mkdir css, js, assets
mkdir js\core, js\viewport, js\objects, js\layers, js\tools, js\selection, js\history, js\assets, js\export, js\ui
```

**Step 2: Initialize Git (optional)**
```powershell
git init
echo "node_modules/" > .gitignore
git add .
git commit -m "Initial commit"
```

**Step 3: Create basic index.html**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Canvas Game Level Editor</title>
    <link rel="stylesheet" href="css/main.css">
</head>
<body>
    <div id="app">
        <div id="loading">
            <div class="spinner"></div>
            <p>Loading editor...</p>
        </div>
    </div>
    
    <!-- Load modules in dependency order -->
    <script type="module" src="js/main.js"></script>
</body>
</html>
```

**Step 4: Start development server**
```powershell
# Option 1: VS Code Live Server (recommended)
# Install "Live Server" extension, right-click index.html, "Open with Live Server"

# Option 2: Python simple server
python -m http.server 8000
# Open browser to http://localhost:8000

# Option 3: Node.js http-server
npx http-server -p 8000
```

---

## 2. Development Phases

### Overview

**Total Time Estimate: 10-14 days** (for AI assistant with guidance)

| Phase | Duration | Goal | Deliverable |
|-------|----------|------|-------------|
| **Phase 1: Foundation** | 2-3 days | Basic canvas + object placement | Single object can be placed, moved, exported |
| **Phase 2: Core Features** | 3-4 days | Complete editing workflow | Multi-object, layers, undo/redo, save/load |
| **Phase 3: Advanced** | 2-3 days | Professional features | Asset library, properties, grid, export formats |
| **Phase 4: Polish** | 3-4 days | Testing, UI refinement, docs | Production-ready editor |

---

## 3. Phase 1: Foundation (Days 1-3)

### Day 1: Basic Canvas Setup

**Goal:** Display a canvas, draw a single rectangle

**Tasks:**
1. Create `index.html` with canvas element
2. Create `css/main.css` with layout
3. Create `js/core/Editor.js` - main class
4. Create `js/viewport/Renderer.js` - canvas drawing
5. Draw grid on canvas
6. Draw single test rectangle

**Code Example - Editor.js:**
```javascript
// js/core/Editor.js
export class Editor {
    constructor() {
        this.canvas = document.getElementById('viewport');
        this.ctx = this.canvas.getContext('2d');
        this.width = 1280;
        this.height = 720;
        
        this.setupCanvas();
        this.start();
    }
    
    setupCanvas() {
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }
    
    start() {
        this.render();
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw grid
        this.drawGrid();
        
        // Draw test rectangle
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillRect(100, 100, 80, 80);
        
        requestAnimationFrame(() => this.render());
    }
    
    drawGrid() {
        const gridSize = 80;
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x <= this.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= this.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }
}
```

**Code Example - main.js:**
```javascript
// js/main.js
import { Editor } from './core/Editor.js';

window.addEventListener('DOMContentLoaded', () => {
    // Hide loading screen
    document.getElementById('loading').style.display = 'none';
    
    // Start editor
    window.editor = new Editor();
});
```

**Testing:**
- [ ] Canvas displays with grid
- [ ] Green rectangle visible at (100, 100)
- [ ] No console errors

---

### Day 2: Mouse Interaction

**Goal:** Click to place objects, drag to move them

**Tasks:**
1. Create `js/objects/GameObject.js`
2. Create `js/objects/ObjectManager.js`
3. Add mouse event listeners
4. Implement click-to-place
5. Implement drag-to-move

**Code Example - GameObject.js:**
```javascript
// js/objects/GameObject.js
export class GameObject {
    constructor(config) {
        this.id = config.id || this.generateId();
        this.type = config.type || 'obstacle';
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.width = config.width || 80;
        this.height = config.height || 80;
        this.sprite = config.sprite || null;
        this.properties = config.properties || {};
    }
    
    generateId() {
        return `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Check if point is inside object
    containsPoint(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }
    
    // Render object
    render(ctx) {
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw border
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
    
    // Export to JSON
    export() {
        return {
            type: this.type,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            sprite: this.sprite,
            properties: { ...this.properties }
        };
    }
}
```

**Code Example - ObjectManager.js:**
```javascript
// js/objects/ObjectManager.js
import { GameObject } from './GameObject.js';

export class ObjectManager {
    constructor() {
        this.objects = new Map(); // id -> GameObject
    }
    
    add(object) {
        this.objects.set(object.id, object);
        return object;
    }
    
    remove(id) {
        this.objects.delete(id);
    }
    
    get(id) {
        return this.objects.get(id);
    }
    
    getAll() {
        return Array.from(this.objects.values());
    }
    
    findAt(x, y) {
        // Return topmost object at position
        const objects = this.getAll();
        for (let i = objects.length - 1; i >= 0; i--) {
            if (objects[i].containsPoint(x, y)) {
                return objects[i];
            }
        }
        return null;
    }
    
    clear() {
        this.objects.clear();
    }
}
```

**Add to Editor.js:**
```javascript
import { ObjectManager } from '../objects/ObjectManager.js';
import { GameObject } from '../objects/GameObject.js';

constructor() {
    // ... existing code ...
    this.objectManager = new ObjectManager();
    this.selectedObject = null;
    this.dragging = false;
    this.dragOffset = { x: 0, y: 0 };
    
    this.setupCanvas();
    this.setupMouseEvents();
    this.start();
}

setupMouseEvents() {
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
}

getMousePos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

onMouseDown(e) {
    const pos = this.getMousePos(e);
    
    // Check if clicked on existing object
    const clickedObject = this.objectManager.findAt(pos.x, pos.y);
    
    if (clickedObject) {
        // Start dragging
        this.selectedObject = clickedObject;
        this.dragging = true;
        this.dragOffset = {
            x: pos.x - clickedObject.x,
            y: pos.y - clickedObject.y
        };
    } else {
        // Place new object
        const newObject = new GameObject({
            x: Math.floor(pos.x / 80) * 80, // Snap to grid
            y: Math.floor(pos.y / 80) * 80,
            width: 80,
            height: 80,
            type: 'obstacle'
        });
        this.objectManager.add(newObject);
        this.selectedObject = newObject;
    }
}

onMouseMove(e) {
    if (!this.dragging || !this.selectedObject) return;
    
    const pos = this.getMousePos(e);
    
    // Update object position (with grid snapping)
    this.selectedObject.x = Math.floor((pos.x - this.dragOffset.x) / 80) * 80;
    this.selectedObject.y = Math.floor((pos.y - this.dragOffset.y) / 80) * 80;
}

onMouseUp(e) {
    this.dragging = false;
}

render() {
    // Clear canvas
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Draw grid
    this.drawGrid();
    
    // Draw all objects
    this.objectManager.getAll().forEach(obj => {
        obj.render(this.ctx);
    });
    
    // Highlight selected object
    if (this.selectedObject) {
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(
            this.selectedObject.x,
            this.selectedObject.y,
            this.selectedObject.width,
            this.selectedObject.height
        );
    }
    
    requestAnimationFrame(() => this.render());
}
```

**Testing:**
- [ ] Click to place new object
- [ ] Objects snap to grid
- [ ] Drag to move objects
- [ ] Selected object has red outline
- [ ] Multiple objects can be placed

---

### Day 3: Basic Export

**Goal:** Export level to JSON, test in Tower Defense game

**Tasks:**
1. Create `js/export/JSONExporter.js`
2. Add "Export" button to UI
3. Implement export to Tower Defense format
4. Test import in actual game

**Code Example - JSONExporter.js:**
```javascript
// js/export/JSONExporter.js
export class JSONExporter {
    constructor(editor) {
        this.editor = editor;
    }
    
    export() {
        const objects = this.editor.objectManager.getAll();
        
        // Convert to Tower Defense format
        const level = {
            obstacles: objects.map(obj => ({
                type: obj.properties.obstacleType || 'tree',
                x: obj.x,
                y: obj.y,
                width: obj.width,
                height: obj.height
            }))
        };
        
        return JSON.stringify(level, null, 2);
    }
    
    download(filename = 'level.json') {
        const json = this.export();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        
        URL.revokeObjectURL(url);
    }
    
    // Copy to clipboard
    copyToClipboard() {
        const json = this.export();
        navigator.clipboard.writeText(json).then(() => {
            alert('Level JSON copied to clipboard!');
        });
    }
}
```

**Add Export Button to index.html:**
```html
<div id="toolbar">
    <button id="btn-export" class="toolbar-btn">
        Export Level
    </button>
    <button id="btn-copy" class="toolbar-btn">
        Copy JSON
    </button>
</div>
```

**Wire up buttons in Editor.js:**
```javascript
constructor() {
    // ... existing code ...
    this.exporter = new JSONExporter(this);
    this.setupUI();
}

setupUI() {
    document.getElementById('btn-export').addEventListener('click', () => {
        this.exporter.download('test-level.json');
    });
    
    document.getElementById('btn-copy').addEventListener('click', () => {
        this.exporter.copyToClipboard();
    });
}
```

**Testing:**
- [ ] Click "Export Level" downloads JSON file
- [ ] Open JSON file, verify format matches Tower Defense levels
- [ ] Copy JSON to Tower Defense game, verify obstacles appear
- [ ] Objects positioned correctly

**Phase 1 Complete! ✅**
You now have: Canvas with grid, click-to-place objects, drag-to-move, JSON export

---

## 4. Phase 2: Core Features (Days 4-7)

### Day 4: Layer System

**Goal:** Multiple layers with visibility/lock controls

**Tasks:**
1. Create `js/layers/Layer.js`
2. Create `js/layers/LayerManager.js`
3. Create layers panel UI
4. Implement layer switching
5. Implement visibility/lock toggles

**Code Example - Layer.js:**
```javascript
// js/layers/Layer.js
export class Layer {
    constructor(config) {
        this.id = config.id || this.generateId();
        this.name = config.name || 'Layer';
        this.type = config.type || 'object'; // 'object', 'tile', 'image', 'grid'
        this.visible = config.visible !== false;
        this.locked = config.locked || false;
        this.opacity = config.opacity !== undefined ? config.opacity : 1.0;
        this.zIndex = config.zIndex || 0;
        this.objects = []; // Objects in this layer
    }
    
    generateId() {
        return `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    addObject(object) {
        this.objects.push(object);
    }
    
    removeObject(objectId) {
        const index = this.objects.findIndex(obj => obj.id === objectId);
        if (index !== -1) {
            this.objects.splice(index, 1);
        }
    }
    
    getObjects() {
        return this.objects;
    }
    
    render(ctx) {
        if (!this.visible) return;
        
        ctx.save();
        ctx.globalAlpha = this.opacity;
        
        this.objects.forEach(obj => obj.render(ctx));
        
        ctx.restore();
    }
    
    export() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            visible: this.visible,
            locked: this.locked,
            opacity: this.opacity,
            zIndex: this.zIndex,
            objects: this.objects.map(obj => obj.export())
        };
    }
}
```

**Layers Panel UI (add to index.html):**
```html
<aside id="layers-panel" class="panel">
    <div class="panel-header">
        <h3>Layers</h3>
        <button id="btn-add-layer">+</button>
    </div>
    <div id="layers-list" class="panel-content">
        <!-- Layers populated dynamically -->
    </div>
</aside>
```

**Testing:**
- [ ] Create multiple layers
- [ ] Objects appear on active layer
- [ ] Toggle visibility hides/shows objects
- [ ] Locked layers can't be edited
- [ ] Layers render in correct order (z-index)

---

### Day 5: Selection System

**Goal:** Select multiple objects, marquee selection

**Tasks:**
1. Create `js/selection/SelectionManager.js`
2. Implement Ctrl+click multi-select
3. Implement marquee (drag box) selection
4. Show selection rectangle
5. Delete selected objects (Delete key)

**Code Example - SelectionManager.js:**
```javascript
// js/selection/SelectionManager.js
export class SelectionManager {
    constructor() {
        this.selected = new Set(); // Set of object IDs
        this.marqueeStart = null;
        this.marqueeEnd = null;
    }
    
    clear() {
        this.selected.clear();
    }
    
    select(objectId, mode = 'replace') {
        if (mode === 'replace') {
            this.selected.clear();
        } else if (mode === 'toggle') {
            if (this.selected.has(objectId)) {
                this.selected.delete(objectId);
            } else {
                this.selected.add(objectId);
            }
            return;
        }
        
        this.selected.add(objectId);
    }
    
    isSelected(objectId) {
        return this.selected.has(objectId);
    }
    
    getSelectedIds() {
        return Array.from(this.selected);
    }
    
    // Start marquee selection
    startMarquee(x, y) {
        this.marqueeStart = { x, y };
        this.marqueeEnd = { x, y };
    }
    
    // Update marquee selection
    updateMarquee(x, y) {
        this.marqueeEnd = { x, y };
    }
    
    // Finish marquee selection
    finishMarquee(objectManager) {
        if (!this.marqueeStart || !this.marqueeEnd) return;
        
        const box = this.getMarqueeBox();
        const objectsInBox = objectManager.getAll().filter(obj => 
            this.isObjectInBox(obj, box)
        );
        
        this.selected.clear();
        objectsInBox.forEach(obj => this.selected.add(obj.id));
        
        this.marqueeStart = null;
        this.marqueeEnd = null;
    }
    
    getMarqueeBox() {
        const x1 = Math.min(this.marqueeStart.x, this.marqueeEnd.x);
        const y1 = Math.min(this.marqueeStart.y, this.marqueeEnd.y);
        const x2 = Math.max(this.marqueeStart.x, this.marqueeEnd.x);
        const y2 = Math.max(this.marqueeStart.y, this.marqueeEnd.y);
        
        return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
    }
    
    isObjectInBox(object, box) {
        return !(object.x + object.width < box.x ||
                 object.x > box.x + box.width ||
                 object.y + object.height < box.y ||
                 object.y > box.y + box.height);
    }
    
    renderMarquee(ctx) {
        if (!this.marqueeStart || !this.marqueeEnd) return;
        
        const box = this.getMarqueeBox();
        
        ctx.strokeStyle = '#007acc';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        
        ctx.fillStyle = 'rgba(0, 122, 204, 0.1)';
        ctx.fillRect(box.x, box.y, box.width, box.height);
        
        ctx.setLineDash([]);
    }
}
```

**Update Editor.js mouse handling:**
```javascript
onMouseDown(e) {
    const pos = this.getMousePos(e);
    const clickedObject = this.objectManager.findAt(pos.x, pos.y);
    
    if (e.ctrlKey && clickedObject) {
        // Ctrl+click: toggle selection
        this.selection.select(clickedObject.id, 'toggle');
    } else if (clickedObject) {
        // Click object: select and start drag
        if (!this.selection.isSelected(clickedObject.id)) {
            this.selection.select(clickedObject.id, 'replace');
        }
        this.dragging = true;
        this.dragOffset = { x: pos.x - clickedObject.x, y: pos.y - clickedObject.y };
    } else {
        // Click empty space: start marquee
        this.selection.startMarquee(pos.x, pos.y);
        this.marqueeSelecting = true;
    }
}

onMouseMove(e) {
    const pos = this.getMousePos(e);
    
    if (this.dragging) {
        // Move all selected objects
        const selectedObjects = this.selection.getSelectedIds()
            .map(id => this.objectManager.get(id));
        
        // Calculate delta from first selected object
        const firstObj = selectedObjects[0];
        const dx = Math.floor((pos.x - this.dragOffset.x) / 80) * 80 - firstObj.x;
        const dy = Math.floor((pos.y - this.dragOffset.y) / 80) * 80 - firstObj.y;
        
        selectedObjects.forEach(obj => {
            obj.x += dx;
            obj.y += dy;
        });
    } else if (this.marqueeSelecting) {
        this.selection.updateMarquee(pos.x, pos.y);
    }
}

onMouseUp(e) {
    if (this.marqueeSelecting) {
        this.selection.finishMarquee(this.objectManager);
        this.marqueeSelecting = false;
    }
    this.dragging = false;
}

// Update render to show selection
render() {
    // ... existing render code ...
    
    // Highlight selected objects
    const selectedIds = this.selection.getSelectedIds();
    selectedIds.forEach(id => {
        const obj = this.objectManager.get(id);
        if (obj) {
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
        }
    });
    
    // Draw marquee
    this.selection.renderMarquee(this.ctx);
    
    requestAnimationFrame(() => this.render());
}
```

**Add keyboard shortcuts:**
```javascript
setupKeyboardEvents() {
    window.addEventListener('keydown', (e) => {
        // Delete selected objects
        if (e.key === 'Delete' || e.key === 'Backspace') {
            const selectedIds = this.selection.getSelectedIds();
            selectedIds.forEach(id => this.objectManager.remove(id));
            this.selection.clear();
        }
        
        // Select all
        if (e.ctrlKey && e.key === 'a') {
            e.preventDefault();
            this.objectManager.getAll().forEach(obj => {
                this.selection.select(obj.id, 'add');
            });
        }
    });
}
```

**Testing:**
- [ ] Click object to select (red outline)
- [ ] Ctrl+click to add/remove from selection
- [ ] Drag box to select multiple
- [ ] Move multiple selected objects together
- [ ] Delete key removes selected objects
- [ ] Ctrl+A selects all objects

---

### Day 6: Undo/Redo

**Goal:** Full undo/redo history (50+ steps)

**Tasks:**
1. Create `js/history/HistoryManager.js`
2. Implement command pattern
3. Record object creation/deletion/movement
4. Wire up Ctrl+Z / Ctrl+Y
5. Show undo/redo buttons in UI

**Code Example - HistoryManager.js:**
```javascript
// js/history/HistoryManager.js
export class HistoryManager {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
        this.maxHistory = 50;
    }
    
    execute(command) {
        command.execute();
        this.undoStack.push(command);
        this.redoStack = []; // Clear redo stack on new action
        
        // Limit stack size
        if (this.undoStack.length > this.maxHistory) {
            this.undoStack.shift();
        }
    }
    
    undo() {
        if (this.undoStack.length === 0) return false;
        
        const command = this.undoStack.pop();
        command.undo();
        this.redoStack.push(command);
        
        return true;
    }
    
    redo() {
        if (this.redoStack.length === 0) return false;
        
        const command = this.redoStack.pop();
        command.execute();
        this.undoStack.push(command);
        
        return true;
    }
    
    canUndo() {
        return this.undoStack.length > 0;
    }
    
    canRedo() {
        return this.redoStack.length > 0;
    }
    
    clear() {
        this.undoStack = [];
        this.redoStack = [];
    }
}

// Command classes
export class AddObjectCommand {
    constructor(objectManager, object) {
        this.objectManager = objectManager;
        this.object = object;
    }
    
    execute() {
        this.objectManager.add(this.object);
    }
    
    undo() {
        this.objectManager.remove(this.object.id);
    }
}

export class DeleteObjectCommand {
    constructor(objectManager, objectIds) {
        this.objectManager = objectManager;
        this.objectIds = Array.isArray(objectIds) ? objectIds : [objectIds];
        this.deletedObjects = [];
    }
    
    execute() {
        this.deletedObjects = this.objectIds.map(id => {
            const obj = this.objectManager.get(id);
            this.objectManager.remove(id);
            return obj;
        });
    }
    
    undo() {
        this.deletedObjects.forEach(obj => {
            this.objectManager.add(obj);
        });
    }
}

export class MoveObjectCommand {
    constructor(objects, dx, dy) {
        this.objects = objects;
        this.dx = dx;
        this.dy = dy;
    }
    
    execute() {
        this.objects.forEach(obj => {
            obj.x += this.dx;
            obj.y += this.dy;
        });
    }
    
    undo() {
        this.objects.forEach(obj => {
            obj.x -= this.dx;
            obj.y -= this.dy;
        });
    }
}
```

**Update Editor.js to use history:**
```javascript
import { HistoryManager, AddObjectCommand, DeleteObjectCommand, MoveObjectCommand } from '../history/HistoryManager.js';

constructor() {
    // ... existing code ...
    this.history = new HistoryManager();
}

// When placing new object:
onMouseDown(e) {
    // ... existing code ...
    
    if (!clickedObject) {
        // Place new object
        const newObject = new GameObject({ /* ... */ });
        const command = new AddObjectCommand(this.objectManager, newObject);
        this.history.execute(command);
        this.selectedObject = newObject;
    }
}

// When moving objects:
onMouseUp(e) {
    if (this.dragging && this.dragStartPos) {
        const selectedObjects = this.selection.getSelectedIds()
            .map(id => this.objectManager.get(id));
        
        const firstObj = selectedObjects[0];
        const dx = firstObj.x - this.dragStartPos.x;
        const dy = firstObj.y - this.dragStartPos.y;
        
        if (dx !== 0 || dy !== 0) {
            // Record move command (objects already moved, so undo will reverse)
            const command = new MoveObjectCommand(selectedObjects, dx, dy);
            command.dx = dx;
            command.dy = dy;
            this.history.undoStack.push(command);
        }
    }
    
    this.dragging = false;
    this.dragStartPos = null;
}

// Keyboard shortcuts:
setupKeyboardEvents() {
    window.addEventListener('keydown', (e) => {
        // Undo
        if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            this.history.undo();
        }
        
        // Redo
        if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
            e.preventDefault();
            this.history.redo();
        }
        
        // Delete with history
        if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            const selectedIds = this.selection.getSelectedIds();
            if (selectedIds.length > 0) {
                const command = new DeleteObjectCommand(this.objectManager, selectedIds);
                this.history.execute(command);
                this.selection.clear();
            }
        }
    });
}
```

**Testing:**
- [ ] Place object, Ctrl+Z undoes creation
- [ ] Move object, Ctrl+Z returns to original position
- [ ] Delete object, Ctrl+Z restores it
- [ ] Ctrl+Y redoes undone actions
- [ ] Multiple undo/redo cycles work correctly
- [ ] History limited to 50 actions

---

### Day 7: Save/Load Project

**Goal:** Save project to file, load from file

**Tasks:**
1. Implement project save (JSON)
2. Implement project load
3. Add Save/Load buttons
4. Auto-save to localStorage every 30s
5. Load last project on startup

**Code Example - Project Save/Load:**
```javascript
// Add to Editor.js
saveProject(filename = 'project.json') {
    const project = {
        version: '1.0',
        name: this.projectName || 'Untitled Project',
        width: this.width,
        height: this.height,
        gridSize: this.gridSize || 80,
        layers: this.layerManager.layers.map(layer => layer.export()),
        assets: this.assetManager.export()
    };
    
    const json = JSON.stringify(project, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
}

loadProject(json) {
    try {
        const project = JSON.parse(json);
        
        // Validate version
        if (!project.version || project.version !== '1.0') {
            throw new Error('Incompatible project version');
        }
        
        // Clear current project
        this.objectManager.clear();
        this.layerManager.clear();
        this.selection.clear();
        this.history.clear();
        
        // Load project settings
        this.projectName = project.name;
        this.width = project.width;
        this.height = project.height;
        this.gridSize = project.gridSize;
        
        // Load layers
        project.layers.forEach(layerData => {
            const layer = this.layerManager.createLayer(layerData.type, layerData.name);
            layer.visible = layerData.visible;
            layer.locked = layerData.locked;
            layer.opacity = layerData.opacity;
            layer.zIndex = layerData.zIndex;
            
            // Load objects in layer
            layerData.objects.forEach(objData => {
                const obj = new GameObject(objData);
                this.objectManager.add(obj);
                layer.addObject(obj);
            });
        });
        
        // Load assets
        if (project.assets) {
            this.assetManager.import(project.assets);
        }
        
        console.log('Project loaded successfully:', project.name);
        return true;
        
    } catch (error) {
        console.error('Failed to load project:', error);
        alert('Failed to load project: ' + error.message);
        return false;
    }
}

// Auto-save to localStorage
startAutoSave() {
    setInterval(() => {
        this.autoSave();
    }, 30000); // Every 30 seconds
}

autoSave() {
    const project = {
        version: '1.0',
        name: this.projectName || 'Untitled Project',
        width: this.width,
        height: this.height,
        gridSize: this.gridSize || 80,
        layers: this.layerManager.layers.map(layer => layer.export())
    };
    
    localStorage.setItem('level-editor-autosave', JSON.stringify(project));
    console.log('Auto-saved project');
}

loadAutoSave() {
    const saved = localStorage.getItem('level-editor-autosave');
    if (saved) {
        const confirmed = confirm('Found auto-saved project. Load it?');
        if (confirmed) {
            this.loadProject(saved);
        }
    }
}

// Wire up file input
setupFileHandling() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.loadProject(e.target.result);
            };
            reader.readAsText(file);
        }
    });
    
    document.getElementById('btn-load').addEventListener('click', () => {
        fileInput.click();
    });
    
    document.getElementById('btn-save').addEventListener('click', () => {
        this.saveProject();
    });
}
```

**Testing:**
- [ ] Save project downloads JSON file
- [ ] Open saved project file, verify all layers/objects present
- [ ] Load project restores everything correctly
- [ ] Auto-save runs every 30s (check console)
- [ ] Refresh page, confirm auto-save prompt appears

**Phase 2 Complete! ✅**
You now have: Layers, selection, undo/redo, save/load

---

## 5. Phase 3: Advanced Features (Days 8-10)

### Day 8: Asset Library

**Goal:** Import images, drag to canvas

**Tasks:**
1. Create `js/assets/AssetManager.js`
2. Implement file import (drag & drop + file picker)
3. Display asset thumbnails in panel
4. Drag asset from panel to canvas
5. Store assets in project

*[Code examples omitted for brevity - follow similar patterns to previous days]*

### Day 9: Properties Panel

**Goal:** Edit object properties (type, size, custom data)

**Tasks:**
1. Create `js/ui/PropertiesPanel.js`
2. Display selected object properties
3. Implement property editors (text, number, color, dropdown)
4. Update object when properties change
5. Support custom properties

### Day 10: Export Formats

**Goal:** Export to multiple formats (Tower Defense, CSV, Tiled)

**Tasks:**
1. Create `js/export/TowerDefenseExporter.js`
2. Create `js/export/CSVExporter.js`
3. Create `js/export/TiledExporter.js` (TMX format)
4. Add export format selector to UI
5. Test all export formats

**Phase 3 Complete! ✅**
You now have: Asset library, properties panel, multiple export formats

---

## 6. Phase 4: Polish & Testing (Days 11-14)

### Day 11-12: UI Polish

**Tasks:**
- Refine CSS styling (colors, spacing, typography)
- Add icons to all buttons
- Implement tooltips
- Add loading spinners for long operations
- Improve error messages
- Add keyboard shortcut reference (help dialog)

### Day 13: Integration Testing

**Test Plan:**
1. Create complex level (20+ objects, 3+ layers)
2. Export to Tower Defense format
3. Import level in game, verify correctness
4. Save project, close editor, reload, verify state
5. Test all keyboard shortcuts
6. Test undo/redo extensively (50+ operations)
7. Stress test: 100+ objects, verify performance

### Day 14: Documentation & Deployment

**Tasks:**
- Write USER_GUIDE.md (how to use editor)
- Write DEVELOPER_GUIDE.md (code architecture)
- Create tutorial video/screenshots
- Deploy to web server or GitHub Pages
- Share with testers

**Phase 4 Complete! ✅**
Production-ready level editor!

---

## 7. Testing Strategy

### 7.1 Manual Testing Checklist

**Object Placement:**
- [ ] Click to place object
- [ ] Object snaps to grid
- [ ] Drag to move object
- [ ] Multi-select and move together
- [ ] Delete selected objects
- [ ] Copy/paste objects

**Layer System:**
- [ ] Create new layer
- [ ] Switch active layer
- [ ] Objects go to active layer
- [ ] Toggle layer visibility
- [ ] Lock/unlock layer
- [ ] Reorder layers (drag)
- [ ] Delete layer

**Selection:**
- [ ] Click to select
- [ ] Ctrl+click multi-select
- [ ] Marquee selection
- [ ] Ctrl+A select all
- [ ] Delete key removes selected
- [ ] Escape deselects

**History:**
- [ ] Undo object placement
- [ ] Undo object movement
- [ ] Undo object deletion
- [ ] Redo after undo
- [ ] 50+ undo steps
- [ ] History persists across actions

**Save/Load:**
- [ ] Save project
- [ ] Load project
- [ ] Auto-save every 30s
- [ ] Load auto-save on startup
- [ ] Export level JSON
- [ ] Import exported level into game

**Performance:**
- [ ] 100 objects renders smoothly
- [ ] No lag when dragging
- [ ] Grid renders quickly
- [ ] No memory leaks (check DevTools)

### 7.2 Integration Testing

**Test Case 1: Tower Defense Level**
1. Create new project
2. Set grid size to 80
3. Import obstacle assets (tree, rock, lava, ruins)
4. Place 10 obstacles on canvas
5. Export to Tower Defense format
6. Copy JSON to tower-defense/js/levels/level-test.js
7. Load level in game
8. Verify: Obstacles appear at correct positions
9. Verify: Player can't place towers on obstacles

**Test Case 2: Multi-Layer Complex Level**
1. Create 3 layers: Background, Path, Obstacles
2. Place background image on Background layer
3. Draw path on Path layer (use grid layer type)
4. Place 15 obstacles on Obstacles layer
5. Toggle layer visibility - verify correct objects hide
6. Lock Background layer - verify can't edit
7. Save project
8. Close editor, reload
9. Load saved project
10. Verify: All layers and objects restored

**Test Case 3: Undo/Redo Stress Test**
1. Place 20 objects
2. Undo 20 times (all objects gone)
3. Redo 20 times (all objects back)
4. Move 5 objects
5. Undo 5 times
6. Delete 3 objects
7. Undo 3 times
8. Verify: All objects in original state

---

## 8. Deployment Guide

### 8.1 Deploy to GitHub Pages

```powershell
# 1. Create GitHub repository
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/level-editor.git
git push -u origin main

# 2. Enable GitHub Pages
# Go to repo Settings > Pages > Source: main branch

# 3. Access at: https://YOUR_USERNAME.github.io/level-editor
```

### 8.2 Deploy to Netlify

```powershell
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Deploy
netlify deploy --prod --dir=.

# 3. Follow prompts, get live URL
```

### 8.3 Deploy to Your Own Server

```powershell
# 1. Upload files via FTP/SFTP
# 2. Ensure server serves .js files with correct MIME type
# 3. Configure HTTPS (required for clipboard API)
```

---

## 9. Troubleshooting Common Issues

### Issue: "Failed to load module script"
**Cause:** Incorrect file paths or server not serving ES modules
**Fix:**
```javascript
// Ensure all imports use relative paths
import { Editor } from './core/Editor.js'; // ✅ Correct
import { Editor } from './core/Editor'; // ❌ Missing .js extension
```

### Issue: Canvas not responding to mouse
**Cause:** Canvas size mismatch or event listeners not attached
**Fix:**
```javascript
// Ensure canvas CSS size matches internal size
canvas.width = 1280;
canvas.height = 720;
canvas.style.width = '100%';
canvas.style.height = '100%';

// Check events attached
console.log('Mouse events attached:', this.canvas.onclick !== null);
```

### Issue: Objects disappear after export/import
**Cause:** JSON export/import losing object references
**Fix:**
```javascript
// Ensure layer relationships preserved
export() {
    return {
        layers: this.layers.map(layer => ({
            ...layer.export(),
            objectIds: layer.objects.map(obj => obj.id) // ✅ Preserve IDs
        }))
    };
}
```

### Issue: Performance degrades with many objects
**Cause:** Rendering all objects every frame
**Fix:**
```javascript
// Implement viewport culling
render() {
    const visibleBounds = this.viewport.getVisibleBounds();
    
    this.objects.forEach(obj => {
        if (this.isVisible(obj, visibleBounds)) {
            obj.render(this.ctx);
        }
    });
}

isVisible(obj, bounds) {
    return !(obj.x + obj.width < bounds.left ||
             obj.x > bounds.right ||
             obj.y + obj.height < bounds.top ||
             obj.y > bounds.bottom);
}
```

---

## 10. Post-Launch Roadmap

### v1.5 Features (Next 2-4 weeks)
- [ ] Auto-tiling / terrain brush
- [ ] Prefab system (save/load object groups)
- [ ] Custom object properties per type
- [ ] Export to Tiled TMX format
- [ ] Plugin system (load custom tools)
- [ ] Keyboard shortcut customization
- [ ] Asset hot-reload (watch file changes)

### v2.0 Features (Next 2-3 months)
- [ ] Multi-user collaboration (WebSocket)
- [ ] Version control integration (Git)
- [ ] Cloud save/sync
- [ ] AI-assisted design (suggest layouts)
- [ ] Visual scripting (level logic)
- [ ] Animation timeline
- [ ] Particle effects editor
- [ ] Mobile/touch support

---

## Success Criteria

**Editor is complete when:**
- ✅ User can create Tower Defense level visually in under 5 minutes
- ✅ Exported JSON works in game without modifications
- ✅ All objects positioned within 5px of intended location
- ✅ Zero data loss on save/load cycle
- ✅ Undo/redo works for 50+ operations
- ✅ Performance: 60 FPS with 100+ objects
- ✅ UI intuitive enough for first-time users
- ✅ No browser console errors during normal use

---

**Implementation Complete! 🎉**

This plan provides:
- ✅ **Clear roadmap** - 14-day implementation schedule
- ✅ **Working code** - Copy-paste examples for every feature
- ✅ **Testing strategy** - Ensure quality at every step
- ✅ **Integration guide** - Deploy and use in real games
- ✅ **Troubleshooting** - Fix common issues quickly

**Next Steps:**
1. Follow Phase 1 (Days 1-3) to build foundation
2. Test each feature before moving to next
3. Integrate with Tower Defense game early and often
4. Iterate based on real usage

Good luck building your level editor! 🚀