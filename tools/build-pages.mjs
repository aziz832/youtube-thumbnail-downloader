import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SITE, LANGUAGES, PSEO, BLOG, INFO } from "./site-data.mjs";
import { L as T } from "./translations.mjs";

const TOOLS_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(TOOLS_DIR);
const PROJECT = join(ROOT, "public");

const DOMAIN = SITE.domain.replace(/\/$/, "");
const template = readFileSync(join(TOOLS_DIR, "app-template.html"), "utf8");
const css = readFileSync(join(ROOT, "styles.css"), "utf8");
const js = readFileSync(join(ROOT, "script.js"), "utf8");

const OG_LOCALES = {
  en: "en_US", de: "de_DE", es: "es_ES", fr: "fr_FR", it: "it_IT", pt: "pt_PT",
  nl: "nl_NL", pl: "pl_PL", sv: "sv_SE", da: "da_DK", no: "nb_NO", fi: "fi_FI",
  cs: "cs_CZ", el: "el_GR", ro: "ro_RO", hu: "hu_HU", tr: "tr_TR", ru: "ru_RU",
  uk: "uk_UA", ar: "ar_SA", he: "he_IL", fa: "fa_IR", hi: "hi_IN", bn: "bn_BD",
  ur: "ur_PK", ja: "ja_JP", ko: "ko_KR", "zh-CN": "zh_CN", "zh-TW": "zh_TW",
  vi: "vi_VN", th: "th_TH", id: "id_ID", ms: "ms_MY", tl: "tl_PH",
};

const LANG_H2 = {
  en: "Languages", de: "Sprachen", es: "Idiomas", fr: "Langues", it: "Lingue",
  pt: "Idiomas", nl: "Talen", pl: "Języki", sv: "Språk", da: "Sprog",
  no: "Språk", fi: "Kielet", cs: "Jazyky", el: "Γλώσσες", ro: "Limbi",
  hu: "Nyelvek", tr: "Diller", ru: "Языки", uk: "Мови", ar: "اللغات",
  he: "שפות", fa: "زبانها", hi: "भाषाएँ", bn: "ভাষাসমূহ", ur: "زبانیں",
  ja: "言語", ko: "언어", "zh-CN": "语言", "zh-TW": "語言", vi: "Ngôn ngữ",
  th: "ภาษา", id: "Bahasa", ms: "Bahasa", tl: "Mga Wika",
};

const favicon =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#ef4444"/><path d="M26 21v22l18-11z" fill="#fff"/></svg>`
  );

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const jsonScript = (obj) => JSON.stringify(obj).replace(/</g, "\\u003c");

function render(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (m, key) => {
    if (!(key in vars)) throw new Error(`Missing placeholder: {{${key}}}`);
    return vars[key];
  });
}

function hreflangLinks() {
  const links = [`<link rel="alternate" hreflang="x-default" href="${DOMAIN}/" />`];
  for (const lang of LANGUAGES) {
    links.push(
      `<link rel="alternate" hreflang="${lang.code}" href="${DOMAIN}/lang/${lang.code}/" />`
    );
  }
  return links.join("\n  ");
}

function ogMeta(title, desc, canonical, locale) {
  return (
    `<meta property="og:type" content="website" />\n  ` +
    `<meta property="og:title" content="${escapeHtml(title)}" />\n  ` +
    `<meta property="og:description" content="${escapeHtml(desc)}" />\n  ` +
    `<meta property="og:url" content="${canonical}" />\n  ` +
    `<meta property="og:locale" content="${locale}" />\n  ` +
    `<meta name="twitter:card" content="summary_large_image" />`
  );
}

function webAppJsonLd(name, url, desc, lang, featureList) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name,
    url,
    description: desc,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    inLanguage: lang,
    ...(featureList ? { featureList } : {}),
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
}

function faqJsonLd(entries) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

