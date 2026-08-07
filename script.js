const UI_TEXT = window.UI_TEXT || {
  placeholder: "Paste a YouTube link \u2014 e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  tips: "Paste a video URL and press Enter \u00b7 Supports watch, youtu.be, shorts and embed links",
  getThumbs: "Get Thumbnails",
  example: "Example",
  loading: "Loading\u2026",
  download: "Download",
  open: "Open in new tab",
  notAvailable: "Not available",
  sizesTitle: "Available thumbnails",
  sizesSub: "Click Download to save the image to your device.",
  videoTitle: "YouTube video",
  openVideo: "Open video on YouTube",
  qDefault: "Default",
  invalidMsg: "Couldn't find a video ID in that link. Paste a YouTube URL like watch, shorts, or youtu.be.",
};

const urlInput = document.getElementById("urlInput");
const btnFetch = document.getElementById("btnFetch");
const btnExample = document.getElementById("btnExample");
const errorBox = document.getElementById("errorBox");
const results = document.getElementById("results");
const videoTitle = document.getElementById("videoTitle");
const videoChannel = document.getElementById("videoChannel");
const videoLink = document.getElementById("videoLink");
const preview = document.getElementById("preview");
const thumbGrid = document.getElementById("thumbGrid");

const EXAMPLE = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

const QUALITIES = [
  { key: "maxresdefault", label: "HD", res: "1280\u00d7720", note: "Highest quality" },
  { key: "sddefault", label: "SD", res: "640\u00d7480", note: "Standard" },
  { key: "hqdefault", label: "HQ", res: "480\u00d7360", note: "High quality" },
  { key: "mqdefault", label: "MQ", res: "320\u00d7180", note: "Medium quality" },
  { key: "default", label: UI_TEXT.qDefault, res: "120\u00d790", note: "Smallest" },
];

const PREVIEW_ORDER = ["maxresdefault", "sddefault", "hqdefault"];

function extractVideoId(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const v = raw.match(/[?&]v=([A-Za-z0-9_-]{11})(?![A-Za-z0-9_-])/);
  if (v) return v[1];
  const yt = raw.match(
    /(?:youtu\.be\/|(?:[\w-]+\.)?youtube\.com\/(?:shorts|embed|live|v)\/|youtube-nocookie\.com\/(?:embed|shorts|live|v)\/)([A-Za-z0-9_-]{11})/
  );
  if (yt) return yt[1];
  const bare = raw.match(/^[A-Za-z0-9_-]{11}$/);
  if (bare) return bare[0];
  return null;
}

function thumbnailUrl(id, key) {
  return "https://i.ytimg.com/vi/" + encodeURIComponent(id) + "/" + key + ".jpg";
}

function setError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
  setTimeout(() => {
    errorBox.hidden = true;
  }, 6000);
}

function clearResults() {
  results.hidden = true;
  thumbGrid.innerHTML = "";
  videoTitle.textContent = "";
  videoChannel.textContent = "";
}

async function loadVideoMeta(id, videoUrl) {
  try {
    const res = await fetch("https://noembed.com/embed?url=" + encodeURIComponent(videoUrl));
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.title) {
      return { title: data.title, author: data.author_name || "" };
    }
  } catch (err) {
    /* optional metadata only — ignore failures */
  }
  return null;
}

function setPreview(id, attempt) {
  if (attempt >= PREVIEW_ORDER.length) return;
  const key = PREVIEW_ORDER[attempt];
  preview.src = thumbnailUrl(id, key);
  preview.onload = () => {};
  preview.onerror = () => setPreview(id, attempt + 1);
}

function renderGrid(id) {
  thumbGrid.innerHTML = "";
  QUALITIES.forEach((q) => {
    const url = thumbnailUrl(id, q.key);
    const card = document.createElement("div");
    card.className = "thumb-card";
    card.innerHTML =
      '<div class="thumb-wrap">' +
      '<img src="' + url + '" alt="' + q.label + " " + q.res + " " + UI_TEXT.getThumbs + '" />' +
      '<div class="thumb-loading" aria-hidden="true"><span class="spinner"></span></div>' +
      '<div class="thumb-missing" hidden>' + UI_TEXT.notAvailable + "</div>" +
      "</div>" +
      '<div class="thumb-info">' +
      '<div class="thumb-label"><span class="thumb-badge">' + q.label + "</span>" +
      '<span class="thumb-res">' + q.res + "</span></div>" +
      '<div class="thumb-actions">' +
      '<button class="ghost small" data-dl="' + url + '" data-name="' + id + "-" + q.key + '.jpg" disabled>' + UI_TEXT.download + "</button>" +
      '<a class="thumb-open" href="' + url + '" target="_blank" rel="noopener" title="' + UI_TEXT.open + '" aria-label="' + UI_TEXT.open + '">&#8599;</a>' +
      "</div>" +
      "</div>";

    const img = card.querySelector("img");
    let retried = false;
    img.addEventListener("load", () => {
      card.querySelector(".thumb-loading").hidden = true;
      card.querySelector("button[data-dl]").disabled = false;
    });
    img.addEventListener("error", () => {
      if (!retried) {
        retried = true;
        img.src = url;
        return;
      }
      card.querySelector(".thumb-loading").hidden = true;
      card.querySelector(".thumb-missing").hidden = false;
    });
    thumbGrid.appendChild(card);
  });
}

async function downloadImage(url, name) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("bad status");
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objUrl), 4000);
  } catch (err) {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
}

async function loadVideo(value) {
  const id = extractVideoId(value);
  if (!id) {
    setError(UI_TEXT.invalidMsg);
    return;
  }

  clearResults();
  btnFetch.disabled = true;
  btnFetch.textContent = UI_TEXT.loading;
  try {
    const meta = await loadVideoMeta(id, value.trim());
    if (meta) {
      videoTitle.textContent = meta.title;
      if (meta.author) {
        videoChannel.textContent = meta.author;
        videoChannel.hidden = false;
      } else {
        videoChannel.hidden = true;
      }
      videoLink.href = "https://www.youtube.com/watch?v=" + id;
    } else {
      videoTitle.textContent = UI_TEXT.videoTitle;
      videoChannel.hidden = true;
    }
    setPreview(id, 0);
    renderGrid(id);
    results.hidden = false;
    results.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } finally {
    btnFetch.disabled = false;
    btnFetch.textContent = UI_TEXT.getThumbs;
  }
}

thumbGrid.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-dl]");
  if (btn) {
    downloadImage(btn.dataset.dl, btn.dataset.name);
  }
});

urlInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    btnFetch.click();
  }
});

urlInput.addEventListener("paste", () => {
  setTimeout(() => {
    if (extractVideoId(urlInput.value)) btnFetch.click();
  }, 0);
});

btnFetch.addEventListener("click", () => loadVideo(urlInput.value));
btnExample.addEventListener("click", () => {
  urlInput.value = EXAMPLE;
  loadVideo(EXAMPLE);
});
