import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const snapshotsDir = path.join(repoRoot, 'tests', 'visual-regression.spec.ts-snapshots');
const referenceDir = path.join(repoRoot, 'analysis', 'pixelmatch-reference');

const viewports = ['1440', '768', '375'];
const minSimilarity = 0.98;

const readPng = (filePath) => PNG.sync.read(fs.readFileSync(filePath));

const cropToSize = (source, width, height) => {
  const cropped = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    const sourceStart = (y * source.width) * 4;
    const sourceEnd = sourceStart + width * 4;
    const targetStart = (y * width) * 4;
    source.data.copy(cropped, targetStart, sourceStart, sourceEnd);
  }

  return cropped;
};

const comparePngs = (baselinePath, candidatePath) => {
  const baseline = readPng(baselinePath);
  const candidate = readPng(candidatePath);

  const width = Math.min(baseline.width, candidate.width);
  const height = Math.min(baseline.height, candidate.height);
  const baselineData = cropToSize(baseline, width, height);
  const candidateData = cropToSize(candidate, width, height);

  const totalPixels = width * height;
  const diffPixels = pixelmatch(
    baselineData,
    candidateData,
    undefined,
    width,
    height,
    {
      threshold: 0.1,
      includeAA: true,
    },
  );

  const similarity = 1 - diffPixels / totalPixels;
  return {
    diffPixels,
    totalPixels,
    similarity,
  };
};

const failures = [];

for (const viewport of viewports) {
  const candidatePath = path.join(snapshotsDir, `full-page-${viewport}-chromium-win32.png`);
  const referencePath = path.join(referenceDir, `full-page-${viewport}-reference.png`);

  if (!fs.existsSync(candidatePath)) {
    failures.push(
      `Missing Chromium snapshot for viewport ${viewport}: ${path.relative(repoRoot, candidatePath)}. Run npm.cmd run test:visual:update first.`,
    );
    continue;
  }

  if (!fs.existsSync(referencePath)) {
    failures.push(
      `Missing reference frame for viewport ${viewport}: ${path.relative(repoRoot, referencePath)}. Regenerate with updated baselines.`,
    );
    continue;
  }

  const { diffPixels, totalPixels, similarity } = comparePngs(referencePath, candidatePath);
  const similarityPct = (similarity * 100).toFixed(2);
  const ratio = `${diffPixels}/${totalPixels}`;

  if (similarity < minSimilarity) {
    failures.push(
      `Viewport ${viewport} similarity ${similarityPct}% is below ${(minSimilarity * 100).toFixed(0)}% (${ratio}).`,
    );
  } else {
    console.log(`Viewport ${viewport} similarity ${similarityPct}% (${ratio})`);
  }
}

if (failures.length > 0) {
  console.error('\nPixelmatch parity check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('\nPixelmatch parity check passed for 1440 / 768 / 375 viewports.');
