// SNS で貼られたときの絵（og.png 1200×630）を作る。問いの場面は、いちばん基本の形（ふつうのコイン・表なら1回・裏なら2回）。
// 選び肢の正解（実験ごと 1/2・起きた回ごと 1/3）は data.js の p0a1b2 の答えと同じ（qa/run.mjs が見る）。
// 使い方: node tools/make-og.cjs（qa/ の playwright を使う）
const path = require("path");
const { chromium } = require(path.join(__dirname, "..", "qa", "node_modules", "playwright"));
const SCENE = { coin: "ふつうのコイン", heads: 1, tails: 2 };
const OPTS = [["1/2", "1/3", true], ["1/3", "1/2", false]];
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  const wk = (t, h) => `<div style="width:58px;height:58px;border-radius:12px;display:grid;place-items:center;font-size:30px;font-weight:900;${h ? "background:#fff3cc;border:4px solid #9a6b0c;color:#4a3200" : "background:repeating-linear-gradient(45deg,#eef3fa 0 6px,#dbe6f3 6px 12px);border:4px dashed #1f4f7a;color:#123554"}">${t}</div>`;
  const coin = (t, h) => `<div style="width:70px;height:70px;border-radius:50%;display:grid;place-items:center;font-size:32px;font-weight:900;${h ? "background:#f6d77a;border:4px solid #9a6b0c;color:#4a3200" : "background:repeating-linear-gradient(45deg,#dde8f4 0 6px,#c4d6ea 6px 12px);border:4px solid #1f4f7a;color:#123554"}">${t}</div>`;
  const row = (h, n) => `<div style="display:flex;gap:14px;align-items:center">${coin(h ? "表" : "裏", h)}<div style="font-size:26px;width:44px">→</div>${Array.from({ length: n }, (_, i) => wk((h ? "☀" : "☾") + (i + 1), h)).join("")}</div>`;
  const opt = ([x, y, ok]) => `<div style="display:flex;gap:10px;align-items:center;border:${ok ? "5px solid #21704a;background:#eef7f0" : "3px solid #1d2a3f55;background:#fff"};border-radius:12px;padding:8px 12px"><div style="flex:1;font-size:20px;color:#4c5568;text-align:center">実験ごと<br><b style="font-size:36px;color:#1d2a3f">${x}</b></div><div style="flex:1;font-size:20px;color:#4c5568;text-align:center">起きた回ごと<br><b style="font-size:36px;color:#1d2a3f">${y}</b></div>${ok ? '<div style="font-size:24px;font-weight:900;color:#164f33;border:3px solid #164f33;border-radius:8px;padding:2px 8px;transform:rotate(-8deg)">✓ 正解</div>' : ""}</div>`;
  await p.setContent(`<body style="margin:0;font-family:'Noto Sans CJK JP','IPAPGothic',sans-serif">
  <div style="width:1200px;height:630px;box-sizing:border-box;padding:44px 60px;background:#f3efe4;color:#1d2a3f;display:flex;gap:40px;align-items:center">
    <div style="flex:0 0 440px">
      <div style="font-size:30px;color:#83261a;letter-spacing:.06em">眠れる美女問題を数える</div>
      <div style="font-size:86px;font-weight:900;margin-top:8px;line-height:1.15;color:#123554">目覚めたら<br><span style="color:#b23a24">表？</span></div>
      <div style="font-size:32px;margin-top:14px;line-height:1.5">数え方で、答えは<br>1/2 にも 1/3 にも。</div>
    </div>
    <div style="flex:1;background:#fffdf7;border:4px solid #1d2a3f;border-radius:8px;padding:22px 22px;display:flex;flex-direction:column;gap:14px">
      <div style="font-size:28px;font-weight:700">🪙 ${SCENE.coin}</div>
      ${row(true, SCENE.heads)}
      ${row(false, SCENE.tails)}
      ${OPTS.map(opt).join("")}
    </div>
  </div></body>`);
  await p.screenshot({ path: path.join(__dirname, "..", "og.png") });
  await b.close();
})();
