import { GAME_CONSTANTS } from '../../config/game.js';
import { GAME_EVENTS, gameEvents } from '../utils/GameEvents.js';

/**
 * CollectibleManager (Refactored with Containers & Events)
 * ✅ Container cho mỗi collectible
 * ✅ Event-based effects
 * ✅ No manual UI updates
 */
export default class CollectibleManager {
  constructor(scene) {
    this.scene = scene;
    this.collectibles = null;

    // Collectible configuration
    this.itemConfig = {
      tien: { emoji: '💰', valueText: '+10', size: 36, hitbox: 30 },
      tin: { emoji: '❤️', valueText: '+50', size: 40, hitbox: 32 },
      nha: { emoji: '🏡', valueText: '+100', size: 44, hitbox: 36 },
      xe: { emoji: '🚗', valueText: '+150', size: 44, hitbox: 36 },
      vang: { emoji: '💍', valueText: '+300', size: 44, hitbox: 36 }
    };

    // Tracking
    this.itemsCollected = {
      tien: 0,
      tin: 0,
      nha: 0,
      xe: 0,
      vang: 0
    };

    // Object pooling for collectibles
    this.collectiblePool = [];
    this.maxPoolSize = 15; // Max collectibles to keep in pool

    // Device-specific configuration
    this.deviceConfig = null;

    // Safe play area (for landscape: avoid spawning in notch/home indicator areas)
    this.safePlayArea = null;

    // Debug graphics reference
    this.debugGraphics = null;

    // Cache iOS detection for performance
    const ua = navigator.userAgent;
    this.isIOS = /iPhone|iPad|iPod/i.test(ua);
  }

  /**
   * Set device config and safe play area for collectible spawning
   * Collectibles spawn at right edge and should stay within safe horizontal bounds
   */
  setDeviceConfig(config, playArea) {
    this.deviceConfig = config;
    this.safePlayArea = playArea;
    console.log('✨ CollectibleManager: Device Config:', config.deviceType);
    console.log('✨ CollectibleManager: Safe Play Area:', playArea);
  }

  /**
   * Initialize collectibles group
   */
  initialize() {
    this.collectibles = this.scene.physics.add.group();
  }

  /**
   * Set debug graphics reference
   */
  setDebugGraphics(graphics) {
    this.debugGraphics = graphics;
  }

