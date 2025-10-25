import Phaser from 'phaser';

export const gameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#87CEEB',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 800 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  render: {
    pixelArt: true,
    antialias: false
  }
};

// Game constants
export const GAME_CONSTANTS = {
  PLAYER_SPEED: 200,
  PLAYER_JUMP: 400,
  ITEM_SCORES: {
    tien: 10,    // Tiền - coins
    tin: 20,     // Nhà tin
    nha: 50,     // Nhà
    xe: 30,      // Xe
    soDo: 100,   // Sổ đỏ
    vang: 200    // Vàng
  },
  COMPLETION_BONUS: 500,
  TIME_BONUS_PER_SECOND: 2
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
