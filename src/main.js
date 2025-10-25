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

// Handle window resize - game will auto-scale with FIT mode
window.addEventListener('resize', () => {
  // Phaser's FIT mode will handle this automatically
  game.scale.refresh();
});

// Handle orientation change on mobile
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    game.scale.refresh();
  }, 100);
});

export default game;
