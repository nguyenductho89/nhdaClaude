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

// Handle window resize
const handleResize = () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
};

window.addEventListener('resize', handleResize);

// Handle orientation change on mobile
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    handleResize();
  }, 100);
});

// Handle mobile fullscreen on load
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
  // Force fullscreen on mobile
  setTimeout(() => {
    handleResize();
  }, 200);
}

export default game;
