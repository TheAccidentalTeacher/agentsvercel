# Universal Game Level Editor

A lightweight, browser-based 2D game level editor that works with any game. Built with pure HTML5, CSS3, and JavaScript - no frameworks, no build process, no dependencies.

## Features

- **Load Background Images**: Set your level background from any image file
- **Add Game Assets**: Browse and add multiple sprites/objects to your scene
- **Drag & Drop Positioning**: Click and drag objects to arrange your level
- **Live Property Editing**: Adjust position, size, and rotation in real-time
- **Object Duplication**: Quickly copy objects with Ctrl+D
- **JSON Export**: Clean, game-ready JSON with clipboard copy + file download
- **Project Save/Load**: Save entire projects (including images) for later editing
- **Keyboard Shortcuts**: Fast workflow with built-in shortcuts
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

## License

MIT License - Feel free to use for any project!

## Created With

Built by AI (Claude) with the D&D Fellowship Party:
- **Shadowstep** (Silk) - Marketing & Strategy
- **Skytalon** (Kael) - UX Design
- **Ironpaw** (Bjorn) - Technical Systems
- **Sage** (Lyra) - Game Design
- **The Dungeon Master** - Orchestration

*"Don't build the Death Star when you need a speeder bike."* - The Party
