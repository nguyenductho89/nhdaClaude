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

    // Debug graphics reference
    this.debugGraphics = null;
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
   * Spawn ground obstacle
   */
  spawnGroundObstacle(groundY) {
    const { width } = this.scene.scale;

    const type = Phaser.Utils.Array.GetRandom(this.groundObstacles);

    // Obstacle stands ON the ground (smaller than player)
    const obstacleHeight = type.height;
    const obstacleY = groundY - obstacleHeight / 2;

    // Container for emoji obstacle
    const container = this.scene.add.container(width + 50, obstacleY);

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

    this.obstacles.add(container);
  }

  /**
   * Update obstacles (scrolling and cleanup)
   */
  updateObstacles(deltaInSeconds, scrollSpeed) {
    const scrollDistance = scrollSpeed * deltaInSeconds;

    this.obstacles.getChildren().forEach(obstacle => {
      obstacle.x -= scrollDistance;

      // Remove off-screen obstacles
      if (obstacle.x < -100) {
        obstacle.destroy();
      }
    });
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
