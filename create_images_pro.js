import { Jimp } from 'jimp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.join(__dirname, 'public/work');

// Professional color palette
const colors = {
  bg: 0x0f1419ff,
  bgLight: 0x1a2332ff,
  accentBlue: 0x00d9ffff,
  accentPink: 0xff006eff,
  green: 0x10b981ff,
  amber: 0xf59e0bff,
  red: 0xef4444ff,
  gray800: 0x1f2937ff,
  gray700: 0x374151ff,
  gray600: 0x4b5563ff,
  gray400: 0x9ca3afff,
  lightText: 0xffffffff,
  darkText: 0x0f1419ff,
};

function drawFilledRect(img, x, y, w, h, color) {
  for (let px = x; px < x + w; px++) {
    for (let py = y; py < y + h; py++) {
      if (px >= 0 && py >= 0 && px < img.bitmap.width && py < img.bitmap.height) {
        img.setPixelColor(color, px, py);
      }
    }
  }
}

function drawBorder(img, x, y, w, h, color, thickness = 2) {
  // Top
  for (let px = x; px < x + w; px++) {
    for (let t = 0; t < thickness; t++) {
      if (px < img.bitmap.width && y + t < img.bitmap.height && y + t >= 0) {
        img.setPixelColor(color, px, y + t);
      }
    }
  }
  // Bottom
  for (let px = x; px < x + w; px++) {
    for (let t = 0; t < thickness; t++) {
      if (px < img.bitmap.width && y + h - 1 - t < img.bitmap.height && y + h - 1 - t >= 0) {
        img.setPixelColor(color, px, y + h - 1 - t);
      }
    }
  }
  // Left
  for (let py = y; py < y + h; py++) {
    for (let t = 0; t < thickness; t++) {
      if (x + t >= 0 && x + t < img.bitmap.width && py < img.bitmap.height) {
        img.setPixelColor(color, x + t, py);
      }
    }
  }
  // Right
  for (let py = y; py < y + h; py++) {
    for (let t = 0; t < thickness; t++) {
      if (x + w - 1 - t >= 0 && x + w - 1 - t < img.bitmap.width && py < img.bitmap.height) {
        img.setPixelColor(color, x + w - 1 - t, py);
      }
    }
  }
}

function drawGradient(img, x, y, w, h, colorStart, colorEnd, horizontal = true) {
  const steps = horizontal ? w : h;
  for (let i = 0; i < steps; i++) {
    const ratio = i / steps;
    const r = Math.round(((colorStart >> 24) & 255) * (1 - ratio) + ((colorEnd >> 24) & 255) * ratio);
    const g = Math.round(((colorStart >> 16) & 255) * (1 - ratio) + ((colorEnd >> 16) & 255) * ratio);
    const b = Math.round(((colorStart >> 8) & 255) * (1 - ratio) + ((colorEnd >> 8) & 255) * ratio);
    const color = (r << 24) | (g << 16) | (b << 8) | 0xff;

    if (horizontal) {
      for (let py = y; py < y + h; py++) {
        if (x + i < img.bitmap.width && py < img.bitmap.height) {
          img.setPixelColor(color, x + i, py);
        }
      }
    } else {
      for (let px = x; px < x + w; px++) {
        if (px < img.bitmap.width && y + i < img.bitmap.height) {
          img.setPixelColor(color, px, y + i);
        }
      }
    }
  }
}

function drawChart(img, x, y, w, h, dataPoints, color) {
  const barWidth = Math.floor(w / dataPoints.length);
  const maxVal = Math.max(...dataPoints);

  for (let i = 0; i < dataPoints.length; i++) {
    const barHeight = Math.round((dataPoints[i] / maxVal) * (h - 20));
    const barX = x + i * barWidth + 5;
    const barY = y + h - barHeight - 10;
    drawFilledRect(img, barX, barY, barWidth - 10, barHeight, color);
  }
}

