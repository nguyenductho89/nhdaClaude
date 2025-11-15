import { GAME_EVENTS, gameEvents } from '../utils/GameEvents.js';
import { UIEffectPool } from '../utils/UIEffectPool.js';

/**
 * UIManager (Refactored with Phaser Best Practices)
 * ✅ Thuần Phaser GameObjects (không DOM)
 * ✅ Container cho UI groups
 * ✅ Text objects (BitmapText compatible)
 * ✅ Event-based updates (không update frame-by-frame)
 * ✅ Object Pooling cho effects
 * ✅ RenderTexture cho static UI
 */
export default class UIManager {
  constructor(scene) {
    this.scene = scene;

    // UI Containers
    this.hudContainer = null;
    this.scoreContainer = null;
    this.timerContainer = null;
    this.comboContainer = null;
    this.pauseContainer = null;
    this.jumpButtonContainer = null;

    // Text references
    this.scoreText = null;
    this.distanceText = null;
    this.timerText = null;
    this.comboText = null;
    this.multiplierText = null;

    // RenderTexture for static UI elements
    this.staticUITexture = null;

    // Effect pool
    this.effectPool = null;

    // Input
    this.spaceKey = null;
    this.upKey = null;

    // Timing
    this.startTime = 0;
    this.gameTime = 0;

    // Safe area
    this.safeAreaTop = 0;

    // Event listeners (stored for cleanup)
    this.eventListeners = [];
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
   * Get safe area bottom inset (for iPhone home indicator)
   */
  getSafeAreaBottom() {
    // Try to get safe area insets from CSS environment variables
    if (typeof CSS !== 'undefined' && CSS.supports && CSS.supports('padding-bottom: env(safe-area-inset-bottom)')) {
      // Create a temporary element to measure safe area
      const temp = document.createElement('div');
      temp.style.paddingBottom = 'env(safe-area-inset-bottom)';
      temp.style.position = 'absolute';
      temp.style.visibility = 'hidden';
      document.body.appendChild(temp);
      const computedStyle = window.getComputedStyle(temp);
      const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
      document.body.removeChild(temp);
      return paddingBottom;
    }
    
    // Fallback: return typical iPhone safe area bottom (usually 20-34px)
    const isIPhone = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isIPhone) {
      // iPhone X and later have home indicator (~34px), older iPhones have less
      return 34;
    }
    
    return 0;
  }

  /**
   * Initialize UI system
   */
  initialize() {
    // Create effect pool
    this.effectPool = new UIEffectPool(this.scene, 30);

    // Setup event listeners (event-based updates)
    this.setupEventListeners();

    // Create UI
    this.createUI();

    // Start timer
    this.startTime = Date.now();
  }

  /**
   * Setup event-based listeners (NO frame-by-frame updates!)
   */
  setupEventListeners() {
    // Score events
    const onScoreChanged = (score, distance) => {
      this.updateScoreDisplay(score, distance);
    };
    gameEvents.on(GAME_EVENTS.SCORE_CHANGED, onScoreChanged);
    this.eventListeners.push({ event: GAME_EVENTS.SCORE_CHANGED, fn: onScoreChanged });

    // Timer events
    const onTimerUpdate = () => {
      this.updateGameTimer();
    };
    gameEvents.on(GAME_EVENTS.TIMER_UPDATED, onTimerUpdate);
    this.eventListeners.push({ event: GAME_EVENTS.TIMER_UPDATED, fn: onTimerUpdate });

    // Combo events
    const onComboChanged = (comboCount, active) => {
      if (active && comboCount > 0) {
        this.comboText.setText(`🔥 COMBO x${comboCount}`);
        this.comboContainer.setVisible(true);
      } else {
        this.comboContainer.setVisible(false);
      }
    };
    gameEvents.on(GAME_EVENTS.COMBO_CHANGED, onComboChanged);
    this.eventListeners.push({ event: GAME_EVENTS.COMBO_CHANGED, fn: onComboChanged });

    // Multiplier events
    const onMultiplierChanged = (multiplier) => {
      if (multiplier > 1) {
        this.multiplierText.setText(`⭐ x${multiplier}`);
        this.multiplierContainer.setVisible(true);
      } else {
        this.multiplierContainer.setVisible(false);
      }
    };
    gameEvents.on(GAME_EVENTS.MULTIPLIER_CHANGED, onMultiplierChanged);
    this.eventListeners.push({ event: GAME_EVENTS.MULTIPLIER_CHANGED, fn: onMultiplierChanged });

    // Item collection event
    const onItemCollected = (x, y, itemType, points) => {
      this.effectPool.playCollectEffect(x, y);
      this.effectPool.playFloatingText(x, y, `+${points}`, '#FFD700');
    };
    gameEvents.on(GAME_EVENTS.ITEM_COLLECTED, onItemCollected);
    this.eventListeners.push({ event: GAME_EVENTS.ITEM_COLLECTED, fn: onItemCollected });

    // Power-up events
    const onInvincibilityActivated = () => {
      this.effectPool.showNotification('🚗 BẤT TỬ 5S!', '#00FFFF', 5000);
    };
    gameEvents.on(GAME_EVENTS.INVINCIBILITY_ACTIVATED, onInvincibilityActivated);
    this.eventListeners.push({ event: GAME_EVENTS.INVINCIBILITY_ACTIVATED, fn: onInvincibilityActivated });

    const onMultiplierActivated = () => {
      this.effectPool.showNotification('💍 ĐIỂM x2 - 10S!', '#FFD700', 10000);
    };
    gameEvents.on(GAME_EVENTS.MULTIPLIER_ACTIVATED, onMultiplierActivated);
    this.eventListeners.push({ event: GAME_EVENTS.MULTIPLIER_ACTIVATED, fn: onMultiplierActivated });

    // Scene change event - DISABLED (no notification)
    // const onSceneChanged = (sceneType) => {
    //   this.showSceneChangeNotification(sceneType);
    // };
    // gameEvents.on(GAME_EVENTS.SCENE_CHANGED, onSceneChanged);
    // this.eventListeners.push({ event: GAME_EVENTS.SCENE_CHANGED, fn: onSceneChanged });
  }

