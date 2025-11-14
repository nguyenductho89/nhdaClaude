import Phaser from 'phaser';
import { GAME_CONSTANTS } from '../../config/game.js';
import { submitScore, getDeviceType } from '../../services/leaderboard.js';
import {
  requireLandscapeOrientation,
  releaseLandscapeOrientation,
  refreshOrientationLayout,
  getLandscapeViewportSize
} from '../../services/orientation.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });

    // Debug settings
    this.DEBUG_HITBOXES = false; // Set to true to show all hitboxes

    // Game state
    this.isGameOver = false;
    this.isInvincible = false;
    this.hasCollision = false;
    this.isWaitingForLandscape = false;
    this.gameInitialized = false;
    this.orientationCallbacksRegistered = false;

    // Scoring
    this.score = 0;
    this.distanceTraveled = 0;
    this.itemsCollected = {
      tien: 0,
      tin: 0,
      nha: 0,
      xe: 0,
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

    // Scene management - scenes will rotate during gameplay
    this.sceneTypes = ['beach', 'mountain-river', 'street'];
    // Start with random scene instead of first one
    this.currentSceneIndex = Phaser.Math.Between(0, this.sceneTypes.length - 1);
    this.sceneType = this.sceneTypes[this.currentSceneIndex];
    this.sceneChangeInterval = 19000; // 19 seconds per scene (switch before 20s to avoid conflicts)
    this.isSwitchingScene = false; // Prevent double switching
    this.lastSceneChangeTime = 0; // Track last scene change
    console.log('Starting with scene:', this.sceneType);
  }

  preload() {
    // Load player image
    this.load.image('playerImage', '/player.png');
  }

  create() {
    // Setup cleanup handlers first
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, releaseLandscapeOrientation);
    this.events.once(Phaser.Scenes.Events.DESTROY, releaseLandscapeOrientation);

    // Check if currently in landscape using window dimensions (not game scale)
    const isCurrentlyLandscape = window.innerWidth >= window.innerHeight;

    // Setup orientation monitoring with callbacks ONLY ONCE
    if (!this.orientationCallbacksRegistered) {
      this.orientationCallbacksRegistered = true;

      requireLandscapeOrientation({
        onLandscape: () => {
          console.log('Landscape detected, resuming game...');
          this.isWaitingForLandscape = false;

          // Resume the scene if paused
          if (this.scene.isPaused()) {
            // Wait a bit for orientation overlay to hide completely
            setTimeout(() => {
              requestAnimationFrame(() => {
                // Ensure canvas and container are visible
                const container = document.getElementById('game-container');
                if (container) {
                  container.style.visibility = 'visible';
                  container.style.opacity = '1';
                  // Force repaint
                  void container.offsetHeight;
                }

                this.game.canvas.style.display = 'block';
                this.game.canvas.style.visibility = 'visible';
                this.game.canvas.style.opacity = '1';
                // Force repaint
                void this.game.canvas.offsetHeight;

                // Resize if needed
                const { width: desiredWidth, height: desiredHeight } = getLandscapeViewportSize();
                if (desiredWidth !== this.scale.width || desiredHeight !== this.scale.height) {
                  this.scale.resize(desiredWidth, desiredHeight);
                }

                // Force renderer to update
                if (this.game.renderer && this.game.renderer.resize) {
                  this.game.renderer.resize(desiredWidth, desiredHeight);
                }

                // Resume scene - this will restart the game loop
                this.scene.resume();

                // Force a render immediately after resume
                requestAnimationFrame(() => {
                  if (this.sys && this.sys.renderer) {
                    this.sys.renderer.render(this.sys.displayList, this.cameras.main);
                  }
                });
              });
            }, 150);
          }
        },
        onPortrait: () => {
          console.log('Portrait detected, pausing game...');
          // Pause game when rotated to portrait (only if game is initialized and running)
          if (this.gameInitialized && !this.isGameOver && !this.isWaitingForLandscape) {
            this.isWaitingForLandscape = true;
            this.scene.pause();
          }
        }
      });
    }

    // Always resize to proper dimensions
    const { width: desiredWidth, height: desiredHeight } = getLandscapeViewportSize();

    if (desiredWidth !== this.scale.width || desiredHeight !== this.scale.height) {
      this.scale.resize(desiredWidth, desiredHeight);
    }

    refreshOrientationLayout();

    if (typeof this.scale.lockOrientation === 'function') {
      try {
        this.scale.lockOrientation('landscape');
      } catch (error) {
        // Orientation lock may fail on unsupported browsers; ignore gracefully.
      }
    }

    // ALWAYS initialize the game, regardless of orientation
    // This ensures all game objects are created and canvas is rendered
    this.initializeGame();

    // If not in landscape, pause immediately after initialization
    if (!isCurrentlyLandscape) {
      this.isWaitingForLandscape = true;
      console.log('Starting in portrait mode - pausing after initialization');
      // Use setTimeout to pause after Phaser finishes first render cycle
      setTimeout(() => {
        this.scene.pause();
      }, 100);
    }
  }

  initializeGame() {
    // Prevent double initialization
    if (this.gameInitialized) {
      return;
    }
    this.gameInitialized = true;

    const { width, height } = this.scale;

    // Safe area offset for mobile (avoid notch/status bar on iOS)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.safeAreaTop = isMobile ? 50 : 0; // 50px offset for mobile notch/status bar

    // Auto fullscreen
    this.scale.startFullscreen();

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
    // Create scene based on selected type
    console.log('🎨 Creating background for scene:', this.sceneType);
    if (this.sceneType === 'street') {
      this.createStreetScene();
    } else if (this.sceneType === 'beach') {
      console.log('🏖️ Calling createBeachScene()...');
      this.createBeachScene();
      console.log('🏖️ createBeachScene() completed');
    } else {
      this.createMountainRiverScene();
    }
  }

  createMountainRiverScene() {
    const { width, height } = this.scale;

    // Sky layer with beautiful gradient (top to bottom: dark blue to light blue)
    const skyGraphics = this.add.graphics();
    skyGraphics.fillGradientStyle(0x5B9BD5, 0x5B9BD5, 0x87CEEB, 0x87CEEB, 1);
    skyGraphics.fillRect(0, 0, width, height * 0.6);
    skyGraphics.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xE6F3FF, 0xE6F3FF, 1);
    skyGraphics.fillRect(0, height * 0.6, width, height * 0.4);

    // Sun (mặt trời)
    const sunY = height * 0.15 + this.safeAreaTop;
    const sun = this.add.circle(width * 0.85, sunY, 40, 0xFDB813, 1);
    sun.setAlpha(0.9);
    // Sun glow
    const sunGlow = this.add.circle(width * 0.85, sunY, 55, 0xFDB813, 0.3);

    // Clouds layer (beautiful fluffy clouds)
    this.cloudsLayer = this.add.group();
    for (let i = 0; i < 8; i++) {
      const cloudX = i * 250 + Math.random() * 150;
      const cloudY = this.safeAreaTop + 40 + Math.random() * 120;

      // Create cloud group with multiple circles for fluffy effect
      const cloudContainer = this.add.container(cloudX, cloudY);

      // Main cloud body
      const cloud1 = this.add.ellipse(0, 0, 100, 50, 0xffffff, 0.9);
      const cloud2 = this.add.ellipse(-30, -10, 70, 45, 0xffffff, 0.85);
      const cloud3 = this.add.ellipse(30, -5, 80, 40, 0xffffff, 0.85);
      const cloud4 = this.add.ellipse(0, 10, 60, 35, 0xffffff, 0.8);

      cloudContainer.add([cloud1, cloud2, cloud3, cloud4]);
      cloudContainer.setData('baseX', cloudX);
      cloudContainer.setData('speed', 0.8 + Math.random() * 0.4);
      this.cloudsLayer.add(cloudContainer);
    }

    // Birds flying (chim bay)
    this.birdsLayer = this.add.group();
    for (let i = 0; i < 5; i++) {
      const birdX = Math.random() * width;
      const birdY = this.safeAreaTop + 80 + Math.random() * 150;

      // Simple bird shape (V shape)
      const birdGraphics = this.add.graphics();
      birdGraphics.lineStyle(2, 0x2C3E50, 1);
      birdGraphics.beginPath();
      birdGraphics.moveTo(-8, 0);
      birdGraphics.lineTo(0, -5);
      birdGraphics.lineTo(8, 0);
      birdGraphics.strokePath();

      const birdTexture = birdGraphics.generateTexture('bird' + i, 16, 10);
      birdGraphics.destroy();

      const bird = this.add.image(birdX, birdY, 'bird' + i);
      bird.setData('baseX', birdX);
      bird.setData('baseY', birdY);
      bird.setData('speed', 1.5 + Math.random() * 1);
      this.birdsLayer.add(bird);

      // Animate bird flapping
      this.tweens.add({
        targets: bird,
        scaleY: 0.8,
        duration: 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // Far mountains (núi xa - darker, smaller)
    // Adjust mountain position on mobile to avoid safe area at top
    const mountainOffset = this.safeAreaTop * 0.3; // Reduce mountain height slightly on mobile
    const farMountainGraphics = this.add.graphics();
    farMountainGraphics.fillStyle(0x6B8E23, 0.5);
    for (let i = 0; i < 6; i++) {
      const x = i * 250;
      farMountainGraphics.fillTriangle(
        x, height - 180 + mountainOffset,
        x + 100, height - 320 + mountainOffset,
        x + 200, height - 180 + mountainOffset
      );
    }
    const farMountainTexture = farMountainGraphics.generateTexture('farMountains', width * 2, height);
    farMountainGraphics.destroy();

    this.farMountainsBg = this.add.image(0, 0, 'farMountains').setOrigin(0);
    this.farMountainsBg2 = this.add.image(width * 2, 0, 'farMountains').setOrigin(0);

    // Near mountains (núi gần - brighter, bigger)
    this.mountainsLayer = this.add.group();
    const mountainGraphics = this.add.graphics();
    mountainGraphics.fillStyle(0x8B7355, 0.7);
    for (let i = 0; i < 5; i++) {
      const x = i * 350;
      mountainGraphics.fillTriangle(
        x, height - 120 + mountainOffset,
        x + 175, height - 350 + mountainOffset,
        x + 350, height - 120 + mountainOffset
      );
      // Mountain shadows
      mountainGraphics.fillStyle(0x654321, 0.3);
      mountainGraphics.fillTriangle(
        x + 175, height - 350 + mountainOffset,
        x + 350, height - 120 + mountainOffset,
        x + 250, height - 120 + mountainOffset
      );
      mountainGraphics.fillStyle(0x8B7355, 0.7);
    }
    const mountainTexture = mountainGraphics.generateTexture('mountains', width * 2, height);
    mountainGraphics.destroy();

    this.mountainsBg = this.add.image(0, 0, 'mountains').setOrigin(0);
    this.mountainsBg2 = this.add.image(width * 2, 0, 'mountains').setOrigin(0);

    // River (sông) - behind the ground
    const riverGraphics = this.add.graphics();
    riverGraphics.fillGradientStyle(0x4A90E2, 0x4A90E2, 0x87CEEB, 0x87CEEB, 1);
    riverGraphics.fillRect(0, height - 100, width * 2, 70);
    const riverTexture = riverGraphics.generateTexture('river', width * 2, 100);
    riverGraphics.destroy();

    this.riverBg = this.add.image(0, height - 100, 'river').setOrigin(0);
    this.riverBg2 = this.add.image(width * 2, height - 100, 'river').setOrigin(0);

    // Water waves (sóng nước)
    this.wavesLayer = this.add.group();
    for (let i = 0; i < 10; i++) {
      const waveX = i * 200;
      const waveY = height - 70;

      const waveGraphics = this.add.graphics();
      waveGraphics.lineStyle(3, 0xffffff, 0.5);
      waveGraphics.beginPath();
      for (let x = 0; x < 100; x += 10) {
        const y = Math.sin(x * 0.1) * 5;
        if (x === 0) {
          waveGraphics.moveTo(x, y);
        } else {
          waveGraphics.lineTo(x, y);
        }
      }
      waveGraphics.strokePath();

      const waveTexture = waveGraphics.generateTexture('wave' + i, 100, 20);
      waveGraphics.destroy();

      const wave = this.add.image(waveX, waveY, 'wave' + i);
      wave.setData('baseX', waveX);
      wave.setData('phase', i * 0.5);
      this.wavesLayer.add(wave);

      // Animate waves
      this.tweens.add({
        targets: wave,
        y: waveY - 3,
        duration: 1000 + Math.random() * 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  createStreetScene() {
    const { width, height } = this.scale;

    // Sky layer - urban evening gradient (orange/purple sunset)
    const skyGraphics = this.add.graphics();
    skyGraphics.fillGradientStyle(0xFF7F50, 0xFF7F50, 0x9370DB, 0x9370DB, 1);
    skyGraphics.fillRect(0, 0, width, height * 0.5);
    skyGraphics.fillGradientStyle(0x9370DB, 0x9370DB, 0x4B0082, 0x4B0082, 1);
    skyGraphics.fillRect(0, height * 0.5, width, height * 0.5);

    // Sun/Moon (setting sun)
    const sunY = height * 0.2 + this.safeAreaTop;
    const sun = this.add.circle(width * 0.15, sunY, 50, 0xFF6347, 1);
    sun.setAlpha(0.8);
    const sunGlow = this.add.circle(width * 0.15, sunY, 70, 0xFF6347, 0.3);

    // Clouds layer
    this.cloudsLayer = this.add.group();
    for (let i = 0; i < 6; i++) {
      const cloudX = i * 300 + Math.random() * 150;
      const cloudY = this.safeAreaTop + 50 + Math.random() * 100;

      const cloudContainer = this.add.container(cloudX, cloudY);
      const cloud1 = this.add.ellipse(0, 0, 100, 50, 0xFFB6C1, 0.7);
      const cloud2 = this.add.ellipse(-30, -10, 70, 45, 0xFFB6C1, 0.65);
      const cloud3 = this.add.ellipse(30, -5, 80, 40, 0xFFB6C1, 0.65);

      cloudContainer.add([cloud1, cloud2, cloud3]);
      cloudContainer.setData('baseX', cloudX);
      cloudContainer.setData('speed', 0.5 + Math.random() * 0.3);
      this.cloudsLayer.add(cloudContainer);
    }

    // Birds flying
    this.birdsLayer = this.add.group();
    for (let i = 0; i < 4; i++) {
      const birdX = Math.random() * width;
      const birdY = this.safeAreaTop + 80 + Math.random() * 120;

      const birdGraphics = this.add.graphics();
      birdGraphics.lineStyle(2, 0x2C3E50, 1);
      birdGraphics.beginPath();
      birdGraphics.moveTo(-8, 0);
      birdGraphics.lineTo(0, -5);
      birdGraphics.lineTo(8, 0);
      birdGraphics.strokePath();

      const birdTexture = birdGraphics.generateTexture('streetBird' + i, 16, 10);
      birdGraphics.destroy();

      const bird = this.add.image(birdX, birdY, 'streetBird' + i);
      bird.setData('baseX', birdX);
      bird.setData('baseY', birdY);
      bird.setData('speed', 1.2 + Math.random() * 0.8);
      this.birdsLayer.add(bird);

      this.tweens.add({
        targets: bird,
        scaleY: 0.8,
        duration: 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // Far buildings (skyscrapers in distance)
    const farBuildingGraphics = this.add.graphics();
    farBuildingGraphics.fillStyle(0x2F4F4F, 0.6);
    for (let i = 0; i < 8; i++) {
      const x = i * 200;
      const buildingHeight = 150 + Math.random() * 100;
      farBuildingGraphics.fillRect(x, height - buildingHeight - 120, 150, buildingHeight);
      // Windows
      farBuildingGraphics.fillStyle(0xFFD700, 0.4);
      for (let w = 0; w < 3; w++) {
        for (let h = 0; h < Math.floor(buildingHeight / 20); h++) {
          if (Math.random() > 0.3) {
            farBuildingGraphics.fillRect(x + 20 + w * 40, height - buildingHeight - 120 + h * 20 + 10, 25, 15);
          }
        }
      }
      farBuildingGraphics.fillStyle(0x2F4F4F, 0.6);
    }
    const farBuildingTexture = farBuildingGraphics.generateTexture('farBuildings', width * 2, height);
    farBuildingGraphics.destroy();

    this.farMountainsBg = this.add.image(0, 0, 'farBuildings').setOrigin(0);
    this.farMountainsBg2 = this.add.image(width * 2, 0, 'farBuildings').setOrigin(0);

    // Near buildings (closer, taller)
    const buildingGraphics = this.add.graphics();
    for (let i = 0; i < 6; i++) {
      const x = i * 300;
      const buildingHeight = 200 + Math.random() * 150;
      const buildingWidth = 200;

      // Building body
      buildingGraphics.fillStyle(0x696969, 0.8);
      buildingGraphics.fillRect(x, height - buildingHeight - 100, buildingWidth, buildingHeight);

      // Windows (lit up)
      buildingGraphics.fillStyle(0xFFFF00, 0.7);
      for (let w = 0; w < 4; w++) {
        for (let h = 0; h < Math.floor(buildingHeight / 25); h++) {
          if (Math.random() > 0.4) {
            buildingGraphics.fillRect(x + 25 + w * 40, height - buildingHeight - 100 + h * 25 + 12, 30, 18);
          }
        }
      }

      // Roof
      buildingGraphics.fillStyle(0x4B4B4B, 1);
      buildingGraphics.fillRect(x, height - buildingHeight - 120, buildingWidth, 20);
    }
    const buildingTexture = buildingGraphics.generateTexture('buildings', width * 2, height);
    buildingGraphics.destroy();

    this.mountainsBg = this.add.image(0, 0, 'buildings').setOrigin(0);
    this.mountainsBg2 = this.add.image(width * 2, 0, 'buildings').setOrigin(0);

    // Street/road (asphalt)
    const streetGraphics = this.add.graphics();
    streetGraphics.fillStyle(0x36454F, 1);
    streetGraphics.fillRect(0, height - 100, width * 2, 70);
    // Road markings
    streetGraphics.fillStyle(0xFFFFFF, 0.8);
    for (let i = 0; i < 20; i++) {
      streetGraphics.fillRect(i * 150 + 50, height - 65, 80, 5);
    }
    const streetTexture = streetGraphics.generateTexture('street', width * 2, 100);
    streetGraphics.destroy();

    this.riverBg = this.add.image(0, height - 100, 'street').setOrigin(0);
    this.riverBg2 = this.add.image(width * 2, height - 100, 'street').setOrigin(0);

    // Street lights
    this.wavesLayer = this.add.group();
    for (let i = 0; i < 8; i++) {
      const lightX = i * 250 + 100;
      const lightY = height - 120;

      const lightGraphics = this.add.graphics();
      // Pole
      lightGraphics.fillStyle(0x4B4B4B, 1);
      lightGraphics.fillRect(-5, 0, 10, 100);
      // Light
      lightGraphics.fillStyle(0xFFD700, 1);
      lightGraphics.fillCircle(0, 0, 12);
      lightGraphics.fillStyle(0xFFFF00, 0.3);
      lightGraphics.fillCircle(0, 0, 25);

      const lightTexture = lightGraphics.generateTexture('streetLight' + i, 60, 120);
      lightGraphics.destroy();

      const light = this.add.image(lightX, lightY, 'streetLight' + i);
      light.setData('baseX', lightX);
      this.wavesLayer.add(light);

      // Flickering animation
      this.tweens.add({
        targets: light,
        alpha: 0.7,
        duration: 2000 + Math.random() * 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // Note: Fast cars removed from street scene as they were too fast
  }

  createBeachScene() {
    const { width, height } = this.scale;

    // Sky layer - tropical blue gradient
    const skyGraphics = this.add.graphics();
    skyGraphics.fillGradientStyle(0x00BFFF, 0x00BFFF, 0x87CEEB, 0x87CEEB, 1);
    skyGraphics.fillRect(0, 0, width, height * 0.6);
    skyGraphics.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xADD8E6, 0xADD8E6, 1);
    skyGraphics.fillRect(0, height * 0.6, width, height * 0.4);

    // Sun (bright tropical sun)
    const sunY = height * 0.12 + this.safeAreaTop;
    const sun = this.add.circle(width * 0.8, sunY, 45, 0xFFD700, 1);
    sun.setAlpha(1);
    const sunGlow = this.add.circle(width * 0.8, sunY, 60, 0xFFD700, 0.4);
    const sunGlow2 = this.add.circle(width * 0.8, sunY, 80, 0xFFFF00, 0.2);

    // Fluffy white clouds
    this.cloudsLayer = this.add.group();
    for (let i = 0; i < 7; i++) {
      const cloudX = i * 280 + Math.random() * 150;
      const cloudY = this.safeAreaTop + 40 + Math.random() * 100;

      const cloudContainer = this.add.container(cloudX, cloudY);
      const cloud1 = this.add.ellipse(0, 0, 110, 55, 0xFFFFFF, 0.95);
      const cloud2 = this.add.ellipse(-35, -12, 75, 48, 0xFFFFFF, 0.9);
      const cloud3 = this.add.ellipse(35, -8, 85, 42, 0xFFFFFF, 0.9);
      const cloud4 = this.add.ellipse(0, 12, 65, 38, 0xFFFFFF, 0.85);

      cloudContainer.add([cloud1, cloud2, cloud3, cloud4]);
      cloudContainer.setData('baseX', cloudX);
      cloudContainer.setData('speed', 0.6 + Math.random() * 0.4);
      this.cloudsLayer.add(cloudContainer);
    }

    // Seagulls (hải âu) - larger and more visible
    this.birdsLayer = this.add.group();
    for (let i = 0; i < 8; i++) {
      const birdX = Math.random() * width;
      const birdY = this.safeAreaTop + 70 + Math.random() * 140;

      const birdGraphics = this.add.graphics();
      // Thicker white outline for better visibility
      birdGraphics.lineStyle(4, 0xFFFFFF, 1);
      birdGraphics.beginPath();
      birdGraphics.moveTo(-15, 0);
      birdGraphics.lineTo(0, -8);
      birdGraphics.lineTo(15, 0);
      birdGraphics.strokePath();

      const birdTexture = birdGraphics.generateTexture('seagull' + i, 32, 16);
      birdGraphics.destroy();

      const bird = this.add.image(birdX, birdY, 'seagull' + i);
      bird.setData('baseX', birdX);
      bird.setData('baseY', birdY);
      bird.setData('speed', 1.3 + Math.random() * 1);
      bird.setDepth(5); // Above background
      this.birdsLayer.add(bird);

      this.tweens.add({
        targets: bird,
        scaleY: 0.75,
        duration: 250,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // Distant ocean horizon
    const horizonGraphics = this.add.graphics();
    horizonGraphics.fillGradientStyle(0x4682B4, 0x4682B4, 0x5F9EA0, 0x5F9EA0, 1);
    horizonGraphics.fillRect(0, height - 250, width * 2, 100);
    const horizonTexture = horizonGraphics.generateTexture('horizon', width * 2, 100);
    horizonGraphics.destroy();

    this.farMountainsBg = this.add.image(0, height - 250, 'horizon').setOrigin(0);
    this.farMountainsBg2 = this.add.image(width * 2, height - 250, 'horizon').setOrigin(0);

    // Sailing boats in the distance (thuyền buồm)
    this.boatsLayer = this.add.group();
    const boatBaseY = height - 180; // Position in middle of screen
    console.log('🚢 Creating boats at Y:', boatBaseY, 'Screen height:', height, 'groundY:', this.groundY);

    for (let i = 0; i < 5; i++) {
      const boatX = i * 350 + 150 + Math.random() * 50;
      const boatY = boatBaseY;

      // Create boat graphics and convert to texture for better rendering
      const boatGraphics = this.add.graphics();

      // Boat hull (very bright white for max visibility)
      boatGraphics.fillStyle(0xFFFFFF, 1);
      boatGraphics.fillTriangle(0, 0, -30, 15, 30, 15);

      // Red stripe on hull for visibility
      boatGraphics.fillStyle(0xFF0000, 0.8);
      boatGraphics.fillRect(-25, 10, 50, 3);

      // Shadow under boat (dark blue)
      boatGraphics.fillStyle(0x1E3A5F, 0.4);
      boatGraphics.fillTriangle(0, 15, -28, 18, 28, 18);

      // Large bright white sail
      boatGraphics.fillStyle(0xFFFFFF, 1);
      boatGraphics.fillTriangle(0, -50, -18, 0, 18, 0);

      // Dark outline for sail visibility
      boatGraphics.lineStyle(2, 0x000000, 0.5);
      boatGraphics.strokeTriangle(0, -50, -18, 0, 18, 0);

      // Sail shadow/highlight
      boatGraphics.fillStyle(0xE0E0E0, 0.6);
      boatGraphics.fillTriangle(0, -50, 0, 0, 18, 0);

      // Thick mast (dark brown)
      boatGraphics.lineStyle(4, 0x654321, 1);
      boatGraphics.beginPath();
      boatGraphics.moveTo(0, -50);
      boatGraphics.lineTo(0, 0);
      boatGraphics.strokePath();

      // Generate texture from graphics
      const boatTexture = boatGraphics.generateTexture('boat' + i, 60, 70);
      boatGraphics.destroy();

      // Create sprite from texture (much more reliable than graphics in container)
      const boat = this.add.image(boatX, boatY, 'boat' + i);
      
      // IMPORTANT: Set depth very high to be visible
      boat.setDepth(25); // Above background, below obstacles/player
      boat.setData('baseX', boatX);
      boat.setData('baseY', boatY);
      boat.setData('speed', 0.2 + Math.random() * 0.15);

      // Mark as decoration (not obstacle)
      boat.setData('isDecoration', true);

      this.boatsLayer.add(boat);

      console.log(`🚢 Boat ${i}: X=${boatX}, Y=${boatY}, depth=25, visible=${boat.visible}, texture=boat${i}`);

      // Gentle bobbing animation
      this.tweens.add({
        targets: boat,
        y: boatY - 10,
        duration: 2500 + Math.random() * 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
    console.log('✅ Total boats in layer:', this.boatsLayer.getLength());
    console.log('✅ Boats layer depth:', this.boatsLayer.getChildren().map(b => b.depth));

    // Beautiful palm trees (cây dừa)
    const palmGraphics = this.add.graphics();
    for (let i = 0; i < 5; i++) {
      const x = i * 400 + 100;
      const y = height - 220;

      // Curved trunk (more realistic)
      palmGraphics.fillStyle(0x8B6914, 1);
      // Draw trunk segments for curved effect
      for (let seg = 0; seg < 10; seg++) {
        const segY = y + seg * 10;
        const curve = Math.sin(seg * 0.3) * 3; // Subtle curve
        palmGraphics.fillRect(x + curve, segY, 12, 11);
        // Add texture lines
        palmGraphics.fillStyle(0x6B5010, 0.3);
        palmGraphics.fillRect(x + curve, segY + 8, 12, 2);
        palmGraphics.fillStyle(0x8B6914, 1);
      }

      // Coconuts at top
      palmGraphics.fillStyle(0x8B4513, 1);
      for (let c = 0; c < 3; c++) {
        const coconutAngle = (c * 120) * Math.PI / 180;
        const coconutX = x + 6 + Math.cos(coconutAngle) * 12;
        const coconutY = y - 5 + Math.sin(coconutAngle) * 12;
        palmGraphics.fillCircle(coconutX, coconutY, 6);
      }

      // Palm leaves (fronds) - more realistic
      palmGraphics.lineStyle(0);
      for (let j = 0; j < 8; j++) {
        const angle = (j * 45) * Math.PI / 180;

        // Dark green base
        palmGraphics.fillStyle(0x228B22, 1);

        // Draw each frond as a series of connected shapes
        for (let k = 0; k < 5; k++) {
          const dist = 15 + k * 10;
          const leafX = x + 6 + Math.cos(angle) * dist;
          const leafY = y - 15 + Math.sin(angle) * dist;
          const leafSize = 12 - k * 2;

          // Main leaf segment
          palmGraphics.fillCircle(leafX, leafY, leafSize);

          // Add lighter green highlight
          if (k < 3) {
            palmGraphics.fillStyle(0x32CD32, 0.6);
            palmGraphics.fillCircle(leafX - 3, leafY - 3, leafSize * 0.5);
            palmGraphics.fillStyle(0x228B22, 1);
          }
        }
      }

      // Center cluster for fuller look
      palmGraphics.fillStyle(0x228B22, 1);
      palmGraphics.fillCircle(x + 6, y - 15, 18);
      palmGraphics.fillStyle(0x32CD32, 0.7);
      palmGraphics.fillCircle(x + 6, y - 15, 12);
    }
    const palmTexture = palmGraphics.generateTexture('palms', width * 2, height);
    palmGraphics.destroy();

    // Palm trees layer - behind boats
    this.mountainsBg = this.add.image(0, 0, 'palms').setOrigin(0).setDepth(5);
    this.mountainsBg2 = this.add.image(width * 2, 0, 'palms').setOrigin(0).setDepth(5);
    console.log('🌴 Palm trees created with depth 5');

    // Ocean waves (animated water)
    const oceanGraphics = this.add.graphics();
    oceanGraphics.fillGradientStyle(0x1E90FF, 0x1E90FF, 0x4169E1, 0x4169E1, 1);
    oceanGraphics.fillRect(0, height - 150, width * 2, 50);
    const oceanTexture = oceanGraphics.generateTexture('ocean', width * 2, 100);
    oceanGraphics.destroy();

    this.riverBg = this.add.image(0, height - 150, 'ocean').setOrigin(0);
    this.riverBg2 = this.add.image(width * 2, height - 150, 'ocean').setOrigin(0);

    // Beach waves (white foam)
    this.wavesLayer = this.add.group();
    for (let i = 0; i < 12; i++) {
      const waveX = i * 180;
      const waveY = height - 105;

      const waveGraphics = this.add.graphics();
      waveGraphics.lineStyle(4, 0xFFFFFF, 0.7);
      waveGraphics.beginPath();
      for (let x = 0; x < 120; x += 8) {
        const y = Math.sin(x * 0.12) * 8;
        if (x === 0) {
          waveGraphics.moveTo(x, y);
        } else {
          waveGraphics.lineTo(x, y);
        }
      }
      waveGraphics.strokePath();

      const waveTexture = waveGraphics.generateTexture('beachWave' + i, 120, 25);
      waveGraphics.destroy();

      const wave = this.add.image(waveX, waveY, 'beachWave' + i);
      wave.setData('baseX', waveX);
      wave.setData('phase', i * 0.6);
      this.wavesLayer.add(wave);

      this.tweens.add({
        targets: wave,
        y: waveY - 5,
        duration: 1500 + Math.random() * 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

  }

  clearScene() {
    console.log('Clearing scene...');

    // IMPORTANT: Don't touch player, obstacles, or collectibles!
    // Only clear background elements to keep gameplay continuous
    console.log('Obstacles before clear:', this.obstacles ? this.obstacles.getLength() : 0);
    console.log('Collectibles before clear:', this.collectibles ? this.collectibles.getLength() : 0);

    // Clear all scene-specific layers (make sure they don't contain player!)
    if (this.cloudsLayer) {
      this.cloudsLayer.clear(true, true);
      this.cloudsLayer = null;
    }
    if (this.birdsLayer) {
      this.birdsLayer.clear(true, true);
      this.birdsLayer = null;
    }
    if (this.boatsLayer) {
      this.boatsLayer.clear(true, true);
      this.boatsLayer = null;
    }
    if (this.farMountainsBg) {
      this.farMountainsBg.destroy();
      this.farMountainsBg = null;
    }
    if (this.farMountainsBg2) {
      this.farMountainsBg2.destroy();
      this.farMountainsBg2 = null;
    }
    if (this.mountainsBg) {
      this.mountainsBg.destroy();
      this.mountainsBg = null;
    }
    if (this.mountainsBg2) {
      this.mountainsBg2.destroy();
      this.mountainsBg2 = null;
    }
    if (this.riverBg) {
      this.riverBg.destroy();
      this.riverBg = null;
    }
    if (this.riverBg2) {
      this.riverBg2.destroy();
      this.riverBg2 = null;
    }
    if (this.wavesLayer) {
      this.wavesLayer.clear(true, true);
      this.wavesLayer = null;
    }

    // Destroy all scene-specific textures to prevent conflicts
    const textureManager = this.textures;
    const texturesToDestroy = [
      // Mountain-river scene
      'farMountains', 'mountains', 'river',
      // Street scene
      'farBuildings', 'buildings', 'street',
      // Beach scene
      'horizon', 'palms', 'ocean'
    ];

    // Destroy base textures
    texturesToDestroy.forEach(key => {
      if (textureManager.exists(key)) {
        textureManager.remove(key);
      }
    });

    // Destroy dynamic textures (birds, waves, lights, boats)
    for (let i = 0; i < 20; i++) {
      const dynamicKeys = [
        `bird${i}`, `wave${i}`, `streetBird${i}`, `streetLight${i}`,
        `seagull${i}`, `beachWave${i}`, `boat${i}`
      ];
      dynamicKeys.forEach(key => {
        if (textureManager.exists(key)) {
          textureManager.remove(key);
        }
      });
    }

    // Ensure obstacles and collectibles stay on top of new background
    if (this.obstacles) {
      this.obstacles.getChildren().forEach(obstacle => {
        if (obstacle && obstacle.setDepth) {
          obstacle.setDepth(30); // Above background, below player
        }
      });
      console.log('✅ Obstacles kept:', this.obstacles.getLength());
    }

    if (this.collectibles) {
      this.collectibles.getChildren().forEach(item => {
        if (item && item.setDepth) {
          item.setDepth(30); // Above background, below player
        }
      });
      console.log('✅ Collectibles kept:', this.collectibles.getLength());
    }

    console.log('Scene cleared successfully');
  }

  switchScene() {
    const currentTime = Date.now();
    const timeSinceStart = currentTime - this.startTime;

    console.log('=== SWITCH SCENE CALLED ===');
    console.log('Time since start:', timeSinceStart, 'ms');
    console.log('isSwitchingScene:', this.isSwitchingScene);
    console.log('isGameOver:', this.isGameOver);

    // Prevent concurrent scene switches
    if (this.isSwitchingScene) {
      console.log('❌ Scene switch blocked: already in progress');
      return;
    }

    if (this.isGameOver) {
      console.log('❌ Scene switch blocked: game over');
      return;
    }

    console.log('✅ Starting scene switch...');
    console.log('Current scene:', this.sceneType, 'Index:', this.currentSceneIndex);
    this.isSwitchingScene = true;

    // Update last scene change time
    this.lastSceneChangeTime = currentTime;

    try {
      // Clear current scene
      console.log('Step 1: Clearing scene...');
      this.clearScene();

      // Move to next scene (randomly or in order)
      console.log('Step 2: Selecting next scene...');
      const availableScenes = this.sceneTypes.filter((_, index) => index !== this.currentSceneIndex);
      console.log('Available scenes:', availableScenes);
      const nextSceneType = Phaser.Utils.Array.GetRandom(availableScenes);
      this.currentSceneIndex = this.sceneTypes.indexOf(nextSceneType);
      this.sceneType = nextSceneType;

      console.log('Step 3: Creating new scene:', this.sceneType, 'Index:', this.currentSceneIndex);

      // Create new scene
      this.createParallaxBackground();

      // Ensure player is on top of new background
      if (this.player) {
        this.player.setDepth(50);
        console.log('Player depth set to 50 (on top)');
      }

      console.log('✅ Scene switch completed successfully');
    } catch (error) {
      console.error('❌ Error switching scene:', error);
      console.error('Error stack:', error.stack);
    }

    // Reset flag immediately after scene creation (don't wait)
    this.isSwitchingScene = false;
    console.log('Scene switch lock released immediately');
    console.log('=== SWITCH SCENE DONE ===\n');
  }

  showSceneChangeNotification() {
    const { width, height } = this.scale;

    let sceneText = '';
    if (this.sceneType === 'mountain-river') {
      sceneText = '🏔️ NÚI SÔNG';
    } else if (this.sceneType === 'street') {
      sceneText = '🏙️ ĐƯỜNG PHỐ';
    } else if (this.sceneType === 'beach') {
      sceneText = '🏖️ BÃI BIỂN';
    }

    const notification = this.add.text(width / 2, height / 2, sceneText, {
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
    this.tweens.add({
      targets: notification,
      alpha: 1,
      scale: 1.2,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Hold for 1.5 seconds
        this.time.delayedCall(1500, () => {
          // Fade out
          this.tweens.add({
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

  createGround() {
    const { width, height } = this.scale;

    // Ground at the very bottom - thinner ground for more play space
    const groundHeight = 25;
    this.groundY = height - groundHeight;

    // Create a wide seamless ground texture
    const groundWidth = Math.max(width * 2, 2048); // Ensure minimum width
    const groundGraphics = this.add.graphics();

    // Layer 1: Grass (top) - bright green
    groundGraphics.fillStyle(0x4CAF50, 1);
    groundGraphics.fillRect(0, 0, groundWidth, 8);

    // Add lighter green top edge for grass highlight
    groundGraphics.fillStyle(0x66BB6A, 1);
    groundGraphics.fillRect(0, 0, groundWidth, 2);

    // Layer 2: Dirt (middle) - brown
    groundGraphics.fillStyle(0x8B4513, 1);
    groundGraphics.fillRect(0, 8, groundWidth, 10);

    // Layer 3: Deep dirt (bottom) - dark brown
    groundGraphics.fillStyle(0x5D4037, 1);
    groundGraphics.fillRect(0, 18, groundWidth, 7);

    // Generate texture and destroy graphics
    groundGraphics.generateTexture('seamlessGround', groundWidth, groundHeight);
    groundGraphics.destroy();

    // Create TWO ground images for seamless infinite scrolling
    this.ground1 = this.add.image(0, this.groundY, 'seamlessGround').setOrigin(0, 0).setDepth(10);
    this.ground2 = this.add.image(groundWidth, this.groundY, 'seamlessGround').setOrigin(0, 0).setDepth(10);

    // Store width for wrapping
    this.groundWidth = groundWidth;

    // Ground collision body
    this.ground = this.add.rectangle(width / 2, this.groundY + 10, width * 2, 20, 0x000000, 0);
    this.physics.add.existing(this.ground, true); // Static body
  }

  createPlayer() {
    const { width, height } = this.scale;

    // Player dimensions - fixed size for balanced gameplay
    const playerWidth = 80;
    const playerHeight = 120;

    // Position player further left on smaller screens
    const playerX = width < 600 ? 100 : 150;

    // Player Y position - use default origin (0.5, 0.5) for simpler calculation
    const playerY = this.groundY - playerHeight / 2;

    // Create player using the loaded image
    this.player = this.physics.add.sprite(playerX, playerY, 'playerImage');
    this.player.setCollideWorldBounds(false);
    // Use default origin (0.5, 0.5) - center of sprite

    // Set depth to ensure player is always on top of background
    this.player.setDepth(50);

    // Stretch image to fit the exact size
    this.player.setDisplaySize(playerWidth, playerHeight);

    // Set hitbox - full height, 85% width (to avoid dress edges)
    const hitboxWidth = 3.0*playerWidth;
    const hitboxHeight = 3.5*playerHeight;
    this.player.body.setSize(hitboxWidth, hitboxHeight);
    
    // Center hitbox horizontally, vertically centered by default
   // this.player.body.setOffset((playerWidth - hitboxWidth) / 2, (playerHeight - hitboxHeight) / 2);

    // Physics - Chrome Dino style (simple gravity)
    this.player.body.setGravityY(GAME_CONSTANTS.GRAVITY);
    this.physics.add.collider(this.player, this.ground);

    // DEBUG: Create graphics for hitbox visualization
    this.playerHitboxGraphics = this.add.graphics();
    this.playerHitboxGraphics.setDepth(1000);

    // DEBUG: Create red border for player sprite
    this.playerBorderGraphics = this.add.graphics();
    this.playerBorderGraphics.setDepth(1000);

    // No running animation tween - keep it simple and stable
    // Player stays at fixed position, only jumps
  }

  createUI() {
    const { width, height } = this.scale;
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
    console.log('Setting up game timers...');

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
      callback: () => {
        console.log('Safe period ended');
        this.isInSafePeriod = false;
      },
      callbackScope: this,
      loop: false
    });

    // Scene change timer - switch scenes every 19 seconds
    console.log('Setting up scene change timer with interval:', this.sceneChangeInterval, 'ms');
    this.sceneChangeTimer = this.time.addEvent({
      delay: this.sceneChangeInterval,
      callback: () => {
        console.log('⏰ Scene change timer fired!');
        this.switchScene();
      },
      callbackScope: this,
      loop: true
    });
    console.log('Scene change timer created:', this.sceneChangeTimer);
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
    // Don't spawn if in safe period, game over, or switching scenes
    if (this.isInSafePeriod || this.isGameOver || this.isSwitchingScene) return;

    const { width } = this.scale;

    // Only spawn ground obstacles (no flying enemies)
    this.spawnGroundObstacle();

    // Schedule next obstacle
    this.scheduleNextObstacle();
  }

  spawnGroundObstacle() {
    const { width } = this.scale;

    // Ground obstacles - SMALL relative to large player hitbox (player must jump over)
    const groundObstacles = [
      { key: 'stress', emoji: '😰', height: 50 },
      { key: 'deadline', emoji: '⏰', height: 50 },
      { key: 'work', emoji: '💼', height: 50 },
      { key: 'boss', emoji: '👔', height: 50 },
      { key: 'overtime', emoji: '🌙', height: 50 },
      { key: 'meeting', emoji: '📊', height: 50 }
    ];

    const type = Phaser.Utils.Array.GetRandom(groundObstacles);

    // Obstacle stands ON the ground (smaller than player)
    const obstacleHeight = type.height;
    const obstacleY = this.groundY - obstacleHeight / 2;

    // Container for emoji obstacle
    const container = this.add.container(width + 50, obstacleY);

    // Create emoji obstacle (small - easy to see and avoid)
    const emoji = this.add.text(0, 0, type.emoji, {
      fontSize: '48px'
    }).setOrigin(0.5, 0.5);

    container.add([emoji]);

    // Physics on container
    this.physics.add.existing(container);
    container.body.setAllowGravity(false);
    container.body.setImmovable(true);

    // Hitbox - compact (much smaller than player)
    const obstacleBodyWidth = 45;
    const obstacleBodyHeight = 45;
    container.body.setSize(obstacleBodyWidth, obstacleBodyHeight);
    container.body.setOffset(-obstacleBodyWidth / 2, -obstacleBodyHeight / 2);
    container.setData('type', type.key);
    container.setData('isFlying', false);

    // Set depth to appear above background
    container.setDepth(30);

    this.obstacles.add(container);
  }


  spawnCollectible() {
    // Don't spawn if game over or switching scenes
    if (this.isGameOver || this.isSwitchingScene) return;

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
    } else if (rand < 0.96) {
      itemType = 'xe'; // 8% chance
    } else {
      itemType = 'vang'; // 4% chance
    }

    // SMALL collectibles relative to large player (player must jump to collect)
    // Hitbox is ~80% of visual size for easier collection
    const itemConfig = {
      tien: { emoji: '💰', valueText: '+10', size: 36, hitbox: 30 },
      tin: { emoji: '❤️', valueText: '+50', size: 40, hitbox: 32 },
      nha: { emoji: '🏡', valueText: '+100', size: 44, hitbox: 36 },
      xe: { emoji: '🚗', valueText: '+150', size: 44, hitbox: 36 },
      vang: { emoji: '💍', valueText: '+300', size: 44, hitbox: 36 }
    };

    const config = itemConfig[itemType];

    // Items float in the AIR above ground - player must JUMP to collect
    // Small items at various heights (easier to collect with large player hitbox)
    // Limit max height to avoid safe area (notch/status bar on mobile)
    const { height } = this.scale;
    const maxHeightAboveGround = Math.min(200, this.groundY - this.safeAreaTop - 100);
    const heightAboveGround = Phaser.Math.Between(50, maxHeightAboveGround);
    const y = this.groundY - heightAboveGround;

    // Container for emoji + value text
    const container = this.add.container(width + 50, y);

    // Create emoji (centered)
    const emoji = this.add.text(0, 0, config.emoji, {
      fontSize: `${config.size}px`
    }).setOrigin(0.5, 0.5);

    // Add value text above emoji (small)
    const valueLabel = this.add.text(0, -28, config.valueText, {
      fontSize: '11px',
      fontFamily: 'Arial',
      color: '#FFD700',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5, 0.5);

    container.add([emoji, valueLabel]);

    // Physics on container
    this.physics.add.existing(container);
    container.body.setAllowGravity(false);
    container.body.setSize(config.hitbox, config.hitbox);
    container.body.setOffset(-config.hitbox / 2, -config.hitbox / 2);
    container.setData('itemType', itemType);
    container.setData('score', GAME_CONSTANTS.ITEM_SCORES[itemType]);

    // Set depth to appear above background
    container.setDepth(30);

    this.collectibles.add(container);

    // Floating animation - gentle bobbing in the sky
    this.tweens.add({
      targets: container,
      y: y - 20,
      duration: 1200,
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
    const notificationY = height / 2 - 150 + this.safeAreaTop;
    const notification = this.add.text(width / 2, notificationY, '🚗 BẤT TỬ 5S!', {
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
    const notificationY = height / 2 - 150 + this.safeAreaTop;
    const notification = this.add.text(width / 2, notificationY, '💍 ĐIỂM x2 - 10S!', {
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
    if (this.isInvincible || this.isGameOver || this.isSwitchingScene) return;

    // Verify this is actually an obstacle (not background element)
    if (!obstacle || !this.obstacles.contains(obstacle)) {
      console.warn('⚠️ False collision detected with:', obstacle);
      return;
    }

    // Double-check obstacle is valid and has type data
    const obstacleType = obstacle.getData('type');
    if (!obstacleType) {
      console.warn('⚠️ Obstacle missing type data:', obstacle);
      return;
    }

    // Check if it's marked as decoration (should not collide)
    if (obstacle.getData('isDecoration')) {
      console.warn('⚠️ Collision with decoration element ignored:', obstacle);
      return;
    }

    console.log('💥 Hit obstacle:', obstacleType);

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

    // Title (with safe area offset for mobile)
    const title = isVictory ? '🎉 HOÀN THÀNH!' : '💥 GAME OVER';
    const titleY = height / 2 - 180 + (this.safeAreaTop / 2); // Half offset to keep centered
    this.add.text(width / 2, titleY, title, {
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
    const itemText = `💰 ${this.itemsCollected.tien}  ❤️ ${this.itemsCollected.tin}  🏡 ${this.itemsCollected.nha}  🚗 ${this.itemsCollected.xe}  💍 ${this.itemsCollected.vang}`;
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

  pauseGame() {
    if (confirm('Tạm dừng. Bạn có muốn xem thông tin đám cưới không?')) {
      window.location.href = 'wedding-info.html';
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

  debugDrawHitboxes() {
    // Only draw if DEBUG_HITBOXES is enabled
    if (!this.DEBUG_HITBOXES) {
      // Clear graphics if debug is disabled
      if (this.playerHitboxGraphics) {
        this.playerHitboxGraphics.clear();
      }
      if (this.playerBorderGraphics) {
        this.playerBorderGraphics.clear();
      }
      return;
    }

    // Clear previous frame
    if (this.playerHitboxGraphics) {
      this.playerHitboxGraphics.clear();
    }
    if (this.playerBorderGraphics) {
      this.playerBorderGraphics.clear();
    }

    // Draw player sprite border (red)
    if (this.player) {
      const playerWidth = 80;
      const playerHeight = 120;
      this.playerBorderGraphics.lineStyle(2, 0xff0000, 1); // Red color for sprite border
      this.playerBorderGraphics.strokeRect(
        this.player.x - playerWidth / 2,
        this.player.y - playerHeight / 2,
        playerWidth,
        playerHeight
      );
    }

    // Draw player body/hitbox (red, thicker)
    if (this.player && this.player.body) {
      this.playerHitboxGraphics.lineStyle(3, 0xff0000, 0.8); // Red color, 3px width for body
      this.playerHitboxGraphics.strokeRect(
        this.player.body.x,
        this.player.body.y,
        this.player.body.width,
        this.player.body.height
      );
    }

    // Draw obstacles hitboxes (red)
    this.obstacles.getChildren().forEach(obstacle => {
      if (obstacle.body) {
        this.playerHitboxGraphics.lineStyle(2, 0xff0000, 1);
        this.playerHitboxGraphics.strokeRect(
          obstacle.body.x,
          obstacle.body.y,
          obstacle.body.width,
          obstacle.body.height
        );
      }
    });

    // Draw collectibles hitboxes (green)
    this.collectibles.getChildren().forEach(item => {
      if (item.body) {
        this.playerHitboxGraphics.lineStyle(2, 0x00ff00, 1); // Green for collectibles
        this.playerHitboxGraphics.strokeRect(
          item.body.x,
          item.body.y,
          item.body.width,
          item.body.height
        );
      }
    });
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

    // DEBUG: Draw hitboxes
    this.debugDrawHitboxes();
  }

  updateParallax(deltaInSeconds) {
    const scrollDistance = this.scrollSpeed * deltaInSeconds;

    // Clouds (slow)
    if (this.cloudsLayer) {
      this.cloudsLayer.getChildren().forEach(cloud => {
        const speed = cloud.getData('speed') || 1;
        cloud.x -= scrollDistance * GAME_CONSTANTS.PARALLAX_CLOUDS * speed;
        if (cloud.x < -150) {
          cloud.x = this.scale.width + 150;
        }
      });
    }

    // Birds flying (very slow, natural movement)
    if (this.birdsLayer) {
      this.birdsLayer.getChildren().forEach(bird => {
        const speed = bird.getData('speed') || 1;
        bird.x -= scrollDistance * 0.3 * speed;
        // Add slight vertical bobbing
        const baseY = bird.getData('baseY');
        bird.y = baseY + Math.sin(Date.now() * 0.001 + bird.x * 0.01) * 10;

        if (bird.x < -50) {
          bird.x = this.scale.width + 50;
          bird.setData('baseY', 80 + Math.random() * 150);
        }
      });
    }

    // Boats floating (very slow, far away)
    if (this.boatsLayer) {
      this.boatsLayer.getChildren().forEach(boat => {
        const speed = boat.getData('speed') || 0.3;
        const baseY = boat.getData('baseY');
        boat.x -= scrollDistance * speed;

        if (boat.x < -100) {
          boat.x = this.scale.width + 100;
          // Reset Y to base when wrapping (tween will handle bobbing)
          if (baseY) {
            boat.y = baseY;
          }
        }
      });
    }

    // Far mountains (slower than near mountains)
    if (this.farMountainsBg && this.farMountainsBg2) {
      this.farMountainsBg.x -= scrollDistance * GAME_CONSTANTS.PARALLAX_MOUNTAINS * 0.5;
      this.farMountainsBg2.x -= scrollDistance * GAME_CONSTANTS.PARALLAX_MOUNTAINS * 0.5;

      if (this.farMountainsBg.x + this.farMountainsBg.width < 0) {
        this.farMountainsBg.x = this.farMountainsBg2.x + this.farMountainsBg2.width;
      }
      if (this.farMountainsBg2.x + this.farMountainsBg2.width < 0) {
        this.farMountainsBg2.x = this.farMountainsBg.x + this.farMountainsBg.width;
      }
    }

    // Near mountains (medium)
    if (this.mountainsBg && this.mountainsBg2) {
      this.mountainsBg.x -= scrollDistance * GAME_CONSTANTS.PARALLAX_MOUNTAINS;
      this.mountainsBg2.x -= scrollDistance * GAME_CONSTANTS.PARALLAX_MOUNTAINS;

      if (this.mountainsBg.x + this.mountainsBg.width < 0) {
        this.mountainsBg.x = this.mountainsBg2.x + this.mountainsBg2.width;
      }
      if (this.mountainsBg2.x + this.mountainsBg2.width < 0) {
        this.mountainsBg2.x = this.mountainsBg.x + this.mountainsBg.width;
      }
    }

    // River (fast, like ground)
    if (this.riverBg && this.riverBg2) {
      this.riverBg.x -= scrollDistance * 0.8;
      this.riverBg2.x -= scrollDistance * 0.8;

      if (this.riverBg.x + this.riverBg.width < 0) {
        this.riverBg.x = this.riverBg2.x + this.riverBg2.width;
      }
      if (this.riverBg2.x + this.riverBg2.width < 0) {
        this.riverBg2.x = this.riverBg.x + this.riverBg.width;
      }
    }

    // Waves (fast with water)
    if (this.wavesLayer) {
      this.wavesLayer.getChildren().forEach(wave => {
        wave.x -= scrollDistance * 0.9;
        if (wave.x < -100) {
          wave.x = this.scale.width + 100;
        }
      });
    }

    // Cars layer removed from street scene
  }

  updateGround(deltaInSeconds) {
    const scrollDistance = this.scrollSpeed * deltaInSeconds;

    // Scroll both ground images
    this.ground1.x -= scrollDistance;
    this.ground2.x -= scrollDistance;

    // Wrap around seamlessly - use stored width to ensure no gaps
    const groundWidth = this.groundWidth || this.ground1.width;
    
    if (this.ground1.x + groundWidth <= 0) {
      this.ground1.x = this.ground2.x + groundWidth;
    }
    if (this.ground2.x + groundWidth <= 0) {
      this.ground2.x = this.ground1.x + groundWidth;
    }
  }

  updateObstacles(deltaInSeconds) {
    const scrollDistance = this.scrollSpeed * deltaInSeconds;

    this.obstacles.getChildren().forEach(obstacle => {
      obstacle.x -= scrollDistance;

      // Remove off-screen obstacles
      if (obstacle.x < -100) {
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
        // Stop any tweens on this collectible
        this.tweens.killTweensOf(item);
        item.destroy();
      }
    });
  }
}
