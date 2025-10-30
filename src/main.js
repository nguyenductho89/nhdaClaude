import Phaser from 'phaser';
import { gameConfig } from './config/game.js';
import IntroScene from './game/scenes/IntroScene.js';
import GameScene from './game/scenes/GameScene.js';
import WeddingInfoScene from './game/scenes/WeddingInfoScene.js';

// Hide loading screen when game is ready
window.addEventListener('load', () => {
  setTimeout(() => {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.add('hidden');
    }
  }, 500);
});

// Initialize game configuration
const config = {
  ...gameConfig,
  scene: [IntroScene, GameScene, WeddingInfoScene],
  parent: 'game-container'
};

// Create game instance
const game = new Phaser.Game(config);

// iOS Safari viewport fix
// On iOS, window.innerHeight changes when address bar shows/hides
const getViewportHeight = () => {
  // Use visualViewport API if available (modern browsers)
  if (window.visualViewport) {
    return window.visualViewport.height;
  }
  return window.innerHeight;
};

// Handle window resize with iOS-specific fixes
const handleResize = () => {
  const width = window.innerWidth;
  const height = getViewportHeight();

  game.scale.resize(width, height);

  // iOS Safari: Hide address bar after resize
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    setTimeout(() => {
      window.scrollTo(0, 1);
      setTimeout(() => window.scrollTo(0, 0), 0);
    }, 100);
  }
};

window.addEventListener('resize', handleResize);

// Handle orientation change on mobile
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    handleResize();
  }, 300); // Longer delay for orientation change
});

// Listen to visualViewport changes (iOS Safari address bar show/hide)
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', handleResize);
  window.visualViewport.addEventListener('scroll', () => {
    // Prevent scroll when viewport changes
    window.scrollTo(0, 0);
  });
}

// Handle mobile fullscreen on load
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
  // Initial resize
  setTimeout(() => {
    handleResize();
  }, 200);

  // iOS specific: Try to hide address bar on load
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    setTimeout(() => {
      window.scrollTo(0, 1);
      setTimeout(() => window.scrollTo(0, 0), 0);
    }, 500);
  }
}

export default game;
