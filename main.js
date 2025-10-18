import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class PipeStructureEditor {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Touch controls state
        this.touchState = {
            pointers: new Map(),
            lastDistance: 0,
            lastCenter: null,
            rotating: false,
            panning: false,
            zooming: false
        };
        
        // Layer view state
        this.layerView = {
            enabled: false,
            currentLayer: 0,
            totalLayers: 0,
            layers: [] // Array of layer objects with Y coordinates
        };
        
        // Creation mode state
        this.creationMode = true;
        
        // Data structures
        this.junctions = new Map(); // key: "x,y,z" -> junction object
        this.pipes = new Map(); // key: "x1,y1,z1-x2,y2,z2" -> pipe object
        this.potentialPipes = []; // Array of potential pipe line objects
        this.pipeLength = 1; // Length of each pipe segment
        this.pipeRadius = 0.05;
        this.junctionRadius = 0.1;
        
        this.setupRenderer();
        this.setupCamera();
        this.setupLights();
        this.setupControls();
        this.setupEventListeners();
        this.createInitialStructure();
        this.animate();
    }
    
    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0xf0f0f0);
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);
    }
    
    setupCamera() {
        this.camera.position.set(15, 15, 15);
        this.camera.lookAt(0, 0, 0);
    }
    
    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        this.scene.add(directionalLight);
        
        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight2.position.set(-10, -20, -10);
        this.scene.add(directionalLight2);
    }
    
    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 50;
        
        // Change to middle mouse button for rotation
        this.controls.mouseButtons = {
            LEFT: null,                    // Disable left click rotation
            MIDDLE: THREE.MOUSE.ROTATE,    // Middle button for rotation
            RIGHT: THREE.MOUSE.PAN         // Right button for pan
        };
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
        this.renderer.domElement.addEventListener('click', (e) => this.onMouseClick(e));
        this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
        
        // Touch events
        this.renderer.domElement.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        this.renderer.domElement.addEventListener('pointermove', (e) => this.onPointerMove(e));
        this.renderer.domElement.addEventListener('pointerup', (e) => this.onPointerUp(e));
        this.renderer.domElement.addEventListener('pointercancel', (e) => this.onPointerUp(e));
        
        // Prevent default touch behaviors
        this.renderer.domElement.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) e.preventDefault();
        }, { passive: false });
        this.renderer.domElement.addEventListener('touchmove', (e) => {
            if (e.touches.length > 1) e.preventDefault();
        }, { passive: false });
        
        // Wheel event for touchpad pinch zoom
        this.renderer.domElement.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
        
        document.getElementById('create-btn').addEventListener('click', () => this.toggleCreationMode());
        document.getElementById('save-btn').addEventListener('click', () => this.saveStructure());
        document.getElementById('open-btn').addEventListener('click', () => this.openStructure());
        document.getElementById('clear-btn').addEventListener('click', () => this.clearAll());
        document.getElementById('file-input').addEventListener('change', (e) => this.handleFileOpen(e));
        
        // Layer view controls
        document.getElementById('layer-btn').addEventListener('click', () => this.toggleLayerView());
        document.getElementById('layer-slider').addEventListener('input', (e) => this.setLayer(parseInt(e.target.value)));
        document.getElementById('prev-layer').addEventListener('click', () => this.previousLayer());
        document.getElementById('next-layer').addEventListener('click', () => this.nextLayer());
    }
    
    createInitialStructure() {
        // Create a single junction at origin with 6-way star
        const origin = new THREE.Vector3(0, 0, 0);
        this.createJunction(origin, []);
        this.createStarAtPosition(origin);
        
        // Add grid helper with lighter gray color
        const gridHelper = new THREE.GridHelper(20, 20, 0xcccccc, 0xe0e0e0);
        this.scene.add(gridHelper);
    }
    
    createStarAtPosition(position) {
        // Create potential pipes in all 6 directions (star pattern)
        const directions = [
            new THREE.Vector3(1, 0, 0),   // +X (Right)
            new THREE.Vector3(-1, 0, 0),  // -X (Left)
            new THREE.Vector3(0, 1, 0),   // +Y (Up)
            new THREE.Vector3(0, -1, 0),  // -Y (Down)
            new THREE.Vector3(0, 0, 1),   // +Z (Forward)
            new THREE.Vector3(0, 0, -1),  // -Z (Backward)
        ];
        
        directions.forEach(dir => {
            const endPos = position.clone().add(dir.clone().multiplyScalar(this.pipeLength));
            
            // Only create if this pipe doesn't already exist
            const pipeKey = this.getPipeKey(position, endPos);
            if (!this.pipes.has(pipeKey)) {
                // Check if there's already a potential pipe here
                const existingPotential = this.potentialPipes.find(p => p.userData.key === pipeKey);
                if (!existingPotential) {
                    this.createPotentialPipe(position, endPos);
                } else {
                    // Make sure it's visible
                    existingPotential.visible = true;
                    if (existingPotential.userData.tube) {
                        existingPotential.userData.tube.visible = true;
                    }
                }
            }
        });
    }
    
    createJunction(position, connectedDirections) {
        const key = this.positionToKey(position);
        
        // Remove old junction if exists
        if (this.junctions.has(key)) {
            this.scene.remove(this.junctions.get(key).mesh);
        }
        
        const junctionType = this.getJunctionType(connectedDirections.length);
        const geometry = junctionType.geometry;
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x333333,
            transparent: true,
            opacity: 1.0
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        mesh.userData = { type: 'junction', position: position, key: key };
        
        this.scene.add(mesh);
        this.junctions.set(key, { mesh, position, connectedDirections });
        
        return mesh;
    }
    
    getJunctionType(connectionCount) {
        // Return appropriate geometry based on number of connections
        switch(connectionCount) {
            case 0:
            case 1:
            case 2:
                return { geometry: new THREE.SphereGeometry(this.junctionRadius, 16, 16) };
            case 3:
            case 4:
            case 5:
            case 6:
                return { geometry: new THREE.SphereGeometry(this.junctionRadius * 1.2, 16, 16) };
            default:
                return { geometry: new THREE.SphereGeometry(this.junctionRadius, 16, 16) };
        }
    }
    
    createPotentialPipe(start, end) {
        const points = [start, end];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
            color: 0xff00ff, 
            transparent: true, 
            opacity: 0.5,
            linewidth: 3
        });
        const line = new THREE.Line(geometry, material);
        line.userData = { 
            type: 'potential', 
            start: start.clone(), 
            end: end.clone(),
            key: this.getPipeKey(start, end)
        };
        
        // Set initial visibility based on creation mode
        line.visible = this.creationMode;
        
        // Make the line thicker by adding a cylinder overlay with larger radius for easier clicking
        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();
        const tubeGeometry = new THREE.CylinderGeometry(0.05, 0.05, length, 8); // Increased from 0.02 to 0.05
        const tubeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff00ff, 
            transparent: true, 
            opacity: 0.3
        });
        const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
        tube.visible = this.creationMode;  // Visible in creation mode
        
        tube.position.copy(start).add(direction.clone().multiplyScalar(0.5));
        tube.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            direction.clone().normalize()
        );
        
        line.userData.tube = tube;
        this.scene.add(line);
        this.scene.add(tube);
        this.potentialPipes.push(line);
        
        return line;
    }
    
    addPipeConnection(start, end) {
        const key = this.getPipeKey(start, end);
        
        // Check if pipe already exists
        if (this.pipes.has(key)) {
            return;
        }
        
        // Create pipe geometry
        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();
        const geometry = new THREE.CylinderGeometry(this.pipeRadius, this.pipeRadius, length, 16);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0xaaaaaa,
            transparent: true,
            opacity: 1.0
        });
        const pipe = new THREE.Mesh(geometry, material);
        
        // Position and orient the pipe
        pipe.position.copy(start).add(direction.clone().multiplyScalar(0.5));
        pipe.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            direction.clone().normalize()
        );
        
        pipe.userData = { type: 'pipe', start: start.clone(), end: end.clone(), key: key };
        
        this.scene.add(pipe);
        this.pipes.set(key, pipe);
        
        // Update junctions at both ends
        this.updateJunctionAtPosition(start);
        
        // Check if end junction exists, if not create it
        const endKey = this.positionToKey(end);
        if (!this.junctions.has(endKey)) {
            this.createJunction(end, []);
            this.createStarAtPosition(end); // Create new star at the end position
        } else {
            this.updateJunctionAtPosition(end);
        }
        
        // Hide the potential pipe line
        this.hidePotentialPipe(start, end);
        
        // Update layer view if enabled
        if (this.layerView.enabled) {
            this.analyzeLayers();
            this.updateLayerView();
        }
        
        this.updateStatus(`Pipe added`);
    }
    
    removePipe(pipe) {
        const key = pipe.userData.key;
        const start = pipe.userData.start;
        const end = pipe.userData.end;
        
        console.log('Removing pipe:', key);
        
        this.scene.remove(pipe);
        this.pipes.delete(key);
        
        // Check if end junction has any OTHER connections (besides the one we just removed)
        const endConnections = this.getConnectedDirections(end);
        console.log('End connections after removal:', endConnections.length);
        
        if (endConnections.length === 0) {
            console.log('No connections at end, removing junction and star');
            // Remove the junction if no connections
            const endKey = this.positionToKey(end);
            const junction = this.junctions.get(endKey);
            if (junction) {
                this.scene.remove(junction.mesh);
                this.junctions.delete(endKey);
            }
            
            // Remove all potential pipes from this position EXCEPT the one we want to restore
            const pipeKeyToKeep = this.getPipeKey(start, end);
            this.potentialPipes = this.potentialPipes.filter(p => {
                const shouldRemove = (this.positionEquals(p.userData.start, end) || this.positionEquals(p.userData.end, end)) 
                                      && p.userData.key !== pipeKeyToKeep;
                if (shouldRemove) {
                    this.scene.remove(p);
                    if (p.userData.tube) {
                        this.scene.remove(p.userData.tube);
                    }
                    return false;
                }
                return true;
            });
        } else {
            this.updateJunctionAtPosition(end);
        }
        
        // Update start junction
        this.updateJunctionAtPosition(start);
        
        // Show the potential pipe line again - do this LAST
        this.showPotentialPipe(start, end);
        
        // Update layer view if enabled
        if (this.layerView.enabled) {
            this.analyzeLayers();
            this.updateLayerView();
        }
        
        this.updateStatus(`Pipe removed`);
    }
    
    updateJunctionAtPosition(position) {
        const key = this.positionToKey(position);
        const connectedDirections = this.getConnectedDirections(position);
        this.createJunction(position, connectedDirections);
    }
    
    getConnectedDirections(position) {
        const directions = [];
        
        this.pipes.forEach(pipe => {
            const start = pipe.userData.start;
            const end = pipe.userData.end;
            
            if (this.positionEquals(start, position)) {
                directions.push(new THREE.Vector3().subVectors(end, start).normalize());
            } else if (this.positionEquals(end, position)) {
                directions.push(new THREE.Vector3().subVectors(start, end).normalize());
            }
        });
        
        return directions;
    }
    
    hidePotentialPipe(start, end) {
        const key = this.getPipeKey(start, end);
        const potentialPipe = this.potentialPipes.find(p => p.userData.key === key);
        if (potentialPipe) {
            potentialPipe.visible = false;
            if (potentialPipe.userData.tube) {
                potentialPipe.userData.tube.visible = false;
            }
        }
    }
    
    showPotentialPipe(start, end) {
        const key = this.getPipeKey(start, end);
        console.log('Attempting to show potential pipe:', key);
        console.log('Total potential pipes:', this.potentialPipes.length);
        
        const potentialPipe = this.potentialPipes.find(p => {
            console.log('  Checking:', p.userData.key, 'visible:', p.visible);
            return p.userData.key === key;
        });
        
        if (potentialPipe) {
            console.log('Found potential pipe, making visible');
            potentialPipe.visible = true;
            if (potentialPipe.userData.tube) {
                potentialPipe.userData.tube.visible = true;
            }
        } else {
            console.log('Potential pipe not found, creating new one');
            // If potential pipe doesn't exist, create it
            this.createPotentialPipe(start, end);
        }
    }
    
    onMouseClick(event) {
        // Only handle left mouse button clicks
        if (event.button !== 0) return;
        
        // Don't allow editing if creation mode is disabled
        if (!this.creationMode) return;
        
        this.updateMousePosition(event);
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // In layer view mode, check if clicked object is in current layer
        if (this.layerView.enabled && this.layerView.layers.length > 0) {
            const currentLayer = this.layerView.layers[this.layerView.currentLayer];
            
            // Check if clicking on a pipe
            const pipeArray = Array.from(this.pipes.values());
            const pipeIntersects = this.raycaster.intersectObjects(pipeArray);
            
            if (pipeIntersects.length > 0) {
                const clickedPipe = pipeIntersects[0].object;
                // Only allow removal if pipe is in current layer
                const isInCurrentLayer = currentLayer.pipes.includes(clickedPipe) || 
                                        currentLayer.verticalPipes.includes(clickedPipe);
                if (!isInCurrentLayer) {
                    this.updateStatus('Cannot edit - Switch to this layer first');
                    return;
                }
            }
            
            // Check if clicking on a potential pipe (for adding)
            const potentialTubes = this.potentialPipes
                .filter(p => p.visible && p.userData.tube)
                .map(p => p.userData.tube);
            
            const tubeIntersects = this.raycaster.intersectObjects(potentialTubes);
            if (tubeIntersects.length > 0) {
                const tube = tubeIntersects[0].object;
                const parentLine = this.potentialPipes.find(p => p.userData.tube === tube);
                if (parentLine && parentLine.visible) {
                    // Check if this potential pipe would be in current layer
                    const start = parentLine.userData.start;
                    const end = parentLine.userData.end;
                    const minY = Math.min(start.y, end.y);
                    const maxY = Math.max(start.y, end.y);
                    
                    // Horizontal pipe - must be at current layer's Y
                    if (Math.abs(start.y - end.y) < 0.01) {
                        if (Math.abs(currentLayer.y - start.y) > 0.01) {
                            this.updateStatus('Cannot add - Not in current layer');
                            return;
                        }
                    } else {
                        // Vertical pipe - must start at current layer
                        if (Math.abs(currentLayer.y - minY) > 0.01) {
                            this.updateStatus('Cannot add - Vertical pipe must start at current layer');
                            return;
                        }
                    }
                }
            }
        }
        
        // Increase raycaster threshold for better clicking on lines
        this.raycaster.params.Line.threshold = 0.2;
        
        // Check for clicks on existing pipes first
        const pipeArray = Array.from(this.pipes.values());
        const pipeIntersects = this.raycaster.intersectObjects(pipeArray);
        
        if (pipeIntersects.length > 0) {
            this.removePipe(pipeIntersects[0].object);
            return;
        }
        
        // Check for clicks on potential pipe tubes (thicker, easier to click)
        const potentialTubes = this.potentialPipes
            .filter(p => p.visible && p.userData.tube)
            .map(p => p.userData.tube);
        
        const tubeIntersects = this.raycaster.intersectObjects(potentialTubes);
        if (tubeIntersects.length > 0) {
            const tube = tubeIntersects[0].object;
            const parentLine = this.potentialPipes.find(p => p.userData.tube === tube);
            if (parentLine && parentLine.visible) {
                this.addPipeConnection(parentLine.userData.start, parentLine.userData.end);
                return;
            }
        }
    }
    
    onMouseMove(event) {
        this.updateMousePosition(event);
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        this.raycaster.params.Line.threshold = 0.2; // Larger margin for easier hovering
        
        // Reset all potential pipes to hidden (or default state)
        this.potentialPipes.forEach(pipe => {
            if (pipe.userData.tube) {
                pipe.material.opacity = 0.5;
                pipe.userData.tube.material.opacity = 0.3;
            }
            // Hide all potential pipes by default when in creation mode
            if (this.creationMode) {
                pipe.visible = false;
                if (pipe.userData.tube) {
                    pipe.userData.tube.visible = false;
                }
            }
        });
        
        // Reset cursor
        this.renderer.domElement.style.cursor = 'default';
        
        // Only show hover effects if creation mode is enabled
        if (!this.creationMode) {
            return;
        }
        
        // First, check for intersections with visible potential pipe tubes
        const visiblePotentialTubes = this.potentialPipes
            .filter(p => p.userData.tube)
            .map(p => p.userData.tube);
        
        const initialTubeIntersects = this.raycaster.intersectObjects(visiblePotentialTubes);
        
        // Keep track of which pipes should stay visible
        const pipesToKeepVisible = new Set();
        
        if (initialTubeIntersects.length > 0) {
            const tube = initialTubeIntersects[0].object;
            const parentLine = this.potentialPipes.find(p => p.userData.tube === tube);
            if (parentLine) {
                // In layer view, check if this pipe belongs to current layer
                let shouldShow = true;
                if (this.layerView.enabled && this.layerView.layers.length > 0) {
                    const currentLayer = this.layerView.layers[this.layerView.currentLayer];
                    const start = parentLine.userData.start;
                    const end = parentLine.userData.end;
                    const minY = Math.min(start.y, end.y);
                    
                    const isHorizontal = Math.abs(start.y - end.y) < 0.01;
                    const belongsToLayer = isHorizontal 
                        ? Math.abs(currentLayer.y - start.y) < 0.01
                        : Math.abs(currentLayer.y - minY) < 0.01;
                    
                    shouldShow = belongsToLayer;
                }
                
                if (shouldShow) {
                    parentLine.visible = true;
                    parentLine.material.opacity = 1.0;
                    parentLine.userData.tube.visible = true;
                    parentLine.userData.tube.material.opacity = 0.7;
                    this.renderer.domElement.style.cursor = 'pointer';
                    
                    // Mark only this pipe to keep visible
                    pipesToKeepVisible.add(parentLine.userData.key);
                }
            }
        }
        
        // Check for intersections with junctions
        const junctionArray = Array.from(this.junctions.values()).map(j => j.mesh);
        const junctionIntersects = this.raycaster.intersectObjects(junctionArray);
        
        if (junctionIntersects.length > 0) {
            const hoveredJunction = junctionIntersects[0].object;
            const junctionPos = hoveredJunction.userData.position;
            
            // If in layer view, only show potential pipes for junctions in current layer
            if (this.layerView.enabled && this.layerView.layers.length > 0) {
                const currentLayer = this.layerView.layers[this.layerView.currentLayer];
                const junctionInCurrentLayer = currentLayer.junctions.some(j => 
                    this.positionEquals(j.position, junctionPos)
                );
                
                // Only show pipes if junction is in current layer
                if (junctionInCurrentLayer) {
                    // Show only potential pipes that belong to current layer
                    this.potentialPipes.forEach(pipe => {
                        if (this.positionEquals(pipe.userData.start, junctionPos) || 
                            this.positionEquals(pipe.userData.end, junctionPos)) {
                            const start = pipe.userData.start;
                            const end = pipe.userData.end;
                            const minY = Math.min(start.y, end.y);
                            
                            // Check if pipe would be in current layer
                            const isHorizontal = Math.abs(start.y - end.y) < 0.01;
                            const belongsToLayer = isHorizontal 
                                ? Math.abs(currentLayer.y - start.y) < 0.01
                                : Math.abs(currentLayer.y - minY) < 0.01;
                            
                            if (belongsToLayer) {
                                pipesToKeepVisible.add(pipe.userData.key);
                            }
                        }
                    });
                    this.renderer.domElement.style.cursor = 'pointer';
                }
            } else {
                // Not in layer view - show all pipes from this junction
                this.potentialPipes.forEach(pipe => {
                    if (this.positionEquals(pipe.userData.start, junctionPos) || 
                        this.positionEquals(pipe.userData.end, junctionPos)) {
                        pipesToKeepVisible.add(pipe.userData.key);
                    }
                });
                this.renderer.domElement.style.cursor = 'pointer';
            }
        }
        
        // Now show all pipes that should be visible
        this.potentialPipes.forEach(pipe => {
            if (pipesToKeepVisible.has(pipe.userData.key)) {
                pipe.visible = true;
                if (pipe.userData.tube) {
                    pipe.userData.tube.visible = true;
                }
            }
        });
        
        // Check for intersections with potential pipe tubes for highlighting
        const potentialTubes = this.potentialPipes
            .filter(p => p.visible && p.userData.tube)
            .map(p => p.userData.tube);
        
        const tubeIntersects = this.raycaster.intersectObjects(potentialTubes);
        if (tubeIntersects.length > 0) {
            const tube = tubeIntersects[0].object;
            const parentLine = this.potentialPipes.find(p => p.userData.tube === tube);
            if (parentLine && parentLine.visible) {
                parentLine.material.opacity = 1.0;
                tube.material.opacity = 0.8;
                this.renderer.domElement.style.cursor = 'pointer';
            }
        }
        
        // Highlight existing pipes on hover
        const pipeArray = Array.from(this.pipes.values());
        pipeArray.forEach(pipe => {
            pipe.material.emissive.setHex(0x000000);
        });
        
        const pipeIntersects = this.raycaster.intersectObjects(pipeArray);
        if (pipeIntersects.length > 0) {
            pipeIntersects[0].object.material.emissive.setHex(0x330000);
            this.renderer.domElement.style.cursor = 'pointer';
        }
    }
    
    updateMousePosition(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }
    
    // Touch and pointer handling
    onPointerDown(event) {
        this.touchState.pointers.set(event.pointerId, {
            x: event.clientX,
            y: event.clientY,
            id: event.pointerId
        });
    }
    
    onPointerMove(event) {
        const pointers = Array.from(this.touchState.pointers.values());
        
        if (pointers.length === 0) return;
        
        // Update current pointer
        this.touchState.pointers.set(event.pointerId, {
            x: event.clientX,
            y: event.clientY,
            id: event.pointerId
        });
        
        const currentPointers = Array.from(this.touchState.pointers.values());
        
        // Two-finger gestures (rotate and pinch zoom)
        if (currentPointers.length === 2) {
            event.preventDefault();
            this.handleTwoFingerGesture(currentPointers);
        }
        // Three-finger pan
        else if (currentPointers.length === 3) {
            event.preventDefault();
            this.handleThreeFingerPan(currentPointers);
        }
    }
    
    onPointerUp(event) {
        this.touchState.pointers.delete(event.pointerId);
        
        // Reset gesture states when fingers are lifted
        if (this.touchState.pointers.size === 0) {
            this.touchState.rotating = false;
            this.touchState.panning = false;
            this.touchState.zooming = false;
            this.touchState.lastDistance = 0;
            this.touchState.lastCenter = null;
        }
    }
    
    handleTwoFingerGesture(pointers) {
        const p1 = pointers[0];
        const p2 = pointers[1];
        
        // Calculate distance for pinch zoom
        const distance = Math.sqrt(
            Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
        );
        
        // Calculate center point for rotation
        const centerX = (p1.x + p2.x) / 2;
        const centerY = (p1.y + p2.y) / 2;
        
        // Pinch zoom
        if (this.touchState.lastDistance > 0) {
            const delta = distance - this.touchState.lastDistance;
            const zoomSpeed = 0.01;
            const zoomDelta = -delta * zoomSpeed;
            
            const newDistance = this.camera.position.length() + zoomDelta;
            const clampedDistance = Math.max(this.controls.minDistance, 
                                            Math.min(this.controls.maxDistance, newDistance));
            
            this.camera.position.normalize().multiplyScalar(clampedDistance);
            this.camera.updateProjectionMatrix();
        }
        
        // Rotation with two fingers
        if (this.touchState.lastCenter) {
            const deltaX = centerX - this.touchState.lastCenter.x;
            const deltaY = centerY - this.touchState.lastCenter.y;
            
            const rotateSpeed = 0.005;
            
            // Rotate around Y axis (horizontal movement)
            const quaternionY = new THREE.Quaternion();
            quaternionY.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -deltaX * rotateSpeed);
            this.camera.position.applyQuaternion(quaternionY);
            
            // Rotate around X axis (vertical movement)
            const right = new THREE.Vector3(1, 0, 0);
            right.applyQuaternion(this.camera.quaternion);
            const quaternionX = new THREE.Quaternion();
            quaternionX.setFromAxisAngle(right, -deltaY * rotateSpeed);
            this.camera.position.applyQuaternion(quaternionX);
            
            this.camera.lookAt(this.controls.target);
        }
        
        this.touchState.lastDistance = distance;
        this.touchState.lastCenter = { x: centerX, y: centerY };
    }
    
    handleThreeFingerPan(pointers) {
        // Calculate center of all three fingers
        const centerX = pointers.reduce((sum, p) => sum + p.x, 0) / pointers.length;
        const centerY = pointers.reduce((sum, p) => sum + p.y, 0) / pointers.length;
        
        if (this.touchState.lastCenter) {
            const deltaX = centerX - this.touchState.lastCenter.x;
            const deltaY = centerY - this.touchState.lastCenter.y;
            
            const panSpeed = 0.01;
            
            // Get camera right and up vectors
            const right = new THREE.Vector3();
            const up = new THREE.Vector3();
            this.camera.matrix.extractBasis(right, up, new THREE.Vector3());
            
            // Pan the camera and target
            const panOffset = new THREE.Vector3();
            panOffset.add(right.multiplyScalar(-deltaX * panSpeed));
            panOffset.add(up.multiplyScalar(deltaY * panSpeed));
            
            this.camera.position.add(panOffset);
            this.controls.target.add(panOffset);
            this.camera.updateProjectionMatrix();
        }
        
        this.touchState.lastCenter = { x: centerX, y: centerY };
    }
    
    onWheel(event) {
        // Detect touchpad pinch (ctrlKey is set on touchpad pinch)
        if (event.ctrlKey) {
            event.preventDefault();
            
            // Touchpad pinch zoom
            const zoomSpeed = 0.02;
            const delta = -event.deltaY * zoomSpeed;
            
            const newDistance = this.camera.position.length() + delta;
            const clampedDistance = Math.max(this.controls.minDistance, 
                                            Math.min(this.controls.maxDistance, newDistance));
            
            this.camera.position.normalize().multiplyScalar(clampedDistance);
            this.camera.updateProjectionMatrix();
        }
        // Otherwise let OrbitControls handle regular scroll wheel zoom
    }
    
    positionToKey(position) {
        return `${position.x.toFixed(2)},${position.y.toFixed(2)},${position.z.toFixed(2)}`;
    }
    
    getPipeKey(start, end) {
        const key1 = this.positionToKey(start) + '-' + this.positionToKey(end);
        const key2 = this.positionToKey(end) + '-' + this.positionToKey(start);
        return key1 < key2 ? key1 : key2;
    }
    
    positionEquals(pos1, pos2) {
        return pos1.distanceTo(pos2) < 0.01;
    }
    
    addGridSection() {
        this.updateStatus('Adding grid section...');
        // Could expand the grid here
        alert('Grid expansion feature - to be implemented');
    }
    
    saveStructure() {
        const structure = {
            version: '1.0',
            junctions: [],
            pipes: []
        };
        
        this.junctions.forEach((junction, key) => {
            structure.junctions.push({
                position: {
                    x: junction.position.x,
                    y: junction.position.y,
                    z: junction.position.z
                },
                connections: junction.connectedDirections.length
            });
        });
        
        this.pipes.forEach((pipe, key) => {
            structure.pipes.push({
                start: {
                    x: pipe.userData.start.x,
                    y: pipe.userData.start.y,
                    z: pipe.userData.start.z
                },
                end: {
                    x: pipe.userData.end.x,
                    y: pipe.userData.end.y,
                    z: pipe.userData.end.z
                }
            });
        });
        
        const json = JSON.stringify(structure, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pipe-structure.json';
        a.click();
        URL.revokeObjectURL(url);
        
        this.updateStatus('Structure saved');
    }
    
    openStructure() {
        document.getElementById('file-input').click();
    }
    
    handleFileOpen(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const structure = JSON.parse(e.target.result);
                this.loadStructure(structure);
                this.updateStatus('Structure loaded');
            } catch (error) {
                alert('Error loading file: ' + error.message);
                this.updateStatus('Error loading file');
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    }
    
    loadStructure(structure) {
        // Clear current structure first
        this.pipes.forEach(pipe => this.scene.remove(pipe));
        this.pipes.clear();
        
        this.junctions.forEach(junction => this.scene.remove(junction.mesh));
        this.junctions.clear();
        
        this.potentialPipes.forEach(pipe => {
            this.scene.remove(pipe);
            if (pipe.userData.tube) {
                this.scene.remove(pipe.userData.tube);
            }
        });
        this.potentialPipes = [];
        
        // Load pipes from structure
        if (structure.pipes && structure.pipes.length > 0) {
            structure.pipes.forEach(pipeData => {
                const start = new THREE.Vector3(pipeData.start.x, pipeData.start.y, pipeData.start.z);
                const end = new THREE.Vector3(pipeData.end.x, pipeData.end.y, pipeData.end.z);
                
                // Create junction at start if doesn't exist
                const startKey = this.positionToKey(start);
                if (!this.junctions.has(startKey)) {
                    this.createJunction(start, []);
                }
                
                // Add the pipe
                this.addPipeConnection(start, end);
            });
        } else {
            // If no pipes, create initial structure
            const origin = new THREE.Vector3(0, 0, 0);
            this.createJunction(origin, []);
            this.createStarAtPosition(origin);
        }
    }
    
    clearAll() {
        if (confirm('Are you sure you want to clear the entire structure?')) {
            // Remove all pipes
            this.pipes.forEach(pipe => {
                this.scene.remove(pipe);
            });
            this.pipes.clear();
            
            // Remove all junctions
            this.junctions.forEach(junction => {
                this.scene.remove(junction.mesh);
            });
            this.junctions.clear();
            
            // Remove all potential pipes
            this.potentialPipes.forEach(pipe => {
                this.scene.remove(pipe);
                if (pipe.userData.tube) {
                    this.scene.remove(pipe.userData.tube);
                }
            });
            this.potentialPipes = [];
            
            // Recreate initial structure
            const origin = new THREE.Vector3(0, 0, 0);
            this.createJunction(origin, []);
            this.createStarAtPosition(origin);
            
            this.updateStatus('Structure reset');
        }
    }
    
    exportStructure() {
        // Deprecated - use saveStructure instead
        this.saveStructure();
    }
    
    updateStatus(message) {
        document.getElementById('status').textContent = message;
        setTimeout(() => {
            document.getElementById('status').textContent = 'Ready';
        }, 3000);
    }
    
    // Creation Mode Functions
    toggleCreationMode() {
        this.creationMode = !this.creationMode;
        const createBtn = document.getElementById('create-btn');
        
        if (this.creationMode) {
            createBtn.classList.add('active');
            // Don't show potential pipes by default - they'll appear on hover
            this.hidePotentialPipes();
            this.updateStatus('Creation mode enabled - Hover over junctions');
        } else {
            createBtn.classList.remove('active');
            this.hidePotentialPipes();
            this.updateStatus('Creation mode disabled - View only');
        }
    }
    
    showPotentialPipes() {
        this.potentialPipes.forEach(pipe => {
            // Only show if it's not hidden by an existing pipe
            const pipeExists = this.pipes.has(pipe.userData.key);
            if (!pipeExists) {
                pipe.visible = true;
            }
        });
    }
    
    hidePotentialPipes() {
        this.potentialPipes.forEach(pipe => {
            pipe.visible = false;
        });
    }
    
    // Layer View Functions
    toggleLayerView() {
        this.layerView.enabled = !this.layerView.enabled;
        const layerBtn = document.getElementById('layer-btn');
        const layerControls = document.getElementById('layer-controls');
        
        if (this.layerView.enabled) {
            layerBtn.classList.add('active');
            layerControls.classList.add('visible');
            this.analyzeLayers();
            this.updateLayerView();
            this.updateStatus('Layer view enabled');
        } else {
            layerBtn.classList.remove('active');
            layerControls.classList.remove('visible');
            this.showAllLayers();
            this.updateStatus('Layer view disabled');
        }
    }
    
    analyzeLayers() {
        // Collect all unique Y coordinates from junctions
        const yCoords = new Set();
        this.junctions.forEach(junction => {
            yCoords.add(junction.position.y);
        });
        
        // Sort Y coordinates
        const sortedYs = Array.from(yCoords).sort((a, b) => a - b);
        
        // Create layer objects
        this.layerView.layers = sortedYs.map((y, index) => {
            return {
                y: y,
                index: index,
                pipes: [],
                junctions: [],
                verticalPipes: [] // Pipes going up from this layer
            };
        });
        
        // Assign pipes to layers
        this.pipes.forEach(pipe => {
            const start = pipe.userData.start;
            const end = pipe.userData.end;
            const minY = Math.min(start.y, end.y);
            const maxY = Math.max(start.y, end.y);
            
            // Check if pipe is horizontal (same Y)
            if (Math.abs(start.y - end.y) < 0.01) {
                // Horizontal pipe - belongs to the layer at this Y
                const layer = this.layerView.layers.find(l => Math.abs(l.y - start.y) < 0.01);
                if (layer) {
                    layer.pipes.push(pipe);
                }
            } else {
                // Vertical pipe - belongs to the lower layer
                const layer = this.layerView.layers.find(l => Math.abs(l.y - minY) < 0.01);
                if (layer) {
                    layer.verticalPipes.push(pipe);
                }
            }
        });
        
        // Assign junctions to layers
        this.junctions.forEach(junction => {
            const layer = this.layerView.layers.find(l => Math.abs(l.y - junction.position.y) < 0.01);
            if (layer) {
                layer.junctions.push(junction);
            }
        });
        
        this.layerView.totalLayers = this.layerView.layers.length;
        this.layerView.currentLayer = Math.min(this.layerView.currentLayer, this.layerView.totalLayers - 1);
        
        // Update UI
        document.getElementById('total-layers').textContent = this.layerView.totalLayers;
        document.getElementById('layer-slider').max = Math.max(0, this.layerView.totalLayers - 1);
        document.getElementById('layer-slider').value = this.layerView.currentLayer;
    }
    
    updateLayerView() {
        if (!this.layerView.enabled || this.layerView.layers.length === 0) {
            this.showAllLayers();
            return;
        }
        
        const currentLayer = this.layerView.layers[this.layerView.currentLayer];
        document.getElementById('current-layer').textContent = this.layerView.currentLayer;
        
        // Update button states
        document.getElementById('prev-layer').disabled = this.layerView.currentLayer === 0;
        document.getElementById('next-layer').disabled = this.layerView.currentLayer === this.layerView.totalLayers - 1;
        
        // Hide all pipes and junctions first (make them semi-transparent)
        this.pipes.forEach(pipe => {
            pipe.material.opacity = 0.15;
            pipe.material.transparent = true;
        });
        
        this.junctions.forEach(junction => {
            junction.mesh.material.opacity = 0.15;
            junction.mesh.material.transparent = true;
        });
        
        // Show current layer (full opacity)
        currentLayer.pipes.forEach(pipe => {
            pipe.material.opacity = 1.0;
        });
        
        currentLayer.verticalPipes.forEach(pipe => {
            pipe.material.opacity = 1.0;
        });
        
        currentLayer.junctions.forEach(junction => {
            junction.mesh.material.opacity = 1.0;
        });
        
        // Also show junctions at the top of vertical pipes
        currentLayer.verticalPipes.forEach(pipe => {
            const topY = Math.max(pipe.userData.start.y, pipe.userData.end.y);
            const topPos = pipe.userData.start.y > pipe.userData.end.y ? pipe.userData.start : pipe.userData.end;
            const topKey = this.positionToKey(topPos);
            const topJunction = this.junctions.get(topKey);
            if (topJunction) {
                topJunction.mesh.material.opacity = 1.0;
            }
        });
    }
    
    showAllLayers() {
        // Reset all pipes and junctions to full opacity
        this.pipes.forEach(pipe => {
            pipe.material.opacity = 1.0;
            pipe.material.transparent = true;
        });
        
        this.junctions.forEach(junction => {
            junction.mesh.material.opacity = 1.0;
            junction.mesh.material.transparent = true;
        });
    }
    
    setLayer(layerIndex) {
        this.layerView.currentLayer = layerIndex;
        this.updateLayerView();
    }
    
    previousLayer() {
        if (this.layerView.currentLayer > 0) {
            this.layerView.currentLayer--;
            document.getElementById('layer-slider').value = this.layerView.currentLayer;
            this.updateLayerView();
        }
    }
    
    nextLayer() {
        if (this.layerView.currentLayer < this.layerView.totalLayers - 1) {
            this.layerView.currentLayer++;
            document.getElementById('layer-slider').value = this.layerView.currentLayer;
            this.updateLayerView();
        }
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the editor
const editor = new PipeStructureEditor();
