import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SITE, LANGUAGES, PSEO, BLOG, INFO } from "./site-data.mjs";
import { L as T } from "./translations.mjs";
import { PT } from "./pages-translations.mjs";
import { TOOL_CONTENT } from "./tool-content.mjs";
import { EN_HOME, EN_LABELS, EN_FAQ } from "./content.mjs";

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
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#FE7F2D"/><path d="M26 21v22l18-11z" fill="#fff"/></svg>`
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

// ---- language routing ----

function pathFor(code, type, slug) {
  const base = code === "en" ? "" : `/lang/${code}`;
  switch (type) {
    case "home":
      return `${base}/`;
    case "tool":
      return `${base}/tools/${slug}`;
    case "blogIndex":
      return `${base}/blog/`;
    case "article":
      return `${base}/blog/${slug}/`;
    case "info":
      return `${base}/${slug}`;
    default:
      throw new Error(`unknown page type ${type}`);
  }
}

function hreflangFor(type, slug) {
  const links = [
    `<link rel="alternate" hreflang="x-default" href="${DOMAIN}${pathFor("en", type, slug)}" />`,
  ];
  for (const lang of LANGUAGES) {
    links.push(
      `<link rel="alternate" hreflang="${lang.code}" href="${DOMAIN}${pathFor(lang.code, type, slug)}" />`
    );
  }
  return links.join("\n  ");
}

function altLinks(type, slug) {
  const list = [{ code: "x-default", href: DOMAIN + pathFor("en", type, slug) }];
  for (const lang of LANGUAGES) {
    list.push({ code: lang.code, href: DOMAIN + pathFor(lang.code, type, slug) });
  }
  return list
    .map((a) => `<xhtml:link rel="alternate" hreflang="${a.code}" href="${a.href}" />`)
    .join("\n    ");
}

function labelsFor(lang) {
  return { ...EN_LABELS, ...(PT[lang]?.labels || {}) };
}

function homeFor(lang) {
  const en = EN_HOME;
  const pt = PT[lang]?.home || {};
  return {
    ...en,
    ...pt,
    howCards: pt.howCards || en.howCards,
    features: pt.features || en.features,
    uses: pt.uses || en.uses,
    resHead: { ...en.resHead, ...(pt.resHead || {}) },
    urlList: pt.urlList || en.urlList,
    resolutions: en.resolutions.map((row, i) => {
      const ptRow = pt.resolutions?.[i] || [];
      return [ptRow[0] || row[0], row[1], row[2], ptRow[1] || row[3]];
    }),
  };
}

function homeFaqFor(lang) {
  const merged =
    lang === "en"
      ? [...EN_FAQ, ...(EN_HOME.faqExtra || [])]
      : [...(T[lang].faq || []), ...(PT[lang]?.home?.faqExtra || [])];
  const seen = new Set();
  return merged.filter(([q]) => {
    const key = q.toLowerCase().replace(/\s+/g, " ").trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ---- language switcher ----

function langSwitchHtml(current, label) {
  const opts = LANGUAGES.map(
    (l) =>
      `      <option value="${l.code}"${l.code === current ? " selected" : ""}>${escapeHtml(l.name)}</option>`
  ).join("\n");
  return (
    `<div class="lang-switch">\n` +
    `  <label for="langSelect">${escapeHtml(label)}</label>\n` +
    `  <select id="langSelect" aria-label="${escapeHtml(label)}">\n` +
    opts +
    `\n  </select>\n` +
    `</div>`
  );
}

function langSwitchScript() {
  return (
    `<script>(function () {\n` +
    `  var sel = document.getElementById("langSelect");\n` +
    `  if (!sel) return;\n` +
    `  var m = location.pathname.match(/^\\/lang\\/[a-zA-Z-]+(?=\\/|$)/);\n` +
    `  var base = m ? location.pathname.slice(m[0].length) : location.pathname;\n` +
    `  if (base.charAt(0) !== "/") base = "/" + base;\n` +
    `  sel.addEventListener("change", function () {\n` +
    `    var code = sel.value;\n` +
    `    if (code === "en") { location.assign(base === "/" ? "/" : base); return; }\n` +
    `    location.assign("/lang/" + code + (base === "/" ? "/" : base));\n` +
    `  });\n` +
    `})();</script>`
  );
}

// ---- meta / schema helpers ----

function ogMeta(title, desc, canonical, locale) {
  const localeAlternates = LANGUAGES.filter(
    (l) => OG_LOCALES[l.code] !== locale
  )
    .map(
      (l) =>
        `<meta property="og:locale:alternate" content="${OG_LOCALES[l.code]}" />`
    )
    .join("\n  ");
  return (
    `<meta property="og:type" content="website" />\n  ` +
    `<meta property="og:title" content="${escapeHtml(title)}" />\n  ` +
    `<meta property="og:description" content="${escapeHtml(desc)}" />\n  ` +
    `<meta property="og:url" content="${canonical}" />\n  ` +
    `<meta property="og:locale" content="${locale}" />\n  ` +
    `${localeAlternates}\n  ` +
    `<meta property="og:site_name" content="${escapeHtml(SITE.name)}" />\n  ` +
    `<meta property="og:image" content="${DOMAIN}/og-image.png" />\n  ` +
    `<meta property="og:image:width" content="1200" />\n  ` +
    `<meta property="og:image:height" content="630" />\n  ` +
    `<meta name="twitter:card" content="summary_large_image" />\n  ` +
    `<meta name="twitter:title" content="${escapeHtml(title)}" />\n  ` +
    `<meta name="twitter:description" content="${escapeHtml(desc)}" />\n  ` +
    `<meta name="twitter:image" content="${DOMAIN}/og-image.png" />`
  );
}

function siteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: DOMAIN + "/",
    description: SITE.toolName,
    inLanguage: "en",
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      url: DOMAIN + "/",
      logo: {
        "@type": "ImageObject",
        url: DOMAIN + "/og-image.png",
        width: 1200,
        height: 630,
      },
    },
  };
}

