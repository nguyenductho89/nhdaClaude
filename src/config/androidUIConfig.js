/**
 * Android UI Configuration (LANDSCAPE MODE)
 *
 * Safe Area trong landscape:
 * - LEFT: ~0px (thường không có notch bên trái)
 * - RIGHT: ~0px (thường không có notch bên phải)
 * - TOP: Status bar + Navigation bar (~24-48px) - CẢ HAI Ở TRÊN trong landscape!
 * - BOTTOM: ~0px (không có gì)
 *
 * Lưu ý: Trong landscape, Android đưa navigation bar LÊN TRÊN cùng với status bar
 */

export const androidUIConfig = {
  // Device identification
  deviceType: 'Android',

  // Safe area insets cho LANDSCAPE
  getSafeAreaInsets: () => {
    let top = 0, right = 0, bottom = 120, left = 0;
    console.log('🤖 Android Safe Area (Landscape):', { top, right, bottom, left });
    return { top, right, bottom, left };
  },

  // UI Margins (added to safe area insets)
  margins: {
    top: 10,    // Extra margin from top (status bar + nav bar ở trên)
    left: 8,
    right: 8,
    bottom: 8   // Bottom không cần nhiều (không có gì ở dưới)
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
    bottomMargin: 10  // Bottom margin (landscape không có nav bar ở dưới)
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
