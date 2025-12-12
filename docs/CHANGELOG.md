# Changelog
All notable changes to the Universal Game Level Editor will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]
### Planned
- Phase 3: AI API Integration (Anthropic/OpenAI)
- Phase 4: AI Tool Calling System
- Phase 5-8: Advanced AI features
- See MASTER_ROADMAP.md for complete implementation plan

---

## [1.2.0] - 2025-12-11

### ✨ Phase 2 Complete - AI Chat Panel UI

**Goal**: Complete AI assistant interface ready for API integration

### Added - AI Panel System
- **3-Column Responsive Layout**
  - Canvas (fluid) + Properties (320px) + AI Panel (450px)
  - Smooth grid transitions
  - Collapsible AI panel (50px when collapsed)

- **AI Assistant Panel**
  - Professional header with robot icon 🤖
  - Status indicator (Not Configured / Ready)
  - Three action buttons: Settings ⚙️, Clear 🗑️, Collapse ◀
  - Welcome message with feature overview
  - Scrollable message area with fade-in animations
  - Smart input area with textarea and Send button
  - Disabled state when not configured

- **AI Settings Modal**
  - Professional modal with backdrop blur
  - Provider selection (Anthropic Claude / OpenAI GPT-4)
  - API key inputs (password fields with toggle)
  - Provider-specific help links
  - Auto-analyze checkbox for proactive suggestions
  - Privacy info box explaining local storage
  - Save/Cancel buttons with validation

