import { GAME_CONSTANTS } from '../../config/game.js';

/**
 * SceneBackgroundManager
 * Handles scene background creation, parallax scrolling, and scene cleanup
 * Manages three different scenes: beach, mountain-river, and street
 */
export default class SceneBackgroundManager {
  constructor(scene) {
    this.scene = scene;

    // Background layers
    this.cloudsLayer = null;
    this.birdsLayer = null;
    this.farMountainsBg = null;
    this.farMountainsBg2 = null;
    this.mountainsBg = null;
    this.mountainsBg2 = null;
    this.riverBg = null;
    this.riverBg2 = null;
    this.wavesLayer = null;

    // Safe area
    this.safeAreaTop = 0;
  }

  /**
   * Set safe area for mobile devices
   */
  setSafeArea(safeAreaTop) {
    this.safeAreaTop = safeAreaTop;
  }

  /**
   * Create parallax background based on scene type
   */
  createParallaxBackground(sceneType) {
    // Create scene based on selected type
    console.log('🎨 Creating background for scene:', sceneType);
    if (sceneType === 'street') {
      this.createStreetScene();
    } else if (sceneType === 'beach') {
      console.log('🏖️ Calling createBeachScene()...');
      this.createBeachScene();
      console.log('🏖️ createBeachScene() completed');
    } else {
      this.createMountainRiverScene();
    }
  }

  /**
   * Create mountain and river scene
   */
  createMountainRiverScene() {
    const { width, height } = this.scene.scale;

    // Sky layer with beautiful gradient (top to bottom: dark blue to light blue)
    const skyGraphics = this.scene.add.graphics();
    skyGraphics.fillGradientStyle(0x5B9BD5, 0x5B9BD5, 0x87CEEB, 0x87CEEB, 1);
    skyGraphics.fillRect(0, 0, width, height * 0.6);
    skyGraphics.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xE6F3FF, 0xE6F3FF, 1);
    skyGraphics.fillRect(0, height * 0.6, width, height * 0.4);

    // Sun (mặt trời)
    const sunY = height * 0.15 + this.safeAreaTop;
    const sun = this.scene.add.circle(width * 0.85, sunY, 40, 0xFDB813, 1);
    sun.setAlpha(0.9);
    // Sun glow
    const sunGlow = this.scene.add.circle(width * 0.85, sunY, 55, 0xFDB813, 0.3);

    // Clouds layer (beautiful fluffy clouds)
    this.cloudsLayer = this.scene.add.group();
    for (let i = 0; i < 8; i++) {
      const cloudX = i * 250 + Math.random() * 150;
      const cloudY = this.safeAreaTop + 40 + Math.random() * 120;

      // Create cloud group with multiple circles for fluffy effect
      const cloudContainer = this.scene.add.container(cloudX, cloudY);

      // Main cloud body
      const cloud1 = this.scene.add.ellipse(0, 0, 100, 50, 0xffffff, 0.9);
      const cloud2 = this.scene.add.ellipse(-30, -10, 70, 45, 0xffffff, 0.85);
      const cloud3 = this.scene.add.ellipse(30, -5, 80, 40, 0xffffff, 0.85);
      const cloud4 = this.scene.add.ellipse(0, 10, 60, 35, 0xffffff, 0.8);

      cloudContainer.add([cloud1, cloud2, cloud3, cloud4]);
      cloudContainer.setData('baseX', cloudX);
      cloudContainer.setData('speed', 0.8 + Math.random() * 0.4);
      this.cloudsLayer.add(cloudContainer);
    }

