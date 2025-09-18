// ==============================================================================
// VERTICAL SCROLLER WITH HORIZONTAL PARALLAX EFFECT
// ==============================================================================
// This script creates the illusion of horizontal movement through vertical scrolling
// Different layers move at different speeds to create depth (parallax effect)
// The truck stays fixed while the world moves behind it

// ==============================================================================
// TRUCK WHEELS SPINNING ANIMATION
// ==============================================================================

// Wait for all HTML elements to be fully loaded before running code
document.addEventListener('DOMContentLoaded', function() {
    // Get references to the left and right truck wheel elements from the DOM
    const leftWheel = document.querySelector('.truck-left-wheel');
    const rightWheel = document.querySelector('.truck-right-wheel');
    
    // Variables to track scroll and mouse movement for wheel rotation
    let lastScrollY = window.pageYOffset; // Store previous scroll position to calculate delta
    let wheelRotation = 0; // Accumulator for total wheel rotation in degrees
    let lastMouseX = null; // Track previous mouse X position to calculate movement
    let mouseAccel = 0; // Current mouse acceleration value
    let mouseAccelDecay = 0; // Decaying mouse acceleration for smooth effect

    // Function to rotate both truck wheels based on movement
    function spinWheels(delta, accel) {
        // Safety check: ensure wheel elements exist before trying to manipulate them
        if (!leftWheel || !rightWheel) return;
        
        // delta: how much we scrolled (positive = down, negative = up)
        // accel: mouse acceleration to add extra spinning effect
        
        // Calculate base spinning speed from scroll movement
        const baseSpeed = delta * 1.5; // Multiply by 1.5 to make rotation more visible
        
        // Calculate additional speed from mouse acceleration  
        const accelSpeed = accel * 0.8; // Multiply by 0.8 to make mouse effect less intense
        
        // Add both speeds to the total wheel rotation
        wheelRotation += baseSpeed + accelSpeed;
        
        // Apply the rotation transformation to both wheels
        // CSS transform rotate() function rotates elements by specified degrees
        leftWheel.style.transform = `rotate(${wheelRotation}deg)`;
        rightWheel.style.transform = `rotate(${wheelRotation}deg)`;
    }

    // Listen for scroll events to spin wheels based on scroll movement
    window.addEventListener('scroll', () => {
        // Get current scroll position
        const currentScrollY = window.pageYOffset;
        
        // Calculate how much we scrolled since last time (delta)
        const delta = currentScrollY - lastScrollY;
        
        // Spin wheels based on scroll delta and current mouse acceleration decay
        spinWheels(delta, mouseAccelDecay);
        
        // Update last scroll position for next calculation
        lastScrollY = currentScrollY;
    });

    // Listen for mouse movement to add extra wheel spinning effect
    window.addEventListener('mousemove', (e) => {
        // Only calculate acceleration if we have a previous mouse position
        if (lastMouseX !== null) {
            // e.movementX gives us the horizontal mouse movement since last event
            mouseAccel = e.movementX;
            
            // Set the decay value to current acceleration
            mouseAccelDecay = mouseAccel;
            
            // After 20ms, reset the decay to 0 so the effect fades quickly
            setTimeout(() => { mouseAccelDecay = 0; }, 20);
        }
        
        // Store current mouse X position for next calculation
        lastMouseX = e.clientX;
    });
});

// ==============================================================================
// MAIN HORIZONTAL PARALLAX SCROLLER CLASS
// ==============================================================================
// This class handles the core parallax effect that makes vertical scrolling
// appear as horizontal movement with multiple layers moving at different speeds

