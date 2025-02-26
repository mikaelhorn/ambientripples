import * as THREE from 'three';

// Function to create procedural mountains
export function createProceduralMountains() {
    // Create a mountains group
    const mountains = new THREE.Group();
    
    // Create mountain range using simplex noise for a more natural look
    const createMountainRange = () => {
        // Create a plane geometry with high segment count
        const geometry = new THREE.PlaneGeometry(40, 30, 64, 64);
        
        // Displace vertices to create mountain shape
        const vertices = geometry.attributes.position;
        
        for (let i = 0; i < vertices.count; i++) {
            const x = vertices.getX(i);
            const z = vertices.getZ(i);
            
            // Simple perlin-like noise function
            const frequency = 0.2;
            const y1 = Math.sin(x * frequency) * Math.cos(z * frequency) * 2;
            const y2 = Math.sin(x * frequency * 2) * Math.cos(z * frequency * 2);
            const y3 = Math.sin(x * frequency * 0.5) * Math.cos(z * frequency * 0.5) * 4;
            
            // Combine different frequencies for more natural terrain
            let y = y1 + y2 * 0.5 + y3;
            
            // Make sure heights are positive and add base height
            y = Math.max(0, y + 3);
            
            vertices.setY(i, y);
        }
        
        // Update normals for proper lighting
        geometry.computeVertexNormals();
        
        // Create gradient material for mountains
        const material = new THREE.MeshPhongMaterial({
            color: 0x4d6a80,
            shininess: 5,
            flatShading: true,
            vertexColors: true
        });
        
        // Apply vertex colors based on height
        const colors = [];
        for (let i = 0; i < vertices.count; i++) {
            const y = vertices.getY(i);
            
            // Map height to color
            let color;
            if (y < 1.0) {
                // Base (forest)
                color = new THREE.Color(0x2d4c3b);
            } else if (y < 3.0) {
                // Mid mountain (rocky)
                color = new THREE.Color(0x5a6d7c);
            } else if (y < 5.0) {
                // High mountain
                color = new THREE.Color(0x8295a1);
            } else {
                // Snow caps
                color = new THREE.Color(0xdfeded);
            }
            
            colors.push(color.r, color.g, color.b);
        }
        
        // Add colors to geometry
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        // Create mesh and position
        const range = new THREE.Mesh(geometry, material);
        range.rotation.x = -Math.PI / 2; // Rotate to be vertical
        range.position.set(0, 0, -15);   // Position behind water
        
        return range;
    };
    
    // Create distant mountains (background layer)
    const backgroundMountains = createMountainRange();
    backgroundMountains.position.z = -25;
    backgroundMountains.position.y = -1;
    backgroundMountains.scale.set(1.5, 1, 1.5);
    mountains.add(backgroundMountains);
    
    // Create mid-distance mountains
    const midMountains = createMountainRange();
    midMountains.position.z = -20;
    midMountains.position.y = -2;
    midMountains.scale.set(1.2, 1.2, 1.2);
    mountains.add(midMountains);
    
    // Create foreground mountains
    const foregroundMountains = createMountainRange();
    foregroundMountains.position.z = -15;
    foregroundMountains.position.y = -3;
    foregroundMountains.scale.set(0.8, 0.7, 0.8);
    mountains.add(foregroundMountains);
    
    return mountains;
}