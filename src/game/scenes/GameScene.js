import Phaser from 'phaser';
import { GAME_CONSTANTS } from '../../config/game.js';
import { submitScore, getDeviceType } from '../../services/leaderboard.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.score = 0;
    this.itemsCollected = {
      tien: 0,
      tin: 0,
      nha: 0,
      xe: 0,
      soDo: 0,
      vang: 0
    };
    this.startTime = 0;
  }

  create() {
    const { width, height } = this.scale;

    // Start timer
    this.startTime = Date.now();

    // Background
    this.add.rectangle(0, 0, width, height, 0x87CEEB).setOrigin(0);

    // Create ground
    this.platforms = this.physics.add.staticGroup();
    const ground = this.add.rectangle(width / 2, height - 32, width, 64, 0x8B4513).setOrigin(0.5);
    this.platforms.add(ground);

    // Create floating platforms
    this.createPlatforms();

    // Create player (simple rectangle for now)
    this.player = this.physics.add.sprite(100, height - 200, null);
    this.player.setDisplaySize(32, 48);
    const playerGraphics = this.add.graphics();
    playerGraphics.fillStyle(0xFF0000);
    playerGraphics.fillRect(-16, -24, 32, 48);
    const playerTexture = playerGraphics.generateTexture('player', 32, 48);
    playerGraphics.destroy();
    this.player.setTexture('player');

    this.player.setBounce(0.1);
    this.player.setCollideWorldBounds(true);

    // Collision
    this.physics.add.collider(this.player, this.platforms);

    // Create collectibles
    this.collectibles = this.physics.add.group();
    this.createCollectibles();
    this.physics.add.overlap(this.player, this.collectibles, this.collectItem, null, this);

    // Create goal (bride/princess)
    this.goal = this.physics.add.sprite(width - 100, height - 200, null);
    this.goal.setDisplaySize(32, 48);
    const goalGraphics = this.add.graphics();
    goalGraphics.fillStyle(0xFFB6C1);
    goalGraphics.fillRect(-16, -24, 32, 48);
    const goalTexture = goalGraphics.generateTexture('goal', 32, 48);
    goalGraphics.destroy();
    this.goal.setTexture('goal');
    this.physics.add.overlap(this.player, this.goal, this.reachGoal, null, this);

    // UI
    this.scoreText = this.add.text(16, 16, 'Điểm: 0', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#000000',
      backgroundColor: '#ffffff',
      padding: { x: 10, y: 5 }
    }).setScrollFactor(0);

    this.timeText = this.add.text(16, 50, 'Thời gian: 0s', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#000000',
      backgroundColor: '#ffffff',
      padding: { x: 10, y: 5 }
    }).setScrollFactor(0);

    // Controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Mobile controls
    if (/mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
      this.createMobileControls();
    }

    // Pause button
    this.createPauseButton();

    // Update timer
    this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true
    });
  }

  createPlatforms() {
    const { width, height } = this.scale;
    const platformData = [
      { x: 200, y: height - 150, w: 150, h: 20 },
      { x: 400, y: height - 250, w: 150, h: 20 },
      { x: 600, y: height - 200, w: 150, h: 20 },
      { x: 800, y: height - 300, w: 150, h: 20 },
      { x: 1000, y: height - 250, w: 150, h: 20 }
    ];

    platformData.forEach(p => {
      const platform = this.add.rectangle(p.x, p.y, p.w, p.h, 0x00AA00);
      this.platforms.add(platform);
    });
  }

  createCollectibles() {
    const { width, height } = this.scale;
    const itemTypes = ['tien', 'tin', 'nha', 'xe', 'soDo', 'vang'];
    const itemColors = {
      tien: 0xFFD700, // Gold
      tin: 0x8B4513,  // Brown
      nha: 0xFF6347,  // Red
      xe: 0x4169E1,   // Blue
      soDo: 0xFF1493, // Pink
      vang: 0xFFD700  // Gold
    };

    for (let i = 0; i < 15; i++) {
      const x = 150 + i * 80;
      const y = height - 100 - Math.random() * 300;
      const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];

      const item = this.add.circle(x, y, 12, itemColors[itemType]);
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
  }

  collectItem(player, item) {
    const itemType = item.getData('itemType');
    const itemScore = item.getData('score');

    this.itemsCollected[itemType]++;
    this.score += itemScore;
    this.scoreText.setText(`Điểm: ${this.score}`);

    item.destroy();

    // Particle effect (simple)
    const circle = this.add.circle(item.x, item.y, 12, 0xFFFFFF);
    this.tweens.add({
      targets: circle,
      alpha: 0,
      scale: 2,
      duration: 300,
      onComplete: () => circle.destroy()
    });
  }

  reachGoal() {
    // Game completed
    const timeElapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const timeBonus = Math.max(0, 300 - timeElapsed) * GAME_CONSTANTS.TIME_BONUS_PER_SECOND;
    const finalScore = this.score + GAME_CONSTANTS.COMPLETION_BONUS + timeBonus;

    console.log('Game completed!', {
      score: finalScore,
      time: timeElapsed,
      items: this.itemsCollected
    });

    // Show victory screen
    this.showVictoryScreen(finalScore, timeElapsed);
  }

  showVictoryScreen(finalScore, timeElapsed) {
    const { width, height } = this.scale;

    // Overlay
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0).setScrollFactor(0);

    // Victory text
    this.add.text(width / 2, height / 2 - 150, 'HOÀN THÀNH!', {
      fontSize: '48px',
      fontFamily: 'Arial',
      color: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0);

    // Score
    this.add.text(width / 2, height / 2 - 70, `Điểm: ${finalScore}`, {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0);

    // Time
    this.add.text(width / 2, height / 2 - 30, `Thời gian: ${timeElapsed}s`, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0);

    // Name input prompt
    this.add.text(width / 2, height / 2 + 20, 'Nhập tên để lưu điểm:', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0);

    // Simple name input (in real app, use HTML form)
    const nameInput = prompt('Nhập tên của bạn:', 'Khách mời');

    if (nameInput) {
      // Submit score
      submitScore(nameInput, finalScore, timeElapsed, this.itemsCollected, getDeviceType())
        .then(() => {
          // Go to wedding info
          this.scene.start('WeddingInfoScene', {
            score: finalScore,
            playerName: nameInput
          });
        })
        .catch(err => {
          console.error('Failed to submit score:', err);
          this.scene.start('WeddingInfoScene');
        });
    } else {
      this.scene.start('WeddingInfoScene');
    }
  }

  createMobileControls() {
    const { width, height } = this.scale;

    // Left/Right buttons
    const leftBtn = this.add.rectangle(80, height - 80, 60, 60, 0x4CAF50, 0.7)
      .setScrollFactor(0)
      .setInteractive()
      .on('pointerdown', () => { this.leftPressed = true; })
      .on('pointerup', () => { this.leftPressed = false; })
      .on('pointerout', () => { this.leftPressed = false; });

    this.add.text(80, height - 80, '←', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0);

    const rightBtn = this.add.rectangle(180, height - 80, 60, 60, 0x4CAF50, 0.7)
      .setScrollFactor(0)
      .setInteractive()
      .on('pointerdown', () => { this.rightPressed = true; })
      .on('pointerup', () => { this.rightPressed = false; })
      .on('pointerout', () => { this.rightPressed = false; });

    this.add.text(180, height - 80, '→', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0);

    // Jump button
    const jumpBtn = this.add.rectangle(width - 80, height - 80, 80, 80, 0xFF5722, 0.7)
      .setScrollFactor(0)
      .setInteractive()
      .on('pointerdown', () => {
        if (this.player.body.touching.down) {
          this.player.setVelocityY(-GAME_CONSTANTS.PLAYER_JUMP);
        }
      });

    this.add.text(width - 80, height - 80, '⬆', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0);
  }

  createPauseButton() {
    const { width } = this.scale;
    this.add.text(width - 80, 16, '⏸ Pause', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#000000',
      backgroundColor: '#ffffff',
      padding: { x: 10, y: 5 }
    }).setScrollFactor(0).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        // TODO: Implement pause menu
        if (confirm('Tạm dừng. Bạn có muốn xem thông tin đám cưới không?')) {
          this.scene.start('WeddingInfoScene');
        }
      });
  }

  updateTimer() {
    const timeElapsed = Math.floor((Date.now() - this.startTime) / 1000);
    this.timeText.setText(`Thời gian: ${timeElapsed}s`);
  }

  update() {
    // Player movement
    if (this.cursors.left.isDown || this.leftPressed) {
      this.player.setVelocityX(-GAME_CONSTANTS.PLAYER_SPEED);
    } else if (this.cursors.right.isDown || this.rightPressed) {
      this.player.setVelocityX(GAME_CONSTANTS.PLAYER_SPEED);
    } else {
      this.player.setVelocityX(0);
    }

    // Jump
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && this.player.body.touching.down) {
      this.player.setVelocityY(-GAME_CONSTANTS.PLAYER_JUMP);
    }
  }
}