class HorizontalParallaxScroller {
    // Constructor runs when we create a new instance of this class
    constructor() {
        // === PARALLAX LAYER REFERENCES ===
        // Get references to the three main parallax layers from the DOM
        this.backgroundLayer = document.querySelector('.background-layer'); // Furthest back, moves slowest
        this.middleLayer = document.querySelector('.middle-layer'); // Middle depth, normal speed
        this.foregroundLayer = document.querySelector('.foreground-layer'); // Closest, moves fastest
        
        // === INTERACTIVE ELEMENT REFERENCES ===
        // Get references to interactive elements that trigger animations
        this.stopSign = document.querySelector('.stop-sign'); // Stop sign that becomes visible
        this.blueArrow = document.querySelector('.blue-arrow'); // Arrow that appears near stop sign
        this.cyberPlaza1 = document.querySelector('.cyber-plaza1'); // First interactive image
        this.cyberPlaza2 = document.querySelector('.cyber-plaza2'); // Second interactive image
        
        // === PARALLAX SPEED CONFIGURATION ===
        // These values control how fast each layer moves relative to scroll
        // Lower values = slower movement, higher values = faster movement
        this.parallaxSpeeds = {
            background: 0.3,  // Background moves at 30% of scroll speed (slowest)
            middle: 1,        // Middle moves at 100% of scroll speed (normal)
            foreground: 1     // Foreground moves at 100% of scroll speed (fastest)
        };
        
        // === IMAGE DIMENSIONS ===
        // The actual pixel dimensions of your background image
        this.originalImageWidth = 4096; // Width of the source image file
        this.originalImageHeight = 599; // Height of the source image file
        
        // === ANIMATION STATE TRACKING ===
        // Variables to track the current state of animations
        this.hasTriggeredAnimation = false; // Has the stop sign animation been triggered?
        this.truckPosition = 0; // Truck stays at 0px from left (fixed position)
        
        // Start the initialization process
        this.init();
    }
    
    // Initialize all the scroller functionality
    init() {
        // Calculate how big the image should appear on screen
        this.calculateImageSize();
        
        // Calculate how much the user needs to scroll
        this.calculateScrollArea();
        
        // === BIND EVENT LISTENERS ===
        // Listen for scroll events, bind 'this' context so methods can access class properties
        // { passive: true } tells browser this listener won't prevent default behavior (performance optimization)
        window.addEventListener('scroll', this.onScroll.bind(this), { passive: true });
        
        // Listen for window resize events to recalculate dimensions
        window.addEventListener('resize', this.onResize.bind(this));
        
        // Add touch/swipe support for mobile devices
        this.addTouchSupport();
    }
    
    // Calculate the stop sign's position as a percentage of the image width
    getStopSignPositionPercent() {
        // Safety check: ensure stop sign element exists
        if (!this.stopSign) return 0;
        
        // Get the computed CSS styles for the stop sign element
        const computedStyle = window.getComputedStyle(this.stopSign);
        
        // Get the 'left' CSS property value (e.g., "32%" or "200px")
        const leftValue = computedStyle.getPropertyValue('left');
        
        // Check if the value is in percentage format
        if (leftValue.includes('%')) {
            // Remove the '%' symbol and convert to number (e.g., "32%" -> 32)
            return parseFloat(leftValue.replace('%', ''));
        }
        
        // Fallback: if value is in pixels, convert to percentage
        const leftPx = parseFloat(leftValue); // Convert pixel value to number
        return (leftPx / this.displayedImageWidth) * 100; // Convert to percentage of image width
    }
    
    // Add touch/swipe support for mobile devices
    addTouchSupport() {
        // Variables to track touch start and end positions
        let touchStartX = 0; // X coordinate where touch started
        let touchEndX = 0;   // X coordinate where touch ended
        
        // Listen for touch start events (user puts finger down)
        document.addEventListener('touchstart', (e) => {
            // Record the X coordinate where the touch started
            // changedTouches[0] gives us the first touch point
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true }); // passive: true for better performance
        
        // Listen for touch end events (user lifts finger)
        document.addEventListener('touchend', (e) => {
            // Record the X coordinate where the touch ended
            touchEndX = e.changedTouches[0].screenX;
            
            // Process the swipe gesture
            this.handleSwipe(touchStartX, touchEndX);
        }, { passive: true });
    }
    
