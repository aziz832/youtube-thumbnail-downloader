import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { LANGUAGES, PSEO, BLOG, INFO } from "./site-data.mjs";
import { EN_LABELS, EN_UI, EN_HOME } from "./content.mjs";
import { TOOL_CONTENT } from "./tool-content.mjs";

const BATCH = 40;
const MAX_ATTEMPTS = 3;
const CONCURRENCY = 4;

const TARGETS = LANGUAGES.filter((l) => l.code !== "en");

const TOKEN_PATTERNS = [
  /https?:\/\/[^\s'"<>]+/g,
  /[0-9]{3,4}\s*[x\u00d7]\s*[0-9]{3,4}/g,
  /(?:maxresdefault|sddefault|hqdefault|mqdefault)(?:\.jpg)?\b/g,
  /(?:default|1|2)\.jpg\b/g,
  /\b(?:VIDEO_ID|SIZE)\b/g,
  /\b(?:JPG|PNG|GIF)\b/g,
  /\b2MB\b/g,
  /\b11-character\b/g,
  /\b16:9\b/g,
  /i\.ytimg\.com\b/g,
  /youtube\.com\/watch\?v=/g,
  /youtu\.be\//g,
  /\/shorts\//g,
  /\/embed\//g,
  /\/live\//g,
];

function protect(text) {
  const tokens = [];
  const out = text.replace(new RegExp(TOKEN_PATTERNS.map((r) => r.source).join("|"), "g"), (m) => {
    tokens.push(m);
    return "@@" + (tokens.length - 1) + "@@";
  });
  return { text: out, tokens };
}

function restore(text, tokens) {
  return text.replace(/@@(\d+)@@/g, (_, i) => tokens[Number(i)] ?? "");
}

function registerStrings(set) {
  const add = (s) => {
    if (typeof s === "string" && s) set.add(s);
  };
  for (const p of PSEO) {
    add(p.title);
    add(p.meta);
    add(p.h1);
    add(p.primary);
    add(p.howH2);
    add(`What is a ${p.h1}?`);
    add(`Why use this ${p.h1}?`);
    add(`Get started with this ${p.h1}`);
    p.intro.forEach(add);
    p.steps.forEach(add);
    p.benefits?.forEach(add);
    p.faq.forEach(([q, a]) => {
      add(q);
      add(a);
    });
    const dc = TOOL_CONTENT[p.slug];
    if (dc) {
      dc.whatIs?.forEach(add);
      if (dc.why) {
        add(dc.why.para);
        dc.why.bullets.forEach(add);
      }
      dc.conclusion?.forEach(add);
      dc.extraFaq?.forEach(([q, a]) => {
        add(q);
        add(a);
      });
    }
  }
  for (const b of BLOG) {
    add(b.title);
    add(b.meta);
    add(b.h1);
    b.intro.forEach(add);
    b.sections.forEach(([h, items]) => {
      add(h);
      items.forEach(add);
    });
    b.faq.forEach(([q, a]) => {
      add(q);
      add(a);
    });
  }
  for (const i of INFO) {
    add(i.title);
    add(i.meta);
    add(i.h1);
    i.sections.forEach(([h, par]) => {
      add(h);
      add(par);
    });
  }
  add(EN_LABELS.guidesH2);
  add(EN_LABELS.siteH2);
  add(EN_LABELS.guidesCrumb);
  add(EN_LABELS.langLabel);
  add(EN_LABELS.blogIndexTitle);
  add(EN_LABELS.blogIndexMeta);
  add(EN_LABELS.blogIndexSubtitle);
  add(EN_LABELS.blogCtaH2);
  add(EN_LABELS.blogCtaP);
  for (const k of Object.keys(EN_UI)) add(EN_UI[k]);
  for (const k of Object.keys(EN_HOME)) {
    if (Array.isArray(EN_HOME[k])) {
      if (EN_HOME[k].length && Array.isArray(EN_HOME[k][0])) {
        EN_HOME[k].forEach((item) => item.forEach(add));
      } else {
        EN_HOME[k].forEach(add);
      }
    } else if (typeof EN_HOME[k] === "object" && EN_HOME[k] !== null) {
      Object.values(EN_HOME[k]).forEach(add);
    } else {
      add(EN_HOME[k]);
    }
  }
}

const unique = new Set();
registerStrings(unique);
const UNIQUE = [...unique];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const OVERRIDES = {
  de: { ui: { clear: "Leeren", qThumb1: "Miniatur 1", qThumb2: "Miniatur 2" }, labels: { guidesH2: "Anleitungen", guidesCrumb: "Anleitungen" } },
  es: { ui: { qThumb1: "Miniatura 1", qThumb2: "Miniatura 2" } },
  fr: { ui: { qThumb1: "Miniature 1", qThumb2: "Miniature 2" } },
  it: { ui: { clear: "Cancella", qThumb1: "Miniatura 1", qThumb2: "Miniatura 2" } },
  pt: { ui: { qThumb1: "Miniatura 1", qThumb2: "Miniatura 2" }, labels: { siteH2: "Site" } },
  nl: { ui: { clear: "Wissen", qThumb1: "Miniatuur 1", qThumb2: "Miniatuur 2" }, labels: { siteH2: "Site" } },
  pl: { ui: { clear: "Wyczyść", qThumb1: "Miniatura 1", qThumb2: "Miniatura 2" } },
  sv: { ui: { copied: "Kopierat!", qThumb1: "Miniatyr 1", qThumb2: "Miniatyr 2" }, labels: { siteH2: "Webbplats" } },
  da: { ui: { qThumb1: "Miniature 1", qThumb2: "Miniature 2" }, labels: { siteH2: "Websted" } },
  no: { ui: { clear: "Tøm", qThumb1: "Miniatyr 1", qThumb2: "Miniatyr 2" }, labels: { siteH2: "Nettsted" } },
  fi: { ui: { clear: "Tyhjennä", qThumb1: "Pikkukuva 1", qThumb2: "Pikkukuva 2" } },
  cs: { ui: { clear: "Vymazat", qThumb1: "Miniatura 1", qThumb2: "Miniatura 2" }, labels: { siteH2: "Web" } },
  el: { ui: { clear: "Εκκαθάριση", qThumb1: "Μικρογραφία 1", qThumb2: "Μικρογραφία 2" } },
  ro: { ui: { clear: "Șterge", qThumb1: "Miniatură 1", qThumb2: "Miniatură 2" } },
  hu: { ui: { clear: "Ürítés", qThumb1: "Bélyegkép 1", qThumb2: "Bélyegkép 2" } },
  tr: { ui: { qThumb1: "Küçük resim 1", qThumb2: "Küçük resim 2" }, labels: { siteH2: "Site" } },
  ru: { ui: { qThumb1: "Миниатюра 1", qThumb2: "Миниатюра 2" } },
  uk: { ui: { clear: "Очистити", qThumb1: "Мініатюра 1", qThumb2: "Мініатюра 2" } },
  ar: { ui: { clear: "مسح", copied: "تم النسخ!", qThumb1: "الصورة المصغرة 1", qThumb2: "الصورة المصغرة 2" } },
  he: { ui: { clear: "נקה", qThumb1: "תמונה ממוזערת 1", qThumb2: "תמונה ממוזערת 2" } },
  fa: { ui: { qThumb1: "بندانگشتی 1", qThumb2: "بندانگشتی 2" } },
  hi: { ui: { clear: "साफ़ करें", copied: "कॉपी किया गया!", qThumb1: "थंबनेल 1", qThumb2: "थंबनेल 2" } },
  bn: { ui: { clear: "মুছুন", copied: "কপি করা হয়েছে!", qThumb1: "থাম্বনেইল 1", qThumb2: "থাম্বনেইল 2" } },
  ur: { ui: { clear: "صاف کریں", qThumb1: "تھمب نیل 1", qThumb2: "تھمب نیل 2" } },
  ja: { ui: { qThumb1: "サムネイル1", qThumb2: "サムネイル2" } },
  ko: { ui: { qThumb1: "썸네일 1", qThumb2: "썸네일 2" } },
  "zh-CN": { ui: { qThumb1: "缩略图1", qThumb2: "缩略图2" } },
  "zh-TW": { ui: { qThumb1: "縮圖1", qThumb2: "縮圖2" } },
  vi: { ui: { qThumb1: "Hình thu nhỏ 1", qThumb2: "Hình thu nhỏ 2" } },
  th: { ui: { clear: "ล้าง", qThumb1: "ภาพขนาดย่อ 1", qThumb2: "ภาพขนาดย่อ 2" }, labels: { guidesH2: "คู่มือ", guidesCrumb: "คู่มือ" } },
  id: { ui: { clear: "Bersihkan", qThumb1: "Gambar mini 1", qThumb2: "Gambar mini 2" } },
  ms: { ui: { clear: "Padam", qThumb1: "Gambar kecil 1", qThumb2: "Gambar kecil 2" } },
  tl: { ui: { qThumb1: "Thumbnail 1", qThumb2: "Thumbnail 2" } },
};

function applyOverrides(lang, data) {
  const ov = OVERRIDES[lang];
  if (!ov) return;
  for (const section of Object.keys(ov)) {
    for (const key of Object.keys(ov[section])) {
      if (data[section] && data[section][key] !== undefined) data[section][key] = ov[section][key];
    }
  }
}

async function translateBatch(texts, tl) {
  const joined = texts.map((t) => protect(t).text).join("\n");
  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=" +
    tl +
    "&dt=t&q=" +
    encodeURIComponent(joined);
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();
  if (!Array.isArray(data) || !Array.isArray(data[0])) throw new Error("bad payload");
  const joinedOut = data[0].map((seg) => seg[0] || "").join("");
  const parts = joinedOut.split("\n");
  if (parts.length !== texts.length) {
    throw new Error("segment count mismatch: " + parts.length + " vs " + texts.length);
  }
  return texts.map((t, i) => {
    const p = protect(t);
    const out = restore(parts[i], p.tokens);
    return out.trim() ? out : t;
  });
}

async function translateLanguage(tl) {
  const translations = new Array(UNIQUE.length);
  let failures = 0;
  for (let i = 0; i < UNIQUE.length; i += BATCH) {
    const chunk = UNIQUE.slice(i, i + BATCH);
    let ok = false;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const out = await translateBatch(chunk, tl);
        for (let j = 0; j < chunk.length; j++) translations[i + j] = out[j];
        ok = true;
        break;
      } catch (err) {
        if (attempt === MAX_ATTEMPTS) {
          failures += chunk.length;
          console.log(`  [${tl}] batch ${i / BATCH + 1} FAILED (${err.message}) — falling back to EN`);
        } else {
          await sleep(attempt * 1200);
        }
      }
    }
    if (!ok) {
      for (let j = 0; j < chunk.length; j++) translations[i + j] = chunk[j];
    }
    await sleep(60);
  }
  const map = new Map();
  for (let i = 0; i < UNIQUE.length; i++) map.set(UNIQUE[i], translations[i] || UNIQUE[i]);
  return { map, failures };
}

