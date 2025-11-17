/**
 * iPhone UI Configuration (LANDSCAPE MODE)
 *
 * Safe Area trong landscape:
 * - LEFT: Notch (~44-50px) - bên trái màn hình
 * - RIGHT: Home indicator (~34-44px) - bên phải màn hình
 * - TOP: Status bar nếu có (~20-24px) hoặc 0px nếu fullscreen
 * - BOTTOM: Thường ~0px (không có gì)
 */

export const iPhoneUIConfig = {
  // Device identification
  deviceType: 'iPhone',

  // Safe area insets cho LANDSCAPE (đọc từ CSS env variables + fallback)
  getSafeAreaInsets: () => {
    let top = 0, right = 0, bottom = 10, left = 0;
    return { top, right, bottom, left };
  },

  // UI Margins (added to safe area insets)
  margins: {
    top: 8,     // Margin from top (thêm vào safe area top nếu có)
    left: 10,   // Margin from left (thêm vào notch safe area)
    right: 10,  // Margin from right (thêm vào home indicator safe area)
    bottom: 8   // Margin from bottom (landscape không cần nhiều)
  },

  // Font sizes for landscape
  fonts: {
    baseFontSize: 14,
    smallFontSize: 11,
    padding: 3,
    lineSpacing: 18
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
