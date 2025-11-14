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

    // Debug graphics reference
    this.debugGraphics = null;
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
  spawnCollectible(isSwitchingScene, groundY, safeAreaTop) {
    // Don't spawn if switching scenes
    if (isSwitchingScene) return;

    const { width, height } = this.scene.scale;

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
    const maxHeightAboveGround = Math.min(200, groundY - safeAreaTop - 100);
    const heightAboveGround = Phaser.Math.Between(50, maxHeightAboveGround);
    const y = groundY - heightAboveGround;

    // ✅ Container for emoji + value text
    const container = this.scene.add.container(width + 50, y);

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

    this.collectibles.add(container);

    // Floating animation - gentle bobbing in the sky
    this.scene.tweens.add({
      targets: container,
      y: y - 20,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
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

    // Destroy item
    item.destroy();
  }

  /**
   * Update collectibles (scrolling and cleanup)
   */
  updateCollectibles(deltaInSeconds, scrollSpeed) {
    const scrollDistance = scrollSpeed * deltaInSeconds;

    this.collectibles.getChildren().forEach(item => {
      item.x -= scrollDistance;

      // Remove off-screen collectibles
      if (item.x < -100) {
        // Stop any tweens on this collectible
        this.scene.tweens.killTweensOf(item);
        item.destroy();
      }
    });
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
   * Set safe area top (needed for spawn calculation)
   */
  setSafeAreaTop(safeAreaTop) {
    this.safeAreaTop = safeAreaTop;
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
