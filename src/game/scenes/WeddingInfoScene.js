import Phaser from 'phaser';
import { WEDDING_INFO } from '../../config/game.js';
import { getLeaderboard } from '../../services/leaderboard.js';
import { releaseLandscapeOrientation } from '../../services/orientation.js';

export default class WeddingInfoScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WeddingInfoScene' });
    this.currentPage = 0;
    this.totalPages = 6;
    this.pages = [];
    this.isAnimating = false;
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

    // Romantic gradient background
    this.createGradientBackground(width, height);

    // Create book pages
    await this.createPages(width, height);

    // Create navigation
    this.createNavigation(width, height);

    // Setup swipe gestures
    this.setupSwipeGestures();

    // Show first page
    this.showPage(0);
  }

  async createPages(width, height) {
    const groomName = WEDDING_INFO.groom.fullName;
    const brideName = WEDDING_INFO.bride.fullName;
    const event = WEDDING_INFO.events[0];
    const weddingDate = new Date(event.date + 'T' + event.time);
    const daysUntil = Math.ceil((weddingDate - new Date()) / (1000 * 60 * 60 * 24));

    // Page 0: Cover page
    this.pages[0] = this.createCoverPage(width, height, groomName, brideName, daysUntil);

    // Page 1: Groom's family
    this.pages[1] = this.createGroomPage(width, height, groomName);

    // Page 2: Bride's family
    this.pages[2] = this.createBridePage(width, height, brideName);

    // Page 3: Event details
    this.pages[3] = this.createEventPage(width, height, event);

    // Page 4: Leaderboard
    this.pages[4] = await this.createLeaderboardPage(width, height);

    // Page 5: Closing & Actions
    this.pages[5] = this.createClosingPage(width, height);

    // Initially hide all pages except first
    this.pages.forEach((page, index) => {
      if (index > 0) {
        page.setVisible(false);
      }
    });
  }

  createCoverPage(width, height, groomName, brideName, daysUntil) {
    const page = this.add.container(0, 0);
    const bookPage = this.createBookPage(width, height);
    page.add(bookPage);

    let yPos = height * 0.25;

    // Decorative top
    const topDecor = this.createDecorativeLine(width / 2, yPos - 30, width * 0.6);
    page.add(topDecor);

    // Title
    const title = this.add.text(width / 2, yPos, '✿ THIỆP MỜI CƯỚI ✿', {
      fontSize: '48px',
      fontFamily: 'Georgia, serif',
      color: '#c94b7c',
      fontStyle: 'italic bold',
      align: 'center',
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#00000020',
        blur: 4,
        fill: true
      }
    }).setOrigin(0.5);
    page.add(title);

    yPos += 100;

    // Groom name
    const groomText = this.add.text(width / 2, yPos, groomName, {
      fontSize: '36px',
      fontFamily: 'Georgia, serif',
      color: '#2c5f8d',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);
    page.add(groomText);

    yPos += 50;

    // Heart
    const heart = this.add.text(width / 2, yPos, '♥', {
      fontSize: '40px',
      color: '#ff6b9d'
    }).setOrigin(0.5);
    page.add(heart);

    yPos += 50;

    // Bride name
    const brideText = this.add.text(width / 2, yPos, brideName, {
      fontSize: '36px',
      fontFamily: 'Georgia, serif',
      color: '#c94b7c',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);
    page.add(brideText);

    yPos += 80;

    // Countdown
    const countdownText = daysUntil > 0
      ? `⏰ Còn ${daysUntil} ngày nữa! ⏰`
      : '🎉 Hôm nay là ngày trọng đại! 🎉';

    const countdown = this.add.text(width / 2, yPos, countdownText, {
      fontSize: '28px',
      fontFamily: 'Georgia, serif',
      color: '#ff6b9d',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);
    page.add(countdown);

    yPos += 70;

    // Opening text
    const opening = this.add.text(width / 2, yPos, WEDDING_INFO.invitationText.opening, {
      fontSize: '20px',
      fontFamily: 'Georgia, serif',
      color: '#4a4a4a',
      align: 'center',
      fontStyle: 'italic',
      wordWrap: { width: width * 0.75 }
    }).setOrigin(0.5);
    page.add(opening);

    // Bottom decoration
    const bottomDecor = this.createDecorativeLine(width / 2, height - 100, width * 0.5);
    page.add(bottomDecor);

    return page;
  }

  createGroomPage(width, height, groomName) {
    const page = this.add.container(0, 0);
    const bookPage = this.createBookPage(width, height);
    page.add(bookPage);

    let yPos = height * 0.2;

    // Title
    const title = this.add.text(width / 2, yPos, '✦ NHÀ TRAI ✦', {
      fontSize: '36px',
      fontFamily: 'Georgia, serif',
      color: '#2c5f8d',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    page.add(title);

    yPos += 70;

    // Decorative line
    const decor1 = this.createDecorativeLine(width / 2, yPos, width * 0.6);
    page.add(decor1);

    yPos += 60;

    // Parents
    const parents = this.add.text(width / 2, yPos,
      `Ông: ${WEDDING_INFO.groom.father}\nBà: ${WEDDING_INFO.groom.mother}`,
      {
        fontSize: '22px',
        fontFamily: 'Georgia, serif',
        color: '#555555',
        align: 'center',
        lineSpacing: 15
      }
    ).setOrigin(0.5);
    page.add(parents);

    yPos += 100;

    // Invitation text
    const invite1 = this.add.text(width / 2, yPos, 'Trân trọng kính mời', {
      fontSize: '20px',
      fontFamily: 'Georgia, serif',
      color: '#666666',
      fontStyle: 'italic'
    }).setOrigin(0.5);
    page.add(invite1);

    yPos += 40;

    const invite2 = this.add.text(width / 2, yPos, 'đến dự tiệc cưới của con trai', {
      fontSize: '20px',
      fontFamily: 'Georgia, serif',
      color: '#666666',
      fontStyle: 'italic'
    }).setOrigin(0.5);
    page.add(invite2);

    yPos += 60;

    // Groom name highlighted
    const groom = this.add.text(width / 2, yPos, groomName, {
      fontSize: '32px',
      fontFamily: 'Georgia, serif',
      color: '#2c5f8d',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    page.add(groom);

    // Bottom decoration
    const bottomDecor = this.createDecorativeLine(width / 2, height - 100, width * 0.5);
    page.add(bottomDecor);

    return page;
  }

  createBridePage(width, height, brideName) {
    const page = this.add.container(0, 0);
    const bookPage = this.createBookPage(width, height);
    page.add(bookPage);

    let yPos = height * 0.2;

    // Title
    const title = this.add.text(width / 2, yPos, '✦ NHÀ GÁI ✦', {
      fontSize: '36px',
      fontFamily: 'Georgia, serif',
      color: '#c94b7c',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    page.add(title);

    yPos += 70;

    // Decorative line
    const decor1 = this.createDecorativeLine(width / 2, yPos, width * 0.6);
    page.add(decor1);

    yPos += 60;

    // Parents
    const parents = this.add.text(width / 2, yPos,
      `Ông: ${WEDDING_INFO.bride.father}\nBà: ${WEDDING_INFO.bride.mother}`,
      {
        fontSize: '22px',
        fontFamily: 'Georgia, serif',
        color: '#555555',
        align: 'center',
        lineSpacing: 15
      }
    ).setOrigin(0.5);
    page.add(parents);

    yPos += 100;

    // Invitation text
    const invite1 = this.add.text(width / 2, yPos, 'Trân trọng kính mời', {
      fontSize: '20px',
      fontFamily: 'Georgia, serif',
      color: '#666666',
      fontStyle: 'italic'
    }).setOrigin(0.5);
    page.add(invite1);

    yPos += 40;

    const invite2 = this.add.text(width / 2, yPos, 'đến dự tiệc cưới của con gái', {
      fontSize: '20px',
      fontFamily: 'Georgia, serif',
      color: '#666666',
      fontStyle: 'italic'
    }).setOrigin(0.5);
    page.add(invite2);

    yPos += 60;

    // Bride name highlighted
    const bride = this.add.text(width / 2, yPos, brideName, {
      fontSize: '32px',
      fontFamily: 'Georgia, serif',
      color: '#c94b7c',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    page.add(bride);

    // Bottom decoration
    const bottomDecor = this.createDecorativeLine(width / 2, height - 100, width * 0.5);
    page.add(bottomDecor);

    return page;
  }

  createEventPage(width, height, event) {
    const page = this.add.container(0, 0);
    const bookPage = this.createBookPage(width, height);
    page.add(bookPage);

    let yPos = height * 0.15;

    // Title
    const title = this.add.text(width / 2, yPos, '💒 LỄ THÀNH HÔN', {
      fontSize: '36px',
      fontFamily: 'Georgia, serif',
      color: '#c94b7c',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    page.add(title);

    yPos += 50;

    const subtitle = this.add.text(width / 2, yPos, '& TIỆC CƯỚI 💒', {
      fontSize: '32px',
      fontFamily: 'Georgia, serif',
      color: '#c94b7c',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    page.add(subtitle);

    yPos += 70;

    // Time section
    const timeLabel = this.add.text(width / 2, yPos, '🗓️ Thời gian', {
      fontSize: '24px',
      fontFamily: 'Georgia, serif',
      color: '#2c5f8d',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    page.add(timeLabel);

    yPos += 40;

    const timeValue = this.add.text(width / 2, yPos,
      `${event.time} - ${new Date(event.date).toLocaleDateString('vi-VN')}`, {
      fontSize: '20px',
      fontFamily: 'Georgia, serif',
      color: '#555555'
    }).setOrigin(0.5);
    page.add(timeValue);

    yPos += 60;

    // Location section
    const locationLabel = this.add.text(width / 2, yPos, '📍 Địa điểm', {
      fontSize: '24px',
      fontFamily: 'Georgia, serif',
      color: '#2c5f8d',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    page.add(locationLabel);

    yPos += 40;

    const locationName = this.add.text(width / 2, yPos, event.location.name, {
      fontSize: '20px',
      fontFamily: 'Georgia, serif',
      color: '#555555',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    page.add(locationName);

    yPos += 35;

    const locationAddress = this.add.text(width / 2, yPos, event.location.address, {
      fontSize: '18px',
      fontFamily: 'Georgia, serif',
      color: '#777777',
      align: 'center',
      wordWrap: { width: width * 0.8 }
    }).setOrigin(0.5);
    page.add(locationAddress);

    yPos += 60;

    // Contact section
    const contactLabel = this.add.text(width / 2, yPos, '📞 Liên hệ', {
      fontSize: '24px',
      fontFamily: 'Georgia, serif',
      color: '#2c5f8d',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    page.add(contactLabel);

    yPos += 40;

    const contacts = this.add.text(width / 2, yPos,
      `Chú rể: ${WEDDING_INFO.groom.phone}\nCô dâu: ${WEDDING_INFO.bride.phone}`,
      {
        fontSize: '19px',
        fontFamily: 'Georgia, serif',
        color: '#555555',
        align: 'center',
        lineSpacing: 10
      }
    ).setOrigin(0.5);
    page.add(contacts);

    // Bottom decoration
    const bottomDecor = this.createDecorativeLine(width / 2, height - 100, width * 0.5);
    page.add(bottomDecor);

    return page;
  }

  async createLeaderboardPage(width, height) {
    const page = this.add.container(0, 0);
    const bookPage = this.createBookPage(width, height);
    page.add(bookPage);

    let yPos = height * 0.12;

    // Title
    const title = this.add.text(width / 2, yPos, '🏆 BẢNG XẾP HẠNG 🏆', {
      fontSize: '32px',
      fontFamily: 'Georgia, serif',
      color: '#c94b7c',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    page.add(title);

    yPos += 60;

    // Prize announcement
    if (this.playerScore > 0) {
      const scoreText = this.add.text(width / 2, yPos,
        `🎁 ${this.playerName}: ${this.playerScore} điểm! 🎉`,
        {
          fontSize: '20px',
          fontFamily: 'Georgia, serif',
          color: '#155724',
          fontStyle: 'bold',
          align: 'center'
        }
      ).setOrigin(0.5);
      page.add(scoreText);
      yPos += 50;
    }

    const prizeText = this.add.text(width / 2, yPos,
      '🏆 CAO ĐIỂM NHẤT NHẬN QUÀ! 🎁',
      {
        fontSize: '18px',
        fontFamily: 'Georgia, serif',
        color: '#856404',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    page.add(prizeText);

    yPos += 50;

    // Leaderboard
    try {
      const leaderboard = await getLeaderboard('all', 10);

      leaderboard.forEach((player, index) => {
        const rank = index + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;

        const entry = this.add.text(width / 2, yPos,
          `${medal} ${player.name} - ${player.score}đ (${player.time}s)`,
          {
            fontSize: rank <= 3 ? '18px' : '16px',
            fontFamily: 'Georgia, serif',
            color: rank <= 3 ? '#2c3e50' : '#555555',
            fontStyle: rank <= 3 ? 'bold' : 'normal',
            align: 'center'
          }
        ).setOrigin(0.5);
        page.add(entry);
        yPos += rank <= 3 ? 38 : 35;
      });
    } catch (error) {
      const errorText = this.add.text(width / 2, yPos, 'Không thể tải bảng xếp hạng', {
        fontSize: '16px',
        fontFamily: 'Georgia, serif',
        color: '#999999',
        fontStyle: 'italic'
      }).setOrigin(0.5);
      page.add(errorText);
    }

    // Bottom decoration
    const bottomDecor = this.createDecorativeLine(width / 2, height - 100, width * 0.5);
    page.add(bottomDecor);

    return page;
  }

  createClosingPage(width, height) {
    const page = this.add.container(0, 0);
    const bookPage = this.createBookPage(width, height);
    page.add(bookPage);

    let yPos = height * 0.25;

    // Decorative top
    const topDecor = this.createDecorativeLine(width / 2, yPos - 30, width * 0.6);
    page.add(topDecor);

    // Closing text
    const closing = this.add.text(width / 2, yPos, WEDDING_INFO.invitationText.closing, {
      fontSize: '22px',
      fontFamily: 'Georgia, serif',
      color: '#555555',
      align: 'center',
      fontStyle: 'italic',
      wordWrap: { width: width * 0.75 }
    }).setOrigin(0.5);
    page.add(closing);

    yPos += 120;

    // Action buttons
    const playAgainBtn = this.createButton(
      width / 2,
      yPos,
      '🔄 CHƠI LẠI',
      () => this.scene.start('GameScene'),
      0xff6b9d
    );
    page.add(playAgainBtn);

    yPos += 80;

    const backBtn = this.createButton(
      width / 2,
      yPos,
      '🏠 VỀ TRANG CHỦ',
      () => this.scene.start('IntroScene'),
      0x6c757d
    );
    page.add(backBtn);

    // Bottom decoration
    const bottomDecor = this.createDecorativeLine(width / 2, height - 100, width * 0.6);
    page.add(bottomDecor);

    return page;
  }

  createBookPage(width, height) {
    const container = this.add.container(0, 0);

    // Page shadow
    const shadow = this.add.rectangle(width / 2 + 5, height / 2 + 5,
      width * 0.9, height * 0.85, 0x000000, 0.15)
      .setOrigin(0.5);
    container.add(shadow);

    // Page background
    const bg = this.add.rectangle(width / 2, height / 2,
      width * 0.9, height * 0.85, 0xfffffaf, 1)
      .setOrigin(0.5)
      .setStrokeStyle(3, 0xd4af37, 0.6);
    container.add(bg);

    // Inner border decoration
    const innerBorder = this.add.rectangle(width / 2, height / 2,
      width * 0.85, height * 0.8, 0xffffff, 0)
      .setOrigin(0.5)
      .setStrokeStyle(2, 0xe8c4d8, 0.4);
    container.add(innerBorder);

    return container;
  }

  createNavigation(width, height) {
    // Left button (previous page)
    this.leftBtn = this.add.text(30, height / 2, '◀', {
      fontSize: '48px',
      color: '#c94b7c',
      fontStyle: 'bold'
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.previousPage())
      .setAlpha(0.5);

    // Right button (next page)
    this.rightBtn = this.add.text(width - 30, height / 2, '▶', {
      fontSize: '48px',
      color: '#c94b7c',
      fontStyle: 'bold'
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.nextPage())
      .setAlpha(0.7);

    // Page indicator
    this.pageIndicator = this.add.text(width / 2, height - 30, '', {
      fontSize: '16px',
      fontFamily: 'Georgia, serif',
      color: '#999999',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    this.updateNavigation();
  }

  setupSwipeGestures() {
    let startX = 0;
    let startY = 0;

    this.input.on('pointerdown', (pointer) => {
      startX = pointer.x;
      startY = pointer.y;
    });

    this.input.on('pointerup', (pointer) => {
      const deltaX = pointer.x - startX;
      const deltaY = pointer.y - startY;

      // Check if it's a horizontal swipe (not vertical scroll)
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          // Swipe right - previous page
          this.previousPage();
        } else {
          // Swipe left - next page
          this.nextPage();
        }
      }
    });
  }

  nextPage() {
    if (this.isAnimating || this.currentPage >= this.totalPages - 1) return;

    this.isAnimating = true;
    const oldPage = this.currentPage;
    this.currentPage++;

    this.animatePageFlip(oldPage, this.currentPage, true);
  }

  previousPage() {
    if (this.isAnimating || this.currentPage <= 0) return;

    this.isAnimating = true;
    const oldPage = this.currentPage;
    this.currentPage--;

    this.animatePageFlip(oldPage, this.currentPage, false);
  }

  animatePageFlip(fromPage, toPage, forward) {
    const currentPageObj = this.pages[fromPage];
    const nextPageObj = this.pages[toPage];

    // Make next page visible but behind
    nextPageObj.setVisible(true);
    nextPageObj.setAlpha(0);

    const duration = 600;

    if (forward) {
      // Flip forward animation
      this.tweens.add({
        targets: currentPageObj,
        scaleX: 0,
        duration: duration / 2,
        ease: 'Power2',
        onComplete: () => {
          currentPageObj.setVisible(false);
          currentPageObj.setScale(1);

          nextPageObj.setScaleX(0);
          nextPageObj.setAlpha(1);

          this.tweens.add({
            targets: nextPageObj,
            scaleX: 1,
            duration: duration / 2,
            ease: 'Power2',
            onComplete: () => {
              this.isAnimating = false;
              this.updateNavigation();
            }
          });
        }
      });
    } else {
      // Flip backward animation
      this.tweens.add({
        targets: currentPageObj,
        scaleX: 0,
        duration: duration / 2,
        ease: 'Power2',
        onComplete: () => {
          currentPageObj.setVisible(false);
          currentPageObj.setScale(1);

          nextPageObj.setScaleX(0);
          nextPageObj.setAlpha(1);

          this.tweens.add({
            targets: nextPageObj,
            scaleX: 1,
            duration: duration / 2,
            ease: 'Power2',
            onComplete: () => {
              this.isAnimating = false;
              this.updateNavigation();
            }
          });
        }
      });
    }
  }

  showPage(index) {
    this.pages.forEach((page, i) => {
      page.setVisible(i === index);
    });
    this.currentPage = index;
    this.updateNavigation();
  }

  updateNavigation() {
    // Update button visibility
    this.leftBtn.setAlpha(this.currentPage > 0 ? 0.7 : 0.3);
    this.rightBtn.setAlpha(this.currentPage < this.totalPages - 1 ? 0.7 : 0.3);

    // Update page indicator
    this.pageIndicator.setText(`Trang ${this.currentPage + 1} / ${this.totalPages}`);
  }

  createGradientBackground(width, height) {
    // Create a beautiful gradient background
    const graphics = this.add.graphics();

    // Create romantic gradient from pink to lavender
    for (let i = 0; i < height; i++) {
      const progress = i / height;
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(0xfff5f7),
        Phaser.Display.Color.ValueToColor(0xf8e8ff),
        height,
        i
      );
      graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
      graphics.fillRect(0, i, width, 1);
    }

    // Add subtle pattern sparkles
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.Between(1, 3);
      graphics.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.2, 0.5));
      graphics.fillCircle(x, y, size);
    }
  }

  createCard(x, y, cardWidth, cardHeight, bgColor = 0xffffff, alpha = 0.9) {
    const card = this.add.container(x, y);

    // Card background with shadow effect
    const shadow = this.add.rectangle(3, 3, cardWidth, cardHeight, 0x000000, 0.1)
      .setOrigin(0.5);

    const bg = this.add.rectangle(0, 0, cardWidth, cardHeight, bgColor, alpha)
      .setOrigin(0.5)
      .setStrokeStyle(2, 0xe8c4d8, 0.5);

    // Add subtle inner glow
    const innerGlow = this.add.rectangle(0, 0, cardWidth - 4, cardHeight - 4, 0xffffff, 0.2)
      .setOrigin(0.5);

    card.add([shadow, bg, innerGlow]);

    return card;
  }

  createDecorativeLine(x, y, lineWidth) {
    const graphics = this.add.graphics();

    // Main line
    graphics.lineStyle(2, 0xe8c4d8, 1);
    graphics.lineBetween(x - lineWidth / 2, y, x + lineWidth / 2, y);

    // Decorative dots at the ends
    graphics.fillStyle(0xc94b7c, 1);
    graphics.fillCircle(x - lineWidth / 2, y, 4);
    graphics.fillCircle(x + lineWidth / 2, y, 4);

    // Center ornament
    graphics.fillCircle(x, y, 5);
    graphics.fillStyle(0xff6b9d, 1);
    graphics.fillCircle(x, y, 3);

    return graphics;
  }

  createButton(x, y, text, onClick, color = 0x4CAF50) {
    const button = this.add.container(x, y);

    // Shadow
    const shadow = this.add.rectangle(3, 3, 300, 60, 0x000000, 0.2)
      .setOrigin(0.5);

    // Background with gradient effect
    const bg = this.add.rectangle(0, 0, 300, 60, color, 1)
      .setOrigin(0.5)
      .setStrokeStyle(3, 0xffffff, 0.8);

    // Inner highlight for depth
    const highlight = this.add.rectangle(0, -1, 290, 30, 0xffffff, 0.2)
      .setOrigin(0.5, 0);

    const buttonText = this.add.text(0, 0, text, {
      fontSize: '20px',
      fontFamily: 'Georgia, serif',
      color: '#ffffff',
      fontStyle: 'bold',
      shadow: {
        offsetX: 1,
        offsetY: 1,
        color: '#00000050',
        blur: 2,
        fill: true
      }
    }).setOrigin(0.5);

    button.add([shadow, bg, highlight, buttonText]);
    button.setSize(300, 60);
    button.setInteractive({ useHandCursor: true });

    // Hover effects
    button.on('pointerover', () => {
      this.tweens.add({
        targets: button,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 150,
        ease: 'Back.easeOut'
      });
      bg.setFillStyle(color, 0.9);
    });

    button.on('pointerout', () => {
      this.tweens.add({
        targets: button,
        scaleX: 1,
        scaleY: 1,
        duration: 150,
        ease: 'Back.easeIn'
      });
      bg.setFillStyle(color, 1);
    });

    button.on('pointerdown', () => {
      this.tweens.add({
        targets: button,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        ease: 'Power2'
      });
    });

    button.on('pointerup', () => {
      this.tweens.add({
        targets: button,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: 'Power2',
        onComplete: () => {
          if (onClick) onClick();
        }
      });
    });

    return button;
  }
}