function jsonldSite() {
  return `<script type="application/ld+json">${jsonScript(siteJsonLd())}</script>\n  `;
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

function jsonldIndex(t, canonical, lang, faq) {
  const features = [
    "Download YouTube thumbnails in all available resolutions",
    "Support for watch, youtu.be, Shorts, embed, live, and video ID inputs",
    "Original-quality images with no watermark",
    "Free, no sign-up, unlimited downloads",
  ];
  return (
    `<script type="application/ld+json">${jsonScript(webAppJsonLd(SITE.toolName, canonical, t.metaDesc, lang, features))}</script>\n  ` +
    `<script type="application/ld+json">${jsonScript(faqJsonLd(faq))}</script>`
  );
}

function jsonldTool(page, canonical, lang, slug) {
  const enDeep = TOOL_CONTENT[slug];
  const extra = page.extraFaq || enDeep?.extraFaq || [];
  const faqList = [...page.faq, ...extra];
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE.name, item: DOMAIN + pathFor(lang, "home") },
      { "@type": "ListItem", position: 2, name: page.h1, item: canonical },
    ],
  };
  const features = [
    "Download YouTube thumbnails in all available resolutions",
    "Support for watch, youtu.be, Shorts, embed, live, and video ID inputs",
    "Original-quality images with no watermark",
    "Free, no sign-up, unlimited downloads",
  ];
  return (
    `<script type="application/ld+json">${jsonScript(webAppJsonLd(SITE.toolName, canonical, page.meta, lang, features))}</script>\n  ` +
    `<script type="application/ld+json">${jsonScript(faqJsonLd(faqList))}</script>\n  ` +
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

function uiTextScriptFor(t, lang) {
  const merged = { ...T.en, ...t, ...(PT[lang]?.ui || {}) };
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

// ---- page section builders ----

function homeContent(home, faq) {
  const cards = home.howCards
    .map(
      ([t, d], i) =>
        `<div class="how-card"><div class="how-num">${i + 1}</div><h3>${escapeHtml(t)}</h3><p>${escapeHtml(d)}</p></div>`
    )
    .join("\n        ");

  const features = home.features
    .map(
      ([t, d]) =>
        `<div class="feature-card"><h3>${escapeHtml(t)}</h3><p>${escapeHtml(d)}</p></div>`
    )
    .join("\n        ");

  const uses = home.uses
    .map(
      ([t, d]) =>
        `<div class="use-card"><h3>${escapeHtml(t)}</h3><p>${escapeHtml(d)}</p></div>`
    )
    .join("\n        ");

  const resolutions = home.resolutions
    .map(
      ([n, dim, file, note]) =>
        `<tr><td>${escapeHtml(n)}</td><td>${escapeHtml(dim)}</td><td><code>${escapeHtml(file)}</code></td><td>${escapeHtml(note)}</td></tr>`
    )
    .join("\n        ");

  const faqHtml = faq
    .map(
      ([q, a]) =>
        `<details class="faq-item"><summary>${escapeHtml(q)}</summary><p>${escapeHtml(a)}</p></details>`
    )
    .join("\n        ");

  const urlList = home.urlList.map((s) => `<li>${escapeHtml(s)}</li>`).join("\n");

  return (
    `\n    <nav class="quicknav" aria-label="${escapeHtml(home.qnHow)}">\n` +
    `      <a href="#how-it-works">${escapeHtml(home.qnHow)}</a>\n` +
    `      <a href="#features">${escapeHtml(home.qnFeatures)}</a>\n` +
    `      <a href="#who-uses">${escapeHtml(home.qnUses)}</a>\n` +
    `      <a href="#resolutions">${escapeHtml(home.qnRes)}</a>\n` +
    `      <a href="#faq">${escapeHtml(home.qnFaq)}</a>\n` +
    `    </nav>\n` +
    `\n    <section class="stats" aria-label="${escapeHtml(home.qnFeatures)}">\n` +
    `      <div class="stat"><strong>100%</strong><span>${escapeHtml(home.statFree)}</span></div>\n` +
    `      <div class="stat"><strong>5</strong><span>${escapeHtml(home.statRes)}</span></div>\n` +
    `      <div class="stat"><strong>0</strong><span>${escapeHtml(home.statLogin)}</span></div>\n` +
    `      <div class="stat"><strong>1280×720</strong><span>${escapeHtml(home.statMax)}</span></div>\n` +
    `    </section>\n` +
    `\n    <section class="seo-section" id="how-it-works">\n` +
    `      <h2>${escapeHtml(home.howH2)}</h2>\n` +
    `      <div class="how-grid">\n        ${cards}\n      </div>\n` +
    `    </section>\n` +
    `\n    <section class="seo-section" id="features">\n` +
    `      <h2>${escapeHtml(home.featuresH2)}</h2>\n` +
    `      <div class="feature-grid">\n        ${features}\n      </div>\n` +
    `    </section>\n` +
    `\n    <section class="seo-section" id="who-uses">\n` +
    `      <h2>${escapeHtml(home.usesH2)}</h2>\n` +
    `      <div class="use-grid">\n        ${uses}\n      </div>\n` +
    `    </section>\n` +
    `\n    <section class="seo-section" id="resolutions">\n` +
    `      <h2>${escapeHtml(home.resH2)}</h2>\n` +
    `      <div class="table-wrap"><table class="res-table">\n` +
    `        <thead><tr><th>${escapeHtml(home.resHead.size)}</th><th>${escapeHtml(home.resHead.dim)}</th><th>${escapeHtml(home.resHead.file)}</th><th>${escapeHtml(home.resHead.notes)}</th></tr></thead>\n` +
    `        <tbody>\n        ${resolutions}\n        </tbody>\n` +
    `      </table></div>\n` +
    `    </section>\n` +
    `\n    <section class="seo-section">\n` +
    `      <h2>${escapeHtml(home.whatH2)}</h2>\n` +
    `      <p>${escapeHtml(home.whatP1)}</p>\n` +
    `      <p>${escapeHtml(home.whatP2)}</p>\n` +
    `    </section>\n` +
    `\n    <section class="seo-section">\n` +
    `      <h2>${escapeHtml(home.urlH2)}</h2>\n` +
    `      <p>${escapeHtml(home.urlP)}</p>\n` +
    `      <ul>\n        ${urlList}\n      </ul>\n` +
    `    </section>\n` +
    `\n    <section class="seo-section">\n` +
    `      <h2>${escapeHtml(home.whyH2)}</h2>\n` +
    `      <p>${escapeHtml(home.whyP1)}</p>\n` +
    `      <p>${escapeHtml(home.whyP2)}</p>\n` +
    `    </section>\n` +
    `\n    <section class="seo-section" id="faq">\n` +
    `      <h2>${escapeHtml(home.faqH2)}</h2>\n` +
    `      ${faqHtml}\n` +
    `    </section>`
  );
}

const RELATED_MAP = {
  "youtube-thumbnail-downloader": ["download-youtube-thumbnails", "free-youtube-thumbnail-downloader", "best-youtube-thumbnail-downloader", "hd-youtube-thumbnail-downloader", "youtube-thumbnail-downloader-online"],
  "download-youtube-thumbnails": ["youtube-thumbnail-downloader", "download-thumbnail-from-youtube-link", "youtube-thumbnail-sizes", "youtube-thumbnail-4k-downloader"],
  "youtube-thumbnail-grabber": ["youtube-thumbnail-extractor", "youtube-thumbnail-viewer", "youtube-thumbnail-preview", "youtube-thumbnail-saver"],
  "youtube-thumbnail-extractor": ["youtube-thumbnail-grabber", "thumbnail-from-video-id", "get-youtube-thumbnail-url", "youtube-thumbnail-preview"],
  "youtube-thumbnail-saver": ["youtube-thumbnail-image-downloader", "download-youtube-thumbnails", "youtube-thumbnail-downloader-no-watermark", "download-youtube-video-thumbnail"],
  "hd-youtube-thumbnail-downloader": ["download-maxresdefault-thumbnail", "youtube-thumbnail-4k-downloader", "youtube-thumbnail-downloader", "youtube-thumbnail-sizes"],
  "download-maxresdefault-thumbnail": ["hd-youtube-thumbnail-downloader", "youtube-thumbnail-4k-downloader", "youtube-thumbnail-sizes", "youtube-thumbnail-downloader"],
  "youtube-shorts-thumbnail-downloader": ["download-thumbnails-from-youtube-shorts", "youtube-thumbnail-downloader", "download-youtube-thumbnails", "youtube-thumbnail-preview"],
  "thumbnail-from-video-id": ["youtube-thumbnail-extractor", "get-youtube-thumbnail-url", "copy-youtube-thumbnail-url", "youtube-thumbnail-downloader"],
  "youtube-thumbnail-viewer": ["youtube-thumbnail-preview", "youtube-thumbnail-grabber", "youtube-thumbnail-sizes", "youtube-thumbnail-image-downloader"],
  "copy-youtube-thumbnail-url": ["get-youtube-thumbnail-url", "thumbnail-from-video-id", "youtube-thumbnail-extractor", "youtube-thumbnail-sizes"],
  "youtube-thumbnail-downloader-without-extension": ["youtube-thumbnail-downloader-online", "youtube-thumbnail-downloader-no-login", "free-youtube-thumbnail-downloader", "youtube-thumbnail-downloader"],
  "download-thumbnail-from-youtube-link": ["download-youtube-thumbnails", "download-youtube-video-thumbnail", "youtube-thumbnail-downloader", "download-video-cover-image"],
  "youtube-thumbnail-sizes": ["hd-youtube-thumbnail-downloader", "download-maxresdefault-thumbnail", "youtube-thumbnail-preview", "youtube-thumbnail-downloader"],
  "download-video-cover-image": ["download-youtube-video-thumbnail", "download-thumbnail-from-youtube-link", "youtube-thumbnail-image-downloader", "youtube-thumbnail-saver"],
  "free-youtube-thumbnail-downloader": ["youtube-thumbnail-downloader", "youtube-thumbnail-downloader-no-login", "youtube-thumbnail-downloader-no-watermark", "download-youtube-thumbnails"],
  "youtube-thumbnail-4k-downloader": ["hd-youtube-thumbnail-downloader", "download-maxresdefault-thumbnail", "youtube-thumbnail-sizes", "youtube-thumbnail-downloader"],
  "download-youtube-video-thumbnail": ["download-thumbnail-from-youtube-link", "download-video-cover-image", "youtube-thumbnail-saver", "youtube-thumbnail-image-downloader"],
  "youtube-thumbnail-downloader-no-watermark": ["free-youtube-thumbnail-downloader", "youtube-thumbnail-downloader", "youtube-thumbnail-image-downloader", "download-youtube-thumbnails"],
  "youtube-thumbnail-downloader-free-online": ["youtube-thumbnail-downloader-online", "youtube-thumbnail-downloader-without-extension", "free-youtube-thumbnail-downloader", "youtube-thumbnail-downloader"],
  "youtube-thumbnail-downloader-no-login": ["free-youtube-thumbnail-downloader", "youtube-thumbnail-downloader-without-extension", "youtube-thumbnail-downloader", "download-youtube-thumbnail-without-signup"],
  "youtube-thumbnail-downloader-for-creators": ["youtube-thumbnail-downloader", "youtube-thumbnail-4k-downloader", "youtube-thumbnail-sizes", "youtube-thumbnail-preview"],
  "youtube-thumbnail-downloader-online": ["free-youtube-thumbnail-downloader", "youtube-thumbnail-downloader-without-extension", "youtube-thumbnail-downloader", "download-youtube-thumbnails"],
  "download-youtube-thumbnail-without-signup": ["youtube-thumbnail-downloader-no-login", "free-youtube-thumbnail-downloader", "youtube-thumbnail-downloader", "download-youtube-thumbnails"],
  "get-youtube-thumbnail-url": ["copy-youtube-thumbnail-url", "thumbnail-from-video-id", "youtube-thumbnail-extractor", "youtube-thumbnail-sizes"],
  "youtube-thumbnail-preview": ["youtube-thumbnail-viewer", "youtube-thumbnail-grabber", "youtube-thumbnail-sizes", "youtube-thumbnail-downloader"],
  "youtube-thumbnail-image-downloader": ["youtube-thumbnail-saver", "download-video-cover-image", "youtube-thumbnail-downloader-no-watermark", "download-youtube-video-thumbnail"],
  "download-thumbnails-from-youtube-shorts": ["youtube-shorts-thumbnail-downloader", "youtube-thumbnail-downloader", "download-youtube-thumbnails", "youtube-thumbnail-preview"],
  "best-youtube-thumbnail-downloader": ["youtube-thumbnail-downloader", "free-youtube-thumbnail-downloader", "youtube-thumbnail-4k-downloader", "youtube-thumbnail-sizes"],
};

function relatedToolsFor(page, lang, slug) {
  const slugs = (page.related && page.related.length) ? page.related : (RELATED_MAP[slug] || []);
  return slugs
    .map((slug) => {
      const p = PSEO.find((x) => x.slug === slug);
      if (!p) return "";
      const localized = lang === "en" ? p : PT[lang]?.tools?.[slug];
      const label = localized?.h1 || p.h1;
      return `        <a href="${pathFor(lang, "tool", slug)}">${escapeHtml(label)}</a>`;
    })
    .filter(Boolean)
    .join("\n");
}

function contentSectionsForTool(page, t, lang, slug) {
  const enDeep = TOOL_CONTENT[slug];
  const deep = page.whatIs || page.why || page.conclusion || page.extraFaq
    ? page
    : lang === "en"
      ? enDeep
      : null;
  const deepData = deep || enDeep || {};
  const intro = page.intro.map((par) => `<p>${escapeHtml(par)}</p>`).join("\n");
  const steps = page.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join("\n");
  const faqList = deepData.extraFaq ? [...page.faq, ...deepData.extraFaq] : page.faq;
  const faq = faqList
    .map(
      ([q, a]) =>
        `<details class="faq-item"><summary>${escapeHtml(q)}</summary><p>${escapeHtml(a)}</p></details>`
    )
    .join("\n");
  const benefits = (page.benefits || deepData.benefits || [])
    .map((b) => `      <li>${escapeHtml(b)}</li>`)
    .join("\n");
  const benefitsSection = benefits
    ? `\n    <section class="seo-section">\n` +
      `      <h2>${escapeHtml(page.benefitsH2 || t.secUsesH2)}</h2>\n` +
      `      <ul class="benefit-list">\n${benefits}\n      </ul>\n` +
      `    </section>\n`
    : "";
  const related = relatedToolsFor(page, lang, slug);
  const relatedSection = related
    ? `\n    <section class="seo-section related-tools">\n` +
      `      <h2>${escapeHtml(t.relatedH2)}</h2>\n` +
      `      <div class="related-grid">\n${related}\n      </div>\n` +
      `    </section>\n`
    : "";
  const whatIsSection = deepData.whatIs && deepData.whatIs.length
    ? `\n    <section class="seo-section">\n` +
      `      <h2>${escapeHtml(page.whatIsH2 || enDeep?.whatIsH2 || `What is a ${page.h1}?`)}</h2>\n` +
      deepData.whatIs.map((par) => `      <p>${escapeHtml(par)}</p>`).join("\n") +
      `\n    </section>\n`
    : "";
  const whySection = deepData.why
    ? `\n    <section class="seo-section">\n` +
      `      <h2>${escapeHtml(page.whyH2 || enDeep?.whyH2 || `Why use this ${page.h1}?`)}</h2>\n` +
      `      <p>${escapeHtml(deepData.why.para)}</p>\n` +
      `      <ul class="benefit-list">\n${deepData.why.bullets
        .map((b) => `      <li>${escapeHtml(b)}</li>`)
        .join("\n")}\n      </ul>\n` +
      `    </section>\n`
    : "";
  const conclusionSection = deepData.conclusion && deepData.conclusion.length
    ? `\n    <section class="seo-section">\n` +
      `      <h2>${escapeHtml(page.startH2 || enDeep?.startH2 || `Get started with this ${page.h1}`)}</h2>\n` +
      deepData.conclusion.map((par) => `      <p>${escapeHtml(par)}</p>`).join("\n") +
      `\n    </section>\n`
    : "";
  return (
    `\n    <section class="seo-section">\n` +
    `      <h2>${escapeHtml(page.howH2)}</h2>\n` +
    `      ${intro}\n` +
    `      <ol>\n${steps}\n      </ol>\n` +
    `    </section>\n` +
    whatIsSection +
    benefitsSection +
    whySection +
    `    <section class="seo-section">\n` +
    `      <h2>${escapeHtml(t.secFaqH2)}</h2>\n` +
    `      ${faq}\n` +
    `    </section>\n` +
    conclusionSection +
    relatedSection
  );
}

function footerHtml(t, langH2, labels, langCode, type, slug) {
  const related = PSEO.map(
    (p) =>
      `<a href="${pathFor(langCode, "tool", p.slug)}">${escapeHtml(p.title.split(" — ")[0])}</a>`
  ).join("\n");
  const guides = BLOG.map(
    (b) => `<a href="${pathFor(langCode, "article", b.slug)}">${escapeHtml(b.h1)}</a>`
  ).join("\n");
  const info = INFO.map(
    (i) => `<a href="${pathFor(langCode, "info", i.slug)}">${escapeHtml(i.h1)}</a>`
  ).join("\n");
  const langs = LANGUAGES.map(
    (l) =>
      `<a href="${DOMAIN}${pathFor(l.code, type, slug)}" hreflang="${l.code}">${escapeHtml(l.name)}</a>`
  ).join("\n");
  return (
    `\n  <footer class="site-footer">\n` +
    `    <section class="footer-block">\n` +
    `      <h2 class="footer-title">${escapeHtml(t.relatedH2)}</h2>\n` +
    `      <div class="related-grid">\n${related}\n      </div>\n` +
    `    </section>\n` +
    `    <section class="footer-block">\n` +
    `      <h2 class="footer-title">${escapeHtml(labels.guidesH2)}</h2>\n` +
    `      <div class="related-grid">\n${guides}\n      </div>\n` +
    `    </section>\n` +
    `    <section class="footer-block">\n` +
    `      <h2 class="footer-title">${escapeHtml(langH2)}</h2>\n` +
    `      <div class="related-grid lang-grid">\n${langs}\n      </div>\n` +
    `    </section>\n` +
    `    <section class="footer-block">\n` +
    `      <h2 class="footer-title">${escapeHtml(labels.siteH2)}</h2>\n` +
    `      <div class="related-grid">\n${info}\n      </div>\n` +
    `    </section>\n` +
    `    <p class="footer-note">${escapeHtml(t.metaDesc)}</p>\n` +
    `  </footer>`
  );
}

function breadcrumbHtml(h1, langCode) {
  return (
    `<nav class="crumbs" aria-label="Breadcrumb">\n` +
    `  <a href="${pathFor(langCode, "home")}">${escapeHtml(SITE.name)}</a>\n` +
    `  <span aria-hidden="true">›</span>\n` +
    `  <span aria-current="page">${escapeHtml(h1)}</span>\n` +
    `</nav>`
  );
}

function articleBreadcrumbHtml(h1, langCode, labels) {
  return (
    `<nav class="crumbs" aria-label="Breadcrumb">\n` +
    `  <a href="${pathFor(langCode, "home")}">${escapeHtml(SITE.name)}</a>\n` +
    `  <span aria-hidden="true">›</span>\n` +
    `  <a href="${pathFor(langCode, "blogIndex")}">${escapeHtml(labels.guidesCrumb)}</a>\n` +
    `  <span aria-hidden="true">›</span>\n` +
    `  <span aria-current="page">${escapeHtml(h1)}</span>\n` +
    `</nav>`
  );
}

// ---- page builders ----

function baseVars(t, lang, canonical, labels) {
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
    langSwitch: langSwitchHtml(lang, labels.langLabel),
    langSwitchScript: langSwitchScript(),
  };
}

function homeVars(lang, t) {
  const canonical = `${DOMAIN}${pathFor(lang, "home")}`;
  const labels = labelsFor(lang);
  const vars = baseVars(t, lang, canonical, labels);
  vars.hreflangLinks = hreflangFor("home");
  vars.ogMeta = ogMeta(t.htmlTitle, t.metaDesc, canonical, OG_LOCALES[lang] || lang.replace("-", "_"));
  vars.jsonld = jsonldSite() + jsonldIndex(t, canonical, lang, homeFaqFor(lang));
  vars.dirCss = dirCssFor(t);
  vars.breadcrumbs = "";
  vars.contentSections = homeContent(homeFor(lang), homeFaqFor(lang));
  vars.footer = footerHtml(t, LANG_H2[lang], labels, lang, "home");
  vars.uiTextScript = uiTextScriptFor(t, lang);
  return vars;
}

function toolVars(p, t, lang, page, labels) {
  const canonical = `${DOMAIN}${pathFor(lang, "tool", p.slug)}`;
  const vars = baseVars(t, lang, canonical, labels);
  vars.htmlTitle = page.title;
  vars.metaDesc = page.meta;
  vars.h1 = page.h1;
  vars.hreflangLinks = hreflangFor("tool", p.slug);
  vars.ogMeta = ogMeta(page.title, page.meta, canonical, OG_LOCALES[lang] || "en_US");
  vars.jsonld = jsonldSite() + jsonldTool(page, canonical, lang, p.slug);
  vars.dirCss = dirCssFor(t);
  vars.breadcrumbs = breadcrumbHtml(page.h1, lang);
  vars.contentSections = contentSectionsForTool(page, t, lang, p.slug);
  vars.footer = footerHtml(t, LANG_H2[lang], labels, lang, "tool", p.slug);
  vars.uiTextScript = uiTextScriptFor(t, lang);
  return vars;
}

function articleVars(b, lang, page, labels) {
  const canonical = `${DOMAIN}${pathFor(lang, "article", b.slug)}`;
  const t = T[lang];
  const vars = baseVars(t, lang, canonical, labels);
  vars.htmlTitle = page.title;
  vars.metaDesc = page.meta;
  vars.h1 = page.h1;
  vars.hreflangLinks = hreflangFor("article", b.slug);
  vars.ogMeta = ogMeta(page.title, page.meta, canonical, OG_LOCALES[lang] || "en_US");
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.h1,
    description: page.meta,
    url: canonical,
    inLanguage: lang,
    publisher: { "@type": "Organization", name: SITE.name },
  };
  vars.jsonld =
    jsonldSite() +
    `<script type="application/ld+json">${jsonScript(article)}</script>\n  ` +
    `<script type="application/ld+json">${jsonScript(faqJsonLd(page.faq))}</script>`;
  vars.dirCss = dirCssFor(t);
  vars.breadcrumbs = articleBreadcrumbHtml(page.h1, lang, labels);
  const intro = page.intro.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n      ");
  const sections = page.sections
    .map(
      ([h, items]) =>
        `<h2>${escapeHtml(h)}</h2>\n      <ul>\n        ${items
          .map((li) => `<li>${escapeHtml(li)}</li>`)
          .join("\n        ")}\n      </ul>`
    )
    .join("\n      ");
  const faq = page.faq
    .map(
      ([q, a]) =>
        `<details class="faq-item"><summary>${escapeHtml(q)}</summary><p>${escapeHtml(a)}</p></details>`
    )
    .join("\n        ");
  const faqH2 = homeFor(lang).faqH2;
  vars.contentSections =
    `\n    <section class="seo-section article">\n      ${intro}\n      ${sections}\n    </section>\n` +
    `    <section class="seo-section">\n      <h2>${escapeHtml(faqH2)}</h2>\n      ${faq}\n    </section>\n` +
    `    <section class="seo-section">\n      <h2>${escapeHtml(labels.blogCtaH2)}</h2>\n      <p>${escapeHtml(labels.blogCtaP)}</p>\n    </section>`;
  vars.footer = footerHtml(t, LANG_H2[lang], labels, lang, "article", b.slug);
  vars.uiTextScript = uiTextScriptFor(t, lang);
  return vars;
}

