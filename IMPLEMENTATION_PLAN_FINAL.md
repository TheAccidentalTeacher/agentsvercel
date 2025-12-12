# Universal Game Level Editor - Final Implementation Plan
## Build Timeline: 3-4 Hours Total

**DM's Note**: *This is a personal tool. We're optimizing for speed and flexibility, not enterprise features. Ship fast, iterate based on real usage.*

---

## **The Vision: Universal 2D Game Editor**

A single-page application where you can:
1. Load any background image
2. Browse your file system for asset images
3. Place assets anywhere on the canvas
4. Move, resize, rotate assets
5. Export to JSON (works with ANY game engine)
6. Save/load projects for later editing

**No frameworks. No build step. Just HTML + CSS + JavaScript.**

---

## **Hour 1: The Foundation** ⏱️

### What We're Building:
A canvas with a background image and the ability to place a single object.

### Files Created:
```
game-editor/
├── index.html           (Main interface)
├── style.css            (UI styling)
├── editor.js            (Core logic)
└── test-assets/         (Sample images for testing)
    ├── background.png
    └── sprite.png
```

### Step-by-Step:

**1. Create index.html**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Universal Game Editor</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="app">
        <!-- Top Toolbar -->
        <div id="toolbar">
            <h1>🎮 Game Editor</h1>
            <div class="toolbar-buttons">
                <button id="load-background">Load Background</button>
                <button id="add-asset">Add Asset</button>
                <button id="export-json">Export JSON</button>
                <button id="save-project">Save Project</button>
                <button id="load-project">Load Project</button>
            </div>
        </div>

        <!-- Main Workspace -->
        <div id="workspace">
            <!-- Canvas -->
            <div id="canvas-container">
                <canvas id="canvas"></canvas>
            </div>

            <!-- Right Panel: Properties -->
            <div id="properties-panel">
                <h3>Properties</h3>
                <div id="properties-content">
                    <p>Select an object to view properties</p>
                </div>
            </div>
        </div>

        <!-- Status Bar -->
        <div id="status-bar">
            <span id="status-text">Ready</span>
            <span id="mouse-coords">X: 0, Y: 0</span>
        </div>
    </div>

    <!-- Hidden file inputs -->
    <input type="file" id="background-input" accept="image/*" style="display: none;">
    <input type="file" id="asset-input" accept="image/*" style="display: none;">
    <input type="file" id="project-input" accept=".json" style="display: none;">

    <script src="editor.js"></script>
</body>
</html>
```

**2. Create style.css**
```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #1e1e1e;
    color: #ccc;
    overflow: hidden;
}

#app {
    display: grid;
    grid-template-rows: 60px 1fr 30px;
    height: 100vh;
}

/* Toolbar */
#toolbar {
    background: #252526;
    border-bottom: 1px solid #3c3c3c;
    padding: 0 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

#toolbar h1 {
    font-size: 20px;
    color: #fff;
}

.toolbar-buttons {
    display: flex;
    gap: 10px;
}

button {
    background: #007acc;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.2s;
}

button:hover {
    background: #005a9e;
}

button:active {
    background: #004578;
}

/* Workspace */
#workspace {
    display: grid;
    grid-template-columns: 1fr 300px;
    overflow: hidden;
}

#canvas-container {
    background: #1a1a1a;
    position: relative;
    overflow: auto;
    display: flex;
    align-items: center;
    justify-content: center;
}

#canvas {
    border: 1px solid #3c3c3c;
    cursor: crosshair;
    background: #2d2d2d;
}

/* Properties Panel */
#properties-panel {
    background: #252526;
    border-left: 1px solid #3c3c3c;
    padding: 20px;
    overflow-y: auto;
}

#properties-panel h3 {
    color: #fff;
    margin-bottom: 15px;
    font-size: 16px;
}

.property-group {
    margin-bottom: 15px;
}

.property-group label {
    display: block;
    font-size: 12px;
    margin-bottom: 5px;
    color: #999;
}

.property-group input {
    width: 100%;
    background: #3c3c3c;
    border: 1px solid #555;
    color: #ccc;
    padding: 6px;
    border-radius: 3px;
    font-size: 14px;
}

.property-group input:focus {
    outline: none;
    border-color: #007acc;
}

.property-buttons {
    display: flex;
    gap: 8px;
    margin-top: 15px;
}

.property-buttons button {
    flex: 1;
    font-size: 12px;
    padding: 6px;
}

.btn-delete {
    background: #f44336;
}

.btn-delete:hover {
    background: #d32f2f;
}