function jsonldIndex(t, canonical, lang) {
  const features = [
    "Download YouTube thumbnails in all available resolutions",
    "Support for watch, youtu.be, Shorts, embed, live, and video ID inputs",
    "Original-quality images with no watermark",
    "Free, no sign-up, unlimited downloads",
  ];
  const faq = lang === "en" ? EN_FAQ : t.faq;
  return (
    `<script type="application/ld+json">${jsonScript(webAppJsonLd(SITE.toolName, canonical, t.metaDesc, lang, features))}</script>\n  ` +
    `<script type="application/ld+json">${jsonScript(faqJsonLd(faq))}</script>`
  );
}

function jsonldTool(p, canonical) {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE.name, item: DOMAIN + "/" },
      { "@type": "ListItem", position: 2, name: p.h1, item: canonical },
    ],
  };
  const features = [
    "Download YouTube thumbnails in all available resolutions",
    "Support for watch, youtu.be, Shorts, embed, live, and video ID inputs",
    "Original-quality images with no watermark",
    "Free, no sign-up, unlimited downloads",
  ];
  return (
    `<script type="application/ld+json">${jsonScript(webAppJsonLd(SITE.toolName, canonical, p.meta, "en", features))}</script>\n  ` +
    `<script type="application/ld+json">${jsonScript(faqJsonLd(p.faq))}</script>\n  ` +
    `<script type="application/ld+json">${jsonScript(breadcrumb)}</script>`
  );
}

function dirCssFor(t) {
  if (t.dir !== "rtl") return "";
  return (
    `<style>html[dir="rtl"] .url-input{text-align:right}` +
    `html[dir="rtl"] .seo-section ol,html[dir="rtl"] .seo-section ul{padding-left:0;padding-right:1.3rem}` +
    `html[dir="rtl"] .thumb-actions{direction:ltr}</style>`
  );
}

function uiTextScriptFor(t) {
  const merged = { ...T.en, ...t };
  return `<script>window.UI_TEXT=${jsonScript({
    placeholder: merged.placeholder,
    tips: merged.tips,
    getThumbs: merged.getThumbs,
    example: merged.example,
    loading: merged.loading,
    download: merged.download,
    open: merged.open,
    notAvailable: merged.notAvailable,
    sizesTitle: merged.sizesTitle,
    sizesSub: merged.sizesSub,
    videoTitle: merged.videoTitle,
    openVideo: merged.openVideo,
    qDefault: merged.qDefault,
    invalidMsg: merged.invalidMsg,
    copy: merged.copy,
    copied: merged.copied,
    clear: merged.clear,
    qThumb1: merged.qThumb1,
    qThumb2: merged.qThumb2,
  })};</script>`;
}

function contentSectionsForTranslation(t) {
  const steps = t.howSteps.map((s) => `<li>${escapeHtml(s)}</li>`).join("\n");
  const uses = t.usesList.map((s) => `<li>${escapeHtml(s)}</li>`).join("\n");
  const faq = t.faq
    .map(
      ([q, a]) =>
        `<details class="faq-item"><summary>${escapeHtml(q)}</summary><p>${escapeHtml(a)}</p></details>`
    )
    .join("\n");
  return (
    `\n    <section class="seo-section">\n` +
    `      <h2>${escapeHtml(t.secIntroH2)}</h2>\n` +
    `      <p>${escapeHtml(t.intro)}</p>\n` +
    `    </section>\n` +
    `    <section class="seo-section">\n` +
    `      <h2>${escapeHtml(t.secHowH2)}</h2>\n` +
    `      <ol>\n${steps}\n      </ol>\n` +
    `    </section>\n` +
    `    <section class="seo-section">\n` +
    `      <h2>${escapeHtml(t.secUsesH2)}</h2>\n` +
    `      <ul>\n${uses}\n      </ul>\n` +
    `    </section>\n` +
    `    <section class="seo-section">\n` +
    `      <h2>${escapeHtml(t.secFaqH2)}</h2>\n` +
    `      ${faq}\n` +
    `    </section>`
  );
}