function buildLang(tl, map) {
  const tr = (s) => map.get(s) ?? s;
  const trPair = ([q, a]) => [tr(q), tr(a)];

  const tools = {};
  for (const p of PSEO) {
    const dc = TOOL_CONTENT[p.slug];
    const h1 = p.h1;
    tools[p.slug] = {
      title: tr(p.title),
      meta: tr(p.meta),
      h1: tr(h1),
      primary: tr(p.primary),
      howH2: tr(p.howH2),
      intro: p.intro.map(tr),
      steps: p.steps.map(tr),
      benefits: p.benefits?.map(tr),
      faq: p.faq.map(trPair),
      whatIsH2: tr(`What is a ${h1}?`),
      whyH2: tr(`Why use this ${h1}?`),
      startH2: tr(`Get started with this ${h1}`),
      ...(dc
        ? {
            whatIs: dc.whatIs?.map(tr),
            why: dc.why
              ? { para: tr(dc.why.para), bullets: dc.why.bullets.map(tr) }
              : undefined,
            conclusion: dc.conclusion?.map(tr),
            extraFaq: dc.extraFaq?.map(trPair),
          }
        : {}),
    };
  }

  const blog = {};
  for (const b of BLOG) {
    blog[b.slug] = {
      title: tr(b.title),
      meta: tr(b.meta),
      h1: tr(b.h1),
      intro: b.intro.map(tr),
      sections: b.sections.map(([h, items]) => [tr(h), items.map(tr)]),
      faq: b.faq.map(trPair),
    };
  }

  const info = {};
  for (const i of INFO) {
    info[i.slug] = {
      title: tr(i.title),
      meta: tr(i.meta),
      h1: tr(i.h1),
      sections: i.sections.map(([h, par]) => [tr(h), tr(par)]),
    };
  }

  const ui = {};
  for (const k of Object.keys(EN_UI)) ui[k] = tr(EN_UI[k]);

  const labels = {};
  for (const k of Object.keys(EN_LABELS)) labels[k] = tr(EN_LABELS[k]);

  const home = {};
  for (const k of Object.keys(EN_HOME)) {
    const v = EN_HOME[k];
    if (Array.isArray(v)) {
      if (v.length && Array.isArray(v[0])) {
        home[k] = v.map((item) => item.map(tr));
      } else {
        home[k] = v.map(tr);
      }
    } else if (typeof v === "object" && v !== null) {
      const o = {};
      for (const kk of Object.keys(v)) o[kk] = tr(v[kk]);
      home[k] = o;
    } else {
      home[k] = tr(v);
    }
  }

  return { ui, labels, home, tools, blog, info };
}

