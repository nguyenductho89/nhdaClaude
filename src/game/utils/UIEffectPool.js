/**
 * UIEffectPool
 * Object pooling for UI effects (collect animations, notifications, etc.)
 */
export class UIEffectPool {
  constructor(scene, maxSize = 20) {
    this.scene = scene;
    this.maxSize = maxSize;
    this.pools = {
      collectCircle: [],
      floatingText: [],
      notification: []
    };
  }

  /**
   * Get or create a collect circle effect
   */
  getCollectCircle() {
    let circle = this.pools.collectCircle.find(c => !c.active);

    if (!circle) {
      // Create new if pool is empty or not full
      if (this.pools.collectCircle.length < this.maxSize) {
        circle = this.scene.add.circle(0, 0, 20, 0xFFFFFF, 0.8);
        circle.setDepth(150);
        this.pools.collectCircle.push(circle);
      } else {
        // Reuse oldest
        circle = this.pools.collectCircle[0];
      }
    }

    circle.setActive(true);
    circle.setVisible(true);
    circle.setAlpha(0.8);
    circle.setScale(1);

    return circle;
  }

  /**
   * Return collect circle to pool
   */
  releaseCollectCircle(circle) {
    circle.setActive(false);
    circle.setVisible(false);
    // Stop any tweens
    this.scene.tweens.killTweensOf(circle);
  }

  /**
   * Get or create floating text effect
   */
  getFloatingText() {
    let text = this.pools.floatingText.find(t => !t.active);

    if (!text) {
      if (this.pools.floatingText.length < this.maxSize) {
        // Create container for floating text
        const container = this.scene.add.container(0, 0);
        container.setDepth(150);

        // Add text to container
        const textObj = this.scene.add.text(0, 0, '', {
          fontSize: '20px',
          fontFamily: 'Arial',
          color: '#FFD700',
          stroke: '#000000',
          strokeThickness: 3
        }).setOrigin(0.5);

        container.add(textObj);
        container.textObj = textObj; // Store reference
        this.pools.floatingText.push(container);
        text = container;
      } else {
        text = this.pools.floatingText[0];
      }
    }

    text.setActive(true);
    text.setVisible(true);
    text.setAlpha(1);
    text.setScale(1);

    return text;
  }

  /**
   * Return floating text to pool
   */
  releaseFloatingText(text) {
    text.setActive(false);
    text.setVisible(false);
    this.scene.tweens.killTweensOf(text);
  }

  /**
   * Get or create notification container
   */
  getNotification() {
    let notification = this.pools.notification.find(n => !n.active);

    if (!notification) {
      if (this.pools.notification.length < this.maxSize) {
        // Create container for notification
        const container = this.scene.add.container(0, 0);
        container.setDepth(250);
        container.setScrollFactor(0);

        // Background
        const bg = this.scene.add.rectangle(0, 0, 400, 100, 0x000000, 0.8);
        bg.setOrigin(0.5);

        // Check if mobile for font size
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
          || (window.innerWidth < 768);
        const { width, height } = this.scene.scale;
        const isLandscape = width > height;
        
        // Adjust font size based on device and orientation
        let fontSize, strokeThickness;
        if (isMobile && isLandscape) {
          fontSize = '18px'; // Smaller for landscape to fit better
          strokeThickness = 2;
        } else if (isMobile) {
          fontSize = '24px';
          strokeThickness = 3;
        } else {
          fontSize = '48px';
          strokeThickness = 6;
        }

        // Text
        const text = this.scene.add.text(0, 0, '', {
          fontSize: fontSize,
          fontFamily: 'Arial',
          color: '#FFD700',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: strokeThickness
        }).setOrigin(0.5);

        container.add([bg, text]);
        container.bg = bg;
        container.textObj = text;

        this.pools.notification.push(container);
        notification = container;
      } else {
        notification = this.pools.notification[0];
      }
    }

    notification.setActive(true);
    notification.setVisible(true);
    notification.setAlpha(0);
    notification.setScale(0.5);

    return notification;
  }

  /**
   * Return notification to pool
   */
  releaseNotification(notification) {
    notification.setActive(false);
    notification.setVisible(false);
    this.scene.tweens.killTweensOf(notification);
  }

  /**
   * Play collect effect animation
   */
  playCollectEffect(x, y) {
    const circle = this.getCollectCircle();
    circle.setPosition(x, y);

    this.scene.tweens.add({
      targets: circle,
      alpha: 0,
      scale: 2,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.releaseCollectCircle(circle);
      }
    });
  }

  /**
   * Play floating text effect
   */
  playFloatingText(x, y, text, color = '#FFD700') {
    const floatingText = this.getFloatingText();
    floatingText.setPosition(x, y);
    floatingText.textObj.setText(text);
    floatingText.textObj.setColor(color);

    this.scene.tweens.add({
      targets: floatingText,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        this.releaseFloatingText(floatingText);
      }
    });
  }

  /**
   * Show notification with animation
   */
  showNotification(text, color = '#FFD700', duration = 2500) {
    const notification = this.getNotification();
    const { width, height } = this.scene.scale;

    // Check if mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || (window.innerWidth < 768);

    // Check if landscape mode (width > height)
    const isLandscape = width > height;
    
    // Check if iPhone (has safe area insets)
    const isIPhone = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    // Position notification at same Y as combo text
    let notificationY;
    if (isMobile && isLandscape) {
      notificationY = 35; // Same as combo text in landscape
    } else if (isMobile) {
      notificationY = 60; // Same as combo text in portrait mobile
    } else {
      notificationY = 100; // Same as combo text in desktop
    }

    notification.setPosition(width / 2, notificationY);
    notification.textObj.setText(text);
    notification.textObj.setColor(color);

    // Resize background to fit text
    const textWidth = notification.textObj.width;
    const textHeight = notification.textObj.height;
    notification.bg.setSize(textWidth + 60, textHeight + 30);

    // Animate in
    this.scene.tweens.add({
      targets: notification,
      alpha: 1,
      scale: 1.2,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Hold
        this.scene.time.delayedCall(duration, () => {
          // Animate out
          this.scene.tweens.add({
            targets: notification,
            alpha: 0,
            scale: 0.8,
            y: notification.y - 100,
            duration: 500,
            ease: 'Back.easeIn',
            onComplete: () => {
              this.releaseNotification(notification);
            }
          });
        });
      }
    });
  }

  /**
   * Clear all effects
   */
  clear() {
    // Stop all tweens
    for (const poolName in this.pools) {
      this.pools[poolName].forEach(obj => {
        this.scene.tweens.killTweensOf(obj);
        obj.setActive(false);
        obj.setVisible(false);
      });
    }
  }

  /**
   * Destroy pool
   */
  destroy() {
    this.clear();
    for (const poolName in this.pools) {
      this.pools[poolName].forEach(obj => obj.destroy());
      this.pools[poolName] = [];
    }
  }
}