/* Status Bar */
#status-bar {
    background: #252526;
    border-top: 1px solid #3c3c3c;
    padding: 0 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
}

#status-text {
    color: #007acc;
}

#mouse-coords {
    color: #999;
}
```

**3. Create editor.js (Basic Structure)**
```javascript
// ============================================================================
// UNIVERSAL GAME LEVEL EDITOR
// A simple, powerful tool for 2D game level design
// ============================================================================

class GameEditor {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 1280;
        this.canvas.height = 720;

        // Editor state
        this.background = null;
        this.objects = [];
        this.selectedObject = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };

        // UI elements
        this.statusText = document.getElementById('status-text');
        this.mouseCoords = document.getElementById('mouse-coords');
        this.propertiesContent = document.getElementById('properties-content');

        // File inputs
        this.backgroundInput = document.getElementById('background-input');
        this.assetInput = document.getElementById('asset-input');
        this.projectInput = document.getElementById('project-input');

        // Initialize
        this.setupEventListeners();
        this.render();

        this.updateStatus('Editor ready! Load a background to start.');
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

        // File inputs
        this.backgroundInput.addEventListener('change', (e) => {
            this.loadBackground(e.target.files[0]);
        });

        this.assetInput.addEventListener('change', (e) => {
            this.loadAsset(e.target.files[0]);
        });

        this.projectInput.addEventListener('change', (e) => {
            this.loadProject(e.target.files[0]);
        });

        // Canvas mouse events
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
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
                this.render();
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
                    id: Date.now(),
                    name: file.name,
                    image: img,
                    x: this.canvas.width / 2 - img.width / 2,
                    y: this.canvas.height / 2 - img.height / 2,
                    width: img.width,
                    height: img.height,
                    rotation: 0,
                    imageSrc: e.target.result // Store for export
                };
                this.objects.push(obj);
                this.selectedObject = obj;
                this.render();
                this.updateProperties();
                this.updateStatus(`Asset added: ${file.name}`);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // ========================================================================
    // RENDERING
    // ========================================================================

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

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

        // Continue render loop
        requestAnimationFrame(() => this.render());
    }

    drawGrid() {
        const gridSize = 50;
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;

        for (let x = 0; x <= this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

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
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);

        // Draw resize handles
        const handleSize = 8;
        this.ctx.fillStyle = '#00ff00';
        // Top-left
        this.ctx.fillRect(obj.x - handleSize/2, obj.y - handleSize/2, handleSize, handleSize);
        // Top-right
        this.ctx.fillRect(obj.x + obj.width - handleSize/2, obj.y - handleSize/2, handleSize, handleSize);
        // Bottom-left
        this.ctx.fillRect(obj.x - handleSize/2, obj.y + obj.height - handleSize/2, handleSize, handleSize);
        // Bottom-right
        this.ctx.fillRect(obj.x + obj.width - handleSize/2, obj.y + obj.height - handleSize/2, handleSize, handleSize);
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

        // Drag object if dragging
        if (this.isDragging && this.selectedObject) {
            this.selectedObject.x = pos.x - this.dragOffset.x;
            this.selectedObject.y = pos.y - this.dragOffset.y;
            this.updateProperties();
        }
    }

    onMouseUp(e) {
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
        if (!this.selectedObject) return;

        switch(e.key) {
            case 'Delete':
            case 'Backspace':
                this.deleteSelected();
                break;
            case 'ArrowUp':
                this.selectedObject.y -= e.shiftKey ? 10 : 1;
                this.updateProperties();
                break;
            case 'ArrowDown':
                this.selectedObject.y += e.shiftKey ? 10 : 1;
                this.updateProperties();
                break;
            case 'ArrowLeft':
                this.selectedObject.x -= e.shiftKey ? 10 : 1;
                this.updateProperties();
                break;
            case 'ArrowRight':
                this.selectedObject.x += e.shiftKey ? 10 : 1;
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
            this.updateStatus('Object deleted');
        }
    }

    // ========================================================================
    // PROPERTIES PANEL
    // ========================================================================

    updateProperties() {
        if (!this.selectedObject) {
            this.propertiesContent.innerHTML = '<p>Select an object to view properties</p>';
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
                <input type="number" id="prop-x" value="${Math.round(obj.x)}">
            </div>
            <div class="property-group">
                <label>Y Position</label>
                <input type="number" id="prop-y" value="${Math.round(obj.y)}">
            </div>
            <div class="property-group">
                <label>Width</label>
                <input type="number" id="prop-width" value="${Math.round(obj.width)}">
            </div>
            <div class="property-group">
                <label>Height</label>
                <input type="number" id="prop-height" value="${Math.round(obj.height)}">
            </div>
            <div class="property-group">
                <label>Rotation (degrees)</label>
                <input type="number" id="prop-rotation" value="${obj.rotation}">
            </div>
            <div class="property-buttons">
                <button class="btn-delete" id="btn-delete-obj">Delete</button>
            </div>
        `;

        // Add event listeners to property inputs
        document.getElementById('prop-name').addEventListener('input', (e) => {
            obj.name = e.target.value;
        });
        document.getElementById('prop-x').addEventListener('input', (e) => {
            obj.x = parseFloat(e.target.value);
        });
        document.getElementById('prop-y').addEventListener('input', (e) => {
            obj.y = parseFloat(e.target.value);
        });
        document.getElementById('prop-width').addEventListener('input', (e) => {
            obj.width = parseFloat(e.target.value);
        });
        document.getElementById('prop-height').addEventListener('input', (e) => {
            obj.height = parseFloat(e.target.value);
        });
        document.getElementById('prop-rotation').addEventListener('input', (e) => {
            obj.rotation = parseFloat(e.target.value);
        });
        document.getElementById('btn-delete-obj').addEventListener('click', () => {
            this.deleteSelected();
        });
    }

    // ========================================================================
    // EXPORT / SAVE / LOAD
    // ========================================================================

    exportJSON() {
        const data = {
            canvas: {
                width: this.canvas.width,
                height: this.height
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
            this.updateStatus('JSON copied to clipboard!');
        });

        // Also download as file
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'level.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    saveProject() {
        const project = {
            canvas: {
                width: this.canvas.width,
                height: this.canvas.height
            },
            background: this.background ? this.canvas.toDataURL() : null,
            objects: this.objects.map(obj => ({
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
        a.download = 'project.json';
        a.click();
        URL.revokeObjectURL(url);

        this.updateStatus('Project saved!');
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
                this.canvas.width = project.canvas.width;
                this.canvas.height = project.canvas.height;

                // Restore background
                if (project.background) {
                    const img = new Image();
                    img.onload = () => {
                        this.background = img;
                        this.render();
                    };
                    img.src = project.background;
                }

                // Restore objects
                project.objects.forEach(objData => {
                    const img = new Image();
                    img.onload = () => {
                        const obj = {
                            id: Date.now() + Math.random(),
                            name: objData.name,
                            image: img,
                            x: objData.x,
                            y: objData.y,
                            width: objData.width,
                            height: objData.height,
                            rotation: objData.rotation,
                            imageSrc: objData.imageSrc
                        };
                        this.objects.push(obj);
                        this.render();
                    };
                    img.src = objData.imageSrc;
                });

                this.updateStatus('Project loaded!');
            } catch (error) {
                this.updateStatus('Error loading project: ' + error.message);
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
}

// Initialize editor when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.editor = new GameEditor();
});
```

---

## **What You Get After Hour 1:**

✅ Load background images  
✅ Add sprite assets from your file system  
✅ Drag objects around  
✅ Edit properties (position, size, rotation)  
✅ Delete objects  
✅ Export to JSON  
✅ Save/load entire projects  
✅ Keyboard shortcuts (arrows to move, Delete to remove)  

---

## **Hour 2-3: Polish & Features** ⏱️

### Features to Add:
1. **Grid Snapping** (toggle on/off)
2. **Duplicate Object** (Ctrl+D)
3. **Undo/Redo** (Ctrl+Z, Ctrl+Y)
4. **Layer System** (bring forward, send backward)
5. **Zoom & Pan** (mousewheel zoom, spacebar+drag to pan)
6. **Asset Library Panel** (left sidebar with thumbnail previews)
7. **Multiple Export Formats** (Tower Defense, Bubble Brain, generic)

### Implementation in Next Session

---

## **Questions for Iteration:**

**Ironpaw**: *"Try this base version first. Once you've used it for 30 minutes, tell me:*
- *What feels clunky?*
- *What's missing that you ACTUALLY need?*
- *What would make it 10x better?"*

**Sage**: *"Use it. Break it. Then we refine it. That's how tools are born."*

**Shadowstep**: *"And if you want me to add Tower Defense-specific features—like path waypoints or spawn zones—just say the word. But let's start universal."*

---

**DM**: *"The party has crafted your weapon. Test it in battle, then return with your findings. We'll forge it into something legendary."*

**Build this now? Y/N**