function infoVars(i, lang, page, labels) {
  const canonical = `${DOMAIN}${pathFor(lang, "info", i.slug)}`;
  const t = T[lang];
  const vars = baseVars(t, lang, canonical, labels);
  vars.htmlTitle = page.title;
  vars.metaDesc = page.meta;
  vars.h1 = page.h1;
  vars.hreflangLinks = hreflangFor("info", i.slug);
  vars.ogMeta = ogMeta(page.title, page.meta, canonical, OG_LOCALES[lang] || "en_US");
  vars.jsonld =
    jsonldSite() +
    `<script type="application/ld+json">${jsonScript({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: page.h1,
      description: page.meta,
      url: canonical,
      inLanguage: lang,
    })}</script>`;
  vars.dirCss = dirCssFor(t);
  vars.breadcrumbs = breadcrumbHtml(page.h1, lang);
  const sections = page.sections
    .map(
      ([h, par]) =>
        `<h2>${escapeHtml(h)}</h2>\n      <p>${escapeHtml(par)}</p>`
    )
    .join("\n      ");
  const form = page.contactForm
    ? `\n    <section class="seo-section">\n` +
      `      <form class="contact-form" id="contactForm" autocomplete="on">\n` +
      `        <div class="url-row">\n` +
      `          <input class="url-input" type="text" name="Name" placeholder="Your name" aria-label="Your name" autocomplete="name" required />\n` +
      `        </div>\n` +
      `        <div class="url-row">\n` +
      `          <input class="url-input" type="email" name="Email" placeholder="Your email address" aria-label="Your email address" autocomplete="email" required />\n` +
      `        </div>\n` +
      `        <div class="url-row">\n` +
      `          <input class="url-input" type="text" name="Subject" placeholder="Subject" aria-label="Subject" required />\n` +
      `        </div>\n` +
      `        <div class="url-row">\n` +
      `          <textarea class="url-input contact-msg" name="Message" rows="6" placeholder="Your message" aria-label="Your message" required></textarea>\n` +
      `        </div>\n` +
      `        <div class="url-row">\n` +
      `          <button class="primary" type="submit">Send message</button>\n` +
      `        </div>\n` +
      `        <p class="tips" role="note">This form opens your email app with the message ready to send to our contact address.</p>\n` +
      `      </form>\n` +
      `      <script>(function () {\n` +
      `        var form = document.getElementById("contactForm");\n` +
      `        if (!form) return;\n` +
      `        form.addEventListener("submit", function (e) {\n` +
      `          e.preventDefault();\n` +
      `          var f = form.elements;\n` +
      `          var subject = f.Subject.value.trim();\n` +
      `          var body = "Name: " + f.Name.value.trim() + "\\nEmail: " + f.Email.value.trim() + "\\n\\n" + f.Message.value.trim();\n` +
      `          window.location.href = "mailto:contact@yt-thumbnail-downloader.site?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);\n` +
      `        });\n` +
      `      })();</script>\n` +
      `    </section>\n`
    : "";
  vars.contentSections = `\n    <section class="seo-section article">\n      ${sections}\n    </section>\n${form}`;
  vars.footer = footerHtml(t, LANG_H2[lang], labels, lang, "info", i.slug);
  vars.uiTextScript = uiTextScriptFor(t, lang);
  return vars;
}