    // Process swipe gestures and convert them to scroll actions
    handleSwipe(startX, endX) {
        // Minimum distance required to register as a swipe (50 pixels)
        const swipeThreshold = 50;
        
        // Calculate total swipe distance (positive = right swipe, negative = left swipe)
        const swipeDistance = endX - startX;
        
        // Only process swipes that meet the minimum threshold
        if (Math.abs(swipeDistance) > swipeThreshold) {
            // Calculate how much to scroll (half the screen width)
            const scrollAmount = window.innerWidth * 0.5;
            
            // Determine swipe direction and scroll accordingly
            if (swipeDistance > 0) {
                // Swipe right = scroll backward (up the page)
                window.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
            } else {
                // Swipe left = scroll forward (down the page)
                window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
            }
        }
    }
    
    // Calculate how big the image should appear based on screen size
    calculateImageSize() {
        // Get current browser window dimensions
        const viewportHeight = window.innerHeight; // Height of visible browser area
        const viewportWidth = window.innerWidth;   // Width of visible browser area
        
        // Calculate the aspect ratio of the original image
        const imageAspectRatio = this.originalImageWidth / this.originalImageHeight;
        
        // Calculate image width to fit the full viewport height while maintaining aspect ratio
        let calculatedWidth = (viewportHeight * imageAspectRatio);
        
        // === MOBILE OPTIMIZATION ===
        // On narrow screens (mobile), limit the maximum width to prevent excessive scrolling
        if (viewportWidth < 768) { // 768px is common tablet/mobile breakpoint
            // Limit maximum width to 8 times the screen width
            const maxMobileWidth = viewportWidth * 8;
            // Use whichever is smaller: calculated width or mobile limit
            calculatedWidth = Math.min(calculatedWidth, maxMobileWidth);
        }
        
        // Store the final calculated width
        this.displayedImageWidth = calculatedWidth;
        
        // Update all layer widths to match the calculated image size
        this.updateLayerSizes();
        
        // Debug logging to help understand the calculations
        console.log('Viewport:', viewportWidth, 'x', viewportHeight);
        console.log('Displayed image width:', this.displayedImageWidth);
    }
    
    // Update the CSS width of all parallax layers to match the image size
    updateLayerSizes() {
        // Set width for background layer (if it exists)
        if (this.backgroundLayer) {
            this.backgroundLayer.style.width = `${this.displayedImageWidth}px`;
        }
        
        // Set width for middle layer (if it exists)
        if (this.middleLayer) {
            this.middleLayer.style.width = `${this.displayedImageWidth}px`;
        }
        
        // Set width for foreground layer (if it exists)
        if (this.foregroundLayer) {
            this.foregroundLayer.style.width = `${this.displayedImageWidth}px`;
        }
    }
    
    // Calculate how much scrolling area we need and set up the document height
    calculateScrollArea() {
        // Calculate maximum distance layers need to move
        // This is the image width minus viewport width (how much is "hidden" off-screen)
        const calculatedMaxScroll = Math.max(this.displayedImageWidth - window.innerWidth, 0);
        
        // Set a custom limit to prevent excessive scrolling
        const customScrollLimit = 3000; // Maximum scroll distance in pixels - adjust this as needed
        
        // Use whichever is smaller: calculated scroll distance or our custom limit
        this.maxScroll = Math.min(calculatedMaxScroll, customScrollLimit);
        
        // Set the document height to create the right amount of scrollable space
        // We add window.innerHeight so the page has content that fills the screen
        document.documentElement.style.height = `${this.maxScroll + window.innerHeight}px`;
        
        // Debug logging to understand scroll calculations
        console.log('Calculated max scroll:', calculatedMaxScroll);
        console.log('Limited max scroll:', this.maxScroll);
    }
    
