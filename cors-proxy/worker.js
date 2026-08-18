export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    let targetUrl;
    if (url.pathname.startsWith("/api/")) {
      targetUrl = "https://api.weglide.org" + url.pathname.replace(/^\/api/, "") + url.search;
    } else if (url.pathname.startsWith("/cdn/")) {
      targetUrl = "https://weglidefiles.b-cdn.net" + url.pathname.replace(/^\/cdn/, "") + url.search;
    } else {
      return new Response("Not found", { status: 404, headers: corsHeaders() });
    }

    const forwardHeaders = new Headers();
    const apiKey = request.headers.get("X-API-Key");
    if (apiKey) forwardHeaders.set("X-API-Key", apiKey);
    // Cloudflare Workers sturen standaard geen "gewone" browser User-Agent
    // mee; basale bot-mitigatie op de CDN blokkeert dat kennelijk (het
    // bestand zelf bleek gewoon publiek toegankelijk in een echte browser).
    // Referer/Origin kunnen geen kwaad, dus die blijven ook staan.
    forwardHeaders.set(
      "User-Agent",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    );
    forwardHeaders.set("Referer", "https://www.weglide.org/");
    forwardHeaders.set("Origin", "https://www.weglide.org");

    const upstreamResponse = await fetch(targetUrl, {
      method: "GET",
      headers: forwardHeaders,
    });

    const responseHeaders = new Headers(upstreamResponse.headers);
    for (const [key, value] of Object.entries(corsHeaders())) {
      responseHeaders.set(key, value);
    }

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
  },
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "X-API-Key, Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}
