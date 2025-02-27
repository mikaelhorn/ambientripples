$(document).ready(function() {
    // Initialize ripple effect on the container with subtle settings
    $('#container').ripples({
        resolution: 512,
        dropRadius: 8,
        perturbance: 0.02
    });

    // Initialize audio system
    initAudio();

    // Create UI container
    const uiContainer = $('<div id="ui-container"></div>').css({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 100
    }).appendTo('body');

    // Create volume sliders with reels
    const sliderContainer = createVolumeSliders();
    uiContainer.append(sliderContainer);

    // Function to create a reel
    function createReel(index) {
        const reelContainer = $('<div class="reel-container"></div>').css({
            width: '40px',
            height: '80px',
            position: 'relative',
            marginBottom: '10px'
        });

        const reel = $('<div class="reel"></div>').css({
            width: '40px',
            height: '40px',
            border: '2px solid white',
            borderRadius: '50%',
            position: 'relative',
            cursor: 'pointer'
        });

        // Add spokes to the reel
        for (let i = 0; i < 3; i++) {
            $('<div class="spoke"></div>').css({
                width: '2px',
                height: '36px',
                background: 'white',
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) rotate(${i * 60}deg)`,
                transformOrigin: 'center'
            }).appendTo(reel);
        }

        // Add play/pause state
        reel.data('playing', false);
        reel.data('rotation', 0);
        reel.data('animationId', null);

        // Click handler for the reel
        reel.on('click', function() {
            const isPlaying = !$(this).data('playing');
            $(this).data('playing', isPlaying);

            if (isPlaying) {
                // Start rotation animation
                startReelAnimation($(this), index);
                // Set volume based on slider position
                const slider = $(this).closest('.slider-unit').find('.slider');
                const handle = slider.find('.slider-handle');
                const sliderHeight = slider.height() - handle.height();
                const normalizedPosition = handle.position().top;
                const volume = 1 - (normalizedPosition / sliderHeight);
                updateLoopVolume(index, volume);
            } else {
                // Stop rotation animation
                stopReelAnimation($(this));
                // Mute the audio
                updateLoopVolume(index, 0);
            }
        });

        reelContainer.append(reel);
        return reelContainer;
    }
    
    // Function to create a speed switch
    function createSpeedSwitch(index) {
        const switchContainer = $('<div class="speed-switch-container"></div>').css({
            width: '40px',
            height: '30px',
            position: 'relative',
            marginTop: '25px',
            marginBottom: '15px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        });
        
        const speedSwitch = $('<div class="speed-switch"></div>').css({
            width: '40px',
            height: '20px',
            border: '2px solid white',
            borderRadius: '10px',
            position: 'relative',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease'
        });
        
        const switchHandle = $('<div class="switch-handle"></div>').css({
            width: '16px',
            height: '16px',
            background: 'white',
            borderRadius: '50%',
            position: 'absolute',
            top: '0',
            left: '0',
            transition: 'left 0.2s ease'
        });
        
        const speedLabel = $('<div class="speed-label">½</div>').css({
            color: 'white',
            fontSize: '14px',
            position: 'absolute',
            bottom: '-20px',
            width: '100%',
            textAlign: 'center'
        });
        
        speedSwitch.append(switchHandle);
        switchContainer.append(speedSwitch, speedLabel);
        
        // Track switch state
        speedSwitch.data('active', false);
        
        // Click handler for the switch
        speedSwitch.on('click', function() {
            const isActive = !$(this).data('active');
            $(this).data('active', isActive);
            
            if (isActive) {
                $(this).css('backgroundColor', 'rgba(255, 255, 255, 0.3)');
                switchHandle.css('left', '20px');
                // Set half speed
                updateLoopSpeed(index, true);
            } else {
                $(this).css('backgroundColor', 'transparent');
                switchHandle.css('left', '0');
                // Set normal speed
                updateLoopSpeed(index, false);
            }
            
            // Adjust rotation speed if reel is playing
            const reel = $(this).closest('.slider-unit').find('.reel');
            if (reel.data('playing')) {
                // Restart animation with new speed
                stopReelAnimation(reel);
                startReelAnimation(reel, index);
            }
        });
        
        return switchContainer;
    }

    // Function to create volume sliders
    function createVolumeSliders() {
        const sliderContainer = $('<div class="slider-container"></div>').css({
            display: 'flex',
            justifyContent: 'space-between',
            width: '300px',
            opacity: '0.9',
            padding: '10px'
        });

        // Create 4 slider units (reel + slider + switch)
        for (let i = 0; i < 4; i++) {
            const sliderUnit = $('<div class="slider-unit"></div>').css({
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            });

            const reel = createReel(i);
            const slider = createSlider(i);
            const speedSwitch = createSpeedSwitch(i);
            
            sliderUnit.append(reel, slider, speedSwitch);
            sliderContainer.append(sliderUnit);
        }

        return sliderContainer;
    }

    // Function to create a single slider
    function createSlider(index) {
        const slider = $('<div class="slider"></div>').css({
            width: '40px',
            height: '150px',
            border: '2px solid white',
            borderRadius: '8px',
            position: 'relative',
            overflow: 'hidden'
        });

        // Create slider handle
        const handle = $('<div class="slider-handle"></div>').css({
            width: '100%',
            height: '20px',
            background: 'white',
            position: 'absolute',
            left: 0,
            top: '126px',
            borderRadius: '4px',
            cursor: 'pointer'
        });

        slider.append(handle);

        // Make handle draggable for mouse events
        handle.draggable({
            axis: 'y',
            containment: 'parent',
            drag: function(event, ui) {
                ui.position.left = 0;
                updateSliderVolume($(this), index);
            }
        });

        // Add touch event support
        handle.on('touchstart', function(e) {
            e.preventDefault();
            $(this).addClass('dragging');
        });

        handle.on('touchmove', function(e) {
            e.preventDefault();
            if ($(this).hasClass('dragging')) {
                const touch = e.originalEvent.touches[0];
                const sliderOffset = slider.offset();
                const handleHeight = handle.height();
                const sliderHeight = slider.height() - handleHeight;
                
                // Calculate new position based on touch point
                let newTop = touch.pageY - sliderOffset.top - (handleHeight / 2);
                
                // Constrain within slider
                newTop = Math.max(0, Math.min(sliderHeight, newTop));
                
                // Update handle position
                handle.css('top', newTop + 'px');
                
                // Update volume
                updateSliderVolume($(this), index);
            }
        });

        handle.on('touchend touchcancel', function(e) {
            e.preventDefault();
            $(this).removeClass('dragging');
        });

        return slider;
    }

    // Helper function to update volume based on slider position
    function updateSliderVolume(handle, index) {
        const slider = handle.closest('.slider');
        const sliderHeight = slider.height() - handle.height();
        const normalizedPosition = handle.position().top;
        const volume = 1 - (normalizedPosition / sliderHeight);
        
        // Only update volume if the reel is playing
        const reel = handle.closest('.slider-unit').find('.reel');
        if (reel.data('playing')) {
            updateLoopVolume(index, volume);
        }
    }

    // Reel animation functions
    function startReelAnimation(reel, index) {
        if (reel.data('animationId')) return;

        // Check if half speed mode is active
        const speedSwitch = reel.closest('.slider-unit').find('.speed-switch');
        const isHalfSpeed = speedSwitch.data('active');
        const rotationSpeed = isHalfSpeed ? 1 : 2; // Adjust rotation speed based on switch state

        function animate() {
            let rotation = reel.data('rotation') || 0;
            rotation += rotationSpeed; // Use the dynamic rotation speed
            reel.data('rotation', rotation);
            
            reel.find('.spoke').css('transform', 
                `translate(-50%, -50%) rotate(${rotation}deg)`);

            // Create subtle ripple effect
            if (rotation % 90 === 0) { // Changed from 30 to 90 to make ripples less frequent
                const reelOffset = reel.offset();
                const centerX = reelOffset.left + reel.width() / 2;
                const centerY = reelOffset.top + reel.height() / 2;
                
                const containerOffset = $('#container').offset();
                const rippleX = centerX - containerOffset.left;
                const rippleY = centerY - containerOffset.top;
                
                $('#container').ripples('drop', rippleX, rippleY, 15, 0.008); // Reduced perturbance from 0.015 to 0.008
            }

            const animationId = requestAnimationFrame(animate);
            reel.data('animationId', animationId);
        }

        animate();
    }

    function stopReelAnimation(reel) {
        const animationId = reel.data('animationId');
        if (animationId) {
            cancelAnimationFrame(animationId);
            reel.data('animationId', null);
        }
    }

    // Function to create a random ripple
    function createRandomRipple() {
        const $el = $('#container');
        const x = Math.random() * $el.width();
        const y = Math.random() * $el.height();
        $el.ripples('drop', x, y, 15, 0.02); // Reduced radius and perturbance
    }

    // Create occasional random ripples (less frequently)
    setInterval(createRandomRipple, 4000); // Increased interval from 3000 to 4000

    // Create more subtle ripple on click
    $('#container').on('click', function(e) {
        $(this).ripples('drop', e.offsetX, e.offsetY, 20, 0.05); // Reduced perturbance from 0.1
    });

    // Clean up ripples when window is resized
    let resizeTimeout;
    $(window).on('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            $('#container').ripples('destroy');
            $('#container').ripples({
                resolution: 512,
                dropRadius: 15,
                perturbance: 0.02
            });
        }, 100);
    });

    // Add touch support for the speed switches
    $(document).on('touchstart', '.speed-switch', function(e) {
        e.preventDefault();
        $(this).trigger('click');
    });

    // Add touch support for the reels
    $(document).on('touchstart', '.reel', function(e) {
        e.preventDefault();
        $(this).trigger('click');
    });
});