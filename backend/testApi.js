async function test() {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "*/*",
    "Origin": "https://player.vidzee.wtf",
    "Referer": "https://player.vidzee.wtf/",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Dest": "empty"
  };

  const apiRes = await fetch("https://player.vidzee.wtf/api/server?id=157336&sr=0", { headers });
  console.log("TEST 1 - Origin: player.vidzee.wtf / Referer: / ->", await apiRes.text());

  headers["Origin"] = "https://player.vidzee.wtf";
  headers["Referer"] = "https://player.vidzee.wtf/embed/movie/157336";
  const apiRes2 = await fetch("https://player.vidzee.wtf/api/server?id=157336&sr=0", { headers });
  console.log("TEST 2 - Origin: player.vidzee.wtf / Referer: /embed/... ->", await apiRes2.text());

  headers["Origin"] = "https://flickystream.ru";
  headers["Referer"] = "https://flickystream.ru/";
  const apiRes3 = await fetch("https://player.vidzee.wtf/api/server?id=157336&sr=0", { headers });
  console.log("TEST 3 - Origin: flickystream.ru / Referer: flickystream.ru ->", await apiRes3.text());
}
test();
