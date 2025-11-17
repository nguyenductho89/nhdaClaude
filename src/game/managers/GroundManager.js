/**
 * GroundManager
 * Handles ground creation, rendering, and scrolling
 */
export default class GroundManager {
  constructor(scene) {
    this.scene = scene;
    this.ground1 = null;
    this.ground2 = null;
    this.ground = null; // Physics body
    this.groundY = 0;
    this.groundWidth = 0;

    // Safe area insets (for positioning ground above bottom safe area)
    this.safeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };
  }

  /**
   * Set safe area insets to calculate ground position
   */
  setSafeAreaInsets(insets) {
    this.safeAreaInsets = insets;
    console.log('🌍 GroundManager: Safe Area Insets set:', insets);
  }

  /**
   * Create the ground with layered graphics (grass, dirt)
   */
  createGround() {
    const { width, height } = this.scene.scale;

    // Ground at the bottom - ABOVE safe area bottom (để tránh bị che)
    const groundHeight = 25;
    const safeAreaBottom = this.safeAreaInsets.bottom || 0;

    // Calculate groundY: position ground ABOVE bottom safe area
    this.groundY = height - groundHeight - safeAreaBottom;

    console.log('🌍 Ground Position Calculation:');
    console.log('  - Screen height:', height);
    console.log('  - Ground height:', groundHeight);
    console.log('  - Safe area bottom:', safeAreaBottom);
    console.log('  - Ground Y position:', this.groundY);
    console.log('  - Distance from bottom:', height - this.groundY);

    // Create a wide seamless ground texture
    const groundWidth = Math.max(width * 2, 2048); // Ensure minimum width
    const groundGraphics = this.scene.add.graphics();

    // Layer 1: Grass (top) - bright green
    groundGraphics.fillStyle(0x4CAF50, 1);
    groundGraphics.fillRect(0, 0, groundWidth, 8);

    // Add lighter green top edge for grass highlight
    groundGraphics.fillStyle(0x66BB6A, 1);
    groundGraphics.fillRect(0, 0, groundWidth, 2);

    // Layer 2: Dirt (middle) - brown
    groundGraphics.fillStyle(0x8B4513, 1);
    groundGraphics.fillRect(0, 8, groundWidth, 10);

    // Layer 3: Deep dirt (bottom) - dark brown
    groundGraphics.fillStyle(0x5D4037, 1);
    groundGraphics.fillRect(0, 18, groundWidth, 7);

    // Generate texture and destroy graphics
    groundGraphics.generateTexture('seamlessGround', groundWidth, groundHeight);
    groundGraphics.destroy();

    // Create TWO ground images for seamless infinite scrolling
    this.ground1 = this.scene.add.image(0, this.groundY, 'seamlessGround').setOrigin(0, 0).setDepth(10);
    this.ground2 = this.scene.add.image(groundWidth, this.groundY, 'seamlessGround').setOrigin(0, 0).setDepth(10);

    // Store width for wrapping
    this.groundWidth = groundWidth;

    // Ground collision body
    this.ground = this.scene.add.rectangle(width / 2, this.groundY + 10, width * 2, 20, 0x000000, 0);
    this.scene.physics.add.existing(this.ground, true); // Static body
  }

  /**
   * Update ground scrolling
   */
  updateGround(deltaInSeconds, scrollSpeed) {
    const scrollDistance = scrollSpeed * deltaInSeconds;

    // Scroll both ground images
    this.ground1.x -= scrollDistance;
    this.ground2.x -= scrollDistance;

    // Wrap around seamlessly - use stored width to ensure no gaps
    const groundWidth = this.groundWidth || this.ground1.width;

    if (this.ground1.x + groundWidth <= 0) {
      this.ground1.x = this.ground2.x + groundWidth;
    }
    if (this.ground2.x + groundWidth <= 0) {
      this.ground2.x = this.ground1.x + groundWidth;
    }
  }

  /**
   * Get ground Y position
   */
  getGroundY() {
    return this.groundY;
  }

  /**
   * Get ground physics body
   */
  getGroundBody() {
    return this.ground;
  }

  /**
   * Destroy ground elements
   */
  destroy() {
    if (this.ground1) this.ground1.destroy();
    if (this.ground2) this.ground2.destroy();
    if (this.ground) this.ground.destroy();
  }
}
