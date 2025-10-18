# Quadro MDB Editor

A web-based 3D pipe structure editor for creating and visualizing modular pipe networks. Build complex pipe structures by clicking and connecting junctions in 3D space.

## 🚀 Features

### 📐 Core Functionality

#### Building Structures
- **Junctions**: Black spheres that connect pipes in 6 directions (±X, ±Y, ±Z)
- **Add Pipes**: Click on pink lines to create pipes and new junctions
- **Remove Pipes**: Click on gray pipes to delete them
- **Auto Cleanup**: Unused junctions are automatically removed

### 🎨 Visual Modes

#### Creation Mode (✏️)
- **Toggle editing on/off** to switch between building and viewing
- **Hover over junctions** to see available connection points (pink lines)
- **Click pink lines** to add pipes in that direction
- Enabled by default for immediate editing

#### Layer-by-Layer View (📊)
- **View one level at a time** - horizontal slices of your structure
- **Each layer includes**:
  - Horizontal pipes at that level
  - Vertical pipes going up from that level
  - Connected junctions
- **Navigation**: Use slider or Previous/Next buttons to browse layers
- **Layer editing**: Can only edit the currently selected layer
- **Layer isolation**: Pink lines only appear for junctions in the current layer
- **Visibility**: Current layer is clear, other layers are semi-transparent

### 💾 File Operations

#### Startup - Choose Your Path
When you open the app, you'll see two options:
- **Create New Model**: Choose where to save your file, then start building
- **Open Existing Model**: Load a previously saved structure

#### Autosave ✨
- **Automatic saving** every 3 seconds after you make changes
- Your work is continuously protected
- File updates in the background - no interruptions
- "Autosaved" appears briefly in the status bar

#### Save (💾)
- Download your structure as a separate JSON file
- Saves all pipes, junctions, and undo history
- Can be used as a backup or to share your work

#### Open (📂)
- Load previously saved structure files
- Restores your structure exactly as it was
- Brings back your entire undo history
- Compatible with all saved files (old and new formats)

#### Clear All (🗑️)
- Remove entire structure and start fresh
- Asks for confirmation before deleting
- Returns to initial state with single junction

#### Undo (↶)
- Revert the last action (add or remove pipe)
- **Keyboard shortcut**: Ctrl+Z (Cmd+Z on Mac)
- Keeps history of up to 50 actions
- Button becomes disabled when there's nothing to undo
- **Undo history is saved** - you can undo even after reopening a file!

### 🖱️ Mouse Controls

- **Middle Mouse Button**: Rotate camera around the structure
- **Right Mouse Button**: Pan camera position
- **Scroll Wheel**: Zoom in/out
- **Left Click**: Add/remove pipes (when in creation mode)
- **Hover**: Pink lines appear showing where you can add pipes

### 👆 Touch & Touchpad Support

- **2 Fingers**: Move to rotate, pinch to zoom
- **3 Fingers**: Swipe to pan camera
- **Touchpad**: Pinch gesture for zoom, 2-finger scroll to rotate

### 🎯 Color Guide

- **Pink Lines**: Show where you can add new pipes
- **Gray Pipes**: Existing pipes in your structure
- **Black Spheres**: Junctions (connection points)
- **Grid**: Floor reference (light gray)

## 🎮 How to Use

### Getting Started
1. Open `index.html` in any modern web browser
2. **Choose your path**:
   - **Create New Model**: Pick where to save, then start building with autosave
   - **Open Existing Model**: Load a previously saved structure
3. You'll see a single junction (black sphere) with potential connections
4. Hover over the junction to reveal pink lines showing where you can build
5. Click any pink line to add a pipe

### Building Your Structure
1. **Hover** over any junction to see available directions
2. **Click** pink lines to add pipes (automatically creates new junctions)
3. **Click** gray pipes to remove them
4. **Continue** building by connecting junctions
5. Use **Creation Mode** button (✏️) to toggle editing on/off

### Viewing by Layer
1. Build a structure with multiple levels (different heights)
2. Click the **Layer View** button (📊)
3. Use the slider or arrow buttons to browse through layers
4. Each layer shows horizontal pipes and vertical connections
5. You can only edit the currently selected layer
6. Click Layer View button again to see all layers

### Managing Files
- **Autosave**: Enabled automatically when you create or open a file
- **Save**: Click 💾 to download a separate copy of your structure
- **Open**: Click 📂 to load a saved file
- **Clear**: Click 🗑️ to start over (asks for confirmation)

## 🌐 Browser Requirements

**For Full Autosave Functionality:**
- **Google Chrome 86+** (Recommended)
- **Microsoft Edge 86+** (Recommended)  
- **Opera 72+**

**Limited Functionality (Manual Save Only):**
- Firefox (all versions) - No autosave, use Save button
- Safari (all versions) - No autosave, use Save button

All browsers support the core editing features. Only autosave requires Chrome/Edge/Opera due to the File System Access API requirement.

**Note:** If you see "File System Access API not available" in your browser, please switch to Chrome or Edge for autosave functionality.

## ⚠️ Current Limitations

- All pipes look the same (no custom colors or sizes yet)
- Pipes can overlap (no collision detection)
- No measurement tools for distances or angles
- **Autosave only in Chrome/Edge/Opera** - Firefox and Safari require manual saving

## 🔮 Planned Features

- Redo functionality
- More keyboard shortcuts
- Custom pipe colors and sizes
- Measurement tools
- Different junction types
- Copy/paste structures
- Export to 3D file formats (STL, OBJ)
- Add labels and notes
- Multiple grid sizes

## 💡 Tips

- **Autosave is your friend** - your work saves automatically every 3 seconds
- Use layer view to understand complex structures
- Toggle creation mode off for clean presentations
- Right-click drag is great for repositioning your view
- Use touchpad/touch gestures for intuitive mobile editing
- Undo history is preserved in your files - you can undo after reopening!

---

**Version**: 2.0  
**Last Updated**: October 2025