function contentSectionsForTool(p, t) {
  const intro = p.intro.map((par) => `<p>${escapeHtml(par)}</p>`).join("\n");
  const steps = p.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join("\n");
  const faq = p.faq
    .map(
      ([q, a]) =>
        `<details class="faq-item"><summary>${escapeHtml(q)}</summary><p>${escapeHtml(a)}</p></details>`
    )
    .join("\n");
  return (
    `\n    <section class="seo-section">\n` +
    `      <h2>How to ${escapeHtml(p.primary)}</h2>\n` +
    `      ${intro}\n` +
    `      <ol>\n${steps}\n      </ol>\n` +
    `    </section>\n` +
    `    <section class="seo-section">\n` +
    `      <h2>${escapeHtml(t.secFaqH2)}</h2>\n` +
    `      ${faq}\n` +
    `    </section>`
  );
}

function footerHtml(t, langH2) {
  const related = PSEO.map(
    (p) =>
      `<a href="/tools/${p.slug}.html">${escapeHtml(p.title.split(" — ")[0])}</a>`
  ).join("\n");
  const guides = BLOG.map(
    (b) => `<a href="/blog/${b.slug}/">${escapeHtml(b.h1)}</a>`
  ).join("\n");
  const info = INFO.map(
    (i) => `<a href="/${i.slug}.html">${escapeHtml(i.h1)}</a>`
  ).join("\n");
  const langs = LANGUAGES.map(
    (l) => `<a href="/lang/${l.code}/" hreflang="${l.code}">${escapeHtml(l.name)}</a>`
  ).join("\n");
  return (
    `\n  <footer class="site-footer">\n` +
    `    <section class="footer-block">\n` +
    `      <h2 class="footer-title">${escapeHtml(t.relatedH2)}</h2>\n` +
    `      <div class="related-grid">\n${related}\n      </div>\n` +
    `    </section>\n` +
    `    <section class="footer-block">\n` +
    `      <h2 class="footer-title">Guides</h2>\n` +
    `      <div class="related-grid">\n${guides}\n      </div>\n` +
    `    </section>\n` +
    `    <section class="footer-block">\n` +
    `      <h2 class="footer-title">${escapeHtml(langH2)}</h2>\n` +
    `      <div class="related-grid lang-grid">\n${langs}\n      </div>\n` +
    `    </section>\n` +
    `    <section class="footer-block">\n` +
    `      <h2 class="footer-title">Site</h2>\n` +
    `      <div class="related-grid">\n${info}\n      </div>\n` +
    `    </section>\n` +
    `    <p class="footer-note">${escapeHtml(t.metaDesc)}</p>\n` +
    `  </footer>`
  );
}

function breadcrumbHtml(h1) {
  return (
    `<nav class="crumbs" aria-label="Breadcrumb">\n` +
    `  <a href="/">${escapeHtml(SITE.name)}</a>\n` +
    `  <span aria-hidden="true">›</span>\n` +
    `  <span aria-current="page">${escapeHtml(h1)}</span>\n` +
    `</nav>`
  );
}

