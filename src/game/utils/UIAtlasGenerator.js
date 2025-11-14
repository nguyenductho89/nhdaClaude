/**
 * UIAtlasGenerator
 * Generates texture atlas from emojis and UI elements at runtime
 */
export class UIAtlasGenerator {
  static generateUIAtlas(scene) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Atlas size - enough for all UI elements
    canvas.width = 512;
    canvas.height = 512;

    const elements = {
      // Collectible items
      'tien': { emoji: '💰', size: 48, x: 0, y: 0 },
      'tin': { emoji: '❤️', size: 48, x: 64, y: 0 },
      'nha': { emoji: '🏡', size: 48, x: 128, y: 0 },
      'xe': { emoji: '🚗', size: 48, x: 192, y: 0 },
      'vang': { emoji: '💍', size: 48, x: 256, y: 0 },

      // Obstacles
      'stress': { emoji: '😰', size: 48, x: 0, y: 64 },
      'deadline': { emoji: '⏰', size: 48, x: 64, y: 64 },
      'work': { emoji: '💼', size: 48, x: 128, y: 64 },
      'boss': { emoji: '👔', size: 48, x: 192, y: 64 },
      'overtime': { emoji: '🌙', size: 48, x: 256, y: 64 },
      'meeting': { emoji: '📊', size: 48, x: 320, y: 64 },

      // UI icons
      'pause': { emoji: '⏸', size: 32, x: 0, y: 128 },
      'jump': { emoji: '⬆', size: 56, x: 64, y: 128 },
      'fire': { emoji: '🔥', size: 32, x: 128, y: 128 },
      'star': { emoji: '⭐', size: 32, x: 192, y: 128 },

      // UI backgrounds (generated shapes)
      'button_bg': { type: 'circle', size: 50, color: '#FFFFFF', alpha: 0.4, x: 0, y: 192 },
      'button_border': { type: 'circle', size: 54, color: '#FFFFFF', alpha: 0.2, x: 64, y: 192 }
    };

    // Draw all elements
    for (const [key, config] of Object.entries(elements)) {
      if (config.emoji) {
        // Draw emoji
        ctx.font = `${config.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(config.emoji, config.x + config.size/2, config.y + config.size/2);
      } else if (config.type === 'circle') {
        // Draw circle
        ctx.globalAlpha = config.alpha;
        ctx.fillStyle = config.color;
        ctx.beginPath();
        ctx.arc(config.x + config.size/2, config.y + config.size/2, config.size/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // Create texture from canvas
    const texture = scene.textures.createCanvas('ui-atlas', canvas.width, canvas.height);
    texture.draw(0, 0, canvas);
    texture.refresh();

    // Store frame data for easy access
    const frames = {};
    for (const [key, config] of Object.entries(elements)) {
      frames[key] = {
        x: config.x,
        y: config.y,
        width: config.size,
        height: config.size
      };
    }

    return { texture: 'ui-atlas', frames };
  }

  /**
   * Generate bitmap font from system font
   */
  static generateBitmapFont(scene, fontName = 'game-font') {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Font configuration
    const fontSize = 24;
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz:+-.!? ĐđÂâÊêÔôƠơƯưẮắẰằẲẳẴẵẶặẤấẦầẨẩẪẫẬậẾếỀềỂểỄễỆệỐốỒồỔổỖỗỘộỚớỜờỞởỠỡỢợỨứỪừỬửỮữỰựÁáÀàẢảÃãẠạÉéÈèẺẻẼẽẸẹÍíÌìỈỉĩĩỊịÓóÒòỎỏÕõỌọÚúÙùỦủŨũỤụÝýỲỳỶỷỸỹỴỵ';

    canvas.width = 1024;
    canvas.height = 256;

    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const charData = {};
    let x = 0;
    let y = 0;
    const padding = 2;

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const metrics = ctx.measureText(char);
      const charWidth = Math.ceil(metrics.width) + padding * 2;

      // Wrap to next line if needed
      if (x + charWidth > canvas.width) {
        x = 0;
        y += fontSize + padding * 2;
      }

      // Draw character
      ctx.fillText(char, x + padding, y + padding);

      // Store character data
      charData[char.charCodeAt(0)] = {
        x: x,
        y: y,
        width: charWidth,
        height: fontSize + padding * 2
      };

      x += charWidth;
    }

    // Create texture
    const texture = scene.textures.createCanvas(fontName, canvas.width, canvas.height);
    texture.draw(0, 0, canvas);
    texture.refresh();

    return { texture: fontName, charData, fontSize };
  }
}