- **Message Styling**
  - System messages: Blue left border (#007acc)
  - User messages: Bright blue border (#0098ff), right-aligned
  - Assistant messages: Green border (#28a745), left-aligned
  - Thinking indicator: Orange border with pulse animation
  - Timestamps, paragraphs, lists supported

- **Interactive Features**
  - Collapse/expand panel with smooth animation
  - Settings modal with overlay and slide-in animation
  - Configuration persistence via localStorage
  - Clear conversation with confirmation
  - Provider switching (shows/hides relevant API key fields)
  - Auto-enable input when API key configured
  - Enter to send, Shift+Enter for new line

- **Visual Polish**
  - Dark theme consistency (#1e1e1e, #252526)
  - Smooth transitions (0.3s ease)
  - Fade-in animations for messages
  - Pulse animation for thinking indicator
  - Modal slide-in animation
  - Hover states on all interactive elements

### Technical Implementation
- **HTML Changes**:
  - Added AI panel structure (50+ lines)
  - Added settings modal (60+ lines)
  
- **CSS Changes**:
  - Added 400+ lines of AI panel styling
  - Modal system (overlay, content, animations)
  - Form elements styling
  - Message type variations
  - Responsive button states

- **JavaScript Changes**:
  - `initializeAIPanel()` method
  - `setupAIPanelListeners()` method (70+ lines)
  - `openAISettings()`, `closeAISettings()` methods
  - `switchAIProvider()` method
  - `loadAIConfig()`, `saveAIConfig()` methods
  - `clearAIConversation()` method
  - localStorage integration for config persistence

- **New Tooltips**:
  - 5 AI panel tooltips (toggle, settings, clear, input, send)
  - Integrated with existing tooltip system

### Code Statistics
- HTML additions: ~110 lines
- CSS additions: ~400 lines
- JavaScript additions: ~180 lines
- Total Phase 2: ~690 lines

### UX Highlights
- VSCode Copilot-style panel design
- Fully functional UI (ready for Phase 3 API integration)
- Configuration persists across sessions
- Clear visual feedback for all states
- Professional animations and transitions
- Accessible keyboard navigation

---

## [1.1.0] - 2025-12-11

### ✨ Phase 1 Complete - Universal Tooltips

**Goal**: 100% tooltip coverage on every interactive UI element

### Added - Tooltip System
- **TooltipManager Class** (`tooltip.js`, 330 lines)
  - Intelligent positioning system (auto, top, bottom, left, right)
  - Smart collision detection with viewport edges
  - 500ms show delay for non-intrusive UX
  - 100ms hide delay for smooth transitions
  - Fade-in/fade-out animations (150ms)
  - Arrow pointers for visual clarity
  - Support for `<kbd>` tags for keyboard shortcuts
  - Escape key to dismiss tooltips
  - Scroll/resize event handling

- **17+ Comprehensive Tooltips**
  - **Toolbar buttons (6)**: Load Background, Add Asset, Export JSON, Save Project, Load Project, Clear All
  - **Canvas (1)**: Complete interaction guide (click, drag, arrow keys, Shift+Arrow, Delete)
  - **Status bar (2)**: Mouse coordinates, Object count
  - **Property inputs (6)**: Name, X, Y, Width, Height, Rotation
  - **Property buttons (2)**: Duplicate, Delete

- **Tooltip Content**
  - Clear descriptions of functionality
  - Keyboard shortcuts displayed in monospace `<kbd>` tags
  - Important warnings highlighted with `<strong>` tags
  - Multi-line explanations for complex features
  - Context-aware positioning

- **CSS Styling**
  - Dark theme (#2d2d30 background)
  - Subtle border (#454545)
  - Drop shadow for depth
  - Arrow indicators matching position
  - Maximum width 320px with word wrapping
  - Smooth opacity transitions

### Technical Changes
- **New Files**:
  - `tooltip.js` - TooltipManager class implementation
  
- **Modified Files**:
  - `index.html` - Added tooltip.js script tag
  - `style.css` - Added 94 lines of tooltip CSS
  - `editor.js` - Added TOOLTIPS object, PROPERTY_TOOLTIPS object, initializeTooltips() method, registerPropertyTooltips() method

- **Code Statistics**:
  - Total tooltip system: ~500 lines (JavaScript + CSS + definitions)
  - Tooltips registered: 17+ (static) + dynamic property tooltips

### UX Improvements
- No more guessing what buttons do
- Keyboard shortcuts discoverable via hover
- Complex features explained in context
- Professional polish matching VS Code style

---

## [1.0.0] - 2025-12-11

### 🎉 Initial Release - MVP Complete

**Philosophy**: "Don't build the Death Star when you need a speeder bike"

This release represents the complete MVP (Minimum Viable Product) - built in hours, not months. Born from rejecting 5,000+ lines of over-engineered specifications in favor of a lean 650-line implementation.

### Added - Core Editor
- **Canvas Rendering** (1280x720 default)
  - HTML5 Canvas with 2D context
  - 60 FPS render loop via requestAnimationFrame
  - Dark theme (#1e1e1e) consistent with VS Code

- **Background Management**
  - Load background images via file picker
  - Stretch to fit canvas
  - Grid visualization when no background
  - FileReader API for client-side loading

- **Asset Management**
  - Add multiple assets via file picker
  - Load images as game objects
  - Center placement on initial load
  - Unique ID generation (timestamp + random)
  - Native dimensions preserved

- **Object Interaction**
  - Click to select objects
  - Drag to move objects
  - Green selection highlight with resize handles
  - Reverse-order selection (top objects first)
  - Smooth dragging with offset calculation

- **Properties Panel**
  - Live property editing (X, Y, Width, Height, Rotation)
  - Name editing
  - Duplicate button
  - Delete button
  - Real-time updates during drag

- **Keyboard Shortcuts**
  - `Ctrl+B`: Load background
  - `Ctrl+A`: Add asset
  - `Ctrl+E`: Export JSON
  - `Ctrl+S`: Save project
  - `Ctrl+O`: Load project
  - `Ctrl+D`: Duplicate object
  - `Arrow Keys`: Move object (1px)
  - `Shift+Arrows`: Move object (10px)
  - `Delete/Backspace`: Remove object

- **Export System**
  - Clean JSON format for game integration
  - Auto-copy to clipboard
  - File download (.json)
  - Metadata included (editor, version, timestamp)
  - Rounded position values

- **Project Persistence**
  - Save complete project (images as base64)
  - Load saved projects
  - Full state restoration
  - Background + objects preserved

- **UI Components**
  - Toolbar with 6 main buttons
  - Canvas workspace with grid
  - Properties panel (320px wide)
  - Status bar with mouse coordinates
  - Object counter display
  - Hidden file inputs (programmatic triggers)

### Added - Documentation (2025-12-11 Evening)
- **AI-Specific Documentation**
  - `docs/ai/AI_CONTEXT.md` (580 lines) - Complete AI orientation
  - `docs/ai/DAILY_UPDATE_CHECKLIST.md` - Maintenance protocol

- **Technical Documentation**
  - `docs/technical/ARCHITECTURE.md` (710 lines) - System design, data flow
  - `docs/technical/API_REFERENCE.md` (1150 lines) - Complete code docs
  - `docs/technical/FILE_MAP.md` - Line-by-line file index

- **Workflow Guides**
  - `docs/workflows/ADDING_FEATURES.md` (640 lines) - Feature implementation
  - `docs/workflows/TESTING_PROTOCOL.md` (330 lines) - QA checklist
  - `docs/workflows/DEBUGGING_GUIDE.md` (460 lines) - Troubleshooting

- **General Documentation**
  - `docs/CHANGELOG.md` - This file
  - `docs/TROUBLESHOOTING.md` - Known issues reference
  - Updated `README.md` with documentation index

- **Historical Documentation**
  - `FELLOWSHIP_GUIDE.md` - D&D persona system
  - `AI-ASSISTANT-CHECKLIST.md` - Quick reference

- **Legacy Specs** (historical reference only)
  - `LEVEL_EDITOR_FEATURES_REFERENCE.md` (863 lines)
  - `LEVEL_EDITOR_IMPLEMENTATION_PLAN.md` (1611 lines)
  - `LEVEL_EDITOR_MASTER_SPEC.md` (1328 lines)
  - `LEVEL_EDITOR_TECHNICAL_GUIDE.md` (1218 lines)
  - `LEVEL_EDITOR_UI_SPECIFICATION.md` (1028 lines)

### Added - Deployment
- **Git Repository**
  - Initialized with .gitignore
  - Initial commit with all files

- **GitHub Integration**
  - Repository: `TheAccidentalTeacher/gamedesigner`
  - Main branch deployed

- **Netlify Ready**
  - Static file structure
  - Zero build process
  - Auto-deploy on push
  - ~30 second deployment time

### Technical Details
- **Stack**: Pure HTML5 + CSS3 + JavaScript (ES6+)
- **Dependencies**: ZERO (no frameworks, no npm, no build tools)
- **File Count**: 3 core files (index.html, style.css, editor.js)
- **Total Lines**: 1,050 lines (91 + 321 + 638)
- **Browser Support**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Performance**: 60 FPS with 100+ objects

### Known Limitations (Intentional MVP Decisions)
- No undo/redo (future feature)
- No grid snapping (future feature)
- No layer management (future feature)
- No zoom/pan (future feature)
- No touch/mobile support (desktop-first)
- No multi-select (single selection only)
- No collision detection on rotated objects (AABB only)
- No automated tests (manual QA sufficient for MVP)

### Design Decisions
- **Monolithic Class**: Single GameEditor class (simple mental model)
- **No Framework**: Zero dependencies, faster load, easier maintenance
- **Canvas Over SVG**: Better performance for many objects
- **Data URLs**: Complete offline capability, no server needed
- **Full Redraw**: Simple and reliable, fast enough for use case

### Browser APIs Used
- HTML5 Canvas (2D Context)
- FileReader API
- Clipboard API (with fallback)
- Blob API
- requestAnimationFrame
- localStorage (for future use)

### File Structure
```
Game Editor/
├── index.html (91 lines)
├── style.css (321 lines)
├── editor.js (638 lines)
├── README.md
├── .gitignore
├── docs/ (documentation hub)
│   ├── ai/ (AI-specific)
│   ├── technical/ (architecture + API)
│   ├── workflows/ (task guides)
│   └── CHANGELOG.md (this file)
└── [legacy spec files]
```

### Contributors
- **Built By**: AI (Claude Sonnet 4.5)
- **Guided By**: The D&D Fellowship Party
  - Shadowstep (Silk) - Marketing & Strategy
  - Skytalon (Kael) - UX Design
  - Ironpaw (Bjorn) - Technical Systems
  - Sage (Lyra) - Game Design
  - The Dungeon Master - Orchestration

### Special Thanks
- User for embracing the MVP philosophy
- The Fellowship for brutal honesty about over-engineering
- The 5,000 lines of rejected specs (taught us what NOT to build)

---

## How to Read This Changelog

### Categories
- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security fixes

### Semantic Versioning
Given a version number MAJOR.MINOR.PATCH:
- **MAJOR**: Incompatible API changes
- **MINOR**: Backwards-compatible new features
- **PATCH**: Backwards-compatible bug fixes

Current version: **1.0.0** (First stable release)

### Update Frequency
This changelog is updated:
- **Immediately** after significant changes
- **Daily** during active development
- **Weekly** during maintenance mode

### Cross-References
- See [`AI_CONTEXT.md`](ai/AI_CONTEXT.md) for current state
- See [`ARCHITECTURE.md`](technical/ARCHITECTURE.md) for design changes
- See [`API_REFERENCE.md`](technical/API_REFERENCE.md) for code changes

---

## Version History

### [1.0.0] - 2025-12-11
- Initial MVP release
- Complete documentation system
- GitHub + Netlify deployment

---

## Future Versions (Planned)

### [1.1.0] - TBD
**User-Requested Features Only**
- Features will be added based on real usage feedback
- No pre-planned roadmap (MVP philosophy)
- Check GitHub Issues for feature requests

### [2.0.0] - TBD
**Major Features** (if explicitly requested):
- Undo/redo system
- Layer management
- Zoom/pan controls
- Grid snapping
- Multi-select

**Not implementing unless user specifically requests.**

---

## Documentation Updates

This changelog tracks code changes. For documentation changes, see:
- **Daily**: Check git commit messages
- **Weekly**: Review [`AI_CONTEXT.md`](ai/AI_CONTEXT.md) "Last Updated"
- **Monthly**: Full documentation audit

---

## Maintenance Notes

**For AI Assistants**:
- Update this file immediately after ANY code change
- Use format: `### [Type] - [Description]`
- Link to relevant documentation
- Include code examples when helpful
- Update "Last Updated" timestamp

**For Users**:
- Check this file to see what's new
- Compare versions to understand changes
- Use as reference for upgrade decisions

---

**Last Updated**: December 11, 2025  
**Next Review**: December 12, 2025  
**Maintained By**: AI Assistants (see FELLOWSHIP_GUIDE.md)
