import Phaser from 'phaser';
import { WEDDING_INFO } from '../../config/game.js';
import { getLeaderboard } from '../../services/leaderboard.js';
import { releaseLandscapeOrientation } from '../../services/orientation.js';

export default class WeddingInfoScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WeddingInfoScene' });
  }

  init(data) {
    this.playerScore = data.score || 0;
    this.playerName = data.playerName || '';
  }

  async create() {
    const { width, height } = this.scale;

    releaseLandscapeOrientation();

    // Auto fullscreen
    this.scale.startFullscreen();

    // Scrollable container
    this.cameras.main.setBounds(0, 0, width, height * 3);

    // Background
    this.add.rectangle(0, 0, width, height * 3, 0xffe4e1).setOrigin(0);

    let yPos = 50;

    // Title
    this.add.text(width / 2, yPos, 'THIỆP MỜI CƯỚI', {
      fontSize: '42px',
      fontFamily: 'Arial',
      color: '#d63384',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);

    yPos += 80;

    // Couple names
    const groomName = WEDDING_INFO.groom.fullName;
    const brideName = WEDDING_INFO.bride.fullName;

    this.add.text(width / 2, yPos, `${groomName} ♥ ${brideName}`, {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#d63384',
      align: 'center'
    }).setOrigin(0.5);

    yPos += 80;

    // Countdown (placeholder - requires actual wedding date)
    const weddingDate = new Date(WEDDING_INFO.events[0].date + 'T' + WEDDING_INFO.events[0].time);
    const daysUntil = Math.ceil((weddingDate - new Date()) / (1000 * 60 * 60 * 24));

    if (daysUntil > 0) {
      this.add.text(width / 2, yPos, `Còn ${daysUntil} ngày nữa!`, {
        fontSize: '28px',
        fontFamily: 'Arial',
        color: '#d63384',
        align: 'center'
      }).setOrigin(0.5);
      yPos += 60;
    } else {
      this.add.text(width / 2, yPos, 'Hôm nay là ngày trọng đại!', {
        fontSize: '28px',
        fontFamily: 'Arial',
        color: '#d63384',
        align: 'center'
      }).setOrigin(0.5);
      yPos += 60;
    }

    // Opening text
    this.add.text(width / 2, yPos, WEDDING_INFO.invitationText.opening, {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#000000',
      align: 'center'
    }).setOrigin(0.5);

    yPos += 60;

    // Family info
    this.add.text(width / 2, yPos, 'NHÀ TRAI', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#d63384',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    yPos += 40;

    this.add.text(width / 2, yPos,
      `Ông: ${WEDDING_INFO.groom.father}\nBà: ${WEDDING_INFO.groom.mother}\n\nTrân trọng kính mời\nđến dự tiệc cưới của con trai\n\n${groomName}`,
      {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#000000',
        align: 'center',
        lineSpacing: 8
      }
    ).setOrigin(0.5);

    yPos += 220;

    this.add.text(width / 2, yPos, 'NHÀ GÁI', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#d63384',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    yPos += 40;

    this.add.text(width / 2, yPos,
      `Ông: ${WEDDING_INFO.bride.father}\nBà: ${WEDDING_INFO.bride.mother}\n\nTrân trọng kính mời\nđến dự tiệc cưới của con gái\n\n${brideName}`,
      {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#000000',
        align: 'center',
        lineSpacing: 8
      }
    ).setOrigin(0.5);

    yPos += 240;

    // Event details
    const event = WEDDING_INFO.events[0];

    this.add.text(width / 2, yPos, '💒 LỄ THÀNH HÔN & TIỆC CƯỚI', {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#d63384',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    yPos += 50;

    this.add.text(width / 2, yPos,
      `🗓️ Thời gian: ${event.time} - ${new Date(event.date).toLocaleDateString('vi-VN')}\n\n` +
      `📍 Địa điểm: ${event.location.name}\n${event.location.address}\n\n` +
      `📞 Liên hệ:\nChú rể: ${WEDDING_INFO.groom.phone}\nCô dâu: ${WEDDING_INFO.bride.phone}`,
      {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#000000',
        align: 'center',
        lineSpacing: 10
      }
    ).setOrigin(0.5);

    yPos += 280;

    // Prize announcement
    if (this.playerScore > 0) {
      this.add.text(width / 2, yPos,
        `🎁 Bạn đã đạt ${this.playerScore} điểm!\nChúc mừng ${this.playerName}!`,
        {
          fontSize: '20px',
          fontFamily: 'Arial',
          color: '#28a745',
          fontStyle: 'bold',
          align: 'center',
          backgroundColor: '#d4edda',
          padding: { x: 20, y: 10 }
        }
      ).setOrigin(0.5);
      yPos += 100;
    }

    this.add.text(width / 2, yPos,
      '🏆 NGƯỜI CHƠI CAO ĐIỂM NHẤT SẼ NHẬN QUÀ ĐẶC BIỆT!',
      {
        fontSize: '20px',
        fontFamily: 'Arial',
        color: '#d63384',
        fontStyle: 'bold',
        align: 'center'
      }
    ).setOrigin(0.5);

    yPos += 80;

    // Leaderboard
    this.add.text(width / 2, yPos, '🏆 BẢNG XẾP HẠNG TOP 10', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#d63384',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    yPos += 50;

    // Fetch and display leaderboard
    try {
      const leaderboard = await getLeaderboard('all', 10);
      leaderboard.forEach((player, index) => {
        const rank = index + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;

        this.add.text(width / 2, yPos,
          `${medal} ${player.name} - ${player.score} điểm (${player.time}s)`,
          {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#000000',
            align: 'center',
            backgroundColor: rank <= 3 ? '#fff3cd' : 'transparent',
            padding: { x: 10, y: 5 }
          }
        ).setOrigin(0.5);
        yPos += 40;
      });
    } catch (error) {
      this.add.text(width / 2, yPos, 'Không thể tải bảng xếp hạng', {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: '#666666'
      }).setOrigin(0.5);
      yPos += 40;
    }

    yPos += 40;

    // Closing text
    this.add.text(width / 2, yPos, WEDDING_INFO.invitationText.closing, {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#000000',
      align: 'center',
      wordWrap: { width: width - 100 }
    }).setOrigin(0.5);

    yPos += 100;

    // Action buttons
    const playAgainBtn = this.createButton(
      width / 2,
      yPos,
      '🔄 CHƠI LẠI',
      () => this.scene.start('GameScene')
    );

    yPos += 80;

    const backBtn = this.createButton(
      width / 2,
      yPos,
      '🏠 VỀ TRANG CHỦ',
      () => this.scene.start('IntroScene'),
      0x6c757d
    );

    // Enable scrolling
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      this.cameras.main.scrollY += deltaY * 0.3;
      this.cameras.main.scrollY = Phaser.Math.Clamp(this.cameras.main.scrollY, 0, height * 2);
    });

    // Touch scroll
    this.input.on('pointermove', (pointer) => {
      if (pointer.isDown) {
        this.cameras.main.scrollY -= pointer.velocity.y * 0.5;
        this.cameras.main.scrollY = Phaser.Math.Clamp(this.cameras.main.scrollY, 0, height * 2);
      }
    });
  }

  createButton(x, y, text, onClick, color = 0x4CAF50) {
    const button = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 280, 56, color, 1)
      .setStrokeStyle(3, 0xffffff);

    const buttonText = this.add.text(0, 0, text, {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    button.add([bg, buttonText]);
    button.setSize(280, 56);
    button.setInteractive({ useHandCursor: true });

    button.on('pointerover', () => {
      bg.setFillStyle(color, 0.8);
      button.setScale(1.05);
    });

    button.on('pointerout', () => {
      bg.setFillStyle(color, 1);
      button.setScale(1);
    });

    button.on('pointerdown', () => {
      button.setScale(0.95);
    });

    button.on('pointerup', () => {
      button.setScale(1);
      if (onClick) onClick();
    });

    return button;
  }
}
