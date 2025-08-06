# Deployment Guide

## GitHub Pages Setup

### Option 1: Automatic Deployment (Recommended)

1. Push your code to GitHub
2. Go to your repository settings
3. Navigate to "Pages" in the sidebar
4. Select "GitHub Actions" as the source
5. The GitHub Actions workflow will automatically build and deploy on every push to main

### Option 2: Manual Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy to GitHub Pages:
```bash
npm run deploy
```

### Option 3: Manual GitHub Pages Setup

1. Build the project:
```bash
npm run build
```

2. Go to your repository settings
3. Navigate to "Pages" in the sidebar
4. Select "Deploy from a branch"
5. Choose the `gh-pages` branch and `/ (root)` folder
6. Click "Save"

## Configuration

Update the `homepage` field in `package.json` with your actual GitHub Pages URL:

```json
{
  "homepage": "https://yourusername.github.io/directed-color-picker"
}
```

Replace `yourusername` with your actual GitHub username.

## Troubleshooting

- If you see build errors, make sure you're using Node.js 18+ and have the legacy OpenSSL provider set
- The build command includes `export NODE_OPTIONS="--openssl-legacy-provider"` to handle Node.js 17+ compatibility
- Make sure all dependencies are installed with `npm install` 