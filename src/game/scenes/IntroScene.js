import Phaser from 'phaser';
import { WEDDING_INFO } from '../../config/game.js';

export default class IntroScene extends Phaser.Scene {
  constructor() {
    super({ key: 'IntroScene' });
  }

  preload() {
    // Preload assets here if needed
  }

  create() {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    // Auto fullscreen
    this.scale.startFullscreen();

    // Background
    this.add.rectangle(0, 0, width, height, 0xff6b9d).setOrigin(0);

    // Title
    const title = this.add.text(centerX, centerY - 200, 'THIỆP MỜI CƯỚI', {
      fontSize: '48px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);

    // Couple names
    const coupleText = `${WEDDING_INFO.groom.firstName} ❤️ ${WEDDING_INFO.bride.firstName}`;
    const couple = this.add.text(centerX, centerY - 120, coupleText, {
      fontSize: '36px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(centerX, centerY - 50,
      'Chơi game để nhận quà!\nHoàn thành với điểm cao nhất', {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 10
    }).setOrigin(0.5);

    // Start Game Button
    const startButton = this.createButton(
      centerX,
      centerY + 50,
      'BẮT ĐẦU CHƠI',
      () => this.scene.start('GameScene')
    );

    // Skip to Info Button
    const skipButton = this.createButton(
      centerX,
      centerY + 140,
      'XEM THÔNG TIN ĐÁM CƯỚI',
      () => this.scene.start('WeddingInfoScene'),
      0x9370db
    );

    // Controls instruction
    const isMobile = /mobile|android|iphone|ipad/i.test(navigator.userAgent);
    const controlsText = isMobile
      ? 'Sử dụng các nút trên màn hình để điều khiển'
      : 'Phím mũi tên: Di chuyển | Phím Space: Nhảy';

    this.add.text(centerX, height - 60, controlsText, {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    // Settings toggle (High contrast, mute, etc.)
    this.add.text(centerX, height - 30, 'Settings: Âm thanh | Độ tương phản', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#cccccc',
      align: 'center'
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => {
      // TODO: Implement settings panel
      console.log('Settings clicked');
    });

    // Animate title
    this.tweens.add({
      targets: title,
      scale: { from: 0.8, to: 1 },
      duration: 1000,
      ease: 'Back.easeOut',
      yoyo: false
    });
  }

  createButton(x, y, text, onClick, color = 0x4CAF50) {
    const button = this.add.container(x, y);

    // Button background
    const bg = this.add.rectangle(0, 0, 320, 56, color, 1)
      .setStrokeStyle(3, 0xffffff);

    // Button text
    const buttonText = this.add.text(0, 0, text, {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);

    button.add([bg, buttonText]);
    button.setSize(320, 56);
    button.setInteractive({ useHandCursor: true });

    // Hover effect
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