function blogIndexHtmlFor(lang) {
  const t = T[lang];
  const labels = labelsFor(lang);
  const canonical = `${DOMAIN}${pathFor(lang, "blogIndex")}`;
  const cards = BLOG.map((b) => {
    const page = lang === "en" ? b : PT[lang].blog[b.slug];
    return (
      `<a class="blog-card" href="${pathFor(lang, "article", b.slug)}"><h2>${escapeHtml(page.title)}</h2><p>${escapeHtml(page.meta)}</p></a>`
    );
  }).join("\n      ");
  return (
    `<!DOCTYPE html>\n<html lang="${lang}" dir="${t.dir}">\n<head>\n  <meta charset="UTF-8" />\n` +
    `  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n` +
    `  <title>${escapeHtml(labels.blogIndexTitle)}</title>\n` +
    `  <meta name="description" content="${escapeHtml(labels.blogIndexMeta)}" />\n` +
    `  <link rel="canonical" href="${canonical}" />\n` +
    `  ${hreflangFor("blogIndex")}\n` +
    `  ${ogMeta(labels.blogIndexTitle, labels.blogIndexMeta, canonical, OG_LOCALES[lang] || "en_US")}\n` +
    `  <link rel="icon" href="${favicon}" />\n` +
    `  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />\n` +
    `  <meta name="theme-color" content="#233D4D" />\n` +
    `  <style>${css}</style>\n` +
    `  ${dirCssFor(t)}\n` +
    `  ${jsonldSite()}\n` +
    `</head>\n<body>\n  <main class="container">\n` +
    `    <header class="hero"><div class="logo-mark yt-logo" aria-hidden="true"></div><h1>${escapeHtml(labels.guidesCrumb)}</h1><p class="subtitle">${escapeHtml(labels.blogIndexSubtitle)}</p>\n` +
    `    ${langSwitchHtml(lang, labels.langLabel)}\n` +
    `    </header>\n` +
    `    <div class="blog-grid">\n` +
    cards +
    `\n    </div>\n  </main>\n` +
    footerHtml(t, LANG_H2[lang], labels, lang, "blogIndex") +
    `\n  ${langSwitchScript()}\n` +
    `\n</body>\n</html>`
  );
}

