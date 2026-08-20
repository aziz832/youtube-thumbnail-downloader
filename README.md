# YouTube Thumbnail Downloader

Free online tool to download YouTube video thumbnails in every available resolution — HD, SD, HQ, and 4K — without signing up or installing anything.

**Live tool:** https://thumbnail-downloader.online/

## Features

- Paste any YouTube link (watch, youtu.be, Shorts, embed, live, or bare video ID)
- Get all available thumbnail resolutions instantly
- Original-quality images with no watermark
- 34 language versions
- Free, no sign-up, unlimited downloads
- No video downloads — thumbnails only, privacy-friendly

## How it works

1. Paste a YouTube URL into the input
2. The tool extracts the video ID and builds every valid thumbnail URL
3. Preview all resolutions and download the one you need

## Tech

- Cloudflare Workers + Assets (global edge, free tier)
- Static HTML/CSS/JS — no backend, no tracking of your activity
- Fully translated via hreflang to 34 languages

## Repository layout

- src/index.js — Cloudflare Worker (canonical redirects, security headers, assets)
- public/ — built static site
- 	ools/ — build tooling (content, translations, sitemap generation)
- wrangler.toml — Cloudflare deployment config

## Local development

\\\ash
npx wrangler dev --config wrangler.toml
\\\

## License

Private repository — all rights reserved.
