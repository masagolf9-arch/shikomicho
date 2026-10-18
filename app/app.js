// 仕込帳 お店の画面(LINEの中でも、パソコンのブラウザでも開ける)
// データは Google の記録の表から読む。見られるのは「メンバー」シートで許可された人だけ。
const LIFF_ID = '2012003912-ltVppjVx';
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxShAkcy1uEzK5ZUGWgW8lzdFBcd8baDNKjHwGKCBx7ocrEUNDHmzrSFdrZDikqL2VO/exec';
const CAMERA_URL = 'https://liff.line.me/' + LIFF_ID;
// 公式ホームページ(Cloudflare)から開いたときは、そちらの蔵とやりとりする。LINEの外ならログインの鍵で入る
const CF = location.hostname !== 'masagolf9-arch.github.io';
const IN_LINE = /\bLine\//i.test(navigator.userAgent);
// 画面の案内文: ホームページでは「撮る」「もなか」を案内する(LINEは、お知らせが届く場所)
const CAMTXT = CF ? '「撮る」' : 'LINEの「📷 写真を撮る」', VIA = CF ? 'もなかに' : 'LINEで', SHOT = CF ? '「撮る」で' : 'LINEで';

const $ = id => document.getElementById(id);
const store = { get(k, d) { try { const v = localStorage.getItem('shikomi:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
                set(k, v) { try { localStorage.setItem('shikomi:' + k, JSON.stringify(v)); } catch (e) {} } };
// 見え方の設定(この端末だけ)
const applyLook = () => { const th = store.get('theme', 'auto'); if (th === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', th); document.body.style.zoom = store.get('size', 'normal') === 'big' ? '1.15' : ''; document.documentElement.style.setProperty('--cs', ({ s: 60, m: 72, l: 88 })[store.get('csize', 'm')] + 'px'); };
applyLook();
let U = '個';
const yen = n => Math.round(n).toLocaleString('ja-JP') + '円';
const amt = (v, u) => u === '枚' ? v.toLocaleString('ja-JP') + '枚' : v >= 1000 ? (Math.round(v / 100) / 10).toLocaleString('ja-JP') + 'kg' : Math.round(v) + 'g';
const yen1 = n => (Math.round(n * 10) / 10).toLocaleString('ja-JP') + '円';
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let D = null, idToken = null, profileName = '';

// ---------- 記録の表とのやり取り ----------
async function api(body) {
  if (CF) {
    const h = { 'Content-Type': 'application/json', 'X-Shikomi': '1' }; if (idToken) h['X-Line-Token'] = idToken;
    const r = await fetch('/api/app', { method: 'POST', credentials: 'same-origin', headers: h, body: JSON.stringify(Object.assign({ name: profileName }, body)) });
    return r.json();
  }
  const res = await fetch(GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(Object.assign({ idToken, name: profileName }, body)) });
  return res.json();
}
function state(html) { const s = $('state'); s.innerHTML = html; s.hidden = !html; }
async function load() {
  try {
    const out = await api({ kind: 'app_data' });
    if (!out.ok) {
      if (out.error === 'wait' || out.error === 'login') { store.set('data', null); if (D) { D = null; document.querySelectorAll('section').forEach(s => s.hidden = true); } }
      if (out.error === 'wait') return state('<b>店主の許可待ちです。</b><br>店主のLINEに「見たい」とお知らせを送りました。<br>店主が「許可」を押したら、もう一度開いてください。<br><button class="btn ghost" onclick="load()">もう一度読む</button>');
      if (out.error === 'login' && CF && !IN_LINE) { location.href = '/login?next=' + encodeURIComponent(location.pathname); return; }
      if (out.error === 'login') { liff.logout(); return state('ログインし直してください。<br><button class="btn" onclick="location.reload()">ログイン</button>'); }
      if (out.error === 'noshop') return state('<b>まだお店とつながっていません。</b><br>お店の方から届いた招待のリンクを開いてください。<br><form method="post" action="/auth/logout" style="margin-top:10px"><button class="btn ghost">別の方法でログインし直す</button></form>');
      return state(esc(out.error));
    }
    const first = !D; D = out.data; store.set('data', D); state(''); renderAll(); if (first) show(store.get('tab', 'today'), true); else show(cur, true, true);
    if (first) setTimeout(() => chat(hello(), 'greet'), 250);
    if (CF && !window.__acct) { window.__acct = 1; renderAccount(); }
    if (CF) showShot();
  } catch (e) {
    if (D) { chat('電波が弱いので、前に読んだ内容を出しています'); return; }
    state('読み込めませんでした。電波のよいところで<br><button class="btn ghost" onclick="load()">もう一度読む</button>');
  }
}
async function setValue(product, field, value) {
  chat('記録しています…');
  const out = await api({ kind: 'app_set', product, field, value });
  if (!out.ok) { chat(out.error || 'うまく記録できませんでした'); return; }
  D = out.data; renderAll(); chat('覚えました。原価に反映しました。', 'heart');
}
function openCamera() {
  if (CF) {
    // ケイタイ: 青い枠のカメラへ(撮ったら、この画面に戻ってもなかが答える)/ パソコン: 写真を選ぶ
    if (matchMedia('(pointer:coarse)').matches) { location.href = (IN_LINE ? '/l/' : '/camera/') + '?back=' + encodeURIComponent(location.pathname); return; }
    webPhoto(); return;
  }
  if (window.liff && liff.isInClient && liff.isInClient()) liff.openWindow({ url: CAMERA_URL, external: false });
  else chat('写真はスマホのLINEで「📷 写真を撮る」から送ってください。', 'point');
}

// ---------- きょう ----------
function notices() {
  const list = [];
  for (const u of D.ups) list.push({ type: 'up', html: `<p><b>${esc(u.item)}が値上がり</b></p><p class="k">${esc(u.supplier)} ${esc(u.spec)} ${u.old.toLocaleString()}円 → ${u.now.toLocaleString()}円(+${u.pct}%)</p>` });
  const needPw = D.products.filter(p => !p.pw);
  if (needPw.length) list.push({ type: 'q', html: `<p><b>1${U}は何g?(${needPw.length}品)</b></p><p class="k">数えなくても、重さから個数と1個の原価を出します。分かるものだけで大丈夫</p>` +
    needPw.map((p, i) => `<div class="ask"><span style="min-width:6em">${esc(p.name)}</span><input id="pw-${i}" inputmode="decimal" placeholder="例 40" aria-label="${esc(p.name)}の1${U}の重さ"><span class="k">g</span><button class="btn" data-pw="${i}" type="button">決める</button></div>`).join('') });
  const unknown = new Set(); D.products.forEach(p => p.unknown.forEach(n => unknown.add(n)));
  for (const n of unknown) list.push({ type: 'q', html: `<p><b>「${esc(n)}」って何の材料ですか?</b></p><p class="k">まだ辞書にない材料です。もなかに教えてください</p>` });
  const check = new Set(); D.products.forEach(p => p.label.check.forEach(n => { if (!unknown.has(n)) check.add(n); }));
  for (const n of check) list.push({ type: 'q', cam: true, html: `<p><b>「${esc(n)}」の袋の裏を写真で</b></p><p class="k">名称欄が分かれば、裏表示が確定します</p>` });
  if (!D.products.length) list.push({ type: 'q', cam: true, html: '<p><b>まずはレシピの写真を1枚</b></p><p class="k">' + CAMTXT + 'で手書きのレシピを撮ると、ここに原価と裏表示の案が出ます</p>' });
  return list;
}
function renderToday() {
  const list = notices();
  $('notices').innerHTML = list.length ? list.map(n => `<div class="card notice"><span class="mark ${n.type}">${n.type === 'up' ? '↑' : '?'}</span><div style="flex:1;min-width:0">${n.html}${n.cam ? '<div class="ask"><button class="btn ghost" type="button" data-cam>写真を撮る</button></div>' : ''}</div></div>`).join('')
    : '<div class="card notice"><span class="mark done">✓</span><div><p>確認待ちはありません。</p></div></div>';
  const needPw = D.products.filter(p => !p.pw);
  $('notices').querySelectorAll('[data-pw]').forEach(b => b.onclick = () => {
    const i = b.dataset.pw, inp = $('pw-' + i), v = parseFloat(inp.value);
    if (!(v > 0)) { inp.focus(); return; }
    setValue(needPw[i].name, 'pw', v);
  });
  $('notices').querySelectorAll('[data-cam]').forEach(b => b.onclick = openCamera);
  const q = list.length; const bd = $('badge'); bd.textContent = q; bd.hidden = !q;
  const up0 = unpaid(), bb = $('badge-book'); bb.textContent = up0.length; bb.hidden = !up0.length;
  const hm0 = hygMissing().length, bh = $('badge-hyg'); bh.textContent = hm0; bh.hidden = !hm0;
  renderHero(q); renderMenu(q);
  $('made').innerHTML = D.made.length ? D.made.map(m => `<div class="row"><span>${esc(m.text)}</span><span class="k">${new Date(m.t).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}</span></div>`).join('')
    : '<p class="k" style="margin:0">まだありません。夕方に' + VIA + '「栗万十 90、チーズ万十 100」のように送ると、ここに出ます</p>';
}

// ---------- 帳簿(支払い・仕分け・仕訳) ----------
const unpaid = () => (D.pays || []).filter(p => p.status === '未払い').sort((a, b) => (a.due || '9') < (b.due || '9') ? -1 : 1);
// ---------- きょう: 横にめくるカード ----------
const md = d => esc(d.slice(5).replace('-', '/'));
function renderHero(q) {
  const cards = [], up = unpaid(), low = ((D.stock || {}).items || []).filter(x => x.low);
  if (up.length) { const sum = up.reduce((a, p) => a + p.total, 0), n = up[0];
    cards.push({ cls: 'main', t: '払っていないもの', v: `${Math.round(sum).toLocaleString('ja-JP')}<small>円</small>`, k: `${up.length}件${n.due ? ' · 次の期限 ' + md(n.due) + ' ' + esc(n.supplier) : ''}`, go: () => show('book') }); }
  else cards.push({ cls: 'main', t: '払っていないもの', v: '0<small>円</small>', k: 'ぜんぶ払い済みです', go: () => show('book') });
  if (low.length) cards.push({ cls: 'warn', t: 'そろそろ買うもの', v: `${low.length}<small>品</small>`, k: low.slice(0, 3).map(x => esc(x.key)).join('・') + (low.length > 3 ? ' ほか' : ''), go: () => { matF = 'low'; show('mat'); } });
  const hm = hygMissing();
  if (hm.length) cards.push({ cls: 'warn', t: '今日の衛生記録', v: `あと${hm.length}<small>つ</small>`, k: hm.map(esc).join('・'), go: () => show('hyg') });
  if (q) cards.push({ cls: '', t: '確認待ち', v: `${q}<small>件</small>`, k: '答えると原価と裏表示が確定します', go: () => $('notices').scrollIntoView({ behavior: 'smooth', block: 'start' }) });
  const ms = Object.keys(D.months || {}).sort(), lm = ms[ms.length - 1];
  const sm = Object.keys(D.sales || {}).sort().pop();
  if (sm) { const o = D.sales[sm]; cards.push({ cls: '', t: `${+sm.slice(5)}月の売上`, v: `${Math.round(o.total).toLocaleString('ja-JP')}<small>円</small>`, k: `${o.nDays}日分 · 1日平均 ${yen(o.total / Math.max(1, o.nDays))}`, go: () => show('sales') }); }
  const wm = Object.keys(D.ws || {}).sort().pop();
  if (wm) { const w = D.ws[wm], tot = Object.values(w).reduce((a, x) => a + x.total, 0); cards.push({ cls: '', t: `${+wm.slice(5)}月の卸(税抜)`, v: `${Math.round(tot).toLocaleString('ja-JP')}<small>円</small>`, k: Object.keys(w).map(esc).join('・'), go: () => show('ws') }); }
  if (lm) { const by = D.months[lm].by, top = Object.keys(by).sort((a, b) => by[b] - by[a]).slice(0, 2);
    cards.push({ cls: '', t: `${+lm.slice(5) || lm}月の仕入れ`, v: `${Math.round(D.months[lm].total).toLocaleString('ja-JP')}<small>円</small>`, k: top.map(esc).join('・'), go: () => show('book') }); }
  const h = $('hero');
  h.innerHTML = cards.map((c, i) => `<div class="hc ${c.cls}" role="button" tabindex="0" data-i="${i}"><div class="t">${c.t}</div><div class="v">${c.v}</div><div class="k">${c.k}</div><div class="go">くわしく ›</div></div>`).join('');
  h.querySelectorAll('.hc').forEach(el => el.onclick = () => cards[el.dataset.i].go());
  $('hero-dots').innerHTML = cards.length > 1 ? cards.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('') : '';
  h.onscroll = () => { const w = h.firstChild ? h.firstChild.offsetWidth + 10 : 1, i = Math.round(h.scrollLeft / w); $('hero-dots').querySelectorAll('i').forEach((d, j) => d.className = j === i ? 'on' : ''); };
}
// ---------- きょう: アイコンの並び ----------
const IC = {
  cam: '<path d="M3.5 8.5h3.3l1.7-2.5h7l1.7 2.5h3.3v10.5h-17z"/><circle cx="12" cy="13.4" r="3.4"/>',
  cost: '<circle cx="12" cy="12" r="8.5"/><path d="M9 7.5l3 4.2 3-4.2M12 11.7V17M9.3 13.3h5.4M9.3 15.5h5.4"/>',
  label: '<path d="M6 3.5h12v17H6z"/><path d="M9.5 9h5M9.5 12.5h5M9.5 16h3"/>',
  mat: '<path d="M7 9c-1.6 2.3-2.2 5.2-1.6 8.3.3 1.5 1.4 2.4 2.9 2.4h7.4c1.5 0 2.6-.9 2.9-2.4.6-3.1 0-6-1.6-8.3z"/><path d="M8.5 9 7.5 5M15.5 9l1-4M7.5 5c1.4.7 2.9 1 4.5 1s3.1-.3 4.5-1"/>',
  stock: '<path d="M3 9.5 12 4.5l9 5"/><path d="M5 8.5V20h14V8.5"/><path d="M10 20v-5h4v5"/>',
  hyg: '<path d="M10 4.5a2 2 0 0 1 4 0v9.2a4 4 0 1 1-4 0z"/><path d="M12 10v7"/><path d="M17 6h2.5M17 9.5h2.5"/>',
  book: '<rect x="4.5" y="3.5" width="15" height="17" rx="2"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',
  ws: '<path d="M3.5 9h11v10h-11z"/><path d="M14.5 12h3.5l2.5 3v4h-6z"/><circle cx="7" cy="19.5" r="1.6"/><circle cx="17.5" cy="19.5" r="1.6"/>',
  post: '<path d="M4 10v4h3l6 4V6L7 10z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11"/>',
  sales: '<path d="M4 19h16"/><path d="M6 15.5l4-5 3.5 3 4.5-6"/><path d="M14.5 7.5H18V11"/>',
  home: '<path d="M3 11.2 12 4l9 7.2"/><path d="M5.5 10v10h13V10"/><path d="M10 20v-6h4v6"/>',
  set: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>'
};
function renderMenu(q) {
  const low = ((D.stock || {}).items || []).filter(x => x.low).length, up = unpaid().length;
  const items = [
    ['cam', '撮る', openCamera, 0, 'p'], ['cost', '原価', () => show('cost')], ['label', '裏表示', () => show('label')], ['mat', '材料', () => { matF = 'all'; show('mat'); }],
    ['stock', '在庫', () => { matF = 'low'; show('mat'); }, low], ['hyg', '衛生', () => show('hyg'), hygMissing().length, hygMissing().length], ['book', '帳簿', () => show('book'), up], ['ws', '卸', () => show('ws')], ['post', '発信', () => show('post')], ['sales', '売上', () => show('sales')]];
  const m = $('menu');
  m.innerHTML = items.map(([k, l, , b, w], i) => `<button type="button" data-i="${i}"><span class="ic${w === 'p' ? ' p' : w ? ' w' : ''}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]}</svg></span>${l}${b ? `<span class="badge">${b}</span>` : ''}</button>`).join('');
  m.querySelectorAll('button').forEach(b => b.onclick = () => items[b.dataset.i][2]());
  // パソコンの広い画面では、同じメニューを左に縦に並べる
  const TAB = { cost: 'cost', label: 'label', mat: 'mat', hyg: 'hyg', book: 'book', ws: 'ws', post: 'post', sales: 'sales' };
  const all = [['home', 'ホーム', () => show('today'), 0, 0, 'today']].concat(items.map(x => [x[0], x[1], x[2], x[3] || 0, x[4] || 0, TAB[x[0]] || '']), [['set', '設定', () => show('set'), 0, 0, 'set']]);
  const side = $('side');
  side.innerHTML = `<div class="sname">${esc(D.shop)}<small>${esc($('date').textContent)}</small></div>` + all.map(([k, l, , b, w, t], i) => `<button type="button" data-i="${i}" data-tab="${t}" class="${w === 'p' ? 'p' : w ? 'w' : ''}"${t && t === cur ? ' aria-current="page"' : ''}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]}</svg>${l}${b ? `<span class="badge">${b}</span>` : ''}</button>`).join('');
  side.querySelectorAll('button').forEach(b => b.onclick = () => all[b.dataset.i][2]());
}
function renderBook() { renderPays(); renderSort(); renderJournal(); }
const PILL = { '未払い': 'warn', '済': '', '現金済': '', '請求待ち': 'gray' };
function renderSort() {
  const all = D.pays || [], ms = [...new Set(all.map(p => p.month))].sort().reverse();
  const chips = $('sort-chips'), box = $('sort-box');
  if (!ms.length) { chips.innerHTML = ''; box.innerHTML = '<p class="k" style="margin:0">まだ請求書がありません。撮ると、ここに月ごとに並びます</p>'; return; }
  const sel = chips.dataset.m && ms.includes(chips.dataset.m) ? chips.dataset.m : ms[0];
  chips.innerHTML = ms.map(m => `<button class="chip" type="button" data-m="${esc(m)}" aria-pressed="${m === sel}">${esc(m.replace('-', '年'))}月分</button>`).join('');
  chips.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { chips.dataset.m = b.dataset.m; renderSort(); });
  const rows = all.filter(p => p.month === sel).sort((a, b) => a.supplier.localeCompare(b.supplier, 'ja'));
  const tot = rows.reduce((a, p) => a + p.total, 0), done = rows.filter(p => p.status !== '未払い' && p.status !== '請求待ち').reduce((a, p) => a + p.total, 0);
  box.innerHTML = `<table>${rows.map(p => `<tr><td><b>${esc(p.supplier)}</b><br><span class="k">${esc(p.doc)}${p.paidOn ? ' · ' + esc(p.paidOn.slice(5).replace('-', '/')) + '払い' : p.due ? ' · 期限 ' + esc(p.due.slice(5).replace('-', '/')) : ''}</span></td><td class="n">${yen(p.total)}<br><span class="pill ${PILL[p.status] ?? 'gray'}">${esc(p.status)}</span></td></tr>`).join('')}
    <tr><td><b>合計 ${rows.length}件</b></td><td class="n"><b>${yen(tot)}</b><br><span class="k">払い済み ${yen(done)}</span></td></tr></table>
    <div class="ask" style="margin-top:8px"><button class="btn ghost" type="button" id="sort-copy">この月をコピー</button></div>
    <p class="k" style="margin:6px 0 0">コピーすると、税理士さんへのメールや会計ソフトのメモに貼りつけられます</p>`;
  $('sort-copy').onclick = async () => {
    const sums = (D.journal || {})[sel] || {};
    const txt = `${sel.replace('-', '年')}月分 請求書\n` + rows.map(p => `${p.supplier}\t${p.doc}\t${p.total}円\t${p.status}${p.paidOn ? '(' + p.paidOn + ')' : ''}`).join('\n') + `\n合計\t\t${tot}円\n\n科目ごと(案)\n` + Object.keys(sums).map(k => `${k}\t${sums[k]}円`).join('\n');
    try { await navigator.clipboard.writeText(txt); chat('コピーしました。貼りつけて使ってください。', 'heart'); } catch (e) { chat('コピーできませんでした。長押しで選んでください。'); }
  };
}
// ---------- 振込に使う銀行(押すと銀行のページへ。送金はしない) ----------
const BANKS = [
  ['宮崎', [['miyasin', '宮崎第一信用金庫(法人)', 'https://www.miyasin.co.jp/business/netbanking/'], ['miyasin_p', '宮崎第一信用金庫(個人)', 'https://www.miyasin.co.jp/netbanking/'],
    ['miyagin', '宮崎銀行(法人)', 'https://www.miyagin.co.jp/hojin/settlement/banking/'], ['taiyo', '宮崎太陽銀行', 'https://www.taiyobank.co.jp/']]],
  ['全国の銀行', [['yucho', 'ゆうちょ銀行', 'https://www.jp-bank.japanpost.jp/'], ['mufg', '三菱UFJ銀行', 'https://www.bk.mufg.jp/'], ['smbc', '三井住友銀行', 'https://www.smbc.co.jp/'],
    ['mizuho', 'みずほ銀行', 'https://www.mizuhobank.co.jp/'], ['resona', 'りそな銀行', 'https://www.resonabank.co.jp/']]],
  ['ネット銀行', [['sbi', '住信SBIネット銀行', 'https://www.netbk.co.jp/'], ['rakuten', '楽天銀行', 'https://www.rakuten-bank.co.jp/'], ['paypay', 'PayPay銀行', 'https://www.paypay-bank.co.jp/'],
    ['gmo', 'GMOあおぞらネット銀行', 'https://gmo-aozora.com/'], ['sony', 'ソニー銀行', 'https://moneykit.net/'], ['jibun', 'auじぶん銀行', 'https://www.jibunbank.co.jp/']]]
];
function payBank() {
  const si = D.shopInfo || {};
  if (si.payBank === 'other' && si.payBankUrl) return { id: 'other', name: si.payBankName || '登録した銀行', url: si.payBankUrl };
  for (const [, list] of BANKS) for (const [id, name, url] of list) if (id === si.payBank) return { id, name, url };
  return null;
}
function openBank(url) {
  if (window.liff && liff.isInClient && liff.isInClient()) liff.openWindow({ url, external: true });
  else window.open(url, '_blank', 'noopener');
}
async function goPay(p) {
  const b = payBank();
  if (!b) { chat('先に「設定」で、振込に使う銀行を選んでください', 'think'); show('set'); setTimeout(() => $('bank-box') && $('bank-box').scrollIntoView({ block: 'start', behavior: 'smooth' }), 120); return; }
  const txt = `${p.supplier} ${p.total}円`;
  let copied = false; try { await navigator.clipboard.writeText(txt); copied = true; } catch (e) {}
  chat(`${copied ? `「${p.supplier} ${p.total.toLocaleString('ja-JP')}円」をコピーしました。` : ''}${b.name}を開きます。振り込んだら「払った」を押してください。`, 'heart');
  openBank(b.url);
}
function renderBanks() {
  const box = $('bank-box'); if (!box) return;
  const cur = payBank(), si = D.shopInfo || {};
  box.innerHTML = `<p class="k" style="margin:0 0 8px">帳簿の「振込へ」を押すと、ここで選んだ銀行のページが開きます(業者名と金額はコピーされます)。お金を動かすのは銀行のページで、お店の人がします。名前を押すと選べて、↗ でそのまま開きます。</p>` +
    BANKS.map(([g, list]) => `<p class="k" style="margin:10px 0 4px"><b>${g}</b></p><div class="banks">${list.map(([id, name, url]) => `<div class="bank${cur && cur.id === id ? ' on' : ''}"><button type="button" data-bank="${id}" aria-pressed="${!!(cur && cur.id === id)}">${cur && cur.id === id ? '✓ ' : ''}${esc(name)}</button><a href="${esc(url)}" target="_blank" rel="noopener" data-open="${esc(url)}" aria-label="${esc(name)}を開く">↗</a></div>`).join('')}</div>`).join('') +
    `<p class="k" style="margin:10px 0 4px"><b>その他の銀行</b></p><div class="fld"><span class="k">銀行名</span><input id="bk-name" value="${esc(si.payBank === 'other' ? si.payBankName : '')}" placeholder="例: 〇〇信用金庫"><span class="k">ページのURL</span><input id="bk-url" inputmode="url" value="${esc(si.payBank === 'other' ? si.payBankUrl : '')}" placeholder="https://"></div>
    <div class="ask"><button class="btn ghost" type="button" id="bk-save">この銀行にする</button></div>`;
  box.querySelectorAll('[data-bank]').forEach(b => b.onclick = () => setValueX({ field: 'paybank', value: { id: b.dataset.bank } }));
  box.querySelectorAll('[data-open]').forEach(a => a.onclick = e => { e.preventDefault(); openBank(a.dataset.open); });
  $('bk-save').onclick = () => { const url = $('bk-url').value.trim(); if (!/^https:\/\//.test(url)) { chat('URLは https:// から入れてください'); return; } setValueX({ field: 'paybank', value: { id: 'other', name: $('bk-name').value.trim(), url } }); };
}
function renderPays() {
  const box = $('pays');
  const up = unpaid();
  if (!(D.pays || []).length) { box.innerHTML = '<div class="card"><p class="k" style="margin:0">請求書を撮ると、業者ごと・月ごとに仕分けて、ここに並びます</p></div>'; return; }
  const sum = up.reduce((a, p) => a + p.total, 0);
  box.innerHTML = `<div class="card"><div class="row"><span>${up.length ? `払っていないもの ${up.length}件` : '払っていないものはありません'}</span>${up.length ? `<span class="big" style="font-size:20px">${yen(sum)}</span>` : ''}</div>` +
    up.map(p => `<div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--line)"><div>${esc(p.supplier)} <span class="k">${+p.month.slice(5) || esc(p.month)}月分${p.due ? ' · 期限 ' + esc(p.due.slice(5).replace('-', '/')) : ''}</span></div><div class="row" style="align-items:center;margin-top:6px"><b style="white-space:nowrap;font-size:17px">${yen(p.total)}</b><span style="display:flex;gap:6px;align-items:center;flex:0 0 auto"><button class="btn" style="white-space:nowrap" type="button" data-go="${p.row}">振込へ</button><button class="btn ghost" style="white-space:nowrap" type="button" data-paid="${p.row}">払った</button></span></div>`).join('') +
    `<p class="k" style="margin:8px 0 0">${payBank() ? `振込は ${esc(payBank().name)} を開きます(<a href="#" id="bank-change" style="color:var(--accent)">変える</a>)。` : '「振込へ」を使うには、<a href="#" id="bank-change" style="color:var(--accent)">設定で銀行を選んでください</a>。'}${VIA}「業者名 払った」でも済にできます</p></div>`;
  box.querySelectorAll('[data-paid]').forEach(b => b.onclick = () => setValue('', 'paid', +b.dataset.paid));
  box.querySelectorAll('[data-go]').forEach(b => b.onclick = () => goPay(up.find(p => p.row === +b.dataset.go)));
  if ($('bank-change')) $('bank-change').onclick = e => { e.preventDefault(); show('set'); setTimeout(() => $('bank-box').scrollIntoView({ block: 'start', behavior: 'smooth' }), 300); };
}

// ---------- 原価 ----------
const open = new Set();
function renderCost() {
  const box = $('costs');
  if (!D.products.length) { box.innerHTML = '<div class="card"><p class="k" style="margin:0">まだレシピがありません。' + CAMTXT + 'でレシピを撮ってください。</p></div>'; return; }
  box.innerHTML = D.products.map((p, i) => {
    const head = p.per_piece != null ? `<div class="big">${yen1(p.per_piece)}<span class="k" style="font-weight:400"> / 1${U}</span></div>` : '<div class="big" style="font-size:18px;color:var(--ink-2)">1個の重さ待ち</div>';
    const meta = [`<span class="pill gray">1仕込み ${yen(p.batch_cost)}</span>`];
    if (p.pieces) meta.push(`<span class="pill gray">約${p.pieces}個</span>`);
    if (p.price && p.per_piece != null) { const r = p.per_piece / p.price * 100; meta.push(`<span class="pill ${r > 40 ? 'warn' : ''}">原価率 ${Math.round(r)}%</span>`); }
    if (p.unknown.length) meta.push(`<span class="pill warn">不明な材料 ${p.unknown.length}</span>`);
    const det = `<table>${p.rows.map(r => `<tr><td>${esc(r.name)} <span class="k">${r.grams.toLocaleString()}g</span>${r.src === 'est' ? ' <span class="pill warn">仮</span>' : r.src === 'unknown' ? ' <span class="pill warn">不明</span>' : ''}</td><td class="n">${r.cost == null ? '-' : yen1(r.cost)}</td></tr>`).join('')}<tr><td><b>1仕込み</b></td><td class="n"><b>${yen(p.batch_cost)}</b></td></tr></table>
      <div class="set"><span class="k">1${U}の重さ</span><input id="spw-${i}" inputmode="decimal" value="${p.pw || ''}" placeholder="例 40"><span class="k">g</span><button class="btn ghost" type="button" data-set="pw" data-i="${i}">決める</button></div>
      <div class="set"><span class="k">売価</span><input id="sprice-${i}" inputmode="decimal" value="${p.price || ''}" placeholder="例 250"><span class="k">円</span><button class="btn ghost" type="button" data-set="price" data-i="${i}">決める</button></div>`;
    const isOpen = open.has(p.name);
    return `<div class="card prod" data-name="${esc(p.name)}"><div class="row" role="button" tabindex="0" aria-expanded="${isOpen}" data-toggle><span style="font-weight:700">${esc(p.name)} <span class="k">${esc(p.part)}</span></span><span class="k">${p.sure}% 確定</span></div>${head}<div class="meta">${meta.join('')}</div><div class="bar" aria-label="請求書で確かめた割合 ${p.sure}%"><i style="width:${p.sure}%"></i></div><div class="detail" ${isOpen ? '' : 'hidden'}>${det}</div></div>`;
  }).join('');
  box.querySelectorAll('.prod').forEach(c => {
    const t = c.querySelector('[data-toggle]'), name = c.dataset.name;
    const tog = () => { const d = c.querySelector('.detail'); d.hidden = !d.hidden; t.setAttribute('aria-expanded', String(!d.hidden)); d.hidden ? open.delete(name) : open.add(name); };
    t.onclick = tog; c.querySelector('.big').onclick = tog;
    t.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tog(); } };
  });
  box.querySelectorAll('[data-set]').forEach(b => b.onclick = () => {
    const i = b.dataset.i, f = b.dataset.set, inp = $((f === 'pw' ? 'spw-' : 'sprice-') + i), v = parseFloat(inp.value);
    if (!(v > 0)) { inp.focus(); return; }
    setValue(D.products[i].name, f, v);
  });
}

// ---------- 裏表示 ----------
let labelName = null;
const LBL_STORAGE = '直射日光、高温多湿を避けて保存してください';
const lblDefName = p => /羊羹|ようかん/.test(p.name) ? '和生菓子(羊羹)' : /餅|もち/.test(p.name) ? '和生菓子' : '和菓子';
// 商品ごとのラベル設定(未設定のところは案で埋める)
function lblOf(p) {
  const s = p.lbl || {};
  return { name: s.name || lblDefName(p), dtype: s.dtype || '消費期限', days: s.days === 0 || s.days ? Number(s.days) : '', storage: s.storage || LBL_STORAGE,
    content: s.content || `1${U}${p.nutr && p.nutr.weight ? `(${p.nutr.weight}g)` : ''}`, jan: s.jan || '', nut: !!s.nut && !!(p.nutr && p.nutr.per), saved: !!p.lbl,
    packs: Array.isArray(s.packs) ? s.packs : [] };
}
// 包装の種類の入力行(包装・内容量・JAN)
const packRow = (k, i) => `<div class="pkrow" style="display:grid;grid-template-columns:1.2fr 1fr 1.6fr auto;gap:6px;margin-bottom:6px">
  <input class="pk-name" placeholder="例 4個入り袋" value="${esc(k.name || '')}" aria-label="包装${i + 1}の名前">
  <input class="pk-ct" placeholder="例 4個" value="${esc(k.content || '')}" aria-label="包装${i + 1}の内容量">
  <input class="pk-jan" inputmode="numeric" placeholder="JAN(13桁)" value="${esc(k.jan || '')}" aria-label="包装${i + 1}のJANコード">
  <button class="btn ghost pk-del" type="button" aria-label="この包装を消す" style="padding:0 12px">×</button></div>`;
function janCheck(d) {
  d = String(d || '').replace(/[\s-]/g, '');
  if (!d) return { ok: true, empty: true };
  if (!/^\d{13}$/.test(d)) return { ok: false, msg: `JANコードは13桁の数字です(いま${d.replace(/\D/g, '').length}桁)` };
  let t = 0; for (let i = 0; i < 12; i++) t += +d[i] * (i % 2 ? 3 : 1);
  return (10 - t % 10) % 10 === +d[12] ? { ok: true, code: d } : { ok: false, msg: '最後の数字が合いません。番号を見直してください' };
}
function renderLabel() {
  const chips = $('label-chips'), box = $('label-box');
  if (!D.products.length) { chips.innerHTML = ''; box.innerHTML = '<div class="card"><p class="k" style="margin:0">レシピを撮ると、ここに裏表示の案が出ます。</p></div>'; return; }
  if (!D.products.find(p => p.name === labelName)) labelName = D.products[0].name;
  chips.innerHTML = D.products.map(p => `<button class="chip" type="button" aria-pressed="${p.name === labelName}">${esc(p.name)}</button>`).join('');
  chips.querySelectorAll('.chip').forEach((b, i) => b.onclick = () => { labelName = D.products[i].name; renderLabel(); });
  const p = D.products.find(x => x.name === labelName), lb = p.label, L = lblOf(p), si = D.shopInfo || {};
  box.innerHTML = `<div class="label">
    <div class="r"><div class="h">名称</div><div class="v">${esc(L.name)}</div></div>
    <div class="r"><div class="h">原材料名</div><div class="v"><span id="ing">${esc(lb.text) || '(まだ出せません)'}</span>${lb.check.length ? `、<mark>${lb.check.map(esc).join('、')}(要確認)</mark>` : ''}${esc(lb.contains)}</div></div>
    <div class="r"><div class="h">内容量</div><div class="v">${esc(L.content)}</div></div>
    <div class="r"><div class="h">${esc(L.dtype)}</div><div class="v">枠外下部に記載${L.days === '' ? '' : `<span class="k">(作った日から${L.days}日)</span>`}</div></div>
    <div class="r"><div class="h">保存方法</div><div class="v">${esc(L.storage)}</div></div>
    <div class="r"><div class="h">製造者</div><div class="v">${esc(si.name || D.shop)} ${si.addr ? esc(si.addr) : '<span class="k">(住所は設定から)</span>'}</div></div></div>
    <div class="ask" style="margin-top:10px"><button class="btn" id="copy" type="button">原材料名をコピー</button><span class="copied" id="copied"></span></div>
    ${lblPrintCard(p, L)}
    ${nutrBox(p)}`;
  if ($('bk-go')) $('bk-go').onclick = () => { const v = parseFloat($('bk-v').value); if (!(v > 0)) { $('bk-v').focus(); return; } setValue(p.name, 'baked', v); };
  if ($('nu-copy')) $('nu-copy').onclick = async () => { try { await navigator.clipboard.writeText($('nu-txt').innerText); chat('コピーしました', 'heart'); } catch (e) { chat('長押しで選んでコピーしてください'); } };
  $('copy').onclick = async () => {
    const t = $('ing').textContent + (lb.contains || '');
    try { await navigator.clipboard.writeText(t); $('copied').textContent = 'コピーしました'; }
    catch (e) { const r = document.createRange(); r.selectNodeContents($('ing')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); $('copied').textContent = '選択しました。長押しでコピー'; }
  };
  bindLblPrint(p, L);
}

// ---------- ラベル印刷(A4のラベル用紙。コピー機・家庭用プリンタで) ----------
const SHEETS = {
  p10: ['10面', 86.4, 50.8, 2, 5, 21.5, 18.6, 0, 0], p12: ['12面', 86.4, 42.3, 2, 6, 21.6, 18.6, 0, 0], p14: ['14面', 99.1, 38.1, 2, 7, 15.15, 4.65, 2.5, 0],
  p18: ['18面', 70, 42.3, 3, 6, 21.6, 0, 0, 0], p18b: ['18面 余白付', 63.5, 46.6, 3, 6, 8.7, 7.25, 2.5, 0], p21: ['21面', 63.5, 38.1, 3, 7, 15.15, 7.25, 2.5, 0],
  p24: ['24面', 70, 33.9, 3, 8, 12.9, 0, 0, 0], p44: ['44面', 48.3, 25.4, 4, 11, 8.8, 8.4, 0, 0]
}; // 名前, 幅, 高さ, 列, 段, 上余白, 左余白, 横すき間, 縦すき間(ミリ)
const lsGet = () => { try { return Object.assign({ sheet: 'p12', pt: 6, dx: 0, dy: 0 }, JSON.parse(localStorage.getItem('shikomi:lblsheet') || '{}')); } catch (e) { return { sheet: 'p12', pt: 6, dx: 0, dy: 0 }; } };
const lsSet = o => { try { localStorage.setItem('shikomi:lblsheet', JSON.stringify(o)); } catch (e) {} };
function lblPrintCard(p, L) {
  const S = lsGet(), sh = SHEETS[S.sheet] || SHEETS.p12, per = sh[3] * sh[4];
  const today = new Date(), iso = new Date(today - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  return `<div class="card lpc" style="margin-top:14px"><p style="margin:0 0 4px"><b>ラベルを印刷</b></p>
    <p class="k" style="margin:0 0 8px">A4のラベル用紙に、上の裏表示をそのまま刷ります。</p>
    <details${L.saved ? '' : ' open'}><summary class="k">この商品のラベル設定${L.saved ? '' : '(はじめに1回)'}</summary>
      <div class="fld" style="margin-top:8px">
        <span class="k">名称</span><input id="lb-name" value="${esc(L.name)}">
        <span class="k">期限</span><span style="display:flex;gap:6px;align-items:center"><select id="lb-dtype"><option${L.dtype === '消費期限' ? ' selected' : ''}>消費期限</option><option${L.dtype === '賞味期限' ? ' selected' : ''}>賞味期限</option></select>作った日から<input id="lb-days" inputmode="numeric" value="${L.days}" style="width:4em">日</span>
        <span class="k">保存方法</span><input id="lb-st" value="${esc(L.storage)}">
        <span class="k">包装</span><div><div id="lb-packs">${(L.packs.length ? L.packs : [{ name: '', content: L.content, jan: L.jan }]).map(packRow).join('')}</div>
          <button class="btn ghost" type="button" id="lb-addpack">包装を足す</button><p class="k" style="margin:4px 0 0">袋・箱など包装ごとに、内容量とJANコード(卸の商品だけ)を入れます</p></div>
        ${p.nutr && p.nutr.per ? `<span class="k">栄養成分</span><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="lb-nut"${L.nut ? ' checked' : ''} style="width:auto">ラベルに載せる</label>` : ''}
      </div><div class="ask"><button class="btn ghost" type="button" id="lb-save">設定を保存</button><span class="k" id="lb-msg"></span></div></details>
    <div class="fld" style="margin-top:8px">
      ${L.packs.length > 1 ? `<span class="k">包装</span><select id="lb-pack">${L.packs.map((k, i) => `<option value="${i}">${esc(k.name || k.content)}</option>`).join('')}</select>` : ''}
      <span class="k">用紙</span><select id="lb-sheet">${Object.entries(SHEETS).map(([k, v]) => `<option value="${k}"${k === S.sheet ? ' selected' : ''}>${v[0]} ${v[1]}×${v[2]}ミリ</option>`).join('')}</select>
      <span class="k">作った日</span><input id="lb-day" type="date" value="${iso}">
      <span class="k">枚数</span><span style="display:flex;gap:6px;align-items:center"><input id="lb-n" inputmode="numeric" value="${per}" style="width:5em">枚</span>
      <span class="k">使用済み</span><span style="display:flex;gap:6px;align-items:center"><input id="lb-skip" inputmode="numeric" value="0" style="width:5em">枚を飛ばす</span>
      <span class="k">文字</span><select id="lb-pt">${[5.5, 6, 7, 8].map(v => `<option${v == S.pt ? ' selected' : ''}>${v}</option>`).join('')}</select>
    </div>
    <details><summary class="k">印刷がずれるとき</summary><div class="fld" style="margin-top:8px"><span class="k">右へ(ミリ)</span><input id="lb-dx" inputmode="decimal" value="${S.dx}"><span class="k">下へ(ミリ)</span><input id="lb-dy" inputmode="decimal" value="${S.dy}"></div></details>
    <div class="ask"><button class="btn" type="button" id="lb-print">印刷する</button><span class="k">パソコンかスマホのブラウザで。倍率は「100%」に</span></div></div>`;
}
function bindLblPrint(p, L) {
  const val = id => $(id) ? $(id).value.trim() : '';
  const box = $('lb-packs');
  const bindDel = () => box.querySelectorAll('.pk-del').forEach(b => b.onclick = () => { if (box.children.length > 1) b.closest('.pkrow').remove(); else b.closest('.pkrow').querySelectorAll('input').forEach(x => x.value = ''); });
  bindDel();
  $('lb-addpack').onclick = () => { if (box.children.length >= 8) return; box.insertAdjacentHTML('beforeend', packRow({}, box.children.length)); bindDel(); };
  $('lb-save').onclick = () => {
    const packs = [];
    for (const r of box.querySelectorAll('.pkrow')) {
      const k = { name: r.querySelector('.pk-name').value.trim(), content: r.querySelector('.pk-ct').value.trim(), jan: r.querySelector('.pk-jan').value.trim() };
      if (!k.name && !k.content && !k.jan) continue;
      const j = janCheck(k.jan); if (!j.ok) { $('lb-msg').textContent = `「${k.name || k.content}」: ${j.msg}`; return; }
      k.jan = j.code || ''; packs.push(k);
    }
    const d = val('lb-days'); if (d !== '' && !(/^\d{1,3}$/.test(d))) { $('lb-msg').textContent = '日数は数字で'; return; }
    const first = packs[0] || {};
    setValueX({ field: 'lbl', product: p.name, value: { name: val('lb-name'), dtype: val('lb-dtype'), days: d, storage: val('lb-st'), content: first.content || '', jan: first.jan || '', packs, nut: $('lb-nut') ? $('lb-nut').checked : false } });
  };
  const keep = () => { const S = lsGet(); S.sheet = val('lb-sheet'); S.pt = +val('lb-pt') || 6; S.dx = +val('lb-dx') || 0; S.dy = +val('lb-dy') || 0; lsSet(S); return S; };
  $('lb-sheet').onchange = () => { keep(); const sh = SHEETS[val('lb-sheet')]; $('lb-n').value = sh[3] * sh[4]; };
  $('lb-print').onclick = () => {
    if (p.label.check.length && !confirmOnce('lbchk', `「${p.label.check.join('、')}」が要確認のままです。このまま刷るならもう一度押してください`)) return;
    const S = keep(), n = Math.min(Math.max(parseInt(val('lb-n')) || 0, 1), 500), skip = Math.max(parseInt(val('lb-skip')) || 0, 0);
    const pk = L.packs[+val('lb-pack') || 0];
    openLabelSheet(p, pk ? Object.assign({}, L, { content: pk.content || L.content, jan: pk.jan, pack: pk.name }) : L, S, n, skip, val('lb-day'));
  };
}
let confirmKey = '';
function confirmOnce(k, msg) { if (confirmKey === k) { confirmKey = ''; return true; } confirmKey = k; chat(esc(msg), 'think'); setTimeout(() => { if (confirmKey === k) confirmKey = ''; }, 8000); return false; }

// JANコード(EAN-13)を線で描く
function janSvg(code, wmm) {
  const Lc = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
  const Rc = Lc.map(s => s.replace(/./g, c => c === '0' ? '1' : '0')), Gc = Rc.map(s => s.split('').reverse().join(''));
  const PAR = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLG', 'LGLGLG', 'LGLGGL', 'LGGLGL'][+code[0]];
  let b = '101'; for (let i = 1; i <= 6; i++) b += (PAR[i - 1] === 'L' ? Lc : Gc)[+code[i]]; b += '01010'; for (let i = 7; i <= 12; i++) b += Rc[+code[i]]; b += '101';
  const q = 11, guard = i => i < 3 || (i >= 45 && i < 50) || i >= 92; let r = '';
  for (let i = 0; i < b.length; i++) if (b[i] === '1') r += `<rect x="${q + i}" y="0" width="1.02" height="${guard(i) ? 74.24 : 69.24}"/>`;
  let t = `<text x="5.5" y="78">${code[0]}</text>`;
  for (let n = 0; n < 6; n++) t += `<text x="${q + 3 + n * 7 + 3.5}" y="78">${code[n + 1]}</text><text x="${q + 50 + n * 7 + 3.5}" y="78">${code[n + 7]}</text>`;
  return `<svg class="jan" viewBox="0 0 113 79" style="width:${wmm}mm;height:${wmm * 79 / 113}mm" fill="#000" font-size="8.6" text-anchor="middle" font-family="Helvetica,Arial,sans-serif">${r}${t}</svg>`;
}
function openLabelSheet(p, L, S, n, skip, day) {
  const sh = SHEETS[S.sheet] || SHEETS.p12, [, w, h, cols, rows, top, left, gx, gy] = sh, per = cols * rows, si = D.shopInfo || {}, lb = p.label;
  let date = '';
  if (L.days !== '' && /^\d{4}-\d\d-\d\d$/.test(day)) { const d = new Date(day + 'T00:00:00'); d.setDate(d.getDate() + Number(L.days)); date = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`; }
  const j = janCheck(L.jan), nu = L.nut ? p.nutr.per : null;
  const salt = nu ? (nu[4] > 0 && nu[4] < 0.1 ? (Math.round(nu[4] * 100) / 100).toFixed(2) : r1(nu[4])) : '';
  const rowsH = [['名称', L.name], ['原材料名', lb.text + (lb.check.length ? '、' + lb.check.join('、') : '') + (lb.contains || '')], ['内容量', L.content], [L.dtype, '枠外下部に記載'], ['保存方法', L.storage], ['製造者', [si.name || D.shop, si.addr].filter(Boolean).join(' ')]];
  if (nu) rowsH.push([`栄養成分表示<br>(1${esc(U)}当たり)`, `熱量${Math.round(nu[0])}kcal、たんぱく質${r1(nu[1])}g、脂質${r1(nu[2])}g、炭水化物${r1(nu[3])}g、食塩相当量${salt}g(推定値)`]);
  const bcw = Math.min(37.29 * 0.8, w * 0.4);
  const cell = `<div class="lbody"><table>${rowsH.map(([a, b], i) => `<tr><th>${i === 6 ? a : esc(a)}</th><td>${esc(b)}</td></tr>`).join('')}</table>${j.ok && j.code ? janSvg(j.code, bcw) : ''}</div>
    <div class="lfoot">${date ? `${esc(L.dtype)} ${date}` : ''}</div>`;
  const slots = []; for (let i = 0; i < skip % per; i++) slots.push(false); for (let i = 0; i < n; i++) slots.push(true);
  let pages = '';
  for (let pg = 0; pg < slots.length; pg += per) {
    pages += '<div class="lsheet">' + slots.slice(pg, pg + per).map((on, i) => on ? `<div class="lcell" style="left:${left + (i % cols) * (w + gx) + S.dx}mm;top:${top + Math.floor(i / cols) * (h + gy) + S.dy}mm;width:${w}mm;height:${h}mm;font-size:${S.pt}pt">${cell}</div>` : '').join('') + '</div>';
  }
  const v = $('inv');
  v.innerHTML = `<div class="bar3" style="margin-top:0"><button class="btn" type="button" id="inv-print">印刷する</button><button class="btn ghost" type="button" id="inv-close">閉じる</button></div>
    <p class="k lnote">${esc(p.name)}${L.pack ? ' ' + esc(L.pack) : ''} ${n}枚 · ${esc(sh[0])}(${Math.ceil(slots.length / per)}ページ)。印刷の画面で「倍率100%」「余白なし」にしてください。<span id="lb-over"></span></p>
    <div class="lwrap" id="lwrap">${pages}</div>`;
  v.hidden = false; v.classList.add('lprint');
  let st = document.getElementById('lb-page'); if (!st) { st = document.createElement('style'); st.id = 'lb-page'; document.head.appendChild(st); }
  st.textContent = '@page{size:A4 portrait;margin:0}';
  const fit = () => { const wr = $('lwrap'); if (!wr) return; const k = Math.min(1, (wr.clientWidth || 360) / (210 * 96 / 25.4)); wr.style.setProperty('--k', k); };
  fit(); window.addEventListener('resize', fit);
  const c0 = v.querySelector('.lcell'); if (c0 && c0.scrollHeight > c0.clientHeight + 1) $('lb-over').innerHTML = '<br><mark>文字がラベルからはみ出しています。文字を小さくするか、大きいラベル用紙にしてください。</mark>';
  const close = () => { v.hidden = true; v.classList.remove('lprint'); st.textContent = ''; window.removeEventListener('resize', fit); };
  $('inv-print').onclick = () => window.print(); $('inv-close').onclick = close;
}

// 栄養成分表示(日本食品標準成分表の計算による推定値)
const r1 = x => x < 0.05 ? '0' : (Math.round(x * 10) / 10).toFixed(1);
function nutrBox(p) {
  const n = p.nutr;
  if (!n) return '';
  if (!n.per) return `<div class="card" style="margin-top:14px"><p style="margin:0"><b>栄養成分表示</b></p><p class="k" style="margin:4px 0 0">1${U}の重さを入れると、栄養成分(熱量・たんぱく質・脂質・炭水化物・食塩相当量)の案が出ます。「原価」の画面か、${VIA}「${esc(p.name)}は1個30g」</p></div>`;
  const v = n.per, salt = v[4] > 0 && v[4] < 0.1 ? (Math.round(v[4] * 100) / 100).toFixed(2) : r1(v[4]);
  return `<div style="margin-top:14px"><div class="label" id="nu-txt">
      <div class="r"><div class="h" style="grid-column:1/-1;border-right:0;font-weight:700">栄養成分表示 1${U}${n.weight ? `(${n.weight}g)` : ''}当たり</div></div>
      <div class="r"><div class="h">熱量</div><div class="v">${Math.round(v[0])}kcal</div></div>
      <div class="r"><div class="h">たんぱく質</div><div class="v">${r1(v[1])}g</div></div>
      <div class="r"><div class="h">脂質</div><div class="v">${r1(v[2])}g</div></div>
      <div class="r"><div class="h">炭水化物</div><div class="v">${r1(v[3])}g</div></div>
      <div class="r"><div class="h">食塩相当量</div><div class="v">${salt}g</div></div>
      <div class="r"><div class="v" style="grid-column:1/-1;font-size:12px">この表示値は、目安です。(日本食品標準成分表（八訂）増補2023年の計算による推定値)</div></div></div>
    <div class="ask"><button class="btn ghost" type="button" id="nu-copy">栄養成分をコピー</button></div>
    ${n.baked ? '' : `<div class="card" style="margin-top:8px"><p class="k" style="margin:0 0 6px">( )の重さは焼く前の生地の重さです。焼き上がり1${U}の重さを入れると、表示用の重さになります(栄養の値は変わりません)</p><div class="ask" style="margin-top:0"><input id="bk-v" inputmode="decimal" placeholder="例 26"><span class="k">g</span><button class="btn ghost" type="button" id="bk-go">決める</button></div></div>`}
    ${n.missing.length ? `<p class="k" style="margin:6px 0 0"><mark>まだ入っていない材料: ${n.missing.map(esc).join('、')}</mark> この分は少なめに出ています。業務用の材料は、袋の栄養成分表示を${SHOT}撮って送るとその値になります</p>` : ''}
    <p class="k" style="margin:6px 0 0">計算に使ったもの: ${n.srcs.map(s => s === '袋の表示' ? '材料の袋の表示' : '日本食品標準成分表').join('・')}。表の「栄養の対応」シートで材料ごとの値を確かめ・直せます</p></div>`;
}

// ---------- 材料 ----------
let matF = 'all';
function renderMat() {
  const f = $('mat-filter');
  f.innerHTML = [['all', 'すべて'], ['low', '在庫'], ['est', '仮だけ'], ['up', '値上がり']].map(([k, l]) => `<button class="chip" type="button" data-f="${k}" aria-pressed="${k === matF}">${l}</button>`).join('');
  f.querySelectorAll('.chip').forEach(b => b.onclick = () => { matF = b.dataset.f; renderMat(); });
  const upNames = new Set(D.ups.map(u => u.item));
  let rows = D.materials.filter(m => !m.packaging);
  if (matF === 'est') rows = rows.filter(m => !m.ok);
  if (matF === 'up') rows = rows.filter(m => upNames.has(m.name));
  const stk = {}; ((D.stock || {}).items || []).forEach(x => stk[x.key] = x);
  if (matF === 'low') rows = rows.filter(m => stk[m.name] && stk[m.name].known);
  $('mats').innerHTML = rows.map(m => `<tr><td><b>${esc(m.name)}</b>${upNames.has(m.name) ? ' <span class="up">↑</span>' : ''}<br><span class="k">${esc(m.display)}${m.allergens.length ? ' · ' + m.allergens.map(esc).join('・') : ''}</span>${stk[m.name] && stk[m.name].known ? `<br><span class="pill ${stk[m.name].low ? 'warn' : 'gray'}">残り ${amt(stk[m.name].left, stk[m.name].unit)}${stk[m.name].days != null ? ' · 約' + stk[m.name].days + '日' : ''}</span>` : ''}</td><td class="n">${m.ppg ? Math.round(m.ppg * 1000).toLocaleString() + '円/kg' : '-'}<br>${m.ok ? '<span class="pill">請求書</span>' : '<span class="pill warn">仮</span>'}</td></tr>`).join('') || '<tr><td class="k">ありません</td></tr>';
  const all = D.materials.filter(m => !m.packaging), est = all.filter(m => !m.ok).length;
  const ms = Object.keys(D.months).sort(), lastM = ms[ms.length - 1];
  setTimeout(renderCount, 0);
  $('mat-sum').textContent = `材料 ${all.length}種類のうち、確かめた ${all.length - est}、仮 ${est}。` + (lastM ? `${lastM.replace('-', '年')}月の仕入れ ${yen(D.months[lastM].total)}。` : '');
}
function renderCount() {
  let box = $('countbox');
  if (!box) { box = document.createElement('div'); box.id = 'countbox'; $('mat-sum').after(box); }
  const names = D.materials.filter(m => !m.packaging).map(m => m.name);
  box.innerHTML = `<div class="card" style="margin-top:12px"><p style="margin:0 0 6px"><b>棚卸(数えた量を入れる)</b> <span class="k">棚卸は${esc((D.stock || {}).cycle || '年1回')}</span></p>
    <div class="ask"><select id="cnt-m" style="font:inherit;font-size:15px;padding:6px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink);max-width:11em">${names.map(n => `<option>${esc(n)}</option>`).join('')}</select>
    <input id="cnt-v" inputmode="decimal" placeholder="例 2" style="width:70px"><select id="cnt-u" style="font:inherit;font-size:15px;padding:6px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink)"><option>kg</option><option>g</option><option>袋</option><option>缶</option></select>
    <button class="btn" type="button" id="cnt-go">記録</button></div>
    <p class="k" style="margin:6px 0 0">差がありそうなものだけで大丈夫。${VIA}「バイオレット 残り2袋」でも入れられます</p></div>`;
  $('cnt-go').onclick = () => { const v = parseFloat($('cnt-v').value); if (!(v >= 0)) { $('cnt-v').focus(); return; } setValueX({ field: 'count', product: $('cnt-m').value, value: v, unit: $('cnt-u').value }); };
}
async function setValueX(extra) {
  chat('記録しています…');
  const out = await api(Object.assign({ kind: 'app_set' }, extra));
  if (!out.ok) { chat(out.error || 'うまく記録できませんでした'); return; }
  D = out.data; renderAll(); if (out.msg) { chat(out.msg); return; } chat(extra.field === 'hyg' ? '記録しました。' : extra.field === 'deliv' ? '納品を記録しました。' : extra.field === 'shop' ? 'お店の情報を保存しました。' : extra.field === 'lbl' ? 'ラベルの設定を保存しました。' : extra.field === 'paybank' ? `振込は「${esc((payBank() || {}).name || '')}」を開くようにしました。` : ['biz', 'closed', 'wsprice', 'regalias'].includes(extra.field) ? '変えました。' : extra.field === 'sales' ? '売上を記録しました。' : extra.field === 'cycle' ? `棚卸は「${extra.value}」にしました。その前にLINEでお知らせします。` : '覚えました。在庫を計算しなおしました。', 'heart');
}
function renderJournal() {
  const box = $('journal');
  const ms = Object.keys(D.journal || {}).sort().reverse();
  if (!ms.length) { box.innerHTML = ''; return; }
  const sel = box.dataset.m && ms.includes(box.dataset.m) ? box.dataset.m : ms[0];
  const sums = D.journal[sel], keys = Object.keys(sums).sort((a, b) => sums[b] - sums[a]), tot = keys.reduce((a, k) => a + sums[k], 0);
  box.innerHTML = `<h1 style="font-size:18px;margin-top:22px">科目ごとの合計(仕訳の案)</h1><div class="chips">${ms.map(m => `<button class="chip" type="button" data-m="${esc(m)}" aria-pressed="${m === sel}">${esc(m.replace('-', '年'))}月</button>`).join('')}</div>
    <div class="card"><table>${keys.map(k => `<tr><td>${k === '要確認' ? '<mark>要確認</mark>' : esc(k)}</td><td class="n">${yen(sums[k])}</td></tr>`).join('')}<tr><td><b>合計</b></td><td class="n"><b>${yen(tot)}</b></td></tr></table>
    <p class="k" style="margin:6px 0 0">科目は案です。表の「仕入れ」で直すか、「科目」シートに決まりを足すと次から自動で分けます</p></div>`;
  box.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { box.dataset.m = b.dataset.m; renderJournal(); });
}
function renderAll() {
  U = (D.words || {}).unit || '個';
  renderToday(); renderCost(); renderLabel(); renderMat(); renderBook(); renderHyg(); renderSales(); renderWs(); renderPost(); renderSet();
  $('shop').textContent = D.shop;
  $('foot').textContent = `${new Date(D.at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 時点。開き直すと新しくなります。キャラの絵はAtelier SAISPEのLINE絵文字。`;
}

// ---------- タブ ----------
const tabs = ['today', 'hyg', 'sales', 'cost', 'label', 'mat', 'book', 'ws', 'post', 'set'];
let cur = 'today';
function show(t, quiet, keep) {
  if (!D) return;
  const dir = tabs.indexOf(t) - tabs.indexOf(cur); cur = t;
  if (t === 'mat') renderMat();
  tabs.forEach(x => { const el = $('t-' + x); el.hidden = x !== t; el.classList.remove('inR', 'inL'); });
  if (dir) { const el = $('t-' + t); void el.offsetWidth; el.classList.add(dir > 0 ? 'inR' : 'inL'); }
  document.querySelectorAll('nav button[data-t]').forEach(b => b.dataset.t === t ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
  document.querySelectorAll('#side button[data-tab]').forEach(b => b.dataset.tab === t ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
  store.set('tab', t); if (!keep) window.scrollTo(0, 0);
  if (!quiet) chat({ today: null, cost: '原価です。カードを押すと中身と入力欄が出ます。', label: '裏表示の案です。色のついたところだけ確かめてください。', mat: '材料の値段です。「仮」は請求書が来たら置き換えます。', set: '設定です。キャラや文字の大きさを変えられます。', hyg: hygMissing().length ? `今日まだの記録が${hygMissing().length}つあります。` : '今日の衛生記録はそろっています。', ws: '卸の納品と請求書です。', sales: '売上ともうけです。精算レシートを撮ると増えていきます。', post: 'ポップやインスタの文、いっしょに考えます。', book: unpaid().length ? `払っていないものが${unpaid().length}件あります。払ったら「払った」を押してください。` : '帳簿です。請求書は月ごとに仕分けてあります。' }[t], t === 'cost' ? 'clap' : t === 'label' ? 'point' : null);
}
document.querySelectorAll('nav button[data-t]').forEach(b => b.onclick = () => show(b.dataset.t));
// 左右スワイプで隣の画面へ(横に動く部品の上では反応しない)
(() => {
  let x0 = null, y0 = 0, t0 = 0;
  document.addEventListener('touchstart', e => {
    if (!D || !sheet.hidden || e.touches.length > 1 || e.target.closest('.hero,.scroll,.chips,.filter,.qchips,input,select,textarea,.engawa')) { x0 = null; return; }
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now();
  }, { passive: true });
  document.addEventListener('touchend', e => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.6 || Date.now() - t0 > 700) return;
    const i = tabs.indexOf(cur) + (dx < 0 ? 1 : -1);
    if (i >= 0 && i < tabs.length) show(tabs[i], true);
  }, { passive: true });
})();
$('go-cam').onclick = openCamera;
$('nav-cam').onclick = openCamera;
// ---------- 設定 ----------
function renderSet() {
  const seg = (key, opts, cur) => `<div class="seg" data-key="${key}">${opts.map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${v === cur}">${l}</button>`).join('')}</div>`;
  const cyc = (D.stock || {}).cycle || '年1回';
  $('set-box').innerHTML = `
    <div class="set-row"><span>キャラ</span>${seg('pack', [['shirokuma', 'もなか'], ['tanuki', 'ぽん']], PACK)}</div>
    <div class="set-row"><span>キャラの大きさ</span>${seg('csize', [['s', '小'], ['m', '中'], ['l', '大']], store.get('csize', 'm'))}</div>
    <div class="set-row"><span>文字の大きさ</span>${seg('size', [['normal', 'ふつう'], ['big', '大きめ']], store.get('size', 'normal'))}</div>
    <div class="set-row"><span>画面の色</span>${seg('theme', [['auto', '自動'], ['light', '明るい'], ['dark', '暗い']], store.get('theme', 'auto'))}</div>
    <div class="set-row"><span>棚卸<br><span class="k">お店みんな共通</span></span>${seg('cycle', [['毎月', '毎月'], ['年1回', '年1回']], cyc)}</div>
    <div class="set-row"><span>業種<br><span class="k">お店みんな共通</span></span>${seg('biz', ((D.words || {}).list || []).map(b => [b, b]), (D.words || {}).biz)}</div>
    <div class="set-row"><span>定休日<br><span class="k">衛生の念押しを休む</span></span><div class="seg" id="closed">${['月', '火', '水', '木', '金', '土', '日'].map(w => `<button type="button" data-w="${w}" aria-pressed="${((D.shopInfo || {}).closed || '').includes(w)}">${w}</button>`).join('')}</div></div>
    <div class="set-row" style="display:block"><span>お店の情報<br><span class="k">卸の請求書に入ります</span></span>
      <div class="fld" style="margin-top:8px">${[['name', '店名'], ['addr', '住所'], ['tel', '電話'], ['reg', '登録番号(T〜)'], ['bank', '振込先']].map(([k, l]) => `<span class="k">${l}</span><input data-shop="${k}" value="${esc((D.shopInfo || {})[k] || '')}">`).join('')}</div>
      <div class="ask"><button class="btn ghost" type="button" id="shop-save">お店の情報を保存</button></div></div>
    <div class="set-row"><span class="k">${esc(D.shop)} · ${new Date(D.at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 時点</span><span class="seg"><button type="button" id="reload">読み込み直す</button></span></div>`;
  $('set-box').querySelectorAll('.seg[data-key] button').forEach(b => b.onclick = () => {
    const key = b.parentNode.dataset.key, v = b.dataset.v;
    if (key === 'cycle') { setValueX({ field: 'cycle', value: v }); return; }
    if (key === 'biz') { setValueX({ field: 'biz', value: v }); return; }
    store.set(key, v);
    if (key === 'pack') { location.reload(); return; }
    applyLook(); renderSet();
  });
  $('reload').onclick = () => location.reload();
  $('closed').querySelectorAll('button').forEach(b => b.onclick = () => { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); const v = [...$('closed').querySelectorAll('[aria-pressed="true"]')].map(x => x.dataset.w).join(''); setValueX({ field: 'closed', value: v }); });
  $('shop-save').onclick = () => { const v = {}; $('set-box').querySelectorAll('[data-shop]').forEach(i => v[i.dataset.shop] = i.value.trim()); setValueX({ field: 'shop', value: v }); };
  renderBanks();
}
// ---------- 問い合わせ ----------
$('ct-cat').querySelectorAll('button').forEach(b => b.onclick = () => $('ct-cat').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)));
$('ct-go').onclick = async () => {
  const text = $('ct-text').value.trim(), cat = ($('ct-cat').querySelector('[aria-pressed="true"]') || {}).dataset?.v || 'その他';
  if (!text) { chat('問い合わせの内容を書いてください'); $('ct-text').focus(); return; }
  const go = $('ct-go'); go.disabled = true; chat('送っています…');
  try {
    const out = await api({ kind: 'app_contact', cat, text });
    if (!out.ok) throw new Error(out.error);
    $('ct-text').value = ''; chat('問い合わせを送りました。お返事はLINEかメールでお届けします。', 'heart');
  } catch (e) { chat((e && e.message) || '送れませんでした。電波のよいところでもう一度どうぞ'); }
  finally { go.disabled = false; }
};
// ---------- 衛生記録 ----------
const hygMissing = () => (D && D.hyg && !D.closedToday) ? D.hyg.today.missing : [];
function renderHyg() {
  if (!D.hyg) { $('hyg-today').innerHTML = '<p class="k" style="margin:0">読み込めませんでした</p>'; return; }
  const t = D.hyg.today;
  $('hyg-today').innerHTML = `<p style="margin:0 0 8px"><b>今日 ${md(t.date)}</b> <span class="k">${D.closedToday ? '定休日' : t.missing.length ? 'あと' + t.missing.length + 'つ' : 'ぜんぶ記録済み'}</span></p>
    <div class="hyg-in">${t.items.map((it, i) => `<span>${esc(it.name)}${it.kind === 'temp' ? `<br><span class="k">目安 ${it.lo ?? ''}〜${it.hi ?? ''}℃</span>` : ''}${it.rec ? `<br><span class="pill ${it.rec.j === 'OK' ? '' : 'warn'}">${esc(String(it.rec.v))}${it.kind === 'temp' ? '℃' : ''} · ${esc(it.rec.who || '')}</span>` : ''}</span>
      ${it.kind === 'temp' ? `<span><input id="hy-${i}" inputmode="decimal" placeholder="℃" aria-label="${esc(it.name)}の温度"></span>` : `<span class="seg" data-hy="${i}"><button type="button" data-v="OK" aria-pressed="false">OK</button><button type="button" data-v="NG" aria-pressed="false">NG</button></span>`}`).join('')}</div>
    <div class="ask"><button class="btn" type="button" id="hyg-go">記録する</button><span class="k">${VIA}「冷蔵 3 冷凍 -18 清掃OK」でも入ります</span></div>`;
  $('hyg-today').querySelectorAll('[data-hy] button').forEach(b => b.onclick = () => { b.parentNode.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); });
  $('hyg-go').onclick = () => { const v = {}; t.items.forEach((it, i) => { if (it.kind === 'temp') { const x = $('hy-' + i).value.trim(); if (x) v[it.name] = x; } else { const p = $('hyg-today').querySelector(`[data-hy="${i}"] [aria-pressed="true"]`); if (p) v[it.name] = p.dataset.v; } }); if (!Object.keys(v).length) { chat('入れる値がまだありません'); return; } setValueX({ field: 'hyg', value: v }); };
  const ms = Object.keys(D.hyg.months || {}).sort().reverse(), chips = $('hyg-chips');
  if (!ms.length) { chips.innerHTML = ''; $('hyg-month').innerHTML = '<p class="k" style="margin:0">記録がたまると、ここに月の表ができます</p>'; return; }
  const sel = chips.dataset.m && ms.includes(chips.dataset.m) ? chips.dataset.m : ms[0];
  chips.innerHTML = ms.map(m => `<button class="chip" type="button" data-m="${m}" aria-pressed="${m === sel}">${+m.slice(5)}月</button>`).join('');
  chips.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { chips.dataset.m = b.dataset.m; renderHyg(); });
  $('hyg-month').innerHTML = hygTable(sel);
  $('hyg-print').onclick = () => openPrint(`<h2>衛生管理記録</h2><p>${esc(D.shop)} ・ ${sel.replace('-', '年')}月</p>${hygTable(sel)}<p style="font-size:12px">目安: ${t.items.filter(i => i.kind === 'temp').map(i => `${esc(i.name)} ${i.lo ?? ''}〜${i.hi ?? ''}℃`).join(' / ')}</p><p style="margin-top:24px">確認者: ＿＿＿＿＿＿＿＿</p>`);
}
function hygTable(mo) {
  const days = D.hyg.months[mo] || {}, names = D.hyg.today.items.map(i => i.name), [y, m] = mo.split('-').map(Number), n = new Date(y, m, 0).getDate();
  let h = `<table class="hgrid"><tr><th>日</th>${names.map(x => `<th>${esc(x)}</th>`).join('')}<th>記録した人</th></tr>`;
  for (let d = 1; d <= n; d++) { const k = `${mo}-${String(d).padStart(2, '0')}`, r = days[k] || {}; const who = [...new Set(Object.values(r).map(x => x.who))].join('・');
    h += `<tr><td>${d}(${'日月火水木金土'[new Date(y, m - 1, d).getDay()]})</td>${names.map(x => r[x] ? `<td class="${r[x].j === 'OK' ? '' : 'bad'}">${esc(String(r[x].v))}</td>` : '<td></td>').join('')}<td>${esc(who)}</td></tr>`; }
  return h + '</table>';
}
function openPrint(html) {
  const v = $('inv'); v.classList.remove('lprint'); const lp = document.getElementById('lb-page'); if (lp) lp.textContent = ''; v.innerHTML = html + '<div class="bar3"><button class="btn" type="button" id="inv-print">印刷・PDFにする</button><button class="btn ghost" type="button" id="inv-close">閉じる</button></div>'; v.hidden = false;
  $('inv-print').onclick = () => window.print(); $('inv-close').onclick = () => { v.hidden = true; };
}
// ---------- 卸 ----------
function renderWs() {
  const ws = D.ws || {}, ms = Object.keys(ws).sort().reverse(), chips = $('ws-chips');
  const tos = [...new Set(ms.flatMap(m => Object.keys(ws[m])))];
  $('ws-add').innerHTML = `<p style="margin:0 0 6px"><b>納品を記録</b></p><div class="fld"><span class="k">卸先</span><input id="ws-to" list="ws-tos" placeholder="〇〇ゴルフ"><datalist id="ws-tos">${tos.map(t => `<option value="${esc(t)}">`).join('')}</datalist>
    <span class="k">商品と数</span><input id="ws-items" placeholder="栗万十20 チーズ万十10"></div><div class="ask"><button class="btn" type="button" id="ws-go">記録</button><span class="k">${VIA}「納品 〇〇ゴルフ 栗万十20」でもOK</span></div>`;
  $('ws-go').onclick = () => { const to = $('ws-to').value.trim(), it = $('ws-items').value.trim(); if (!to || !it) { chat('卸先と、商品と数を入れてください'); return; } setValueX({ field: 'deliv', value: to + ' ' + it }); };
  if (!ms.length) { chips.innerHTML = ''; $('ws-list').innerHTML = '<div class="card"><p class="k" style="margin:0">まだ納品の記録がありません</p></div>'; return; }
  const sel = chips.dataset.m && ms.includes(chips.dataset.m) ? chips.dataset.m : ms[0];
  chips.innerHTML = ms.map(m => `<button class="chip" type="button" data-m="${m}" aria-pressed="${m === sel}">${m.replace('-', '年')}月</button>`).join('');
  chips.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { chips.dataset.m = b.dataset.m; renderWs(); });
  const by = ws[sel];
  $('ws-list').innerHTML = Object.keys(by).map((to, i) => { const o = by[to], miss = [...new Set(o.lines.filter(l => l.unit == null).map(l => l.item))];
    return `<div class="card"><div class="row"><b>${esc(to)}</b><span class="big" style="font-size:20px">${yen(o.total)}</span></div><p class="k" style="margin:2px 0 6px">税抜 · ${o.lines.length}回の納品</p>
    ${miss.length ? `<div class="ask" style="margin-top:0">${miss.map((it, j) => `<span class="k">${esc(it)}の卸値</span><input id="wp-${i}-${j}" inputmode="numeric" placeholder="円" style="width:80px"><button class="btn ghost" type="button" data-wp="${i}-${j}" data-to="${esc(to)}" data-it="${esc(it)}">決める</button>`).join('')}</div>` : ''}
    <div class="ask"><button class="btn ghost" type="button" data-inv="${esc(to)}">請求書を見る・印刷</button></div></div>`; }).join('');
  $('ws-list').querySelectorAll('[data-wp]').forEach(b => b.onclick = () => { const v = +$('wp-' + b.dataset.wp).value; if (!(v > 0)) return; setValueX({ field: 'wsprice', to: b.dataset.to, product: b.dataset.it, value: v }); });
  $('ws-list').querySelectorAll('[data-inv]').forEach(b => b.onclick = () => openInvoice(sel, b.dataset.inv));
}
function openInvoice(mo, to) {
  const o = D.ws[mo][to], si = D.shopInfo || {}, sum = {};
  o.lines.forEach(l => { const k = l.item + '|' + (l.unit ?? ''); sum[k] = sum[k] || { item: l.item, unit: l.unit, qty: 0 }; sum[k].qty += l.qty; });
  const rows = Object.values(sum), sub = rows.reduce((a, r) => a + (r.unit || 0) * r.qty, 0), tax = Math.floor(sub * 0.08), [y, m] = mo.split('-').map(Number), last = new Date(y, m, 0);
  openPrint(`<h2>請 求 書</h2>
    <div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap"><div><p style="font-size:18px;border-bottom:1px solid #333;padding-bottom:2px;margin:0 0 8px">${esc(to)} 御中</p><p style="margin:0">${y}年${m}月分(${m}月1日〜${m}月${last.getDate()}日)</p>
      <p style="font-size:20px;margin:10px 0">ご請求額 <b>${(sub + tax).toLocaleString('ja-JP')}円</b>(税込)</p></div>
      <div style="font-size:13px;text-align:right"><img src="logo_mark.webp?v=1" alt="" onerror="this.remove()" style="height:56px;display:block;margin:0 0 6px auto">${esc(si.name || D.shop)}<br>${esc(si.addr || '')}<br>${si.tel ? 'TEL ' + esc(si.tel) : ''}<br>${si.reg ? '登録番号 ' + esc(si.reg) : ''}<br>発行日 ${new Date().toLocaleDateString('ja-JP')}</div></div>
    <table style="margin-top:12px"><tr><th>品名</th><th>数量</th><th>単価(税抜)</th><th>金額(税抜)</th></tr>
      ${rows.map(r => `<tr><td>${esc(r.item)} ※</td><td style="text-align:right">${r.qty}</td><td style="text-align:right">${r.unit != null ? r.unit.toLocaleString('ja-JP') : '未定'}</td><td style="text-align:right">${r.unit != null ? (r.unit * r.qty).toLocaleString('ja-JP') : ''}</td></tr>`).join('')}
      <tr><td colspan="3" style="text-align:right">小計(8%対象)</td><td style="text-align:right">${sub.toLocaleString('ja-JP')}</td></tr>
      <tr><td colspan="3" style="text-align:right">消費税(8%)</td><td style="text-align:right">${tax.toLocaleString('ja-JP')}</td></tr>
      <tr><td colspan="3" style="text-align:right"><b>合計</b></td><td style="text-align:right"><b>${(sub + tax).toLocaleString('ja-JP')}</b></td></tr></table>
    <p style="font-size:12px">※は軽減税率(8%)対象です。</p>
    <p style="font-size:12px">納品日: ${[...new Set(o.lines.map(l => l.day))].sort().map(d => +d.slice(5, 7) + '/' + +d.slice(8)).join('、')}</p>
    ${si.bank ? `<p>お振込先: ${esc(si.bank)}</p>` : ''}${rows.some(r => r.unit == null) ? '<p style="color:#a4512a">単価が未定の品があります。「卸」の画面で卸値を入れてください。</p>' : ''}`);
}
// ---------- 売上ともうけ ----------
function renderSales() {
  const sa = D.sales || {}, ms = Object.keys(sa).sort().reverse(), chips = $('sales-chips');
  $('sales-add').innerHTML = `<p style="margin:0 0 6px"><b>写真がないときは数字で</b></p><div class="fld"><span class="k">日付</span><input id="sl-date" type="date" value="${new Date().toLocaleDateString('sv-SE')}"><span class="k">売上(税込)</span><input id="sl-total" inputmode="numeric" placeholder="52300"><span class="k">客数</span><input id="sl-cust" inputmode="numeric" placeholder="48(なくても可)"></div><div class="ask"><button class="btn" type="button" id="sl-go">記録</button><span class="k">${SHOT}精算レシートを撮るのが一番かんたんです</span></div>`;
  $('sl-go').onclick = () => { const t = $('sl-total').value.trim(); if (!t) { chat('売上の金額を入れてください'); return; } setValueX({ field: 'sales', value: { date: $('sl-date').value, total: t, customers: $('sl-cust').value.trim() } }); };
  if (!ms.length) { chips.innerHTML = ''; $('sales-box').innerHTML = '<div class="card"><p class="k" style="margin:0">まだ売上の記録がありません。閉店後にレジの精算レシートを' + SHOT + '撮って送ってください</p></div>'; return; }
  const sel = chips.dataset.m && ms.includes(chips.dataset.m) ? chips.dataset.m : ms[0];
  chips.innerHTML = ms.map(m => `<button class="chip" type="button" data-m="${m}" aria-pressed="${m === sel}">${m.replace('-', '年')}月</button>`).join('');
  chips.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { chips.dataset.m = b.dataset.m; renderSales(); });
  const o = sa[sel], items = Object.keys(o.items).sort((a, b) => (o.items[b].amount - o.items[b].cost) - (o.items[a].amount - o.items[a].cost)), unk = Object.keys(o.unknown || {});
  const rate = o.madeCost ? Math.round(o.madeCost / Math.max(1, o.total) * 100) : null;
  $('sales-box').innerHTML = `<div class="card"><div class="row"><span>売上(税込)</span><span class="big">${yen(o.total)}</span></div>
      <p class="k" style="margin:4px 0 0">${o.nDays}日分 · 1日平均 ${yen(o.total / Math.max(1, o.nDays))}${o.customers ? ` · 客数 ${o.customers}人 · 客単価 ${yen(o.total / o.customers)}` : ''}</p>
      ${rate != null ? `<div class="row" style="margin-top:8px"><span>作った分の材料費</span><b>${yen(o.madeCost)}</b></div><p class="k" style="margin:2px 0 0">原価率の目安 ${rate}%(製造メモ × 1${U}の原価 ÷ 売上)</p>` : ''}</div>
    ${items.length ? `<div class="card"><p style="margin:0 0 6px"><b>商品ごとのもうけ</b> <span class="k">売上 − 材料費</span></p><table><tr><td class="k">商品</td><td class="n k">数</td><td class="n k">売上</td><td class="n k">もうけ</td></tr>${items.map(n => { const x = o.items[n], g = x.amount - x.cost; return `<tr><td>${esc(n)}${x.unit == null ? ' <span class="pill warn">重さ待ち</span>' : ''}</td><td class="n">${x.qty}</td><td class="n">${yen(x.amount)}</td><td class="n"><b>${yen(g)}</b><br><span class="k">${x.amount ? Math.round(g / x.amount * 100) : 0}%</span></td></tr>`; }).join('')}</table>
      <p class="k" style="margin:6px 0 0">人件費・光熱費などは入っていません。材料費だけを引いた額です</p></div>` : ''}
    ${unk.length ? `<div class="card"><p style="margin:0 0 6px"><b>レジの名前と商品をつなぐ</b></p><p class="k" style="margin:0 0 6px">商品ごとに打っている名前は、仕込帳の商品を選ぶともうけが出ます。部門(和菓子など)はそのままで大丈夫です</p>
      ${unk.map((u, i) => `<div class="ask"><span style="min-width:7em">${esc(u)} <span class="k">${yen(o.unknown[u])}</span></span><select id="ra-${i}" style="font:inherit;font-size:14px;padding:5px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink)"><option value="">選ぶ</option>${D.products.map(p => `<option>${esc(p.name)}</option>`).join('')}</select><button class="btn ghost" type="button" data-ra="${i}" data-reg="${esc(u)}">つなぐ</button></div>`).join('')}</div>` : ''}`;
  $('sales-box').querySelectorAll('[data-ra]').forEach(b => b.onclick = () => { const p = $('ra-' + b.dataset.ra).value; if (!p) return; setValueX({ field: 'regalias', reg: b.dataset.reg, product: p }); });
}
// ---------- 発信 ----------
function renderPost() {
  $('post-p').innerHTML = '<option value="">商品から選ぶ</option>' + D.products.map(p => `<option>${esc(p.name)}</option>`).join('');
  $('post-go').onclick = async () => {
    const sub = $('post-free').value.trim() || $('post-p').value; if (!sub) { chat('商品を選ぶか、テーマを書いてください'); return; }
    $('post-out').innerHTML = '<div class="card"><p class="k" style="margin:0">考えています…(10秒ほど)</p></div>'; chat('考えています…', 'think');
    const out = await api({ kind: 'app_gen', subject: sub });
    if (!out.ok) { $('post-out').innerHTML = ''; chat(out.error || 'うまく作れませんでした'); return; }
    const d = out.drafts;
    $('post-out').innerHTML = [['ポップ', d.pop], ['インスタ', d.insta], ['お知らせ', d.notice]].map(([l, t], i) => `<div class="card"><div class="row"><b>${l}</b><button class="btn ghost" type="button" data-cp="${i}">コピー</button></div><p class="draft" id="dr-${i}">${esc(t || '')}</p></div>`).join('');
    $('post-out').querySelectorAll('[data-cp]').forEach(b => b.onclick = async () => { try { await navigator.clipboard.writeText($('dr-' + b.dataset.cp).textContent); chat('コピーしました', 'heart'); } catch (e) { chat('長押しで選んでコピーしてください'); } });
    chat('案ができました。書かれていないことは足していません。', 'clap');
  };
}

// ---------- 右下に座るキャラ:ふだんはお茶を持って座り、ときどきしぐさ。押すと会話が開く ----------
const PACK = store.get('pack', 'shirokuma');
const ROLE = { greet: '1', heart: '3', clap: '7', point: '10', surprise: '12', think: '13', tea: '19', walk: '20', sleepy: '23', sleep: '24' };
const ch = $('chara'), say = $('say'), CS = () => ch.offsetWidth || 72;
let busy = false, talkT = null; const anim = { gen: 0, t: null };
function play(r, loop = true, speed = 1.3) {
  const e = window.EMOJI && EMOJI[PACK][ROLE[r]]; if (!e) return Promise.resolve();
  clearTimeout(anim.t); const g = ++anim.gen; let f = 0; ch.style.backgroundImage = `url(${e.src})`;
  return new Promise(res => { const st = () => { if (g !== anim.gen) return; ch.style.backgroundPosition = `-${f * CS()}px 0`; f++; if (f >= +e.frames) { if (loop) f = 0; else { res(); return; } } anim.t = setTimeout(st, e.delay * speed); }; st(); if (loop) res(); });
}
// 座った姿(お茶の最初のコマ)で止める
function rest() { clearTimeout(anim.t); ++anim.gen; if (!window.EMOJI) return; const e = EMOJI[PACK][ROLE.tea]; ch.style.backgroundImage = `url(${e.src})`; ch.style.backgroundPosition = '0 0'; }
async function act(r, speed = 1.3) { if (busy) return; busy = true; try { await play(r, false, speed); } finally { busy = false; rest(); } }
setInterval(() => { if (!busy && document.visibilityState === 'visible' && Math.random() < .4) { const acts = ['tea', 'tea', 'sleepy', 'think', 'greet']; act(acts[Math.floor(Math.random() * acts.length)], 1.7); } }, 10000);
function place() {}
function chat(text, role) {
  if (role) act(role, 1.3);
  if (!text) return;
  clearTimeout(talkT); say.textContent = text; say.hidden = false; talkT = setTimeout(() => say.hidden = true, 5200);
}
const CNAME = PACK === 'tanuki' ? 'ぽん' : 'もなか';
function hello() {
  const q = notices().length, u = D.ups.length, h = new Date().getHours();
  const g = h < 10 ? 'おはようございます。' : h < 17 ? '' : 'おつかれさまです。';
  return q ? `${g}確認待ちが${q}つ` + (u ? `(値上がり${u}つ)` : '') + 'あります。' : `${g}確認待ちはありません。`;
}
$('date').textContent = new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' });
addEventListener('resize', place);

// ---------- 聞く ----------
const sheet = $('sheet'), msgs = $('msgs'), qIn = $('q');
$('sname').textContent = CNAME; ch.setAttribute('aria-label', CNAME + 'に話しかける');
function faces() { if (!window.EMOJI) return; const el = $('sface'); el.style.backgroundImage = `url(${EMOJI[PACK]['1'].src})`; el.style.backgroundPosition = '0 0'; rest(); }
// キャラの絵(大きい)は画面が出たあとで読む
(() => { const s = document.createElement('script'); s.src = 'emoji.js?v=18'; s.async = true; s.onload = faces; document.body.appendChild(s); })();
function addMsg(html, me) { const d = document.createElement('div'); d.className = 'm' + (me ? ' me' : ''); d.innerHTML = html; msgs.appendChild(d); d.scrollIntoView({ block: 'end', behavior: 'smooth' }); return d; }
function botSay(html, role) { const d = addMsg('…'); setTimeout(() => { d.innerHTML = html; d.scrollIntoView({ block: 'end', behavior: 'smooth' }); }, 120); if (role) chat(null, role); }
function openAsk() { if (!D) return; sheet.hidden = false; if (!msgs.children.length) botSay(`${CNAME}です。お店のことなら、ふつうの言葉で話しかけてください。「昨日ゴルフ場に栗万十20個持ってった」のように話してもらえれば、確かめてから記録します。`); renderChips(); setTimeout(() => qIn.focus(), 100); }
$('sclose').onclick = () => sheet.hidden = true; sheet.onclick = e => { if (e.target === sheet) sheet.hidden = true; };
ch.onclick = openAsk; ch.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAsk(); } };
$('cam').onclick = openCamera;
function renderChips(quick) {
  const p0 = D.products[0] ? D.products[0].name : '栗万十';
  const c = quick && quick.length ? quick : ['今月儲かってる?', `${p0}の原価は?`, '値上げしたほうがいい?', '今日の衛生でまだのは?', '払っていないのは?', 'そろそろ買うものは?', `${p0}の栄養成分は?`];
  const box = $('qchips'); box.innerHTML = c.map(s => `<button type="button">${esc(s)}</button>`).join('');
  box.querySelectorAll('button').forEach(b => b.onclick = () => ask(b.textContent));
}
const findProd = s => D.products.slice().sort((a, b) => b.name.length - a.name.length).find(p => s.includes(p.name));
const findMat = s => D.materials.slice().sort((a, b) => b.name.length - a.name.length).find(m => s.includes(m.name));
async function answer(s) {
  s = s.replace(/\s+/g, ' ').trim(); let m;
  const p = findProd(s);
  if (p && (m = s.match(/(\d+(?:\.\d+)?)\s*(g|ｇ|グラム)/))) { await setValue(p.name, 'pw', +m[1]); const q = D.products.find(x => x.name === p.name); return [`覚えました。${esc(p.name)}は1個${m[1]}g、約${q.pieces}個、1個 <b>${yen1(q.per_piece)}</b> です。`, 'heart']; }
  if (p && (m = s.match(/(\d+)\s*円/))) { await setValue(p.name, 'price', +m[1]); const q = D.products.find(x => x.name === p.name); return [`覚えました。${esc(p.name)}は${m[1]}円。` + (q.per_piece != null ? `原価率は <b>${Math.round(q.per_piece / q.price * 100)}%</b> です。` : '1個の重さが分かれば原価率も出します。'), 'heart']; }
  if (p && /裏表示|表示|ラベル|原材料/.test(s)) return [`${esc(p.name)}の原材料名の案です。\n<b>${esc(p.label.text)}${esc(p.label.contains)}</b>` + (p.label.check.length ? `\n要確認:${p.label.check.map(esc).join('、')}` : ''), 'point'];
  if (p && /アレルゲン|アレルギー/.test(s)) return [`${esc(p.name)}は ${p.label.allergens.length ? p.label.allergens.map(esc).join('・') : '該当なし'} です(案)。`, 'point'];
  if (p) { if (p.per_piece == null) return [`${esc(p.name)}は1仕込み ${yen(p.batch_cost)} です。「${esc(p.name)}は1個40g」のように重さを教えてもらえれば、1個の値段を出します。`, 'think'];
    return [`${esc(p.name)}は1個 <b>${yen1(p.per_piece)}</b> です。1仕込み ${yen(p.batch_cost)}、約${p.pieces}個。` + (p.price ? `原価率 ${Math.round(p.per_piece / p.price * 100)}%。` : ''), 'clap']; }
  if ((m = s.match(/^(.+?)\s*(に|へ|を|は)?\s*(払った|払いました|支払った|振り込んだ|振込んだ)/))) {
    const who = m[1].replace(/\s/g, ''), hit = unpaid().find(p => p.supplier.includes(who) || who.includes(p.supplier.slice(0, 4)));
    if (!hit) return [`「${esc(who)}」の未払いが見つかりませんでした。` + (unpaid().length ? `\n未払い:${unpaid().map(p => esc(p.supplier)).join('、')}` : ''), 'think'];
    await setValue('', 'paid', hit.row); return [`「${esc(hit.supplier)}」${esc(hit.month)}分 ${yen(hit.total)} を済にしました。`, 'heart'];
  }
  if (/在庫|残り|棚卸/.test(s)) { const it = ((D.stock || {}).items || []).filter(x => x.known && x.unit === 'g'); return [it.length ? '計算上の残りです。\n' + it.slice(0, 10).map(x => `${x.low ? '⚠' : '・'}${esc(x.key)} ${amt(x.left, x.unit)}${x.days != null ? `(あと約${x.days}日)` : ''}`).join('\n') : 'まだ在庫を計算できる材料がありません。請求書を撮るか、数えた量を「材料」画面で入れてください。', 'think']; }
  if (/買い物|買い出し|買うもの/.test(s)) { const low = ((D.stock || {}).items || []).filter(x => x.low); return [low.length ? 'そろそろ買うものです。\n' + low.map(x => `・${esc(x.key)}(残り${amt(x.left, x.unit)})`).join('\n') : '今は足りなくなりそうなものはありません。', 'point']; }
  if (/支払|払うもの|振込|振り込み/.test(s)) { const up = unpaid(); return [up.length ? `払っていないのは${up.length}件、合計 <b>${yen(up.reduce((a, p) => a + p.total, 0))}</b>。\n` + up.map(p => `・${esc(p.supplier)}(${esc(p.month)}分)${yen(p.total)}${p.due ? ' 期限' + esc(p.due) : ''}`).join('\n') : '払っていない請求書はありません。', 'point']; }
  if (/仕訳|科目/.test(s)) { const ms = Object.keys(D.journal || {}).sort(); if (!ms.length) return ['まだ請求書がありません。', 'think']; const k = ms[ms.length - 1], sm = D.journal[k];
    return [`${esc(k)}分の科目ごとの合計(案):\n` + Object.keys(sm).map(a => `・${esc(a)} ${yen(sm[a])}`).join('\n'), 'point']; }
  if (/値上が|上がっ|高くな/.test(s)) return [D.ups.length ? D.ups.map(u => `・${esc(u.item)}(${esc(u.spec)}) ${u.old.toLocaleString()}円→${u.now.toLocaleString()}円(+${u.pct}%)`).join('\n') : '今のところ値上がりは見つかっていません。', 'surprise'];
  if (/仕入|先月|合計|まとめ/.test(s)) { const ms = Object.keys(D.months).sort(); if (!ms.length) return ['まだ請求書がありません。請求書を撮って送ってください。', 'think']; const k = ms[ms.length - 1], mm = D.months[k];
    return [`${esc(k)}の仕入れは <b>${yen(mm.total)}</b>。\n` + Object.entries(mm.by).map(([a, v]) => `・${esc(a)} ${yen(v)}`).join('\n'), 'point']; }
  const mt = findMat(s);
  if (mt) return [`「${esc(mt.name)}」は <b>${esc(mt.display)}</b> として扱っています。` + (mt.ppg ? ` ${Math.round(mt.ppg * 1000).toLocaleString()}円/kg(${mt.ok ? '請求書' : '仮'})。` : '') + (mt.allergens.length ? ` アレルゲン:${mt.allergens.map(esc).join('・')}。` : '') + (mt.note ? `\n${esc(mt.note)}` : ''), 'think'];
  if (/確認|待ち|やること/.test(s)) { const n = notices().length; return [n ? `確認待ちは${n}つです。「きょう」の画面にまとめてあります。` : '確認待ちはありません。', 'greet']; }
  if (/ありがと|助か/.test(s)) return ['どういたしまして。', 'heart'];
  return ['すみません、まだ答えられません。\n今聞けるのは:原価、裏表示、アレルゲン、値上がり、先月の仕入れ、材料の名前。\n「〇〇は1個40g」「〇〇は250円」と教えてもらうと覚えます。', 'think'];
}
// もなかとの会話は表の側(AI)で。つながらないときだけ、この画面の中の簡単な答えに切り替える
let asking = false;
async function ask(s) {
  if (!s.trim() || asking) return; asking = true;
  addMsg(esc(s), true); qIn.value = '';
  const wait = addMsg('<span class="k">考えています…</span>'); chat(null, 'think');
  try {
    const out = await api({ kind: 'app_chat', text: s, pack: PACK });
    if (!out.ok) throw new Error(out.error || 'ng');
    wait.remove();
    (out.texts || []).forEach((t, i) => setTimeout(() => botSay(esc(t).replace(/\n/g, '<br>')), i * 200));
    if (out.data) { D = out.data; renderAll(); }
    renderChips(out.quick);
  } catch (e) {
    wait.remove(); const [a, role] = await answer(s); botSay(a, role);
  } finally { asking = false; }
}
$('composer').onsubmit = e => { e.preventDefault(); ask(qIn.value); };

