var BASE_URL = "https://sololatino.net";

async function search(query) {
  try {
    var searchUrl = BASE_URL + "/?s=" + encodeURIComponent(query);
    var response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "es-ES,es;q=0.9"
      }
    });

    if (!response.ok) return [];

    var html = await response.text();
    var results = [];
    var itemRegex = /<article[^>]*class="[^"]*item[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
    var match;

    while ((match = itemRegex.exec(html)) !== null) {
      var itemHtml = match[1];
      var linkMatch = /href="([^"]+)"/i.exec(itemHtml);
      var titleMatch = /<h3[^>]*>([\s\S]*?)<\/h3>/i.exec(itemHtml) || /alt="([^"]+)"/i.exec(itemHtml);
      var imgMatch = /src="([^"]+)"/i.exec(itemHtml) || /data-src="([^"]+)"/i.exec(itemHtml);

      if (linkMatch && titleMatch) {
        var itemUrl = linkMatch[1];
        var title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
        var poster = imgMatch ? imgMatch[1] : '';
        var isTv = itemUrl.includes('/tvshows/') || itemUrl.includes('/series/');

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
    return [];
  }
}

async function resolve(id) {
  try {
    var targetUrl = id.indexOf("http") === 0 ? id : BASE_URL + "/" + id;
    var response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": BASE_URL
      }
    });

    if (!response.ok) return [];

    var html = await response.text();
    var sources = [];
    var iframeRegex = /<iframe[^>]+src="([^"]+)"/gi;
    var match;

    while ((match = iframeRegex.exec(html)) !== null) {
      var embedUrl = match[1];
      if (embedUrl.indexOf("//") === 0) {
        embedUrl = "https:" + embedUrl;
      }

      if (embedUrl.indexOf("facebook") !== -1 || embedUrl.indexOf("twitter") !== -1 || embedUrl.indexOf("disqus") !== -1) {
        continue;
      }

      var serverName = "Servidor Web";
      if (embedUrl.indexOf("streamwish") !== -1 || embedUrl.indexOf("swish") !== -1) serverName = "StreamWish (Latino)";
      else if (embedUrl.indexOf("filemoon") !== -1) serverName = "Filemoon (Latino)";
      else if (embedUrl.indexOf("voe") !== -1) serverName = "VOE (Latino)";
      else if (embedUrl.indexOf("dood") !== -1 || embedUrl.indexOf("ds2play") !== -1) serverName = "DoodStream (Latino)";
      else if (embedUrl.indexOf("vidhide") !== -1 || embedUrl.indexOf("streamhide") !== -1) serverName = "VidHide (Latino)";
      else if (embedUrl.indexOf("mixdrop") !== -1) serverName = "MixDrop (Latino)";

      sources.push({
        name: serverName,
        url: embedUrl,
        quality: "HD",
        isEmbed: true
      });
    }
    return sources;
  } catch (error) {
    return [];
  }
}

// Exportación global masiva
if (typeof globalThis !== 'undefined') { globalThis.search = search; globalThis.resolve = resolve; }
if (typeof window !== 'undefined') { window.search = search; window.resolve = resolve; }
if (typeof self !== 'undefined') { self.search = search; self.resolve = resolve; }
if (typeof global !== 'undefined') { global.search = search; global.resolve = resolve; }
if (typeof module !== 'undefined' && module.exports) { module.exports = { search: search, resolve: resolve }; }

// Retorno explícito por si Kino evalúa el archivo directamente
({ search: search, resolve: resolve });