function fsPath(code, type, slug) {
  const enUrl = pathFor("en", type, slug);
  const rel =
    enUrl === "/"
      ? "index.html"
      : enUrl.endsWith("/")
        ? enUrl.slice(1) + "index.html"
        : enUrl.slice(1) + ".html";
  return code === "en" ? rel : join("lang", code, rel);
}

// ---- generate ----

const written = [];

function write(filePath, content) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, "utf8");
  written.push(filePath);
}

for (const lang of LANGUAGES) {
  const t = T[lang.code];
  if (!t) throw new Error(`Missing translation for ${lang.code}`);
  const html = render(template, homeVars(lang.code, t));
  write(join(PROJECT, fsPath(lang.code, "home")), html);
}

for (const lang of LANGUAGES) {
  const t = T[lang.code];
  const labels = labelsFor(lang.code);
  for (const p of PSEO) {
    const page = lang.code === "en" ? { ...p, howH2: p.howH2 || `How to ${p.primary}` } : PT[lang.code].tools[p.slug];
    const html = render(template, toolVars(p, t, lang.code, page, labels));
    write(join(PROJECT, fsPath(lang.code, "tool", p.slug)), html);
  }
}

for (const lang of LANGUAGES) {
  write(join(PROJECT, fsPath(lang.code, "blogIndex")), blogIndexHtmlFor(lang.code));
  const labels = labelsFor(lang.code);
  for (const b of BLOG) {
    const page = lang.code === "en" ? b : PT[lang.code].blog[b.slug];
    const html = render(template, articleVars(b, lang.code, page, labels));
    write(join(PROJECT, fsPath(lang.code, "article", b.slug)), html);
  }
}

