async function test() {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Origin": "https://player.vidzee.wtf",
    "Referer": "https://player.vidzee.wtf/embed/movie/157336",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Dest": "empty",
    "Sec-Ch-Ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br"
  };

  try {
     const apiRes = await fetch("https://player.vidzee.wtf/api/server?id=157336&sr=0", { headers });
     const text = await apiRes.text();
     console.log("API RES:", text);
  } catch(e) {
     console.log("Error:", e);
  }
}
test();
