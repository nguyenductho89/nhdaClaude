import { GAME_CONSTANTS } from '../../config/game.js';

/**
 * PlayerManager
 * Handles player creation, movement, physics, and debug visualization
 */
export default class PlayerManager {
  constructor(scene) {
    this.scene = scene;
    this.player = null;
    this.playerHitboxGraphics = null;
    this.playerBorderGraphics = null;

    // Player constants (will be set from device config)
    this.playerWidth = 120;  // Default fallback
    this.playerHeight = 140; // Default fallback

    // Device-specific configuration
    this.deviceConfig = null;

    // Safe area insets (for landscape positioning)
    this.safeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };
    this.safePlayArea = null;

    // Cache iOS detection for performance
    const ua = navigator.userAgent;
    this.isIOS = /iPhone|iPad|iPod/i.test(ua);
  }

  /**
   * Set device config and safe area insets for player positioning
   * In landscape: player needs to be positioned after left safe area (notch)
   */
  setDeviceConfig(config, insets, playArea) {
    this.deviceConfig = config;
    this.safeAreaInsets = insets;
    this.safePlayArea = playArea;

    // Set player size from device config
    if (config.player && config.player.width && config.player.height) {
      this.playerWidth = config.player.width;
      this.playerHeight = config.player.height;
    }
  }

  /**
   * Create player sprite with physics
   */
  createPlayer(groundY) {
    const { width, height } = this.scene.scale;

    // Get device-specific player config
    const config = this.deviceConfig || {
      player: { baseX: 100, baseXLarge: 150 }
    };

    // Position player after left safe area (notch in landscape)
    const basePlayerX = width < 600 ? config.player.baseX : config.player.baseXLarge;
    const playerX = basePlayerX + this.safeAreaInsets.left;

    // Player Y position - use default origin (0.5, 0.5) for simpler calculation
    const playerY = groundY - this.playerHeight / 2;

    // Create player using the loaded image
    this.player = this.scene.physics.add.sprite(playerX, playerY, 'playerImage');
    this.player.setCollideWorldBounds(false);
    // Use default origin (0.5, 0.5) - center of sprite

    // Set depth to ensure player is always on top of background
    this.player.setDepth(50);

    // Stretch image to fit the exact size
    this.player.setDisplaySize(this.playerWidth, this.playerHeight);

    // Set hitbox - different values for desktop vs mobile
    let hitboxWidth, hitboxHeight;
    if (this.deviceConfig && this.deviceConfig.deviceType === 'Desktop') {
      // Desktop hitbox - larger multipliers for desktop
      hitboxWidth = 2.5 * this.playerWidth;
      hitboxHeight = 3.8 * this.playerHeight;
    } else {
      // Mobile hitbox - original values
      hitboxWidth = 4 * this.playerWidth;
      hitboxHeight = 6.0 * this.playerHeight;
    }
    this.player.body.setSize(hitboxWidth, hitboxHeight);

    // Center hitbox horizontally, vertically centered by default
    // this.player.body.setOffset((playerWidth - hitboxWidth) / 2, (playerHeight - hitboxHeight) / 2);

    // Physics - Chrome Dino style (simple gravity)
    this.player.body.setGravityY(GAME_CONSTANTS.GRAVITY);

    // DEBUG: Create graphics for hitbox visualization (skip on iOS for performance)
    if (!this.isIOS) {
      this.playerHitboxGraphics = this.scene.add.graphics();
      this.playerHitboxGraphics.setDepth(1000);

      // DEBUG: Create red border for player sprite
      this.playerBorderGraphics = this.scene.add.graphics();
      this.playerBorderGraphics.setDepth(1000);
    }

    // No running animation tween - keep it simple and stable
    // Player stays at fixed position, only jumps

    return this.player;
  }

  /**
   * Add ground collision to player
   */
  addGroundCollision(ground) {
    this.scene.physics.add.collider(this.player, ground);
  }

  /**
   * Handle jump action
   */
  jump(isGameOver) {
    // Simple jump like Chrome Dino - just one jump strength
    if (this.player.body.touching.down && !isGameOver) {
      this.player.setVelocityY(GAME_CONSTANTS.JUMP_VELOCITY_HIGH);
    }
  }

  /**
   * Get player sprite
   */
  getPlayer() {
    return this.player;
  }

  /**
   * Get player dimensions
   */
  getDimensions() {
    return {
      width: this.playerWidth,
      height: this.playerHeight
    };
  }

  /**
   * Draw debug hitboxes for player
   */
  debugDrawPlayerHitbox(debugEnabled) {
    // Only draw if DEBUG_HITBOXES is enabled
    if (!debugEnabled) {
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
      this.playerBorderGraphics.lineStyle(2, 0xff0000, 1); // Red color for sprite border
      this.playerBorderGraphics.strokeRect(
        this.player.x - this.playerWidth / 2,
        this.player.y - this.playerHeight / 2,
        this.playerWidth,
        this.playerHeight
      );
    }

    // Draw player body/hitbox (red, thicker)
    if (this.player && this.player.body) {
      this.playerHitboxGraphics.lineStyle(3, 0x008000, 0.8); // Red color, 3px width for body
      this.playerHitboxGraphics.strokeRect(
        this.player.body.x,
        this.player.body.y,
        this.player.body.width,
        this.player.body.height
      );
    }
  }

  /**
   * Destroy player and graphics
   */
  destroy() {
    if (this.player) this.player.destroy();
    if (this.playerHitboxGraphics) this.playerHitboxGraphics.destroy();
    if (this.playerBorderGraphics) this.playerBorderGraphics.destroy();
  }
}