    // Main scroll event handler - this runs every time the user scrolls
    onScroll() {
        // Get current scroll position (how far down the page we've scrolled)
        const scrollTop = window.pageYOffset;
        
        // Calculate scroll progress as a value between 0 and 1
        // 0 = at top of page, 1 = scrolled to maximum distance
        const scrollProgress = this.maxScroll > 0 ? Math.min(scrollTop / this.maxScroll, 1) : 0;
        
        // === CALCULATE MOVEMENT DISTANCES FOR EACH LAYER ===
        // Base distance: how far to move if parallax speed is 1.0
        const baseMoveDistance = scrollProgress * this.maxScroll;
        
        // Calculate actual movement for each layer using their parallax speeds
        const backgroundMoveDistance = baseMoveDistance * this.parallaxSpeeds.background; // Moves slowest
        const middleMoveDistance = baseMoveDistance * this.parallaxSpeeds.middle;         // Moves at normal speed
        const foregroundMoveDistance = baseMoveDistance * this.parallaxSpeeds.foreground; // Moves fastest
        
        // === APPLY TRANSFORMS TO MOVE EACH LAYER ===
        // Move background layer (translateX with negative value moves left)
        if (this.backgroundLayer) {
            this.backgroundLayer.style.transform = `translateX(-${backgroundMoveDistance}px)`;
        }
        
        // Move middle layer
        if (this.middleLayer) {
            this.middleLayer.style.transform = `translateX(-${middleMoveDistance}px)`;
        }
        
        // Move foreground layer
        if (this.foregroundLayer) {
            this.foregroundLayer.style.transform = `translateX(-${foregroundMoveDistance}px)`;
        }
        
        // Check if truck has reached the stop sign (using middle layer distance since stop sign is in middle layer)
        this.checkTruckStopSignCollision(middleMoveDistance);
    }
    
    // Check if the fixed truck has "collided" with the moving stop sign
    checkTruckStopSignCollision(moveDistance) {
        // Get stop sign position as percentage of image width (from CSS)
        const stopSignPositionPercent = this.getStopSignPositionPercent();
        
        // Convert percentage to actual pixel position
        const stopSignPositionPx = (stopSignPositionPercent / 100) * this.displayedImageWidth;
        
        // Calculate trigger point: 650 pixels before the stop sign
        // This creates a "collision zone" so animations trigger before the truck reaches the sign
        const triggerPoint = stopSignPositionPx - 650;
        
        // Check if we should trigger animations (truck moving forward and reaching trigger point)
        if (!this.hasTriggeredAnimation && moveDistance >= triggerPoint) {
            // Trigger all the animations
            this.triggerAnimations();
            // Mark that we've triggered them so we don't trigger again
            this.hasTriggeredAnimation = true;
        }
        // Check if we should reset animations (truck moving backward past trigger point)
        else if (this.hasTriggeredAnimation && moveDistance < triggerPoint) {
            // Reset all animations back to initial state
            this.resetAnimations();
            // Mark that we haven't triggered them so they can trigger again if we move forward
            this.hasTriggeredAnimation = false;
        }
    }
    
    // Trigger all animations when truck reaches stop sign
    triggerAnimations() {
        // Make stop sign fully visible (add 'active' CSS class)
        if (this.stopSign) {
            this.stopSign.classList.add('active');
        }
        
        // Show blue arrow gif (add 'active' CSS class)
        if (this.blueArrow) {
            this.blueArrow.classList.add('active');
        }
        
        // Activate cyber plaza images: add borders and expand them
        if (this.cyberPlaza1) {
            this.cyberPlaza1.classList.add('active');   // Add border effect
            this.cyberPlaza1.classList.add('expanded'); // Make image larger
        }
        
        if (this.cyberPlaza2) {
            this.cyberPlaza2.classList.add('active');   // Add border effect
            this.cyberPlaza2.classList.add('expanded'); // Make image larger
        }
        
        // Debug logging
        console.log('Truck reached stop sign! Blue arrow gif and cyber plaza borders triggered.');
    }
    
    // Reset all animations back to initial state
    resetAnimations() {
        // Hide stop sign (remove 'active' CSS class, returns to lower opacity)
        if (this.stopSign) {
            this.stopSign.classList.remove('active');
        }
        
        // Hide blue arrow gif (remove 'active' CSS class)
        if (this.blueArrow) {
            this.blueArrow.classList.remove('active');
        }
        
        // Reset cyber plaza images: remove borders and return to normal size
        if (this.cyberPlaza1) {
            this.cyberPlaza1.classList.remove('active');   // Remove border effect
            this.cyberPlaza1.classList.remove('expanded'); // Return to normal size
        }
        
        if (this.cyberPlaza2) {
            this.cyberPlaza2.classList.remove('active');   // Remove border effect
            this.cyberPlaza2.classList.remove('expanded'); // Return to normal size
        }
        
        // Debug logging
        console.log('Truck moved back! Blue arrow gif and cyber plaza borders hidden.');
    }
    
