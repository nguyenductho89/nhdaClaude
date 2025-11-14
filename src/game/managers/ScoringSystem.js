import { GAME_CONSTANTS } from '../../config/game.js';

/**
 * ScoringSystem
 * Handles score calculation, combos, multipliers, and power-up effects
 */
export default class ScoringSystem {
  constructor(scene) {
    this.scene = scene;

    // Score tracking
    this.score = 0;
    this.scoreMultiplier = 1;
    this.comboCount = 0;
    this.comboActive = false;
    this.itemsCollected = 0;

    // Power-up states
    this.isInvincible = false;

    // UI references (will be set by UIManager)
    this.multiplierText = null;
    this.comboText = null;
  }

  /**
   * Set UI text references
   */
  setUIReferences(multiplierText, comboText) {
    this.multiplierText = multiplierText;
    this.comboText = comboText;
  }

  /**
   * Add score with multiplier
   */
  addScore(points) {
    this.score += points * this.scoreMultiplier;
  }

  /**
   * Get current score
   */
  getScore() {
    return this.score;
  }

  /**
   * Get items collected count
   */
  getItemsCollected() {
    return this.itemsCollected;
  }

  /**
   * Increment items collected
   */
  incrementItemsCollected() {
    this.itemsCollected++;
  }

  /**
   * Get invincibility state
   */
  getInvincibility() {
    return this.isInvincible;
  }

  /**
   * Activate invincibility power-up
   */
  activateInvincibility(player, safeAreaTop) {
    this.isInvincible = true;
    player.setTint(0x00FFFF); // Cyan tint

    // Create animated notification
    const { width, height } = this.scene.scale;
    const notificationY = height / 2 - 150 + safeAreaTop;
    const notification = this.scene.add.text(width / 2, notificationY, '🚗 BẤT TỬ 5S!', {
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
    this.scene.tweens.add({
      targets: notification,
      alpha: 1,
      scale: 1.2,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Pulse animation
        this.scene.tweens.add({
          targets: notification,
          scale: 1.3,
          duration: 500,
          yoyo: true,
          repeat: 8, // 5 seconds / 0.5s per pulse
          ease: 'Sine.easeInOut'
        });
        // Fade out after 4.5 seconds
        this.scene.time.delayedCall(4500, () => {
          this.scene.tweens.add({
            targets: notification,
            alpha: 0,
            y: notification.y - 50,
            duration: 500,
            onComplete: () => notification.destroy()
          });
        });
      }
    });

    this.scene.time.addEvent({
      delay: GAME_CONSTANTS.INVINCIBILITY_DURATION,
      callback: () => {
        this.isInvincible = false;
        player.clearTint();
      }
    });
  }

  /**
   * Activate score multiplier power-up
   */
  activateMultiplier(safeAreaTop) {
    this.scoreMultiplier = GAME_CONSTANTS.MULTIPLIER_GOLD;
    if (this.multiplierText) {
      this.multiplierText.setText(`⭐ x${this.scoreMultiplier}`).setVisible(true);
    }

    // Create animated notification
    const { width, height } = this.scene.scale;
    const notificationY = height / 2 - 150 + safeAreaTop;
    const notification = this.scene.add.text(width / 2, notificationY, '💍 ĐIỂM x2 - 10S!', {
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
    this.scene.tweens.add({
      targets: notification,
      alpha: 1,
      scale: 1.2,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Sparkle/pulse animation
        this.scene.tweens.add({
          targets: notification,
          scale: 1.3,
          duration: 600,
          yoyo: true,
          repeat: 15, // 10 seconds / 0.6s per pulse
          ease: 'Sine.easeInOut'
        });
        // Fade out after 9.5 seconds
        this.scene.time.delayedCall(9500, () => {
          this.scene.tweens.add({
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

    this.scene.time.addEvent({
      delay: GAME_CONSTANTS.MULTIPLIER_DURATION,
      callback: () => {
        this.scoreMultiplier = 1;
        if (this.multiplierText) {
          this.multiplierText.setVisible(false);
        }
      }
    });
  }

  /**
   * Update combo system
   */
  updateCombo() {
    this.comboCount++;
    this.comboActive = true;

    if (this.comboText) {
      this.comboText.setText(`🔥 COMBO x${this.comboCount}`).setVisible(true);
    }

    // Reset combo after 2 seconds of no collection
    if (this.comboTimer) {
      this.comboTimer.remove();
    }

    this.comboTimer = this.scene.time.addEvent({
      delay: 2000,
      callback: () => {
        this.comboCount = 0;
        this.comboActive = false;
        if (this.comboText) {
          this.comboText.setVisible(false);
        }
      }
    });
  }

  /**
   * Reset scoring state
   */
  reset() {
    this.score = 0;
    this.scoreMultiplier = 1;
    this.comboCount = 0;
    this.comboActive = false;
    this.itemsCollected = 0;
    this.isInvincible = false;

    if (this.comboTimer) {
      this.comboTimer.remove();
    }
  }

  /**
   * Destroy system
   */
  destroy() {
    if (this.comboTimer) {
      this.comboTimer.remove();
    }
  }
}
