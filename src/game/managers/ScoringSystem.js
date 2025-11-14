import { GAME_CONSTANTS } from '../../config/game.js';
import { GAME_EVENTS, gameEvents } from '../utils/GameEvents.js';

/**
 * ScoringSystem (Refactored with Event-Based Updates)
 * ✅ Event-based updates (emit events thay vì gọi UI trực tiếp)
 * ✅ Không cần UI references
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

    // Timers
    this.comboTimer = null;
  }

  /**
   * Add score with multiplier and emit event
   */
  addScore(points) {
    this.score += points * this.scoreMultiplier;
    // Event will be emitted by GameScene when score changes
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
   * Activate invincibility power-up (event-based)
   */
  activateInvincibility(player) {
    this.isInvincible = true;
    player.setTint(0x00FFFF); // Cyan tint

    // Emit event for UI to show notification
    gameEvents.emitEvent(GAME_EVENTS.INVINCIBILITY_ACTIVATED);

    this.scene.time.addEvent({
      delay: GAME_CONSTANTS.INVINCIBILITY_DURATION,
      callback: () => {
        this.isInvincible = false;
        player.clearTint();
        gameEvents.emitEvent(GAME_EVENTS.INVINCIBILITY_ENDED);
      }
    });
  }

  /**
   * Activate score multiplier power-up (event-based)
   */
  activateMultiplier() {
    this.scoreMultiplier = GAME_CONSTANTS.MULTIPLIER_GOLD;

    // Emit event for UI
    gameEvents.emitEvent(GAME_EVENTS.MULTIPLIER_ACTIVATED);
    gameEvents.emitEvent(GAME_EVENTS.MULTIPLIER_CHANGED, this.scoreMultiplier);

    this.scene.time.addEvent({
      delay: GAME_CONSTANTS.MULTIPLIER_DURATION,
      callback: () => {
        this.scoreMultiplier = 1;
        gameEvents.emitEvent(GAME_EVENTS.MULTIPLIER_ENDED);
        gameEvents.emitEvent(GAME_EVENTS.MULTIPLIER_CHANGED, this.scoreMultiplier);
      }
    });
  }

  /**
   * Update combo system (event-based)
   */
  updateCombo() {
    this.comboCount++;
    this.comboActive = true;

    // Emit combo changed event
    gameEvents.emitEvent(GAME_EVENTS.COMBO_CHANGED, this.comboCount, this.comboActive);

    // Reset combo after 2 seconds of no collection
    if (this.comboTimer) {
      this.comboTimer.remove();
    }

    this.comboTimer = this.scene.time.addEvent({
      delay: 2000,
      callback: () => {
        this.comboCount = 0;
        this.comboActive = false;
        gameEvents.emitEvent(GAME_EVENTS.COMBO_CHANGED, this.comboCount, this.comboActive);
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

    // Emit reset events
    gameEvents.emitEvent(GAME_EVENTS.SCORE_CHANGED, 0, 0);
    gameEvents.emitEvent(GAME_EVENTS.COMBO_CHANGED, 0, false);
    gameEvents.emitEvent(GAME_EVENTS.MULTIPLIER_CHANGED, 1);
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
