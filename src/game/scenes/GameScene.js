import Phaser from 'phaser';
import { GAME_CONSTANTS } from '../../config/game.js';
import {
  requireLandscapeOrientation,
  releaseLandscapeOrientation,
  refreshOrientationLayout,
  getLandscapeViewportSize
} from '../../services/orientation.js';

// Import managers
import GroundManager from '../managers/GroundManager.js';
import PlayerManager from '../managers/PlayerManager.js';
import ScoringSystem from '../managers/ScoringSystem.js';
import UIManager from '../managers/UIManager.js';
import ObstacleManager from '../managers/ObstacleManager.js';
import CollectibleManager from '../managers/CollectibleManager.js';
import GameStateManager from '../managers/GameStateManager.js';
import SceneBackgroundManager from '../managers/SceneBackgroundManager.js';

// Import event system
import { GAME_EVENTS, gameEvents } from '../utils/GameEvents.js';

/**
 * GameScene - Main game scene orchestrating all managers
 * Refactored from 2,196 lines to ~350 lines by extracting modules
 */
export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });

    // Debug settings
    this.DEBUG_HITBOXES = false;

    // Game initialization flags
    this.isWaitingForLandscape = false;
    this.gameInitialized = false;
    this.orientationCallbacksRegistered = false;

    // Managers (initialized in create())
    this.groundManager = null;
    this.playerManager = null;
    this.scoringSystem = null;
    this.uiManager = null;
    this.obstacleManager = null;
    this.collectibleManager = null;
    this.gameStateManager = null;
    this.backgroundManager = null;

    // Spawn timers
    this.lastObstacleTime = 0;
    this.lastCollectibleTime = 0;

    // Safe area
    this.safeAreaTop = 0;

    // Debug graphics
    this.debugGraphics = null;
  }

  preload() {
    // Load player image
    this.load.image('playerImage', '/player.png');
  }

  /**
   * Force fullscreen on mobile devices
   * Continuously tries to maintain fullscreen mode
   */
  forceFullscreenOnMobile() {
    console.log('🔒 Force fullscreen on mobile device');

    const requestFullscreen = () => {
      const element = document.documentElement;

      // Try Phaser's built-in method first
      this.scale.startFullscreen();

      // Also try browser's native fullscreen API
      if (element.requestFullscreen) {
        element.requestFullscreen().catch(err => {
          console.log('Fullscreen request failed:', err);
        });
      } else if (element.webkitRequestFullscreen) { // Safari
        element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) { // Firefox
        element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) { // IE/Edge
        element.msRequestFullscreen();
      }

      // iOS specific: use minimal-ui
      const viewport = document.querySelector('meta[name=viewport]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, minimal-ui');
      }
    };

    // Request fullscreen immediately
    requestFullscreen();

    // Monitor fullscreen state and re-request if user exits
    const onFullscreenChange = () => {
      const isFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );

      const isGameOver = this.gameStateManager && this.gameStateManager.isOver();
      if (!isFullscreen && !isGameOver) {
        // User exited fullscreen during game - re-request after small delay
        console.log('⚠️ Fullscreen exited, re-requesting...');
        setTimeout(() => {
          const stillPlaying = this.gameStateManager && !this.gameStateManager.isOver();
          if (stillPlaying) {
            requestFullscreen();
          }
        }, 500);
      }
    };

    // Listen to fullscreen change events
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('mozfullscreenchange', onFullscreenChange);
    document.addEventListener('msfullscreenchange', onFullscreenChange);

    // Also listen to resize events (for iOS which doesn't support fullscreen API)
    window.addEventListener('resize', () => {
      const isGameOver = this.gameStateManager && this.gameStateManager.isOver();
      if (!isGameOver) {
        // Make sure canvas fills the entire screen
        const container = document.getElementById('game-container');
        if (container) {
          container.style.position = 'fixed';
          container.style.top = '0';
          container.style.left = '0';
          container.style.width = '100vw';
          container.style.height = '100vh';
          container.style.zIndex = '9999';
        }
      }
    });

    // Force game container to fill screen
    const container = document.getElementById('game-container');
    if (container) {
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '100vw';
      container.style.height = '100vh';
      container.style.zIndex = '9999';
      container.style.backgroundColor = '#000';
    }

    // Hide address bar on iOS by scrolling
    window.scrollTo(0, 1);
  }

  create() {
    // Setup cleanup handlers first
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, releaseLandscapeOrientation);
    this.events.once(Phaser.Scenes.Events.DESTROY, releaseLandscapeOrientation);

    // Check if currently in landscape
    const isCurrentlyLandscape = window.innerWidth >= window.innerHeight;

    // Setup orientation monitoring with callbacks ONLY ONCE
    if (!this.orientationCallbacksRegistered) {
      this.orientationCallbacksRegistered = true;

      requireLandscapeOrientation({
        onLandscape: () => {
          console.log('Landscape detected, resuming game...');
          this.isWaitingForLandscape = false;

          if (this.scene.isPaused()) {
            setTimeout(() => {
              requestAnimationFrame(() => {
                // Ensure canvas and container are visible
                const container = document.getElementById('game-container');
                if (container) {
                  container.style.visibility = 'visible';
                  container.style.opacity = '1';
                  void container.offsetHeight;
                }

                this.game.canvas.style.display = 'block';
                this.game.canvas.style.visibility = 'visible';
                this.game.canvas.style.opacity = '1';
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

                // Resume scene
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
          if (this.gameInitialized && !this.gameStateManager.isOver() && !this.isWaitingForLandscape) {
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
        // Orientation lock may fail on unsupported browsers
      }
    }

    // ALWAYS initialize the game
    this.initializeGame();

    // If not in landscape, pause immediately after initialization
    if (!isCurrentlyLandscape) {
      this.isWaitingForLandscape = true;
      console.log('Starting in portrait mode - pausing after initialization');
      setTimeout(() => {
        this.scene.pause();
      }, 100);
    }
  }

  initializeGame() {
    // Prevent double initialization
    if (this.gameInitialized) return;
    this.gameInitialized = true;

    // Safe area offset for mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.safeAreaTop = isMobile ? 50 : 0;

    // Force fullscreen on mobile devices
    if (isMobile) {
      this.forceFullscreenOnMobile();
    } else {
      // Desktop: just try normal fullscreen
      this.scale.startFullscreen();
    }

    // Initialize all managers
    this.gameStateManager = new GameStateManager(this);
    this.gameStateManager.setSafeArea(this.safeAreaTop);
    this.gameStateManager.initialize();

    this.backgroundManager = new SceneBackgroundManager(this);
    this.backgroundManager.setSafeArea(this.safeAreaTop);
    this.backgroundManager.createParallaxBackground(this.gameStateManager.getSceneType());

    this.groundManager = new GroundManager(this);
    this.groundManager.createGround();

    this.playerManager = new PlayerManager(this);
    this.playerManager.createPlayer(this.groundManager.getGroundY());
    this.playerManager.addGroundCollision(this.groundManager.getGroundBody());

    this.scoringSystem = new ScoringSystem(this);

    // ✅ Initialize UI Manager with event-based system
    this.uiManager = new UIManager(this);
    this.uiManager.setSafeArea(this.safeAreaTop);
    this.uiManager.initialize(); // Changed from createUI() - sets up events too
    this.uiManager.setupControls(() => this.jump());

    this.obstacleManager = new ObstacleManager(this);
    this.obstacleManager.initialize();

    this.collectibleManager = new CollectibleManager(this);
    this.collectibleManager.initialize();
    this.collectibleManager.setSafeAreaTop(this.safeAreaTop);

    // ✅ Set manager references for scene switching
    this.gameStateManager.setManagers(
      this.backgroundManager,
      this.playerManager,
      this.obstacleManager,
      this.collectibleManager
    );

    // Setup collision detection
    this.obstacleManager.setupCollision(
      this.playerManager.getPlayer(),
      () => this.scoringSystem.getInvincibility(),
      () => this.gameStateManager.isSwitching(),
      () => this.handleGameOver()
    );

    // ✅ Event-based collision - no updateScoreDisplay callback needed
    this.collectibleManager.setupCollision(
      this.playerManager.getPlayer(),
      this.scoringSystem
    );

    // Create debug graphics
    this.debugGraphics = this.add.graphics();
    this.debugGraphics.setDepth(1000);
    this.playerManager.setDebugGraphics = this.debugGraphics;
    this.obstacleManager.setDebugGraphics(this.debugGraphics);
    this.collectibleManager.setDebugGraphics(this.debugGraphics);

    // ✅ Setup game timers (event-based - no timer callback needed)
    this.gameStateManager.setupGameTimers(
      () => this.handleCompleteGame()
    );

    // Schedule first obstacle
    this.obstacleManager.scheduleNextObstacle(this.gameStateManager.getCurrentSpeedTier());
  }

  jump() {
    this.playerManager.jump(this.gameStateManager.isOver());
  }

  handleGameOver() {
    this.gameStateManager.setCollision();
    this.gameStateManager.gameOver(
      this.playerManager.getPlayer(),
      this.collectibleManager.getItemsCollected()
    );
  }

  handleCompleteGame() {
    this.gameStateManager.completeGame(
      this.scoringSystem.getScore(),
      this.collectibleManager.getItemsCollected(),
      this.scoringSystem.comboCount,
      this.scoringSystem.comboActive
    );
  }

  update(time, delta) {
    if (this.gameStateManager.isOver()) return;

    const deltaInSeconds = delta / 1000;

    // Update distance
    this.gameStateManager.updateDistance(deltaInSeconds);

    // Update score
    const distanceScore = Math.floor(
      this.gameStateManager.distanceTraveled * GAME_CONSTANTS.DISTANCE_SCORE_MULTIPLIER
    );
    this.scoringSystem.score = distanceScore;

    // Add item scores
    const itemsCollected = this.collectibleManager.getItemsCollected();
    for (const [itemType, count] of Object.entries(itemsCollected)) {
      this.scoringSystem.score += count * GAME_CONSTANTS.ITEM_SCORES[itemType];
    }

    // ✅ Emit event instead of direct UI update
    gameEvents.emitEvent(
      GAME_EVENTS.SCORE_CHANGED,
      this.scoringSystem.score,
      this.gameStateManager.distanceTraveled
    );

    // Update parallax backgrounds
    this.backgroundManager.updateParallax(
      deltaInSeconds,
      this.gameStateManager.getScrollSpeed()
    );

    // Update ground
    this.groundManager.updateGround(
      deltaInSeconds,
      this.gameStateManager.getScrollSpeed()
    );

    // Update obstacles
    this.obstacleManager.updateObstacles(
      deltaInSeconds,
      this.gameStateManager.getScrollSpeed()
    );
    this.obstacleManager.updateSpawnTimer(
      delta,
      this.gameStateManager.isInSafe(),
      this.gameStateManager.isSwitching(),
      this.groundManager.getGroundY(),
      this.gameStateManager.getCurrentSpeedTier()
    );

    // Update collectibles
    this.collectibleManager.updateCollectibles(
      deltaInSeconds,
      this.gameStateManager.getScrollSpeed()
    );

    // Spawn collectibles
    if (time - this.lastCollectibleTime > GAME_CONSTANTS.COLLECTIBLE_SPAWN_INTERVAL) {
      this.collectibleManager.spawnCollectible(
        this.gameStateManager.isSwitching(),
        this.groundManager.getGroundY(),
        this.safeAreaTop
      );
      this.lastCollectibleTime = time;
    }

    // Handle jump input (keyboard)
    if (this.uiManager.isJumpPressed()) {
      this.jump();
    }

    // DEBUG: Draw hitboxes
    if (this.DEBUG_HITBOXES) {
      this.debugGraphics.clear();
      this.playerManager.debugDrawPlayerHitbox(this.DEBUG_HITBOXES);
      this.obstacleManager.debugDrawHitboxes(this.DEBUG_HITBOXES);
      this.collectibleManager.debugDrawHitboxes(this.DEBUG_HITBOXES);
    }
  }
}
