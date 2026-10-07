async function search(query) {
  try {
    const response = await fetch(`https://sololatino.net/?s=${encodeURIComponent(query)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept-Language": "es-ES,es;q=0.9"
      }
    });

    if (!response.ok) return [];

    const html = await response.text();
    return [];
  } catch (error) {
    return [];
  }
}
