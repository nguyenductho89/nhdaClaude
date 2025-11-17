import Phaser from 'phaser';

// Detect if mobile device
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  || window.innerWidth < 768;

export const gameConfig = {
  type: Phaser.WEBGL, // Force WebGL for better rendering quality
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#87CEEB',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 }, // Set to 0, we'll use per-object gravity
      debug: false
    }
  },
  scale: {
    mode: isMobile ? Phaser.Scale.NONE : Phaser.Scale.FIT,
    autoCenter: isMobile ? Phaser.Scale.NO_CENTER : Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    fullscreenTarget: 'game-container',
    expandParent: true,
    // High DPI support for sharp rendering on Retina/mobile displays
    resolution: window.devicePixelRatio || 1,
    // iOS specific scale settings
    min: {
      width: 320,
      height: 480
    },
    max: {
      width: window.innerWidth * 2,
      height: window.innerHeight * 2
    }
  },
  render: {
    pixelArt: false,
    antialias: true,
    roundPixels: false // Changed to false for sharper text
  }
};

// Game constants for Endless Runner
export const GAME_CONSTANTS = {
  // Auto-run speed settings - FASTER AND HARDER
  INITIAL_SCROLL_SPEED: 500,  // px/s - starting speed (was 300)
  MAX_SCROLL_SPEED: 1000,      // px/s - maximum speed (was 600)
  SPEED_INCREMENT: 50,         // px/s - speed increase every 20 seconds (was 30)
  SPEED_INCREMENT_INTERVAL: 20000, // ms - 20 seconds (was 30000)

  // Jump mechanics - faster and snappier
  JUMP_VELOCITY_HIGH: -600,    // Stronger jump for faster gameplay (was -500)
  GRAVITY: 1200,               // Stronger gravity for snappier feel (was 1000)

  // Game duration
  GAME_DURATION: 120000,       // ms - 2 minutes
  SAFE_PERIOD_START: 3000,     // ms - shorter safe period (was 5000)
  SAFE_PERIOD_INTERVAL: 45000, // ms - safe period every 45 seconds
  SAFE_PERIOD_DURATION: 2000,  // ms - 2 second safe zone (was 3000)

  // Scoring system
  DISTANCE_SCORE_MULTIPLIER: 1.5, // 1.5 point per meter (was 1)
  ITEM_SCORES: {
    tien: 10,      // Tiền - coins
    tin: 50,       // Hạnh phúc
    nha: 100,      // Nhà
    xe: 150,       // Xe (+ invincibility)
    vang: 300      // Vàng (+ 2x multiplier)
  },
  COMBO_THRESHOLD: 5,          // 5+ items for combo
  COMBO_BONUS: 50,             // Bonus for combo
  SURVIVAL_BONUS: 10,          // Per 10 seconds survived
  PERFECT_RUN_BONUS: 1000,     // No collision + complete 2 min
  MULTIPLIER_COMBO: 1.5,       // Multiplier during combo
  MULTIPLIER_GOLD: 2,          // Multiplier from gold item

  // Obstacle spawning - MORE FREQUENT, HARDER
  OBSTACLE_MIN_GAP: 1000,      // ms - minimum time between obstacles (was 1500)
  OBSTACLE_MAX_GAP: 2200,      // ms - maximum time between obstacles (was 3000)
  OBSTACLE_DENSITY_INCREASE: 250, // ms - reduce gap over time (was 200)

  // Collectible spawning
  COLLECTIBLE_SPAWN_INTERVAL: 1800, // ms - spawn more frequently (was 2000)
  COLLECTIBLE_RARE_CHANCE: 0.3,     // 30% chance for rare items

  // Power-ups
  INVINCIBILITY_DURATION: 5000,  // ms - from xe item
  MULTIPLIER_DURATION: 10000,    // ms - from vang item

  // Parallax layers speed - FASTER for dynamic feel
  PARALLAX_SKY: 0,          // Static
  PARALLAX_CLOUDS: 0.3,     // Faster clouds (was 0.2)
  PARALLAX_MOUNTAINS: 0.6,  // Faster mountains (was 0.5)
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
