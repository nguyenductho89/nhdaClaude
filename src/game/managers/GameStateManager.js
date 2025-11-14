import { GAME_CONSTANTS } from '../../config/game.js';
import { submitScore, getDeviceType } from '../../services/leaderboard.js';

/**
 * GameStateManager
 * Handles game lifecycle, state transitions, scene switching, and timers
 */
export default class GameStateManager {
  constructor(scene) {
    this.scene = scene;

    // Game state
    this.isGameOver = false;
    this.hasCollision = false;
    this.distanceTraveled = 0;
    this.startTime = 0;

    // Speed and difficulty
    this.scrollSpeed = GAME_CONSTANTS.INITIAL_SCROLL_SPEED;
    this.currentSpeedTier = 0;

    // Scene management
    this.sceneTypes = ['beach', 'mountain-river', 'street'];
    this.currentSceneIndex = Phaser.Math.Between(0, this.sceneTypes.length - 1);
    this.sceneType = this.sceneTypes[this.currentSceneIndex];
    this.sceneChangeInterval = 19000;
    this.isSwitchingScene = false;
    this.lastSceneChangeTime = 0;
    this.visitedScenes = new Set([this.sceneType]);
    this.sceneQueue = [];

    // Safe period
    this.isInSafePeriod = true;

    // Timers
    this.sceneChangeTimer = null;

    // Safe area
    this.safeAreaTop = 0;

    console.log('Starting with scene:', this.sceneType);
  }

  /**
   * Set safe area for mobile devices
   */
  setSafeArea(safeAreaTop) {
    this.safeAreaTop = safeAreaTop;
  }

  /**
   * Initialize game state
   */
  initialize() {
    this.startTime = Date.now();
    this.isGameOver = false;
    this.hasCollision = false;
    this.distanceTraveled = 0;
    this.isInSafePeriod = true;
  }

  /**
   * Setup all game timers
   */
  setupGameTimers(onUpdateTimer, onIncreaseSpeed, onCompleteGame) {
    console.log('Setting up game timers...');

    // Update game timer every second
    this.scene.time.addEvent({
      delay: 1000,
      callback: onUpdateTimer,
      callbackScope: this.scene,
      loop: true
    });

    // Increase speed every 30 seconds
    this.scene.time.addEvent({
      delay: GAME_CONSTANTS.SPEED_INCREMENT_INTERVAL,
      callback: () => {
        this.increaseSpeed();
        if (onIncreaseSpeed) onIncreaseSpeed();
      },
      callbackScope: this.scene,
      loop: true
    });

    // Check for game completion (2 minutes)
    this.scene.time.addEvent({
      delay: GAME_CONSTANTS.GAME_DURATION,
      callback: onCompleteGame,
      callbackScope: this.scene,
      loop: false
    });

    // Safe period end (first 5 seconds)
    this.scene.time.addEvent({
      delay: GAME_CONSTANTS.SAFE_PERIOD_START,
      callback: () => {
        console.log('Safe period ended');
        this.isInSafePeriod = false;
      },
      callbackScope: this.scene,
      loop: false
    });

    // Scene change timer - switch scenes every 19 seconds
    console.log('Setting up scene change timer with interval:', this.sceneChangeInterval, 'ms');
    this.sceneChangeTimer = this.scene.time.addEvent({
      delay: this.sceneChangeInterval,
      callback: (onClearScene, onCreateBackground, onSetPlayerDepth) => {
        console.log('⏰ Scene change timer fired!');
        this.switchScene(onClearScene, onCreateBackground, onSetPlayerDepth);
      },
      callbackScope: this.scene,
      loop: true
    });
    console.log('Scene change timer created:', this.sceneChangeTimer);
  }

  /**
   * Increase game speed and difficulty
   */
  increaseSpeed() {
    if (this.scrollSpeed < GAME_CONSTANTS.MAX_SCROLL_SPEED) {
      this.scrollSpeed = Math.min(
        this.scrollSpeed + GAME_CONSTANTS.SPEED_INCREMENT,
        GAME_CONSTANTS.MAX_SCROLL_SPEED
      );
      this.currentSpeedTier++;
    }
  }

  /**
   * Update distance traveled
   */
  updateDistance(deltaInSeconds) {
    this.distanceTraveled += (this.scrollSpeed * deltaInSeconds) / 100; // Convert px to meters
  }

