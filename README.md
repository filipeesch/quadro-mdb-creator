# Quadro MDB Editor

A browser-based 3D pipe structure editor built with Three.js for creating and manipulating modular pipe networks using a junction-based grid system.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Three.js](https://img.shields.io/badge/Three.js-0.160.0-green.svg)

## 🚀 Features

### 📐 Core Functionality

#### Junction-Based System
- **Smart Junctions**: Black spheres that automatically adjust size based on connected pipes
- **6-Direction Star Pattern**: Each junction can connect in ±X, ±Y, ±Z directions
- **Automatic Updates**: Junctions created/removed dynamically as pipes are added/removed
- **Position Grid**: Unit grid with 1-unit spacing between junctions

#### Pipe Creation
- **Click-to-Create**: Click on pink potential pipes to add them
- **Click-to-Remove**: Click on gray pipes to remove them
- **Automatic Cleanup**: Orphaned junctions automatically removed when last pipe is deleted
- **Real-time Updates**: Structure updates immediately on every change

### 🎨 Visual Modes

#### Creation Mode (✏️)
- **Toggle On/Off**: Enable/disable editing capabilities
- **Hover-to-Show**: Pink potential pipes only appear when hovering over junctions
- **Smart Visibility**: Pink lines disappear when not needed for clean viewing
- **Default State**: Enabled by default for immediate editing

#### Layer-by-Layer View (📊)
- **Layer Analysis**: Automatically detects all horizontal levels (Y coordinates)
- **Layer Composition**: Each layer shows:
  - Horizontal pipes at that level
  - Vertical pipes connecting upward from that level
  - All junctions at both ends
- **Navigation Controls**:
  - Slider for quick layer selection
  - Previous/Next buttons for sequential browsing
  - Real-time layer counter display
- **Transparency Mode**: Non-current layers shown at 15% opacity
- **Current Layer**: Displayed at 100% opacity for clear focus

### 💾 File Operations

#### Save (💾)
- **JSON Export**: Structure saved as JSON file
- **Complete Data**: Includes all junctions and pipes with positions
- **Version Info**: File format version for compatibility
- **Auto-Download**: Browser automatically downloads the file

#### Open (📂)
- **JSON Import**: Load previously saved structures
- **Full Reconstruction**: Rebuilds entire structure from file
- **Clear & Load**: Automatically clears current structure before loading
- **Error Handling**: Validates file format and shows errors

#### Clear All (🗑️)
- **Confirmation Dialog**: Prevents accidental deletion
- **Complete Reset**: Removes all pipes, junctions, and potential pipes
- **Fresh Start**: Returns to initial state with single junction at origin

### 🖱️ Mouse Controls

#### Navigation
- **Middle Mouse Button**: Rotate camera around the structure
- **Right Mouse Button**: Pan camera position
- **Scroll Wheel**: Zoom in/out
- **Left Click**: Add/remove pipes (when in creation mode)

#### Interaction
- **Hover Highlighting**: Visual feedback on interactive elements
- **Cursor Changes**: Pointer cursor indicates clickable objects
- **Smart Raycasting**: Enlarged hit zones for easier clicking
- **Pink Tube Margins**: Semi-transparent clickable areas around potential pipes

### 👆 Touch & Touchpad Support

#### Touchscreen Gestures
- **2-Finger Gestures**:
  - Move together: Rotate camera
  - Pinch in/out: Zoom
- **3-Finger Swipe**: Pan camera position
- **Multi-Touch Prevention**: Disables browser default gestures

#### Touchpad Controls
- **2-Finger Scroll**: Rotate view (same as touchscreen)
- **Pinch Gesture**: Zoom in/out (Ctrl+scroll detection)
- **3-Finger Swipe**: Pan camera
- **Native Support**: Works seamlessly with laptop touchpads

### 🎯 Visual Elements

#### Color Coding
- **Pink Lines/Tubes**: Potential pipes that can be added
- **Gray Cylinders**: Existing pipes in the structure
- **Black Spheres**: Junctions (connection points)
- **Light Gray Grid**: Reference floor grid (20×20 units)

#### Materials & Rendering
- **Phong Shading**: Realistic lighting on pipes and junctions
- **Transparency Support**: All materials support opacity changes
- **Ambient + Directional Lights**: Multiple light sources for depth
- **Anti-aliasing**: Smooth edges on all geometry

## 📁 Project Structure

```
quadro-mdb-editor/
├── index.html          # Main HTML file with UI and styles
├── main.js            # Three.js application logic
├── README.md          # This file
└── .github/
    └── copilot-instructions.md  # AI coding guidelines
```

## 🛠️ Technical Details

### Architecture
- **Single Class Design**: `PipeStructureEditor` manages entire application
- **ES6 Modules**: Modern import/export syntax
- **CDN Dependencies**: Three.js loaded from jsDelivr
- **No Build Process**: Pure ES modules, runs directly in browser

### Data Structures
```javascript
// Junctions Map
junctions: Map<string, {
  mesh: THREE.Mesh,
  position: THREE.Vector3,
  connectedDirections: THREE.Vector3[]
}>

// Pipes Map
pipes: Map<string, THREE.Mesh>

// Potential Pipes Array
potentialPipes: Array<THREE.Line>
```

### Key Systems

#### Position Keys
- Format: `"x,y,z"` (rounded to 2 decimals)
- Normalized pipe keys: Lexicographically ordered for consistency
- Example: `"0.00,0.00,0.00"` or `"0.00,0.00,0.00-1.00,0.00,0.00"`

#### Raycasting
- Line threshold: 0.2 units for easier clicking
- Invisible tube overlays: 0.05 radius cylinders for click detection
- Priority: Pipes → Potential pipes → Junctions

#### Layer Analysis
- Automatic Y-coordinate detection
- Horizontal/vertical pipe classification
- Junction assignment per layer
- Real-time updates on structure changes

## 🎮 Usage Guide

### Getting Started
1. Open `index.html` in a modern web browser
2. Single junction with 6 pink lines appears at origin
3. Hover over the junction to see potential connections
4. Click pink lines to add pipes

### Building a Structure
1. **Enable Creation Mode** (✏️ button - on by default)
2. **Hover over junction** to reveal potential pipes
3. **Click pink line** to add pipe (creates new junction at end)
4. **Continue building** by hovering and clicking
5. **Remove pipes** by clicking on them directly

### Viewing Layers
1. Build structure with multiple Y levels
2. Click **Layer View** (📊) button
3. Use slider or Previous/Next buttons to navigate
4. Current layer shown clearly, others nearly transparent
5. Click button again to exit layer view

### Saving & Loading
1. **Save**: Click 💾 to download JSON file
2. **Open**: Click 📂 to browse and load saved file
3. **Clear**: Click 🗑️ to start fresh (with confirmation)

## 🔧 Configuration

### Adjustable Parameters
Located in `PipeStructureEditor` constructor:

```javascript
pipeLength: 1        // Distance between junctions
pipeRadius: 0.05     // Visual thickness of pipes
junctionRadius: 0.1  // Size of junction spheres
```

### Camera Settings
```javascript
minDistance: 5       // Minimum zoom distance
maxDistance: 50      // Maximum zoom distance
dampingFactor: 0.05  // Camera smoothing
```

## 🌐 Browser Compatibility

### Requirements
- Modern browser with WebGL support
- ES6 module support
- Pointer Events API
- FileReader API for file operations

### Tested Browsers
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+

## 📝 File Format

### JSON Structure
```json
{
  "version": "1.0",
  "junctions": [
    {
      "position": { "x": 0, "y": 0, "z": 0 },
      "connections": 2
    }
  ],
  "pipes": [
    {
      "start": { "x": 0, "y": 0, "z": 0 },
      "end": { "x": 1, "y": 0, "z": 0 }
    }
  ]
}
```

## 🚧 Known Limitations

1. **No Undo/Redo**: Changes are immediate and permanent (until reload)
2. **No Pipe Properties**: All pipes are identical (no diameter/material variations)
3. **No Junction Types**: All junctions are spheres (no T-joints, elbows, etc.)
4. **No Measurements**: No distance or angle display tools
5. **Grid Size Fixed**: Cannot expand beyond initial bounds
6. **No Collision Detection**: Pipes can overlap freely

## 🔮 Future Enhancements

### High Priority
- [ ] Undo/Redo functionality
- [ ] Keyboard shortcuts (Delete, Ctrl+Z, etc.)
- [ ] Grid expansion tool
- [ ] Pipe properties (diameter, material, color)
- [ ] Junction type variations
- [ ] Selection system (multi-select, copy/paste)

### Medium Priority
- [ ] Measurement tools (distance, angles)
- [ ] Snap to grid options (different grid sizes)
- [ ] Export to other formats (OBJ, STL, GLTF)
- [ ] Import from CAD files
- [ ] Named views/camera bookmarks
- [ ] Structure validation/analysis

### Low Priority
- [ ] Annotation system (labels, notes)
- [ ] Material library
- [ ] Lighting customization
- [ ] Background options
- [ ] Performance optimization for large structures
- [ ] Collaborative editing
- [ ] Version history

## 🐛 Bug Reports & Feature Requests

When reporting issues, please include:
- Browser version and OS
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)
- Screenshot or saved structure file

