/**
 * GameEvents
 * Centralized event bus for game-wide communication
 * Allows event-based UI updates instead of frame-by-frame polling
 */

export const GAME_EVENTS = {
  // Score events
  SCORE_CHANGED: 'score:changed',
  DISTANCE_CHANGED: 'distance:changed',
  COMBO_CHANGED: 'combo:changed',
  MULTIPLIER_CHANGED: 'multiplier:changed',

  // Collection events
  ITEM_COLLECTED: 'item:collected',
  ITEMS_COUNT_CHANGED: 'items:count:changed',

  // Power-up events
  INVINCIBILITY_ACTIVATED: 'powerup:invincibility',
  INVINCIBILITY_ENDED: 'powerup:invincibility:end',
  MULTIPLIER_ACTIVATED: 'powerup:multiplier',
  MULTIPLIER_ENDED: 'powerup:multiplier:end',

  // Game state events
  GAME_STARTED: 'game:started',
  GAME_OVER: 'game:over',
  GAME_COMPLETED: 'game:completed',
  GAME_PAUSED: 'game:paused',
  GAME_RESUMED: 'game:resumed',

  // Scene events
  SCENE_CHANGED: 'scene:changed',
  SCENE_CHANGING: 'scene:changing',

  // Timer events
  TIMER_UPDATED: 'timer:updated',

  // Speed events
  SPEED_INCREASED: 'speed:increased'
};

/**
 * Simple event emitter
 */
export class EventBus extends Phaser.Events.EventEmitter {
  constructor() {
    super();
    this.eventLog = [];
    this.maxLogSize = 100;
  }

  /**
   * Emit event with logging
   */
  emitEvent(event, ...args) {
    // Log event (useful for debugging)
    if (this.eventLog.length >= this.maxLogSize) {
      this.eventLog.shift();
    }
    this.eventLog.push({
      event,
      timestamp: Date.now(),
      args
    });

    // Emit
    this.emit(event, ...args);
  }

  /**
   * Get recent events (for debugging)
   */
  getRecentEvents(count = 10) {
    return this.eventLog.slice(-count);
  }

  /**
   * Clear event log
   */
  clearLog() {
    this.eventLog = [];
  }
}

// Global event bus instance
export const gameEvents = new EventBus();