async function main() {
  console.log(`Unique EN strings to translate: ${UNIQUE.length}`);
  console.log(`Target languages: ${TARGETS.length}`);
  const results = {};
  let cursor = 0;
  const worker = async (tl) => {
    console.log(`  [${tl}] start (${UNIQUE.length} strings)`);
    const { map, failures } = await translateLanguage(tl);
    const data = buildLang(tl, map);
    applyOverrides(tl, data);
    results[tl] = { data, failures };
    console.log(`  [${tl}] done (${failures} fallbacks)`);
  };
  const jobs = TARGETS.map((l) => l.code);
  while (cursor < jobs.length) {
    const slice = jobs.slice(cursor, cursor + CONCURRENCY);
    await Promise.all(slice.map(worker));
    cursor += CONCURRENCY;
  }

  const PT = {};
  for (const l of TARGETS) PT[l.code] = results[l.code].data;

  const header = "// AUTO-GENERATED by tools/fetch-translations.mjs — machine translations, best-effort.\n// Do not edit by hand. Re-run `node tools/fetch-translations.mjs` to regenerate.\n";
  writeFileSync(
    "tools/pages-translations.mjs",
    header + "export const PT = " + JSON.stringify(PT, null, 0) + ";\n",
    "utf8"
  );

  const totalFailures = TARGETS.reduce((n, l) => n + results[l.code].failures, 0);
  console.log(`\nWrote tools/pages-translations.mjs (${TARGETS.length} languages).`);
  console.log(totalFailures ? `${totalFailures} strings fell back to English.` : "No fallbacks.");
}

const isDirect =
  process.argv[1] &&
  fileURLToPath(import.meta.url).toLowerCase() ===
    (process.platform === "win32" ? process.argv[1].toLowerCase() : process.argv[1]);

if (isDirect) {
  main().catch((err) => {
    console.error("FATAL", err);
    process.exit(1);
  });
}