async function createSilentDecay() {
  const img = new Jimp({ width: 1200, height: 700, color: colors.bg });

  // Header gradient background
  drawGradient(img, 0, 0, 1200, 120, 0x0f1419ff, 0x1a2855ff);

  // Title area with glow effect
  drawFilledRect(img, 100, 40, 600, 80, 0x00d9ff22);
  drawBorder(img, 100, 40, 600, 80, colors.accentBlue, 1);

  // Main visualization area - deterioration curve
  drawFilledRect(img, 80, 160, 1040, 400, colors.bgLight);
  drawBorder(img, 80, 160, 1040, 400, colors.gray700, 2);

  // Deterioration stages with smooth transitions
  const stages = [
    { x: 150, label: 'Baseline', color: colors.green },
    { x: 420, label: 'Aging', color: colors.amber },
    { x: 690, label: 'Critical', color: colors.red },
    { x: 960, label: 'Failure', color: 0x7f0000ff },
  ];

  stages.forEach((stage, idx) => {
    // Stage indicator circle with gradient
    drawFilledRect(img, stage.x - 25, 190, 50, 50, stage.color);
    drawBorder(img, stage.x - 25, 190, 50, 50, colors.lightText, 2);

    // Stage data visualization (deterioration curve)
    const deteriorationCurve = [50, 70, 85, 95, 100].map((v, i) => {
      return Math.round((v * (idx + 1)) / 4);
    });

    drawChart(img, stage.x - 45, 280, 90, 150, deteriorationCurve, stage.color);
  });

  // Risk metrics at bottom with colored bars
  const metrics = [
    { label: 'Risk', value: 87, color: colors.red, x: 200 },
    { label: 'Assets', value: 2341, color: colors.accentBlue, x: 500 },
    { label: 'Predictions', value: 15, color: colors.amber, x: 800 },
  ];

  metrics.forEach((m) => {
    drawFilledRect(img, m.x - 60, 600, 120, 50, colors.gray800);
    drawBorder(img, m.x - 60, 600, 120, 50, m.color, 2);
  });

  // Bottom accent line
  drawFilledRect(img, 0, 680, 1200, 20, colors.accentBlue);

  await img.write(path.join(OUTPUT_DIR, 'silent-decay-founder.png'));
  console.log('✅ Created: silent-decay-founder.png (Professional infrastructure visualization)');
}

async function createPortfolioSystem() {
  const img = new Jimp({ width: 1200, height: 700, color: colors.bg });

  // Gradient header
  drawGradient(img, 0, 0, 1200, 140, 0x0f1419ff, 0x2d1b4eff);

  // Title with accent
  drawFilledRect(img, 50, 30, 1100, 80, 0xff006e22);
  drawBorder(img, 50, 30, 1100, 80, colors.accentPink, 2);

  // Component showcase grid (3x3) with modern card design
  const components = [
    { name: 'Button', icon: '◆' },
    { name: 'Input', icon: '▢' },
    { name: 'Card', icon: '▭' },
    { name: 'Form', icon: '||' },
    { name: 'Modal', icon: '◇' },
    { name: 'Dropdown', icon: '▼' },
    { name: 'Avatar', icon: '●' },
    { name: 'Badge', icon: '◈' },
    { name: 'Toast', icon: '▪' },
  ];

  let idx = 0;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const x = 120 + col * 340;
      const y = 180 + row * 140;

      // Card background with gradient
      drawGradient(img, x, y, 310, 110, colors.gray800, colors.bgLight);
      drawBorder(img, x, y, 310, 110, colors.accentPink, 2);

      // Component name with styling
      drawFilledRect(img, x + 20, y + 20, 270, 35, 0xff006e33);

      // Stats bar at bottom
      drawFilledRect(img, x + 20, y + 70, 270, 15, colors.green);
    }
  }

  // Features bar at bottom
  drawFilledRect(img, 0, 630, 400, 70, colors.green);
  drawFilledRect(img, 400, 630, 400, 70, colors.accentBlue);
  drawFilledRect(img, 800, 630, 400, 70, colors.accentPink);

  await img.write(path.join(OUTPUT_DIR, 'portfolio-system.png'));
  console.log('✅ Created: portfolio-system.png (Stunning component library showcase)');
}

