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

    this.groundY = height - 100; // Ground level

    // Create repeating ground tiles
    this.groundTiles = this.add.group();
    const tileWidth = 64;
    const tilesNeeded = Math.ceil(width / tileWidth) + 2;

    for (let i = 0; i < tilesNeeded; i++) {
      const tile = this.add.rectangle(
        i * tileWidth,
        this.groundY,
        tileWidth, 20,
        0x8B4513
      ).setOrigin(0, 0);
      this.groundTiles.add(tile);
    }

    // Ground collision body
    this.ground = this.add.rectangle(width / 2, this.groundY + 10, width * 2, 20, 0x000000, 0);
    this.physics.add.existing(this.ground, true); // Static body
  }

  createPlayer() {
    const { height } = this.scale;

    // Create player sprite (simple rectangle for now - can be replaced with image)
    const playerWidth = 40;
    const playerHeight = 60;

    // Generate player texture
    const graphics = this.add.graphics();
    graphics.fillStyle(0xFF6B6B); // Red color for groom
    graphics.fillRect(0, 0, playerWidth, playerHeight);
    graphics.fillStyle(0x000000); // Black for head
    graphics.fillCircle(playerWidth / 2, 10, 8);
    const playerTexture = graphics.generateTexture('player', playerWidth, playerHeight);
    graphics.destroy();

    // Create player
    this.player = this.physics.add.sprite(150, this.groundY - playerHeight, 'player');
    this.player.setCollideWorldBounds(false);
    this.player.setDisplaySize(playerWidth, playerHeight);

    // Physics
    this.physics.add.collider(this.player, this.ground);

    // Running animation (simple bob up and down)
    this.tweens.add({
      targets: this.player,
      y: this.groundY - playerHeight - 5,
      duration: 200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  createUI() {
    const { width } = this.scale;

    // Score display (top-left, avoiding Dynamic Island)
    this.scoreText = this.add.text(20, 60, 'Điểm: 0', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#000000',
      backgroundColor: '#ffffff',
      padding: { x: 12, y: 6 }
    }).setScrollFactor(0).setDepth(100);

    // Distance display
    this.distanceText = this.add.text(20, 95, 'Khoảng cách: 0m', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#000000',
      backgroundColor: '#ffffff',
      padding: { x: 10, y: 5 }
    }).setScrollFactor(0).setDepth(100);

    // Timer display (top-right, safe from Dynamic Island)
    this.timerText = this.add.text(width - 20, 60, '0:00', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#000000',
      backgroundColor: '#ffffff',
      padding: { x: 12, y: 6 }
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);

    // Combo display (appears when combo active)
    this.comboText = this.add.text(width / 2, 100, '', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#FFD700',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100).setVisible(false);

    // Multiplier display
    this.multiplierText = this.add.text(width - 20, 100, '', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#FFD700',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(100).setVisible(false);

    // Pause button (top-right)
    this.pauseButton = this.add.text(width - 20, 20, '⏸ Tạm dừng', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#000000',
      backgroundColor: '#ffffff',
      padding: { x: 10, y: 5 }
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(100)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.pauseGame());
  }

  setupControls() {
    // Keyboard controls
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);

    // Mouse/Touch controls - tap anywhere to jump
    this.input.on('pointerdown', (pointer) => {
      if (!this.isGameOver && !this.isPaused) {
        this.startJump();
      }
    });

    this.input.on('pointerup', () => {
      this.endJump();
    });
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

  startJump() {
    if (this.player.body.touching.down && !this.isGameOver) {
      this.jumpStartTime = Date.now();
      this.isJumpHeld = true;

      // Initial jump (will be modified if held)
      this.player.setVelocityY(GAME_CONSTANTS.JUMP_VELOCITY_LOW);
    }
  }

  endJump() {
    if (this.isJumpHeld) {
      const holdDuration = Date.now() - this.jumpStartTime;

      // If held long enough, apply high jump
      if (holdDuration >= GAME_CONSTANTS.JUMP_HOLD_THRESHOLD && this.player.body.velocity.y < 0) {
        this.player.setVelocityY(GAME_CONSTANTS.JUMP_VELOCITY_HIGH);
      }

      this.isJumpHeld = false;
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

    // Obstacle types (wedding themed)
    const obstacleTypes = [
      { key: 'cake', width: 50, height: 60, color: 0xFFB6C1, emoji: '🎂' },
      { key: 'gift', width: 40, height: 50, color: 0xFF69B4, emoji: '🎁' },
      { key: 'flower', width: 30, height: 70, color: 0xFF1493, emoji: '💐' },
      { key: 'champagne', width: 25, height: 80, color: 0xFFD700, emoji: '🍾' }
    ];

    const type = Phaser.Utils.Array.GetRandom(obstacleTypes);

    // Create obstacle
    const obstacle = this.add.rectangle(
      width + 50,
      this.groundY - type.height / 2,
      type.width,
      type.height,
      type.color
    );

    // Add emoji label
    const label = this.add.text(obstacle.x, obstacle.y, type.emoji, {
      fontSize: '32px'
    }).setOrigin(0.5);

    this.physics.add.existing(obstacle);
    obstacle.body.setAllowGravity(false);
    obstacle.body.setImmovable(true);
    obstacle.setData('label', label);
    obstacle.setData('type', type.key);

    this.obstacles.add(obstacle);

    // Schedule next obstacle
    this.scheduleNextObstacle();
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
      tien: { emoji: '💰', color: 0xFFD700, size: 20 },
      tin: { emoji: '🏠', color: 0x8B4513, size: 25 },
      nha: { emoji: '🏡', color: 0xFF6347, size: 30 },
      xe: { emoji: '🚗', color: 0x4169E1, size: 30 },
      soDo: { emoji: '📜', color: 0xFF1493, size: 25 },
      vang: { emoji: '💍', color: 0xFFD700, size: 30 }
    };

    const config = itemConfig[itemType];

    // Spawn at varying heights
    const heightVariation = Phaser.Math.Between(-150, -50);
    const y = this.groundY + heightVariation;

    const item = this.add.text(width + 50, y, config.emoji, {
      fontSize: `${config.size}px`
    }).setOrigin(0.5);

    this.physics.add.existing(item);
    item.body.setAllowGravity(false);
    item.setData('itemType', itemType);
    item.setData('score', GAME_CONSTANTS.ITEM_SCORES[itemType]);

    this.collectibles.add(item);

    // Floating animation
    this.tweens.add({
      targets: item,
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
    this.scoreText.setText(`Điểm: ${this.score}`);
    this.distanceText.setText(`Khoảng cách: ${Math.floor(this.distanceTraveled)}m`);
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
      this.startJump();
    }
    if (Phaser.Input.Keyboard.JustUp(this.spaceKey) || Phaser.Input.Keyboard.JustUp(this.upKey)) {
      this.endJump();
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

      // Update label position
      const label = obstacle.getData('label');
      if (label) {
        label.x = obstacle.x;
        label.y = obstacle.y;
      }

      // Remove off-screen obstacles
      if (obstacle.x < -100) {
        if (label) label.destroy();
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
