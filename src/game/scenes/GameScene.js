import Phaser from 'phaser';
import { GAME_CONSTANTS } from '../../config/game.js';
import { submitScore, getDeviceType } from '../../services/leaderboard.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });

    // Game state
    this.isGameOver = false;
    this.isInvincible = false;
    this.hasCollision = false;

    // Scoring
    this.score = 0;
    this.distanceTraveled = 0;
    this.itemsCollected = {
      tien: 0,
      tin: 0,
      nha: 0,
      xe: 0,
      soDo: 0,
      vang: 0
    };
    this.comboCount = 0;
    this.comboActive = false;
    this.scoreMultiplier = 1;

    // Speed and difficulty
    this.scrollSpeed = GAME_CONSTANTS.INITIAL_SCROLL_SPEED;
    this.currentSpeedTier = 0;

    // Timers
    this.startTime = 0;
    this.gameTime = 0;
    this.jumpStartTime = 0;
    this.isJumpHeld = false;

    // Spawning
    this.lastObstacleTime = 0;
    this.lastCollectibleTime = 0;
    this.nextObstacleDelay = 0;
    this.isInSafePeriod = false;
  }

  preload() {
    // Load player image
    this.load.image('playerImage', '/player.png');
  }

  create() {
    const { width, height } = this.scale;

    // Initialize game time
    this.startTime = Date.now();
    this.gameTime = 0;
    this.isInSafePeriod = true; // Start in safe period

    // Create parallax background layers
    this.createParallaxBackground();

    // Create scrolling ground
    this.createGround();

    // Create player (auto-running dinosaur/groom)
    this.createPlayer();

    // Initialize groups
    this.obstacles = this.physics.add.group();
    this.collectibles = this.physics.add.group();

    // Collision detection
    this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, null, this);
    this.physics.add.overlap(this.player, this.collectibles, this.collectItem, null, this);

    // Create UI
    this.createUI();

    // Setup controls (single button - tap anywhere)
    this.setupControls();

    // Start game timers
    this.setupGameTimers();

    // Set initial obstacle spawn delay
    this.scheduleNextObstacle();
  }

  createParallaxBackground() {
    const { width, height } = this.scale;

    // Sky layer (static gradient)
    const sky = this.add.rectangle(0, 0, width, height, 0x87CEEB).setOrigin(0);

    // Clouds layer (slow scroll)
    this.cloudsLayer = this.add.group();
    for (let i = 0; i < 3; i++) {
      const cloud = this.add.ellipse(
        i * 400 + Math.random() * 200,
        50 + Math.random() * 100,
        80, 40, 0xffffff, 0.8
      );
      cloud.setData('baseX', cloud.x);
      this.cloudsLayer.add(cloud);
    }

    // Mountains layer (medium scroll)
    this.mountainsLayer = this.add.group();
    const mountainGraphics = this.add.graphics();
    mountainGraphics.fillStyle(0x8B7355, 0.6);
    for (let i = 0; i < 4; i++) {
      const x = i * 300;
      mountainGraphics.fillTriangle(x, height - 150, x + 150, height - 300, x + 300, height - 150);
    }
    const mountainTexture = mountainGraphics.generateTexture('mountains', width, height);
    mountainGraphics.destroy();

    this.mountainsBg = this.add.image(0, 0, 'mountains').setOrigin(0);
    this.mountainsBg2 = this.add.image(width, 0, 'mountains').setOrigin(0);
  }

  createGround() {
    const { width, height } = this.scale;

    // Ground closer to bottom for more play space
    this.groundY = height - 30;

    // Create repeating ground tiles
    this.groundTiles = this.add.group();
    const tileWidth = 64;
    const tilesNeeded = Math.ceil(width / tileWidth) + 2;

    for (let i = 0; i < tilesNeeded; i++) {
      const tile = this.add.rectangle(
        i * tileWidth,
        this.groundY,
        tileWidth, 30,
        0x8B4513
      ).setOrigin(0, 0);
      this.groundTiles.add(tile);
    }

    // Ground collision body
    this.ground = this.add.rectangle(width / 2, this.groundY + 10, width * 2, 20, 0x000000, 0);
    this.physics.add.existing(this.ground, true); // Static body
  }

  createPlayer() {
    const { width, height } = this.scale;

    // Player dimensions (keep same as before)
    const playerWidth = 40;
    const playerHeight = 60;

    // Position player further left on smaller screens
    const playerX = width < 600 ? 100 : 150;

    // Create player using the loaded image - will stretch to fit size
    this.player = this.physics.add.sprite(playerX, this.groundY - playerHeight / 2, 'playerImage');
    this.player.setCollideWorldBounds(false);

    // Stretch image to fit the exact size (40x60)
    this.player.setDisplaySize(playerWidth, playerHeight);

    // Set body size for more precise collision
    this.player.body.setSize(playerWidth * 0.8, playerHeight * 0.9);
    this.player.body.setOffset(playerWidth * 0.1, playerHeight * 0.05);

    // Physics - Chrome Dino style (simple gravity)
    this.player.body.setGravityY(GAME_CONSTANTS.GRAVITY);
    this.physics.add.collider(this.player, this.ground);

    // No running animation tween - keep it simple and stable
    // Player stays at fixed position, only jumps
  }

  createUI() {
    const { width, height } = this.scale;
    const isMobile = this.isMobileDevice();

    // Compact font sizes for mobile
    const baseFontSize = isMobile ? 16 : 24;
    const smallFontSize = isMobile ? 12 : 18;

    // Absolute minimal margins
    const topMargin = isMobile ? 5 : 60;
    const leftMargin = isMobile ? 5 : 20;
    const rightMargin = isMobile ? 5 : 20;
    const padding = isMobile ? 4 : 8;

    // Line spacing for mobile
    const lineSpacing = isMobile ? 22 : 35;

    // LEFT COLUMN - Score and Distance
    this.scoreText = this.add.text(leftMargin, topMargin, 'Điểm: 0', {
      fontSize: `${baseFontSize}px`,
      fontFamily: 'Arial',
      color: '#000000',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      padding: { x: padding, y: padding / 2 }
    }).setScrollFactor(0).setDepth(100);

    this.distanceText = this.add.text(leftMargin, topMargin + lineSpacing, '0m', {
      fontSize: `${smallFontSize}px`,
      fontFamily: 'Arial',
      color: '#000000',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      padding: { x: padding, y: padding / 2 }
    }).setScrollFactor(0).setDepth(100);

    // RIGHT COLUMN - Timer on top
    this.timerText = this.add.text(width - rightMargin, topMargin, '0:00', {
      fontSize: `${baseFontSize}px`,
      fontFamily: 'Arial',
      color: '#000000',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      padding: { x: padding, y: padding / 2 }
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);

    // Pause button below timer (right side)
    const pauseText = isMobile ? '⏸' : '⏸';
    this.pauseButton = this.add.text(width - rightMargin, topMargin + lineSpacing, pauseText, {
      fontSize: `${baseFontSize}px`,
      fontFamily: 'Arial',
      color: '#000000',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      padding: { x: padding, y: padding / 2 }
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(100)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.pauseGame());

    // CENTER - Combo and Multiplier (only show when active)
    const centerY = isMobile ? 60 : 100;

    this.comboText = this.add.text(width / 2, centerY, '', {
      fontSize: `${baseFontSize}px`,
      fontFamily: 'Arial',
      color: '#FFD700',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: { x: padding + 2, y: padding }
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100).setVisible(false);

    this.multiplierText = this.add.text(width / 2, centerY + 25, '', {
      fontSize: `${smallFontSize}px`,
      fontFamily: 'Arial',
      color: '#FFD700',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: { x: padding, y: padding / 2 }
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100).setVisible(false);

    // Mobile jump button
    if (isMobile) {
      this.createMobileJumpButton();
    }
  }

  isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || (window.innerWidth < 768);
  }

  createMobileJumpButton() {
    const { width, height } = this.scale;

    // Large button, positioned at absolute corner
    const buttonSize = 100;
    const margin = 10; // Ultra minimal margin

    const buttonX = width - buttonSize / 2 - margin;
    const buttonY = height - buttonSize / 2 - margin;

    // Button background circle with better contrast
    this.jumpButtonBg = this.add.circle(buttonX, buttonY, buttonSize / 2, 0xFFFFFF, 0.4)
      .setScrollFactor(0)
      .setDepth(100);

    // Add border for better visibility
    const buttonBorder = this.add.circle(buttonX, buttonY, buttonSize / 2 + 4, 0xFFFFFF, 0.2)
      .setScrollFactor(0)
      .setDepth(99);

    // Button icon - large and clear
    this.jumpButtonIcon = this.add.text(buttonX, buttonY, '⬆', {
      fontSize: '56px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

    // Button interactive area (larger for easier tapping)
    const hitAreaSize = buttonSize + 25;
    this.jumpButton = this.add.rectangle(buttonX, buttonY, hitAreaSize, hitAreaSize, 0x000000, 0)
      .setScrollFactor(0)
      .setDepth(102)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (!this.isGameOver) {
          this.jump();
          // Enhanced visual feedback
          this.jumpButtonBg.setAlpha(0.7);
          this.jumpButtonIcon.setScale(1.2);
          buttonBorder.setAlpha(0.5);
        }
      })
      .on('pointerup', () => {
        this.jumpButtonBg.setAlpha(0.4);
        this.jumpButtonIcon.setScale(1);
        buttonBorder.setAlpha(0.2);
      })
      .on('pointerout', () => {
        this.jumpButtonBg.setAlpha(0.4);
        this.jumpButtonIcon.setScale(1);
        buttonBorder.setAlpha(0.2);
      });

    // Store border reference for cleanup
    this.jumpButtonBorder = buttonBorder;
  }

  setupControls() {
    // Keyboard controls
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);

    // Mouse/Touch controls - tap anywhere to jump (except UI elements)
    if (!this.isMobileDevice()) {
      // Desktop: click anywhere to jump
      this.input.on('pointerdown', (pointer) => {
        if (!this.isGameOver && !this.isPaused) {
          // Don't jump if clicking on UI buttons
          if (pointer.y > 140) { // Below UI area
            this.jump();
          }
        }
      });
    }
    // Mobile uses dedicated jump button created in createMobileJumpButton()
  }

  setupGameTimers() {
    // Update game timer every second
    this.time.addEvent({
      delay: 1000,
      callback: this.updateGameTimer,
      callbackScope: this,
      loop: true
    });

    // Increase speed every 30 seconds
    this.time.addEvent({
      delay: GAME_CONSTANTS.SPEED_INCREMENT_INTERVAL,
      callback: this.increaseSpeed,
      callbackScope: this,
      loop: true
    });

    // Check for game completion (2 minutes)
    this.time.addEvent({
      delay: GAME_CONSTANTS.GAME_DURATION,
      callback: this.completeGame,
      callbackScope: this,
      loop: false
    });

    // Safe period end (first 5 seconds)
    this.time.addEvent({
      delay: GAME_CONSTANTS.SAFE_PERIOD_START,
      callback: () => { this.isInSafePeriod = false; },
      callbackScope: this,
      loop: false
    });
  }

  jump() {
    // Simple jump like Chrome Dino - just one jump strength
    if (this.player.body.touching.down && !this.isGameOver) {
      this.player.setVelocityY(GAME_CONSTANTS.JUMP_VELOCITY_HIGH);
    }
  }

  scheduleNextObstacle() {
    // Calculate next obstacle delay based on current difficulty
    const baseGap = GAME_CONSTANTS.OBSTACLE_MIN_GAP;
    const maxGap = GAME_CONSTANTS.OBSTACLE_MAX_GAP;
    const reduction = this.currentSpeedTier * GAME_CONSTANTS.OBSTACLE_DENSITY_INCREASE;

    const minGap = Math.max(1000, baseGap - reduction);
    const adjustedMaxGap = Math.max(minGap + 500, maxGap - reduction);

    this.nextObstacleDelay = Phaser.Math.Between(minGap, adjustedMaxGap);
  }

  spawnObstacle() {
    if (this.isInSafePeriod || this.isGameOver) return;

    const { width } = this.scale;

    // Randomly spawn ground or flying obstacle
    const spawnFlying = Math.random() < 0.3; // 30% chance for flying

    if (spawnFlying) {
      this.spawnFlyingEnemy();
    } else {
      this.spawnGroundObstacle();
    }

    // Schedule next obstacle
    this.scheduleNextObstacle();
  }

  spawnGroundObstacle() {
    const { width } = this.scale;

    // Ground obstacles - work/stress themed enemies (uniform size)
    const groundObstacles = [
      { key: 'stress', emoji: '😰', label: 'Stress' },
      { key: 'deadline', emoji: '⏰', label: 'Deadline' },
      { key: 'work', emoji: '💼', label: 'Công việc' },
      { key: 'boss', emoji: '👔', label: 'Ông sếp' },
      { key: 'overtime', emoji: '🌙', label: 'OT' },
      { key: 'meeting', emoji: '📊', label: 'Meeting' }
    ];

    const type = Phaser.Utils.Array.GetRandom(groundObstacles);

    // Uniform size for all ground obstacles
    const obstacleSize = 48; // Larger and consistent
    const obstacleY = this.groundY - obstacleSize;

    // Container for emoji + label
    const container = this.add.container(width + 50, obstacleY);

    // Create emoji obstacle (larger)
    const emoji = this.add.text(0, -5, type.emoji, {
      fontSize: '48px'
    }).setOrigin(0.5, 1);

    // Add label text below emoji
    const label = this.add.text(0, 2, type.label, {
      fontSize: '10px',
      fontFamily: 'Arial',
      color: '#000000',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      padding: { x: 3, y: 1 }
    }).setOrigin(0.5, 0);

    container.add([emoji, label]);

    // Physics on container
    this.physics.add.existing(container);
    container.body.setAllowGravity(false);
    container.body.setImmovable(true);

    // Uniform hitbox
    container.body.setSize(42, 42);
    container.setData('type', type.key);
    container.setData('isFlying', false);

    this.obstacles.add(container);
  }

  spawnFlyingEnemy() {
    const { width } = this.scale;

    // Flying enemies - work stress (uniform size)
    const flyingEnemies = [
      { key: 'email', emoji: '📧', label: 'Email khẩn' },
      { key: 'report', emoji: '📄', label: 'Báo cáo' },
      { key: 'phone', emoji: '📞', label: 'Điện thoại' },
      { key: 'angry-boss', emoji: '😡', label: 'Sếp giận' },
      { key: 'task', emoji: '📝', label: 'Task mới' }
    ];

    const type = Phaser.Utils.Array.GetRandom(flyingEnemies);

    // Flying at different heights (like pterodactyls in Chrome Dino)
    const flyHeights = [
      this.groundY - 80,  // Low flying
      this.groundY - 120, // Medium flying
      this.groundY - 160  // High flying
    ];
    const flyY = Phaser.Utils.Array.GetRandom(flyHeights);

    // Container for emoji + label
    const container = this.add.container(width + 50, flyY);

    // Create emoji (larger and uniform)
    const emoji = this.add.text(0, -5, type.emoji, {
      fontSize: '42px'
    }).setOrigin(0.5, 1);

    // Add label text below emoji
    const label = this.add.text(0, 2, type.label, {
      fontSize: '10px',
      fontFamily: 'Arial',
      color: '#000000',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      padding: { x: 3, y: 1 }
    }).setOrigin(0.5, 0);

    container.add([emoji, label]);

    // Physics on container
    this.physics.add.existing(container);
    container.body.setAllowGravity(false);
    container.body.setImmovable(true);

    // Uniform hitbox
    container.body.setSize(40, 40);
    container.setData('type', type.key);
    container.setData('isFlying', true);

    this.obstacles.add(container);

    // Flying animation (bobbing up and down)
    this.tweens.add({
      targets: container,
      y: flyY - 10,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  spawnCollectible() {
    if (this.isGameOver) return;

    const { width } = this.scale;

    // Determine item type based on rarity
    const rand = Math.random();
    let itemType;

    if (rand < 0.5) {
      itemType = 'tien'; // 50% chance
    } else if (rand < 0.75) {
      itemType = 'tin'; // 25% chance
    } else if (rand < 0.88) {
      itemType = 'nha'; // 13% chance
    } else if (rand < 0.94) {
      itemType = 'xe'; // 6% chance
    } else if (rand < 0.98) {
      itemType = 'soDo'; // 4% chance
    } else {
      itemType = 'vang'; // 2% chance
    }

    const itemConfig = {
      tien: { emoji: '💰', label: 'Tiền +10', size: 32 },
      tin: { emoji: '🏠', label: 'Tin +50', size: 36 },
      nha: { emoji: '🏡', label: 'Nhà +100', size: 40 },
      xe: { emoji: '🚗', label: 'Xe +150', size: 40 },
      soDo: { emoji: '📜', label: 'Sổ đỏ +200', size: 36 },
      vang: { emoji: '💍', label: 'Vàng +300', size: 40 }
    };

    const config = itemConfig[itemType];

    // Spawn at varying heights
    const heightVariation = Phaser.Math.Between(-150, -50);
    const y = this.groundY + heightVariation;

    // Container for emoji + label
    const container = this.add.container(width + 50, y);

    // Create emoji (uniform sizes)
    const emoji = this.add.text(0, -5, config.emoji, {
      fontSize: `${config.size}px`
    }).setOrigin(0.5, 1);

    // Add label text below emoji
    const label = this.add.text(0, 2, config.label, {
      fontSize: '10px',
      fontFamily: 'Arial',
      color: '#FFD700',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: { x: 3, y: 1 }
    }).setOrigin(0.5, 0);

    container.add([emoji, label]);

    // Physics on container
    this.physics.add.existing(container);
    container.body.setAllowGravity(false);
    container.setData('itemType', itemType);
    container.setData('score', GAME_CONSTANTS.ITEM_SCORES[itemType]);

    this.collectibles.add(container);

    // Floating animation
    this.tweens.add({
      targets: container,
      y: y - 10,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  collectItem(player, item) {
    const itemType = item.getData('itemType');
    const itemScore = item.getData('score');

    // Update collected items
    this.itemsCollected[itemType]++;

    // Apply score with multiplier
    const earnedScore = Math.floor(itemScore * this.scoreMultiplier);
    this.score += earnedScore;

    // Update combo
    this.comboCount++;
    if (this.comboCount >= GAME_CONSTANTS.COMBO_THRESHOLD) {
      this.comboActive = true;
      this.comboText.setText(`🔥 COMBO x${this.comboCount}`).setVisible(true);
    }

    // Special item effects
    if (itemType === 'xe') {
      this.activateInvincibility();
    } else if (itemType === 'vang') {
      this.activateMultiplier();
    }

    // Visual feedback
    this.createCollectEffect(item.x, item.y);

    item.destroy();

    // Update UI
    this.updateScoreDisplay();
  }

  createCollectEffect(x, y) {
    const circle = this.add.circle(x, y, 20, 0xFFFFFF, 0.8);
    this.tweens.add({
      targets: circle,
      alpha: 0,
      scale: 2,
      duration: 300,
      onComplete: () => circle.destroy()
    });
  }

  activateInvincibility() {
    this.isInvincible = true;
    this.player.setTint(0x00FFFF); // Cyan tint

    // Create animated notification
    const { width, height } = this.scale;
    const notification = this.add.text(width / 2, height / 2 - 150, '🚗 BẤT TỬ 5S!', {
      fontSize: '48px',
      fontFamily: 'Arial',
      color: '#00FFFF',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(150).setAlpha(0).setScale(0.5);

    // Animate in
    this.tweens.add({
      targets: notification,
      alpha: 1,
      scale: 1.2,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Pulse animation
        this.tweens.add({
          targets: notification,
          scale: 1.3,
          duration: 500,
          yoyo: true,
          repeat: 8, // 5 seconds / 0.5s per pulse
          ease: 'Sine.easeInOut'
        });
        // Fade out after 4.5 seconds
        this.time.delayedCall(4500, () => {
          this.tweens.add({
            targets: notification,
            alpha: 0,
            y: notification.y - 50,
            duration: 500,
            onComplete: () => notification.destroy()
          });
        });
      }
    });

    this.time.addEvent({
      delay: GAME_CONSTANTS.INVINCIBILITY_DURATION,
      callback: () => {
        this.isInvincible = false;
        this.player.clearTint();
      }
    });
  }

  activateMultiplier() {
    this.scoreMultiplier = GAME_CONSTANTS.MULTIPLIER_GOLD;
    this.multiplierText.setText(`⭐ x${this.scoreMultiplier}`).setVisible(true);

    // Create animated notification
    const { width, height } = this.scale;
    const notification = this.add.text(width / 2, height / 2 - 150, '💍 ĐIỂM x2 - 10S!', {
      fontSize: '48px',
      fontFamily: 'Arial',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#FF8C00',
      strokeThickness: 6,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(150).setAlpha(0).setScale(0.5);

    // Animate in with bounce
    this.tweens.add({
      targets: notification,
      alpha: 1,
      scale: 1.2,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Sparkle/pulse animation
        this.tweens.add({
          targets: notification,
          scale: 1.3,
          duration: 600,
          yoyo: true,
          repeat: 15, // 10 seconds / 0.6s per pulse
          ease: 'Sine.easeInOut'
        });
        // Fade out after 9.5 seconds
        this.time.delayedCall(9500, () => {
          this.tweens.add({
            targets: notification,
            alpha: 0,
            y: notification.y - 50,
            scale: 0.8,
            duration: 500,
            onComplete: () => notification.destroy()
          });
        });
      }
    });

    this.time.addEvent({
      delay: GAME_CONSTANTS.MULTIPLIER_DURATION,
      callback: () => {
        this.scoreMultiplier = 1;
        this.multiplierText.setVisible(false);
      }
    });
  }

  hitObstacle(player, obstacle) {
    if (this.isInvincible || this.isGameOver) return;

    // Game over on collision
    this.hasCollision = true;
    this.gameOver();
  }

  gameOver() {
    if (this.isGameOver) return;

    this.isGameOver = true;

    // Stop player
    this.player.setVelocityX(0);

    // Calculate final score
    const timeElapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const survivalBonus = Math.floor(timeElapsed / 10) * GAME_CONSTANTS.SURVIVAL_BONUS;
    const comboBonus = this.comboActive ? GAME_CONSTANTS.COMBO_BONUS * Math.floor(this.comboCount / GAME_CONSTANTS.COMBO_THRESHOLD) : 0;

    const finalScore = this.score + survivalBonus + comboBonus;

    // Show game over screen
    this.showGameOverScreen(finalScore, timeElapsed, false);
  }

  completeGame() {
    if (this.isGameOver) return;

    this.isGameOver = true;

    // Calculate final score with perfect run bonus
    const timeElapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const survivalBonus = Math.floor(timeElapsed / 10) * GAME_CONSTANTS.SURVIVAL_BONUS;
    const comboBonus = this.comboActive ? GAME_CONSTANTS.COMBO_BONUS * Math.floor(this.comboCount / GAME_CONSTANTS.COMBO_THRESHOLD) : 0;
    const perfectBonus = !this.hasCollision ? GAME_CONSTANTS.PERFECT_RUN_BONUS : 0;

    const finalScore = this.score + survivalBonus + comboBonus + perfectBonus;

    // Show victory screen
    this.showGameOverScreen(finalScore, timeElapsed, true);
  }

  showGameOverScreen(finalScore, timeElapsed, isVictory) {
    const { width, height } = this.scale;

    // Overlay
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.85)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(200);

    // Title
    const title = isVictory ? '🎉 HOÀN THÀNH!' : '💥 GAME OVER';
    this.add.text(width / 2, height / 2 - 180, title, {
      fontSize: '48px',
      fontFamily: 'Arial',
      color: isVictory ? '#FFD700' : '#FF6B6B',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    // Score
    this.add.text(width / 2, height / 2 - 100, `Điểm: ${finalScore}`, {
      fontSize: '36px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    // Distance
    this.add.text(width / 2, height / 2 - 60, `Khoảng cách: ${Math.floor(this.distanceTraveled)}m`, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    // Time
    const minutes = Math.floor(timeElapsed / 60);
    const seconds = timeElapsed % 60;
    this.add.text(width / 2, height / 2 - 30, `Thời gian: ${minutes}:${seconds.toString().padStart(2, '0')}`, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    // Items collected
    let yPos = height / 2 + 10;
    this.add.text(width / 2, yPos, 'Vật phẩm thu thập:', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#FFD700'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    yPos += 30;
    const itemText = `💰 ${this.itemsCollected.tien}  🏠 ${this.itemsCollected.tin}  🏡 ${this.itemsCollected.nha}  🚗 ${this.itemsCollected.xe}  📜 ${this.itemsCollected.soDo}  💍 ${this.itemsCollected.vang}`;
    this.add.text(width / 2, yPos, itemText, {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    // Name input prompt
    yPos += 50;
    this.add.text(width / 2, yPos, 'Nhập tên để lưu điểm:', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    // Prompt for name (in real app, use HTML form)
    setTimeout(() => {
      const nameInput = prompt('Nhập tên của bạn:', 'Khách mời');

      if (nameInput) {
        submitScore(nameInput, finalScore, timeElapsed, this.itemsCollected, getDeviceType())
          .then(() => {
            this.scene.start('WeddingInfoScene', {
              score: finalScore,
              playerName: nameInput,
              isVictory: isVictory
            });
          })
          .catch(err => {
            console.error('Failed to submit score:', err);
            this.scene.start('WeddingInfoScene');
          });
      } else {
        this.scene.start('WeddingInfoScene');
      }
    }, 500);
  }

  pauseGame() {
    if (confirm('Tạm dừng. Bạn có muốn xem thông tin đám cưới không?')) {
      this.scene.start('WeddingInfoScene');
    }
  }

  increaseSpeed() {
    if (this.scrollSpeed < GAME_CONSTANTS.MAX_SCROLL_SPEED) {
      this.scrollSpeed = Math.min(
        this.scrollSpeed + GAME_CONSTANTS.SPEED_INCREMENT,
        GAME_CONSTANTS.MAX_SCROLL_SPEED
      );
      this.currentSpeedTier++;
    }
  }

  updateGameTimer() {
    this.gameTime = Math.floor((Date.now() - this.startTime) / 1000);
    const minutes = Math.floor(this.gameTime / 60);
    const seconds = this.gameTime % 60;
    this.timerText.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);
  }

  updateScoreDisplay() {
    const isMobile = this.isMobileDevice();

    // Mobile: compact format, Desktop: full format
    if (isMobile) {
      this.scoreText.setText(`${this.score}`);
      this.distanceText.setText(`${Math.floor(this.distanceTraveled)}m`);
    } else {
      this.scoreText.setText(`Điểm: ${this.score}`);
      this.distanceText.setText(`Khoảng cách: ${Math.floor(this.distanceTraveled)}m`);
    }
  }

  update(time, delta) {
    if (this.isGameOver) return;

    const deltaInSeconds = delta / 1000;

    // Update distance traveled
    this.distanceTraveled += (this.scrollSpeed * deltaInSeconds) / 100; // Convert px to meters

    // Update distance score
    const distanceScore = Math.floor(this.distanceTraveled * GAME_CONSTANTS.DISTANCE_SCORE_MULTIPLIER);
    this.score = distanceScore;

    // Add item scores
    for (const [itemType, count] of Object.entries(this.itemsCollected)) {
      this.score += count * GAME_CONSTANTS.ITEM_SCORES[itemType];
    }

    this.updateScoreDisplay();

    // Scroll parallax backgrounds
    this.updateParallax(deltaInSeconds);

    // Scroll ground
    this.updateGround(deltaInSeconds);

    // Scroll and update obstacles
    this.updateObstacles(deltaInSeconds);

    // Scroll and update collectibles
    this.updateCollectibles(deltaInSeconds);

    // Spawn obstacles
    if (time - this.lastObstacleTime > this.nextObstacleDelay) {
      this.spawnObstacle();
      this.lastObstacleTime = time;
    }

    // Spawn collectibles
    if (time - this.lastCollectibleTime > GAME_CONSTANTS.COLLECTIBLE_SPAWN_INTERVAL) {
      this.spawnCollectible();
      this.lastCollectibleTime = time;
    }

    // Handle jump input (keyboard)
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) || Phaser.Input.Keyboard.JustDown(this.upKey)) {
      this.jump();
    }
  }

  updateParallax(deltaInSeconds) {
    const scrollDistance = this.scrollSpeed * deltaInSeconds;

    // Clouds (slow)
    this.cloudsLayer.getChildren().forEach(cloud => {
      cloud.x -= scrollDistance * GAME_CONSTANTS.PARALLAX_CLOUDS;
      if (cloud.x < -100) {
        cloud.x = this.scale.width + 100;
      }
    });

    // Mountains (medium)
    this.mountainsBg.x -= scrollDistance * GAME_CONSTANTS.PARALLAX_MOUNTAINS;
    this.mountainsBg2.x -= scrollDistance * GAME_CONSTANTS.PARALLAX_MOUNTAINS;

    if (this.mountainsBg.x + this.mountainsBg.width < 0) {
      this.mountainsBg.x = this.mountainsBg2.x + this.mountainsBg2.width;
    }
    if (this.mountainsBg2.x + this.mountainsBg2.width < 0) {
      this.mountainsBg2.x = this.mountainsBg.x + this.mountainsBg.width;
    }
  }

  updateGround(deltaInSeconds) {
    const scrollDistance = this.scrollSpeed * deltaInSeconds;

    this.groundTiles.getChildren().forEach(tile => {
      tile.x -= scrollDistance;

      // Wrap around when tile goes off-screen
      if (tile.x + tile.width < 0) {
        const rightmostTile = this.groundTiles.getChildren().reduce((max, t) =>
          t.x > max.x ? t : max
        );
        tile.x = rightmostTile.x + tile.width;
      }
    });
  }

  updateObstacles(deltaInSeconds) {
    const scrollDistance = this.scrollSpeed * deltaInSeconds;

    this.obstacles.getChildren().forEach(obstacle => {
      obstacle.x -= scrollDistance;

      // Update flying animation position if it exists
      if (obstacle.getData('isFlying')) {
        // Flying enemies already have tween animation
      }

      // Remove off-screen obstacles
      if (obstacle.x < -100) {
        // Stop any tweens on this obstacle
        this.tweens.killTweensOf(obstacle);
        obstacle.destroy();
      }
    });
  }

  updateCollectibles(deltaInSeconds) {
    const scrollDistance = this.scrollSpeed * deltaInSeconds;

    this.collectibles.getChildren().forEach(item => {
      item.x -= scrollDistance;

      // Remove off-screen collectibles
      if (item.x < -100) {
        item.destroy();
      }
    });
  }
}