const EN_FAQ = [
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

function enHomeContent() {
  const steps = [
    ["Copy the YouTube URL", "Open any YouTube video and copy its link from the address bar or share button. Watch, Shorts, embed, and youtu.be links all work."],
    ["Paste & preview", "Paste the link into the box and press Enter. The video metadata loads and every thumbnail size is fetched at once."],
    ["Download instantly", "Click Download on the size you want — the original JPG saves straight to your device. No watermark, no sign-up."],
  ]
    .map(
      ([t, d], i) =>
        `<div class="how-card"><div class="how-num">${i + 1}</div><h3>${escapeHtml(t)}</h3><p>${escapeHtml(d)}</p></div>`
    )
    .join("\n        ");

  const features = [
    ["HD & 4K-quality originals", "Every thumbnail is the original file from YouTube's image CDN — no re-compression, no quality loss."],
    ["No watermark, ever", "Downloaded images are exactly what YouTube stores, with nothing overlaid on top."],
    ["No account needed", "No email, no password, no sign-up. The tool is completely anonymous to use."],
    ["All 5 resolutions", "Get maxresdefault HD, SD, HQ, MQ, and the tiny default image for any video."],
    ["Shorts & live streams", "Watch links, Shorts, embeds, youtu.be, and live stream URLs are all detected automatically."],
    ["100% private", "Links are processed in your browser. Nothing is stored, collected, or shared."],
  ]
    .map(
      ([t, d]) =>
        `<div class="feature-card"><h3>${escapeHtml(t)}</h3><p>${escapeHtml(d)}</p></div>`
    )
    .join("\n        ");

  const uses = [
    ["Content creators", "Study competitor thumbnails, get design inspiration, and archive your own uploads."],
    ["Digital marketers", "Download thumbnails for A/B testing, competitive research, and campaign planning."],
    ["Graphic designers", "Save covers as visual references for mood boards, presentations, and client work."],
    ["Educators & researchers", "Grab thumbnails for lectures, media-literacy classes, and visual communication research."],
  ]
    .map(
      ([t, d]) =>
        `<div class="use-card"><h3>${escapeHtml(t)}</h3><p>${escapeHtml(d)}</p></div>`
    )
    .join("\n        ");

  const resolutions = [
    ["Max HD", "1280 × 720", "maxresdefault", "Only when the uploader used a high-quality thumbnail"],
    ["SD", "640 × 480", "sddefault", "Available for almost every video"],
    ["HQ", "480 × 360", "hqdefault", "The classic sidebar size"],
    ["MQ", "320 × 180", "mqdefault", "Compact 16:9 preview"],
    ["Default", "120 × 90", "default.jpg", "Small playlist icon"],
    ["Thumb 1 / Thumb 2", "120 × 90", "1.jpg / 2.jpg", "Additional row frames"],
  ]
    .map(
      ([n, dim, file, note]) =>
        `<tr><td>${escapeHtml(n)}</td><td>${escapeHtml(dim)}</td><td><code>${escapeHtml(file)}</code></td><td>${escapeHtml(note)}</td></tr>`
    )
    .join("\n        ");

  const faq = EN_FAQ
    .map(
      ([q, a]) =>
        `<details class="faq-item"><summary>${escapeHtml(q)}</summary><p>${escapeHtml(a)}</p></details>`
    )
    .join("\n        ");

  return (
    `\n    <nav class="quicknav" aria-label="Page sections">\n` +
    `      <a href="#how-it-works">How It Works</a>\n` +
    `      <a href="#features">Features</a>\n` +
    `      <a href="#who-uses">Who Uses It</a>\n` +
    `      <a href="#resolutions">Resolutions</a>\n` +
    `      <a href="#faq">FAQ</a>\n` +
    `    </nav>\n` +
    `\n    <section class="stats" aria-label="Tool stats">\n` +
    `      <div class="stat"><strong>100%</strong><span>Free forever</span></div>\n` +
    `      <div class="stat"><strong>5</strong><span>Resolutions</span></div>\n` +
    `      <div class="stat"><strong>0</strong><span>Login required</span></div>\n` +
    `      <div class="stat"><strong>1280×720</strong><span>Max quality</span></div>\n` +
    `    </section>\n` +
    `\n    <section class="seo-section" id="how-it-works">\n` +
    `      <h2>How It Works</h2>\n` +
    `      <div class="how-grid">\n        ${steps}\n      </div>\n` +
    `    </section>\n` +
    `\n    <section class="seo-section" id="features">\n` +
    `      <h2>Features</h2>\n` +
    `      <div class="feature-grid">\n        ${features}\n      </div>\n` +
    `    </section>\n` +
    `\n    <section class="seo-section" id="who-uses">\n` +
    `      <h2>Who Uses Our YouTube Thumbnail Downloader?</h2>\n` +
    `      <div class="use-grid">\n        ${uses}\n      </div>\n` +
    `    </section>\n` +
    `\n    <section class="seo-section" id="resolutions">\n` +
    `      <h2>Supported Resolutions</h2>\n` +
    `      <div class="table-wrap"><table class="res-table">\n` +
    `        <thead><tr><th>Size</th><th>Dimensions</th><th>File</th><th>Notes</th></tr></thead>\n` +
    `        <tbody>\n        ${resolutions}\n        </tbody>\n` +
    `      </table></div>\n` +
    `    </section>\n` +
    `\n    <section class="seo-section">\n` +
    `      <h2>What Is a YouTube Thumbnail Downloader?</h2>\n` +
    `      <p>A YouTube thumbnail downloader extracts the preview image of any video from its public image CDN and saves it to your device. You only need the video link — the tool finds the video ID automatically, checks every available resolution, and lets you download the HD, SD, or HQ version with one click. It is useful for creating custom thumbnails for your own videos, referencing designs, or simply saving a frame you like.</p>\n` +
    `      <p>Unlike screenshots, the downloaded file is the original image YouTube stores — sharp at full resolution and free of player UI, play buttons, and compression artifacts.</p>\n` +
    `    </section>\n` +
    `\n    <section class="seo-section">\n` +
    `      <h2>Supported URL Formats</h2>\n` +
    `      <p>The tool detects the video ID from every common YouTube link format:</p>\n` +
    `      <ul>\n` +
    `        <li>Standard: youtube.com/watch?v=VIDEO_ID</li>\n` +
    `        <li>Short: youtu.be/VIDEO_ID</li>\n` +
    `        <li>Embedded: youtube.com/embed/VIDEO_ID</li>\n` +
    `        <li>Shorts: youtube.com/shorts/VIDEO_ID</li>\n` +
    `        <li>Live streams and playlist video URLs</li>\n` +
    `        <li>A bare 11-character video ID</li>\n` +
    `      </ul>\n` +
    `    </section>\n` +
    `\n    <section class="seo-section">\n` +
    `      <h2>Why Use a Thumbnail Downloader Instead of a Screenshot?</h2>\n` +
    `      <p>Screenshots capture the player on screen: compressed, small, and covered with the play button and UI. A downloader fetches the original file from YouTube's servers at its true resolution, so the image stays sharp when you crop, zoom, or place it in a design.</p>\n` +
    `      <p>You also get every size YouTube offers at once, instead of hunting through the page source for image URLs.</p>\n` +
    `    </section>\n` +
    `\n    <section class="seo-section" id="faq">\n` +
    `      <h2>Frequently Asked Questions</h2>\n` +
    `      ${faq}\n` +
    `    </section>`
  );
}

function baseVars(t, lang, canonical) {
  return {
    ...T.en,
    ...t,
    lang,
    dir: t.dir,
    htmlTitle: t.htmlTitle,
    metaDesc: t.metaDesc,
    h1: t.h1,
    subtitle: t.subtitle,
    canonical,
    favicon,
    css,
    js,
  };
}

function homeVars(lang, t) {
  const canonical = `${DOMAIN}/lang/${lang}/`;
  const vars = baseVars(t, lang, canonical);
  vars.hreflangLinks = hreflangLinks();
  vars.ogMeta = ogMeta(t.htmlTitle, t.metaDesc, canonical, OG_LOCALES[lang] || lang.replace("-", "_"));
  vars.jsonld = jsonldIndex(t, canonical, lang);
  vars.dirCss = dirCssFor(t);
  vars.breadcrumbs = "";
  vars.contentSections = lang === "en" ? enHomeContent() : contentSectionsForTranslation(t);
  vars.footer = footerHtml(t, LANG_H2[lang]);
  vars.uiTextScript = uiTextScriptFor(t);
  return vars;
}

function toolVars(p, t) {
  const canonical = `${DOMAIN}/tools/${p.slug}.html`;
  const vars = baseVars(t, "en", canonical);
  vars.htmlTitle = p.title;
  vars.metaDesc = p.meta;
  vars.h1 = p.h1;
  vars.hreflangLinks = hreflangLinks();
  vars.ogMeta = ogMeta(p.title, p.meta, canonical, "en_US");
  vars.jsonld = jsonldTool(p, canonical);
  vars.dirCss = "";
  vars.breadcrumbs = breadcrumbHtml(p.h1);
  vars.contentSections = contentSectionsForTool(p, t);
  vars.footer = footerHtml(t, LANG_H2.en);
  vars.uiTextScript = uiTextScriptFor(t);
  return vars;
}

function articleVars(b) {
  const canonical = `${DOMAIN}/blog/${b.slug}/`;
  const vars = baseVars(T.en, "en", canonical);
  vars.htmlTitle = b.title;
  vars.metaDesc = b.meta;
  vars.h1 = b.h1;
  vars.hreflangLinks = "";
  vars.ogMeta = ogMeta(b.title, b.meta, canonical, "en_US");
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: b.h1,
    description: b.meta,
    url: canonical,
    inLanguage: "en",
    publisher: { "@type": "Organization", name: SITE.name },
  };
  vars.jsonld =
    `<script type="application/ld+json">${jsonScript(article)}</script>\n  ` +
    `<script type="application/ld+json">${jsonScript(faqJsonLd(b.faq))}</script>`;
  vars.dirCss = "";
  vars.breadcrumbs =
    `<nav class="crumbs" aria-label="Breadcrumb">\n` +
    `  <a href="/">${escapeHtml(SITE.name)}</a>\n` +
    `  <span aria-hidden="true">›</span>\n` +
    `  <a href="/blog/">Guides</a>\n` +
    `  <span aria-hidden="true">›</span>\n` +
    `  <span aria-current="page">${escapeHtml(b.h1)}</span>\n` +
    `</nav>`;
  const intro = b.intro.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n      ");
  const sections = b.sections
    .map(
      ([h, items]) =>
        `<h2>${escapeHtml(h)}</h2>\n      <ul>\n        ${items
          .map((li) => `<li>${escapeHtml(li)}</li>`)
          .join("\n        ")}\n      </ul>`
    )
    .join("\n      ");
  const faq = b.faq
    .map(
      ([q, a]) =>
        `<details class="faq-item"><summary>${escapeHtml(q)}</summary><p>${escapeHtml(a)}</p></details>`
    )
    .join("\n        ");
  vars.contentSections =
    `\n    <section class="seo-section article">\n      ${intro}\n      ${sections}\n    </section>\n` +
    `    <section class="seo-section">\n      <h2>Frequently Asked Questions</h2>\n      ${faq}\n    </section>\n` +
    `    <section class="seo-section">\n      <h2>Download a thumbnail now</h2>\n      <p>Paste any YouTube link into the tool above to preview and download every available thumbnail size for free.</p>\n    </section>`;
  vars.footer = footerHtml(T.en, LANG_H2.en);
  vars.uiTextScript = uiTextScriptFor(T.en);
  return vars;
}

