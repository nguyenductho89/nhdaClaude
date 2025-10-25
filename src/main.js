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
window.addEventListener('resize', () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});

export default game;
