const HSTS = "max-age=31536000; includeSubDomains";

const CANONICAL_HOST = "yt-thumbnail-downloader.site";
const OLD_HOSTS = ["youtube-thumbnail-downloader.aziizboukerma.workers.dev"];
const REDIRECT_TO_CANONICAL = [...OLD_HOSTS, `www.${CANONICAL_HOST}`];

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
