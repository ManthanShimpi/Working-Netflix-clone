import axios from 'axios';

const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const PUPPETEER_API = `${BACKEND_BASE}/api/proxy/puppeteer`;

/**
 * Main Resolver function to get direct .m3u8 stream seamlessly via Backend Headless Chrome
 */
export async function resolveStream(tmdbId, mediaType = 'movie', season = 1, episode = 1) {
  try {
    const serverUrl = `${PUPPETEER_API}?id=${tmdbId}${mediaType === 'tv' ? `&type=tv&s=${season}&e=${episode}` : `&type=movie`}`;
    
    // The backend spins up Puppeteer, handles Cloudflare, and finds the exact stream URL automatically
    const serverRes = await axios.get(serverUrl);
    
    if (!serverRes.data || !serverRes.data.link) {
      throw new Error(`Puppeteer failed to extract stream. Received: ${JSON.stringify(serverRes.data)}`);
    }

    const rawLink = serverRes.data.link;
    // Bouncing the raw link through our Backend M3U8 Relay to destroy CORS protection forever
    const proxiedLink = `${BACKEND_BASE}/api/proxy/stream?url=${encodeURIComponent(rawLink)}`;
    return proxiedLink;
  } catch (err) {
    console.warn(`Native Resolution failed for ${tmdbId} via Puppeteer:`, err.message);
    return null;
  }
}
