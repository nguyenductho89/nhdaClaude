/**
 * Safe Area Detection Service
 * Detects safe area insets from CSS environment variables
 * Handles iPhone notch, Android punch-hole cameras, and navigation bars
 */

/**
 * Get safe area insets from CSS env() variables
 * Returns pixel values for all 4 sides
 */
export const getSafeAreaInsets = () => {
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };

  // Try to get from CSS env() - most reliable method
  if (typeof CSS !== 'undefined' && CSS.supports) {
    const testDiv = document.createElement('div');
    testDiv.style.cssText = `
      position: absolute;
      visibility: hidden;
      top: -9999px;
      padding-top: env(safe-area-inset-top, 0px);
      padding-right: env(safe-area-inset-right, 0px);
      padding-bottom: env(safe-area-inset-bottom, 0px);
      padding-left: env(safe-area-inset-left, 0px);
    `;
    document.body.appendChild(testDiv);

    const computed = window.getComputedStyle(testDiv);
    insets.top = parseFloat(computed.paddingTop) || 0;
    insets.right = parseFloat(computed.paddingRight) || 0;
    insets.bottom = parseFloat(computed.paddingBottom) || 0;
    insets.left = parseFloat(computed.paddingLeft) || 0;

    document.body.removeChild(testDiv);

    console.log('[SafeArea] Detected from CSS env():', insets);
  }

  // Fallback for devices that don't support CSS env() properly
  if (insets.top === 0 && insets.right === 0 && insets.bottom === 0 && insets.left === 0) {
    const isIPhone = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isLandscape = window.innerWidth > window.innerHeight;

    if (isIPhone && isLandscape) {
      // iPhone landscape - notch on sides
      // iPhone 12/13/14 Pro: left 44-47px, right 47-59px (Dynamic Island)
      // iPhone X/11: left 44px, right 44px
      insets.left = 47;  // Safe value for all notched iPhones
      insets.right = 59; // Safe value for Dynamic Island
      insets.top = 0;
      insets.bottom = 21; // Home indicator

      console.log('[SafeArea] Using iPhone landscape fallback:', insets);
    } else if (isIPhone) {
      // iPhone portrait - notch at top
      insets.top = 47;
      insets.bottom = 34; // Home indicator (larger in portrait)
      insets.left = 0;
      insets.right = 0;

      console.log('[SafeArea] Using iPhone portrait fallback:', insets);
    }
  }

  return insets;
};

/**
 * Get safe margins for UI positioning
 * Returns minimum safe margins to avoid notch/cutout with extra buffer for touch targets
 *
 * @param {string} orientation - 'landscape' or 'portrait' (auto-detected if not provided)
 * @returns {Object} margins - { top, right, bottom, left } in pixels
 */
export const getSafeMargins = (orientation = null) => {
  const insets = getSafeAreaInsets();
  const isLandscape = orientation === 'landscape' || (orientation === null && window.innerWidth > window.innerHeight);

  if (isLandscape) {
    return {
      top: Math.max(insets.top, 8),        // Minimum 8px even without notch
      right: Math.max(insets.right, 15),   // Extra buffer for notch + touch
      bottom: Math.max(insets.bottom, 8),  // Minimum for home indicator
      left: Math.max(insets.left, 15)      // Extra buffer for notch + touch
    };
  }

  // Portrait mode
  return {
    top: Math.max(insets.top, 10),       // Minimum for status bar
    right: Math.max(insets.right, 8),
    bottom: Math.max(insets.bottom, 10), // Minimum for home indicator
    left: Math.max(insets.left, 8)
  };
};

/**
 * Get safe content area dimensions
 * Returns the usable area excluding safe margins
 *
 * @returns {Object} area - { x, y, width, height }
 */
export const getSafeContentArea = () => {
  const margins = getSafeMargins();
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  return {
    x: margins.left,
    y: margins.top,
    width: windowWidth - margins.left - margins.right,
    height: windowHeight - margins.top - margins.bottom
  };
};

/**
 * Check if device has a notch or camera cutout
 *
 * @returns {boolean}
 */
export const hasNotch = () => {
  const insets = getSafeAreaInsets();
  const isLandscape = window.innerWidth > window.innerHeight;

  if (isLandscape) {
    // In landscape, notch affects left/right
    return insets.left > 20 || insets.right > 20;
  } else {
    // In portrait, notch affects top
    return insets.top > 24; // iOS status bar is 20px, notch is 44+px
  }
};

/**
 * Log safe area information for debugging
 */
export const logSafeAreaInfo = () => {
  const insets = getSafeAreaInsets();
  const margins = getSafeMargins();
  const contentArea = getSafeContentArea();
  const notch = hasNotch();

  console.group('[SafeArea] Device Information');
  console.log('Screen:', window.innerWidth, 'x', window.innerHeight);
  console.log('Orientation:', window.innerWidth > window.innerHeight ? 'Landscape' : 'Portrait');
  console.log('Has Notch/Cutout:', notch);
  console.log('Insets:', insets);
  console.log('Safe Margins:', margins);
  console.log('Safe Content Area:', contentArea);
  console.groupEnd();
};
