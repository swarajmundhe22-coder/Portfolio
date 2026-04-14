# Video Visual Baselines

This directory stores golden-master images for deterministic video keyframe visual regression.

Structure:
- `tests/visual-baseline/chromium/*.png`
- `tests/visual-baseline/firefox/*.png`
- `tests/visual-baseline/webkit/*.png`

Keyframe names:
- `stack-video-00-00.png`
- `stack-video-00-30.png`
- `stack-video-01-15.png`
- `stack-video-02-45.png`

Update baselines:
- `npm.cmd run test:video:visual:update`

Run assertions:
- `npm.cmd run test:video:visual`
