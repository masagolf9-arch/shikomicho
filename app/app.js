// 仕込帳 お店の画面(LINEの中でも、パソコンのブラウザでも開ける)
// データは Google の記録の表から読む。見られるのは「メンバー」シートで許可された人だけ。
const LIFF_ID = '2012003912-ltVppjVx';
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxShAkcy1uEzK5ZUGWgW8lzdFBcd8baDNKjHwGKCBx7ocrEUNDHmzrSFdrZDikqL2VO/exec';
const CAMERA_URL = 'https://liff.line.me/' + LIFF_ID;

const $ = id => document.getElementById(id);
const store = { get(k, d) { try { const v = localStorage.getItem('shikomi:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
                set(k, v) { try { localStorage.setItem('shikomi:' + k, JSON.stringify(v)); } catch (e) {} } };
const yen = n => Math.round(n).toLocaleString('ja-JP') + '円';
const yen1 = n => (Math.round(n * 10) / 10).toLocaleString('ja-JP') + '円';
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let D = null, idToken = null, profileName = '';

// ---------- 記録の表とのやり取り ----------
async function api(body) {
  const res = await fetch(GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(Object.assign({ idToken, name: profileName }, body)) });
  return res.json();
}
function state(html) { const s = $('state'); s.innerHTML = html; s.hidden = !html; }
async function load() {
  try {
    const out = await api({ kind: 'app_data' });
    if (!out.ok) {
      if (out.error === 'wait') return state('お店の人の許可待ちです。<br>店主に「仕込帳の画面を見たい」と伝えてください。<br><button class="btn ghost" onclick="load()">もう一度読む</button>');
      if (out.error === 'login') { liff.logout(); return state('ログインし直してください。<br><button class="btn" onclick="location.reload()">ログイン</button>'); }
      return state(esc(out.error));
    }
    D = out.data; state(''); renderAll(); show(store.get('tab', 'today'), true);
    setTimeout(() => chat(hello(), 'greet'), 700);
  } catch (e) {
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
  if (window.liff && liff.isInClient && liff.isInClient()) liff.openWindow({ url: CAMERA_URL, external: false });
  else chat('写真はスマホのLINEで「📷 写真を撮る」から送ってください。', 'point');
}

// ---------- きょう ----------
function notices() {
  const list = [];
  for (const u of D.ups) list.push({ type: 'up', html: `<p><b>${esc(u.item)}が値上がり</b></p><p class="k">${esc(u.supplier)} ${esc(u.spec)} ${u.old.toLocaleString()}円 → ${u.now.toLocaleString()}円(+${u.pct}%)</p>` });
  const needPw = D.products.filter(p => !p.pw);
  if (needPw.length) list.push({ type: 'q', html: `<p><b>1個の生地は何g?(${needPw.length}品)</b></p><p class="k">数えなくても、重さから個数と1個の原価を出します。分かるものだけで大丈夫</p>` +
    needPw.map((p, i) => `<div class="ask"><span style="min-width:6em">${esc(p.name)}</span><input id="pw-${i}" inputmode="decimal" placeholder="例 40" aria-label="${esc(p.name)}の1個の重さ"><span class="k">g</span><button class="btn" data-pw="${i}" type="button">決める</button></div>`).join('') });
  const unknown = new Set(); D.products.forEach(p => p.unknown.forEach(n => unknown.add(n)));
  for (const n of unknown) list.push({ type: 'q', html: `<p><b>「${esc(n)}」って何の材料ですか?</b></p><p class="k">まだ辞書にない材料です。LINEでもなかに教えるか、表の「材料」シートに足してください</p>` });
  const check = new Set(); D.products.forEach(p => p.label.check.forEach(n => { if (!unknown.has(n)) check.add(n); }));
  for (const n of check) list.push({ type: 'q', cam: true, html: `<p><b>「${esc(n)}」の袋の裏を写真で</b></p><p class="k">名称欄が分かれば、裏表示が確定します</p>` });
  if (!D.products.length) list.push({ type: 'q', cam: true, html: '<p><b>まずはレシピの写真を1枚</b></p><p class="k">LINEの「📷 写真を撮る」で手書きのレシピを撮ると、ここに原価と裏表示の案が出ます</p>' });
  return list;
}
function renderToday() {
  const list = notices();
  $('notices').innerHTML = list.length ? list.map(n => `<div class="card notice"><span class="mark ${n.type}">${n.type === 'up' ? '↑' : '?'}</span><div style="flex:1;min-width:0">${n.html}${n.cam ? '<div class="ask"><button class="btn ghost" type="button" data-cam>📷 撮る</button></div>' : ''}</div></div>`).join('')
    : '<div class="card notice"><span class="mark done">✓</span><div><p>確認待ちはありません。</p></div></div>';
  const needPw = D.products.filter(p => !p.pw);
  $('notices').querySelectorAll('[data-pw]').forEach(b => b.onclick = () => {
    const i = b.dataset.pw, inp = $('pw-' + i), v = parseFloat(inp.value);
    if (!(v > 0)) { inp.focus(); return; }
    setValue(needPw[i].name, 'pw', v);
  });
  $('notices').querySelectorAll('[data-cam]').forEach(b => b.onclick = openCamera);
  const q = list.length; const bd = $('badge'); bd.textContent = q; bd.hidden = !q;
  $('made').innerHTML = D.made.length ? D.made.map(m => `<div class="row"><span>${esc(m.text)}</span><span class="k">${new Date(m.t).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}</span></div>`).join('')
    : '<p class="k" style="margin:0">まだありません。夕方にLINEで「栗万十 90、チーズ万十 100」のように送ると、ここに出ます</p>';
}

// ---------- 原価 ----------
const open = new Set();
function renderCost() {
  const box = $('costs');
  if (!D.products.length) { box.innerHTML = '<div class="card"><p class="k" style="margin:0">まだレシピがありません。LINEの「📷 写真を撮る」でレシピを撮ってください。</p></div>'; return; }
  box.innerHTML = D.products.map((p, i) => {
    const head = p.per_piece != null ? `<div class="big">${yen1(p.per_piece)}<span class="k" style="font-weight:400"> / 1個</span></div>` : '<div class="big" style="font-size:18px;color:var(--ink-2)">1個の重さ待ち</div>';
    const meta = [`<span class="pill gray">1仕込み ${yen(p.batch_cost)}</span>`];
    if (p.pieces) meta.push(`<span class="pill gray">約${p.pieces}個</span>`);
    if (p.price && p.per_piece != null) { const r = p.per_piece / p.price * 100; meta.push(`<span class="pill ${r > 40 ? 'warn' : ''}">原価率 ${Math.round(r)}%</span>`); }
    if (p.unknown.length) meta.push(`<span class="pill warn">不明な材料 ${p.unknown.length}</span>`);
    const det = `<table>${p.rows.map(r => `<tr><td>${esc(r.name)} <span class="k">${r.grams.toLocaleString()}g</span>${r.src === 'est' ? ' <span class="pill warn">仮</span>' : r.src === 'unknown' ? ' <span class="pill warn">不明</span>' : ''}</td><td class="n">${r.cost == null ? '-' : yen1(r.cost)}</td></tr>`).join('')}<tr><td><b>1仕込み</b></td><td class="n"><b>${yen(p.batch_cost)}</b></td></tr></table>
      <div class="set"><span class="k">1個の重さ</span><input id="spw-${i}" inputmode="decimal" value="${p.pw || ''}" placeholder="例 40"><span class="k">g</span><button class="btn ghost" type="button" data-set="pw" data-i="${i}">決める</button></div>
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
function renderLabel() {
  const chips = $('label-chips'), box = $('label-box');
  if (!D.products.length) { chips.innerHTML = ''; box.innerHTML = '<div class="card"><p class="k" style="margin:0">レシピを撮ると、ここに裏表示の案が出ます。</p></div>'; return; }
  if (!D.products.find(p => p.name === labelName)) labelName = D.products[0].name;
  chips.innerHTML = D.products.map(p => `<button class="chip" type="button" aria-pressed="${p.name === labelName}">${esc(p.name)}</button>`).join('');
  chips.querySelectorAll('.chip').forEach((b, i) => b.onclick = () => { labelName = D.products[i].name; renderLabel(); });
  const p = D.products.find(x => x.name === labelName), lb = p.label;
  const name = /羊羹|ようかん/.test(p.name) ? '和生菓子(羊羹)' : /餅|もち/.test(p.name) ? '和生菓子' : '菓子';
  box.innerHTML = `<div class="label">
    <div class="r"><div class="h">名称</div><div class="v">${name}</div></div>
    <div class="r"><div class="h">原材料名</div><div class="v"><span id="ing">${esc(lb.text) || '(まだ出せません)'}</span>${lb.check.length ? `、<mark>${lb.check.map(esc).join('、')}(要確認)</mark>` : ''}${esc(lb.contains)}</div></div>
    <div class="r"><div class="h">内容量</div><div class="v">1個</div></div>
    <div class="r"><div class="h">賞味期限</div><div class="v tbd">枠外下部に記載(日数はお店で設定)</div></div>
    <div class="r"><div class="h">保存方法</div><div class="v">直射日光、高温多湿を避けて保存してください</div></div>
    <div class="r"><div class="h">製造者</div><div class="v">${esc(D.shop)}<span class="k">(住所は設定から)</span></div></div></div>
    <div class="ask" style="margin-top:10px"><button class="btn" id="copy" type="button">原材料名をコピー</button><span class="copied" id="copied"></span></div>`;
  $('copy').onclick = async () => {
    const t = $('ing').textContent + (lb.contains || '');
    try { await navigator.clipboard.writeText(t); $('copied').textContent = 'コピーしました'; }
    catch (e) { const r = document.createRange(); r.selectNodeContents($('ing')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); $('copied').textContent = '選択しました。長押しでコピー'; }
  };
}

// ---------- 材料 ----------
let matF = 'all';
function renderMat() {
  const f = $('mat-filter');
  f.innerHTML = [['all', 'すべて'], ['est', '仮だけ'], ['up', '値上がり']].map(([k, l]) => `<button class="chip" type="button" data-f="${k}" aria-pressed="${k === matF}">${l}</button>`).join('');
  f.querySelectorAll('.chip').forEach(b => b.onclick = () => { matF = b.dataset.f; renderMat(); });
  const upNames = new Set(D.ups.map(u => u.item));
  let rows = D.materials.filter(m => !m.packaging);
  if (matF === 'est') rows = rows.filter(m => !m.ok);
  if (matF === 'up') rows = rows.filter(m => upNames.has(m.name));
  $('mats').innerHTML = rows.map(m => `<tr><td><b>${esc(m.name)}</b>${upNames.has(m.name) ? ' <span class="up">↑</span>' : ''}<br><span class="k">${esc(m.display)}${m.allergens.length ? ' · ' + m.allergens.map(esc).join('・') : ''}</span></td><td class="n">${m.ppg ? Math.round(m.ppg * 1000).toLocaleString() + '円/kg' : '-'}<br>${m.ok ? '<span class="pill">請求書</span>' : '<span class="pill warn">仮</span>'}</td></tr>`).join('') || '<tr><td class="k">ありません</td></tr>';
  const all = D.materials.filter(m => !m.packaging), est = all.filter(m => !m.ok).length;
  const ms = Object.keys(D.months).sort(), lastM = ms[ms.length - 1];
  $('mat-sum').textContent = `材料 ${all.length}種類のうち、確かめた ${all.length - est}、仮 ${est}。` + (lastM ? `${lastM.replace('-', '年')}月の仕入れ ${yen(D.months[lastM].total)}。` : '');
}
function renderAll() {
  renderToday(); renderCost(); renderLabel(); renderMat();
  $('shop').textContent = D.shop;
  $('foot').textContent = `${new Date(D.at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 時点。開き直すと新しくなります。キャラの絵はAtelier SAISPEのLINE絵文字。`;
}

// ---------- タブ ----------
const tabs = ['today', 'cost', 'label', 'mat'];
function show(t, quiet) {
  if (!D) return;
  tabs.forEach(x => $('t-' + x).hidden = x !== t);
  document.querySelectorAll('nav button[data-t]').forEach(b => b.dataset.t === t ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
  store.set('tab', t); window.scrollTo(0, 0);
  if (!quiet) chat({ today: null, cost: '原価です。カードを押すと中身と入力欄が出ます。', label: '裏表示の案です。色のついたところだけ確かめてください。', mat: '材料の値段です。「仮」は請求書が来たら置き換えます。' }[t], t === 'cost' ? 'clap' : t === 'label' ? 'point' : null);
}
document.querySelectorAll('nav button[data-t]').forEach(b => b.onclick = () => show(b.dataset.t));
$('go-cam').onclick = openCamera;

// ---------- 縁側のキャラ:ゆっくり歩いて、ときどき一言 ----------
const PACK = store.get('pack', 'shirokuma');
const ROLE = { greet: '1', heart: '3', clap: '7', point: '10', surprise: '12', think: '13', tea: '19', walk: '20', sleepy: '23', sleep: '24' };
const ch = $('chara'), say = $('say'), eng = $('engawa');
let cx = 60, dir = 1, walking = true, talkT = null; const anim = { gen: 0, t: null };
function play(r, loop = true, speed = 1.3) {
  const e = EMOJI[PACK][ROLE[r]]; if (!e) return Promise.resolve();
  clearTimeout(anim.t); const g = ++anim.gen; let f = 0; ch.style.backgroundImage = `url(${e.src})`;
  return new Promise(res => { const st = () => { if (g !== anim.gen) return; ch.style.backgroundPosition = `-${f * 88}px 0`; f++; if (f >= +e.frames) { if (loop) f = 0; else { res(); return; } } anim.t = setTimeout(st, e.delay * speed); }; st(); if (loop) res(); });
}
function place() { ch.style.transform = `translateX(${cx}px) scaleX(${dir > 0 ? -1 : 1})`; say.style.setProperty('--tail', Math.max(20, Math.min(cx + 32, eng.clientWidth - 44)) + 'px'); }
function walkLoop() { if (walking) { cx += dir * 0.35; const max = eng.clientWidth - 88; if (cx > max) { cx = max; dir = -1; pauseHere(); } if (cx < 0) { cx = 0; dir = 1; pauseHere(); } place(); } requestAnimationFrame(walkLoop); }
function pauseHere() { walking = false; const acts = [['tea', 2], ['sleepy', 2], ['think', 1], ['greet', 1]]; const [r, n] = acts[Math.floor(Math.random() * acts.length)]; (async () => { for (let i = 0; i < n; i++) await play(r, false, 1.6); walking = true; play('walk', true, 2.6); })(); }
setInterval(() => { if (walking && Math.random() < .35) pauseHere(); }, 9000);
function chat(text, role) {
  if (role) { walking = false; play(role, false, 1.3).then(() => { walking = true; play('walk', true, 2.6); }); }
  if (!text) return;
  clearTimeout(talkT); say.textContent = text; say.hidden = false; place(); talkT = setTimeout(() => say.hidden = true, 5200);
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
for (const id of ['sface', 'nface']) { const el = $(id); el.style.backgroundImage = `url(${EMOJI[PACK]['1'].src})`; el.style.backgroundPosition = '0 0'; }
function addMsg(html, me) { const d = document.createElement('div'); d.className = 'm' + (me ? ' me' : ''); d.innerHTML = html; msgs.appendChild(d); d.scrollIntoView({ block: 'end', behavior: 'smooth' }); return d; }
function botSay(html, role) { const d = addMsg('…'); setTimeout(() => { d.innerHTML = html; d.scrollIntoView({ block: 'end', behavior: 'smooth' }); }, 400); if (role) chat(null, role); }
function openAsk() { if (!D) return; sheet.hidden = false; if (!msgs.children.length) botSay(`${CNAME}です。原価、裏表示、材料の値段、値上がりのことを聞いてください。「栗万十は1個30g」「栗万十は250円」のように教えてもらうと覚えます。`); renderChips(); setTimeout(() => qIn.focus(), 100); }
$('ask-btn').onclick = openAsk; $('sclose').onclick = () => sheet.hidden = true; sheet.onclick = e => { if (e.target === sheet) sheet.hidden = true; };
ch.onclick = openAsk; ch.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAsk(); } };
$('cam').onclick = openCamera;
function renderChips() {
  const p0 = D.products[0] ? D.products[0].name : '栗万十';
  const c = [`${p0}の原価は?`, `${p0}の裏表示`, '値上がりしたものは?', '先月の仕入れは?', '確認待ちは?'];
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
  if (/値上が|上がっ|高くな/.test(s)) return [D.ups.length ? D.ups.map(u => `・${esc(u.item)}(${esc(u.spec)}) ${u.old.toLocaleString()}円→${u.now.toLocaleString()}円(+${u.pct}%)`).join('\n') : '今のところ値上がりは見つかっていません。', 'surprise'];
  if (/仕入|先月|合計|まとめ/.test(s)) { const ms = Object.keys(D.months).sort(); if (!ms.length) return ['まだ請求書がありません。請求書を撮って送ってください。', 'think']; const k = ms[ms.length - 1], mm = D.months[k];
    return [`${esc(k)}の仕入れは <b>${yen(mm.total)}</b>。\n` + Object.entries(mm.by).map(([a, v]) => `・${esc(a)} ${yen(v)}`).join('\n'), 'point']; }
  const mt = findMat(s);
  if (mt) return [`「${esc(mt.name)}」は <b>${esc(mt.display)}</b> として扱っています。` + (mt.ppg ? ` ${Math.round(mt.ppg * 1000).toLocaleString()}円/kg(${mt.ok ? '請求書' : '仮'})。` : '') + (mt.allergens.length ? ` アレルゲン:${mt.allergens.map(esc).join('・')}。` : '') + (mt.note ? `\n${esc(mt.note)}` : ''), 'think'];
  if (/確認|待ち|やること/.test(s)) { const n = notices().length; return [n ? `確認待ちは${n}つです。「きょう」の画面にまとめてあります。` : '確認待ちはありません。', 'greet']; }
  if (/ありがと|助か/.test(s)) return ['どういたしまして。', 'heart'];
  return ['すみません、まだ答えられません。\n今聞けるのは:原価、裏表示、アレルゲン、値上がり、先月の仕入れ、材料の名前。\n「〇〇は1個40g」「〇〇は250円」と教えてもらうと覚えます。', 'think'];
}
async function ask(s) { if (!s.trim()) return; addMsg(esc(s), true); qIn.value = ''; const [a, role] = await answer(s); botSay(a, role); }
$('composer').onsubmit = e => { e.preventDefault(); ask(qIn.value); };

// ---------- はじまり ----------
play('walk', true, 2.6); place(); walkLoop();
(async () => {
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
