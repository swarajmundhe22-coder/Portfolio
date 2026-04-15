# Deploy Storybook to Vercel or Netlify

## Quick Deployment (Choose One)

### Option 1: Vercel (Recommended)
```bash
npm install -g vercel
cd Portfolio-main
vercel
# Follow the prompts and select your deployment preferences
# After deployment, copy the URL (e.g., https://your-project.vercel.app)
```

### Option 2: Netlify
```bash
npm install -g netlify-cli
cd Portfolio-main
netlify deploy --dir=storybook-static
# Follow prompts and copy the live URL
```

### Option 3: GitHub Pages
```bash
npm install --save-dev gh-pages
# Add to package.json: "storybook:deploy": "npm run storybook:build && npx gh-pages -d storybook-static"
npm run storybook:deploy
# Enable in GitHub: Settings → Pages → gh-pages / (root)
# Your URL: https://Sartahkakaedar.github.io/On-Lookers-Founder-Portfolio-
```

## After Deployment

1. Copy your live Storybook URL
2. Update `src/data/portfolioData.ts`:
   - Line 451: Replace `https://storybook.example.com` with your URL
   - Line 470-471: Replace other placeholder URLs

3. Push to GitHub and verify it works!

The Storybook build is ready in: `storybook-static/`
