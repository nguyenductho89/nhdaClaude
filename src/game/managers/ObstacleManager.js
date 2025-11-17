import { GAME_CONSTANTS } from '../../config/game.js';

/**
 * ObstacleManager
 * Handles obstacle spawning, updates, and collision detection
 */
export default class ObstacleManager {
  constructor(scene) {
    this.scene = scene;
    this.obstacles = null;
    this.nextObstacleDelay = 0;
    this.obstacleTimer = 0;

    // Obstacle types configuration
    this.groundObstacles = [
      { key: 'stress', emoji: '😰', height: 50 },
      { key: 'deadline', emoji: '⏰', height: 50 },
      { key: 'work', emoji: '💼', height: 50 },
      { key: 'boss', emoji: '👔', height: 50 },
      { key: 'overtime', emoji: '🌙', height: 50 },
      { key: 'meeting', emoji: '📊', height: 50 }
    ];

    // Object pooling for obstacles
    this.obstaclePool = [];
    // iOS optimization: Smaller pool size to reduce memory usage
    const ua = navigator.userAgent;
    this.isIOS = /iPhone|iPad|iPod/i.test(ua);
    this.maxPoolSize = this.isIOS ? 10 : 15; // Max obstacles to keep in pool

    // Device-specific configuration
    this.deviceConfig = null;

    // Safe play area (for landscape: avoid spawning in notch/home indicator areas)
    this.safePlayArea = null;

    // Debug graphics reference
    this.debugGraphics = null;
  }

  /**
   * Set device config and safe play area for obstacle spawning
   * Obstacles spawn at right edge and should stay within safe horizontal bounds
   */
  setDeviceConfig(config, playArea) {
    this.deviceConfig = config;
    this.safePlayArea = playArea;
  }

  /**
   * Initialize obstacles group
   */
  initialize() {
    this.obstacles = this.scene.physics.add.group();
    this.scheduleNextObstacle(0);
  }

  /**
   * Set debug graphics reference
   */
  setDebugGraphics(graphics) {
    this.debugGraphics = graphics;
  }

  /**
   * Schedule next obstacle spawn
   */
  scheduleNextObstacle(currentSpeedTier) {
    // Calculate next obstacle delay based on current difficulty
    const baseGap = GAME_CONSTANTS.OBSTACLE_MIN_GAP;
    const maxGap = GAME_CONSTANTS.OBSTACLE_MAX_GAP;
    const reduction = currentSpeedTier * GAME_CONSTANTS.OBSTACLE_DENSITY_INCREASE;

    const minGap = Math.max(1000, baseGap - reduction);
    const adjustedMaxGap = Math.max(minGap + 500, maxGap - reduction);

    this.nextObstacleDelay = Phaser.Math.Between(minGap, adjustedMaxGap);
    this.obstacleTimer = 0;
  }

  /**
   * Spawn an obstacle
   */
  spawnObstacle(isInSafePeriod, isSwitchingScene, groundY, currentSpeedTier) {
    // Don't spawn if in safe period, game over, or switching scenes
    if (isInSafePeriod || isSwitchingScene) return;

    // Only spawn ground obstacles (no flying enemies)
    this.spawnGroundObstacle(groundY);

    // Schedule next obstacle
    this.scheduleNextObstacle(currentSpeedTier);
  }

  /**
   * Spawn ground obstacle (with object pooling)
   */
  spawnGroundObstacle(groundY) {
    const { width } = this.scene.scale;

    // Get device-specific spawn config
    const deviceConfig = this.deviceConfig || { spawn: { rightOffset: 50 } };

    // Spawn at right edge of safe play area (before home indicator in landscape)
    const spawnX = this.safePlayArea
      ? this.safePlayArea.right + deviceConfig.spawn.rightOffset
      : width + deviceConfig.spawn.rightOffset;

    const type = Phaser.Utils.Array.GetRandom(this.groundObstacles);

    // Obstacle stands ON the ground (smaller than player)
    const obstacleHeight = type.height;
    const obstacleY = groundY - obstacleHeight / 2;

    let container;

    // Try to reuse from pool
    if (this.obstaclePool.length > 0) {
      container = this.obstaclePool.pop();
      container.setActive(true);
      container.setVisible(true);

      // Update position
      container.x = spawnX;
      container.y = obstacleY;

      // Update emoji
      const emoji = container.list[0]; // First child is the emoji text
      emoji.setText(type.emoji);

      // Update data
      container.setData('type', type.key);

      // Re-enable physics body
      if (container.body) {
        container.body.enable = true;
      }
    } else {
      // Create new obstacle if pool is empty
      container = this.scene.add.container(spawnX, obstacleY);

      // Create emoji obstacle (small - easy to see and avoid)
      const emoji = this.scene.add.text(0, 0, type.emoji, {
        fontSize: '48px'
      }).setOrigin(0.5, 0.5);

      container.add([emoji]);

      // Physics on container
      this.scene.physics.add.existing(container);
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
    }

    this.obstacles.add(container);
  }

