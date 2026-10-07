const BASE_URL = "https://sololatino.net";

/**
 * Searches for movies and series on SoloLatino.
 * @param {string} query - The search query.
 * @returns {Promise<Array>} List of search results.
 */
async function search(query) {
  try {
    const searchUrl = `${BASE_URL}/?s=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "es-ES,es;q=0.9"
      }
    });

    if (!response.ok) return [];

    const html = await response.text();
    const results = [];

    // Extract items from search HTML results
    const itemRegex = /<article[^>]*class="[^"]*item[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
    let match;

    while ((match = itemRegex.exec(html)) !== null) {
      const itemHtml = match[1];

      // Extract item URL
      const linkMatch = /href="([^"]+)"/i.exec(itemHtml);
      // Extract title
      const titleMatch = /<h3[^>]*>([\s\S]*?)<\/h3>/i.exec(itemHtml) || /alt="([^"]+)"/i.exec(itemHtml);
      // Extract poster image URL
      const imgMatch = /src="([^"]+)"/i.exec(itemHtml) || /data-src="([^"]+)"/i.exec(itemHtml);

      if (linkMatch && titleMatch) {
        const itemUrl = linkMatch[1];
        const title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
        const poster = imgMatch ? imgMatch[1] : '';

        // Determine content type (TV show vs Movie)
        const isTv = itemUrl.includes('/tvshows/') || itemUrl.includes('/series/');

        results.push({
          id: itemUrl,
          title: title,
          poster: poster,
          type: isTv ? 'tv' : 'movie'
        });
      }
    }

    return results;
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

/**
 * Resolves streaming video links/servers for the selected content.
 * @param {string} id - The URL or ID of the selected content.
 * @returns {Promise<Array>} List of video streams/embeds.
 */
async function resolve(id) {
  try {
    const targetUrl = id.startsWith("http") ? id : `${BASE_URL}/${id}`;
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": BASE_URL
      }
    });

    if (!response.ok) return [];

    const html = await response.text();
    const sources = [];

    // Extract iframe embeds
    const iframeRegex = /<iframe[^>]+src="([^"]+)"/gi;
    let match;

    while ((match = iframeRegex.exec(html)) !== null) {
      let embedUrl = match[1];

      if (embedUrl.startsWith("//")) {
        embedUrl = "https:" + embedUrl;
      }

      // Skip non-video embeds
      if (embedUrl.includes("facebook") || embedUrl.includes("twitter") || embedUrl.includes("disqus")) {
        continue;
      }

      // Tag server names
      let serverName = "Web Server";
      if (embedUrl.includes("streamwish") || embedUrl.includes("swish")) serverName = "StreamWish (Latino)";
      else if (embedUrl.includes("filemoon")) serverName = "Filemoon (Latino)";
      else if (embedUrl.includes("voe")) serverName = "VOE (Latino)";
      else if (embedUrl.includes("dood") || embedUrl.includes("ds2play")) serverName = "DoodStream (Latino)";
      else if (embedUrl.includes("vidhide") || embedUrl.includes("streamhide")) serverName = "VidHide (Latino)";
      else if (embedUrl.includes("mixdrop")) serverName = "MixDrop (Latino)";

      sources.push({
        name: serverName,
        url: embedUrl,
        quality: "HD",
        isEmbed: true
      });
    }

    return sources;
  } catch (error) {
    console.error("Resolve error:", error);
    return [];
  }
}

// Exportacion explicita para todos los entornos JS (Global, CommonJS y Window)
if (typeof globalThis !== "undefined") {
  globalThis.search = search;
  globalThis.resolve = resolve;
}
if (typeof window !== "undefined") {
  window.search = search;
  window.resolve = resolve;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { search, resolve };
}
