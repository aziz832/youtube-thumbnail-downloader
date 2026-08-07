export const EN_UI = {
  copy: "Copy URL",
  copied: "Copied!",
  clear: "Clear",
  qThumb1: "Thumb 1",
  qThumb2: "Thumb 2",
};

export const EN_LABELS = {
  guidesH2: "Guides",
  siteH2: "Site",
  guidesCrumb: "Guides",
  langLabel: "Language",
  blogIndexTitle: "Guides — YouTube Thumbnail Downloader",
  blogIndexMeta:
    "Guides on downloading YouTube thumbnails, thumbnail sizes, best practices, CTR, and tools. Learn how to get any video thumbnail in HD for free.",
  blogIndexSubtitle: "Learn how to download and design YouTube thumbnails.",
  blogCtaH2: "Download a thumbnail now",
  blogCtaP:
    "Paste any YouTube link into the tool above to preview and download every available thumbnail size for free.",
};

export const EN_FAQ = [
  ["Is the YouTube thumbnail downloader free?", "Yes — it is 100% free with no hidden fees, no sign-up, and no download limits."],
  ["What is the highest quality thumbnail I can download?", "The maximum is 1280x720 (maxresdefault). This tool always fetches that file first and falls back to the next-best size when it is missing."],
  ["Do I need an account or login?", "No. There is no account, email, or password — the tool is completely anonymous."],
  ["Can I download thumbnails from YouTube Shorts?", "Yes — /shorts/ links are supported and return the same set of sizes as regular videos."],
  ["Does it add a watermark?", "No. Downloaded images are the exact original files from YouTube's servers, with no watermark or branding."],
  ["Why is the HD thumbnail missing for some videos?", "The 1280x720 image is only generated when the uploader enabled a high-quality thumbnail. Older or low-resolution uploads may only have smaller sizes."],
  ["What formats are the downloaded files?", "Thumbnails are standard JPG (JPEG) image files that open in any viewer or editor."],
  ["Which YouTube URL formats are supported?", "watch links, youtu.be short links, /shorts/, /embed/, /live/, and a bare 11-character video ID."],
  ["Is my video link stored anywhere?", "No. Links are processed locally in your browser and never uploaded to a server."],
  ["Can I download thumbnails from private videos?", "No — only public videos with publicly accessible thumbnails can be downloaded."],
];

export const EN_HOME = {
  qnHow: "How It Works",
  qnFeatures: "Features",
  qnUses: "Who Uses It",
  qnRes: "Resolutions",
  qnFaq: "FAQ",
  statFree: "Free forever",
  statRes: "Resolutions",
  statLogin: "Login required",
  statMax: "Max quality",
  howH2: "How It Works",
  howCards: [
    ["Copy the YouTube URL", "Open any YouTube video and copy its link from the address bar or share button. Watch, Shorts, embed, and youtu.be links all work."],
    ["Paste & preview", "Paste the link into the box and press Enter. The video metadata loads and every thumbnail size is fetched at once."],
    ["Download instantly", "Click Download on the size you want — the original JPG saves straight to your device. No watermark, no sign-up."],
  ],
  featuresH2: "Features",
  features: [
    ["HD & 4K-quality originals", "Every thumbnail is the original file from YouTube's image CDN — no re-compression, no quality loss."],
    ["No watermark, ever", "Downloaded images are exactly what YouTube stores, with nothing overlaid on top."],
    ["No account needed", "No email, no password, no sign-up. The tool is completely anonymous to use."],
    ["All 5 resolutions", "Get maxresdefault HD, SD, HQ, MQ, and the tiny default image for any video."],
    ["Shorts & live streams", "Watch links, Shorts, embeds, youtu.be, and live stream URLs are all detected automatically."],
    ["100% private", "Links are processed in your browser. Nothing is stored, collected, or shared."],
  ],
  usesH2: "Who Uses Our YouTube Thumbnail Downloader?",
  uses: [
    ["Content creators", "Study competitor thumbnails, get design inspiration, and archive your own uploads."],
    ["Digital marketers", "Download thumbnails for A/B testing, competitive research, and campaign planning."],
    ["Graphic designers", "Save covers as visual references for mood boards, presentations, and client work."],
    ["Educators & researchers", "Grab thumbnails for lectures, media-literacy classes, and visual communication research."],
  ],
  resH2: "Supported Resolutions",
  resHead: { size: "Size", dim: "Dimensions", file: "File", notes: "Notes" },
  resolutions: [
    ["Max HD", "1280 × 720", "maxresdefault", "Only when the uploader used a high-quality thumbnail"],
    ["SD", "640 × 480", "sddefault", "Available for almost every video"],
    ["HQ", "480 × 360", "hqdefault", "The classic sidebar size"],
    ["MQ", "320 × 180", "mqdefault", "Compact 16:9 preview"],
    ["Default", "120 × 90", "default.jpg", "Small playlist icon"],
    ["Thumb 1 / Thumb 2", "120 × 90", "1.jpg / 2.jpg", "Additional row frames"],
  ],
  whatH2: "What Is a YouTube Thumbnail Downloader?",
  whatP1:
    "A YouTube thumbnail downloader extracts the preview image of any video from its public image CDN and saves it to your device. You only need the video link — the tool finds the video ID automatically, checks every available resolution, and lets you download the HD, SD, or HQ version with one click. It is useful for creating custom thumbnails for your own videos, referencing designs, or simply saving a frame you like.",
  whatP2:
    "Unlike screenshots, the downloaded file is the original image YouTube stores — sharp at full resolution and free of player UI, play buttons, and compression artifacts.",
  urlH2: "Supported URL Formats",
  urlP: "The tool detects the video ID from every common YouTube link format:",
  urlList: [
    "Standard: youtube.com/watch?v=VIDEO_ID",
    "Short: youtu.be/VIDEO_ID",
    "Embedded: youtube.com/embed/VIDEO_ID",
    "Shorts: youtube.com/shorts/VIDEO_ID",
    "Live streams and playlist video URLs",
    "A bare 11-character video ID",
  ],
  whyH2: "Why Use a Thumbnail Downloader Instead of a Screenshot?",
  whyP1:
    "Screenshots capture the player on screen: compressed, small, and covered with the play button and UI. A downloader fetches the original file from YouTube's servers at its true resolution, so the image stays sharp when you crop, zoom, or place it in a design.",
  whyP2:
    "You also get every size YouTube offers at once, instead of hunting through the page source for image URLs.",
  faqH2: "Frequently Asked Questions",
  faqExtra: [
    ["What is the highest quality thumbnail I can download?", "The maximum is 1280x720 (maxresdefault). This tool always fetches that file first and falls back to the next-best size when it is missing."],
    ["Why is the HD thumbnail missing for some videos?", "The 1280x720 image is only generated when the uploader enabled a high-quality thumbnail. Older or low-resolution uploads may only have smaller sizes."],
    ["What formats are the downloaded files?", "Thumbnails are standard JPG (JPEG) image files that open in any viewer or editor."],
    ["Which YouTube URL formats are supported?", "watch links, youtu.be short links, /shorts/, /embed/, /live/, and a bare 11-character video ID."],
    ["Can I download thumbnails from private videos?", "No — only public videos with publicly accessible thumbnails can be downloaded."],
  ],
};
