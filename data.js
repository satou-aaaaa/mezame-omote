// 目覚めたら表？の問題を作る（ブラウザと node の両方で使う）。
// 1問＝眠りの実験の決まり（コインの表の出やすさ p・表なら a 回・裏なら b 回起こす）。
// 「実験ごとに数えた表の割合」と「起きた回ごとに数えた表の割合」の組を4つ（やさしいは3つ）から選ぶ。答えは p と p·a/(p·a+(1−p)·b)。
// 正解したら、同じ決まりで何千回もまわしたようすが出て、2段目（目覚めの数・1回目の目覚めの割合など）を選ぶ。
// 話のもとは「眠れる美女（Sleeping Beauty）問題」：A. Elga (2000) Analysis 60(2) と D. Lewis (2001) Analysis 61(3)。どちらが正しいかは言い切らない。
// 乱数 R は呼ぶ回数が毎回同じになるように使う（sort の比較の中では引かない）。同じ tag なら、どの端末でも同じ問題・同じ乱数になる。
// PS・PAIRS・SCENES の並びや中身は、足すだけでも過去の日の問題が変わる。公開したあとは変えず、変えるときは qa/run.mjs の PINS を作り直して PR に理由を書く。
(function (root) {
  "use strict";
  const LV = ["やさしい", "ふつう", "むずかしい"];
  const N = 600; // 「600回の実験なら」の数（2・3・4・5・6・10 のどれで割っても割り切れる）
  const SIMN = 3000; // 画面でまわす回数

  // 出典（画面の「なぜ」と「このゲームについて」に出す）
  const SRC = {
    elga: ["A. Elga「Self-locating belief and the Sleeping Beauty problem」Analysis 60(2), 2000", "https://princeton.edu/~adame/papers/sleeping/sleeping.pdf"],
    lewis: ["D. Lewis「Sleeping Beauty: reply to Elga」Analysis 61(3), 2001", "https://doi.org/10.1093/analys/61.3.171"],
  };

  // 分数（約分した [分子, 分母]）
  const gcd = (x, y) => (y ? gcd(y, x % y) : Math.abs(x));
  const fr = (n, d) => { const g = gcd(n, d); return [n / g, d / g]; };
  const fs = (f) => (f[1] === 1 ? String(f[0]) : `${f[0]}/${f[1]}`);
  const fv = (f) => f[0] / f[1];

  // コインの表の出やすさ（n/d）と、起こす回数の組（表なら a 回・裏なら b 回）
  const PS = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 6], [5, 6], [1, 10], [3, 10], [7, 10], [9, 10]];
  const PAIRS = [];
  for (let a = 1; a <= 4; a++) for (let b = 1; b <= 6; b++) if (a !== b) PAIRS.push([a, b]);

  // 場面（問いの言い方）。人も場所もすべて架空
  const SCENES = [
    "眠りの実験。コインを投げて、その結果で起こされる回数が決まります。",
    "山の研究所の眠りの実験。目を覚ますたびに、前に起きたことは忘れます。",
    "眠りの実験の朝。起きたあなたには、今日が何回目の目覚めか分かりません。",
    "静かな部屋での眠りの実験。起こされるたびに、前の目覚めは覚えていません。",
  ];

  // part:ri:begin（shared-workflows の template/parts/data/ri.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));
  // part:ri:end
  // part:shuffle:begin（shared-workflows の template/parts/data/shuffle.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function shuffle(R, a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = ri(R, 0, i); [b[i], b[j]] = [b[j], b[i]]; } return b; }
  // part:shuffle:end
  // part:pickN:begin（shared-workflows の template/parts/data/pickN.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function pickN(R, a, n) { return shuffle(R, a).slice(0, n); }
  // part:pickN:end
  // part:seedOf:begin（shared-workflows の template/parts/data/seedOf.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function seedOf(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  // part:seedOf:end
  // part:rng:begin（shared-workflows の template/parts/data/rng.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // part:rng:end

  // 2段目の問い（3つの形。種類ごとに決まる）
  const STEP2 = [
    { id: "w", ask: `${N}回の実験をしたら、目覚めは全部でだいたい何回？`, unit: "回" },
    { id: "f", ask: "起こされたとき、それが「1回目の目覚め」である割合は？", unit: "" },
    { id: "h", ask: `${N}回の実験をしたら、表の目覚めはだいたい何回？`, unit: "回" },
  ];

  // 種類＝コインの出やすさ×起こす回数の組（15×20＝300）。難しさ：
  //   やさしい＝ふつうのコイン（1/2）で、片方が1回。ふつう＝ふつうのコインでどちらも2回以上か、かたよったコインで片方が1回。むずかしい＝ほか
  const lvOf = (n, d, a, b) => (n * 2 === d ? (Math.min(a, b) === 1 ? 0 : 1) : Math.min(a, b) === 1 ? 1 : 2);
  const KINDS = [];
  PS.forEach(([n, d], pi) => PAIRS.forEach(([a, b], ai) => {
    const lv = lvOf(n, d, a, b), p = fr(n, d), q = fr(n * a, n * a + (d - n) * b), hx = (N * n) / d, hw = hx * a, tw = (N - hx) * b, w = hw + tw;
    KINDS.push({
      id: `p${pi}a${a}b${b}`, pi, ai, n, d, a, b, lv, p, q, s2: STEP2[(pi + ai) % 3].id,
      name: `表${a}回・裏${b}回・表の出やすさ ${fs(p)}`,
      look: "実験ごと＝コインの結果の割合。起きた回ごと＝目覚め全部のうちの割合。",
      key: `${N}回なら、表の目覚めは${hw}回、裏の目覚めは${tw}回です。`,
      why: `${N}回の実験で表は${hx}回（実験ごと ${fs(p)}）。目覚めは表で${hw}回・裏で${tw}回、合わせて${w}回。表の目覚めは${hw}/${w}＝${fs(q)}（起きた回ごと）。`,
      hx, hw, tw, w,
    });
  }));
  const BY = Object.fromEntries(KINDS.map((k) => [k.id, k]));
  const kindsOf = (lv) => KINDS.filter((k) => k.lv === lv).map((k) => k.id);
  // 2組の答え（実験ごと・起きた回ごと）を1つの文字にする（選び肢の印）
  const pairKey = (x, y) => `${fs(x)}|${fs(y)}`;

  // 1段目の選び肢のもと：よくある取りちがえ（入れかえ・どちらも同じ・コインのかたよりを見ない・裏の割合）
  function wrongPairs(k) {
    const { p, q, a, b } = k, ab = fr(a, a + b), nq = fr(q[1] - q[0], q[1]), half = [1, 2];
    return [[q, p], [p, p], [q, q], [p, ab], [p, nq], [half, q], [ab, q], [q, nq]];
  }
  // 2段目の答えと選び肢のもと（答えは分数の計算。数は ${N} 回の実験あたり）
  function step2Of(k) {
    const { n, d, a, b, hx, hw, tw, w } = k;
    if (k.s2 === "w") return { ans: String(w), cand: [N, (N * (a + b)) / 2, hw, tw, N * Math.max(a, b), N * (a + b)].map(String) };
    if (k.s2 === "h") return { ans: String(hw), cand: [hx, tw, w, N * a, (N * a) / 2, N - hx].map(String) };
    const f = fr(d, n * a + (d - n) * b); // 1回目の目覚め＝実験の数（N）÷目覚めの数（w）
    return { ans: fs(f), cand: [fr(1, 2), fr(1, Math.max(a, b)), fr(1, a + b), k.p, k.q, fr(2, a + b + 1)].map(fs) };
  }

  // 1問を作る。tag は「種類|種」（例 "p0a1b2|2026-11-27:d2"）。同じ tag ならいつも同じ問題・同じ並び
  function make(tag) {
    const [kind] = String(tag).split("|"), k = Object.prototype.hasOwnProperty.call(BY, kind) ? BY[kind] : null;
    if (!k) return null;
    const R = rng(seedOf(tag)), si = ri(R, 0, SCENES.length - 1), nOpt = k.lv === 0 ? 3 : 4;
    const ans = pairKey(k.p, k.q), far = ([x, y]) => Math.max(Math.abs(fv(x) - fv(k.p)), Math.abs(fv(y) - fv(k.q))) >= 0.02; // まわした棒で見分けられる組だけ
    const wr = [...new Set(wrongPairs(k).filter(far).map(([x, y]) => pairKey(x, y)))].filter((x) => x !== ans);
    const opts = shuffle(R, [ans, ...pickN(R, wr.slice(0, 5), nOpt - 1)]);
    const s2 = step2Of(k), c2 = [...new Set(s2.cand)].filter((x) => x !== s2.ans && x !== "0");
    const opts2 = shuffle(R, [s2.ans, ...pickN(R, c2, 3)]);
    const st = STEP2.find((x) => x.id === k.s2);
    return { tag, kind, lv: k.lv, n: k.n, d: k.d, a: k.a, b: k.b, pf: fs(k.p), qf: fs(k.q), name: k.name, ans, opts,
      s2: k.s2, ask2: st.ask, unit2: st.unit, ans2: s2.ans, opts2, look: k.look, key: k.key, why: k.why, hx: k.hx, hw: k.hw, tw: k.tw, w: k.w,
      src: [SRC.elga, SRC.lewis], q: SCENES[si], v: String(si), seed: seedOf(tag + ":sim") };
  }
  const keyOf = (P) => `${P.kind}:${P.v}`;
  // 選び肢の文字（"1/2|1/3"）を [実験ごと, 起きた回ごと] に分ける
  const split = (o) => String(o).split("|");

  // 同じ決まりで n 回まわす（種は tag から。どの端末でも同じ結果）。
  // 返すもの：hx 表の実験・w 目覚め・hw 表の目覚め・first 1回目の目覚め（＝実験の数）・rows はじめの8回（表か・目覚めの数）・trace 100回ごとの途中の数
  function sim(P, n = SIMN) {
    const R = rng(P.seed), p = P.n / P.d, rows = [], trace = [];
    let hx = 0, w = 0, hw = 0;
    for (let i = 0; i < n; i++) {
      const h = R() < p, k = h ? P.a : P.b;
      if (h) { hx++; hw += k; }
      w += k;
      if (i < 8) rows.push({ h, k });
      if ((i + 1) % 100 === 0) trace.push([i + 1, hx, w, hw]);
    }
    return { n, hx, w, hw, first: n, rows, trace };
  }

  function dailyTags(date) {
    const R = rng(seedOf("day:" + date)), lvs = [0, 0, 1, 1, 2], used = new Set(), out = [];
    lvs.forEach((lv, i) => { const ids = kindsOf(lv).filter((x) => !used.has(x)), id = ids[ri(R, 0, ids.length - 1)]; used.add(id); out.push(`${id}|${date}:d${i}`); });
    return out;
  }
  function hardTags(date) {
    const dh = dailyTags(date)[4].split("|")[0], R = rng(seedOf("hard:" + date)), ids = pickN(R, kindsOf(2).filter((x) => x !== dh), 3);
    return ids.map((id, i) => `${id}|${date}:h${i}`);
  }

  const MZO = { KINDS, BY, PS, PAIRS, STEP2, LV, SRC, SCENES, N, SIMN, kindsOf, seedOf, rng, make, keyOf, split, sim, dailyTags, hardTags, pickN, fr, fs, fv, pairKey };
  if (typeof module !== "undefined" && module.exports) module.exports = MZO; else root.MZO = MZO;
})(typeof self !== "undefined" ? self : this);