  /**
   * Spawn a collectible item using Container
   */
  spawnCollectible(isSwitchingScene, groundY) {
    // Don't spawn if switching scenes
    if (isSwitchingScene) return;

    const { width, height } = this.scene.scale;

    // Get device-specific spawn config
    const deviceConfig = this.deviceConfig || { spawn: { rightOffset: 50 } };

    // Spawn at right edge of safe play area (before home indicator in landscape)
    const spawnX = this.safePlayArea
      ? this.safePlayArea.right + deviceConfig.spawn.rightOffset
      : width + deviceConfig.spawn.rightOffset;

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

    const config = this.itemConfig[itemType];

    // Items float in the AIR above ground - player must JUMP to collect
    // Use safe play area top if available
    const safeTop = this.safePlayArea ? this.safePlayArea.top : 0;
    const maxHeightAboveGround = Math.min(200, groundY - safeTop - 100);
    const heightAboveGround = Phaser.Math.Between(50, maxHeightAboveGround);
    const y = groundY - heightAboveGround;

    let container;

    // Try to reuse from pool
    if (this.collectiblePool.length > 0) {
      container = this.collectiblePool.pop();
      container.setActive(true);
      container.setVisible(true);

      // Update position
      container.x = spawnX;
      container.y = y;

      // Update emoji and value text
      const emoji = container.list[0]; // First child is emoji
      const valueLabel = container.list[1]; // Second child is value text
      emoji.setText(config.emoji);
      emoji.setFontSize(config.size);
      valueLabel.setText(config.valueText);

      // Update physics hitbox
      container.body.setSize(config.hitbox, config.hitbox);
      container.body.setOffset(-config.hitbox / 2, -config.hitbox / 2);
      container.body.enable = true;

      // Update data
      container.setData('itemType', itemType);
      container.setData('score', GAME_CONSTANTS.ITEM_SCORES[itemType]);
    } else {
      // Create new collectible if pool is empty
      container = this.scene.add.container(spawnX, y);

      // Create emoji (centered)
      const emoji = this.scene.add.text(0, 0, config.emoji, {
        fontSize: `${config.size}px`
      }).setOrigin(0.5, 0.5);

      // Add value text above emoji (small)
      const valueLabel = this.scene.add.text(0, -28, config.valueText, {
        fontSize: '11px',
        fontFamily: 'Arial',
        color: '#FFD700',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        padding: { x: 4, y: 2 }
      }).setOrigin(0.5, 0.5);

      container.add([emoji, valueLabel]);

      // Physics on container
      this.scene.physics.add.existing(container);
      container.body.setAllowGravity(false);
      container.body.setSize(config.hitbox, config.hitbox);
      container.body.setOffset(-config.hitbox / 2, -config.hitbox / 2);
      container.setData('itemType', itemType);
      container.setData('score', GAME_CONSTANTS.ITEM_SCORES[itemType]);

      // Set depth to appear above background
      container.setDepth(30);
    }

    this.collectibles.add(container);

    // Floating animation - gentle bobbing in the sky
    // iOS optimization: Disable tweens for better performance
    if (!this.isIOS) {
      this.scene.tweens.add({
        targets: container,
        y: y - 20,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  /**
   * Handle item collection (event-based)
   */
  collectItem(player, item, scoringSystem) {
    const itemType = item.getData('itemType');
    const itemScore = item.getData('score');

    // Update collected items
    this.itemsCollected[itemType]++;

    // Apply score through scoring system
    scoringSystem.addScore(itemScore);
    scoringSystem.incrementItemsCollected();

    // Update combo (if threshold reached)
    if (scoringSystem.comboCount >= GAME_CONSTANTS.COMBO_THRESHOLD - 1) {
      scoringSystem.updateCombo();
    } else {
      scoringSystem.comboCount++;
    }

    // Special item effects (event-based)
    if (itemType === 'xe') {
      scoringSystem.activateInvincibility(player);
    } else if (itemType === 'vang') {
      scoringSystem.activateMultiplier();
    }

    // ✅ Emit event for UI to show collect effect and floating text
    gameEvents.emitEvent(GAME_EVENTS.ITEM_COLLECTED, item.x, item.y, itemType, itemScore);

    // Recycle item instead of destroying
    this.recycleCollectible(item);
  }

  /**
   * Update collectibles (scrolling and cleanup)
   */
  updateCollectibles(deltaInSeconds, scrollSpeed) {
    const scrollDistance = scrollSpeed * deltaInSeconds;

    // Get device-specific cleanup config
    const deviceConfig = this.deviceConfig || { spawn: { leftCleanup: -100 } };

    // Calculate cleanup position (left edge of safe area + cleanup offset)
    const cleanupX = this.safePlayArea
      ? this.safePlayArea.left + deviceConfig.spawn.leftCleanup
      : deviceConfig.spawn.leftCleanup;

    this.collectibles.getChildren().forEach(item => {
      item.x -= scrollDistance;

      // Recycle off-screen collectibles (past left safe area)
      if (item.x < cleanupX) {
        this.recycleCollectible(item);
      }
    });
  }

  /**
   * Recycle collectible to pool instead of destroying
   */
  recycleCollectible(item) {
    // Stop any tweens on this collectible
    this.scene.tweens.killTweensOf(item);

    // Remove from active group
    this.collectibles.remove(item);

    // Hide and deactivate
    item.setActive(false);
    item.setVisible(false);

    // Disable physics body
    if (item.body) {
      item.body.enable = false;
    }

    // Add to pool if not full
    if (this.collectiblePool.length < this.maxPoolSize) {
      this.collectiblePool.push(item);
    } else {
      // Pool is full, destroy excess collectibles
      item.destroy();
    }
  }

  /**
   * Setup collision detection with player
   */
  setupCollision(player, scoringSystem) {
    this.scene.physics.add.overlap(
      player,
      this.collectibles,
      (p, item) => {
        this.collectItem(p, item, scoringSystem);
      },
      null,
      this.scene
    );
  }

  /**
   * Draw debug hitboxes for collectibles
   */
  debugDrawHitboxes(debugEnabled) {
    if (!debugEnabled || !this.debugGraphics) return;

    // Draw collectibles hitboxes (green)
    this.collectibles.getChildren().forEach(item => {
      if (item.body) {
        this.debugGraphics.lineStyle(2, 0x00ff00, 1); // Green for collectibles
        this.debugGraphics.strokeRect(
          item.body.x,
          item.body.y,
          item.body.width,
          item.body.height
        );
      }
    });
  }

  /**
   * Get collectibles group
   */
  getCollectibles() {
    return this.collectibles;
  }

  /**
   * Get items collected statistics
   */
  getItemsCollected() {
    return this.itemsCollected;
  }

  /**
   * Clear all collectibles
   */
  clear() {
    if (this.collectibles) {
      this.collectibles.getChildren().forEach(item => {
        this.scene.tweens.killTweensOf(item);
      });
      this.collectibles.clear(true, true);
    }
  }

  /**
   * Destroy manager
   */
  destroy() {
    this.clear();
    if (this.collectibles) {
      this.collectibles.destroy(true);
    }
  }
}