for (const lang of LANGUAGES) {
  const t = T[lang.code];
  const labels = labelsFor(lang.code);
  for (const i of INFO) {
    const page = lang.code === "en" ? i : PT[lang.code].info[i.slug];
    const html = render(template, infoVars(i, lang.code, page, labels));
    write(join(PROJECT, fsPath(lang.code, "info", i.slug)), html);
  }
}

const lastmod = new Date().toISOString().slice(0, 10);

function sitemapEntry(lang, type, slug, priority, changefreq) {
  return (
    `  <url>\n` +
    `    <loc>${DOMAIN}${pathFor(lang, type, slug)}</loc>\n` +
    `    <lastmod>${lastmod}</lastmod>\n` +
    `    <changefreq>${changefreq}</changefreq>\n` +
    `    <priority>${priority}</priority>\n` +
    `    ${altLinks(type, slug)}\n` +
    `  </url>`
  );
}

const SM_HEADER =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;

for (const lang of LANGUAGES) {
  const entries = [];
  entries.push(sitemapEntry(lang.code, "home", null, "1.0", "daily"));
  for (const p of PSEO) {
    entries.push(sitemapEntry(lang.code, "tool", p.slug, "0.8", "weekly"));
  }
  entries.push(sitemapEntry(lang.code, "blogIndex", null, "0.6", "weekly"));
  for (const b of BLOG) {
    entries.push(sitemapEntry(lang.code, "article", b.slug, "0.6", "monthly"));
  }
  for (const i of INFO) {
    entries.push(sitemapEntry(lang.code, "info", i.slug, "0.3", "yearly"));
  }
  write(
    join(PROJECT, `sitemap-${lang.code}.xml`),
    SM_HEADER + entries.join("\n") + "\n</urlset>\n"
  );
}

