const HSTS = "max-age=31536000; includeSubDomains";

const CANONICAL_HOST = "yt-thumbnail-downloader.site";
const OLD_HOSTS = ["youtube-thumbnail-downloader.aziizboukerma.workers.dev"];
const REDIRECT_TO_CANONICAL = [...OLD_HOSTS, `www.${CANONICAL_HOST}`];

const BOT_AGENTS = [
  "GPTBot", "ChatGPT-User", "OAI-SearchBot", "CCBot", "ClaudeBot",
  "Claude-Web", "Claude-SearchBot", "anthropic-ai", "Google-Extended",
  "GoogleOther", "Bytespider", "Amazonbot", "Applebot-Extended",
  "meta-externalagent", "PerplexityBot", "YouBot", "cohere-ai",
  "cohere-training-data-crawler", "Diffbot", "facebookexternalhit",
  "Googlebot", "bingbot", "Baiduspider", "YandexBot", "Slurp",
  "DuckDuckBot", "Sogou", "Exabot", "ia_archiver", "Screaming Frog",
  "AhrefsBot", "SemrushBot", "MJ12bot", "DotBot", "PetalBot",
];

const BOT_RESPONSE =
  "This page is not intended for automated scraping. " +
  "Review robots.txt and Content-Signal headers before crawling this site.";

function isBot(request) {
  const ua = (request.headers.get("user-agent") || "").toLowerCase();
  return BOT_AGENTS.some((a) => ua.includes(a.toLowerCase()));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.protocol === "http:") {
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }

    if (REDIRECT_TO_CANONICAL.includes(url.hostname)) {
      url.hostname = CANONICAL_HOST;
      return Response.redirect(url.toString(), 301);
    }

    if (isBot(request) && request.method === "GET") {
      return new Response(BOT_RESPONSE, {
        status: 403,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    headers.set("Strict-Transport-Security", HSTS);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