    // Handle window resize events
    onResize() {
        // Recalculate image size for new window dimensions
        this.calculateImageSize();
        
        // Recalculate scroll area for new dimensions
        this.calculateScrollArea();
        
        // Update current position based on new calculations
        this.onScroll();
        
        // Reset animation state to prevent issues after resize
        this.resetAnimationState();
    }
    
    // Reset animation state (used during resize)
    resetAnimationState() {
        // Mark animations as not triggered
        this.hasTriggeredAnimation = false;
        
        // Reset all visual animations to initial state
        this.resetAnimations();
    }
}

// ==============================================================================
// INITIALIZATION AND IMAGE MODAL FUNCTIONALITY
// ==============================================================================

// Initialize everything when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create and start the parallax scroller
    new HorizontalParallaxScroller();
    
    // Set up the image expansion modal functionality
    setupImageExpansion();
});

// Function to handle clicking on images to expand them in a modal
function setupImageExpansion() {
    // === GET MODAL ELEMENTS ===
    // Get references to modal elements from the DOM
    const modal = document.getElementById('image-modal');        // The modal overlay container
    const expandedImg = document.getElementById('expanded-image'); // The large image inside modal
    const closeBtn = document.querySelector('.close-modal');     // The X button to close modal
    const imageLinks = document.querySelectorAll('.image-link'); // All clickable image links
    
    // === ADD CLICK LISTENERS TO IMAGES ===
    // Add click event listener to each image link
    imageLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Prevent the default link behavior (don't navigate)
            e.preventDefault();
            
            // Find the img element inside this link
            const img = link.querySelector('img');
            
            // Set the modal's image source to match the clicked image
            expandedImg.src = img.src;
            
            // Show the modal by adding 'active' CSS class
            modal.classList.add('active');
            
            // Prevent page scrolling while modal is open
            document.body.style.overflow = 'hidden';
        });
    });
    
    // === CLOSE MODAL WITH X BUTTON ===
    // Add click listener to the close button
    closeBtn.addEventListener('click', function() {
        // Hide modal by removing 'active' CSS class
        modal.classList.remove('active');
        
        // Restore page scrolling
        document.body.style.overflow = '';
    });
    
    // === CLOSE MODAL BY CLICKING OUTSIDE IMAGE ===
    // Add click listener to the modal container
    modal.addEventListener('click', function(e) {
        // Only close if user clicked the modal background (not the image itself)
        if (e.target === modal) {
            // Hide modal
            modal.classList.remove('active');
            
            // Restore page scrolling
            document.body.style.overflow = '';
        }
    });
    
    // === CLOSE MODAL WITH ESCAPE KEY ===
    // Add keyboard listener for escape key
    document.addEventListener('keydown', function(e) {
        // Check if escape key was pressed AND modal is currently open
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            // Hide modal
            modal.classList.remove('active');
            
            // Restore page scrolling
            document.body.style.overflow = '';
        }
    });
}

// ==============================================================================
// HOW THE PARALLAX EFFECT WORKS - SUMMARY
// ==============================================================================
/*
1. USER SCROLLS VERTICALLY: User scrolls down the page normally

2. LAYERS MOVE HORIZONTALLY: Instead of content moving up/down, the layers move left/right at different speeds

3. PARALLAX SPEEDS CREATE DEPTH:
   - Background layer moves slowest (30% speed) = appears furthest away
   - Middle layer moves normal speed (100% speed) = appears at normal depth  
   - Foreground layer moves fastest (100% speed) = appears closest

4. TRUCK STAYS FIXED: The truck never moves - it's positioned fixed on screen

5. COLLISION DETECTION: As layers move, we calculate when the stop sign (in middle layer) 
   reaches the truck's position, then trigger animations

6. RESPONSIVE DESIGN: Image size and scroll distances adjust based on screen size

This creates the illusion that the truck is driving horizontally through a landscape,
when actually the user is just scrolling vertically and the landscape is moving past the truck.
*/