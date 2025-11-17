/**
 * Desktop UI Configuration
 *
 * No safe area concerns on desktop
 * Larger margins and font sizes for better visibility
 */

export const desktopUIConfig = {
  // Device identification
  deviceType: 'Desktop',

  // No safe area insets needed for desktop
  getSafeAreaInsets: () => {
    console.log('🖥️ Desktop: No safe area insets needed');
    return {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };
  },

  // UI Margins (no safe area, just aesthetic spacing)
  margins: {
    top: 60,
    left: 20,
    right: 20,
    bottom: 20
  },

  // Font sizes for desktop (larger)
  fonts: {
    baseFontSize: 24,
    smallFontSize: 18,
    padding: 8,
    lineSpacing: 35
  },

  // Jump button configuration (not usually shown on desktop)
  jumpButton: {
    size: 0,  // Hidden on desktop
    rightMargin: 0,
    bottomMargin: 0
  },

  // Player positioning
  player: {
    baseX: 150,  // Fixed position
    baseXLarge: 150
  },

  // Spawn positions for obstacles/collectibles
  spawn: {
    rightOffset: 50,  // How far beyond right edge to spawn
    leftCleanup: -100  // How far past left edge to cleanup
  }
};
