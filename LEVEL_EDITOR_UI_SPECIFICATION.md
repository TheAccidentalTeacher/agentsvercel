# Canvas Game Level Editor - UI Specification
## Complete Interface Design and Component Reference

**Version:** 1.0  
**Companion to:** LEVEL_EDITOR_MASTER_SPEC.md, LEVEL_EDITOR_TECHNICAL_GUIDE.md  
**Target:** UI developers, designers, and implementers

---

## Table of Contents

1. [Design System Overview](#1-design-system-overview)
2. [Color Palette and Typography](#2-color-palette-and-typography)
3. [Layout Structure](#3-layout-structure)
4. [Top Toolbar](#4-top-toolbar)
5. [Canvas Viewport](#5-canvas-viewport)
6. [Left Panel - Asset Library](#6-left-panel---asset-library)
7. [Right Panel - Properties and Layers](#7-right-panel---properties-and-layers)
8. [Bottom Status Bar](#8-bottom-status-bar)
9. [Modal Dialogs](#9-modal-dialogs)
10. [Context Menus](#10-context-menus)
11. [Keyboard Shortcuts](#11-keyboard-shortcuts)
12. [Responsive Design](#12-responsive-design)
13. [Accessibility Features](#13-accessibility-features)
14. [Animation and Transitions](#14-animation-and-transitions)
15. [Component Library](#15-component-library)

---

## 1. Design System Overview

### 1.1 Design Philosophy

**Core Principles:**
- **Clarity Over Decoration** - Every visual element serves a functional purpose
- **Discoverability** - Features are easy to find without hunting
- **Consistency** - Similar actions have similar appearances
- **Efficiency** - Minimize clicks and mouse travel for common tasks
- **Progressive Disclosure** - Advanced features revealed when needed

**Visual Style:**
- **Modern Dark Theme** - Reduces eye strain for long editing sessions
- **Subtle Gradients** - Adds depth without distraction
- **Clear Iconography** - Industry-standard icons from Material Design/Font Awesome
- **Crisp Typography** - Legible at all sizes
- **Purposeful Color** - Color conveys meaning (red=delete, green=add, blue=info)

### 1.2 Reference Inspiration

Draw inspiration from professional tools:
- **Tiled Editor** - Clean, functional layout
- **Adobe Photoshop** - Layer panel, tool system
- **Figma** - Properties panel, object inspector
- **Unity** - Scene view controls, hierarchy
- **Blender** - Keyboard-centric workflow

---

## 2. Color Palette and Typography

### 2.1 Color System

**Primary Colors:**
```css
:root {
    /* Background colors */
    --bg-primary: #1e1e1e;        /* Main background */
    --bg-secondary: #252526;      /* Panels, cards */
    --bg-tertiary: #2d2d30;       /* Hover states */
    --bg-elevated: #333333;       /* Modal, dropdown */
    
    /* Text colors */
    --text-primary: #cccccc;      /* Main text */
    --text-secondary: #999999;    /* Secondary text */
    --text-disabled: #666666;     /* Disabled text */
    --text-inverse: #000000;      /* On light backgrounds */
    
    /* Brand colors */
    --brand-primary: #007acc;     /* Primary actions */
    --brand-hover: #0098ff;       /* Hover state */
    --brand-active: #005a9e;      /* Active state */
    
    /* Semantic colors */
    --success: #4caf50;           /* Success, add */
    --warning: #ff9800;           /* Warning */
    --error: #f44336;             /* Error, delete */
    --info: #2196f3;              /* Info */
    
    /* UI element colors */
    --border: #3c3c3c;            /* Borders */
    --divider: #2d2d2d;           /* Dividers */
    --selection: rgba(0, 122, 204, 0.3);  /* Selection overlay */
    --focus: #007acc;             /* Focus outline */
    
    /* Canvas colors */
    --canvas-bg: #1a1a1a;         /* Canvas background */
    --grid-line: rgba(255, 255, 255, 0.1);  /* Grid lines */
    --ruler-bg: #2d2d2d;          /* Ruler background */
    --guide-line: #00a8ff;        /* Guide lines */
}
```

**Layer Colors (for visual distinction):**
```css
--layer-color-1: #e91e63;  /* Pink */
--layer-color-2: #9c27b0;  /* Purple */
--layer-color-3: #3f51b5;  /* Indigo */
--layer-color-4: #2196f3;  /* Blue */
--layer-color-5: #00bcd4;  /* Cyan */
--layer-color-6: #4caf50;  /* Green */
--layer-color-7: #ffeb3b;  /* Yellow */
--layer-color-8: #ff9800;  /* Orange */
```

### 2.2 Typography

**Font Stack:**
```css
:root {
    /* Primary font (UI text) */
    --font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
                    'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 
                    'Helvetica Neue', sans-serif;
    
    /* Monospace font (code, coordinates) */
    --font-mono: 'Consolas', 'Monaco', 'Courier New', monospace;
    
    /* Icon font */
    --font-icons: 'Material Icons', 'Font Awesome 6 Free';
}
```

**Font Sizes:**
```css
:root {
    --text-xs: 11px;      /* Tiny labels */
    --text-sm: 12px;      /* Small labels */
    --text-base: 14px;    /* Body text */
    --text-lg: 16px;      /* Headings */
    --text-xl: 20px;      /* Large headings */
    --text-2xl: 24px;     /* Extra large */
}
```

**Font Weights:**
```css
:root {
    --weight-normal: 400;
    --weight-medium: 500;
    --weight-semibold: 600;
    --weight-bold: 700;
}
```

### 2.3 Spacing System

**Based on 8px grid:**
```css
:root {
    --space-1: 4px;       /* 0.5 unit */
    --space-2: 8px;       /* 1 unit */
    --space-3: 12px;      /* 1.5 units */
    --space-4: 16px;      /* 2 units */
    --space-5: 20px;      /* 2.5 units */
    --space-6: 24px;      /* 3 units */
    --space-8: 32px;      /* 4 units */
    --space-10: 40px;     /* 5 units */
    --space-12: 48px;     /* 6 units */
}
```

### 2.4 Border Radius

```css
:root {
    --radius-sm: 2px;     /* Buttons, inputs */
    --radius-md: 4px;     /* Cards, panels */
    --radius-lg: 8px;     /* Modals */
    --radius-full: 9999px; /* Pills, circles */
}
```

---

## 3. Layout Structure

### 3.1 Overall Layout

```
┌─────────────────────────────────────────────────────────────┐
│                      Top Toolbar (48px)                      │
├──────────┬──────────────────────────────────┬───────────────┤
│          │                                  │               │
│  Asset   │        Canvas Viewport          │  Properties   │
│  Library │       (Main Work Area)          │    Panel      │
│  (250px) │                                  │   (280px)     │
│          │                                  │               │
│          │                                  ├───────────────┤
│          │                                  │               │
│          │                                  │    Layers     │
│          │                                  │    Panel      │
│          │                                  │   (280px)     │
├──────────┴──────────────────────────────────┴───────────────┤
│                    Status Bar (24px)                         │
└─────────────────────────────────────────────────────────────┘
```

**CSS Grid Implementation:**
```css
#app {
    display: grid;
    grid-template-columns: 250px 1fr 280px;
    grid-template-rows: 48px 1fr 24px;
    grid-template-areas:
        "toolbar  toolbar  toolbar"
        "assets   viewport panels"
        "status   status   status";
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    background: var(--bg-primary);
    color: var(--text-primary);
    font-family: var(--font-primary);
    font-size: var(--text-base);
}

#toolbar {
    grid-area: toolbar;
    border-bottom: 1px solid var(--border);
    background: var(--bg-secondary);
}

#assets-panel {
    grid-area: assets;
    border-right: 1px solid var(--border);
    background: var(--bg-secondary);
    overflow-y: auto;
}

#viewport-container {
    grid-area: viewport;
    background: var(--canvas-bg);
    position: relative;
    overflow: hidden;
}

#right-panel {
    grid-area: panels;
    border-left: 1px solid var(--border);
    background: var(--bg-secondary);
    display: flex;
    flex-direction: column;
}

#properties-panel {
    flex: 1;
    overflow-y: auto;
    border-bottom: 1px solid var(--border);
}

#layers-panel {
    flex: 1;
    overflow-y: auto;
}

#status-bar {
    grid-area: status;
    border-top: 1px solid var(--border);
    background: var(--bg-secondary);
    display: flex;
    align-items: center;
    padding: 0 var(--space-4);
    font-size: var(--text-sm);
}
```

### 3.2 Collapsible Panels

All side panels can be collapsed to maximize viewport space:

```html
<div class="panel" data-panel="assets">
    <div class="panel-header">
        <button class="panel-toggle" aria-label="Toggle Assets Panel">
            <i class="icon-chevron-left"></i>
        </button>
        <h3 class="panel-title">Assets</h3>
        <button class="panel-menu" aria-label="Assets Menu">
            <i class="icon-more-vertical"></i>
        </button>
    </div>
    <div class="panel-content">
        <!-- Panel content here -->
    </div>
</div>
```

**Collapsed State:**
```css
.panel.collapsed {
    width: 48px !important;
}

.panel.collapsed .panel-content {
    display: none;
}

.panel.collapsed .panel-title {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    margin: var(--space-4) 0;
}
```

---

## 4. Top Toolbar

### 4.1 Toolbar Structure

The toolbar contains primary actions and tool selection.

```html
<div id="toolbar">
    <div class="toolbar-section toolbar-main">
        <!-- File operations -->
        <div class="toolbar-group">
            <button class="toolbar-btn" data-action="new-project" title="New Project (Ctrl+N)">
                <i class="icon-file-plus"></i>
            </button>
            <button class="toolbar-btn" data-action="open-project" title="Open Project (Ctrl+O)">
                <i class="icon-folder-open"></i>
            </button>
            <button class="toolbar-btn" data-action="save-project" title="Save Project (Ctrl+S)">
                <i class="icon-save"></i>
            </button>
        </div>
        
        <div class="toolbar-divider"></div>
        
        <!-- History -->
        <div class="toolbar-group">
            <button class="toolbar-btn" data-action="undo" title="Undo (Ctrl+Z)" disabled>
                <i class="icon-undo"></i>
            </button>
            <button class="toolbar-btn" data-action="redo" title="Redo (Ctrl+Y)" disabled>
                <i class="icon-redo"></i>
            </button>
        </div>
        
        <div class="toolbar-divider"></div>
        
        <!-- Tools -->
        <div class="toolbar-group toolbar-tools">
            <button class="toolbar-btn tool-btn active" data-tool="selection" title="Selection Tool (V)">
                <i class="icon-cursor"></i>
            </button>
            <button class="toolbar-btn tool-btn" data-tool="pen" title="Pen Tool (P)">
                <i class="icon-pen"></i>
            </button>
            <button class="toolbar-btn tool-btn" data-tool="brush" title="Brush Tool (B)">
                <i class="icon-paint-brush"></i>
            </button>
            <button class="toolbar-btn tool-btn" data-tool="eraser" title="Eraser Tool (E)">
                <i class="icon-eraser"></i>
            </button>
            <button class="toolbar-btn tool-btn" data-tool="rectangle" title="Rectangle Tool (R)">
                <i class="icon-square"></i>
            </button>
            <button class="toolbar-btn tool-btn" data-tool="circle" title="Circle Tool (C)">
                <i class="icon-circle"></i>
            </button>
            <button class="toolbar-btn tool-btn" data-tool="text" title="Text Tool (T)">
                <i class="icon-type"></i>
            </button>
        </div>
        
        <div class="toolbar-divider"></div>
        
        <!-- View controls -->
        <div class="toolbar-group">
            <button class="toolbar-btn" data-action="zoom-in" title="Zoom In (+)">
                <i class="icon-zoom-in"></i>
            </button>
            <button class="toolbar-btn" data-action="zoom-out" title="Zoom Out (-)">
                <i class="icon-zoom-out"></i>
            </button>
            <button class="toolbar-btn" data-action="zoom-fit" title="Fit to View (Ctrl+0)">
                <i class="icon-maximize"></i>
            </button>
            <div class="toolbar-zoom-display">100%</div>
        </div>
        
        <div class="toolbar-divider"></div>
        
        <!-- Grid and snapping -->
        <div class="toolbar-group">
            <button class="toolbar-btn toggle" data-toggle="grid" title="Toggle Grid (G)" data-active="true">
                <i class="icon-grid"></i>
            </button>
            <button class="toolbar-btn toggle" data-toggle="snap" title="Toggle Snap (Shift+G)" data-active="true">
                <i class="icon-magnet"></i>
            </button>
            <button class="toolbar-btn toggle" data-toggle="rulers" title="Toggle Rulers (Ctrl+R)" data-active="true">
                <i class="icon-ruler"></i>
            </button>
        </div>
    </div>
    
    <div class="toolbar-section toolbar-right">
        <!-- Export -->
        <button class="toolbar-btn btn-primary" data-action="export" title="Export Level (Ctrl+E)">
            <i class="icon-download"></i>
            <span>Export</span>
        </button>
        
        <!-- Settings -->
        <button class="toolbar-btn" data-action="settings" title="Settings">
            <i class="icon-settings"></i>
        </button>
        
        <!-- Help -->
        <button class="toolbar-btn" data-action="help" title="Help (F1)">
            <i class="icon-help-circle"></i>
        </button>
    </div>
</div>
```

### 4.2 Toolbar Styling

```css
#toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--space-4);
    gap: var(--space-2);
}

.toolbar-section {
    display: flex;
    align-items: center;
    gap: var(--space-2);
}

.toolbar-group {
    display: flex;
    align-items: center;
    gap: var(--space-1);
}

.toolbar-divider {
    width: 1px;
    height: 24px;
    background: var(--border);
    margin: 0 var(--space-2);
}

.toolbar-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-2);
    min-width: 32px;
    height: 32px;
    border: none;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-primary);
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
}

.toolbar-btn:hover {
    background: var(--bg-tertiary);
}

.toolbar-btn:active,
.toolbar-btn.active {
    background: var(--brand-primary);
    color: white;
}

.toolbar-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.toolbar-btn.btn-primary {
    background: var(--brand-primary);
    color: white;
    padding: var(--space-2) var(--space-4);
    font-weight: var(--weight-medium);
}

.toolbar-btn.btn-primary:hover {
    background: var(--brand-hover);
}

.toolbar-btn.toggle[data-active="true"] {
    background: rgba(0, 122, 204, 0.2);
    color: var(--brand-primary);
}

.toolbar-zoom-display {
    min-width: 50px;
    text-align: center;
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--text-secondary);
}
```

---

## 5. Canvas Viewport

### 5.1 Viewport Structure

The viewport is the main editing area where users interact with the level.

```html
<div id="viewport-container">
    <!-- Main canvas -->
    <canvas id="viewport"></canvas>
    
    <!-- Minimap (optional) -->
    <div id="minimap">
        <canvas id="minimap-canvas"></canvas>
    </div>
    
    <!-- Viewport controls overlay -->
    <div id="viewport-controls">
        <div class="viewport-control-group">
            <button class="viewport-btn" data-action="pan-mode" title="Pan Mode (H)">
                <i class="icon-hand"></i>
            </button>
            <button class="viewport-btn" data-action="zoom-selection" title="Zoom to Selection">
                <i class="icon-zoom-in"></i>
            </button>
        </div>
    </div>
    
    <!-- Coordinate display -->
    <div id="coordinate-display">
        <span class="coord-label">X:</span>
        <span class="coord-value" id="coord-x">0</span>
        <span class="coord-label">Y:</span>
        <span class="coord-value" id="coord-y">0</span>
    </div>
    
    <!-- Loading overlay -->
    <div id="viewport-loading" class="hidden">
        <div class="spinner"></div>
        <p>Loading level...</p>
    </div>
</div>
```

### 5.2 Viewport Styling

```css
#viewport-container {
    position: relative;
    width: 100%;
    height: 100%;
    background: var(--canvas-bg);
}

#viewport {
    display: block;
    width: 100%;
    height: 100%;
    cursor: crosshair;
}

#viewport.panning {
    cursor: grab;
}

#viewport.panning:active {
    cursor: grabbing;
}

#viewport.selecting {
    cursor: crosshair;
}

#viewport.drawing {
    cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" fill="white" stroke="black"/></svg>') 12 12, auto;
}

/* Minimap */
#minimap {
    position: absolute;
    bottom: var(--space-4);
    right: var(--space-4);
    width: 200px;
    height: 150px;
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    overflow: hidden;
}

#minimap-canvas {
    width: 100%;
    height: 100%;
}

/* Viewport controls */
#viewport-controls {
    position: absolute;
    top: var(--space-4);
    right: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
}

.viewport-control-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    background: rgba(0, 0, 0, 0.8);
    border-radius: var(--radius-md);
    padding: var(--space-2);
}

.viewport-btn {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-primary);
    cursor: pointer;
    transition: background 0.2s;
}

.viewport-btn:hover {
    background: rgba(255, 255, 255, 0.1);
}

.viewport-btn.active {
    background: var(--brand-primary);
}

/* Coordinate display */
#coordinate-display {
    position: absolute;
    bottom: var(--space-2);
    left: var(--space-2);
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    background: rgba(0, 0, 0, 0.8);
    border-radius: var(--radius-md);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
}

.coord-label {
    color: var(--text-secondary);
}

.coord-value {
    color: var(--brand-primary);
    font-weight: var(--weight-medium);
    min-width: 50px;
}

/* Loading overlay */
#viewport-loading {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-4);
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(4px);
}

#viewport-loading.hidden {
    display: none;
}

.spinner {
    width: 48px;
    height: 48px;
    border: 4px solid rgba(255, 255, 255, 0.1);
    border-top-color: var(--brand-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
```

### 5.3 Canvas Cursors

Define custom cursors for different tools:

```css
.cursor-selection {
    cursor: default;
}

.cursor-pen {
    cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M3 21l1.5-1.5L18 6l-3-3L1.5 16.5z" fill="white" stroke="black"/></svg>') 0 24, auto;
}

.cursor-brush {
    cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="8" fill="rgba(0,122,204,0.5)" stroke="white"/></svg>') 12 12, auto;
}

.cursor-eraser {
    cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect x="4" y="8" width="16" height="12" fill="white" stroke="black"/></svg>') 12 12, auto;
}

.cursor-eyedropper {
    cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M19 3l2 2-8 8-2-2zm-14 18l8-8 2 2-8 8z" fill="white" stroke="black"/></svg>') 0 24, auto;
}
```

---

## 6. Left Panel - Asset Library

### 6.1 Asset Library Structure

```html
<aside id="assets-panel" class="panel">
    <div class="panel-header">
        <button class="panel-toggle">
            <i class="icon-chevron-left"></i>
        </button>
        <h3 class="panel-title">Assets</h3>
        <button class="panel-menu">
            <i class="icon-more-vertical"></i>
        </button>
    </div>
    
    <div class="panel-content">
        <!-- Search bar -->
        <div class="asset-search">
            <i class="icon-search search-icon"></i>
            <input type="text" placeholder="Search assets..." class="search-input">
            <button class="search-clear hidden">
                <i class="icon-x"></i>
            </button>
        </div>
        
        <!-- Import button -->
        <button class="btn btn-block btn-primary" data-action="import-asset">
            <i class="icon-upload"></i>
            <span>Import Assets</span>
        </button>
        
        <!-- Category filter -->
        <div class="asset-categories">
            <button class="category-btn active" data-category="all">
                All
            </button>
            <button class="category-btn" data-category="obstacles">
                Obstacles
            </button>
            <button class="category-btn" data-category="enemies">
                Enemies
            </button>
            <button class="category-btn" data-category="towers">
                Towers
            </button>
            <button class="category-btn" data-category="items">
                Items
            </button>
            <button class="category-btn" data-category="backgrounds">
                Backgrounds
            </button>
        </div>
        
        <!-- Asset grid -->
        <div class="asset-grid">
            <!-- Asset items populated dynamically -->
            <div class="asset-item" data-asset-id="tree-1" draggable="true">
                <div class="asset-thumbnail">
                    <img src="assets/tree.png" alt="Tree">
                </div>
                <div class="asset-name">Tree</div>
                <div class="asset-info">
                    <span class="asset-size">80×80</span>
                </div>
            </div>
            
            <!-- More asset items... -->
        </div>
        
        <!-- Recent assets -->
        <div class="asset-recent">
            <h4 class="section-title">Recent</h4>
            <div class="asset-recent-grid">
                <!-- Recent assets -->
            </div>
        </div>
    </div>
</aside>
```

### 6.2 Asset Library Styling

```css
#assets-panel {
    display: flex;
    flex-direction: column;
}

.asset-search {
    position: relative;
    margin: var(--space-4);
    margin-bottom: var(--space-2);
}

.search-icon {
    position: absolute;
    left: var(--space-3);
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-secondary);
    pointer-events: none;
}

.search-input {
    width: 100%;
    padding: var(--space-2) var(--space-3);
    padding-left: var(--space-8);
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-size: var(--text-sm);
}

.search-input:focus {
    outline: none;
    border-color: var(--brand-primary);
    box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
}

.search-clear {
    position: absolute;
    right: var(--space-2);
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
}

.btn-block {
    width: calc(100% - var(--space-8));
    margin: 0 var(--space-4) var(--space-4);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
}

.asset-categories {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    padding: 0 var(--space-4) var(--space-4);
    border-bottom: 1px solid var(--border);
}

.category-btn {
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-primary);
    font-size: var(--text-sm);
    cursor: pointer;
    transition: all 0.2s;
}

.category-btn:hover {
    background: var(--bg-tertiary);
}

.category-btn.active {
    background: var(--brand-primary);
    border-color: var(--brand-primary);
    color: white;
}

.asset-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: var(--space-2);
    padding: var(--space-4);
}

.asset-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--space-2);
    border-radius: var(--radius-sm);
    background: var(--bg-primary);
    cursor: move;
    transition: all 0.2s;
}

.asset-item:hover {
    background: var(--bg-tertiary);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.asset-item.dragging {
    opacity: 0.5;
}

.asset-thumbnail {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-secondary);
    border-radius: var(--radius-sm);
    margin-bottom: var(--space-2);
    overflow: hidden;
}

.asset-thumbnail img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.asset-name {
    font-size: var(--text-xs);
    text-align: center;
    color: var(--text-primary);
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.asset-info {
    font-size: var(--text-xs);
    color: var(--text-secondary);
    margin-top: var(--space-1);
}

.asset-recent {
    padding: var(--space-4);
    border-top: 1px solid var(--border);
}

.section-title {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--text-secondary);
    margin-bottom: var(--space-3);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.asset-recent-grid {
    display: flex;
    gap: var(--space-2);
    overflow-x: auto;
}
```

---

*[Document continues with sections 7-15 covering Properties Panel, Layers Panel, Status Bar, Modal Dialogs, Context Menus, Keyboard Shortcuts, Responsive Design, Accessibility, Animations, and Component Library]*

---

## Quick Reference: Common UI Patterns

### Button Styles
```css
.btn-primary { background: var(--brand-primary); }
.btn-success { background: var(--success); }
.btn-warning { background: var(--warning); }
.btn-error { background: var(--error); }
.btn-ghost { background: transparent; border: 1px solid; }
```

### Input Fields
```css
input, select, textarea {
    background: var(--bg-primary);
    border: 1px solid var(--border);
    color: var(--text-primary);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm);
}
```

### Tooltips
```html
<button data-tooltip="Tooltip text" data-tooltip-position="bottom">
    Button
</button>
```

---

**End of UI Specification** - Continue to Features Reference for professional tool comparison.