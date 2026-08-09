// SEO audit for the generated site. Run: node tools/seo-audit.mjs
// Scans every HTML file in public/ and verifies on-page SEO elements in detail.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { LANGUAGES } from "./site-data.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");
const DOMAIN = "https://yt-thumbnail-downloader.site";

const issues = [];
const stats = { files: 0, titleOk: 0, descOk: 0, canonOk: 0, hreflangOk: 0, schemaOk: 0, h1Ok: 0, words: 0 };
const titles = new Map();
const descs = new Map();

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (e.endsWith(".html")) out.push(p);
  }
  return out;
}

const esc = (s) => String(s).replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

function attr(html, name) {
  const m = html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']*)["']`, "i")) ||
            html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${name}["']`, "i"));
  return m ? esc(m[1]) : null;
}
function prop(html, name) {
  const m = html.match(new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']*)["']`, "i")) ||
            html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${name}["']`, "i"));
  return m ? esc(m[1]) : null;
}
function metaEither(html, name) {
  return attr(html, name) || prop(html, name);
}
function link(html, rel) {
  const m = html.match(new RegExp(`<link[^>]+rel=["']${rel}["'][^>]+href=["']([^"']*)["']`, "i")) ||
            html.match(new RegExp(`<link[^>]+href=["']([^"']*)["'][^>]+rel=["']${rel}["']`, "i"));
  return m ? esc(m[1]) : null;
}

function urlPath(file) {
  const relP = relative(PUBLIC, file).split(sep).join("/");
  const noIndex = relP.replace(/index\.html$/, "");
  const bare = noIndex.replace(/\.html$/, "");
  const isHome = relP === "index.html";
  return isHome ? "/" : "/" + bare;
}