  /**
   * Create all UI elements using Containers
   */
  createUI() {
    const { width, height } = this.scene.scale;
    const isMobile = this.isMobileDevice();
    const isLandscape = width > height;

    // Font sizes - smaller for landscape
    let baseFontSize, smallFontSize;
    if (isMobile && isLandscape) {
      baseFontSize = 14;
      smallFontSize = 11;
    } else if (isMobile) {
      baseFontSize = 16;
      smallFontSize = 12;
    } else {
      baseFontSize = 24;
      smallFontSize = 18;
    }

    // Margins - reduced for landscape
    let topMargin, leftMargin, rightMargin, padding, lineSpacing;
    if (isMobile && isLandscape) {
      topMargin = 3 + this.safeAreaTop;
      leftMargin = 3;
      rightMargin = 3;
      padding = 3;
      lineSpacing = 18;
    } else if (isMobile) {
      topMargin = 5 + this.safeAreaTop;
      leftMargin = 5;
      rightMargin = 5;
      padding = 4;
      lineSpacing = 22;
    } else {
      topMargin = 60;
      leftMargin = 20;
      rightMargin = 20;
      padding = 8;
      lineSpacing = 35;
    }

    // === LEFT COLUMN CONTAINER - Score and Distance ===
    this.scoreContainer = this.scene.add.container(leftMargin, topMargin);
    this.scoreContainer.setScrollFactor(0);
    this.scoreContainer.setDepth(100);

    this.scoreText = this.scene.add.text(0, 0, 'Điểm: 0', {
      fontSize: `${baseFontSize}px`,
      fontFamily: 'Arial',
      color: '#000000',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      padding: { x: padding, y: padding / 2 }
    });

    this.distanceText = this.scene.add.text(0, lineSpacing, '0m', {
      fontSize: `${smallFontSize}px`,
      fontFamily: 'Arial',
      color: '#000000',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      padding: { x: padding, y: padding / 2 }
    });

    this.scoreContainer.add([this.scoreText, this.distanceText]);

    // === RIGHT COLUMN CONTAINER - Timer and Pause ===
    this.timerContainer = this.scene.add.container(width - rightMargin, topMargin);
    this.timerContainer.setScrollFactor(0);
    this.timerContainer.setDepth(100);

    this.timerText = this.scene.add.text(0, 0, '0:00', {
      fontSize: `${baseFontSize}px`,
      fontFamily: 'Arial',
      color: '#000000',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      padding: { x: padding, y: padding / 2 }
    }).setOrigin(1, 0);

    const pauseButton = this.scene.add.text(0, lineSpacing, '⏸', {
      fontSize: `${baseFontSize}px`,
      fontFamily: 'Arial',
      color: '#000000',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      padding: { x: padding, y: padding / 2 }
    }).setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.pauseGame());

    this.timerContainer.add([this.timerText, pauseButton]);

    // === CENTER CONTAINER - Combo and Multiplier ===
    let centerY;
    if (isMobile && isLandscape) {
      centerY = 35; // Higher position for landscape to save vertical space
    } else if (isMobile) {
      centerY = 60;
    } else {
      centerY = 100;
    }

    this.comboContainer = this.scene.add.container(width / 2, centerY);
    this.comboContainer.setScrollFactor(0);
    this.comboContainer.setDepth(100);
    this.comboContainer.setVisible(false);

    this.comboText = this.scene.add.text(0, 0, '', {
      fontSize: `${baseFontSize}px`,
      fontFamily: 'Arial',
      color: '#FFD700',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: { x: padding + 2, y: padding }
    }).setOrigin(0.5, 0);

    this.comboContainer.add(this.comboText);

    this.multiplierContainer = this.scene.add.container(width / 2, centerY + 25);
    this.multiplierContainer.setScrollFactor(0);
    this.multiplierContainer.setDepth(100);
    this.multiplierContainer.setVisible(false);