function infoVars(i) {
  const canonical = `${DOMAIN}/${i.slug}.html`;
  const vars = baseVars(T.en, "en", canonical);
  vars.htmlTitle = i.title;
  vars.metaDesc = i.meta;
  vars.h1 = i.h1;
  vars.hreflangLinks = "";
  vars.ogMeta = ogMeta(i.title, i.meta, canonical, "en_US");
  vars.jsonld =
    `<script type="application/ld+json">${jsonScript({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: i.h1,
      description: i.meta,
      url: canonical,
      inLanguage: "en",
    })}</script>`;
  vars.dirCss = "";
  vars.breadcrumbs =
    `<nav class="crumbs" aria-label="Breadcrumb">\n` +
    `  <a href="/">${escapeHtml(SITE.name)}</a>\n` +
    `  <span aria-hidden="true">›</span>\n` +
    `  <span aria-current="page">${escapeHtml(i.h1)}</span>\n` +
    `</nav>`;
  const sections = i.sections
    .map(
      ([h, par]) =>
        `<h2>${escapeHtml(h)}</h2>\n      <p>${escapeHtml(par)}</p>`
    )
    .join("\n      ");
  vars.contentSections = `\n    <section class="seo-section article">\n      ${sections}\n    </section>`;
  vars.footer = footerHtml(T.en, LANG_H2.en);
  vars.uiTextScript = uiTextScriptFor(T.en);
  return vars;
}

