import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SITE, LANGUAGES, PSEO } from "./site-data.mjs";
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

function webAppJsonLd(name, url, desc, lang) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name,
    url,
    description: desc,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    inLanguage: lang,
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
  return (
    `<script type="application/ld+json">${jsonScript(webAppJsonLd(SITE.toolName, canonical, t.metaDesc, lang))}</script>\n  ` +
    `<script type="application/ld+json">${jsonScript(faqJsonLd(t.faq))}</script>`
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
  return (
    `<script type="application/ld+json">${jsonScript(webAppJsonLd(SITE.toolName, canonical, p.meta, "en"))}</script>\n  ` +
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
  return `<script>window.UI_TEXT=${jsonScript({
    placeholder: t.placeholder,
    tips: t.tips,
    getThumbs: t.getThumbs,
    example: t.example,
    loading: t.loading,
    download: t.download,
    open: t.open,
    notAvailable: t.notAvailable,
    sizesTitle: t.sizesTitle,
    sizesSub: t.sizesSub,
    videoTitle: t.videoTitle,
    openVideo: t.openVideo,
    qDefault: t.qDefault,
    invalidMsg: t.invalidMsg,
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
    `      <h2 class="footer-title">${escapeHtml(langH2)}</h2>\n` +
    `      <div class="related-grid lang-grid">\n${langs}\n      </div>\n` +
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

function baseVars(t, lang, canonical) {
  return {
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
  vars.contentSections = contentSectionsForTranslation(t);
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
console.log(`Generated ${written.length} files (${LANGUAGES.length} locales, ${PSEO.length} tool pages).`);
console.log(errors ? `${errors} verification error(s)!` : "Verification OK.");
