/**
 * Device Detection and Safe Area Utilities
 * For landscape-oriented game
 *
 * Loads device-specific UI configuration
 */

import { iPhoneUIConfig } from '../config/iPhoneUIConfig.js';
import { androidUIConfig } from '../config/androidUIConfig.js';
import { desktopUIConfig } from '../config/desktopUIConfig.js';

/**
 * Detect device type
 */
export const detectDevice = () => {
  const ua = navigator.userAgent;

  const isIPhone = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isMobile = isIPhone || isAndroid || window.innerWidth < 768;

  return {
    isIPhone,
    isAndroid,
    isMobile,
    isDesktop: !isMobile
  };
};

/**
 * Get device-specific UI configuration
 * Returns the appropriate config based on device type
 */
export const getDeviceConfig = () => {
  const device = detectDevice();

  if (device.isIPhone) {
    console.log('📱 Loading iPhone UI Config');
    return iPhoneUIConfig;
  } else if (device.isAndroid) {
    console.log('📱 Loading Android UI Config');
    return androidUIConfig;
  } else {
    console.log('🖥️ Loading Desktop UI Config');
    return desktopUIConfig;
  }
};

/**
 * Get safe area insets for LANDSCAPE orientation
 * Uses device-specific config to get safe area values
 *
 * Returns object with actual pixel values
 */
export const getSafeAreaInsets = () => {
  const config = getDeviceConfig();
  return config.getSafeAreaInsets();
};

/**
 * Get safe horizontal bounds for gameplay
 * Returns the playable area accounting for notch and home indicator
 */
export const getSafePlayArea = (screenWidth, screenHeight) => {
  const insets = getSafeAreaInsets();

  return {
    left: insets.left,           // Start after notch
    right: screenWidth - insets.right,  // End before home indicator
    top: insets.top,
    bottom: screenHeight - insets.bottom,
    width: screenWidth - insets.left - insets.right,
    height: screenHeight - insets.top - insets.bottom
  };
};

/**
 * Check if current orientation is landscape
 */
export const isLandscape = () => {
  return window.innerWidth > window.innerHeight;
};

/**
 * Log device and safe area info for debugging
 */
export const logDeviceInfo = () => {
  const device = detectDevice();
  const config = getDeviceConfig();
  const insets = getSafeAreaInsets();
  const orientation = isLandscape() ? 'LANDSCAPE' : 'PORTRAIT';

  console.log('=== DEVICE INFO ===');
  console.log('Device Type:', config.deviceType);
  console.log('Device:', device);
  console.log('Orientation:', orientation);
  console.log('Screen:', `${window.innerWidth}x${window.innerHeight}`);
  console.log('Safe Area Insets:', insets);
  console.log('UI Config:', {
    margins: config.margins,
    fonts: config.fonts,
    jumpButton: config.jumpButton
  });

  if (isLandscape()) {
    console.log('🎮 LANDSCAPE MODE:');
    console.log('  - Top safe area:', insets.top + 'px');
    console.log('  - Right safe area:', insets.right + 'px');
    console.log('  - Bottom safe area:', insets.bottom + 'px');
    console.log('  - Left safe area:', insets.left + 'px');
  }

  return { device, config, insets, orientation };
};
