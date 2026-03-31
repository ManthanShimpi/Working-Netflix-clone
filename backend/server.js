import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Advanced Headless Browser Scraping Endpoint
app.get('/api/proxy/puppeteer', async (req, res) => {
  const { id, type, s, e } = req.query;
  
  if (!id) return res.status(400).json({ error: "Missing TMDB ID" });

  let embedUrl = `https://vidking.net/embed/movie/${id}`;
  if (type === 'tv') {
    embedUrl = `https://vidking.net/embed/tv/${id}/${s}/${e}`;
  }

  console.log("Puppeteer attempting to extract stream for:", embedUrl);

  try {
    const browser = await puppeteer.launch({ 
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });
    
    const page = await browser.newPage();
    
    // We only need request interception to grab the stream URL, not to block things (Cloudflare breaks if we block too much)
    await page.setRequestInterception(true);
    let streamUrl = null;

    page.on('request', request => {
      const url = request.url();

      if (url.includes('.m3u8') && !streamUrl) {
        streamUrl = url;
        console.log("=> Core Stream Found:", streamUrl);
      }
      
      request.continue();
    });

    // Navigate to embed page (give Cloudflare time to solve)
    await page.goto(embedUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait briefly for network requests to trickle in
    await new Promise(r => setTimeout(r, 2000));

    // If stream not immediately found, try simulating a center click to bypass 'Click to Play' overlays
    if (!streamUrl) {
      console.log("Simulating click on player to start stream fetch...");
      try {
        await page.mouse.click(400, 300); // generic center viewport
        await new Promise(r => setTimeout(r, 3000));
      } catch (e) {
        // ignore click error
      }
    }

    try {
      await page.screenshot({ path: 'debug.png' });
    } catch (e) {
      console.log('Screenshot failed');
    }

    await browser.close();

    if (streamUrl) {
      res.json({ link: streamUrl });
    } else {
      console.log("Failed to locate .m3u8 for", id);
      res.status(404).json({ error: "Could not extract stream URL" });
    }

  } catch (error) {
    console.error("Puppeteer error:", error.message);
    res.status(500).json({ error: "Failed to extract via puppeteer" });
  }
});

// Advanced Transparent HLS Stream Proxy
app.get('/api/proxy/stream', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send("No URL provided");
  
  try {
    const headers = {
      'Referer': 'https://vidking.net/',
      'Origin': 'https://vidking.net',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    };

    // Setup dynamic base URL for production awareness
    const protocol = req.protocol;
    const host = req.get('host');
    const backendBaseUrl = `${protocol}://${host}`;

    const response = await fetch(targetUrl, { headers });
    
    const contentType = response.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // M3U8 Playlist URL Rewriting Engine
    if (targetUrl.includes('.m3u8') || (contentType && contentType.includes('mpegurl'))) {
      const text = await response.text();
      const playlistBaseUrl = new URL(targetUrl);
      
      const newLines = text.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed) return line;
        
        // Handle #EXT-X-KEY and similar tags possessing URI="url" references
        if (trimmed.startsWith('#') && trimmed.includes('URI=')) {
           return trimmed.replace(/URI="(.*?)"/g, (match, p1) => {
              try {
                 const absoluteUrl = new URL(p1, playlistBaseUrl).toString();
                 const proxiedUrl = `${backendBaseUrl}/api/proxy/stream?url=${encodeURIComponent(absoluteUrl)}`;
                 return `URI="${proxiedUrl}"`;
              } catch (e) { return match; }
           });
        }
        
        if (trimmed.startsWith('#')) return line;
        
        // Rewrite chunk/sub-playlist URLs
        try {
          const absoluteUrl = new URL(trimmed, playlistBaseUrl).toString();
          return `${backendBaseUrl}/api/proxy/stream?url=${encodeURIComponent(absoluteUrl)}`;
        } catch(e) {
          return line;
        }
      });
      return res.send(newLines.join('\n'));
    } 
    
    // Pure binary chunk proxying (.ts, .key, etc)
    const buffer = await response.arrayBuffer();
    return res.end(Buffer.from(buffer));
    
  } catch (error) {
    console.error("Stream proxy error:", error.message);
    res.status(500).send("Proxy stream parsing failed");
  }
});

app.listen(PORT, () => {
  console.log(`Headless Cloudflare Proxy running on http://localhost:${PORT}`);
});
