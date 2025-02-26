// Three.js setup
let scene, camera, renderer;
let geometry, material, mesh;
let audioVisualizer;

init();
animate();

function init() {
    // Create scene
    scene = new THREE.Scene();
    
    // Create camera
    camera = new THREE.PerspectiveCamera(
        70,                                     // Field of view
        window.innerWidth / window.innerHeight, // Aspect ratio
        0.01,                                   // Near clipping plane
        10                                      // Far clipping plane
    );
    camera.position.z = 1;
    
    // Create a simple test mesh
    geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    material = new THREE.MeshNormalMaterial();
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    
    // Create audio visualizer
    createAudioVisualizer();
    
    // Setup renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container').appendChild(renderer.domElement);
    
    // Add UI controls
    addControls();
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
}

function createAudioVisualizer() {
    // Create a circle of cubes that will react to audio
    audioVisualizer = new THREE.Group();
    scene.add(audioVisualizer);
    
    const cubeSize = 0.05;
    const radius = 0.5;
    const numCubes = 32;
    
    for (let i = 0; i < numCubes; i++) {
        const angle = (i / numCubes) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        const cubeMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            emissive: 0x003333,
            specular: 0xffffff,
            shininess: 30
        });
        
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cube.position.set(x, y, 0);
        audioVisualizer.add(cube);
    }
    
    // Add lighting
    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(0, 0, 1);
    scene.add(light);
    
    const ambientLight = new THREE.AmbientLight(0x222222);
    scene.add(ambientLight);
}

function addControls() {
    // Create simple UI for starting audio input
    const startButton = document.createElement('button');
    startButton.textContent = 'Start Microphone';
    startButton.style.position = 'absolute';
    startButton.style.bottom = '20px';
    startButton.style.left = '20px';
    startButton.style.padding = '10px';
    startButton.style.zIndex = '100';
    startButton.addEventListener('click', () => {
        startMicrophoneInput();
    });
    document.body.appendChild(startButton);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    // Rotate the cube
    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.02;
    
    // Update audio visualization
    updateAudioVisualization();
    
    renderer.render(scene, camera);
}

function updateAudioVisualization() {
    // Get audio data from audio.js
    const audioData = typeof getAudioData === 'function' ? getAudioData() : null;
    
    if (audioData && audioVisualizer) {
        // Update visualizer based on audio data
        const children = audioVisualizer.children;
        const cubes = children.filter(child => child.type === 'Mesh');
        
        for (let i = 0; i < cubes.length; i++) {
            const cube = cubes[i];
            // Get audio data at intervals
            const dataIndex = Math.floor(i / cubes.length * audioData.length);
            const value = audioData[dataIndex] / 255;
            
            // Scale the cube based on audio data
            const scale = 0.05 + value * 0.3;
            cube.scale.y = scale;
            
            // Change color based on frequency
            const hue = (i / cubes.length) * 0.3 + 0.6; // Blue to purple range
            const saturation = 0.8;
            const lightness = 0.4 + value * 0.4;
            
            cube.material.emissive.setHSL(hue, saturation, lightness * 0.5);
            cube.material.color.setHSL(hue, saturation, lightness);
        }
        
        // Rotate the visualizer
        audioVisualizer.rotation.z += 0.002;
    }
}