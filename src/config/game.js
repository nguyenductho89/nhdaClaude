import Phaser from 'phaser';

// Detect if mobile device
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  || window.innerWidth < 768;

// Base dimensions for scaling
const BASE_WIDTH = isMobile ? 800 : 1200;
const BASE_HEIGHT = isMobile ? 450 : 600;

export const gameConfig = {
  type: Phaser.AUTO,
  width: BASE_WIDTH,
  height: BASE_HEIGHT,
  backgroundColor: '#87CEEB',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 }, // Set to 0, we'll use per-object gravity
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: BASE_WIDTH,
    height: BASE_HEIGHT,
    min: {
      width: 320,
      height: 180
    },
    max: {
      width: 1920,
      height: 1080
    }
  },
  render: {
    pixelArt: false,
    antialias: true,
    roundPixels: true
  }
};

// Game constants for Endless Runner
export const GAME_CONSTANTS = {
  // Auto-run speed settings
  INITIAL_SCROLL_SPEED: 300,  // px/s - starting speed
  MAX_SCROLL_SPEED: 600,       // px/s - maximum speed
  SPEED_INCREMENT: 30,         // px/s - speed increase every 30 seconds
  SPEED_INCREMENT_INTERVAL: 30000, // ms - 30 seconds

  // Jump mechanics (simpler like Chrome Dino)
  JUMP_VELOCITY_HIGH: -500,    // Single jump velocity
  GRAVITY: 1000,               // Stronger gravity for snappier feel

  // Game duration
  GAME_DURATION: 120000,       // ms - 2 minutes
  SAFE_PERIOD_START: 5000,     // ms - no obstacles in first 5 seconds
  SAFE_PERIOD_INTERVAL: 45000, // ms - safe period every 45 seconds
  SAFE_PERIOD_DURATION: 3000,  // ms - 3 second safe zone

  // Scoring system
  DISTANCE_SCORE_MULTIPLIER: 1, // 1 point per meter
  ITEM_SCORES: {
    tien: 10,      // Tiền - coins
    tin: 50,       // Nhà tin
    nha: 100,      // Nhà
    xe: 150,       // Xe (+ invincibility)
    soDo: 200,     // Sổ đỏ
    vang: 300      // Vàng (+ 2x multiplier)
  },
  COMBO_THRESHOLD: 5,          // 5+ items for combo
  COMBO_BONUS: 50,             // Bonus for combo
  SURVIVAL_BONUS: 10,          // Per 10 seconds survived
  PERFECT_RUN_BONUS: 1000,     // No collision + complete 2 min
  MULTIPLIER_COMBO: 1.5,       // Multiplier during combo
  MULTIPLIER_GOLD: 2,          // Multiplier from gold item

  // Obstacle spawning
  OBSTACLE_MIN_GAP: 1500,      // ms - minimum time between obstacles
  OBSTACLE_MAX_GAP: 3000,      // ms - maximum time between obstacles
  OBSTACLE_DENSITY_INCREASE: 200, // ms - reduce gap over time

  // Collectible spawning
  COLLECTIBLE_SPAWN_INTERVAL: 2000, // ms - spawn collectibles every 2-3 seconds
  COLLECTIBLE_RARE_CHANCE: 0.3,     // 30% chance for rare items

  // Power-ups
  INVINCIBILITY_DURATION: 5000,  // ms - from xe item
  MULTIPLIER_DURATION: 10000,    // ms - from vang item

  // Parallax layers speed (relative to scroll speed)
  PARALLAX_SKY: 0,          // Static
  PARALLAX_CLOUDS: 0.2,     // Slow
  PARALLAX_MOUNTAINS: 0.5,  // Medium
  PARALLAX_GROUND: 1        // Same as scroll speed
};

// Wedding info (placeholder - replace with actual data)
export const WEDDING_INFO = {
  groom: {
    fullName: "Nguyễn Văn A",
    firstName: "A",
    father: "Nguyễn Văn B",
    mother: "Trần Thị C",
    phone: "0901234567"
  },
  bride: {
    fullName: "Trần Thị D",
    firstName: "D",
    father: "Trần Văn E",
    mother: "Lê Thị F",
    phone: "0907654321"
  },
  events: [
    {
      type: "thanh_hon",
      title: "Lễ Thành Hôn & Tiệc Cưới",
      date: "2024-12-15",
      time: "18:00",
      location: {
        name: "Trung Tâm Tiệc Cưới ABC",
        address: "456 Đường DEF, Quận 3, TP.HCM",
        googleMapsUrl: "https://maps.google.com/"
      }
    }
  ],
  invitationText: {
    opening: "Trân trọng kính mời",
    closing: "Sự hiện diện của quý khách là niềm vinh hạnh cho gia đình chúng tôi. Trân trọng cảm ơn!"
  }
};
