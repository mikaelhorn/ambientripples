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
                playing: false,
                halfSpeed: false
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

// Function to update playback speed
function updateLoopSpeed(index, halfSpeed) {
    if (audioLoops[index] && audioLoops[index].source) {
        const source = audioLoops[index].source;
        const currentGain = audioLoops[index].gainNode.gain.value;
        const wasPlaying = currentGain > 0;
        
        // Store the half speed state
        audioLoops[index].halfSpeed = halfSpeed;
        
        // Create new source with updated playback rate
        const newSource = audioContext.createBufferSource();
        newSource.buffer = source.buffer;
        newSource.loop = true;
        
        // Set playback rate (0.5 for half speed, 1 for normal)
        newSource.playbackRate.value = halfSpeed ? 0.5 : 1;
        
        // Connect new source
        newSource.connect(audioLoops[index].gainNode);
        
        // Start the new source
        newSource.start(0);
        
        // Stop the old source
        source.stop();
        
        // Update the source reference
        audioLoops[index].source = newSource;
        
        console.log(`Loop ${index + 1} speed set to ${halfSpeed ? 'half' : 'normal'}`);
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
window.updateLoopSpeed = updateLoopSpeed;
window.getAudioData = getAudioData;