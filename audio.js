// Web Audio API setup
let audioContext;
let analyser;
let audioData;

// Audio loops setup
const audioLoops = [];
const NUM_LOOPS = 4;

// Initialize audio functionality
function initAudio() {
    try {
        // Create audio context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create analyser node
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;
        
        // Connect the analyser to the destination
        analyser.connect(audioContext.destination);
        
        // Create array to hold audio data
        audioData = new Uint8Array(analyser.frequencyBinCount);
        
        // Initialize audio loops
        initializeAudioLoops();
        
        console.log('Audio system initialized');
    } catch (error) {
        console.error('Web Audio API error: ', error);
    }
}

// Initialize audio loops
async function initializeAudioLoops() {
    for (let i = 0; i < NUM_LOOPS; i++) {
        const loopNumber = i + 1;
        try {
            const response = await fetch(`loop${loopNumber}.mp3`);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            // Create nodes for this loop
            const source = audioContext.createBufferSource();
            const gainNode = audioContext.createGain();
            
            // Set up the audio buffer and looping
            source.buffer = audioBuffer;
            source.loop = true;
            
            // Connect nodes
            source.connect(gainNode);
            gainNode.connect(analyser);
            
            // Store the nodes
            audioLoops[i] = {
                source,
                gainNode,
                playing: false
            };
            
            // Start the loop (it will be silent until gain is adjusted)
            source.start(0);
            gainNode.gain.value = 0; // Start with volume at 0
            
            console.log(`Loop ${loopNumber} loaded successfully`);
        } catch (error) {
            console.error(`Error loading loop ${loopNumber}:`, error);
        }
    }
}

// Function to update volume for a specific loop
function updateLoopVolume(index, volume) {
    if (audioLoops[index] && audioLoops[index].gainNode) {
        // Smooth volume transition
        const gainNode = audioLoops[index].gainNode;
        gainNode.gain.setTargetAtTime(volume, audioContext.currentTime, 0.1);
    }
}

// Function to get current audio data
function getAudioData() {
    if (analyser) {
        analyser.getByteFrequencyData(audioData);
        return audioData;
    }
    return null;
}

// Initialize audio system when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Audio will be started by user interaction
    document.addEventListener('click', () => {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    });
});

// Make functions available globally
window.initAudio = initAudio;
window.updateLoopVolume = updateLoopVolume;
window.getAudioData = getAudioData;