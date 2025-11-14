/**
 * UIManager
 * Handles all UI elements, controls, and display updates
 */
export default class UIManager {
  constructor(scene) {
    this.scene = scene;

    // UI elements
    this.scoreText = null;
    this.distanceText = null;
    this.timerText = null;
    this.pauseButton = null;
    this.comboText = null;
    this.multiplierText = null;

    // Mobile controls
    this.jumpButton = null;
    this.jumpButtonBg = null;
    this.jumpButtonIcon = null;
    this.jumpButtonBorder = null;

    // Input
    this.spaceKey = null;
    this.upKey = null;

    // Timing
    this.startTime = 0;
    this.gameTime = 0;

    // Safe area
    this.safeAreaTop = 0;
  }

  /**
   * Check if device is mobile
   */
  isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || (window.innerWidth < 768);
  }

  /**
   * Set safe area for mobile devices
   */
  setSafeArea(safeAreaTop) {
    this.safeAreaTop = safeAreaTop;
  }

  /**
   * Create all UI elements
   */
  createUI() {
    const { width, height } = this.scene.scale;
    const isMobile = this.isMobileDevice();

    // Compact font sizes for mobile
    const baseFontSize = isMobile ? 16 : 24;
    const smallFontSize = isMobile ? 12 : 18;

    // Absolute minimal margins (with safe area offset for mobile)
    const topMargin = isMobile ? (5 + this.safeAreaTop) : 60;
    const leftMargin = isMobile ? 5 : 20;
    const rightMargin = isMobile ? 5 : 20;
    const padding = isMobile ? 4 : 8;

    // Line spacing for mobile
    const lineSpacing = isMobile ? 22 : 35;

    // LEFT COLUMN - Score and Distance
    this.scoreText = this.scene.add.text(leftMargin, topMargin, 'Điểm: 0', {
      fontSize: `${baseFontSize}px`,
      fontFamily: 'Arial',
      color: '#000000',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      padding: { x: padding, y: padding / 2 }
    }).setScrollFactor(0).setDepth(100);

    this.distanceText = this.scene.add.text(leftMargin, topMargin + lineSpacing, '0m', {
      fontSize: `${smallFontSize}px`,
      fontFamily: 'Arial',
      color: '#000000',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      padding: { x: padding, y: padding / 2 }
    }).setScrollFactor(0).setDepth(100);

    // RIGHT COLUMN - Timer on top
    this.timerText = this.scene.add.text(width - rightMargin, topMargin, '0:00', {
      fontSize: `${baseFontSize}px`,
      fontFamily: 'Arial',
      color: '#000000',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      padding: { x: padding, y: padding / 2 }
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);

    // Pause button below timer (right side)
    const pauseText = isMobile ? '⏸' : '⏸';
    this.pauseButton = this.scene.add.text(width - rightMargin, topMargin + lineSpacing, pauseText, {
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

    this.comboText = this.scene.add.text(width / 2, centerY, '', {
      fontSize: `${baseFontSize}px`,
      fontFamily: 'Arial',
      color: '#FFD700',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: { x: padding + 2, y: padding }
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100).setVisible(false);

    this.multiplierText = this.scene.add.text(width / 2, centerY + 25, '', {
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

    // Start timer
    this.startTime = Date.now();
  }

  /**
   * Create mobile jump button
   */
  createMobileJumpButton() {
    const { width, height } = this.scene.scale;

    // Large button, positioned at absolute corner
    const buttonSize = 100;
    const margin = 10; // Ultra minimal margin

    const buttonX = width - buttonSize / 2 - margin;
    const buttonY = height - buttonSize / 2 - margin;

    // Button background circle with better contrast
    this.jumpButtonBg = this.scene.add.circle(buttonX, buttonY, buttonSize / 2, 0xFFFFFF, 0.4)
      .setScrollFactor(0)
      .setDepth(100);

    // Add border for better visibility
    const buttonBorder = this.scene.add.circle(buttonX, buttonY, buttonSize / 2 + 4, 0xFFFFFF, 0.2)
      .setScrollFactor(0)
      .setDepth(99);

    // Button icon - large and clear
    this.jumpButtonIcon = this.scene.add.text(buttonX, buttonY, '⬆', {
      fontSize: '56px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

    // Button interactive area (larger for easier tapping)
    const hitAreaSize = buttonSize + 25;
    this.jumpButton = this.scene.add.rectangle(buttonX, buttonY, hitAreaSize, hitAreaSize, 0x000000, 0)
      .setScrollFactor(0)
      .setDepth(102)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.onJumpButtonDown();
        // Enhanced visual feedback
        this.jumpButtonBg.setAlpha(0.7);
        this.jumpButtonIcon.setScale(1.2);
        buttonBorder.setAlpha(0.5);
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

  /**
   * Setup keyboard and pointer controls
   */
  setupControls(onJumpCallback) {
    this.onJumpCallback = onJumpCallback;

    // Keyboard controls
    this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.upKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);

    // Mouse/Touch controls - tap anywhere to jump (except UI elements)
    if (!this.isMobileDevice()) {
      // Desktop: click anywhere to jump
      this.scene.input.on('pointerdown', (pointer) => {
        // Don't jump if clicking on UI buttons
        if (pointer.y > 140) { // Below UI area
          this.onJumpCallback();
        }
      });
    }
    // Mobile uses dedicated jump button created in createMobileJumpButton()
  }

  /**
   * Handle jump button press
   */
  onJumpButtonDown() {
    if (this.onJumpCallback) {
      this.onJumpCallback();
    }
  }

  /**
   * Check if jump keys are pressed
   */
  isJumpPressed() {
    return Phaser.Input.Keyboard.JustDown(this.spaceKey) || Phaser.Input.Keyboard.JustDown(this.upKey);
  }

  /**
   * Update game timer display
   */
  updateGameTimer() {
    this.gameTime = Math.floor((Date.now() - this.startTime) / 1000);
    const minutes = Math.floor(this.gameTime / 60);
    const seconds = this.gameTime % 60;
    this.timerText.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);
  }

  /**
   * Update score and distance display
   */
  updateScoreDisplay(score, distance) {
    const isMobile = this.isMobileDevice();

    // Mobile: compact format, Desktop: full format
    if (isMobile) {
      this.scoreText.setText(`${score}`);
      this.distanceText.setText(`${Math.floor(distance)}m`);
    } else {
      this.scoreText.setText(`Điểm: ${score}`);
      this.distanceText.setText(`Khoảng cách: ${Math.floor(distance)}m`);
    }
  }

  /**
   * Pause game and redirect
   */
  pauseGame() {
    if (confirm('Tạm dừng. Bạn có muốn xem thông tin đám cưới không?')) {
      window.location.href = 'wedding-info.html';
    }
  }

  /**
   * Get UI references for other managers
   */
  getUIReferences() {
    return {
      scoreText: this.scoreText,
      distanceText: this.distanceText,
      timerText: this.timerText,
      pauseButton: this.pauseButton,
      comboText: this.comboText,
      multiplierText: this.multiplierText
    };
  }

  /**
   * Get game time in seconds
   */
  getGameTime() {
    return this.gameTime;
  }

  /**
   * Destroy UI elements
   */
  destroy() {
    if (this.scoreText) this.scoreText.destroy();
    if (this.distanceText) this.distanceText.destroy();
    if (this.timerText) this.timerText.destroy();
    if (this.pauseButton) this.pauseButton.destroy();
    if (this.comboText) this.comboText.destroy();
    if (this.multiplierText) this.multiplierText.destroy();
    if (this.jumpButton) this.jumpButton.destroy();
    if (this.jumpButtonBg) this.jumpButtonBg.destroy();
    if (this.jumpButtonIcon) this.jumpButtonIcon.destroy();
    if (this.jumpButtonBorder) this.jumpButtonBorder.destroy();
  }
}
