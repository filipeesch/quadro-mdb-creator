# Quadro MDB Editor - AI Coding Instructions

## Project Overview
A browser-based 3D pipe structure editor built with Three.js for creating and manipulating modular pipe networks using a junction-based grid system.

## Architecture

### Core Components
- **PipeStructureEditor**: Single monolithic class managing scene, interaction, and data
- **Three.js Scene Graph**: Junctions (spheres) + Pipes (cylinders) + Potential pipes (lines with tubes)
- **Data Structures**:
  - `junctions` Map: key="x,y,z" → {mesh, position, connectedDirections}
  - `pipes` Map: key="x1,y1,z1-x2,y2,z2" → THREE.Mesh object
  - `potentialPipes` Array: THREE.Line objects showing possible connections

### Coordinate System & Grid
- Unit grid with `pipeLength = 1` spacing between junctions
- All positions quantized to nearest 0.01 via `positionToKey()`
- Star pattern: 6 potential pipes extending in ±X, ±Y, ±Z from each junction
- Position keys are NORMALIZED (key1 < key2) to ensure uniqueness regardless of direction

## Critical Patterns

### Pipe Creation/Deletion Workflow
1. **Adding pipe**: Click potential pipe → `addPipeConnection()` → creates pipe mesh → creates end junction if new → generates new star pattern at end → hides potential pipe
2. **Removing pipe**: Click pipe → `removePipe()` → deletes pipe → if end junction isolated (no connections), delete it AND all its potential pipes → re-show potential pipe between start/end
3. **Key insight**: Potential pipes persist but visibility toggles based on creation mode and hover state

### Interaction Modes
- **Creation Mode** (default on): Potential pipes visible on hover over junctions, click to add/remove
- **Layer View Mode**: Dims non-current layer geometry via `material.opacity = 0.15`, shows horizontal + vertical pipes per layer
- Mouse controls: LEFT=select/edit, MIDDLE=rotate (OrbitControls), RIGHT=pan

### Touch Gestures (Mobile/Tablet)
- 2-finger: Pinch zoom + rotation (tracks center point and distance)
- 3-finger: Pan (moves camera + controls.target)
- Pointer events with `touchState.pointers` Map tracking multiple touch points
- Prevent default on multi-touch to disable browser gestures

### Raycasting & Selection
- `raycaster.params.Line.threshold = 0.2` for easier line clicking
- Invisible "tube" cylinders (radius 0.05) overlay potential pipes for better click detection
- Hover changes cursor and highlights via material opacity/emissive changes

## File Format
JSON structure with `version`, `junctions[]`, `pipes[]` arrays. Positions stored as `{x, y, z}` objects.

## Key Methods to Modify

### Adding Features
- **New interaction mode**: Toggle like `toggleLayerView()`, add button in `index.html`, update `setupEventListeners()`
- **Junction types**: Modify `getJunctionType()` to return different geometries based on `connectionCount`
- **Visual styles**: Change materials in `createJunction()`, `addPipeConnection()`, `createPotentialPipe()`

### Debugging Geometry
- Use `console.log` in `removePipe()`, `addPipeConnection()` - these already have debug traces
- Check Maps with `this.junctions.size`, `this.pipes.size`
- Verify position keys match: `this.positionToKey(pos)` must round consistently

## Dependencies
- **Three.js 0.160.0** via CDN (importmap in `index.html`)
- **OrbitControls** from three/addons
- No build process - pure ES modules served directly

## Common Gotchas
- Position comparison uses `distanceTo() < 0.01` not `===`
- Pipe keys are bidirectional (normalized lexicographically)
- Potential pipes must be manually shown/hidden; they don't auto-update visibility
- When changing geometry visibility, update BOTH the line and its `userData.tube`
- Touch events require `passive: false` to allow `preventDefault()`

## Testing Changes
1. Open `index.html` in browser (local file:// works)
2. Test adding pipes by hovering junctions, clicking pink lines
3. Test removing by clicking gray pipes
4. Test layer view with structures having multiple Y levels
5. Test touch on actual mobile device or Chrome DevTools device mode

## Documentation Updates
**CRITICAL**: When adding or modifying features, ALWAYS update the README.md file:
- Add new features to the appropriate section (Features, Controls, etc.)
- Keep descriptions **user-focused** and **non-technical**
- Explain **what it does** and **how to use it**, not how it's implemented
- Update the "Planned Features" section if completing a feature
- Add practical tips if the feature has usage nuances
- Keep language simple and action-oriented
- README.md is for END USERS, not developers (no code, architecture, or technical details)