## 📚 Development Notes

### Adding New Features

#### New Interaction Mode
1. Add button to `index.html` sidebar
2. Create toggle function in `PipeStructureEditor`
3. Add event listener in `setupEventListeners()`
4. Implement mode logic with visibility/interaction changes

#### New Geometry Type
1. Create geometry in `createJunction()` or similar method
2. Add material with transparency support
3. Set proper `userData` for raycasting
4. Update `onMouseClick()` for interaction
5. Add to appropriate data structure (Map/Array)

#### New Export Format
1. Create converter function from internal structure
2. Generate appropriate file format
3. Use Blob API for download
4. Add button and event listener

### Code Organization
- **Scene Setup**: Lines 1-100
- **Event Handlers**: Lines 100-300
- **Geometry Creation**: Lines 300-400
- **Interaction Logic**: Lines 400-600
- **File Operations**: Lines 600-800
- **Layer View**: Lines 800-900
- **Touch Controls**: Lines 500-700

## 📄 License

MIT License - Feel free to use, modify, and distribute.

## 🙏 Acknowledgments

- **Three.js**: Amazing 3D library
- **OrbitControls**: Intuitive camera navigation
- **ES6 Modules**: Clean code organization

## 📞 Contact

For questions or suggestions, please open an issue in the repository.

---

**Version**: 1.0  
**Last Updated**: October 2025  
**Built with**: Three.js 0.160.0