const written = [];

function write(filePath, content) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, "utf8");
  written.push(filePath);
}

const en = T.en;
write(join(PROJECT, "index.html"), render(template, homeVars("en", en)));

for (const lang of LANGUAGES) {
  const t = T[lang.code];
  if (!t) throw new Error(`Missing translation for ${lang.code}`);
  const html = render(template, homeVars(lang.code, t));
  write(join(PROJECT, "lang", lang.code, "index.html"), html);
}

for (const p of PSEO) {
  const html = render(template, toolVars(p, en));
  write(join(PROJECT, "tools", `${p.slug}.html`), html);
}

const blogIndexHtml =
  `<!DOCTYPE html>\n<html lang="en" dir="ltr">\n<head>\n  <meta charset="UTF-8" />\n` +
  `  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n` +
  `  <title>Guides — YouTube Thumbnail Downloader</title>\n` +
  `  <meta name="description" content="Guides on downloading YouTube thumbnails, thumbnail sizes, best practices, CTR, and tools. Learn how to get any video thumbnail in HD for free." />\n` +
  `  <link rel="canonical" href="${DOMAIN}/blog/" />\n` +
  `  <link rel="icon" href="${favicon}" />\n` +
  `  <style>${css}</style>\n</head>\n<body>\n  <main class="container">\n` +
  `    <header class="hero"><div class="logo-mark yt-logo" aria-hidden="true"></div><h1>Guides</h1><p class="subtitle">Learn how to download and design YouTube thumbnails.</p></header>\n` +
  `    <div class="blog-grid">\n` +
  BLOG.map(
    (b) =>
      `<a class="blog-card" href="/blog/${b.slug}/"><h2>${escapeHtml(b.h1)}</h2><p>${escapeHtml(b.meta)}</p></a>`
  ).join("\n      ") +
  `\n    </div>\n  </main>\n` +
  footerHtml(T.en, LANG_H2.en) +
  `\n</body>\n</html>`;
