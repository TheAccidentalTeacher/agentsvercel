# Canvas Game Level Editor - Master Specification
## Complete Architecture & Requirements Document

**Version:** 1.0  
**Target Audience:** AI Assistants (Claude Opus/Sonnet 4.5, GPT-5+)  
**Purpose:** Comprehensive specification for building a professional-grade web-based level editor for Canvas games  
**Project Scope:** Standalone browser application for visual game level design and asset placement

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Goals & Vision](#project-goals--vision)
3. [User Personas & Use Cases](#user-personas--use-cases)
4. [Technical Architecture Overview](#technical-architecture-overview)
5. [Core Feature Requirements](#core-feature-requirements)
6. [Data Model & File Formats](#data-model--file-formats)
7. [Integration with Existing Games](#integration-with-existing-games)
8. [Technology Stack Decisions](#technology-stack-decisions)
9. [Performance Requirements](#performance-requirements)
10. [Security & Privacy Considerations](#security--privacy-considerations)
11. [Accessibility Requirements](#accessibility-requirements)
12. [Internationalization Support](#internationalization-support)
13. [Testing Strategy](#testing-strategy)
14. [Deployment Options](#deployment-options)
15. [Future Extensibility](#future-extensibility)

---

## 1. Executive Summary

### 1.1 Project Overview

This specification defines a comprehensive, browser-based level editor designed specifically for HTML5 Canvas games. The editor addresses a critical gap in educational game development: the inability of AI assistants to visually place game assets without direct visual feedback. By providing a visual, drag-and-drop interface for level design, this tool empowers non-technical game designers (particularly educators) to create, modify, and export game levels with precision and ease.

### 1.2 Problem Statement

**Current Challenges:**
- AI assistants cannot see game screens, making precise asset placement impossible
- Manual coordinate editing in JSON/JavaScript is error-prone and time-consuming
- Iteration cycles are slow (code → test → screenshot → adjust → repeat)
- Non-programmers cannot contribute to level design
- No visual feedback during design process
- Difficult to maintain consistency across multiple levels

**Solution Approach:**
Build a dedicated visual editor that:
- Provides real-time visual feedback
- Exports production-ready configuration files
- Supports drag-and-drop asset placement
- Includes grid snapping and alignment tools
- Offers layer management for complex scenes
- Enables rapid prototyping and iteration

### 1.3 Key Success Metrics

**Primary Goals:**
1. Reduce level creation time from hours to minutes
2. Enable non-programmers to design levels independently
3. Eliminate coordinate-related bugs in production
4. Support both existing games (Tower Defense, Bubble Brain) and future projects
5. Provide professional-grade tooling for educational game development

**Measurable Outcomes:**
- 10x faster level design iteration
- Zero manual coordinate editing required
- Support for unlimited game types and asset configurations
- Export formats compatible with 100+ game engines
- Sub-100ms UI response time for all interactions

---

## 2. Project Goals & Vision

### 2.1 Primary Objectives

#### Immediate Goals (Version 1.0)
1. **Visual Asset Placement**
   - Drag-and-drop interface for all game objects
   - Real-time preview with background images
   - Precise pixel-level positioning
   - Object rotation and scaling
   - Copy/paste/duplicate functionality

2. **Export System**
   - Generate JSON configuration files
   - Match existing game data formats exactly
   - Support multiple export targets (JSON, JavaScript, CSV, XML)
   - One-click clipboard copy
   - Automatic backup generation

3. **Project Management**
   - Load existing level configurations
   - Save/load editor projects
   - Multiple levels per project
   - Asset library management
   - Undo/redo system (unlimited history)

4. **Grid & Snapping Tools**
   - Configurable grid systems (orthogonal, isometric, hexagonal)
   - Smart snapping (grid, objects, guides)
   - Ruler and measurement tools
   - Alignment helpers
   - Distribution tools

#### Secondary Goals (Version 1.5)
1. **Advanced Layer Management**
   - Unlimited layers with z-ordering
   - Layer visibility toggles
   - Layer locking
   - Layer groups/folders
   - Opacity controls

2. **Prefab/Template System**
   - Save object configurations as reusable templates
   - Template library with preview thumbnails
   - Drag-and-drop template placement
   - Template versioning

3. **Collision & Physics Tools**
   - Visual collision shape drawing
   - Path waypoint editing
   - Trigger zone definition
   - Physics property editing

4. **Testing Integration**
   - Live preview mode
   - Test level directly in editor
   - Performance profiling
   - Playback recording

#### Long-term Vision (Version 2.0+)
1. **Collaborative Editing**
   - Real-time multi-user editing
   - Cloud save/sync
   - Version control integration
   - Comment/annotation system

2. **Asset Pipeline Integration**
   - Direct Canva API integration
   - Image editing tools
   - Sprite sheet management
   - Animation preview

3. **Game Engine Exports**
   - Unity tilemap export
   - Godot scene export
   - Phaser integration
   - Custom engine plugins

4. **AI-Assisted Design**
   - Procedural level generation
   - Auto-layout suggestions
   - Pattern detection and replication
   - Smart object placement

### 2.2 Design Philosophy

**Core Principles:**

1. **Simplicity First**
   - Interface should be learnable in under 5 minutes
   - Common tasks require minimal clicks
   - Keyboard shortcuts for power users
   - Sensible defaults for all settings

2. **Visual Feedback Everywhere**
   - Every action shows immediate visual result
   - Hover previews for all tools
   - Color-coded UI elements
   - Animated transitions for clarity

3. **Non-Destructive Workflow**
   - Unlimited undo/redo
   - Automatic save states
   - Non-destructive transformations
   - Safe experimentation encouraged

4. **Professional Power, Amateur Accessibility**
   - Advanced features hidden in progressive disclosure
   - Tooltips and contextual help
   - Tutorial system for new users
   - Pro mode for experienced designers

5. **Export-First Design**
   - Everything designed around export formats
   - Preview exactly what will be exported
   - Validate exports before saving
   - Multiple export targets supported

---

## 3. User Personas & Use Cases

### 3.1 Primary User Personas

#### Persona 1: "Teacher Teresa"
**Background:**
- Elementary school teacher
- Basic computer skills
- Wants to create educational games for students
- Limited programming knowledge
- Time-constrained (30 minutes per design session)

**Goals:**
- Create math game levels quickly
- Customize difficulty per student group
- Reuse assets across multiple levels
- Export levels for classroom use

**Pain Points:**
- Intimidated by code/JSON editing
- Needs visual confirmation of changes
- Requires simple, intuitive interface
- Must work within school IT restrictions (browser-based)

**Use Cases:**
1. Create new Tower Defense level with specific math objectives
2. Adjust obstacle placement to increase/decrease difficulty
3. Export configuration to share with colleague
4. Duplicate existing level and modify for different grade level

#### Persona 2: "Developer Dan"
**Background:**
- Indie game developer
- Proficient in JavaScript/HTML5
- Building multiple Canvas games simultaneously
- Needs efficient workflow tools

**Goals:**
- Rapid prototyping of level layouts
- Consistent asset placement across levels
- Quick iteration on game feel
- Professional-quality output

**Pain Points:**
- Manual coordinate editing is tedious
- No visual feedback during development
- Difficult to maintain consistency
- Time-consuming iteration cycles

**Use Cases:**
1. Design 50+ levels for new puzzle game
2. Test different enemy spawn patterns visually
3. Export to multiple formats (JSON, JavaScript module)
4. Create reusable prefabs for common patterns

#### Persona 3: "AI Assistant Alex"
**Background:**
- Claude Opus/Sonnet, GPT-5, or similar
- Cannot see visual output
- Generates code based on specifications
- Needs structured, machine-readable output

**Goals:**
- Help users create games without visual capability
- Provide accurate code generation
- Enable precise asset placement
- Support iterative design processes

**Pain Points:**
- Cannot verify visual correctness
- Blind to positioning errors
- Requires extensive user feedback
- Limited by text-based communication

**Use Cases:**
1. Read exported JSON to understand level structure
2. Parse coordinate data to generate game code
3. Suggest modifications based on level analysis
4. Validate exported configurations for correctness

#### Persona 4: "Student Sam"
**Background:**
- 6th-8th grade student
- Digital native, comfortable with apps/games
- Learning game design in after-school program
- Creative but limited technical skills

**Goals:**
- Create cool game levels for friends
- Express creativity through level design
- Share creations with classmates
- Learn basic game design concepts

**Pain Points:**
- Gets frustrated with complex interfaces
- Needs instant gratification (fast feedback)
- Requires error prevention (hard to break things)
- Must work on school computers (restricted environment)

**Use Cases:**
1. Design a level for class game project
2. Add custom obstacles and enemies
3. Test level immediately
4. Save and continue work later

### 3.2 Detailed Use Case Scenarios

#### Use Case 1: Creating a New Level from Scratch

**Actor:** Teacher Teresa  
**Preconditions:** Editor is open, project is created  
**Trigger:** User clicks "New Level" button

**Main Flow:**
1. User selects level template (blank, from existing, from preset)
2. System creates new level with default settings
3. User loads background image (drag-drop or file picker)
4. System displays background at correct dimensions
5. User selects obstacle tool from toolbar
6. User clicks on canvas to place obstacle
7. System snaps obstacle to grid (if enabled)
8. User drags obstacle to fine-tune position
9. System shows real-time coordinates and dimensions
10. User rotates/scales obstacle using handles
11. User repeats for all assets (enemies, towers, items, etc.)
12. User clicks "Export" to generate JSON
13. System copies configuration to clipboard
14. User pastes into game configuration file
15. Level works perfectly in game on first try

**Alternative Flows:**
- 2a. User imports existing JSON to modify
- 5a. User uses keyboard shortcut instead of toolbar
- 8a. User enters exact coordinates in properties panel
- 12a. User saves project for later editing

**Postconditions:**
- Level is saved in editor
- JSON is exported correctly
- Level is ready for game integration

**Success Metrics:**
- Time to create level: < 5 minutes
- Zero coordinate errors
- User satisfaction: 9/10 or higher

#### Use Case 2: Adjusting Difficulty by Moving Obstacles

**Actor:** Teacher Teresa  
**Preconditions:** Level is already created and loaded  
**Trigger:** User wants to make level easier for struggling students

**Main Flow:**
1. User opens existing level in editor
2. System displays all current assets
3. User selects multiple obstacles by shift-clicking
4. System highlights selected objects
5. User drags selected group to new position
6. System maintains relative spacing during drag
7. User uses arrow keys for pixel-perfect adjustments
8. System shows live preview of changes
9. User exports updated configuration
10. System generates diff showing what changed
11. User replaces only changed values in game code
12. Level difficulty is now adjusted without rewriting entire config

**Alternative Flows:**
- 3a. User uses lasso select to grab multiple objects
- 6a. User holds Shift to maintain horizontal/vertical alignment
- 9a. User exports full configuration to replace existing
- 10a. User saves as new level variant instead of overwriting

**Postconditions:**
- Level difficulty is modified as intended
- Original level is preserved (optional)
- Changes are tracked for version control

#### Use Case 3: Creating Reusable Enemy Patterns

**Actor:** Developer Dan  
**Preconditions:** Multiple levels designed, patterns emerging  
**Trigger:** User notices repeated enemy formations

**Main Flow:**
1. User selects group of enemies forming a pattern
2. User right-clicks and selects "Save as Prefab"
3. System prompts for prefab name and category
4. User enters "V-Formation Squad" as name
5. System saves prefab to library with thumbnail
6. User switches to different level
7. User opens prefab library panel
8. User drags "V-Formation Squad" onto canvas
9. System places entire formation at cursor position
10. User can scale/rotate entire prefab as one unit
11. User can "explode" prefab to edit individual enemies
12. User exports level with prefab instances
13. System generates configuration referencing prefab template

**Alternative Flows:**
- 2a. User uses keyboard shortcut Ctrl+Shift+P
- 5a. System auto-generates thumbnail from selection
- 11a. User modifies prefab globally, affecting all instances

**Postconditions:**
- Prefab is saved in library
- Pattern is reusable across all levels
- Configuration file references prefab for efficiency

#### Use Case 4: Testing Level Balance

**Actor:** Developer Dan  
**Preconditions:** Level is designed, needs playtesting  
**Trigger:** User clicks "Test Play" button

**Main Flow:**
1. User clicks test play icon in toolbar
2. System validates level for completeness
3. System enters test mode (UI changes to game view)
4. User plays level directly in editor
5. System overlays debug information (FPS, collision boxes)
6. User notices issue (enemy path too easy)
7. User presses Escape to exit test mode
8. System returns to edit mode at exact frame of issue
9. User adjusts enemy path waypoints
10. User presses F5 to quick-test from current frame
11. System confirms fix works correctly
12. User exits test mode and exports final level

**Alternative Flows:**
- 2a. Validation fails, system highlights issues
- 6a. User uses editor hotkeys during test (slow motion, pause)
- 10a. User sets breakpoint to test specific wave/event

**Postconditions:**
- Level is balanced and tested
- Issues are identified and fixed efficiently
- Export includes tested, validated configuration

---

## 4. Technical Architecture Overview

### 4.1 System Architecture

**High-Level Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser Environment                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              User Interface Layer                      │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │  │
│  │  │ Toolbar  │ │Properties│ │ Layers   │ │ Assets   │ │  │
│  │  │  Panel   │ │  Panel   │ │  Panel   │ │  Panel   │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │         Canvas Viewport (Main Editor)           │  │  │
│  │  │  - Drag/drop, zoom, pan, selection tools        │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │            Application Logic Layer                     │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │  │
│  │  │ Editor   │ │Selection │ │Transform │ │  Tool    │ │  │
│  │  │ State    │ │ Manager  │ │  System  │ │ Manager  │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │  │
│  │  │  Undo/   │ │  Grid &  │ │ Collision│ │  Event   │ │  │
│  │  │  Redo    │ │  Snap    │ │ Detection│ │  System  │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Data Management Layer                     │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │  │
│  │  │ Project  │ │  Level   │ │  Asset   │ │  Prefab  │ │  │
│  │  │ Manager  │ │  Data    │ │  Library │ │  System  │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Export/Import Layer                       │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │  │
│  │  │   JSON   │ │JavaScript│ │   Tiled  │ │  Custom  │ │  │
│  │  │ Exporter │ │ Exporter │ │  (TMX)   │ │ Formats  │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │            Persistence Layer (Optional)                │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐              │  │
│  │  │LocalStorag│ │IndexedDB │ │  Cloud   │              │  │
│  │  │   (Light) │ │ (Heavy)  │ │  Sync    │              │  │
│  │  └──────────┘ └──────────┘ └──────────┘              │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Core Components

#### 4.2.1 Canvas Viewport System

**Purpose:** Primary visual editing surface where users interact with level design.

**Responsibilities:**
- Render all level objects at correct positions/scales
- Handle mouse/touch input for selection, dragging, drawing
- Implement zoom and pan controls
- Display grid, guidelines, rulers
- Show selection boxes, handles, and indicators
- Support multiple viewport modes (edit, preview, test)

**Key Features:**
- Infinite canvas with configurable boundaries
- Hardware-accelerated rendering (WebGL fallback)
- Multi-resolution support (retina/4K displays)
- Customizable background (solid, image, pattern, checkerboard)
- Layer composition with blend modes
- Object culling for performance (only render visible objects)

**Technical Implementation:**
```javascript
class CanvasViewport {
  constructor(container, width, height) {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { 
      alpha: false, 
      desynchronized: true  // Performance hint
    });
    
    this.width = width;
    this.height = height;
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    
    this.grid = new GridSystem(this);
    this.camera = new Camera(this);
    this.renderer = new LayeredRenderer(this);
    
    this.setupInputHandlers();
    this.startRenderLoop();
  }
  
  // Transform screen coordinates to world coordinates
  screenToWorld(screenX, screenY) {
    return {
      x: (screenX - this.panX) / this.zoom,
      y: (screenY - this.panY) / this.zoom
    };
  }
  
  // Transform world coordinates to screen coordinates
  worldToScreen(worldX, worldY) {
    return {
      x: worldX * this.zoom + this.panX,
      y: worldY * this.zoom + this.panY
    };
  }
  
  render(deltaTime) {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Save transform state
    this.ctx.save();
    
    // Apply camera transform
    this.ctx.translate(this.panX, this.panY);
    this.ctx.scale(this.zoom, this.zoom);
    
    // Render all layers in order
    this.renderer.renderLayers(this.ctx, this.camera);
    
    // Restore transform
    this.ctx.restore();
    
    // Render UI overlays (always in screen space)
    this.renderOverlays(this.ctx);
  }
}
```

#### 4.2.2 Object Management System

**Purpose:** Track, organize, and manipulate all level objects (obstacles, enemies, items, etc.).

**Responsibilities:**
- Maintain object registry with unique IDs
- Support object hierarchy (parent-child relationships)
- Handle object creation, deletion, and modification
- Provide query system for spatial searches
- Manage object properties and metadata
- Support bulk operations (multi-select)

**Data Structure:**
```javascript
class GameObject {
  constructor(type, properties = {}) {
    this.id = generateUUID();
    this.type = type;  // 'obstacle', 'enemy', 'tower', 'item', etc.
    this.layer = properties.layer || 'default';
    
    // Transform properties
    this.x = properties.x || 0;
    this.y = properties.y || 0;
    this.width = properties.width || 64;
    this.height = properties.height || 64;
    this.rotation = properties.rotation || 0;
    this.scaleX = properties.scaleX || 1;
    this.scaleY = properties.scaleY || 1;
    
    // Visual properties
    this.sprite = properties.sprite || null;
    this.color = properties.color || '#FFFFFF';
    this.opacity = properties.opacity || 1.0;
    this.visible = properties.visible !== false;
    
    // Physics/gameplay properties (custom per game)
    this.customProperties = properties.custom || {};
    
    // Editor metadata (not exported)
    this.locked = false;
    this.selected = false;
    this.name = properties.name || `${type}_${this.id.slice(0, 8)}`;
  }
  
  // Get bounding box for collision/selection
  getBounds() {
    return {
      left: this.x,
      top: this.y,
      right: this.x + this.width,
      bottom: this.y + this.height
    };
  }
  
  // Check if point is inside object
  containsPoint(x, y) {
    const bounds = this.getBounds();
    return x >= bounds.left && x <= bounds.right &&
           y >= bounds.top && y <= bounds.bottom;
  }
  
  // Export to JSON (strips editor metadata)
  toJSON() {
    return {
      type: this.type,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      rotation: this.rotation,
      ...this.customProperties
    };
  }
}

class ObjectManager {
  constructor() {
    this.objects = new Map();  // id -> GameObject
    this.objectsByLayer = new Map();  // layer -> Set of ids
    this.spatialIndex = new SpatialHash(100);  // For fast spatial queries
  }
  
  add(object) {
    this.objects.set(object.id, object);
    
    if (!this.objectsByLayer.has(object.layer)) {
      this.objectsByLayer.set(object.layer, new Set());
    }
    this.objectsByLayer.get(object.layer).add(object.id);
    
    this.spatialIndex.insert(object);
  }
  
  remove(objectId) {
    const object = this.objects.get(objectId);
    if (!object) return;
    
    this.objects.delete(objectId);
    this.objectsByLayer.get(object.layer).delete(objectId);
    this.spatialIndex.remove(object);
  }
  
  // Get all objects in a rectangular region
  getObjectsInRegion(x, y, width, height) {
    return this.spatialIndex.query(x, y, width, height);
  }
  
  // Get object at specific point (top-most)
  getObjectAtPoint(x, y) {
    const candidates = this.spatialIndex.query(x - 1, y - 1, 2, 2);
    
    // Sort by layer order and find top-most
    return candidates
      .filter(obj => obj.visible && obj.containsPoint(x, y))
      .sort((a, b) => this.getLayerOrder(b.layer) - this.getLayerOrder(a.layer))
      [0] || null;
  }
}
```

#### 4.2.3 Layer System

**Purpose:** Organize objects into stackable layers for complex scene composition.

**Responsibilities:**
- Manage layer creation, deletion, reordering
- Control layer visibility, locking, opacity
- Support layer groups/folders
- Provide layer filtering and isolation
- Handle layer-specific rendering settings

**Layer Types:**
1. **Tile Layer** - Grid-based tile placement
2. **Object Layer** - Free-form object placement
3. **Image Layer** - Background/foreground images
4. **Grid Layer** - Metadata grid (for pathfinding, AI hints)
5. **Reference Layer** - Non-exported reference images

**Implementation:**
```javascript
class Layer {
  constructor(name, type = 'object') {
    this.id = generateUUID();
    this.name = name;
    this.type = type;  // 'tile', 'object', 'image', 'grid', 'reference'
    this.visible = true;
    this.locked = false;
    this.opacity = 1.0;
    this.order = 0;  // Z-order (higher renders on top)
    this.parentId = null;  // For layer groups
    this.expanded = true;  // UI state for hierarchy
    
    // Layer-specific data
    this.objects = [];  // For object layers
    this.tiles = null;  // For tile layers (2D array)
    this.image = null;  // For image layers
    this.gridData = null;  // For grid layers
  }
  
  render(ctx, camera) {
    if (!this.visible) return;
    
    ctx.save();
    ctx.globalAlpha = this.opacity;
    
    switch (this.type) {
      case 'tile':
        this.renderTiles(ctx, camera);
        break;
      case 'object':
        this.renderObjects(ctx, camera);
        break;
      case 'image':
        this.renderImage(ctx, camera);
        break;
      case 'grid':
        this.renderGrid(ctx, camera);
        break;
    }
    
    ctx.restore();
  }
}

class LayerManager {
  constructor() {
    this.layers = [];
    this.activeLayerId = null;
  }
  
  addLayer(name, type) {
    const layer = new Layer(name, type);
    layer.order = this.layers.length;
    this.layers.push(layer);
    this.sortByOrder();
    return layer;
  }
  
  removeLayer(layerId) {
    const index = this.layers.findIndex(l => l.id === layerId);
    if (index === -1) return;
    
    this.layers.splice(index, 1);
    this.reorderLayers();
  }
  
  moveLayer(layerId, newOrder) {
    const layer = this.getLayer(layerId);
    if (!layer) return;
    
    layer.order = newOrder;
    this.sortByOrder();
  }
  
  sortByOrder() {
    this.layers.sort((a, b) => a.order - b.order);
  }
  
  getVisibleLayers() {
    return this.layers.filter(l => l.visible);
  }
}
```

#### 4.2.4 Tool System

**Purpose:** Provide various editing tools for different tasks (select, draw, erase, etc.).

**Tool Types:**
1. **Selection Tool** - Select, move, rotate, scale objects
2. **Pen/Pencil Tool** - Draw paths, polygons, shapes
3. **Brush Tool** - Paint tiles or terrain
4. **Eraser Tool** - Remove objects or tiles
5. **Fill/Bucket Tool** - Flood fill areas
6. **Path Tool** - Create bezier curves for enemy paths
7. **Shape Tool** - Draw rectangles, circles, polygons
8. **Text Tool** - Add text labels (editor-only or exported)
9. **Eyedropper Tool** - Sample colors or object properties
10. **Ruler/Measure Tool** - Measure distances and angles

**Tool Architecture:**
```javascript
class Tool {
  constructor(editor) {
    this.editor = editor;
    this.name = 'Tool';
    this.icon = null;
    this.cursor = 'default';
    this.hotkey = null;
  }
  
  // Called when tool is activated
  onActivate() {}
  
  // Called when tool is deactivated
  onDeactivate() {}
  
  // Mouse events
  onMouseDown(x, y, button, modifiers) {}
  onMouseMove(x, y, modifiers) {}
  onMouseUp(x, y, button, modifiers) {}
  onMouseWheel(delta, modifiers) {}
  
  // Keyboard events
  onKeyDown(key, modifiers) {}
  onKeyUp(key, modifiers) {}
  
  // Render tool-specific overlays
  renderOverlay(ctx) {}
}

class SelectionTool extends Tool {
  constructor(editor) {
    super(editor);
    this.name = 'Selection';
    this.icon = 'cursor-arrow';
    this.hotkey = 'V';
    
    this.dragStart = null;
    this.dragOffset = null;
    this.selectionBox = null;
    this.transformHandle = null;
  }
  
  onMouseDown(x, y, button, modifiers) {
    const worldPos = this.editor.viewport.screenToWorld(x, y);
    const hitObject = this.editor.objects.getObjectAtPoint(worldPos.x, worldPos.y);
    
    if (hitObject) {
      // Check if clicking on transform handle
      const handle = this.getHandleAtPoint(x, y);
      if (handle) {
        this.transformHandle = handle;
        return;
      }
      
      // Select object and start drag
      if (!modifiers.shift && !hitObject.selected) {
        this.editor.selection.clear();
      }
      this.editor.selection.add(hitObject);
      
      this.dragStart = worldPos;
      this.dragOffset = {
        x: worldPos.x - hitObject.x,
        y: worldPos.y - hitObject.y
      };
    } else {
      // Start selection box
      if (!modifiers.shift) {
        this.editor.selection.clear();
      }
      this.selectionBox = { x: worldPos.x, y: worldPos.y, width: 0, height: 0 };
    }
  }
  
  onMouseMove(x, y, modifiers) {
    const worldPos = this.editor.viewport.screenToWorld(x, y);
    
    if (this.transformHandle) {
      // Handle transform (scale, rotate)
      this.handleTransform(worldPos, this.transformHandle);
    } else if (this.dragStart) {
      // Drag selected objects
      const dx = worldPos.x - this.dragStart.x;
      const dy = worldPos.y - this.dragStart.y;
      
      // Apply grid snapping if enabled
      const snapped = this.editor.grid.snap(dx, dy, modifiers.alt);
      
      this.editor.selection.translateAll(snapped.x, snapped.y);
      this.dragStart = worldPos;
    } else if (this.selectionBox) {
      // Update selection box
      this.selectionBox.width = worldPos.x - this.selectionBox.x;
      this.selectionBox.height = worldPos.y - this.selectionBox.y;
    }
  }
  
  onMouseUp(x, y, button, modifiers) {
    if (this.selectionBox) {
      // Select all objects in selection box
      const objects = this.editor.objects.getObjectsInRegion(
        this.selectionBox.x,
        this.selectionBox.y,
        this.selectionBox.width,
        this.selectionBox.height
      );
      objects.forEach(obj => this.editor.selection.add(obj));
      this.selectionBox = null;
    }
    
    this.dragStart = null;
    this.dragOffset = null;
    this.transformHandle = null;
  }
  
  renderOverlay(ctx) {
    // Draw selection box if active
    if (this.selectionBox) {
      ctx.strokeStyle = '#00A8FF';
      ctx.lineWidth = 1 / this.editor.viewport.zoom;
      ctx.setLineDash([5 / this.editor.viewport.zoom, 5 / this.editor.viewport.zoom]);
      ctx.strokeRect(
        this.selectionBox.x,
        this.selectionBox.y,
        this.selectionBox.width,
        this.selectionBox.height
      );
      ctx.setLineDash([]);
    }
    
    // Draw transform handles for selected objects
    this.editor.selection.forEach(obj => {
      this.drawTransformHandles(ctx, obj);
    });
  }
}
```

### 4.3 Export System Architecture

**Export Flow:**
```
User Design → Internal Data Model → Validation → Format Conversion → Export File
```

**Supported Export Formats:**

1. **JSON (Primary)**
   - Matches existing game formats exactly
   - Human-readable for debugging
   - Easy to parse in any language
   - Example for Tower Defense:
   ```json
   {
     "levelId": 2,
     "name": "Forest Path",
     "background": "Level 2 Forest Path Background.jpg",
     "obstacles": [
       { "x": 300, "y": 150, "width": 80, "height": 80, "type": "tree" },
       { "x": 900, "y": 150, "width": 80, "height": 80, "type": "tree" }
     ],
     "path": [
       { "x": 0, "y": 350 },
       { "x": 1200, "y": 350 }
     ],
     "enemySpawns": [
       { "type": "basic", "wave": 1, "delay": 0 },
       { "type": "fast", "wave": 2, "delay": 5 }
     ]
   }
   ```

2. **JavaScript Module**
   - Direct import into game code
   - Type-safe with JSDoc comments
   - Example:
   ```javascript
   export const level2 = {
     name: 'Forest Path',
     obstacles: [
       { x: 300, y: 150, width: 80, height: 80, type: 'tree' },
       // ...
     ]
   };
   ```

3. **Tiled TMX Format**
   - Industry standard interchange format
   - Supports complex layer structures
   - XML-based (or JSON variant)

4. **CSV (Simple)**
   - For tile-based levels only
   - Easy to import in Excel/Google Sheets
   - Example: `0,0,1,1,2,0,0` (tile IDs per row)

5. **Custom Format**
   - User-defined exporters via plugins
   - Template-based generation

**Exporter Implementation:**
```javascript
class Exporter {
  constructor(formatName) {
    this.formatName = formatName;
  }
  
  export(level, options = {}) {
    throw new Error('Must implement export() method');
  }
  
  validate(level) {
    return { valid: true, errors: [] };
  }
}

class JSONExporter extends Exporter {
  constructor() {
    super('JSON');
  }
  
  export(level, options = {}) {
    const data = {
      version: '1.0',
      levelId: level.id,
      name: level.name,
      width: level.width,
      height: level.height,
      background: level.background,
      layers: []
    };
    
    // Export each layer
    for (const layer of level.layers) {
      if (layer.type === 'reference') continue;  // Skip reference layers
      
      const layerData = {
        name: layer.name,
        type: layer.type,
        visible: layer.visible,
        opacity: layer.opacity
      };
      
      if (layer.type === 'object') {
        layerData.objects = layer.objects.map(obj => obj.toJSON());
      } else if (layer.type === 'tile') {
        layerData.tiles = this.exportTileData(layer.tiles);
      }
      
      data.layers.push(layerData);
    }
    
    // Format JSON with indentation if requested
    const indent = options.pretty ? 2 : 0;
    return JSON.stringify(data, null, indent);
  }
  
  validate(level) {
    const errors = [];
    
    // Check required fields
    if (!level.name) errors.push('Level must have a name');
    if (level.width <= 0 || level.height <= 0) errors.push('Invalid level dimensions');
    
    // Check for empty layers
    const emptyLayers = level.layers.filter(l => 
      l.type === 'object' && l.objects.length === 0
    );
    if (emptyLayers.length > 0) {
      errors.push(`Empty layers: ${emptyLayers.map(l => l.name).join(', ')}`);
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  }
}

class ExportManager {
  constructor() {
    this.exporters = new Map();
    
    // Register built-in exporters
    this.register(new JSONExporter());
    this.register(new JavaScriptExporter());
    this.register(new TiledExporter());
    this.register(new CSVExporter());
  }
  
  register(exporter) {
    this.exporters.set(exporter.formatName, exporter);
  }
  
  export(level, formatName, options = {}) {
    const exporter = this.exporters.get(formatName);
    if (!exporter) {
      throw new Error(`Unknown export format: ${formatName}`);
    }
    
    // Validate before export
    const validation = exporter.validate(level);
    if (!validation.valid && !options.ignoreValidation) {
      throw new Error(`Validation failed:\n${validation.errors.join('\n')}`);
    }
    
    // Perform export
    return exporter.export(level, options);
  }
  
  exportToClipboard(level, formatName, options = {}) {
    const output = this.export(level, formatName, options);
    navigator.clipboard.writeText(output);
    return output;
  }
  
  exportToFile(level, formatName, filename, options = {}) {
    const output = this.export(level, formatName, options);
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
  }
}
```

---

## 5. Core Feature Requirements

### 5.1 Essential Features (Version 1.0)

#### 5.1.1 Project Management

**Requirements:**
- Create new project with configurable settings
- Open existing projects from file system
- Save project with all levels and assets
- Auto-save every 5 minutes (configurable)
- Project settings panel:
  - Default canvas size
  - Grid settings (size, snap, visibility)
  - Asset directories
  - Export format preferences
  - Keyboard shortcuts customization

**User Stories:**
- As a user, I want to create a new project so I can organize multiple related levels
- As a user, I want projects to auto-save so I don't lose work if browser crashes
- As a user, I want to configure project-wide settings so all levels use consistent values

**Acceptance Criteria:**
- [x] Can create new project with wizard dialog
- [x] Project file saves to user-selected location
- [x] Auto-save indicator shows last save time
- [x] Can export entire project as ZIP with all assets
- [x] Project file is valid JSON for manual editing if needed

#### 5.1.2 Level Editing

**Requirements:**
- Create/delete/duplicate levels within project
- Set level properties:
  - Name, description, ID
  - Canvas dimensions
  - Background image/color
  - Grid settings (can override project defaults)
- Visual canvas with pan and zoom
- Multiple view modes:
  - Edit mode (full UI)
  - Preview mode (game view, no UI)
  - Test mode (playable with debug overlay)
- Grid overlay with configurable size and color
- Rulers showing pixel measurements
- Center/fit viewport buttons

**User Stories:**
- As a user, I want to zoom in/out so I can see fine details or entire level
- As a user, I want to pan the canvas so I can edit large levels
- As a user, I want grid snapping so objects align perfectly
- As a user, I want to see rulers so I know exact object positions

**Acceptance Criteria:**
- [x] Can zoom from 10% to 1000% smoothly
- [x] Pan works with middle mouse button, space+drag, or touchpad
- [x] Grid can be toggled on/off with keyboard shortcut
- [x] Rulers show measurements in pixels and grid units
- [x] Canvas can be centered with keyboard shortcut (Ctrl+0)

#### 5.1.3 Object Placement & Manipulation

**Requirements:**
- Drag-and-drop asset placement from library
- Click-to-place mode for rapid object creation
- Move, rotate, scale selected objects
- Transform handles (corner/edge resize, rotation)
- Multi-select (shift-click, marquee selection)
- Group/ungroup objects
- Align tools:
  - Align left/center/right
  - Align top/middle/bottom
  - Distribute evenly (horizontal/vertical)
- Smart guides show alignment with nearby objects
- Duplicate objects (Ctrl+D)
- Copy/paste between levels
- Delete selected (Delete/Backspace key)

**User Stories:**
- As a user, I want to drag assets onto the canvas so I can place objects visually
- As a user, I want to resize objects by dragging handles so I can adjust their size
- As a user, I want to rotate objects so I can orient them correctly
- As a user, I want multi-select so I can move multiple objects together

**Acceptance Criteria:**
- [x] Assets can be dragged from library and drop-placed on canvas
- [x] Objects show transform handles when selected
- [x] Can rotate objects by dragging rotation handle or entering angle
- [x] Multi-select works with shift-click and marquee drag
- [x] Align tools work on multi-selection
- [x] Smart guides appear when dragging near other objects

#### 5.1.4 Layer Management

**Requirements:**
- Create/delete/rename layers
- Reorder layers by dragging in layer panel
- Toggle layer visibility (eye icon)
- Lock layers to prevent editing (lock icon)
- Adjust layer opacity (0-100%)
- Set active layer (objects added to active layer)
- Isolate layer (hide all others)
- Merge layers
- Layer groups/folders for organization

**User Stories:**
- As a user, I want multiple layers so I can organize different object types
- As a user, I want to hide layers so I can focus on specific elements
- As a user, I want to lock layers so I don't accidentally move background objects

**Acceptance Criteria:**
- [x] Can create unlimited layers
- [x] Layer order affects rendering (top layer renders last)
- [x] Hidden layers don't respond to selection
- [x] Locked layers can't be edited but are still visible
- [x] Layer opacity affects all objects on that layer

#### 5.1.5 Asset Library

**Requirements:**
- Asset browser panel showing all available assets
- Organize assets by category/folder
- Preview thumbnails for all assets
- Search/filter assets by name or tag
- Import new assets:
  - Image files (PNG, JPG, GIF, WebP)
  - Sprite sheets (with slice tool)
  - SVG files
  - From URL
- Asset properties:
  - Default size (width x height)
  - Collision box (for physics objects)
  - Custom properties (type-specific)
  - Tags for organization
- Recent assets quick access

**User Stories:**
- As a user, I want to see thumbnails of assets so I can identify them visually
- As a user, I want to import my own images so I can use custom graphics
- As a user, I want to organize assets in folders so I can find them easily

**Acceptance Criteria:**
- [x] Asset library panel shows all imported assets
- [x] Can drag-and-drop images into asset library to import
- [x] Assets organized in tree structure (folders)
- [x] Search field filters assets by name
- [x] Double-click asset to add to canvas at cursor position

#### 5.1.6 Export System

**Requirements:**
- Export current level to JSON
- Export all levels in project
- Copy export to clipboard (for quick paste into code)
- Save export to file
- Format options:
  - Indentation (pretty vs minified)
  - Include/exclude specific data (e.g., editor metadata)
  - Custom property filtering
- Export preview (show what will be exported)
- Export validation (check for errors before exporting)
- Export diff (show changes since last export)

**User Stories:**
- As a user, I want to export JSON so I can use it in my game
- As a user, I want to preview export so I can verify it's correct before using
- As a user, I want to copy export to clipboard so I can quickly paste it

**Acceptance Criteria:**
- [x] Export button generates valid JSON matching game format
- [x] Copy to clipboard works and shows confirmation
- [x] Export validation catches common errors (missing required fields, invalid values)
- [x] Exported JSON can be re-imported without data loss

---

*[Document continues in next file: LEVEL_EDITOR_TECHNICAL_GUIDE.md]*

This completes the first document. Would you like me to continue with the remaining 4 documents? Each will be similarly comprehensive and detailed.