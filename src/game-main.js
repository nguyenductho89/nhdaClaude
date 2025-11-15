import Phaser from 'phaser';
import { gameConfig } from './config/game.js';
import GameScene from './game/scenes/GameScene.js';
import { getLandscapeViewportSize, refreshOrientationLayout, requireLandscapeOrientation, isLandscapeOrientation } from './services/orientation.js';

let game = null;

// Destroy and reset game
const destroyGame = () => {
  if (game) {
    game.destroy(true); // Remove canvas and clean up
    game = null;
  }
};

// Initialize game only when in landscape mode
const initializeGame = () => {
  // Don't initialize if already exists
  if (game) return;

  // Hide loading screen
  const loading = document.getElementById('loading');
  if (loading) {
    loading.classList.add('hidden');
  }

  // Initialize game configuration - ONLY GameScene
  const config = {
    ...gameConfig,
    scene: [GameScene], // Only load GameScene
    parent: 'game-container'
  };

  // Create game instance
  game = new Phaser.Game(config);

  // Initial resize
  handleResize();
};

// Check orientation and initialize game when ready
const checkOrientationAndInit = () => {
  // Always require landscape orientation and setup callbacks
  requireLandscapeOrientation({
    onLandscape: () => {
      // User rotated to landscape - initialize game
      initializeGame();
    },
    onPortrait: () => {
      // User rotated to portrait - destroy game completely
      destroyGame();
    }
  });

  // If already in landscape, initialize immediately
  if (isLandscapeOrientation()) {
    initializeGame();
  }
};

// Start the orientation check when page loads
window.addEventListener('load', () => {
  setTimeout(() => {
    checkOrientationAndInit();
  }, 500);
});

// Hide address bar function for iOS Safari
const hideAddressBar = () => {
  window.scrollTo(0, 1);
  setTimeout(() => {
    window.scrollTo(0, 0);
  }, 0);
};

// Handle window resize
const handleResize = () => {
  if (!game) return; // Don't resize if game is not initialized

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
