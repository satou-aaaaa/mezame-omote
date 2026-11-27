// アプリのアイコン（icon-192.png・icon-512.png）を作る。夜明けの紺の地に、表のコインと三日月。
// 使い方: node tools/make-icons.cjs（qa/ の playwright を使う）
const path = require("path");
const { chromium } = require(path.join(__dirname, "..", "qa", "node_modules", "playwright"));
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  for (const s of [192, 512]) {
    const p = await b.newPage({ viewport: { width: s, height: s } });
    await p.setContent(`<body style="margin:0"><svg width="${s}" height="${s}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#123554"/>
      <path d="M30 14 a14 14 0 1 0 14 18 a11 11 0 1 1 -14 -18z" fill="#dbe6f3"/>
      <circle cx="56" cy="60" r="27" fill="#f6d77a" stroke="#9a6b0c" stroke-width="5"/>
      <circle cx="56" cy="60" r="18" fill="none" stroke="#9a6b0c" stroke-width="2.5" stroke-dasharray="4 3"/>
      <circle cx="80" cy="22" r="2.5" fill="#fffdf7"/><circle cx="68" cy="12" r="1.8" fill="#fffdf7"/></svg></body>`);
    await p.screenshot({ path: path.join(__dirname, "..", `icon-${s}.png`), clip: { x: 0, y: 0, width: s, height: s } });
  }
  await b.close();
})();