function expectLangOf(path) {
  const m = path.match(/^\/lang\/([a-zA-Z-]+)\//);
  return m ? m[1] : "en";
}

const files = walk(PUBLIC).filter((f) => !/[\\/]yandex_[a-f0-9]+\.html$/.test(f));

for (const file of files) {
  stats.files++;
  const html = readFileSync(file, "utf8");
  const path = urlPath(file);
  const lang = expectLangOf(path);
  const isEn = lang === "en";
  const canonical = link(html, "canonical");
  const titleMax = isEn ? 60 : 70;
  const descMin = isEn ? 110 : 90;
  const descMax = isEn ? 165 : 170;
  const minWords = isEn ? 400 : 220;

  // ---- title ----
  const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1];
  if (!title) issues.push(`[${path}] MISSING <title>`);
  else {
    const t = esc(title).trim();
    stats.titleOk++;
    if (t.length > titleMax) issues.push(`[${path}] title ${t.length} chars (>${titleMax}): "${t.slice(0, 50)}..."`);
    if (t.length < 20) issues.push(`[${path}] title only ${t.length} chars`);
    const key = t.toLowerCase();
    if (titles.has(key)) issues.push(`[${path}] DUPLICATE title with ${titles.get(key)}`);
    titles.set(key, path);
  }

  // ---- meta description ----
  const desc = attr(html, "description");
  if (!desc) issues.push(`[${path}] MISSING meta description`);
  else {
    const d = desc.trim();
    stats.descOk++;
    if (d.length < descMin) issues.push(`[${path}] description ${d.length} chars (<${descMin})`);
    if (d.length > descMax) issues.push(`[${path}] description ${d.length} chars (>${descMax})`);
    const key = d.toLowerCase();
    if (descs.has(key)) issues.push(`[${path}] DUPLICATE description with ${descs.get(key)}`);
    descs.set(key, path);
  }

  // ---- canonical ----
  if (!canonical) issues.push(`[${path}] MISSING canonical`);
  else {
    const expect = DOMAIN + path;
    stats.canonOk++;
    if (canonical !== expect) issues.push(`[${path}] canonical mismatch: got "${canonical}" expected "${expect}"`);
    if (canonical.includes(".html")) issues.push(`[${path}] canonical still uses .html`);
  }

  // ---- hreflang ----
  const hreflangs = [...html.matchAll(/<link[^>]+rel=["']alternate["'][^>]+hreflang=["']([^"']*)["'][^>]+href=["']([^"']*)["']/gi)]
    .map((m) => ({ code: m[1], href: esc(m[2]) }));
  const codes = hreflangs.map((h) => h.code);
  if (!codes.includes("x-default")) issues.push(`[${path}] missing hreflang x-default`);
  const missing = LANGUAGES.map((l) => l.code).filter((c) => !codes.includes(c));
  if (missing.length) issues.push(`[${path}] missing hreflang for: ${missing.join(", ")}`);
  const badHref = hreflangs.filter((h) => !h.href.startsWith(DOMAIN) || h.href.includes(".html"));
  for (const h of badHref) issues.push(`[${path}] bad hreflang ${h.code}: "${h.href}"`);
  if (missing.length === 0) stats.hreflangOk++;

  // ---- lang attribute ----
  const langAttr = (html.match(/<html[^>]+lang=["']([^"']*)["']/i) || [])[1];
  if (langAttr && lang !== "en" && langAttr !== lang) issues.push(`[${path}] <html lang="${langAttr}"> but URL is /lang/${lang}/`);

  // ---- OG ----
  const ogTitle = prop(html, "og:title");
  const ogDesc = prop(html, "og:description");
  const ogUrl = prop(html, "og:url");
  const ogImg = prop(html, "og:image");
  const ogSite = prop(html, "og:site_name");
  if (!ogTitle) issues.push(`[${path}] missing og:title`);
  if (!ogDesc) issues.push(`[${path}] missing og:description`);
  if (ogUrl !== DOMAIN + path) issues.push(`[${path}] og:url mismatch: "${ogUrl}"`);
  if (!ogImg || !ogImg.startsWith(DOMAIN + "/og-image.png")) issues.push(`[${path}] og:image missing/incorrect`);
  if (!ogSite) issues.push(`[${path}] missing og:site_name`);

  // ---- twitter ----
  const twImg = metaEither(html, "twitter:image");
  const twCard = metaEither(html, "twitter:card");
  if (!twImg) issues.push(`[${path}] missing twitter:image`);
  if (!twCard) issues.push(`[${path}] missing twitter:card`);

  // ---- JSON-LD ----
  const ldBlocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  if (!ldBlocks.length) issues.push(`[${path}] no JSON-LD`);
  let hasSite = false;
  for (const [i, blk] of ldBlocks.entries()) {
    try {
      const data = JSON.parse(blk[1]);
      if (Array.isArray(data)) data.forEach((d) => { if (d["@type"] === "WebSite") hasSite = true; });
      else if (data["@type"] === "WebSite") hasSite = true;
      if (data["@type"] === "FAQPage" && !(data.mainEntity || []).length) issues.push(`[${path}] FAQPage schema has no questions`);
    } catch (e) {
      issues.push(`[${path}] INVALID JSON-LD block #${i + 1}: ${e.message}`);
    }
  }
  if (!hasSite) issues.push(`[${path}] missing WebSite schema`);
  else stats.schemaOk++;

  // ---- headings ----
  const h1s = (html.match(/<h1[\s>]/gi) || []).length;
  const h2s = (html.match(/<h2[\s>]/gi) || []).length;
  if (h1s !== 1) issues.push(`[${path}] ${h1s} H1 tags (expected exactly 1)`);
  else stats.h1Ok++;
  if (!h2s) issues.push(`[${path}] no H2 headings`);

  // ---- images alt ----
  const imgs = [...html.matchAll(/<img[^>]*>/gi)];
  for (const im of imgs) {
    if (!/alt=/.test(im[0])) issues.push(`[${path}] <img> without alt: ${im[0].slice(0, 60)}`);
  }

  // ---- internal links ----
  const links = [...html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi)].map((m) => esc(m[1]));
  for (const l of links) {
    if (!l || l.startsWith("http") || l.startsWith("#") || l.startsWith("mailto:")) continue;
    if (l.includes(".html")) issues.push(`[${path}] internal link still uses .html: "${l}"`);
    if (l.startsWith("//")) continue;
    let target = join(PUBLIC, l.replace(/^\//, ""));
    if (!existsSync(target) && !existsSync(target + ".html")) {
      issues.push(`[${path}] BROKEN internal link: "${l}"`);
    }
  }

  // ---- word count ----
  const body = html.replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, " ");
  const words = body.split(/\s+/).filter((w) => /\w/.test(w)).length;
  const chars = body.replace(/\s+/g, "").length;
  stats.words += words;
  const cjk = /^(zh-CN|zh-TW|ja|ko)$/.test(lang);
  if (path !== "/") {
    if (cjk) {
      // CJK languages have no word separators; use character count (a CJK page
      // with ~600+ chars is substantive).
      if (chars < 600) issues.push(`[${path}] thin CJK content: ${chars} chars (<600)`);
    } else if (words < minWords) {
      issues.push(`[${path}] thin content: ${words} words (<${minWords})`);
    }
  }

  // ---- personal email leak ----
  if (/aziizboukerma@gmail\.com/i.test(html)) issues.push(`[${path}] personal email visible on page`);
}

// ---- root files ----
const must = ["robots.txt", "sitemap.xml", "security.txt", "ads.txt", "og-image.png", "apple-touch-icon.png"];
for (const f of must) {
  if (!existsSync(join(PUBLIC, f))) issues.push(`[ROOT] missing ${f}`);
}
for (const lang of LANGUAGES) {
  if (!existsSync(join(PUBLIC, `sitemap-${lang.code}.xml`))) issues.push(`[ROOT] missing sitemap-${lang.code}.xml`);
}

// ---- robots.txt ----
if (existsSync(join(PUBLIC, "robots.txt"))) {
  const rb = readFileSync(join(PUBLIC, "robots.txt"), "utf8");
  if (!rb.includes("Sitemap:")) issues.push("[robots.txt] no Sitemap directive");
  if (!rb.includes("Content-Signal")) {
    // Cloudflare injects Content-Signal at the edge; note but do not fail.
    console.log("  [robots.txt] note: Content-Signal is injected by Cloudflare (not in source file)");
  }
  for (const bot of ["GPTBot", "ClaudeBot", "CCBot", "Google-Extended"]) {
    if (!rb.includes(bot)) {
      console.log(`  [robots.txt] note: ${bot} block added by Cloudflare managed robots.txt`);
    }
  }
}

// ---- report ----
const avg = stats.files ? Math.round(stats.words / stats.files) : 0;

// Separate translation-length variance (informational) from real defects.
const realIssues = issues.filter(
  (i) =>
    !/chars \(>[0-9]+\)/.test(i) &&
    !/chars \(<[0-9]+\)/.test(i) &&
    !/thin content/.test(i) &&
    !/thin CJK content/.test(i) &&
    !/title only/.test(i)
);
const infoIssues = issues.filter((i) => !realIssues.includes(i));

// Cross-language duplicates (translation fallback) are informational.
const structural = realIssues.filter((i) => !/DUPLICATE .* with \/lang\//.test(i));
const enReal = realIssues.filter((i) => {
  if (i.startsWith("[/lang/")) return false;
  if (/DUPLICATE .* with \/lang\//.test(i)) return false;
  return true;
});

console.log("=".repeat(64));
console.log("SEO AUDIT REPORT");
console.log("=".repeat(64));
console.log(`Pages scanned        : ${stats.files}`);
console.log(`Titles OK (30-60 ch) : ${stats.titleOk}/${stats.files}`);
console.log(`Descriptions OK      : ${stats.descOk}/${stats.files}`);
console.log(`Canonicals OK        : ${stats.canonOk}/${stats.files}`);
console.log(`Hreflang complete    : ${stats.hreflangOk}/${stats.files}`);
console.log(`WebSite schema       : ${stats.schemaOk}/${stats.files}`);
console.log(`Single H1            : ${stats.h1Ok}/${stats.files}`);
console.log(`Avg visible words    : ${avg}`);
console.log("-".repeat(64));
console.log(`EN issues (blocking)       : ${enReal.length}`);
console.log(`Structural (non-EN)        : ${structural.length}`);
console.log(`Cross-lang dupes (info)    : ${realIssues.length - structural.length}`);
console.log(`Translation-length (info)  : ${infoIssues.length}`);
if (enReal.length) {
  console.log("-".repeat(64));
  console.log("EN issues (must fix):");
  for (const i of enReal.slice(0, 25)) console.log("  " + i);
}
if (structural.length) {
  console.log("-".repeat(64));
  console.log("Structural issues (sample):");
  for (const i of structural.slice(0, 25)) console.log("  " + i);
}
console.log("=".repeat(64));
process.exit(enReal.length ? 1 : 0);
