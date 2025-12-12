# Universal Game Level Editor

A lightweight, browser-based 2D game level editor that works with any game. Built with pure HTML5, CSS3, and JavaScript - no frameworks, no build process, no dependencies.

## Features

- **🤖 AI Assistant Panel** (NEW v1.2.0) - Complete AI chat interface with settings, conversation management, and provider configuration
- **✨ Universal Tooltips** (v1.1.0) - Every UI element has helpful, context-aware tooltips with keyboard shortcuts
- **Load Background Images**: Set your level background from any image file
- **Add Game Assets**: Browse and add multiple sprites/objects to your scene
- **Drag & Drop Positioning**: Click and drag objects to arrange your level
- **Live Property Editing**: Adjust position, size, and rotation in real-time
- **Object Duplication**: Quickly copy objects with Ctrl+D
- **JSON Export**: Clean, game-ready JSON with clipboard copy + file download
- **Project Save/Load**: Save entire projects (including images) for later editing
- **Keyboard Shortcuts**: Fast workflow with built-in shortcuts (discoverable via tooltips!)
- **Grid Visualization**: Visual grid for precise placement

## Usage

### Local Development
1. Clone this repository
2. Open `index.html` in your browser (double-click or use a local server)
3. Start editing!

### Online Access
Visit the deployed version at: [your-netlify-url-here]

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+B` | Load Background |
| `Ctrl+A` | Add Asset |
| `Ctrl+E` | Export JSON |
| `Ctrl+S` | Save Project |
| `Ctrl+O` | Load Project |
| `Ctrl+D` | Duplicate Selected Object |
| `Arrow Keys` | Move Selected Object (1px) |
| `Shift+Arrows` | Move Selected Object (10px) |
| `Delete` | Delete Selected Object |

## Workflow

1. **Load Background** - Click "Load Background" or press `Ctrl+B` to set your level's background image
2. **Add Assets** - Click "Add Asset" or press `Ctrl+A` to add game objects (sprites, enemies, items, etc.)
3. **Position Objects** - Click to select, drag to move, or use arrow keys for precise placement
4. **Edit Properties** - Use the right panel to adjust X, Y, Width, Height, and Rotation
5. **Export** - Click "Export JSON" or press `Ctrl+E` to get your level data (auto-copies to clipboard)
6. **Save Project** - Click "Save Project" to save everything for later editing

## JSON Output Format

```json
{
  "background": "background.png",
  "objects": [
    {
      "id": "asset_123456",
      "name": "sprite.png",
      "x": 100,
      "y": 150,
      "width": 64,
      "height": 64,
      "rotation": 0
    }
  ]
}
```

## Browser Compatibility

Works in all modern browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Technical Details

- **Pure JavaScript**: No frameworks, no dependencies
- **HTML5 Canvas**: Smooth rendering with requestAnimationFrame
- **FileReader API**: Client-side image loading
- **localStorage**: Project persistence
- **Netlify Ready**: Static files, instant deployment

## Deployment

### Deploy to Netlify via GitHub
1. Push this repository to GitHub
2. Log in to [Netlify](https://netlify.com)
3. Click "New site from Git"
4. Connect your GitHub repository
5. Deploy settings:
   - **Build command**: (leave empty)
   - **Publish directory**: (leave empty or use `/`)
6. Click "Deploy site"

Netlify will automatically redeploy when you push to GitHub!

## Future Enhancements

Potential features based on real-world usage:
- Grid snapping toggle
- Undo/redo system
- Layer management (z-ordering)
- Zoom/pan controls
- Asset library panel with thumbnails
- Multiple export format templates
- Copy/paste objects
- Path waypoint editor
- Collision shape visualization

## Documentation

This project is **epically documented** with AI-first documentation. Every line is explained, every decision is justified, every workflow is documented.

### 📚 Complete Documentation Index

#### For AI Assistants (Start Here!)
- **[AI_CONTEXT.md](docs/ai/AI_CONTEXT.md)** - Complete AI orientation (580 lines)
  - Project philosophy and MVP principles
  - Current state and capabilities
  - Data structures and formats
  - Quick start guide
  - Communication guidelines
  
- **[DAILY_UPDATE_CHECKLIST.md](docs/ai/DAILY_UPDATE_CHECKLIST.md)** - Maintenance protocol
  - Daily update tasks
  - Documentation sync checklist
  - Quality assurance steps

#### Technical Documentation
- **[ARCHITECTURE.md](docs/technical/ARCHITECTURE.md)** - System design (710 lines)
  - High-level architecture diagrams
  - Component overview
  - Data flow and state management
  - Rendering pipeline
  - Event system
  - Design decisions and rationale
  
- **[API_REFERENCE.md](docs/technical/API_REFERENCE.md)** - Complete code docs (1150 lines)
  - GameEditor class documentation
  - Every method with parameters and returns
  - Code examples and usage patterns
  - Data structure definitions
  - Performance notes

#### Workflow Guides
- **[ADDING_FEATURES.md](docs/workflows/ADDING_FEATURES.md)** - Feature implementation (640 lines)
  - Step-by-step feature addition workflow
  - Three complete examples (grid snapping, undo/redo, layers)
  - Code style guidelines
  - Common pitfalls and prevention
  - Testing checklist
  
- **[TESTING_PROTOCOL.md](docs/workflows/TESTING_PROTOCOL.md)** - QA checklist (330 lines)
  - 35-step critical path test
  - Keyboard shortcuts verification
  - Browser compatibility matrix
  - Edge case scenarios
  - Performance benchmarks
  
- **[DEBUGGING_GUIDE.md](docs/workflows/DEBUGGING_GUIDE.md)** - Troubleshooting (460 lines)
  - Browser DevTools guide
  - Common issues with solutions
  - Error message reference
  - Debugging workflow
  - Console tricks and techniques

#### General Documentation
- **[CHANGELOG.md](docs/CHANGELOG.md)** - Version history
  - Semantic versioning
  - Complete feature list
  - Known limitations
  - Design decisions
  
- **[TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** - Known issues
  - Quick fixes
  - Browser-specific issues
  - Performance optimization
  - FAQ

#### Historical Documentation
- **[FELLOWSHIP_GUIDE.md](FELLOWSHIP_GUIDE.md)** - D&D persona system
  - Five character perspectives
  - Party dynamics
  - Sample dialogue
  
- **[AI-ASSISTANT-CHECKLIST.md](AI-ASSISTANT-CHECKLIST.md)** - Quick reference
  - Context loading protocol
  - Party member quick reference
  - Workflow guidance

### 📊 Documentation Stats

- **Total Documentation**: 4,900+ lines
- **Code**: 1,050 lines (index.html + style.css + editor.js)
- **Docs-to-Code Ratio**: 4.7:1
- **Files Created**: 15+ documentation files
- **Cross-References**: Extensively linked
- **Last Updated**: December 11, 2025

### 🎯 Where to Start

**If you're an AI assistant:**
1. Read [AI_CONTEXT.md](docs/ai/AI_CONTEXT.md) first (12 min)
2. Skim [ARCHITECTURE.md](docs/technical/ARCHITECTURE.md) (15 min)
3. Reference [API_REFERENCE.md](docs/technical/API_REFERENCE.md) as needed

**If you're a developer:**
1. Read this README
2. Open `index.html` in browser
3. Read [ARCHITECTURE.md](docs/technical/ARCHITECTURE.md) for design
4. Reference [API_REFERENCE.md](docs/technical/API_REFERENCE.md) for code

**If you're debugging:**
1. Check [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) first
2. Follow [DEBUGGING_GUIDE.md](docs/workflows/DEBUGGING_GUIDE.md)
3. Check browser console (F12)

**If you're adding features:**
1. Read [ADDING_FEATURES.md](docs/workflows/ADDING_FEATURES.md)
2. Follow the workflow
3. Update documentation
4. Run [TESTING_PROTOCOL.md](docs/workflows/TESTING_PROTOCOL.md)

---

## License

MIT License - Feel free to use for any project!

## Created With

Built by AI (Claude Sonnet 4.5) with the D&D Fellowship Party:
- **Shadowstep** (Silk) - Marketing & Strategy
- **Skytalon** (Kael) - UX Design
- **Ironpaw** (Bjorn) - Technical Systems
- **Sage** (Lyra) - Game Design
- **The Dungeon Master** - Orchestration

*"Don't build the Death Star when you need a speeder bike."* - The Party

---

## Project Philosophy

This project was born from rejecting **5,000+ lines of over-engineered specifications** in favor of a **650-line MVP**. We embrace:

- **Simplicity over features**
- **Real usage over imagined requirements**
- **Documentation as first-class citizen**
- **AI-first development workflow**

The result: A fully functional game level editor built in hours, not months, with documentation more comprehensive than most enterprise applications.