  /**
   * Update obstacles (scrolling and cleanup with object pooling)
   */
  updateObstacles(deltaInSeconds, scrollSpeed) {
    const scrollDistance = scrollSpeed * deltaInSeconds;

    // Get device-specific cleanup config
    const deviceConfig = this.deviceConfig || { spawn: { leftCleanup: -100 } };

    // Calculate cleanup position (left edge of safe area + cleanup offset)
    const cleanupX = this.safePlayArea
      ? this.safePlayArea.left + deviceConfig.spawn.leftCleanup
      : deviceConfig.spawn.leftCleanup;

    this.obstacles.getChildren().forEach(obstacle => {
      obstacle.x -= scrollDistance;

      // Recycle off-screen obstacles (past left safe area)
      if (obstacle.x < cleanupX) {
        this.recycleObstacle(obstacle);
      }
    });
  }

  /**
   * Recycle obstacle to pool instead of destroying
   */
  recycleObstacle(obstacle) {
    // Remove from active group
    this.obstacles.remove(obstacle);

    // Hide and deactivate
    obstacle.setActive(false);
    obstacle.setVisible(false);

    // Disable physics body
    if (obstacle.body) {
      obstacle.body.enable = false;
    }

    // Add to pool if not full
    if (this.obstaclePool.length < this.maxPoolSize) {
      this.obstaclePool.push(obstacle);
    } else {
      // Pool is full, destroy excess obstacles
      obstacle.destroy();
    }
  }

  /**
   * Update spawn timer
   */
  updateSpawnTimer(deltaInMs, isInSafePeriod, isSwitchingScene, groundY, currentSpeedTier) {
    this.obstacleTimer += deltaInMs;

    if (this.obstacleTimer >= this.nextObstacleDelay) {
      this.spawnObstacle(isInSafePeriod, isSwitchingScene, groundY, currentSpeedTier);
    }
  }

  /**
   * Handle collision with obstacle
   */
  hitObstacle(player, obstacle, isInvincible, isSwitchingScene, onGameOver) {
    if (isInvincible || isSwitchingScene) return;

    // Verify this is actually an obstacle (not background element)
    if (!obstacle || !this.obstacles.contains(obstacle)) {
      return;
    }

    // Double-check obstacle is valid and has type data
    const obstacleType = obstacle.getData('type');
    if (!obstacleType) {
      return;
    }

    // Check if it's marked as decoration (should not collide)
    if (obstacle.getData('isDecoration')) {
      return;
    }

    // Game over on collision
    if (onGameOver) {
      onGameOver();
    }
  }

  /**
   * Setup collision detection with player
   */
  setupCollision(player, isInvincibleCallback, isSwitchingCallback, onGameOverCallback) {
    this.scene.physics.add.overlap(
      player,
      this.obstacles,
      (p, obstacle) => {
        this.hitObstacle(
          p,
          obstacle,
          isInvincibleCallback(),
          isSwitchingCallback(),
          onGameOverCallback
        );
      },
      null,
      this.scene
    );
  }

  /**
   * Draw debug hitboxes for obstacles
   */
  debugDrawHitboxes(debugEnabled) {
    if (!debugEnabled || !this.debugGraphics) return;

    // Draw obstacles hitboxes (red)
    this.obstacles.getChildren().forEach(obstacle => {
      if (obstacle.body) {
        this.debugGraphics.lineStyle(2, 0xff0000, 1);
        this.debugGraphics.strokeRect(
          obstacle.body.x,
          obstacle.body.y,
          obstacle.body.width,
          obstacle.body.height
        );
      }
    });
  }

  /**
   * Get obstacles group
   */
  getObstacles() {
    return this.obstacles;
  }

  /**
   * Clear all obstacles
   */
  clear() {
    if (this.obstacles) {
      this.obstacles.clear(true, true);
    }
  }

  /**
   * Destroy manager
   */
  destroy() {
    if (this.obstacles) {
      this.obstacles.destroy(true);
    }
  }
}
