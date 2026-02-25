# LV Designer Pro — Deployment Guide

Your app is a **single-file static web app**. It builds into one `index.html` file that works anywhere.

---

## 🚀 Quickest Options (Free, No Server Needed)

### Option 1: Netlify Drop (30 seconds)
1. Run `npm run build` locally
2. Go to https://app.netlify.com/drop
3. Drag the `dist/` folder onto the page
4. Done! You get a free URL like `https://your-app-name.netlify.app`
5. Optional: Add a custom domain in Netlify settings

### Option 2: Netlify via GitHub (Auto-deploys)
1. Push your code to GitHub
2. Go to https://app.netlify.com → "Add new site" → "Import from Git"
3. Select your repo
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Click "Deploy"
7. Every push to `main` auto-deploys!

### Option 3: Vercel (Auto-deploys)
1. Push your code to GitHub
2. Go to https://vercel.com → "New Project" → Import your repo
3. It auto-detects Vite — just click "Deploy"
4. Every push to `main` auto-deploys!

### Option 4: GitHub Pages (Free)
1. Push your code to GitHub
2. Install gh-pages: `npm install -D gh-pages`
3. Add to package.json scripts: `"deploy": "npm run build && gh-pages -d dist"`
4. Run: `npm run deploy`
5. Enable GitHub Pages in repo Settings → Pages → Source: gh-pages branch

---

## 🖥️ Self-Hosted Options

### Option 5: Any Web Server (Apache/Nginx/IIS)
Since the build produces a single `index.html` file, just:
1. Run `npm run build`
2. Copy `dist/index.html` to your web server's public folder
3. That's it — no server-side code needed!

**Apache** — just drop the file in `/var/www/html/`
**Nginx** — put it in your configured `root` directory
**IIS** — place in `wwwroot`

### Option 6: Amazon S3 + CloudFront
1. Create an S3 bucket with static website hosting enabled
2. Upload `dist/index.html`
3. Optional: Add CloudFront CDN for HTTPS and caching

### Option 7: Docker
```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
EXPOSE 80
```
Then: `docker build -t lv-designer . && docker run -p 80:80 lv-designer`

---

## 💻 Running Locally (Without Internet)

### Option A: Just open the file
1. Run `npm run build`
2. Open `dist/index.html` directly in your browser
3. Works offline! (Note: PDF import needs internet for PDF.js CDN)

### Option B: Local server
1. Run `npm run build`
2. Run `npx serve dist`
3. Open `http://localhost:3000`

### Option C: Development mode
1. Run `npm run dev`
2. Open `http://localhost:5173`
3. Live reload on code changes

---

## 🌐 Custom Domain Setup

### On Netlify:
1. Go to Site settings → Domain management → Add custom domain
2. Add your domain (e.g., `lvdesigner.yourcompany.com`)
3. Update your domain's DNS:
   - CNAME record: `your-app.netlify.app`
4. Netlify provides free SSL automatically

### On Vercel:
1. Go to Project settings → Domains
2. Add your domain
3. Update DNS as instructed
4. Free SSL included

---

## 📋 Summary

| Method | Cost | Effort | Auto-Deploy | Custom Domain |
|--------|------|--------|-------------|---------------|
| Netlify Drop | Free | ⭐ Easiest | ❌ | ✅ |
| Netlify Git | Free | ⭐⭐ | ✅ | ✅ |
| Vercel | Free | ⭐⭐ | ✅ | ✅ |
| GitHub Pages | Free | ⭐⭐⭐ | ✅ | ✅ |
| S3 + CloudFront | ~$1/mo | ⭐⭐⭐⭐ | ❌ | ✅ |
| Own Server | Varies | ⭐⭐⭐⭐⭐ | ❌ | ✅ |
| Open HTML file | Free | ⭐ | ❌ | ❌ |

**Recommended: Netlify Drop** for quick sharing, **Netlify Git** for ongoing development.