    // Birds flying (chim bay)
    this.birdsLayer = this.scene.add.group();
    for (let i = 0; i < 5; i++) {
      const birdX = Math.random() * width;
      const birdY = this.safeAreaTop + 80 + Math.random() * 150;

      // Simple bird shape (V shape)
      const birdGraphics = this.scene.add.graphics();
      birdGraphics.lineStyle(2, 0x2C3E50, 1);
      birdGraphics.beginPath();
      birdGraphics.moveTo(-8, 0);
      birdGraphics.lineTo(0, -5);
      birdGraphics.lineTo(8, 0);
      birdGraphics.strokePath();

      const birdTexture = birdGraphics.generateTexture('bird' + i, 16, 10);
      birdGraphics.destroy();

      const bird = this.scene.add.image(birdX, birdY, 'bird' + i);
      bird.setData('baseX', birdX);
      bird.setData('baseY', birdY);
      bird.setData('speed', 1.5 + Math.random() * 1);
      this.birdsLayer.add(bird);

      // Animate bird flapping
      this.scene.tweens.add({
        targets: bird,
        scaleY: 0.8,
        duration: 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // Far mountains (núi xa - darker, smaller)
    // Adjust mountain position on mobile to avoid safe area at top
    const mountainOffset = this.safeAreaTop * 0.3;
    const farMountainGraphics = this.scene.add.graphics();
    farMountainGraphics.fillStyle(0x6B8E23, 0.5);
    for (let i = 0; i < 6; i++) {
      const x = i * 250;
      farMountainGraphics.fillTriangle(
        x, height - 180 + mountainOffset,
        x + 100, height - 320 + mountainOffset,
        x + 200, height - 180 + mountainOffset
      );
    }
    const farMountainTexture = farMountainGraphics.generateTexture('farMountains', width * 2, height);
    farMountainGraphics.destroy();

    this.farMountainsBg = this.scene.add.image(0, 0, 'farMountains').setOrigin(0);
    this.farMountainsBg2 = this.scene.add.image(width * 2, 0, 'farMountains').setOrigin(0);

    // Near mountains (núi gần - brighter, bigger)
    const mountainGraphics = this.scene.add.graphics();
    mountainGraphics.fillStyle(0x8B7355, 0.7);
    for (let i = 0; i < 5; i++) {
      const x = i * 350;
      mountainGraphics.fillTriangle(
        x, height - 120 + mountainOffset,
        x + 175, height - 350 + mountainOffset,
        x + 350, height - 120 + mountainOffset
      );
      // Mountain shadows
      mountainGraphics.fillStyle(0x654321, 0.3);
      mountainGraphics.fillTriangle(
        x + 175, height - 350 + mountainOffset,
        x + 350, height - 120 + mountainOffset,
        x + 250, height - 120 + mountainOffset
      );
      mountainGraphics.fillStyle(0x8B7355, 0.7);
    }
    const mountainTexture = mountainGraphics.generateTexture('mountains', width * 2, height);
    mountainGraphics.destroy();

    this.mountainsBg = this.scene.add.image(0, 0, 'mountains').setOrigin(0);
    this.mountainsBg2 = this.scene.add.image(width * 2, 0, 'mountains').setOrigin(0);

    // River (sông) - behind the ground
    const riverGraphics = this.scene.add.graphics();
    riverGraphics.fillGradientStyle(0x4A90E2, 0x4A90E2, 0x87CEEB, 0x87CEEB, 1);
    riverGraphics.fillRect(0, height - 100, width * 2, 70);
    const riverTexture = riverGraphics.generateTexture('river', width * 2, 100);
    riverGraphics.destroy();

    this.riverBg = this.scene.add.image(0, height - 100, 'river').setOrigin(0);
    this.riverBg2 = this.scene.add.image(width * 2, height - 100, 'river').setOrigin(0);

    // Water waves (sóng nước)
    this.wavesLayer = this.scene.add.group();
    for (let i = 0; i < 10; i++) {
      const waveX = i * 200;
      const waveY = height - 70;

      const waveGraphics = this.scene.add.graphics();
      waveGraphics.lineStyle(3, 0xffffff, 0.5);
      waveGraphics.beginPath();
      for (let x = 0; x < 100; x += 10) {
        const y = Math.sin(x * 0.1) * 5;
        if (x === 0) {
          waveGraphics.moveTo(x, y);
        } else {
          waveGraphics.lineTo(x, y);
        }
      }
      waveGraphics.strokePath();

      const waveTexture = waveGraphics.generateTexture('wave' + i, 100, 20);
      waveGraphics.destroy();

      const wave = this.scene.add.image(waveX, waveY, 'wave' + i);
      wave.setData('baseX', waveX);
      wave.setData('phase', i * 0.5);
      this.wavesLayer.add(wave);

      // Animate waves
      this.scene.tweens.add({
        targets: wave,
        y: waveY - 3,
        duration: 1000 + Math.random() * 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  /**
   * Create street scene
   */
  createStreetScene() {
    const { width, height } = this.scene.scale;

    // Sky layer - urban evening gradient (orange/purple sunset)
    const skyGraphics = this.scene.add.graphics();
    skyGraphics.fillGradientStyle(0xFF7F50, 0xFF7F50, 0x9370DB, 0x9370DB, 1);
    skyGraphics.fillRect(0, 0, width, height * 0.5);
    skyGraphics.fillGradientStyle(0x9370DB, 0x9370DB, 0x4B0082, 0x4B0082, 1);
    skyGraphics.fillRect(0, height * 0.5, width, height * 0.5);

    // Sun/Moon (setting sun)
    const sunY = height * 0.2 + this.safeAreaTop;
    const sun = this.scene.add.circle(width * 0.15, sunY, 50, 0xFF6347, 1);
    sun.setAlpha(0.8);
    const sunGlow = this.scene.add.circle(width * 0.15, sunY, 70, 0xFF6347, 0.3);

    // Clouds layer
    this.cloudsLayer = this.scene.add.group();
    for (let i = 0; i < 6; i++) {
      const cloudX = i * 300 + Math.random() * 150;
      const cloudY = this.safeAreaTop + 50 + Math.random() * 100;

      const cloudContainer = this.scene.add.container(cloudX, cloudY);
      const cloud1 = this.scene.add.ellipse(0, 0, 100, 50, 0xFFB6C1, 0.7);
      const cloud2 = this.scene.add.ellipse(-30, -10, 70, 45, 0xFFB6C1, 0.65);
      const cloud3 = this.scene.add.ellipse(30, -5, 80, 40, 0xFFB6C1, 0.65);

      cloudContainer.add([cloud1, cloud2, cloud3]);
      cloudContainer.setData('baseX', cloudX);
      cloudContainer.setData('speed', 0.5 + Math.random() * 0.3);
      this.cloudsLayer.add(cloudContainer);
    }

    // Birds flying
    this.birdsLayer = this.scene.add.group();
    for (let i = 0; i < 4; i++) {
      const birdX = Math.random() * width;
      const birdY = this.safeAreaTop + 80 + Math.random() * 120;

      const birdGraphics = this.scene.add.graphics();
      birdGraphics.lineStyle(2, 0x2C3E50, 1);
      birdGraphics.beginPath();
      birdGraphics.moveTo(-8, 0);
      birdGraphics.lineTo(0, -5);
      birdGraphics.lineTo(8, 0);
      birdGraphics.strokePath();

      const birdTexture = birdGraphics.generateTexture('streetBird' + i, 16, 10);
      birdGraphics.destroy();

      const bird = this.scene.add.image(birdX, birdY, 'streetBird' + i);
      bird.setData('baseX', birdX);
      bird.setData('baseY', birdY);
      bird.setData('speed', 1.2 + Math.random() * 0.8);
      this.birdsLayer.add(bird);

      this.scene.tweens.add({
        targets: bird,
        scaleY: 0.8,
        duration: 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // Far buildings (skyscrapers in distance)
    const farBuildingGraphics = this.scene.add.graphics();
    farBuildingGraphics.fillStyle(0x2F4F4F, 0.6);
    for (let i = 0; i < 8; i++) {
      const x = i * 200;
      const buildingHeight = 150 + Math.random() * 100;
      farBuildingGraphics.fillRect(x, height - buildingHeight - 120, 150, buildingHeight);
      // Windows
      farBuildingGraphics.fillStyle(0xFFD700, 0.4);
      for (let w = 0; w < 3; w++) {
        for (let h = 0; h < Math.floor(buildingHeight / 20); h++) {
          if (Math.random() > 0.3) {
            farBuildingGraphics.fillRect(x + 20 + w * 40, height - buildingHeight - 120 + h * 20 + 10, 25, 15);
          }
        }
      }
      farBuildingGraphics.fillStyle(0x2F4F4F, 0.6);
    }
    const farBuildingTexture = farBuildingGraphics.generateTexture('farBuildings', width * 2, height);
    farBuildingGraphics.destroy();

    this.farMountainsBg = this.scene.add.image(0, 0, 'farBuildings').setOrigin(0);
    this.farMountainsBg2 = this.scene.add.image(width * 2, 0, 'farBuildings').setOrigin(0);

    // Near buildings (closer, taller)
    const buildingGraphics = this.scene.add.graphics();
    for (let i = 0; i < 6; i++) {
      const x = i * 300;
      const buildingHeight = 200 + Math.random() * 150;
      const buildingWidth = 200;

      // Building body
      buildingGraphics.fillStyle(0x696969, 0.8);
      buildingGraphics.fillRect(x, height - buildingHeight - 100, buildingWidth, buildingHeight);

      // Windows (lit up)
      buildingGraphics.fillStyle(0xFFFF00, 0.7);
      for (let w = 0; w < 4; w++) {
        for (let h = 0; h < Math.floor(buildingHeight / 25); h++) {
          if (Math.random() > 0.4) {
            buildingGraphics.fillRect(x + 25 + w * 40, height - buildingHeight - 100 + h * 25 + 12, 30, 18);
          }
        }
      }

      // Roof
      buildingGraphics.fillStyle(0x4B4B4B, 1);
      buildingGraphics.fillRect(x, height - buildingHeight - 120, buildingWidth, 20);
    }
    const buildingTexture = buildingGraphics.generateTexture('buildings', width * 2, height);
    buildingGraphics.destroy();

    this.mountainsBg = this.scene.add.image(0, 0, 'buildings').setOrigin(0);
    this.mountainsBg2 = this.scene.add.image(width * 2, 0, 'buildings').setOrigin(0);

    // Street/road (asphalt)
    const streetGraphics = this.scene.add.graphics();
    streetGraphics.fillStyle(0x36454F, 1);
    streetGraphics.fillRect(0, height - 100, width * 2, 70);
    // Road markings
    streetGraphics.fillStyle(0xFFFFFF, 0.8);
    for (let i = 0; i < 20; i++) {
      streetGraphics.fillRect(i * 150 + 50, height - 65, 80, 5);
    }
    const streetTexture = streetGraphics.generateTexture('street', width * 2, 100);
    streetGraphics.destroy();

    this.riverBg = this.scene.add.image(0, height - 100, 'street').setOrigin(0);
    this.riverBg2 = this.scene.add.image(width * 2, height - 100, 'street').setOrigin(0);

    // Street lights
    this.wavesLayer = this.scene.add.group();
    for (let i = 0; i < 8; i++) {
      const lightX = i * 250 + 100;
      const lightY = height - 120;

      const lightGraphics = this.scene.add.graphics();
      // Pole
      lightGraphics.fillStyle(0x4B4B4B, 1);
      lightGraphics.fillRect(-5, 0, 10, 100);
      // Light
      lightGraphics.fillStyle(0xFFD700, 1);
      lightGraphics.fillCircle(0, 0, 12);
      lightGraphics.fillStyle(0xFFFF00, 0.3);
      lightGraphics.fillCircle(0, 0, 25);

      const lightTexture = lightGraphics.generateTexture('streetLight' + i, 60, 120);
      lightGraphics.destroy();

      const light = this.scene.add.image(lightX, lightY, 'streetLight' + i);
      light.setData('baseX', lightX);
      this.wavesLayer.add(light);

      // Flickering animation
      this.scene.tweens.add({
        targets: light,
        alpha: 0.7,
        duration: 2000 + Math.random() * 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  /**
   * Create beach scene
   */
  createBeachScene() {
    const { width, height } = this.scene.scale;

    console.log('🏖️ Creating simplified beach scene...');

    // === OPTIMIZED TROPICAL SUNSET BEACH SCENE ===

    // 1. SKY - Vibrant tropical sunset gradient
    const skyGraphics = this.scene.add.graphics();
    // Top to mid - purple to pink
    skyGraphics.fillGradientStyle(0x2C1B47, 0x2C1B47, 0xFF6B9D, 0xFF6B9D, 1);
    skyGraphics.fillRect(0, 0, width, height * 0.5);
    // Mid to horizon - pink to orange
    skyGraphics.fillGradientStyle(0xFF6B9D, 0xFF6B9D, 0xFFD93D, 0xFFD93D, 1);
    skyGraphics.fillRect(0, height * 0.5, width, height * 0.5);

    // 2. SUN - Large glowing sunset
    const sunY = height * 0.6 + this.safeAreaTop;
    const sunX = width * 0.75;
    const sun = this.scene.add.circle(sunX, sunY, 40, 0xFFD700, 1);
    sun.setAlpha(0.9);
    const sunGlow = this.scene.add.circle(sunX, sunY, 60, 0xFFD700, 0.3);

    // 3. CLOUDS
    this.cloudsLayer = this.scene.add.group();
    for (let i = 0; i < 6; i++) {
      const cloudX = i * 300 + Math.random() * 100;
      const cloudY = this.safeAreaTop + 50 + Math.random() * 100;
      const cloudContainer = this.scene.add.container(cloudX, cloudY);

      const cloud1 = this.scene.add.ellipse(0, 0, 100, 50, 0xFFB6C1, 0.6);
      const cloud2 = this.scene.add.ellipse(-30, -10, 70, 45, 0xFFB6C1, 0.55);
      const cloud3 = this.scene.add.ellipse(30, -5, 80, 40, 0xFFB6C1, 0.55);

      cloudContainer.add([cloud1, cloud2, cloud3]);
      cloudContainer.setData('baseX', cloudX);
      cloudContainer.setData('speed', 0.6 + Math.random() * 0.4);
      this.cloudsLayer.add(cloudContainer);
    }

    // 4. DISTANT ISLANDS - Simple triangles like mountains
    const islandGraphics = this.scene.add.graphics();
    islandGraphics.fillStyle(0x2F4F4F, 0.6);
    for (let i = 0; i < 4; i++) {
      const x = i * 350;
      islandGraphics.fillTriangle(
        x, height - 180,
        x + 150, height - 280,
        x + 300, height - 180
      );
    }
    const islandTexture = islandGraphics.generateTexture('beachIslands', width * 2, height);
    islandGraphics.destroy();

    this.farMountainsBg = this.scene.add.image(0, 0, 'beachIslands').setOrigin(0);
    this.farMountainsBg2 = this.scene.add.image(width * 2, 0, 'beachIslands').setOrigin(0);

    // 5. OCEAN - Water
    const oceanGraphics = this.scene.add.graphics();
    oceanGraphics.fillGradientStyle(0x4A90E2, 0x4A90E2, 0x87CEEB, 0x87CEEB, 1);
    oceanGraphics.fillRect(0, height - 120, width * 2, 90);
    const oceanTexture = oceanGraphics.generateTexture('tropicalOcean', width * 2, 120);
    oceanGraphics.destroy();

    this.riverBg = this.scene.add.image(0, height - 120, 'tropicalOcean').setOrigin(0);
    this.riverBg2 = this.scene.add.image(width * 2, height - 120, 'tropicalOcean').setOrigin(0);

    // 6. SAILBOATS - Far and near boats
    this.birdsLayer = this.scene.add.group();

    // Far boats (smaller, simpler)
    for (let i = 0; i < 3; i++) {
      const boatX = i * 400 + 150 + Math.random() * 80;
      const boatY = height - 130 + Math.random() * 15;

      const boatGraphics = this.scene.add.graphics();

      // Hull - simple triangle
      boatGraphics.fillStyle(0x8B4513, 1);
      boatGraphics.fillTriangle(0, 2, -16, 18, 16, 18);

      // Mast
      boatGraphics.fillStyle(0x654321, 1);
      boatGraphics.fillRect(-1, -25, 2, 27);

      // Sail
      boatGraphics.fillStyle(0xFFFFFF, 0.85);
      boatGraphics.fillTriangle(-1, -25, -12, 2, 2, 2);

      const boatTexture = boatGraphics.generateTexture('farBoat' + i, 35, 50);
      boatGraphics.destroy();

      const boat = this.scene.add.image(boatX, boatY, 'farBoat' + i);
      boat.setData('baseX', boatX);
      boat.setData('baseY', boatY);
      boat.setAlpha(0.7);
      boat.setScale(0.8);
      this.birdsLayer.add(boat);

      this.scene.tweens.add({
        targets: boat,
        y: boatY - 4,
        duration: 2500 + Math.random() * 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // Near boats (bigger, detailed)
    for (let i = 0; i < 3; i++) {
      const boatX = i * 500 + 250 + Math.random() * 100;
      const boatY = height - 95 + Math.random() * 15;

      const boatGraphics = this.scene.add.graphics();

      // Hull - pointed bow
      boatGraphics.fillStyle(0x8B4513, 1);
      boatGraphics.fillTriangle(0, 5, -24, 26, 24, 26);

      // Hull shadow
      boatGraphics.fillStyle(0x654321, 0.4);
      boatGraphics.fillTriangle(0, 5, 0, 26, 24, 26);

      // Mast
      boatGraphics.fillStyle(0x654321, 1);
      boatGraphics.fillRect(-2, -40, 4, 46);

      // Main sail
      boatGraphics.fillStyle(0xFFFFFF, 0.95);
      boatGraphics.fillTriangle(-2, -40, -20, 5, 3, 5);

      // Sail shading
      boatGraphics.fillStyle(0xE0E0E0, 0.5);
      boatGraphics.fillTriangle(-2, -40, 3, 5, -2, 5);

      // Jib sail
      boatGraphics.fillStyle(0xF5F5F5, 0.9);
      boatGraphics.fillTriangle(0, -28, 16, -6, 18, 6);

      const boatTexture = boatGraphics.generateTexture('nearBoat' + i, 55, 75);
      boatGraphics.destroy();

      const boat = this.scene.add.image(boatX, boatY, 'nearBoat' + i);
      boat.setData('baseX', boatX);
      boat.setData('baseY', boatY);
      this.birdsLayer.add(boat);

      this.scene.tweens.add({
        targets: boat,
        y: boatY - 6,
        duration: 2000 + Math.random() * 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // 7. WAVES
    this.wavesLayer = this.scene.add.group();
    for (let i = 0; i < 10; i++) {
      const waveX = i * 180;
      const waveY = height - 80;

      const waveGraphics = this.scene.add.graphics();
      waveGraphics.lineStyle(3, 0xFFFFFF, 0.5);
      waveGraphics.beginPath();
      for (let x = 0; x < 120; x += 10) {
        const y = Math.sin(x * 0.1) * 5;
        if (x === 0) waveGraphics.moveTo(x, y);
        else waveGraphics.lineTo(x, y);
      }
      waveGraphics.strokePath();

      const waveTexture = waveGraphics.generateTexture('tropicalWave' + i, 120, 20);
      waveGraphics.destroy();

      const wave = this.scene.add.image(waveX, waveY, 'tropicalWave' + i);
      wave.setData('baseX', waveX);
      wave.setData('phase', i * 0.5);
      this.wavesLayer.add(wave);

      this.scene.tweens.add({
        targets: wave,
        y: waveY - 3,
        duration: 1000 + Math.random() * 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // 8. SAND WITH SIMPLIFIED PALM TREES - Beach foreground
    const sandGraphics = this.scene.add.graphics();

    // Sand
    sandGraphics.fillStyle(0xF5DEB3, 1);
    sandGraphics.fillRect(0, height - 30, width * 2, 30);

    // SIMPLIFIED Palm trees - just 2 trees with simpler design
    for (let i = 0; i < 2; i++) {
      const palmX = i * 800 + 300;
      const palmY = height - 150;

      // Simple straight trunk (no complex curves)
      sandGraphics.fillStyle(0x8B6F47, 1);
      sandGraphics.fillRect(palmX - 7, palmY, 14, 100);

      // Trunk rings for texture (simple)
      sandGraphics.fillStyle(0x654321, 0.3);
      for (let r = 0; r < 5; r++) {
        sandGraphics.fillRect(palmX - 8, palmY + r * 20, 16, 3);
      }

      // Top of trunk position
      const topX = palmX;
      const topY = palmY;

      // Simplified palm fronds - 6 directions using triangles (faster than ellipses)
      sandGraphics.fillStyle(0x2ECC71, 1);
      const frondCount = 6;
      const frondLength = 50;

      for (let f = 0; f < frondCount; f++) {
        const angle = (f / frondCount) * Math.PI * 2;
        const endX = topX + Math.cos(angle) * frondLength;
        const endY = topY + Math.sin(angle) * frondLength;

        // Simple triangle frond (much faster than ellipse)
        const leftAngle = angle - Math.PI / 6;
        const rightAngle = angle + Math.PI / 6;
        sandGraphics.fillTriangle(
          topX, topY,
          topX + Math.cos(leftAngle) * frondLength, topY + Math.sin(leftAngle) * frondLength,
          topX + Math.cos(rightAngle) * frondLength, topY + Math.sin(rightAngle) * frondLength
        );
      }

      // Simplified coconuts - just 3 circles
      sandGraphics.fillStyle(0x8B4513, 1);
      sandGraphics.fillCircle(topX - 8, topY + 8, 7);
      sandGraphics.fillCircle(topX + 8, topY + 8, 7);
      sandGraphics.fillCircle(topX, topY + 15, 7);
    }

    console.log('🏖️ Generating beach texture...');
    const sandTexture = sandGraphics.generateTexture('tropicalBeach', width * 2, height);
    sandGraphics.destroy();
    console.log('🏖️ Beach texture generated');

    this.mountainsBg = this.scene.add.image(0, 0, 'tropicalBeach').setOrigin(0);
    this.mountainsBg2 = this.scene.add.image(width * 2, 0, 'tropicalBeach').setOrigin(0);

    console.log('✨ Beach scene created successfully!');
  }

  /**
   * Clear all scene elements
   */
  clearScene(obstacles, collectibles) {
    console.log('Clearing scene...');

    // Clear all scene-specific layers
    if (this.cloudsLayer) {
      this.cloudsLayer.clear(true, true);
      this.cloudsLayer = null;
    }
    if (this.birdsLayer) {
      this.birdsLayer.clear(true, true);
      this.birdsLayer = null;
    }
    if (this.farMountainsBg) {
      this.farMountainsBg.destroy();
      this.farMountainsBg = null;
    }
    if (this.farMountainsBg2) {
      this.farMountainsBg2.destroy();
      this.farMountainsBg2 = null;
    }
    if (this.mountainsBg) {
      this.mountainsBg.destroy();
      this.mountainsBg = null;
    }
    if (this.mountainsBg2) {
      this.mountainsBg2.destroy();
      this.mountainsBg2 = null;
    }
    if (this.riverBg) {
      this.riverBg.destroy();
      this.riverBg = null;
    }
    if (this.riverBg2) {
      this.riverBg2.destroy();
      this.riverBg2 = null;
    }
    if (this.wavesLayer) {
      this.wavesLayer.clear(true, true);
      this.wavesLayer = null;
    }

    // Destroy all scene-specific textures
    const textureManager = this.scene.textures;
    const texturesToDestroy = [
      'farMountains', 'mountains', 'river',
      'farBuildings', 'buildings', 'street',
      'beachIslands', 'tropicalBeach', 'tropicalOcean'
    ];

    texturesToDestroy.forEach(key => {
      if (textureManager.exists(key)) {
        textureManager.remove(key);
      }
    });

    // Destroy dynamic textures
    for (let i = 0; i < 30; i++) {
      const dynamicKeys = [
        `bird${i}`, `wave${i}`, `streetBird${i}`, `streetLight${i}`,
        `tropicalWave${i}`, `boat${i}`, `farBoat${i}`, `nearBoat${i}`
      ];

      dynamicKeys.forEach(key => {
        if (textureManager.exists(key)) {
          textureManager.remove(key);
        }
      });
    }

    // Ensure obstacles and collectibles stay on top of new background
    if (obstacles) {
      obstacles.getChildren().forEach(obstacle => {
        if (obstacle && obstacle.setDepth) {
          obstacle.setDepth(30);
        }
      });
      console.log('✅ Obstacles kept:', obstacles.getLength());
    }

    if (collectibles) {
      collectibles.getChildren().forEach(item => {
        if (item && item.setDepth) {
          item.setDepth(30);
        }
      });
      console.log('✅ Collectibles kept:', collectibles.getLength());
    }

    console.log('Scene cleared successfully');
  }

  /**
   * Update parallax scrolling
   */
  updateParallax(deltaInSeconds, scrollSpeed) {
    const scrollDistance = scrollSpeed * deltaInSeconds;

    // Clouds (slow)
    if (this.cloudsLayer) {
      this.cloudsLayer.getChildren().forEach(cloud => {
        const speed = cloud.getData('speed') || 1;
        cloud.x -= scrollDistance * GAME_CONSTANTS.PARALLAX_CLOUDS * speed;
        if (cloud.x < -150) {
          cloud.x = this.scene.scale.width + 150;
        }
      });
    }

    // Birds/boats flying (very slow, natural movement)
    if (this.birdsLayer) {
      this.birdsLayer.getChildren().forEach(bird => {
        const speed = bird.getData('speed') || 1;
        bird.x -= scrollDistance * 0.3 * speed;
        // Add slight vertical bobbing
        const baseY = bird.getData('baseY');
        bird.y = baseY + Math.sin(Date.now() * 0.001 + bird.x * 0.01) * 10;

        if (bird.x < -50) {
          bird.x = this.scene.scale.width + 50;
          bird.setData('baseY', 80 + Math.random() * 150);
        }
      });
    }

    // Far mountains (slower than near mountains)
    if (this.farMountainsBg && this.farMountainsBg2) {
      this.farMountainsBg.x -= scrollDistance * GAME_CONSTANTS.PARALLAX_MOUNTAINS * 0.5;
      this.farMountainsBg2.x -= scrollDistance * GAME_CONSTANTS.PARALLAX_MOUNTAINS * 0.5;

      if (this.farMountainsBg.x + this.farMountainsBg.width < 0) {
        this.farMountainsBg.x = this.farMountainsBg2.x + this.farMountainsBg2.width;
      }
      if (this.farMountainsBg2.x + this.farMountainsBg2.width < 0) {
        this.farMountainsBg2.x = this.farMountainsBg.x + this.farMountainsBg.width;
      }
    }

    // Near mountains (medium)
    if (this.mountainsBg && this.mountainsBg2) {
      this.mountainsBg.x -= scrollDistance * GAME_CONSTANTS.PARALLAX_MOUNTAINS;
      this.mountainsBg2.x -= scrollDistance * GAME_CONSTANTS.PARALLAX_MOUNTAINS;

      if (this.mountainsBg.x + this.mountainsBg.width < 0) {
        this.mountainsBg.x = this.mountainsBg2.x + this.mountainsBg2.width;
      }
      if (this.mountainsBg2.x + this.mountainsBg2.width < 0) {
        this.mountainsBg2.x = this.mountainsBg.x + this.mountainsBg.width;
      }
    }

    // River (fast, like ground)
    if (this.riverBg && this.riverBg2) {
      this.riverBg.x -= scrollDistance * 0.8;
      this.riverBg2.x -= scrollDistance * 0.8;

      if (this.riverBg.x + this.riverBg.width < 0) {
        this.riverBg.x = this.riverBg2.x + this.riverBg2.width;
      }
      if (this.riverBg2.x + this.riverBg2.width < 0) {
        this.riverBg2.x = this.riverBg.x + this.riverBg.width;
      }
    }

    // Waves (fast with water)
    if (this.wavesLayer) {
      this.wavesLayer.getChildren().forEach(wave => {
        wave.x -= scrollDistance * 0.9;
        if (wave.x < -100) {
          wave.x = this.scene.scale.width + 100;
        }
      });
    }
  }

  /**
   * Destroy manager
   */
  destroy() {
    this.clearScene(null, null);
  }
}