async function createSupabaseArchitecture() {
  const img = new Jimp({ width: 1200, height: 700, color: colors.bg });

  // Gradient background for header
  drawGradient(img, 0, 0, 1200, 130, 0x0f1419ff, 0x1a3a52ff);

  // Architecture layers with modern design
  const layers = [
    { name: 'Client', x: 100, color: 0x00d9ffaa },
    { name: 'API\nGateway', x: 350, color: 0x00d9ff88 },
    { name: 'Edge\nFunctions', x: 600, color: 0x00d9ff66 },
    { name: 'PostgreSQL\nDatabase', x: 850, color: 0x00d9ff44 },
  ];

  // Draw architecture boxes with depth
  layers.forEach((layer, idx) => {
    const boxW = 200;
    const boxH = 120;
    const startY = 200;

    // Shadow effect
    drawFilledRect(img, layer.x + 3, startY + 3, boxW, boxH, colors.darkText);

    // Main box with gradient
    drawGradient(img, layer.x, startY, boxW, boxH, layer.color, 0x00d9ff22);
    drawBorder(img, layer.x, startY, boxW, boxH, colors.accentBlue, 3);

    // Connection lines with arrows
    if (idx < layers.length - 1) {
      const nextX = layers[idx + 1].x;
      const lineY = startY + 60;
      for (let x = layer.x + boxW; x < nextX; x++) {
        if (x < img.bitmap.width) {
          img.setPixelColor(colors.accentBlue, x, lineY);
        }
      }
    }
  });

  // Key features showcase
  const features = [
    { text: 'Real-time', x: 200, color: colors.accentPink },
    { text: 'Scalable', x: 500, color: colors.green },
    { text: 'Secure', x: 800, color: colors.amber },
    { text: 'Fast', x: 1000, color: colors.accentBlue },
  ];

  features.forEach((f) => {
    drawFilledRect(img, f.x - 50, 420, 100, 60, colors.gray800);
    drawBorder(img, f.x - 50, 420, 100, 60, f.color, 2);
  });

  // Performance metrics at bottom
  drawFilledRect(img, 50, 580, 350, 90, 0x10b98133);
  drawBorder(img, 50, 580, 350, 90, colors.green, 2);

  drawFilledRect(img, 425, 580, 350, 90, 0x00d9ff33);
  drawBorder(img, 425, 580, 350, 90, colors.accentBlue, 2);

  drawFilledRect(img, 800, 580, 350, 90, 0xff006e33);
  drawBorder(img, 800, 580, 350, 90, colors.accentPink, 2);

  await img.write(path.join(OUTPUT_DIR, 'supabase-architecture.png'));
  console.log('✅ Created: supabase-architecture.png (Beautiful system architecture)');
}

async function createGithubActionsPipeline() {
  const img = new Jimp({ width: 1200, height: 700, color: colors.bg });

  // Gradient header
  drawGradient(img, 0, 0, 1200, 130, 0x0f1419ff, 0x1a3a1aff);

  // Pipeline visualization
  const stages = [
    { name: 'Lint', x: 120, color: colors.green, status: '✓' },
    { name: 'Test', x: 330, color: colors.green, status: '✓' },
    { name: 'Build', x: 540, color: colors.green, status: '✓' },
    { name: 'Deploy', x: 750, color: colors.green, status: '✓' },
    { name: 'Monitor', x: 960, color: colors.accentBlue, status: '⊙' },
  ];

  // Draw pipeline stages
  stages.forEach((stage, idx) => {
    // Stage box with 3D effect
    drawFilledRect(img, stage.x + 2, 220, 140, 140, colors.darkText);

    // Main stage box
    drawGradient(img, stage.x, 210, 140, 140, stage.color, 0x10b98144);
    drawBorder(img, stage.x, 210, 140, 140, stage.color, 3);

    // Connecting line
    if (idx < stages.length - 1) {
      const nextX = stages[idx + 1].x;
      const lineY = 280;
      for (let x = stage.x + 140; x < nextX; x++) {
        if (x < img.bitmap.width && lineY < img.bitmap.height) {
          img.setPixelColor(colors.gray700, x, lineY);
          img.setPixelColor(colors.gray700, x, lineY + 1);
        }
      }
    }
  });

  // Performance metrics cards
  const metrics = [
    { title: 'Coverage', value: '92%', x: 150, bg: 0x10b98144 },
    { title: 'Tests', value: '847', x: 450, bg: 0x10b98144 },
    { title: 'Speed', value: '4m', x: 750, bg: 0xf59e0b44 },
    { title: 'Status', value: '✓OK', x: 1000, bg: 0x10b98144 },
  ];

  metrics.forEach((m) => {
    drawFilledRect(img, m.x - 40, 450, 150, 100, colors.gray800);
    drawBorder(img, m.x - 40, 450, 150, 100, m.bg === 0x10b98144 ? colors.green : colors.amber, 2);

    // Color bar at top
    drawFilledRect(img, m.x - 40, 450, 150, 8, m.bg === 0x10b98144 ? colors.green : colors.amber);
  });

  // Summary bar
  drawFilledRect(img, 50, 620, 1100, 60, colors.gray800);
  drawBorder(img, 50, 620, 1100, 60, colors.green, 2);

  await img.write(path.join(OUTPUT_DIR, 'github-actions-pipeline.png'));
  console.log('✅ Created: github-actions-pipeline.png (Sleek CI/CD visualization)');
}

async function main() {
  try {
    console.log('\n🎨 Creating premium work showcase images...\n');
    await Promise.all([
      createSilentDecay(),
      createPortfolioSystem(),
      createSupabaseArchitecture(),
      createGithubActionsPipeline(),
    ]);
    console.log('\n✨ All images created with professional polish!\n');
  } catch (error) {
    console.error('[ERROR]', error.message);
    process.exit(1);
  }
}

main();