const sitemapIndex =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  LANGUAGES.map(
    (lang) =>
      `  <sitemap>\n` +
      `    <loc>${DOMAIN}/sitemap-${lang.code}.xml</loc>\n` +
      `    <lastmod>${lastmod}</lastmod>\n` +
      `  </sitemap>`
  ).join("\n") +
  `\n</sitemapindex>\n`;
write(join(PROJECT, "sitemap.xml"), sitemapIndex);

const robots = `User-agent: *
Allow: /

Sitemap: ${DOMAIN}/sitemap.xml
`;
write(join(PROJECT, "robots.txt"), robots);

const securityTxt = `Contact: ${DOMAIN}/contact
Expires: 2027-08-08T00:00:00.000Z
Preferred-Languages: en
Canonical: ${DOMAIN}/security.txt
`;
write(join(PROJECT, "security.txt"), securityTxt);
write(join(PROJECT, ".well-known", "security.txt"), securityTxt);

const adsTxt = `google.com, pub-7868097386681738, DIRECT, f08c47fec0942fa0
`;
write(join(PROJECT, "ads.txt"), adsTxt);

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
  `Generated ${written.length} files (${LANGUAGES.length} locales x home/tools/blog/info).`
);
console.log(errors ? `${errors} verification error(s)!` : "Verification OK.");

// ---- SEO audit (informational; does not fail the build) ----
import { spawnSync } from "node:child_process";
const audit = spawnSync(process.execPath, [join(TOOLS_DIR, "seo-audit.mjs")], {
  encoding: "utf8",
});
if (audit.stdout) console.log(audit.stdout);
if (audit.stderr) console.error(audit.stderr);
if (audit.status !== 0) {
  console.log("SEO audit found issues (see report above). Fix them before deploying.");
}