// ---------- ホームページ(LINEの外)から写真を送る ----------
async function shrink(file) {
  const img = await createImageBitmap(file);
  const k = Math.min(1, 1800 / Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.88).split(',')[1];
}
function sayShot(out) {
  (out.msgs || []).forEach((t, i) => setTimeout(() => botSay(esc(t).replace(/\n/g, '<br>')), i * 200));
  renderChips(out.quick);
}
async function sendWebFile(file) {
  if (!file || !/^image\//.test(file.type) || !D) return;
  openAsk(); addMsg('<span class="k">📷 写真を送りました</span>', true);
  const wait = addMsg('<span class="k">読んでいます…(10〜30秒かかります)</span>'); chat(null, 'think');
  try {
    const out = await api({ kind: 'liff_upload', web: true, image: await shrink(file), type: 'image/jpeg' });
    wait.remove();
    if (!out.ok) throw new Error(out.error || 'うまく読めませんでした');
    sayShot(out); load();
  } catch (e) { wait.remove(); botSay(esc(e.message || 'うまく送れませんでした')); }
}
function webPhoto() {
  let f = $('web-pick');
  if (!f) {
    f = document.createElement('input'); f.type = 'file'; f.accept = 'image/*'; f.id = 'web-pick'; f.hidden = true; document.body.appendChild(f);
    f.onchange = () => { const file = f.files[0]; f.value = ''; sendWebFile(file); };
  }
  f.click();
}
// パソコン: 写真を画面に引っぱって落としても送れる
if (CF) {
  addEventListener('dragover', e => { if (e.dataTransfer && [...e.dataTransfer.types].includes('Files')) e.preventDefault(); });
  addEventListener('drop', e => { const file = e.dataTransfer && e.dataTransfer.files[0]; if (!file) return; e.preventDefault(); sendWebFile(file); });
}
// 青い枠のカメラで撮って戻ってきたとき、もなかの答えを出す
function showShot() {
  let out = null; try { out = JSON.parse(sessionStorage.getItem('shikomi:shot') || 'null'); sessionStorage.removeItem('shikomi:shot'); } catch (e) {}
  if (!out || !D) return;
  openAsk(); addMsg('<span class="k">📷 撮った写真を送りました</span>', true); sayShot(out);
}
// ---------- ログインの設定(ホームページのときだけ) ----------
async function renderAccount() {
  const box = $('acct-box'); if (!CF || !box) return;
  box.parentNode.hidden = false; $('acct-h').hidden = false;
  const a = await api({ kind: 'app_account' }).catch(() => null); if (!a || !a.ok) return;
  box.innerHTML = `<p style="margin:0 0 6px"><b>${esc(a.shop ? a.shop.name || D.shop : '')}</b></p>
    <p class="k" style="margin:0 0 10px">メール: ${a.email ? esc(a.email) : 'まだ'} ・ LINE: ${a.line ? 'つながっています' : 'まだ'}</p>
    ${a.email ? '' : '<div class="ask" style="margin-top:0"><input id="ac-mail" type="email" placeholder="メールアドレス" style="flex:1" aria-label="メールアドレス"><button class="btn ghost" type="button" id="ac-mail-go">メールでも入れるように</button></div><p class="k" id="ac-mail-msg" style="margin:4px 0 0"></p>'}
    ${a.line || IN_LINE || !a.lineLogin ? '' : '<div class="ask"><a class="btn ghost" href="/auth/line?link=1&next=/app/">LINEとつなぐ</a></div>'}
    <div class="ask"><button class="btn ghost" type="button" id="ac-inv">スタッフを招待するリンク</button></div><p class="k" id="ac-inv-out" style="margin:4px 0 0;word-break:break-all"></p>
    ${IN_LINE ? '' : '<form method="post" action="/auth/logout" class="ask"><button class="btn ghost" type="submit">ログアウト</button></form>'}`;
  if ($('ac-mail-go')) $('ac-mail-go').onclick = async () => {
    const m = $('ac-mail').value.trim(); if (!m) { $('ac-mail').focus(); return; }
    const r = await api({ kind: 'app_link_email', email: m });
    $('ac-mail-msg').innerHTML = r.ok ? `${esc(m)} に確認のリンクを送りました。開くと、メールでもログインできるようになります。${r.devLink ? `<br><a href="${esc(r.devLink)}">(試験中)ここから開く</a>` : ''}` : esc(r.error || '送れませんでした');
  };
  $('ac-inv').onclick = async () => {
    const r = await api({ kind: 'app_new_invite' });
    if (!r.ok) { $('ac-inv-out').textContent = r.error || '作れませんでした'; return; }
    $('ac-inv-out').innerHTML = `${esc(r.invite)}<br>このリンクをスタッフに送ってください。開いて登録すると、すぐにお店の画面が見られます。スタッフ以外には送らないでください。`;
    try { await navigator.clipboard.writeText(r.invite); chat('リンクをコピーしました', 'heart'); } catch (e) {}
  };
}

// ---------- はじまり ----------
// パソコンの広い画面で左右2列に分けるための入れ物(ケイタイでは入れ物がないのと同じ)
(() => {
  const SPLIT = { book: 'h1.sub', hyg: 'h1.sub', sales: '#sales-add', ws: '#ws-chips', post: '#post-out', set: '#bank-h' };
  for (const [t, sel] of Object.entries(SPLIT)) {
    const sec = $('t-' + t), kids = [...sec.children], lead = sec.querySelector(':scope > .lead'), cut = sec.querySelector(':scope > ' + sel);
    if (!cut) continue;
    const body = kids.slice(kids.indexOf(lead) + 1), ci = body.indexOf(cut);
    const cols = document.createElement('div'), L = document.createElement('div'), R = document.createElement('div');
    cols.className = 'cols'; L.className = 'colL'; R.className = 'colR';
    body.slice(0, ci).forEach(k => L.appendChild(k)); body.slice(ci).forEach(k => R.appendChild(k));
    cols.append(L, R); sec.appendChild(cols);
  }
})();
if (CF) { $('words-h').textContent = 'もなかに話しかけられる言葉'; $('ct-via').textContent = 'もなかに「問い合わせ 〜」と話しかけてもOK'; }
rest();
// 前に読んだ内容をすぐ出して、裏で新しいものを読み直す(電波が弱くても待たない)
(() => { const c = store.get('data', null); if (c && c.products) { try { D = c; state(''); renderAll(); show(store.get('tab', 'today'), true); setTimeout(() => chat(hello(), 'greet'), 250); } catch (e) { D = null; } } })();
(async () => {
  if (CF && !IN_LINE) { load(); return; }   // ホームページ: ログインの鍵(クッキー)で入る
  if (CF) {   // LINEの中でホームページを開いたとき: ログインの鍵があれば、それで入る
    try { const t = await api({ kind: 'app_data' }); if (t.ok) { load(); return; } } catch (e) {}
  }
  try {
    await liff.init({ liffId: LIFF_ID });
    if (!liff.isLoggedIn()) { state('LINEでログインします…'); liff.login({ redirectUri: location.href }); return; }
    idToken = liff.getIDToken();
    try { profileName = (await liff.getProfile()).displayName; } catch (e) {}
    load();
  } catch (e) {
    state('LINEにつながりませんでした。<br><button class="btn ghost" onclick="location.reload()">もう一度</button>');
  }
})();
