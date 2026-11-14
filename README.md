# MarketForge REAL — Netlify edition

Static HTML/CSS/JS in the project root; Netlify Functions in `netlify/functions/api.mjs`. Seven-layer interactive navigator preserved.

## Deploy
1. Extract ZIP. Upload the **contents** of this folder to a GitHub repository.
2. In Netlify choose **Add new project → Import an existing project**, select repo. Publish directory: `.`; no build command required.
3. Netlify reads `netlify.toml` and deploys the API function automatically. **Do not use drag-and-drop static deployment**: it may not build Functions.
4. Open your Netlify URL and check `/api/health`.
5. Optional AI: set `OPENAI_API_KEY` in Netlify site environment variables, redeploy. This may incur API usage charges; without it, AI is disabled. Keep key server-side, never in HTML/JS.

## Local development
Install Node.js and Netlify CLI: `npm install -g netlify-cli`, then run `netlify dev` from the root.

## Scope
Quotes from Stooq (delayed stocks/ETFs) and Coinbase public crypto spot endpoint; providers may be rate limited or unavailable. No simulated prices. RRSP notes/watchlists use browser localStorage only, not shared across devices. No trading, issuing securities, or automated exchange listing. Bond ETFs are funds, not individual bonds.