    this.multiplierText = this.scene.add.text(0, 0, '', {
      fontSize: `${smallFontSize}px`,
      fontFamily: 'Arial',
      color: '#FFD700',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: { x: padding, y: padding / 2 }
    }).setOrigin(0.5, 0);

    this.multiplierContainer.add(this.multiplierText);

    // === MOBILE JUMP BUTTON CONTAINER ===
    if (isMobile) {
      this.createMobileJumpButton();
    }
  }

  /**
   * Create mobile jump button using Container
   */
  createMobileJumpButton() {
    const { width, height } = this.scene.scale;
    const isLandscape = width > height;
    const isIPhone = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    const buttonSize = isLandscape ? 80 : 100; // Smaller in landscape
    let margin = 10;
    let rightMargin = 30; // Increased right margin to avoid being covered

    // Increase bottom margin for iPhone to avoid safe area (home indicator)
    if (isIPhone) {
      // Get safe area insets if available
      const safeAreaBottom = this.getSafeAreaBottom();
      margin = Math.max(20, safeAreaBottom + 10); // At least 20px, or safe area + 10px
    }

    const buttonX = width - buttonSize / 2 - rightMargin;
    const buttonY = height - buttonSize / 2 - margin;

    // Create container for jump button
    this.jumpButtonContainer = this.scene.add.container(buttonX, buttonY);
    this.jumpButtonContainer.setScrollFactor(0);
    this.jumpButtonContainer.setDepth(100);

    // Button background circle
    const bg = this.scene.add.circle(0, 0, buttonSize / 2, 0xFFFFFF, 0.4);

    // Button border
    const border = this.scene.add.circle(0, 0, buttonSize / 2 + 4, 0xFFFFFF, 0.2);

    // Button icon - adjust size based on button size
    const iconSize = isLandscape ? '44px' : '56px';
    const icon = this.scene.add.text(0, 0, '⬆', {
      fontSize: iconSize,
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: isLandscape ? 2 : 3
    }).setOrigin(0.5);

    // Hit area (larger for easier tapping)
    const hitAreaSize = isLandscape ? buttonSize + 15 : buttonSize + 25;
    const hitArea = this.scene.add.rectangle(0, 0, hitAreaSize, hitAreaSize, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.onJumpButtonDown();
        bg.setAlpha(0.7);
        icon.setScale(1.2);
        border.setAlpha(0.5);
      })
      .on('pointerup', () => {
        bg.setAlpha(0.4);
        icon.setScale(1);
        border.setAlpha(0.2);
      })
      .on('pointerout', () => {
        bg.setAlpha(0.4);
        icon.setScale(1);
        border.setAlpha(0.2);
      });

    this.jumpButtonContainer.add([border, bg, icon, hitArea]);

    // Store references
    this.jumpButtonContainer.bg = bg;
    this.jumpButtonContainer.icon = icon;
    this.jumpButtonContainer.border = border;
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
   * Update game timer display (event-driven)
   */
  updateGameTimer() {
    this.gameTime = Math.floor((Date.now() - this.startTime) / 1000);
    const minutes = Math.floor(this.gameTime / 60);
    const seconds = this.gameTime % 60;
    this.timerText.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);
  }

  /**
   * Update score and distance display (event-driven)
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
    gameEvents.emitEvent(GAME_EVENTS.GAME_PAUSED);
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
   * Get effect pool
   */
  getEffectPool() {
    return this.effectPool;
  }

  /**
   * Show scene change notification
   */
  showSceneChangeNotification(sceneType) {
    let sceneText = '';
    let sceneColor = '#FFD700';
    
    if (sceneType === 'mountain-river') {
      sceneText = '🏔️ NÚI SÔNG';
      sceneColor = '#87CEEB';
    } else if (sceneType === 'street') {
      sceneText = '🏙️ ĐƯỜNG PHỐ';
      sceneColor = '#FF7F50';
    } else if (sceneType === 'forest') {
      sceneText = '🌲 KHU RỪNG';
      sceneColor = '#4CAF50';
    }

    if (sceneText) {
      this.effectPool.showNotification(sceneText, sceneColor, 2500);
    }
  }

  /**
   * Destroy UI elements and cleanup event listeners
   */
  destroy() {
    // Remove all event listeners
    this.eventListeners.forEach(({ event, fn }) => {
      gameEvents.off(event, fn);
    });
    this.eventListeners = [];

    // Destroy containers (will destroy children too)
    if (this.scoreContainer) this.scoreContainer.destroy();
    if (this.timerContainer) this.timerContainer.destroy();
    if (this.comboContainer) this.comboContainer.destroy();
    if (this.multiplierContainer) this.multiplierContainer.destroy();
    if (this.jumpButtonContainer) this.jumpButtonContainer.destroy();

    // Destroy effect pool
    if (this.effectPool) this.effectPool.destroy();

    // Destroy static UI texture
    if (this.staticUITexture) this.staticUITexture.destroy();
  }
}