  /**
   * Switch to next scene
   */
  switchScene(onClearScene, onCreateBackground, onSetPlayerDepth) {
    const currentTime = Date.now();
    const timeSinceStart = currentTime - this.startTime;

    console.log('=== SWITCH SCENE CALLED ===');
    console.log('Time since start:', timeSinceStart, 'ms');
    console.log('isSwitchingScene:', this.isSwitchingScene);
    console.log('isGameOver:', this.isGameOver);

    // Prevent concurrent scene switches
    if (this.isSwitchingScene) {
      console.log('Scene switch blocked: already in progress');
      return;
    }

    if (this.isGameOver) {
      console.log('Scene switch blocked: game over');
      return;
    }

    console.log('Starting scene switch...');
    console.log('Current scene:', this.sceneType, 'Index:', this.currentSceneIndex);
    this.isSwitchingScene = true;

    // Update last scene change time
    this.lastSceneChangeTime = currentTime;

    try {
      // Clear current scene
      console.log('Step 1: Clearing scene...');
      if (onClearScene) {
        onClearScene();
      }

      // Move to next scene - ensure all 3 scenes appear in one game
      console.log('Step 2: Selecting next scene...');
      console.log('Visited scenes:', Array.from(this.visitedScenes));
      console.log('Current scene index:', this.currentSceneIndex);
      console.log('Current scene type:', this.sceneType);

      let nextSceneType;

      // If we haven't visited all scenes yet, prioritize unvisited scenes
      const unvisitedScenes = this.sceneTypes.filter(scene => !this.visitedScenes.has(scene));

      if (unvisitedScenes.length > 0) {
        // Pick from unvisited scenes to ensure all 3 appear
        nextSceneType = Phaser.Utils.Array.GetRandom(unvisitedScenes);
        console.log('Selecting unvisited scene:', nextSceneType);
      } else {
        // All scenes visited, now random but avoid immediate repeat
        const availableScenes = this.sceneTypes.filter((_, index) => index !== this.currentSceneIndex);
        if (availableScenes.length > 0) {
          nextSceneType = Phaser.Utils.Array.GetRandom(availableScenes);
          console.log('All scenes visited, random selection:', nextSceneType);
        } else {
          // Fallback: cycle to next scene
          nextSceneType = this.sceneTypes[(this.currentSceneIndex + 1) % this.sceneTypes.length];
          console.log('Cycling to next scene:', nextSceneType);
        }
      }

      // Update scene tracking
      this.currentSceneIndex = this.sceneTypes.indexOf(nextSceneType);
      this.sceneType = nextSceneType;
      this.visitedScenes.add(nextSceneType);

      console.log('Selected next scene:', nextSceneType, 'at index:', this.currentSceneIndex);
      console.log('Total scenes visited:', this.visitedScenes.size, '/', this.sceneTypes.length);

      console.log('Step 3: Creating new scene:', this.sceneType, 'Index:', this.currentSceneIndex);

      // Create new scene
      if (onCreateBackground) {
        onCreateBackground();
      }

      // Ensure player is on top of new background
      if (onSetPlayerDepth) {
        onSetPlayerDepth();
        console.log('Player depth set to 50 (on top)');
      }

      console.log('Scene switch completed successfully');
    } catch (error) {
      console.error('Error switching scene:', error);
      console.error('Error stack:', error.stack);
    }

    // Reset flag immediately after scene creation (don't wait)
    this.isSwitchingScene = false;
    console.log('Scene switch lock released immediately');
    console.log('=== SWITCH SCENE DONE ===\n');
  }