write(join(PROJECT, "blog", "index.html"), blogIndexHtml);

for (const b of BLOG) {
  const html = render(template, articleVars(b));
  write(join(PROJECT, "blog", b.slug, "index.html"), html);
}

for (const i of INFO) {
  const html = render(template, infoVars(i));
  write(join(PROJECT, `${i.slug}.html`), html);
}

const alternateSet = () => {
  const alts = [{ code: "x-default", href: DOMAIN + "/" }];
  for (const lang of LANGUAGES) alts.push({ code: lang.code, href: `${DOMAIN}/lang/${lang.code}/` });
  return alts;
};

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${DOMAIN}/</loc>
    ${alternateSet().map((a) => `<xhtml:link rel="alternate" hreflang="${a.code}" href="${a.href}" />`).join("\n    ")}
  </url>
${LANGUAGES.map(
  (lang) => `  <url>
    <loc>${DOMAIN}/lang/${lang.code}/</loc>
    ${alternateSet().map((a) => `<xhtml:link rel="alternate" hreflang="${a.code}" href="${a.href}" />`).join("\n    ")}
  </url>`
).join("\n")}
${PSEO.map(
  (p) => `  <url>
    <loc>${DOMAIN}/tools/${p.slug}.html</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
  </url>`
).join("\n")}
  <url>
    <loc>${DOMAIN}/blog/</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
  </url>
${BLOG.map(
  (b) => `  <url>
    <loc>${DOMAIN}/blog/${b.slug}/</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
  </url>`
).join("\n")}
${INFO.map(
  (i) => `  <url>
    <loc>${DOMAIN}/${i.slug}.html</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
  </url>`
).join("\n")}
</urlset>
`;
write(join(PROJECT, "sitemap.xml"), sitemap);

const robots = `User-agent: *
Allow: /

Sitemap: ${DOMAIN}/sitemap.xml
`;
write(join(PROJECT, "robots.txt"), robots);

let errors = 0;
for (const f of written) {
  if (f.endsWith(".html")) {
    const content = readFileSync(f, "utf8");
    if (/\{\{/.test(content)) {
      console.error(`UNRESOLVED PLACEHOLDER in ${f}`);
      errors++;
    }
    if (!content.includes("</html>")) {
      console.error(`UNCLOSED HTML in ${f}`);
      errors++;
    }
  }
}
console.log(
  `Generated ${written.length} files (${LANGUAGES.length} locales, ${PSEO.length} tool pages, ${BLOG.length} guides, ${INFO.length} info pages).`
);
console.log(errors ? `${errors} verification error(s)!` : "Verification OK.");
