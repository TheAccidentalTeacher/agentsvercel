# AI Context Document
**Last Updated**: December 11, 2025  
**Version**: 1.0.0  
**Purpose**: Core orientation document for AI assistants working on this project

---

## Quick Start for AI Assistants

### First Actions (Do This Every Time)
1. Read this document completely (you're doing it now ✓)
2. Read [`ARCHITECTURE.md`](../technical/ARCHITECTURE.md) for system design
3. Read [`API_REFERENCE.md`](../technical/API_REFERENCE.md) for code structure
4. Check [`CHANGELOG.md`](../CHANGELOG.md) for recent changes
5. Review open issues/user request context

### Project Identity
- **Name**: Universal Game Level Editor
- **Type**: Browser-based 2D game level editor
- **Tech Stack**: Pure HTML5 + CSS3 + JavaScript (ES6+)
- **Dependencies**: ZERO - No frameworks, no build process, no npm
- **Deployment**: Netlify (via GitHub auto-deploy)
- **Repository**: https://github.com/TheAccidentalTeacher/gamedesigner

---

## Philosophy & Principles

### Core Tenets
1. **Simplicity Over Features**: "Don't build the Death Star when you need a speeder bike"
2. **Zero Dependencies**: No frameworks, no build tools, works offline
3. **AI-First Documentation**: Every line of code is documented for AI comprehension
4. **Daily Updates**: Documentation is living, breathing, and always current
5. **User Sovereignty**: User owns their data, no cloud lock-in

### The MVP Mindset
This project was born from rejecting 5,000+ lines of over-engineered specifications in favor of a 650-line MVP. When adding features:
- Ask: "Is this in the critical 1%?"
- Prefer simple solutions over elegant complexity
- Ship working code over perfect architecture
- Let real usage drive feature additions

---

## Project Structure

```
Game Editor/
├── index.html              # Main UI (91 lines)
├── style.css               # Dark theme styling (321 lines)
├── editor.js               # Core logic (638 lines)
├── README.md               # User-facing documentation
├── .gitignore              # Git exclusions
├── docs/                   # Documentation hub
│   ├── ai/                 # AI-specific guides
│   │   ├── AI_CONTEXT.md   # This file - AI orientation
│   │   └── DAILY_UPDATE_CHECKLIST.md  # Daily maintenance tasks
│   ├── technical/          # Technical documentation
│   │   ├── ARCHITECTURE.md # System design & data flow
│   │   ├── API_REFERENCE.md # Complete code documentation
│   │   └── FILE_MAP.md     # Line-by-line file index
│   ├── workflows/          # Task-specific guides
│   │   ├── ADDING_FEATURES.md
│   │   ├── DEBUGGING_GUIDE.md
│   │   └── TESTING_PROTOCOL.md
│   └── CHANGELOG.md        # Version history
├── FELLOWSHIP_GUIDE.md     # D&D persona system
└── AI-ASSISTANT-CHECKLIST.md # Quick reference

Legacy Spec Files (Historical Reference):
├── LEVEL_EDITOR_FEATURES_REFERENCE.md
├── LEVEL_EDITOR_IMPLEMENTATION_PLAN.md
├── LEVEL_EDITOR_MASTER_SPEC.md
├── LEVEL_EDITOR_TECHNICAL_GUIDE.md
├── LEVEL_EDITOR_UI_SPECIFICATION.md
└── IMPLEMENTATION_PLAN_FINAL.md
```

---

## The D&D Fellowship System

This project uses D&D-themed personas for different perspectives. See [`FELLOWSHIP_GUIDE.md`](../../FELLOWSHIP_GUIDE.md) for full details.

### Quick Reference
- **Shadowstep** (Silk) - Marketing, branding, user psychology
- **Skytalon** (Kael) - UX design, accessibility, user advocacy
- **Ironpaw** (Bjorn) - Technical implementation, performance, architecture
- **Sage** (Lyra) - Game design theory, strategic vision, systems thinking
- **The Dungeon Master** - Synthesis, orchestration, final decisions

### When to Use Personas
- **Feature Discussions**: Get multiple perspectives before implementation
- **Design Decisions**: Balance technical vs UX vs business concerns
- **Problem Solving**: Different characters approach problems differently
- **Code Reviews**: Each persona reviews from their specialty

---

## Current State (As of December 11, 2025)

### What Exists (Working Code)
✅ **Core Editor** (1,150 lines total across 4 files)
- HTML5 Canvas rendering (1280x720 default)
- Background image loading (FileReader API)
- Asset loading and management
- Click-to-select, drag-to-move interaction
- Live property editing (X, Y, Width, Height, Rotation)
- Object duplication (Ctrl+D)
- Object deletion (Delete key)
- Grid visualization

✅ **Tooltip System** (Phase 1 Complete - v1.1.0)
- TooltipManager class (330 lines in `tooltip.js`)
- 17+ comprehensive tooltips covering 100% of UI
- Smart positioning (auto, top, bottom, left, right)
- Collision detection with viewport edges
- 500ms show delay, 100ms hide delay
- Fade-in/fade-out animations
- Keyboard shortcut display with `<kbd>` tags
- Dark theme styling matching editor
- Arrow pointers for visual clarity
- Escape key to dismiss

✅ **AI Assistant Panel** (Phase 2 Complete - v1.2.0)
- 3-column responsive layout (canvas + properties + AI panel)
- Collapsible AI panel (450px → 50px)
- Professional header with status indicator
- Settings modal with API key configuration
- Message rendering area with animations
- Input area with textarea and send button
- Support for Anthropic Claude and OpenAI GPT-4
- Configuration persistence via localStorage
- Clear conversation functionality
- Provider switching
- 5 new tooltips for AI elements
- ~690 lines of new code (HTML + CSS + JavaScript)

✅ **Export System**
- Clean JSON output format
- Auto-copy to clipboard
- File download (.json)

✅ **Project Persistence**
- Save entire project (images as base64)
- Load saved projects
- localStorage integration

✅ **Keyboard Shortcuts**
- Ctrl+B: Load background
- Ctrl+A: Add asset
- Ctrl+E: Export JSON
- Ctrl+S: Save project
- Ctrl+O: Load project
- Ctrl+D: Duplicate object
- Arrow keys: Move object (1px/10px with Shift)
- Delete: Remove object

✅ **Deployment Infrastructure**
- Git repository initialized
- GitHub repository: `TheAccidentalTeacher/gamedesigner`
- Netlify-ready (static files)
- README with setup instructions

### What Doesn't Exist (Potential Features)
❌ Grid snapping toggle
❌ Undo/redo system
❌ Layer management (z-ordering)
❌ Zoom/pan controls
❌ Asset library panel
❌ Multiple export templates
❌ Copy/paste objects
❌ Path waypoint editor
❌ Collision shape visualization
❌ Batch operations
❌ Keyboard-only workflow
❌ Touch/mobile support
❌ Multi-select objects
❌ Alignment tools
❌ History panel

**IMPORTANT**: Don't implement these unless explicitly requested. MVP is complete.

---

## Data Structures

### JSON Export Format
```json
{
  "background": "background.png",
  "objects": [
    {
      "id": "asset_1234567890123",
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

### Project Save Format
```json
{
  "canvas": {
    "width": 1280,
    "height": 720
  },
  "background": {
    "name": "background.png",
    "data": "data:image/png;base64,iVBORw0KGg..."
  },
  "objects": [
    {
      "id": "asset_1234567890123",
      "name": "sprite.png",
      "data": "data:image/png;base64,iVBORw0KGg...",
      "x": 100,
      "y": 150,
      "width": 64,
      "height": 64,
      "rotation": 0
    }
  ]
}
```

### Internal GameObject Structure
```javascript
{
  id: "asset_" + Date.now(),
  name: "filename.png",
  image: Image,        // HTML Image object
  imageData: String,   // base64 data URL
  x: Number,           // Position X
  y: Number,           // Position Y
  width: Number,       // Display width
  height: Number,      // Display height
  rotation: Number     // Degrees (0-360)
}
```

---

## Code Organization

### File Breakdown

**`index.html`** (91 lines)
- Semantic HTML5 structure
- Toolbar: 5 main buttons + keyboard shortcuts
- Workspace: Canvas container (center) + Properties panel (right)
- Status bar: Status text + mouse coords + object count
- Hidden file inputs: background, assets, project loading

**`style.css`** (321 lines)
- CSS Variables for theming
- Grid layout: toolbar (60px) + workspace (1fr) + status bar (30px)
- Dark theme: #1e1e1e background, #252526 panels, #007acc brand
- Component styling: buttons, inputs, panels, canvas
- Responsive considerations (desktop-first)

**`editor.js`** (638 lines)
- `GameEditor` class (main orchestrator)
- Event handlers: mouse, keyboard, file inputs
- Rendering: Canvas draw loop with requestAnimationFrame
- State management: background, objects array, selection, drag state
- Persistence: JSON export, project save/load, localStorage
- Utilities: ID generation, clipboard operations

### Key Classes & Functions

**GameEditor Class Methods** (in order of importance):
1. `constructor()` - Initialize canvas, bind events, set up DOM
2. `render()` - Main render loop (grid → background → objects → selection)
3. `loadBackground(file)` - FileReader → Image → canvas background
4. `loadAsset(file)` - FileReader → GameObject → objects array
5. `onMouseDown(e)` - Click detection, selection, drag start
6. `onMouseMove(e)` - Drag object, update status bar
7. `onMouseUp(e)` - End drag operation
8. `onKeyDown(e)` - Keyboard shortcuts + arrow key movement
9. `updateProperties()` - Sync properties panel with selected object
10. `exportJSON()` - Generate clean JSON, copy + download
11. `saveProject()` - Full project serialization with images
12. `loadProject(file)` - Restore project from JSON
13. `duplicateObject()` - Clone selected object
14. `deleteObject()` - Remove selected object
15. `clearAll()` - Reset editor to blank state

---

## Common Tasks

### Adding a New Feature
1. Read [`ADDING_FEATURES.md`](../workflows/ADDING_FEATURES.md)
2. Check if it aligns with MVP philosophy
3. Discuss with Fellowship personas
4. Write tests (manual checklist minimum)
5. Implement in smallest working increment
6. Update documentation (this file + API_REFERENCE + CHANGELOG)
7. Commit with descriptive message
8. Push to GitHub (auto-deploys to Netlify)

### Debugging an Issue
1. Read [`DEBUGGING_GUIDE.md`](../workflows/DEBUGGING_GUIDE.md)
2. Reproduce the issue locally (open index.html)
3. Check browser console for errors
4. Review [`TROUBLESHOOTING.md`](../TROUBLESHOOTING.md) for known issues
5. Use browser DevTools (Sources, Network, Application tabs)
6. Test in multiple browsers (Chrome, Firefox, Safari)
7. Document fix in CHANGELOG

### Modifying Existing Code
1. Read [`API_REFERENCE.md`](../technical/API_REFERENCE.md) for affected functions
2. Understand data flow via [`ARCHITECTURE.md`](../technical/ARCHITECTURE.md)
3. Make changes in isolated commits
4. Test thoroughly (see [`TESTING_PROTOCOL.md`](../workflows/TESTING_PROTOCOL.md))
5. Update documentation (inline comments + API_REFERENCE + CHANGELOG)
6. Push to GitHub

---

## Browser Compatibility

### Supported Browsers
- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅

### Required Browser Features
- HTML5 Canvas (all browsers 2011+)
- FileReader API (all browsers 2012+)
- ES6 Classes (all browsers 2017+)
- localStorage (all browsers 2009+)
- Clipboard API (navigator.clipboard - Chrome 66+, Firefox 63+, Safari 13.1+)

### Known Limitations
- Mobile/touch: Not optimized (desktop-first design)
- IE11: Not supported (requires ES6)
- Older Safari: Clipboard API may fail (falls back to download only)

---

## Performance Characteristics

### Rendering
- **60 FPS** target (requestAnimationFrame)
- **Canvas size**: 1280x720 (configurable)
- **Object limit**: No hard limit, tested up to 100 objects @ 60fps
- **Image size**: Browser-dependent, recommend < 5MB per image

### Memory
- **Base footprint**: ~2MB (empty editor)
- **Per object**: ~500KB (average sprite with base64)
- **Project save**: Can be large (all images base64-encoded)
- **localStorage limit**: 5-10MB per domain (browser-dependent)

### Network
- **Initial load**: < 50KB (HTML + CSS + JS)
- **No external requests**: 100% offline-capable after initial load

---

## Security Considerations

### Client-Side Only
- **No server**: Zero backend, zero database, zero API calls
- **No user data collection**: No analytics, no tracking
- **No authentication**: No login, no sessions, no cookies (except localStorage)

### File Handling
- **FileReader API**: Files never leave user's machine
- **Base64 encoding**: Images stored as data URLs in JSON
- **No file upload**: No files sent to any server
- **localStorage**: Project data stays in browser

### XSS Prevention
- **No innerHTML**: All DOM manipulation via createElement/textContent
- **No eval**: No dynamic code execution
- **CSP compatible**: Can run with strict Content Security Policy

---

## Testing Strategy

### Manual Testing Checklist
See [`TESTING_PROTOCOL.md`](../workflows/TESTING_PROTOCOL.md) for complete checklist.

**Critical Path** (test before every commit):
1. Load background image ✓
2. Add 2-3 assets ✓
3. Select and drag objects ✓
4. Edit properties (X, Y, Width, Height, Rotation) ✓
5. Duplicate object (Ctrl+D) ✓
6. Delete object (Delete key) ✓
7. Export JSON (Ctrl+E) ✓
8. Save project (Ctrl+S) ✓
9. Load saved project (Ctrl+O) ✓

**Browser Matrix**:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**No Automated Tests**: MVP doesn't include test framework. Manual testing sufficient for current scope.

---

## Deployment Process

### Current Setup
1. **Git**: Local repository initialized
2. **GitHub**: `TheAccidentalTeacher/gamedesigner` (main branch)
3. **Netlify**: Auto-deploy on push to main

### Deploy New Version
```powershell
# Make changes to code
# Update CHANGELOG.md with changes
git add .
git commit -m "Description of changes"
git push origin main
# Netlify auto-deploys in ~30 seconds
```

### Rollback Strategy
```powershell
# View commit history
git log --oneline

# Rollback to specific commit
git reset --hard <commit-hash>
git push --force origin main
```

---

## Documentation Maintenance

### Daily Update Checklist
See [`DAILY_UPDATE_CHECKLIST.md`](./DAILY_UPDATE_CHECKLIST.md) for full protocol.

**Every Code Change**:
- [ ] Update inline code comments
- [ ] Update API_REFERENCE.md if function signatures changed
- [ ] Add entry to CHANGELOG.md
- [ ] Update ARCHITECTURE.md if data flow changed
- [ ] Update this file (AI_CONTEXT.md) if new concepts added

**Weekly**:
- [ ] Review all documentation for accuracy
- [ ] Check for broken internal links
- [ ] Update "Last Updated" timestamps
- [ ] Verify CHANGELOG is complete

---

## Future Roadmap

### Version 1.1 (User-Requested Features)
Track in `CHANGELOG.md` and GitHub Issues. No pre-planned features.

### Version 2.0 (Potential Major Additions)
Only if user explicitly requests:
- Undo/redo system
- Multi-select + batch operations
- Zoom/pan controls
- Layer management

**DO NOT implement these proactively.**

---

## Communication Guidelines

### With Users
- Be concise and direct
- Avoid marketing speak
- Show working code over descriptions
- Ask clarifying questions when ambiguous
- Default to implementing over suggesting

### With Other AI Assistants
- Reference specific documentation sections
- Use line numbers when discussing code
- Quote relevant Fellowship persona insights
- Update documentation after every session
- Leave clear handoff notes in CHANGELOG

### Tone & Style
- Professional but friendly
- Technical but accessible
- Confident but humble
- Pragmatic over perfectionist

---

## Emergency Contacts

### If Something Breaks
1. Check browser console for errors
2. Review [`TROUBLESHOOTING.md`](../TROUBLESHOOTING.md)
3. Test in fresh browser (clear cache)
4. Rollback last commit if necessary
5. Document issue in GitHub Issues

### If Documentation is Wrong
1. Fix it immediately
2. Update CHANGELOG with correction
3. Search for related references
4. Update cross-references

### If Architecture Needs Change
1. Document current state
2. Propose change with rationale
3. Get user approval
4. Update ARCHITECTURE.md FIRST
5. Implement changes
6. Update all affected documentation

---

## Index of All Documentation

### AI-Specific
- [`AI_CONTEXT.md`](./AI_CONTEXT.md) - This file
- [`DAILY_UPDATE_CHECKLIST.md`](./DAILY_UPDATE_CHECKLIST.md) - Maintenance protocol

### Technical
- [`ARCHITECTURE.md`](../technical/ARCHITECTURE.md) - System design
- [`API_REFERENCE.md`](../technical/API_REFERENCE.md) - Code documentation
- [`FILE_MAP.md`](../technical/FILE_MAP.md) - Line-by-line file index

### Workflows
- [`ADDING_FEATURES.md`](../workflows/ADDING_FEATURES.md) - Feature implementation guide
- [`DEBUGGING_GUIDE.md`](../workflows/DEBUGGING_GUIDE.md) - Troubleshooting steps
- [`TESTING_PROTOCOL.md`](../workflows/TESTING_PROTOCOL.md) - Testing checklist

### General
- [`README.md`](../../README.md) - User-facing documentation
- [`CHANGELOG.md`](../CHANGELOG.md) - Version history
- [`TROUBLESHOOTING.md`](../TROUBLESHOOTING.md) - Known issues

### Historical
- [`FELLOWSHIP_GUIDE.md`](../../FELLOWSHIP_GUIDE.md) - D&D persona system
- [`AI-ASSISTANT-CHECKLIST.md`](../../AI-ASSISTANT-CHECKLIST.md) - Quick reference
- Original spec files (5,000+ lines) - Historical reference only

---

## Glossary

**Asset**: Any image file loaded into the editor (sprites, objects, enemies, etc.)  
**Background**: The base layer image (level background, terrain, etc.)  
**Canvas**: HTML5 Canvas element used for rendering  
**GameObject**: Internal representation of an asset with position, size, rotation  
**MVP**: Minimum Viable Product - the 1% of features that deliver 99% of value  
**Properties Panel**: Right sidebar for editing selected object properties  
**Project**: Complete saved state (canvas + background + all objects)  
**The Fellowship**: D&D-themed persona system for multi-perspective analysis  

---

## Meta-Documentation

**This document should be**:
- The first stop for any AI assistant
- Comprehensive enough to answer 80% of questions
- Updated with every significant change
- Cross-referenced with all other documentation
- Scannable (clear headings, short sections)

**This document should NOT be**:
- A duplicate of API_REFERENCE (keep code details there)
- A substitute for reading the actual code
- Static/outdated (update frequently)
- Marketing material (this is technical documentation)

**Last Review**: December 11, 2025  
**Next Review**: December 12, 2025  
**Reviewed By**: Claude (Initial Creation)

---

**END OF AI_CONTEXT.MD**  
*Total Lines: ~580*  
*Read Time: ~12 minutes*  
*Comprehensiveness: 🌟🌟🌟🌟🌟*