  /**
   * Show scene change notification
   */
  showSceneChangeNotification() {
    const { width, height } = this.scene.scale;

    let sceneText = '';
    if (this.sceneType === 'mountain-river') {
      sceneText = '🏔️ NÚI SÔNG';
    } else if (this.sceneType === 'street') {
      sceneText = '🏙️ ĐƯỜNG PHỐ';
    } else if (this.sceneType === 'beach') {
      sceneText = '🏖️ BÃI BIỂN';
    }

    const notification = this.scene.add.text(width / 2, height / 2, sceneText, {
      fontSize: '64px',
      fontFamily: 'Arial',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: { x: 30, y: 15 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(250).setAlpha(0).setScale(0.5);

    // Animate in
    this.scene.tweens.add({
      targets: notification,
      alpha: 1,
      scale: 1.2,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Hold for 1.5 seconds
        this.scene.time.delayedCall(1500, () => {
          // Fade out
          this.scene.tweens.add({
            targets: notification,
            alpha: 0,
            scale: 0.8,
            y: notification.y - 100,
            duration: 500,
            ease: 'Back.easeIn',
            onComplete: () => notification.destroy()
          });
        });
      }
    });
  }

  /**
   * Handle game over
   */
  gameOver(player, itemsCollected) {
    if (this.isGameOver) return;

    this.isGameOver = true;

    // Stop player
    player.setVelocityX(0);

    // Calculate final score
    const timeElapsed = Math.floor((Date.now() - this.startTime) / 1000);

    // Show game over screen
    this.showGameOverScreen(0, timeElapsed, false, itemsCollected);
  }

  /**
   * Handle game completion
   */
  completeGame(score, itemsCollected, comboCount, comboActive) {
    if (this.isGameOver) return;

    this.isGameOver = true;

    // Calculate final score with perfect run bonus
    const timeElapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const survivalBonus = Math.floor(timeElapsed / 10) * GAME_CONSTANTS.SURVIVAL_BONUS;
    const comboBonus = comboActive ? GAME_CONSTANTS.COMBO_BONUS * Math.floor(comboCount / GAME_CONSTANTS.COMBO_THRESHOLD) : 0;
    const perfectBonus = !this.hasCollision ? GAME_CONSTANTS.PERFECT_RUN_BONUS : 0;

    const finalScore = score + survivalBonus + comboBonus + perfectBonus;

    // Show victory screen
    this.showGameOverScreen(finalScore, timeElapsed, true, itemsCollected);
  }

  /**
   * Show game over/victory screen
   */
  showGameOverScreen(finalScore, timeElapsed, isVictory, itemsCollected) {
    const { width, height } = this.scene.scale;

    // Overlay
    const overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.85)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(200);

    // Title (with safe area offset for mobile)
    const title = isVictory ? '🎉 HOÀN THÀNH!' : '💥 GAME OVER';
    const titleY = height / 2 - 180 + (this.safeAreaTop / 2); // Half offset to keep centered
    this.scene.add.text(width / 2, titleY, title, {
      fontSize: '48px',
      fontFamily: 'Arial',
      color: isVictory ? '#FFD700' : '#FF6B6B',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    // Score
    this.scene.add.text(width / 2, height / 2 - 100, `Điểm: ${finalScore}`, {
      fontSize: '36px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    // Distance
    this.scene.add.text(width / 2, height / 2 - 60, `Khoảng cách: ${Math.floor(this.distanceTraveled)}m`, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    // Time
    const minutes = Math.floor(timeElapsed / 60);
    const seconds = timeElapsed % 60;
    this.scene.add.text(width / 2, height / 2 - 30, `Thời gian: ${minutes}:${seconds.toString().padStart(2, '0')}`, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    // Items collected
    let yPos = height / 2 + 10;
    this.scene.add.text(width / 2, yPos, 'Vật phẩm thu thập:', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#FFD700'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    yPos += 30;
    const itemText = `💰 ${itemsCollected.tien}  ❤️ ${itemsCollected.tin}  🏡 ${itemsCollected.nha}  🚗 ${itemsCollected.xe}  💍 ${itemsCollected.vang}`;
    this.scene.add.text(width / 2, yPos, itemText, {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    // Name input prompt
    yPos += 50;
    this.scene.add.text(width / 2, yPos, 'Nhập tên để lưu điểm:', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    // Prompt for name (in real app, use HTML form)
    setTimeout(() => {
      const nameInput = prompt('Nhập tên của bạn:', 'Khách mời');

      if (nameInput) {
        submitScore(nameInput, finalScore, timeElapsed, itemsCollected, getDeviceType())
          .then(() => {
            // Redirect to wedding-info.html with score
            window.location.href = `wedding-info.html?score=${finalScore}&name=${encodeURIComponent(nameInput)}`;
          })
          .catch(err => {
            console.error('Failed to submit score:', err);
            // Redirect anyway
            window.location.href = 'wedding-info.html';
          });
      } else {
        // Skip to wedding info without score
        window.location.href = 'wedding-info.html';
      }
    }, 500);
  }

  /**
   * Get current scene type
   */
  getSceneType() {
    return this.sceneType;
  }

  /**
   * Get scroll speed
   */
  getScrollSpeed() {
    return this.scrollSpeed;
  }

  /**
   * Get current speed tier
   */
  getCurrentSpeedTier() {
    return this.currentSpeedTier;
  }

  /**
   * Check if in safe period
   */
  isInSafe() {
    return this.isInSafePeriod;
  }

  /**
   * Check if switching scene
   */
  isSwitching() {
    return this.isSwitchingScene;
  }

  /**
   * Check if game over
   */
  isOver() {
    return this.isGameOver;
  }

  /**
   * Set collision flag
   */
  setCollision() {
    this.hasCollision = true;
  }

  /**
   * Destroy manager
   */
  destroy() {
    if (this.sceneChangeTimer) {
      this.sceneChangeTimer.remove();
    }
  }
}
