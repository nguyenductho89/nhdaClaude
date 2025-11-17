import { GAME_CONSTANTS } from '../../config/game.js';

/**
 * SceneBackgroundManager
 * Handles scene background creation, parallax scrolling, and scene cleanup
 * Manages four different scenes: mountain-river, street, forest, and beach
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

    // Performance optimization - throttle parallax updates on mobile
    this.frameCount = 0;
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || window.innerWidth < 768;
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
    } else if (sceneType === 'forest') {
      this.createForestScene();
    } else {
      this.createMountainRiverScene();
    }
  }

  /**
   * Detect device type (helper method)
   */
  detectDeviceType() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || window.innerWidth < 768;
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    return { isMobile, isIOS };
  }

  /**
   * Create mountain and river scene
   */
  createMountainRiverScene() {
    const { width, height } = this.scene.scale;
    const { isMobile, isIOS } = this.detectDeviceType();

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

    // Clouds layer (beautiful fluffy clouds) - giảm số lượng trên mobile
    this.cloudsLayer = this.scene.add.group();
    // iOS needs even fewer particles due to Safari WebGL issues
    const cloudCount = isIOS ? 2 : (isMobile ? 4 : 8);
    for (let i = 0; i < cloudCount; i++) {
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

    // Birds flying (chim bay) - giảm số lượng trên mobile
    this.birdsLayer = this.scene.add.group();
    // iOS: even fewer birds
    const birdCount = isIOS ? 2 : (isMobile ? 3 : 5);
    for (let i = 0; i < birdCount; i++) {
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

      // Animate bird flapping - disable on iOS to save performance
      if (!isIOS) {
        this.scene.tweens.add({
          targets: bird,
          scaleY: 0.8,
          duration: 300,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
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

    // Water waves (sóng nước) - giảm số lượng trên mobile
    this.wavesLayer = this.scene.add.group();
    // iOS: minimal waves
    const waveCount = isIOS ? 3 : (isMobile ? 5 : 10);
    for (let i = 0; i < waveCount; i++) {
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

      // Animate waves - disable on iOS to save performance
      if (!isIOS) {
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
  }

  /**
   * Create street scene
   */
  createStreetScene() {
    const { width, height } = this.scene.scale;
    const { isMobile, isIOS } = this.detectDeviceType();

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

    // Clouds layer - giảm số lượng trên mobile
    this.cloudsLayer = this.scene.add.group();
    const cloudCount = isIOS ? 2 : (isMobile ? 3 : 6);
    for (let i = 0; i < cloudCount; i++) {
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

    // Birds flying - giảm số lượng trên mobile
    this.birdsLayer = this.scene.add.group();
    const birdCount = isIOS ? 1 : (isMobile ? 2 : 4);
    for (let i = 0; i < birdCount; i++) {
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

    // Street lights - giảm số lượng trên mobile
    this.wavesLayer = this.scene.add.group();
    const lightCount = isIOS ? 2 : (isMobile ? 4 : 8);
    for (let i = 0; i < lightCount; i++) {
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

      // Flickering animation - disable on iOS
      if (!isIOS) {
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
  }

  /**
   * Create forest scene
   */
  createForestScene() {
    const { width, height } = this.scene.scale;
    const { isMobile, isIOS } = this.detectDeviceType();

    console.log('🌲 Creating forest scene...');

    // === MYSTICAL FOREST SCENE ===

    // 1. SKY - Forest canopy light filtering through
    const skyGraphics = this.scene.add.graphics();
    // Top to mid - dark green to light green (filtered sunlight)
    skyGraphics.fillGradientStyle(0x1B3A1B, 0x1B3A1B, 0x4A7C4A, 0x4A7C4A, 1);
    skyGraphics.fillRect(0, 0, width, height * 0.6);
    // Mid to bottom - lighter green
    skyGraphics.fillGradientStyle(0x4A7C4A, 0x4A7C4A, 0x6B9B6B, 0x6B9B6B, 1);
    skyGraphics.fillRect(0, height * 0.6, width, height * 0.4);

    // 2. SUN RAYS - Filtered light through trees
    const sunY = height * 0.2 + this.safeAreaTop;
    const sunX = width * 0.7;
    const sun = this.scene.add.circle(sunX, sunY, 45, 0xFFE87C, 0.6);
    const sunGlow = this.scene.add.circle(sunX, sunY, 70, 0xFFE87C, 0.2);

    // 3. LIGHT BEAMS - Mystical sun rays through canopy - giảm số lượng trên mobile
    const beamGraphics = this.scene.add.graphics();
    beamGraphics.fillStyle(0xFFFFFF, 0.1);
    const beamCount = isIOS ? 0 : (isMobile ? 3 : 5);  // Disable on iOS
    for (let i = 0; i < beamCount; i++) {
      const beamX = width * (0.3 + i * 0.15);
      const beamWidth = 40 + Math.random() * 30;
      const beamHeight = height * 0.6;
      // Triangle beam
      beamGraphics.fillTriangle(
        beamX, this.safeAreaTop,
        beamX - beamWidth / 2, beamHeight,
        beamX + beamWidth / 2, beamHeight
      );
    }

    // 4. CLOUDS/MIST - Misty forest atmosphere - giảm số lượng trên mobile
    this.cloudsLayer = this.scene.add.group();
    const cloudCount = isIOS ? 2 : (isMobile ? 3 : 5);
    for (let i = 0; i < cloudCount; i++) {
      const cloudX = i * 350 + Math.random() * 100;
      const cloudY = this.safeAreaTop + 100 + Math.random() * 150;
      const cloudContainer = this.scene.add.container(cloudX, cloudY);

      const cloud1 = this.scene.add.ellipse(0, 0, 120, 60, 0xD3D3D3, 0.3);
      const cloud2 = this.scene.add.ellipse(-40, -10, 80, 50, 0xD3D3D3, 0.25);
      const cloud3 = this.scene.add.ellipse(40, -5, 90, 45, 0xD3D3D3, 0.25);

      cloudContainer.add([cloud1, cloud2, cloud3]);
      cloudContainer.setData('baseX', cloudX);
      cloudContainer.setData('speed', 0.4 + Math.random() * 0.3);
      this.cloudsLayer.add(cloudContainer);
    }

    // 5. BIRDS/BUTTERFLIES - giảm số lượng trên mobile
    this.birdsLayer = this.scene.add.group();
    const butterflyCount = isIOS ? 2 : (isMobile ? 3 : 6);
    for (let i = 0; i < butterflyCount; i++) {
      const butterflyX = Math.random() * width;
      const butterflyY = this.safeAreaTop + 100 + Math.random() * 200;

      const butterflyGraphics = this.scene.add.graphics();
      // Simple butterfly (two ovals)
      butterflyGraphics.fillStyle(0xFF69B4, 0.8);
      butterflyGraphics.fillEllipse(-6, 0, 10, 14);
      butterflyGraphics.fillEllipse(6, 0, 10, 14);
      butterflyGraphics.fillStyle(0x000000, 1);
      butterflyGraphics.fillRect(-1, -2, 2, 8); // Body

      const butterflyTexture = butterflyGraphics.generateTexture('butterfly' + i, 16, 16);
      butterflyGraphics.destroy();

      const butterfly = this.scene.add.image(butterflyX, butterflyY, 'butterfly' + i);
      butterfly.setData('baseX', butterflyX);
      butterfly.setData('baseY', butterflyY);
      butterfly.setData('speed', 0.8 + Math.random() * 0.6);
      this.birdsLayer.add(butterfly);

      // Fluttering animation - disable on iOS
      if (!isIOS) {
        this.scene.tweens.add({
          targets: butterfly,
          scaleX: 0.7,
          scaleY: 1.2,
          duration: 200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    }

    // 6. FAR TREES - Dark silhouettes in distance
    const farTreeGraphics = this.scene.add.graphics();
    farTreeGraphics.fillStyle(0x1A2E1A, 0.7);
    for (let i = 0; i < 8; i++) {
      const x = i * 250;
      const treeHeight = 180 + Math.random() * 80;
      // Simple triangle tree
      farTreeGraphics.fillTriangle(
        x + 60, height - 200,
        x + 100, height - 200 - treeHeight,
        x + 140, height - 200
      );
      // Trunk
      farTreeGraphics.fillStyle(0x3E2723, 0.8);
      farTreeGraphics.fillRect(x + 90, height - 200, 20, 40);
      farTreeGraphics.fillStyle(0x1A2E1A, 0.7);
    }
    const farTreeTexture = farTreeGraphics.generateTexture('farTrees', width * 2, height);
    farTreeGraphics.destroy();

    this.farMountainsBg = this.scene.add.image(0, 0, 'farTrees').setOrigin(0);
    this.farMountainsBg2 = this.scene.add.image(width * 2, 0, 'farTrees').setOrigin(0);

    // 7. NEAR TREES - More detailed trees
    const treeGraphics = this.scene.add.graphics();
    for (let i = 0; i < 6; i++) {
      const x = i * 350;
      const treeHeight = 200 + Math.random() * 80;
      
      // Calculate positions
      const groundY = height - 100; // Where ground starts
      const trunkBottom = groundY; // Trunk starts at ground
      const trunkTop = groundY - treeHeight; // Top of trunk
      const crownCenter = trunkTop - 20; // Crown center slightly above trunk top

      // Tree trunk (vẽ trước để ở dưới tán)
      treeGraphics.fillStyle(0x4E342E, 1);
      treeGraphics.fillRect(x + 160, trunkTop, 30, treeHeight);

      // Tree shadow on trunk
      treeGraphics.fillStyle(0x3E2723, 0.4);
      treeGraphics.fillRect(x + 175, trunkTop, 15, treeHeight);

      // Tree crown (layered circles for foliage) - vẽ sau để ở trên thân
      treeGraphics.fillStyle(0x2D5016, 0.85);
      treeGraphics.fillCircle(x + 175, crownCenter, 85);
      treeGraphics.fillStyle(0x3D6B1C, 0.8);
      treeGraphics.fillCircle(x + 145, crownCenter + 15, 65);
      treeGraphics.fillCircle(x + 205, crownCenter + 15, 65);
      treeGraphics.fillCircle(x + 175, crownCenter + 30, 70);
      
      // Add lighter green highlights for depth
      treeGraphics.fillStyle(0x4CAF50, 0.6);
      treeGraphics.fillCircle(x + 165, crownCenter - 10, 40);
      treeGraphics.fillCircle(x + 185, crownCenter + 5, 35);
    }
    const treeTexture = treeGraphics.generateTexture('nearTrees', width * 2, height);
    treeGraphics.destroy();

    this.mountainsBg = this.scene.add.image(0, 0, 'nearTrees').setOrigin(0);
    this.mountainsBg2 = this.scene.add.image(width * 2, 0, 'nearTrees').setOrigin(0);

    // 8. FOREST FLOOR - Grass and bushes
    const floorGraphics = this.scene.add.graphics();

    // Ground (dark dirt)
    floorGraphics.fillStyle(0x3E2723, 1);
    floorGraphics.fillRect(0, height - 100, width * 2, 70);

    // Bushes and grass tufts
    floorGraphics.fillStyle(0x2E7D32, 0.9);
    for (let i = 0; i < 15; i++) {
      const bushX = i * 200 + Math.random() * 100;
      const bushY = height - 100;
      // Simple bush (three overlapping circles)
      floorGraphics.fillCircle(bushX, bushY, 25);
      floorGraphics.fillCircle(bushX - 20, bushY + 10, 20);
      floorGraphics.fillCircle(bushX + 20, bushY + 10, 20);
    }

    // Tall grass
    floorGraphics.fillStyle(0x4CAF50, 0.7);
    for (let i = 0; i < 30; i++) {
      const grassX = i * 100 + Math.random() * 50;
      const grassY = height - 100;
      // Simple grass blades (thin ellipses)
      for (let g = 0; g < 3; g++) {
        floorGraphics.fillEllipse(grassX + g * 5, grassY - 15, 3, 30);
      }
    }

    const floorTexture = floorGraphics.generateTexture('forestFloor', width * 2, 100);
    floorGraphics.destroy();

    this.riverBg = this.scene.add.image(0, height - 100, 'forestFloor').setOrigin(0);
    this.riverBg2 = this.scene.add.image(width * 2, height - 100, 'forestFloor').setOrigin(0);

    // 9. FIREFLIES/PARTICLES - Magical forest atmosphere - giảm số lượng trên mobile
    this.wavesLayer = this.scene.add.group();
    const fireflyCount = isIOS ? 3 : (isMobile ? 6 : 12);
    for (let i = 0; i < fireflyCount; i++) {
      const fireflyX = i * 150 + Math.random() * 100;
      const fireflyY = height - 200 + Math.random() * 100;

      const fireflyGraphics = this.scene.add.graphics();
      fireflyGraphics.fillStyle(0xFFFF99, 1);
      fireflyGraphics.fillCircle(0, 0, 3);
      fireflyGraphics.fillStyle(0xFFFF99, 0.5);
      fireflyGraphics.fillCircle(0, 0, 6);

      const fireflyTexture = fireflyGraphics.generateTexture('firefly' + i, 14, 14);
      fireflyGraphics.destroy();

      const firefly = this.scene.add.image(fireflyX, fireflyY, 'firefly' + i);
      firefly.setData('baseX', fireflyX);
      firefly.setData('baseY', fireflyY);
      this.wavesLayer.add(firefly);

      // Floating and glowing animation - disable on iOS
      if (!isIOS) {
        this.scene.tweens.add({
          targets: firefly,
          y: fireflyY - 30,
          alpha: 0.3,
          duration: 1500 + Math.random() * 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    }

    console.log('✨ Mystical forest scene created!');
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
      'beachIslands', 'tropicalBeach', 'tropicalOcean',
      'farTrees', 'nearTrees', 'forestFloor'
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
        `tropicalWave${i}`, `boat${i}`, `farBoat${i}`, `nearBoat${i}`,
        `butterfly${i}`, `firefly${i}`
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
   * Update parallax scrolling (optimized for mobile, extra optimization for iOS)
   */
  updateParallax(deltaInSeconds, scrollSpeed) {
    const scrollDistance = scrollSpeed * deltaInSeconds;
    this.frameCount++;

    // Detect iOS
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    // On mobile, throttle non-critical layers
    // iOS: every 3 frames (even more throttling)
    // Android: every 2 frames
    const throttleInterval = isIOS ? 3 : 2;
    const updateSlowLayers = !this.isMobile || (this.frameCount % throttleInterval === 0);

    // Clouds (slow) - throttled on mobile
    if (updateSlowLayers && this.cloudsLayer) {
      this.cloudsLayer.getChildren().forEach(cloud => {
        const speed = cloud.getData('speed') || 1;
        // Compensate for throttling: multiply distance by throttle interval
        const distance = this.isMobile ? scrollDistance * throttleInterval : scrollDistance;
        cloud.x -= distance * GAME_CONSTANTS.PARALLAX_CLOUDS * speed;
        if (cloud.x < -150) {
          cloud.x = this.scene.scale.width + 150;
        }
      });
    }

    // Birds/boats flying (very slow, natural movement) - throttled on mobile
    if (updateSlowLayers && this.birdsLayer) {
      this.birdsLayer.getChildren().forEach(bird => {
        const speed = bird.getData('speed') || 1;
        const distance = this.isMobile ? scrollDistance * throttleInterval : scrollDistance;
        bird.x -= distance * 0.3 * speed;
        // Add slight vertical bobbing - skip on iOS for performance
        if (!isIOS) {
          const baseY = bird.getData('baseY');
          bird.y = baseY + Math.sin(Date.now() * 0.001 + bird.x * 0.01) * 10;
        }

        if (bird.x < -50) {
          bird.x = this.scene.scale.width + 50;
          bird.setData('baseY', 80 + Math.random() * 150);
        }
      });
    }

    // Far mountains (slower than near mountains) - always update but simplified on mobile
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

    // Near mountains (medium) - always update (critical for visual quality)
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

    // River (fast, like ground) - always update (critical for visual quality)
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

    // Waves (fast with water) - always update
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
