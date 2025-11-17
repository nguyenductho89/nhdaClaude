/**
 * iPhone UI Configuration (LANDSCAPE MODE)
 *
 * Safe Area trong landscape:
 * - LEFT: Notch (~44-50px)
 * - RIGHT: Home indicator (~34-44px)
 * - BOTTOM: Có thể có góc màn hình cong (~21px)
 * - TOP: Thường ~0px
 */

export const iPhoneUIConfig = {
  // Device identification
  deviceType: 'iPhone',

  // Safe area insets cho LANDSCAPE (đọc từ CSS env variables + fallback)
  getSafeAreaInsets: () => {
    let top = 0, right = 0, bottom = 0, left = 0;

    // Try to read from CSS environment variables
    if (typeof getComputedStyle !== 'undefined') {
      const testDiv = document.createElement('div');
      testDiv.style.position = 'fixed';
      testDiv.style.top = '0';
      testDiv.style.left = '0';
      testDiv.style.width = '1px';
      testDiv.style.height = '1px';
      testDiv.style.visibility = 'hidden';
      testDiv.style.pointerEvents = 'none';

      // Apply safe area padding
      testDiv.style.paddingTop = 'env(safe-area-inset-top, 0px)';
      testDiv.style.paddingRight = 'env(safe-area-inset-right, 0px)';
      testDiv.style.paddingBottom = 'env(safe-area-inset-bottom, 0px)';
      testDiv.style.paddingLeft = 'env(safe-area-inset-left, 0px)';

      // Fallback for older iOS
      testDiv.style.paddingTop = 'constant(safe-area-inset-top, 0px)';
      testDiv.style.paddingRight = 'constant(safe-area-inset-right, 0px)';
      testDiv.style.paddingBottom = 'constant(safe-area-inset-bottom, 0px)';
      testDiv.style.paddingLeft = 'constant(safe-area-inset-left, 0px)';

      document.body.appendChild(testDiv);
      const computed = window.getComputedStyle(testDiv);
      top = parseFloat(computed.paddingTop) || 0;
      right = parseFloat(computed.paddingRight) || 0;
      bottom = parseFloat(computed.paddingBottom) || 0;
      left = parseFloat(computed.paddingLeft) || 0;
      document.body.removeChild(testDiv);
    }

    // Fallback values for iPhone in landscape
    // iPhone with notch: left=44, right=34, bottom=21
    // Older iPhone: smaller values
    if (left === 0 && right === 0) {
      console.warn('⚠️ iPhone: Could not read safe area, using fallback');
      left = 44;   // Notch side
      right = 44;  // Home indicator side (increased to be safe)
      bottom = 21; // Rounded corners
    }

    // Make sure bottom has at least some padding for rounded corners
    if (bottom < 10) {
      bottom = 21; // Ensure enough space for rounded corners
    }

    console.log('🍎 iPhone Safe Area (Landscape):', { top, right, bottom, left });
    return { top, right, bottom, left };
  },

  // UI Margins (added to safe area insets)
  margins: {
    top: 8,
    left: 10,
    right: 10,
    bottom: 15  // Extra margin for bottom to avoid rounded corners
  },

  // Font sizes for landscape
  fonts: {
    baseFontSize: 14,
    smallFontSize: 11,
    padding: 3,
    lineSpacing: 18
  },

  // Jump button configuration
  jumpButton: {
    size: 80,
    rightMargin: 15,  // Extra margin from right edge
    bottomMargin: 20  // Extra margin from bottom edge
  },

  // Player positioning
  player: {
    baseX: 100,  // Base X position for smaller screens
    baseXLarge: 150  // Base X position for larger screens
  },

  // Spawn positions for obstacles/collectibles
  spawn: {
    rightOffset: 50,  // How far beyond right edge to spawn
    leftCleanup: -100  // How far past left edge to cleanup
  }
};
