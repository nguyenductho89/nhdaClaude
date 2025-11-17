/**
 * Android UI Configuration (LANDSCAPE MODE)
 *
 * Safe Area trong landscape:
 * - LEFT: ~0px (thường không có notch bên trái)
 * - RIGHT: ~0px (thường không có notch bên phải)
 * - BOTTOM: Navigation bar (~48-96px nếu có) hoặc gesture area (~20-30px)
 * - TOP: Status bar có thể xuất hiện (~24px) hoặc ~0px
 *
 * Lưu ý: Android rất đa dạng, có nhiều loại màn hình khác nhau
 */

export const androidUIConfig = {
  // Device identification
  deviceType: 'Android',

  // Safe area insets cho LANDSCAPE
  getSafeAreaInsets: () => {
    let top = 0, right = 0, bottom = 0, left = 0;

    // Try to read from CSS environment variables (Android Chrome 91+)
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

      document.body.appendChild(testDiv);
      const computed = window.getComputedStyle(testDiv);
      top = parseFloat(computed.paddingTop) || 0;
      right = parseFloat(computed.paddingRight) || 0;
      bottom = parseFloat(computed.paddingBottom) || 0;
      left = parseFloat(computed.paddingLeft) || 0;
      document.body.removeChild(testDiv);
    }

    // Fallback values for Android in landscape
    // Many Android devices have navigation bar at bottom even in landscape
    if (bottom === 0) {
      console.warn('⚠️ Android: Could not read safe area, using fallback');
      // Assume navigation bar or gesture area at bottom
      bottom = 48; // Navigation bar height in landscape (typical)

      // Some devices have status bar at top in landscape
      if (top === 0) {
        top = 0; // Usually hidden in fullscreen, but safe to add small value
      }
    }

    // Ensure minimum bottom spacing for navigation bar
    if (bottom < 20) {
      bottom = 48; // Ensure enough space for navigation bar
    }

    console.log('🤖 Android Safe Area (Landscape):', { top, right, bottom, left });
    return { top, right, bottom, left };
  },

  // UI Margins (added to safe area insets)
  margins: {
    top: 8,
    left: 8,
    right: 8,
    bottom: 20  // Extra margin for navigation bar
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
    rightMargin: 15,  // Margin from right edge
    bottomMargin: 25  // Extra margin from bottom edge (navigation bar)
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
