import Phaser from 'phaser';
import { gameConfig } from './config/game.js';
import IntroScene from './game/scenes/IntroScene.js';
import GameScene from './game/scenes/GameScene.js';
import WeddingInfoScene from './game/scenes/WeddingInfoScene.js';
import { getLandscapeViewportSize, refreshOrientationLayout } from './services/orientation.js';

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

// Hide address bar function for iOS Safari
const hideAddressBar = () => {
  window.scrollTo(0, 1);
  setTimeout(() => {
    window.scrollTo(0, 0);
  }, 0);
};

// Handle window resize
const handleResize = () => {
  const { width, height } = getLandscapeViewportSize();
  game.scale.resize(width, height);

  refreshOrientationLayout();

  // Hide address bar after resize on mobile
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    hideAddressBar();
  }
};

// Listen to window resize
window.addEventListener('resize', handleResize);

// Handle orientation change on mobile
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    handleResize();
    hideAddressBar();
  }, 300);
});

// Prevent scrolling on mobile
document.body.addEventListener('touchmove', (e) => {
  e.preventDefault();
}, { passive: false });

// Initial setup for mobile
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
  setTimeout(() => {
    handleResize();
    hideAddressBar();
  }, 500);
}

// Ensure initial sizing aligns with forced orientation
handleResize();

// Hide address bar on any user interaction (iOS Safari)
if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
  let hasInteracted = false;
  const onFirstInteraction = () => {
    if (!hasInteracted) {
      hasInteracted = true;
      hideAddressBar();
    }
  };

  document.addEventListener('touchstart', onFirstInteraction, { once: true });
  document.addEventListener('click', onFirstInteraction, { once: true });
}

export default game;
