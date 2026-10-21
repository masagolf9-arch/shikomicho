// ピタット原価 お店の画面(LINEの中でも、パソコンのブラウザでも開ける)
// データは Google の記録の表から読む。見られるのは「メンバー」シートで許可された人だけ。
const LIFF_ID = '2012003912-ltVppjVx';
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxShAkcy1uEzK5ZUGWgW8lzdFBcd8baDNKjHwGKCBx7ocrEUNDHmzrSFdrZDikqL2VO/exec';
const CAMERA_URL = 'https://liff.line.me/' + LIFF_ID;
// 公式ホームページ(Cloudflare)から開いたときは、そちらの蔵とやりとりする。LINEの外ならログインの鍵で入る
const CF = location.hostname !== 'masagolf9-arch.github.io';
const IN_LINE = /\bLine\//i.test(navigator.userAgent);
// 画面の案内文: ホームページでは「撮る」「話す」を案内する(LINEは、お知らせが届く場所)
const CAMTXT = CF ? '「撮る」' : 'LINEの「📷 写真を撮る」', VIA = CF ? '話しかけて' : 'LINEで', SHOT = CF ? '「撮る」で' : 'LINEで';

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
      if (out.error === 'removed') { store.set('data', null); D = null; document.querySelectorAll('section').forEach(s => s.hidden = true); return state('<b>このお店のピタット原価からは外されています。</b><br>心当たりがなければ、店主に聞いてください。' + (CF && !IN_LINE ? '<form method="post" action="/auth/logout" style="margin-top:10px"><button class="btn ghost">ログアウト</button></form>' : '')); }
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
  const out = await api({ kind: 'app_set', product, field, value });
  if (!out.ok) { toast(out.error || 'うまく記録できませんでした', 'ng'); return; }
  D = out.data; renderAll(); toast('覚えました。原価に反映しました。', 'ok'); act('heart', 1.3);
}
function openCamera() {
  if (CF) {
    // ケイタイ: 青い枠のカメラへ(撮ったら、この画面に戻ってキャラが答える)/ パソコン: 写真を選ぶ
    if (matchMedia('(pointer:coarse)').matches) { location.href = (IN_LINE ? '/l/' : '/camera/') + '?back=' + encodeURIComponent(location.pathname); return; }
    webPhoto(); return;
  }
  if (window.liff && liff.isInClient && liff.isInClient()) liff.openWindow({ url: CAMERA_URL, external: false });
  else chat('写真はスマホのLINEで「📷 写真を撮る」から送ってください。', 'point');
}

// ---------- きょう ----------
function notices() {
  const list = [];
  for (const u of D.ups) list.push({ type: 'up', html: `<p><b>${esc(u.item)}が値上がり</b></p><p class="k">${esc(u.supplier)} ${esc(u.spec)} ${u.old.toLocaleString()}円 → ${u.now.toLocaleString()}円(+${u.pct}%)</p><div class="ask"><button class="btn ghost" type="button" data-go-mat="up">材料の値段を見る</button><button class="btn ghost" type="button" data-go-cost>原価を見る</button></div>` });
  const needPw = D.products.filter(p => !p.pw);
  if (needPw.length) list.push({ type: 'q', html: `<p><b>1${U}は何g?(${needPw.length}品)</b></p><p class="k">数えなくても、重さから個数と1個の原価を出します。分かるものだけで大丈夫</p>` +
    needPw.map((p, i) => `<div class="ask"><span style="min-width:6em">${esc(p.name)}</span><input id="pw-${i}" inputmode="decimal" placeholder="例 40" aria-label="${esc(p.name)}の1${U}の重さ"><span class="k">g</span><button class="btn" data-pw="${i}" type="button">決める</button></div>`).join('') });
  const unknown = new Set(); D.products.forEach(p => p.unknown.forEach(n => unknown.add(n)));
  const matNames = D.materials.filter(m => !m.packaging).map(m => m.name);
  [...unknown].forEach((n, i) => list.push({ type: 'q', html: `<p><b>「${esc(n)}」って何の材料ですか?</b></p><p class="k">まだ材料の表にありません。表にある材料と同じなら選んで「同じ」を、新しい材料なら「新しく足す」を押してください</p>
    <div class="ask"><select id="unk-${i}" style="font:inherit;font-size:15px;padding:6px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink);max-width:12em"><option value="">表の材料から選ぶ…</option>${matNames.map(m => `<option>${esc(m)}</option>`).join('')}</select><button class="btn" type="button" data-unk-same="${i}" data-n="${esc(n)}">同じ</button><button class="btn ghost" type="button" data-unk-new="${esc(n)}">新しく足す</button></div>` }));
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
  $('notices').querySelectorAll('[data-go-mat]').forEach(b => b.onclick = () => { matF = b.dataset.goMat; show('mat'); });
  $('notices').querySelectorAll('[data-go-cost]').forEach(b => b.onclick = () => show('cost'));
  $('notices').querySelectorAll('[data-unk-same]').forEach(b => b.onclick = () => { const sel = $('unk-' + b.dataset.unkSame); if (!sel.value) { sel.focus(); chat('表の材料を選んでください'); return; } setValueX({ field: 'mat', name: sel.value, value: { alias: b.dataset.n } }); });
  $('notices').querySelectorAll('[data-unk-new]').forEach(b => b.onclick = () => { show('mat', true); setTimeout(() => matEdit(null, { name: b.dataset.unkNew }), 100); });
  const q = list.length; const bd = $('badge'); bd.textContent = q; bd.hidden = !q;
  const up0 = unpaid(), bb = $('badge-book'); bb.textContent = up0.length; bb.hidden = !up0.length;
  const hm0 = hygMissing().length, bh = $('badge-hyg'); bh.textContent = hm0; bh.hidden = !hm0;
  renderHero(q); renderMenu(q); renderGreet(); renderHomeProds();
  renderA2hs(); renderTodo(list); renderStart(); renderMemos(); renderHomeEvents(); renderBar(); renderCal(); renderReg(); renderCt();
  $('made').innerHTML = D.made.length ? `<ul class="tl">${D.made.map(m => `<li><span class="tt">${new Date(m.t).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}</span><span>${esc(m.text)}</span></li>`).join('')}</ul>`
    : '<p class="k" style="margin:0">まだありません。作った数を話しかけると、ここに出ます</p>';
}

// ホーム画面にアイコンを置く案内(ケイタイだけ・1回だけ)。置けばLINEを通らず直接この画面が開く
let a2hsEvt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); a2hsEvt = e; if (D) renderA2hs(); });
function renderA2hs() {
  const box = $('a2hs'); if (!box) return;
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (standalone || !matchMedia('(pointer:coarse)').matches || store.get('a2hsHide')) { box.hidden = true; return; }
  const ua = navigator.userAgent, ios = /iPhone|iPad|iPod/.test(ua), android = /Android/.test(ua);
  const ext = location.origin + location.pathname.replace(/^\/l\//, '/') + (location.search ? location.search + '&' : '?') + 'openExternalBrowser=1';
  let how;
  if (IN_LINE) how = `<p class="k" style="margin:4px 0 8px">LINEの中からはホーム画面に置けません。下のボタンでいつものブラウザで開いてから、そこで置いてください。</p><a class="btn" id="a2hs-ext" href="${esc(ext)}" style="text-decoration:none">ブラウザで開く</a>`;
  else if (android || ios || a2hsEvt) how = `<p style="margin:10px 0 0"><button class="btn" type="button" id="a2hs-go" style="font-size:17px;padding:12px 22px">ホーム画面に置く</button></p>`;
  else if (ios) how = `<ol class="k" style="margin:4px 0 0;padding-left:1.3em;line-height:1.9"><li>画面の下(または上)の <b>共有ボタン</b>(四角に上向きの矢印)を押す</li><li><b>「ホーム画面に追加」</b>を押す</li><li>右上の<b>「追加」</b>を押す</li></ol>`;
  else how = `<p class="k" style="margin:4px 0 0">ブラウザのメニューから「ホーム画面に追加」を選んでください。</p>`;
  box.hidden = false;
  box.innerHTML = `<div style="display:flex;gap:12px;align-items:flex-start"><img src="icon-192.png" alt="" width="44" height="44" style="border-radius:12px;flex:0 0 44px"><div style="flex:1;min-width:0"><b>ホーム画面にピタット原価を置く</b><p class="k" style="margin:2px 0 0">次からはアイコンを押すだけで、LINEを通らずこの画面が開きます。</p>${how}<p style="margin:8px 0 0"><a href="#" id="a2hs-no" class="k" style="color:var(--accent)">今はいい</a></p></div></div>`;
  const go = $('a2hs-go'); if (go) go.onclick = async () => {
    if (a2hsEvt) { const ev = a2hsEvt; ev.prompt(); const r = await ev.userChoice.catch(() => null); a2hsEvt = null; if (r && r.outcome === 'accepted') { store.set('a2hsHide', 1); box.hidden = true; toast('ホーム画面に置きました', 'ok'); } return; }
    a2hsHelp();
  };
  const ex = $('a2hs-ext'); if (ex && window.liff && liff.isInClient && liff.isInClient()) ex.onclick = e => { e.preventDefault(); liff.openWindow({ url: location.origin + location.pathname, external: true }); };
  $('a2hs-no').onclick = e => { e.preventDefault(); store.set('a2hsHide', 1); box.hidden = true; };
}
// 「ホーム画面に置く」を押したのに、ブラウザが自動で置いてくれないとき: 1つずつ、絵つきで案内する
function a2hsHelp() {
  const ov = document.createElement('div');
  ov.className = 'a2ov';
  const iosSteps = [
    { t: 'まず、もう置いてあるか見てみましょう', b: '携帯のホーム画面(アプリが並んでいる画面)に戻って、「ピタット原価」のアイコンがないか見てください。横にめくった先にあることもあります。' },
    { t: '無かったら: 共有のマークを押します', b: '画面の<b>いちばん下のまん中</b>にある、<b>四角から矢印が上に出ているマーク</b>を押してください。<br><span class="k">見当たらないときは、右下の「…」を押すと「共有」が出てきます。それを押してください。</span>', img: 'a2hs_ios_1.webp?v=2' },
    { t: '「ホーム画面に追加」を押します', b: '出てきた一覧を指で少し上に動かすと<b>「ホーム画面に追加」</b>があります。それを押してください。', img: 'a2hs_ios_2.webp?v=2' },
    { t: '最後に右上の「追加」を押します', b: '右上の<b>「追加」</b>を押します。<br>これで携帯のホーム画面に「ピタット原価」のアイコンができます。', img: 'a2hs_ios_3.webp?v=2' }];
  const pcSteps = [
    { t: 'パソコンにピタット原価を置く', b: '<b>Chrome</b>か<b>Edge</b>で開いているときにできます。アドレス欄(上の、住所が書いてある欄)の右はしにある<b>「インストール」マーク</b>(画面に下向きの矢印)を押して、出てきた確認で<b>「インストール」</b>を押してください。', img: 'a2hs_pc_1.webp?v=2' },
    { t: 'マークが無いとき', b: '右上の <b>︙</b> を押して、<b>「キャスト、保存、共有」</b>→<b>「ページをアプリとしてインストール」</b>を押します。<br><span class="k">Edgeの場合は、右上の「…」→「アプリ」→「このサイトをアプリとしてインストール」です。Macの Safari なら、上のメニューの「ファイル」→「Dockに追加」です。</span>', img: 'a2hs_pc_2.webp?v=2' },
    { t: 'できあがり', b: 'デスクトップやタスクバーに「ピタット原価」のアイコンができます。押すと、ピタット原価だけの画面で開きます。', img: 'a2hs_pc_3.webp?v=2' }];
  const isPc = !matchMedia('(pointer:coarse)').matches;
  const steps = isPc ? pcSteps : /iPhone|iPad|iPod/.test(navigator.userAgent) ? iosSteps : [
    { t: 'まず、もう置いてあるか見てみましょう', b: '前に一度「インストール」を押していれば、もう置いてあります。いったん携帯のホーム画面(アプリが並んでいる画面)に戻って、「ピタット原価」のアイコンがないか見てください。横にめくった先にあることもあります。', pic: '' },
    { t: '無かったら: 点が3つのマークを押します', b: '画面の<b>いちばん下の右はし</b>(携帯によっては<b>いちばん上の右はし</b>)にある <b style="font-size:20px">︙</b> を押してください。', img: 'a2hs_1.webp?v=2' },
    { t: '「ショートカット作成」を押します', b: '出てきた一覧から<b>「ショートカット作成」</b>を押します。<br><span class="k">携帯によっては<b>「ホーム画面に追加」「アプリをインストール」「ページを追加」</b>と書いてあります。どれか1つがあれば、それを押してください。</span>', img: 'a2hs_2.webp?v=2' },
    { t: '最後に「追加」を押します', b: '確認が出たら<b>「追加」</b>(または「OK」「インストール」)を押します。<br>これで携帯のホーム画面に「ピタット原価」のアイコンができます。', img: 'a2hs_3.webp?v=2' }];
  let i = 0;
  const PIC = {
    dots: `<svg viewBox="0 0 240 150" width="240" height="150" aria-hidden="true"><rect x="20" y="6" width="200" height="138" rx="16" fill="#fff" stroke="#c9d3df" stroke-width="3"/><rect x="34" y="18" width="172" height="20" rx="10" fill="#eef2f7"/><circle cx="198" cy="28" r="3" fill="#555"/><circle cx="198" cy="20" r="3" fill="#555"/><circle cx="198" cy="36" r="3" fill="#555"/><rect x="34" y="112" width="172" height="20" rx="6" fill="#eef2f7"/><circle cx="196" cy="114" r="3" fill="#555"/><circle cx="196" cy="122" r="3" fill="#555"/><circle cx="196" cy="130" r="3" fill="#555"/><circle cx="198" cy="28" r="14" fill="none" stroke="#e2531c" stroke-width="4"/><circle cx="196" cy="122" r="14" fill="none" stroke="#e2531c" stroke-width="4"/><text x="120" y="80" font-size="14" text-anchor="middle" fill="#8a94a3">上か下の右はし</text></svg>`,
    menu: `<svg viewBox="0 0 240 150" width="240" height="150" aria-hidden="true"><rect x="60" y="6" width="160" height="138" rx="12" fill="#fff" stroke="#c9d3df" stroke-width="3"/><rect x="74" y="20" width="110" height="10" rx="5" fill="#e3e8ef"/><rect x="74" y="42" width="90" height="10" rx="5" fill="#e3e8ef"/><rect x="68" y="60" width="144" height="28" rx="8" fill="#fff4e8" stroke="#e2531c" stroke-width="3"/><text x="140" y="79" font-size="14" text-anchor="middle" fill="#b23d0f" font-weight="700">ホーム画面に追加</text><rect x="74" y="100" width="100" height="10" rx="5" fill="#e3e8ef"/><rect x="74" y="120" width="80" height="10" rx="5" fill="#e3e8ef"/></svg>`,
    done: `<svg viewBox="0 0 240 150" width="240" height="150" aria-hidden="true"><rect x="70" y="6" width="100" height="138" rx="16" fill="#fff" stroke="#c9d3df" stroke-width="3"/><rect x="86" y="24" width="20" height="20" rx="5" fill="#e3e8ef"/><rect x="110" y="24" width="20" height="20" rx="5" fill="#e3e8ef"/><rect x="134" y="24" width="20" height="20" rx="5" fill="#e3e8ef"/><rect x="86" y="54" width="20" height="20" rx="5" fill="#185fa5"/><rect x="91" y="59" width="10" height="11" fill="none" stroke="#fff" stroke-width="2"/><text x="96" y="88" font-size="7" text-anchor="middle" fill="#333">ピタット原価</text><circle cx="96" cy="64" r="17" fill="none" stroke="#e2531c" stroke-width="3"/></svg>`
  };
  const draw = () => {
    const s0 = steps[i];
    ov.innerHTML = `<div class="a2card" role="dialog" aria-modal="true"><div class="k" style="margin-bottom:6px">${i + 1} / ${steps.length}</div><h3 style="margin:0 0 8px;font-size:20px">${s0.t}</h3>${s0.img ? `<div style="text-align:center;margin:6px 0 10px"><img src="${s0.img}?v=1" alt="" style="max-width:100%;max-height:46vh;border-radius:12px;border:1px solid var(--line)"></div>` : s0.pic ? `<div style="text-align:center;margin:6px 0 10px">${PIC[s0.pic]}</div>` : ''}<p style="margin:0;font-size:16px;line-height:1.8">${s0.b}</p>
      <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">${i < steps.length - 1 ? `<button class="btn" type="button" data-next style="font-size:16px;padding:10px 20px">${i === 0 && !isPc ? '無かった(つぎへ)' : 'つぎへ'}</button>` : ''}${i === 0 && !isPc ? '<button class="btn ghost" type="button" data-have style="font-size:16px;padding:10px 20px">あった</button>' : ''}${i > 0 ? '<button class="btn ghost" type="button" data-back>もどる</button>' : ''}<button class="btn ghost" type="button" data-close>${i === steps.length - 1 ? 'できた' : '閉じる'}</button></div>
      <p class="k" style="margin:12px 0 0">うまくいかないときは、その画面のスクリーンショットを、設定の「問い合わせ」から送ってください。</p></div>`;
    const q = sel => ov.querySelector(sel);
    if (q('[data-next]')) q('[data-next]').onclick = () => { i++; draw(); };
    if (q('[data-back]')) q('[data-back]').onclick = () => { i--; draw(); };
    if (q('[data-have]')) q('[data-have]').onclick = () => { store.set('a2hsHide', 1); ov.remove(); const b = $('a2hs'); if (b) b.hidden = true; toast('もう置いてありました。次からはアイコンから開けます', 'ok'); };
    q('[data-close]').onclick = () => { if (i === steps.length - 1) { store.set('a2hsHide', 1); const b = $('a2hs'); if (b) b.hidden = true; } ov.remove(); };
  };
  ov.onclick = e => { if (e.target === ov) ov.remove(); };
  document.body.appendChild(ov); draw();
}
window.addEventListener('appinstalled', () => { store.set('a2hsHide', 1); const b = $('a2hs'); if (b) b.hidden = true; });
// ---------- ホーム: 今日やること(1本のリスト。期限が近いもの・大事なものが上) ----------
const DAY = 864e5, todayS = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const dayDiff = s => Math.round((new Date(s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) - new Date(new Date().toDateString())) / DAY);
const EVK = { '納品': 'ws', '催事': 'post', '休み': 'hyg', 'その他': 'set' };
function todoItems(q) {
  const t = [], me = profileName || '';
  (D.memos || []).filter(m => !m.seen.includes(me)).slice(0, 3).forEach(m => t.push({ c: 'post', ic: 'memo', b: `伝言: ${m.text}`, k: `${m.by}から`, d: '', star: 3, go: () => $('memos').scrollIntoView({ behavior: 'smooth', block: 'start' }) }));
  if (!noMoney()) unpaid().forEach(p => { const dd = p.due ? dayDiff(p.due) : null; if (dd == null || dd <= 7) t.push({ c: 'book', ic: 'book', b: `${p.supplier}に払う ${yen(p.total)}`, k: `${+p.month.slice(5) || p.month}月分`, d: dd == null ? '期限なし' : dd < 0 ? `${-dd}日すぎ` : dd === 0 ? '今日まで' : dd === 1 ? '明日まで' : md(p.due) + 'まで', due: dd != null && dd <= 1, star: dd != null && dd <= 1 ? 3 : 2, go: () => show('book') }); });
  const regs = noMoney() ? [] : (D.priceChanges || []).filter(x => !x.done); if (regs.length) t.push({ c: 'sales', ic: 'sales', b: `レジの値段を直す ${regs.length}品`, k: regs.slice(0, 3).map(x => `${x.name} ${x.old ? x.old + '→' : ''}${x.now}円`).join('・') + (regs.length > 3 ? ' ほか' : ''), d: regs.some(x => x.at && Date.now() - x.at > DAY) ? '昨日から' : '今日', star: 3, go: () => { $('reg-box').scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
  const hm = hygMissing(); if (hm.length) t.push({ c: 'hyg', ic: 'hyg', b: `今日の衛生記録 あと${hm.length}つ`, k: hm.join('・'), d: '今日', star: new Date().getHours() >= 15 ? 3 : 2, go: () => show('hyg') });
  (D.events || []).filter(e => { const dd = dayDiff(e.date); return dd >= 0 && dd <= 1; }).forEach(e => t.push({ c: EVK[e.kind] || 'set', ic: 'cal', b: `${e.kind === '納品' ? '納品: ' : ''}${e.text}${e.who ? '(' + e.who + ')' : ''}`, k: e.kind, d: dayDiff(e.date) === 0 ? '今日' : '明日', star: 2, go: () => show('cal') }));
  if (q) t.push({ c: 'cam', ic: 'cam', b: `確認待ちに答える ${q}件`, k: '答えると原価と裏表示が確定します', d: '', star: 1, go: () => $('notices').scrollIntoView({ behavior: 'smooth', block: 'start' }) });
  (D.ups || []).slice(-2).forEach(u => t.push({ c: 'mat', ic: 'mat', b: `${u.item}が値上がり(+${u.pct}%)`, k: `${u.supplier} ${u.old.toLocaleString()}円→${u.now.toLocaleString()}円。原価を見直す`, d: '', star: 1, go: () => { matF = 'up'; show('mat'); } }));
  const low = ((D.stock || {}).items || []).filter(x => x.low); if (low.length) t.push({ c: 'stock', ic: 'stock', b: `そろそろ買うもの ${low.length}品`, k: low.slice(0, 4).map(x => x.key).join('・'), d: '', star: 1, go: () => { matF = 'low'; show('mat'); } });
  return t.sort((a, b) => b.star - a.star);
}
function renderTodo(list) {
  const t = todoItems(list.length), box = $('todo');
  box.innerHTML = t.length ? t.map((x, i) => `<div class="tr" role="button" tabindex="0" data-i="${i}" style="--c:var(--c-${x.c})"><span class="ti"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[x.ic]}</svg></span><span class="tb"><b>${esc(x.b)}</b><span class="k">${esc(x.k)}</span></span><span class="td${x.due ? ' due' : ''}">${esc(x.d)}<br><span class="st">${'★'.repeat(x.star)}</span></span></div>`).join('')
    : `<div class="none"><span class="mark">✓</span><span>今日やることは、ぜんぶ済んでいます。</span></div>`;
  box.querySelectorAll('.tr').forEach(el => el.onclick = () => t[el.dataset.i].go());
}
// 上の1行: 今いちばん大事なこと(1つだけ)
function renderBar() {
  const t = todoItems(notices().length).filter(x => x.star >= 2), bar = $('bar');
  if (!t.length || cur === 'today') { bar.hidden = true; return; }
  const x = t[0]; bar.hidden = false; bar.className = 'bar' + (x.due || x.star >= 3 ? ' warn' : '');
  bar.innerHTML = `<i></i><span>${esc(x.b)}${x.k ? ' <small style="opacity:.75">· ' + esc(x.k) + '</small>' : ''}</span><b>${esc(x.d)}${t.length > 1 ? ` · ほか${t.length - 1}件` : ''} ›</b>`;
  bar.onclick = () => x.go();
}
// はじめの5つ(新しいお店。終わると消える)
function renderStart() {
  const si = D.shopInfo || {}, goods = D.products.filter(p => p.kind !== 'part');
  const steps = [
    ['お店の名前と住所を入れる', !!(si.name && si.addr), () => { show('set'); setTimeout(() => { const i = document.querySelector('[data-shop="name"]'); if (i) i.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 200); }, '設定へ'],
    ['レシピの写真を1枚撮る', goods.length > 0, openCamera, '撮る'],
    ['請求書の写真を1枚撮る(材料の値段が本物になる)', (D.materials || []).some(m => m.ok), openCamera, '撮る'],
    ['1個の重さと売値を入れる', goods.some(p => p.pw && p.price), () => show('cost'), '原価へ'],
    ['今日の衛生記録を1回つける', !!(D.hyg && D.hyg.today && D.hyg.today.missing.length < (D.hyg.today.items || []).length) || !!(D.hyg && D.hyg.months && Object.keys(D.hyg.months).length), () => show('hyg'), '衛生へ']];
  const done = steps.filter(x => x[1]).length, box = $('start');
  if (done === steps.length || store.get('startHide') || !(D.me && D.me.owner)) { box.hidden = true; return; }
  box.hidden = false;
  box.innerHTML = `<div class="sh"><b>はじめの5つ</b><span class="k">${done}/${steps.length} 済</span></div><div class="pg"><i style="width:${done / steps.length * 100}%"></i></div><ol>${steps.map((x, i) => `<li class="${x[1] ? 'ok' : ''}" data-i="${i}"><span class="n">${x[1] ? '✓' : i + 1}</span><span>${esc(x[0])}</span>${x[1] ? '' : `<span class="go">${esc(x[3])} ›</span>`}</li>`).join('')}</ol><p class="k" style="margin:8px 0 0">5つ終わると、この箱は消えます。<a href="#" id="start-hide" style="color:var(--accent)">今は隠す</a></p>`;
  box.querySelectorAll('li').forEach(li => li.onclick = () => { const x = steps[li.dataset.i]; if (!x[1]) x[2](); });
  $('start-hide').onclick = e => { e.preventDefault(); store.set('startHide', 1); box.hidden = true; };
}
// 伝言: お店のみんなに残すメモ。「見た」で名前が残り、「済」で消える
function renderMemos() {
  const box = $('memos'), ms = D.memos || [], me = profileName || '';
  box.innerHTML = ms.length ? `<div class="card" style="padding:0">${ms.map(m => `<div class="memo"><div class="mb"><p>${esc(m.text)}</p><span class="k">${esc(m.by)} · ${m.t ? new Date(m.t).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}${m.seen.length ? ' · 見た: ' + m.seen.map(esc).join('、') : ''}</span></div><span class="acts">${m.seen.includes(me) ? '' : `<button class="btn sm" type="button" data-seen="${m.row}">見た</button>`}<button class="btn ghost sm" type="button" data-done="${m.row}">済</button></span></div>`).join('')}</div>`
    : `<div class="card"><p class="k" style="margin:0">伝言はありません。「＋ 書く」で、お店のみんなのホームに出ます。</p></div>`;
  box.querySelectorAll('[data-seen]').forEach(b => b.onclick = () => setValueX({ field: 'memo', value: { row: +b.dataset.seen } }));
  box.querySelectorAll('[data-done]').forEach(b => b.onclick = () => setValueX({ field: 'memo', value: { row: +b.dataset.done, done: true } }));
}
$('memo-add').onclick = () => {
  const box = $('memos'); if ($('memo-form')) { $('memo-form').remove(); return; }
  box.insertAdjacentHTML('afterbegin', `<div class="card" id="memo-form"><textarea id="memo-text" rows="2" placeholder="伝言を書く" style="width:100%;box-sizing:border-box;font:inherit;font-size:15px;padding:8px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink)"></textarea><div class="ask"><button class="btn" type="button" id="memo-go">残す</button><button class="btn ghost" type="button" id="memo-cancel">やめる</button><span class="k">お店のみんなにLINEでも届きます</span></div></div>`);
  $('memo-text').focus();
  $('memo-cancel').onclick = () => $('memo-form').remove();
  $('memo-go').onclick = () => { const v = $('memo-text').value.trim(); if (!v) { $('memo-text').focus(); return; } setValueX({ field: 'memo', value: { text: v } }); };
};
// 予定: ホームにはこれからの5件、予定の画面には月の表と一覧
const evRow = (e, del) => `<li style="--c:var(--c-${EVK[e.kind] || 'set'})"${e.src === 'gcal' ? ' title="Googleカレンダーの予定"' : ''}><span class="ed"><b>${+e.date.slice(8)}</b><small>${+e.date.slice(5, 7)}月 ${['日', '月', '火', '水', '木', '金', '土'][new Date(e.date.slice(0, 4), +e.date.slice(5, 7) - 1, +e.date.slice(8)).getDay()]}</small></span><span class="ek">${esc(e.kind)}</span><span class="et">${esc(e.text)}${e.who ? `<span class="k">${esc(e.who)}</span>` : ''}${e.src === 'gcal' ? '<span class="k">Googleカレンダーから</span>' : e.by ? `<span class="k">${avatar(e.by, true)} ${esc(e.by)}</span>` : ''}${(e.notes || []).length ? `<ul class="notes">${e.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}${del && e.src !== 'gcal' ? `<span class="ask" style="margin-top:6px"><input class="note-in" data-row="${e.row}" placeholder="ひと言" style="flex:1;min-width:0;font-size:13px;padding:5px 8px"><button class="btn ghost sm" type="button" data-note="${e.row}">足す</button></span>` : ''}</span>${del && e.src !== 'gcal' ? `<button class="x" type="button" data-del="${e.row}" aria-label="消す">✕</button>` : ''}</li>`;
function renderHomeEvents() {
  const box = $('home-events'), t = todayS(), evs = (D.events || []).filter(e => e.date >= t).slice(0, 5);
  box.innerHTML = evs.length ? `<ul class="evl">${evs.map(e => evRow(e)).join('')}</ul>` : `<p class="k" style="margin:0">これからの予定はありません。予定の画面で足せます。</p>`;
  box.style.padding = evs.length ? '0' : '';
}
$('ev-more').onclick = () => show('cal');
// レジに入れる値段(ピタット原価で売値を変えた → レジを直して「済」)。値段表の印刷も
function renderReg() {
  const box = $('reg-box'); if (!box) return;
  const all = noMoney() ? [] : (D.priceChanges || []), pend = all.filter(x => !x.done), done = all.filter(x => x.done).slice(-5).reverse();
  box.parentNode.hidden = !all.length;
  if (!all.length) return;
  const row = x => `<div class="regrow${x.done ? ' done' : ''}"><div class="rb"><b>${esc(x.name)}</b>${x.reg && x.reg !== x.name ? ` <span class="k">レジでは「${esc(x.reg)}」</span>` : ''}<span class="k">${x.old ? `${x.old}円 → ` : '新しく '}<b style="color:var(--ink)">${x.now}円</b> · ${x.at ? new Date(x.at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }) : ''}${x.done ? ` · レジ済 ${md(x.done)}${x.by ? ' ' + esc(x.by) : ''}` : ''}</span></div>${x.done ? '' : `<button class="btn sm" type="button" data-regdone="${x.row}">レジに入れた</button>`}</div>`;
  box.innerHTML = `<p class="k" style="margin:0 0 6px">${pend.length ? `ピタット原価で売値を変えた${pend.length}品。レジの値段を直したら「レジに入れた」を押してください。押すまでここに残ります。` : 'レジに入れていない変更はありません。'}</p>
    ${pend.map(row).join('')}${done.length ? `<details style="margin-top:8px"><summary class="k">最近レジに入れたもの(${done.length})</summary>${done.map(row).join('')}</details>` : ''}
    ${pend.length ? `<div class="ask"><button class="btn ghost sm" type="button" id="reg-print">レジ用の値段表を出す</button><span class="k">印刷するか、スマホで見ながらレジに入れます</span></div>` : ''}`;
  box.querySelectorAll('[data-regdone]').forEach(b => b.onclick = () => setValueX({ field: 'regdone', value: +b.dataset.regdone }));
  const pr = $('reg-print'); if (pr) pr.onclick = () => openPrint(`<h2>レジに入れる値段</h2><p class="k">${new Date().toLocaleDateString('ja-JP')} 時点。ピタット原価で売値を変えた商品。</p><table class="pt"><tr><th>レジでの名前</th><th>商品</th><th>前の売値</th><th>新しい売値</th><th>変えた日</th><th>レジに入れた✓</th></tr>${pend.map(x => `<tr><td><b>${esc(x.reg || x.name)}</b></td><td>${esc(x.name)}</td><td>${x.old ? x.old + '円' : '—'}</td><td><b style="font-size:18px">${x.now}円</b></td><td>${x.at ? new Date(x.at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }) : ''}</td><td style="width:60px"></td></tr>`).join('')}</table><p class="k">精算レシートを撮ったとき、レジの値段とピタット原価の売値がちがえば、お知らせします。</p>`);
}
// 日本の祝日(計算で出す。春分・秋分は近い年の表)
const EQX = { 2025: [20, 23], 2026: [20, 23], 2027: [21, 23], 2028: [20, 22], 2029: [20, 23], 2030: [20, 23] };
function jpHolidays(y) {
  const H = {}, ymd = (m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const nthMon = (m, n) => { const d = new Date(y, m - 1, 1), off = (8 - d.getDay()) % 7; return 1 + off + (n - 1) * 7; };
  H[ymd(1, 1)] = '元日'; H[ymd(1, nthMon(1, 2))] = '成人の日'; H[ymd(2, 11)] = '建国記念の日'; H[ymd(2, 23)] = '天皇誕生日';
  H[ymd(3, (EQX[y] || [20, 23])[0])] = '春分の日'; H[ymd(4, 29)] = '昭和の日'; H[ymd(5, 3)] = '憲法記念日'; H[ymd(5, 4)] = 'みどりの日'; H[ymd(5, 5)] = 'こどもの日';
  H[ymd(7, nthMon(7, 3))] = '海の日'; H[ymd(8, 11)] = '山の日'; H[ymd(9, nthMon(9, 3))] = '敬老の日'; H[ymd(9, (EQX[y] || [20, 23])[1])] = '秋分の日';
  H[ymd(10, nthMon(10, 2))] = 'スポーツの日'; H[ymd(11, 3)] = '文化の日'; H[ymd(11, 23)] = '勤労感謝の日';
  // 振替休日: 日曜の祝日の次の平日 / 国民の休日: 祝日にはさまれた平日
  const dt = k => new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8)), key = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  Object.keys(H).forEach(k => { const d = dt(k); if (d.getDay() === 0) { let n = new Date(d.getTime() + DAY); while (H[key(n)]) n = new Date(n.getTime() + DAY); H[key(n)] = '振替休日'; } });
  Object.keys(H).forEach(k => { const d = dt(k), n2 = new Date(d.getTime() + 2 * DAY), mid = new Date(d.getTime() + DAY); if (H[key(n2)] && !H[key(mid)] && mid.getDay() !== 0) H[key(mid)] = '国民の休日'; });
  return H;
}
let calYM = null;
function renderCal() {
  const box = $('cal'); if (!box) return;
  const now = new Date(), ym = calYM || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`, y = +ym.slice(0, 4), m = +ym.slice(5) - 1;
  const first = new Date(y, m, 1), start = new Date(y, m, 1 - first.getDay()), closed = (D.shopInfo || {}).closed || '', WD = ['日', '月', '火', '水', '木', '金', '土'], t = todayS();
  const byDay = {}; (D.events || []).forEach(e => (byDay[e.date] = byDay[e.date] || []).push(e));
  const HOL = Object.assign({}, jpHolidays(y - 1), jpHolidays(y), jpHolidays(y + 1));
  const cells = []; for (let i = 0; i < 42; i++) { const d = new Date(start.getTime() + i * DAY); if (i >= 35 && d.getMonth() !== m) break;
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, evs = byDay[ds] || [], wd = d.getDay();
    cells.push(`<div class="d${d.getMonth() !== m ? ' out' : ''}${ds === t ? ' today' : ''}${closed.includes(WD[wd]) ? ' closed' : ''}${HOL[ds] ? ' hol' : ''}${wd === 0 ? ' sun' : wd === 6 ? ' sat' : ''}" data-d="${ds}"${HOL[ds] ? ` title="${esc(HOL[ds])}"` : ''}><span class="dn">${d.getDate()}</span>${HOL[ds] ? `<span class="hn">${esc(HOL[ds])}</span>` : ''}${evs.slice(0, 2).map(e => `<span class="ev${e.src === 'gcal' ? ' g' : ''}" style="--c:var(--c-${EVK[e.kind] || 'set'})">${e.by && e.src !== 'gcal' ? `<i class="who" style="background:${avColor(e.by)}"></i>` : ''}${esc(e.text)}</span>`).join('')}${evs.length > 2 ? `<span class="k">+${evs.length - 2}</span>` : ''}</div>`); }
  const list = (D.events || []).filter(e => e.date.slice(0, 7) === ym);
  box.innerHTML = `<div class="cal-h"><b>${y}年${m + 1}月</b><span class="seg"><button type="button" id="cal-prev" aria-label="前の月">‹</button><button type="button" id="cal-today">今月</button><button type="button" id="cal-next" aria-label="次の月">›</button></span></div>
    <div class="calg">${WD.map((w, i) => `<div class="wd${i === 0 ? ' sun' : i === 6 ? ' sat' : ''}">${w}</div>`).join('')}${cells.join('')}</div>
    <p class="k" style="margin:8px 0 0">うすい赤の日は定休日(設定で変えられます)、赤い日付は日曜と祝日。日を押すと、その日の予定を足せます。点線はGoogleカレンダーの予定。${(() => { const who = [...new Set((D.events || []).filter(e => e.by && e.src !== 'gcal').map(e => e.by))]; return who.length ? '丸の色は入れた人: ' + who.map(w => `<i class="who" style="background:${avColor(w)};display:inline-block;width:8px;height:8px;border-radius:50%;margin:0 3px 0 6px"></i>${esc(w)}`).join('') : ''; })()} 当日の朝8時に、今日の予定をLINEでお知らせします。</p>
    <h1 class="sub">${m + 1}月の予定</h1><div class="card" style="padding:0">${list.length ? `<ul class="evl">${list.map(e => evRow(e, true)).join('')}</ul>` : '<p class="k" style="margin:0;padding:14px">この月の予定はまだありません。</p>'}</div>` + gcalBox();
  const mv = n => { const d = new Date(y, m + n, 1); calYM = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; renderCal(); };
  $('cal-prev').onclick = () => mv(-1); $('cal-next').onclick = () => mv(1); $('cal-today').onclick = () => { calYM = null; renderCal(); };
  box.querySelectorAll('.d').forEach(el => el.onclick = () => evForm(el.dataset.d));
  bindGcal(box);
  box.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { if (confirmOnce('ev' + b.dataset.del, 'もう一度押すと、この予定を消します')) setValueX({ field: 'event', value: { row: +b.dataset.del, del: true } }); });
  box.querySelectorAll('[data-note]').forEach(b => b.onclick = () => { const i = box.querySelector(`.note-in[data-row="${b.dataset.note}"]`), v = i.value.trim(); if (!v) { i.focus(); return; } setValueX({ field: 'event', value: { row: +b.dataset.note, note: v } }); });
  box.querySelectorAll('.note-in').forEach(i => i.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); box.querySelector(`[data-note="${i.dataset.row}"]`).click(); } });
}
function evForm(date) {
  const f = $('ev-form'); f.hidden = false;
  const tos = Object.keys(Object.assign({}, ...Object.values(D.ws || {}))).filter(Boolean);
  f.innerHTML = `<div class="fld"><span class="k">日付</span><input id="ev-date" type="date" value="${esc(date || todayS())}"><span class="k">種類</span><div class="seg" id="ev-kind">${['納品', '催事', '休み', 'その他'].map((k, i) => `<button type="button" data-v="${k}" aria-pressed="${i === 0}">${k}</button>`).join('')}</div><span class="k">内容</span><input id="ev-text" placeholder="内容"><span class="k">相手・誰</span><input id="ev-who" list="ev-tos" placeholder="なくてもOK"><datalist id="ev-tos">${tos.map(x => `<option value="${esc(x)}">`).join('')}</datalist></div><div class="ask"><button class="btn" type="button" id="ev-go">予定に入れる</button><button class="btn ghost" type="button" id="ev-cancel">やめる</button></div>`;
  f.scrollIntoView({ behavior: 'smooth', block: 'start' });
  $('ev-kind').querySelectorAll('button').forEach(b => b.onclick = () => $('ev-kind').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)));
  $('ev-cancel').onclick = () => { f.hidden = true; };
  $('ev-go').onclick = () => { const kind = $('ev-kind').querySelector('[aria-pressed="true"]').dataset.v, text = $('ev-text').value.trim(); if (!text && kind !== '休み') { $('ev-text').focus(); return; } setValueX({ field: 'event', value: { date: $('ev-date').value, kind, text: text || kind, who: $('ev-who').value.trim() } }); f.hidden = true; };
}
$('ev-add-top').onclick = () => evForm();
// Googleカレンダーとつなぐ(購読の仕組み。入れるのは1か所でいい)
function gcalBox() {
  const c = D.cal || {}; if (!D.me || !D.me.owner) return c.gcal ? '<p class="k" style="margin:10px 0 0">Googleカレンダーの予定も、この表に出ています(店主の設定)。</p>' : '';
  return `<h1 class="sub">Googleカレンダーとつなぐ <span class="k" style="font-weight:400;font-size:13px">(お店が選べます。つながなくても使えます)</span></h1>
  <div class="card"><p style="margin:0 0 4px"><b>① ピタット原価の予定を、スマホのGoogleカレンダーにも出す</b></p><p class="k" style="margin:0 0 8px">ピタット原価に入れた納品・催事・休みが、自動でGoogleカレンダーに出ます(数時間遅れることがあります)。</p>
    <div class="ask" style="margin-top:0"><input id="cal-feed" readonly value="${esc(c.feed || '')}" style="flex:1;min-width:0;font-size:13px"><button class="btn ghost sm" type="button" id="cal-copy">コピー</button></div>
    <details style="margin-top:6px"><summary class="k">Googleカレンダーでの入れ方</summary><ol class="k" style="margin:6px 0 0;padding-left:1.4em;line-height:1.8"><li>パソコンで Googleカレンダー を開く</li><li>左の「他のカレンダー」の「＋」→「URLで追加」</li><li>上の住所を貼って「カレンダーを追加」</li><li>スマホのGoogleカレンダーの設定で、そのカレンダーの表示をオンにする</li></ol><p class="k" style="margin:6px 0 0">この住所は合言葉つきです。お店の人以外には教えないでください。</p></details>
    <hr style="border:0;border-top:1px solid var(--line-2);margin:14px 0">
    <p style="margin:0 0 4px"><b>② Googleカレンダーの予定を、ピタット原価にも出す</b></p><p class="k" style="margin:0 0 8px">Googleカレンダーの設定 › そのカレンダー › 「iCal形式の秘密のアドレス」をコピーして、ここに貼ります。Googleに入れた予定がピタット原価の予定と「今日やること」に出ます(見るだけ。消す・直すはGoogle側で)。</p>
    <div class="ask" style="margin-top:0"><input id="gcal-url" placeholder="https://calendar.google.com/calendar/ical/…/basic.ics" value="${esc(c.gcal || '')}" style="flex:1;min-width:0;font-size:13px"><button class="btn sm" type="button" id="gcal-save">${c.gcal ? '貼り直す' : 'つなぐ'}</button>${c.gcal ? '<button class="btn ghost sm" type="button" id="gcal-off">外す</button>' : ''}</div>
    ${c.gcal ? '<p class="k" style="margin:6px 0 0">つながっています。Googleの予定は1時間ごとに読み直します。</p>' : ''}</div>`;
}
function bindGcal(root) {
  const cp = root.querySelector('#cal-copy'); if (cp) cp.onclick = async () => { try { await navigator.clipboard.writeText($('cal-feed').value); toast('住所をコピーしました', 'ok'); } catch (e) { $('cal-feed').select(); } };
  const sv = root.querySelector('#gcal-save'); if (sv) sv.onclick = () => { const v = $('gcal-url').value.trim(); if (!v) { $('gcal-url').focus(); return; } setValueX({ field: 'gcal', value: v }); };
  const off = root.querySelector('#gcal-off'); if (off) off.onclick = () => setValueX({ field: 'gcal', value: '' });
}
// 連絡先(業者・卸先の電話と担当)
const contactOf = n => (D.contacts || []).find(c => c.name === n || (n && (n.includes(c.name) || c.name.includes(n))));
const bankOf = n => { const c = contactOf(n); return c && (c.bank || c.number) ? [c.bank, c.branch, c.type, c.number, c.holder].filter(Boolean).join(' ') : ''; };
const callBtn = n => { const c = contactOf(n); return c && c.tel ? `<a class="btn ghost sm call" href="tel:${esc(c.tel.replace(/[^\d+]/g, ''))}" title="${esc(c.person ? '担当 ' + c.person : '')}">☎ 電話</a>` : ''; };
const telLink = n => { const c = contactOf(n); return c && c.tel ? ` <a href="tel:${esc(c.tel.replace(/[^\\d+]/g, ''))}" style="color:var(--accent);text-decoration:none;font-weight:600;white-space:nowrap" title="${esc(c.person ? '担当 ' + c.person : '')}">☎ ${esc(c.tel)}</a>` : ''; };
// 業者・卸先の一覧(メニューの「業者・卸先」)
function renderCt() { const b = $('ct-box'); if (!b) return; b.innerHTML = contactsBox(); bindContacts(b); }
function contactsBox() {
  const cs = D.contacts || [], sup = Object.keys(Object.assign({}, ...Object.values(D.months || {}).map(m => m.by))), tos = Object.keys(Object.assign({}, ...Object.values(D.ws || {})));
  const cand = [...new Set(sup.concat(tos))].filter(n => !cs.find(c => c.name === n));
  return `${cs.length ? '' : '<p class="k" style="margin:0 0 6px">まだありません。請求書を撮ると業者が自動で入ります。下から手で足すこともできます</p>'}
    ${cs.map(c => `<div class="contact-row"><b>${esc(c.name)}</b><span class="k">${esc(c.kind)}</span><span class="tel">${c.tel ? `<a href="tel:${esc(c.tel.replace(/[^\\d+]/g, ''))}">☎ ${esc(c.tel)}</a>` : '<span class="k">電話なし</span>'}</span><span class="k">${esc(c.person)}</span><button class="btn ghost sm" type="button" data-ct-edit="${esc(c.name)}">直す</button>${c.addr ? `<div class="k" style="grid-column:1/-1;margin-top:-4px">住所: ${esc(c.addr)}</div>` : ''}${c.bank || c.number ? `<div class="k" style="grid-column:1/-1;margin-top:-4px">振込先: ${esc([c.bank, c.branch, c.type, c.number, c.holder].filter(Boolean).join(' '))}</div>` : ''}</div>`).join('')}
    ${cs.length ? '<div class="ask"><button class="btn ghost" type="button" id="ct-add">＋ 業者・卸先を足す</button></div>' : ''}<div id="ct-form" style="margin-top:10px"${cs.length ? ' hidden' : ''}><div class="fld"><span class="k">名前</span><input id="ct-name" list="ct-cand" placeholder="業者・卸先の名前"><datalist id="ct-cand">${cand.map(n => `<option value="${esc(n)}">`).join('')}</datalist><span class="k">種類</span><div class="seg" id="ct-kind">${['業者', '卸先', 'その他'].map((k, i) => `<button type="button" data-v="${k}" aria-pressed="${i === 0}">${k}</button>`).join('')}</div><span class="k">電話</span><input id="ct-tel" inputmode="tel" placeholder="電話番号"><span class="k">担当</span><input id="ct-person" placeholder="担当者"><span class="k">住所</span><input id="ct-addr" placeholder="住所"><span class="k">振込先</span><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px"><input id="ct-bank" placeholder="銀行"><input id="ct-branch" placeholder="支店"><select id="ct-type" class="sel"><option value="">種別</option><option>普通</option><option>当座</option></select><input id="ct-number" inputmode="numeric" placeholder="口座番号"><input id="ct-holder" placeholder="名義(カナ)" style="grid-column:1/-1"></div></div><p class="k" style="margin:4px 0 0">請求書を撮ると、電話・担当・住所・振込先は自動で入ります(読めなかったところだけ空のまま)</p><div class="ask"><button class="btn" type="button" id="ct-save">連絡先を保存</button><button class="btn ghost" type="button" id="ct-del" hidden>消す</button></div></div>`;
}
function bindContacts(root) {
  const kindSel = k => root.querySelectorAll('#ct-kind button').forEach(x => x.setAttribute('aria-pressed', x.dataset.v === k));
  root.querySelectorAll('#ct-kind button').forEach(b => b.onclick = () => kindSel(b.dataset.v));
  const open = () => { const f = root.querySelector('#ct-form'); f.hidden = false; const a = root.querySelector('#ct-add'); if (a) a.hidden = true; f.scrollIntoView({ block: 'center', behavior: 'smooth' }); };
  const ad = root.querySelector('#ct-add'); if (ad) ad.onclick = () => { open(); $('ct-name').focus(); };
  root.querySelectorAll('[data-ct-edit]').forEach(b => b.onclick = () => { open(); const c = (D.contacts || []).find(x => x.name === b.dataset.ctEdit); if (!c) return; $('ct-name').value = c.name; $('ct-tel').value = c.tel; $('ct-person').value = c.person; $('ct-addr').value = c.addr || ''; $('ct-bank').value = c.bank || ''; $('ct-branch').value = c.branch || ''; $('ct-type').value = c.type || ''; $('ct-number').value = c.number || ''; $('ct-holder').value = c.holder || ''; kindSel(c.kind); $('ct-del').hidden = false; $('ct-name').scrollIntoView({ block: 'center', behavior: 'smooth' }); });
  $('ct-save').onclick = () => { const name = $('ct-name').value.trim(); if (!name) { $('ct-name').focus(); return; } setValueX({ field: 'contact', value: { name, kind: root.querySelector('#ct-kind [aria-pressed="true"]').dataset.v, tel: $('ct-tel').value.trim(), person: $('ct-person').value.trim(), addr: $('ct-addr').value.trim(), bank: $('ct-bank').value.trim(), branch: $('ct-branch').value.trim(), type: $('ct-type').value, number: $('ct-number').value.trim(), holder: $('ct-holder').value.trim() } }); };
  $('ct-del').onclick = () => { const name = $('ct-name').value.trim(); if (name && confirmOnce('ct' + name, 'もう一度押すと、この連絡先を消します')) setValueX({ field: 'contact', value: { name, del: true } }); };
}
// ---------- メンバー(店主だけ): 役割・お金を見せる/見せない・外す ----------
const MONEY_TABS = ['cost', 'book', 'sales'];
const noMoney = () => !!(D && D.hideMoney);
async function renderMembers() {
  const box = $('members-box'); if (!box) return;
  if (!D.me || !D.me.owner) { box.parentNode.hidden = true; return; }
  box.parentNode.hidden = false;
  box.innerHTML = '<p class="k" style="margin:0">読んでいます…</p>';
  const r = await api({ kind: 'app_members' }).catch(() => null); if (!r || !r.ok) { box.innerHTML = `<p class="k" style="margin:0">${esc((r && r.error) || '読めませんでした')}</p>`; return; }
  drawMembers(r.members, r.plan, r.count);
}
function drawMembers(ms, plan, count) {
  const box = $('members-box'), live = ms.filter(m => m.role !== '外した'), gone = ms.filter(m => m.role === '外した');
  const idle = m => { if (!m.last) return ''; const d = Math.round((Date.now() - new Date(m.last)) / DAY); return d >= 90 ? `<span style="color:var(--warn);font-weight:700">${Math.floor(d / 30)}か月使っていません</span>` : d >= 1 ? `${d}日前` : '今日'; };
  box.innerHTML = `<p style="margin:0 0 4px"><b>${esc((plan || {}).name || '')}プラン</b> <span class="k">${plan && plan.limit ? `${plan.limit}人まで(今 ${count}人)` : '人数の上限なし'}${plan && plan.limit && count >= plan.limit ? ' · <span style="color:var(--warn)">いっぱいです。だれかを外すか、プランを上げてください</span>' : ''}</span></p><p class="k" style="margin:0 0 6px">${live.filter(m => m.allowed).length}人が使えます。スタッフには原価・帳簿・売上を見せない決まりです(「お金」を入にすると見せます)。辞めた人は「外す」で、その場で入れなくなります(その人が入れた記録は残ります)。</p>
    <div class="mem-list">${live.map(m => `<div class="mem"${m.allowed ? '' : ' style="opacity:.75"'}>${avatar(m.name, true)}<div class="mb"><b>${esc(m.name)}</b> <span class="pill ${m.role === '店主' ? '' : 'gray'}">${esc(m.role)}</span>${m.allowed ? '' : ' <span class="pill warn">許可待ち</span>'}<span class="k">${m.line ? 'LINE' : 'メール'} · 最後に使った日 ${idle(m) || '—'}</span></div>
      <div class="macts">${m.allowed ? (m.role === '店主' ? '<span class="k">お金 ○</span>' : `<label class="sw"><input type="checkbox" data-money="${m.row}"${m.money ? ' checked' : ''}><span></span>お金</label><button class="btn ghost sm" type="button" data-remove="${m.row}" data-n="${esc(m.name)}">外す</button>`) : `<button class="btn sm" type="button" data-allow="${m.row}">許可</button><button class="btn ghost sm" type="button" data-remove="${m.row}" data-n="${esc(m.name)}">断る</button>`}</div></div>`).join('')}</div>
    ${gone.length ? `<details style="margin-top:8px"><summary class="k">外した人(${gone.length})</summary>${gone.map(m => `<div class="mem" style="opacity:.6">${avatar(m.name, true)}<div class="mb"><b>${esc(m.name)}</b><span class="k">外した</span></div><div class="macts"><button class="btn ghost sm" type="button" data-allow="${m.row}">戻す</button></div></div>`).join('')}</details>` : ''}
    <p class="k" style="margin:8px 0 0">新しい人を入れるには、上の「スタッフを招待するリンク」を送ってください。3か月使っていない人がいると、店主のLINEに「外しますか?」が届きます。</p>`;
  const act = async (row, action, value) => { const r = await api({ kind: 'app_set', field: 'member', value: { row, action, value } }).catch(() => null); if (!r || !r.ok) { chat((r && r.error) || 'できませんでした'); return; } drawMembers(r.members, r.plan, r.count); toast('メンバーを更新しました', 'ok'); };
  box.querySelectorAll('[data-money]').forEach(i => i.onchange = () => act(+i.dataset.money, 'money', i.checked));
  box.querySelectorAll('[data-allow]').forEach(b => b.onclick = () => act(+b.dataset.allow, 'allow'));
  box.querySelectorAll('[data-remove]').forEach(b => b.onclick = () => { if (confirmOnce('mem' + b.dataset.remove, `もう一度押すと、${b.dataset.n}さんを外します(その場で入れなくなります)`)) act(+b.dataset.remove, 'remove'); });
}
// パンくず(パソコン): ホーム › 原価 › 栗万十
const TABNAME = { today: 'ホーム', cost: '原価', label: '裏表示', mat: '材料', book: '帳簿', hyg: '衛生記録', ws: '卸', ct: '業者・卸先', post: '発信', sales: '売上', set: '設定', cal: '予定' };
function setCrumb(parts) {
  const c = $('crumb'); if (!c) return;
  if (cur === 'today' && !parts) { c.hidden = true; return; }
  const all = [['ホーム', 'today'], [TABNAME[cur] || cur, cur]].concat((parts || []).map(x => [x, null]));
  c.hidden = false;
  c.innerHTML = all.map((x, i) => i === all.length - 1 ? `<b>${esc(x[0])}</b>` : `<a data-t="${x[1] || ''}">${esc(x[0])}</a><span class="sep">›</span>`).join('');
  c.querySelectorAll('a[data-t]').forEach(a => a.onclick = () => { if (a.dataset.t) show(a.dataset.t); else show(cur); });
}
// ---------- ホーム: あいさつ・商品の並び ----------
const AVC = ['cost', 'label', 'mat', 'stock', 'hyg', 'book', 'ws', 'post', 'sales', 'cam'];
const avColor = n => { let h = 0; for (const ch of String(n)) h = (h * 31 + ch.charCodeAt(0)) | 0; return 'var(--c-' + AVC[Math.abs(h) % AVC.length] + ')'; };
const avatar = (n, small) => `<span class="av${small ? ' s' : ''}" style="--c:${avColor(n)}" aria-hidden="true">${esc(String(n).trim().slice(0, 1))}</span>`;
function renderGreet() {
  const h = new Date().getHours(), g = h < 10 ? 'おはようございます' : h < 17 ? 'こんにちは' : 'こんばんは';
  $('greet-h').textContent = `${g}${profileName ? '、' + profileName + 'さん' : ''}`;
  $('greet-p').textContent = `${D.shop} · ${$('date').textContent}`;
}
function renderHomeProds() {
  const box = $('home-prods'), goods = D.products.filter(p => p.kind !== 'part'), ps = goods.slice(0, 8);
  $('prods-h').hidden = !D.products.length; box.hidden = !D.products.length;
  box.innerHTML = ps.map(p => { const r = p.price && p.per_piece != null ? Math.round(p.per_piece / p.price * 100) : null;
    return `<div class="pc" role="button" tabindex="0" data-p="${esc(p.name)}">${avatar(p.name)}<div class="nm">${esc(p.name)}</div><div class="pr">${noMoney() ? '' : p.per_piece != null ? yen1(p.per_piece) : '<span class="k">重さ待ち</span>'}${p.per_piece != null ? `<small>/ 1${U}</small>` : ''}</div><div class="k">${noMoney() ? '' : r != null ? `原価率 ${r}%` : p.price ? '' : '売価は未設定'}${!noMoney() && p.sure < 100 ? ` · 確定 ${p.sure}%` : ''}</div></div>`; }).join('') +
    (goods.length > 8 ? `<div class="pc" role="button" tabindex="0" data-more style="justify-content:center;align-items:center;color:var(--accent);font-weight:700">ほか ${goods.length - 8}品 ›</div>` : '');
  box.querySelectorAll('[data-p]').forEach(el => el.onclick = () => { open.add(el.dataset.p); show('cost'); setTimeout(() => { const c = document.querySelector(`.prod[data-name="${CSS.escape(el.dataset.p)}"]`); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 150); });
  box.querySelectorAll('[data-more]').forEach(el => el.onclick = () => show('cost'));
}
// ホームと上の帯の「話す」欄: 入れた言葉を、会話の窓に送る
['askbar-home', 'askbar-top'].forEach(id => { const f = $(id); if (!f) return; f.onsubmit = e => { e.preventDefault(); const inp = f.querySelector('input'), v = inp.value.trim(); inp.value = ''; openAsk(); if (v) ask(v); }; });

// ---------- 小さなグラフ(SVGで描く。色は機能の色1つ、濃さで量) ----------
const fmtK = v => v >= 10000 ? (Math.round(v / 1000) / 10).toLocaleString('ja-JP') + '万' : Math.round(v).toLocaleString('ja-JP');
// 縦の棒: data=[{l:ラベル, v:値, sub?:小さな注}] 。いちばん大きい棒だけ値を出し、ほかはかざすと出る
function barsV(data, color, opt = {}) {
  if (!data.length) return '';
  const W = opt.w || 600, H = opt.h || 160, padB = 26, padT = 18, max = Math.max(...data.map(d => d.v), 1), n = data.length, gap = 6, bw = Math.min(72, Math.max(6, (W - gap * (n - 1)) / n)), x0 = (W - (bw * n + gap * (n - 1))) / 2;
  const top = data.reduce((m, d, i) => d.v > data[m].v ? i : m, 0);
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opt.label || '')}">
    <line x1="0" y1="${H - padB + .5}" x2="${W}" y2="${H - padB + .5}" class="ax"/>
    ${data.map((d, i) => { const h = Math.max(d.v > 0 ? 3 : 0, (H - padB - padT) * d.v / max), x = x0 + i * (bw + gap), y = H - padB - h;
      return `<g class="bar" style="--c:${color}"><title>${esc(d.l)}: ${Math.round(d.v).toLocaleString('ja-JP')}円${d.sub ? ' ' + esc(d.sub) : ''}</title><rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="3"/><rect x="${x}" y="${padT}" width="${bw}" height="${H - padB - padT}" fill="transparent"/>
        ${i === top && d.v > 0 ? `<text x="${x + bw / 2}" y="${y - 5}" class="val" text-anchor="middle">${fmtK(d.v)}</text>` : ''}
        ${(n <= 12 || i % Math.ceil(n / 10) === 0) ? `<text x="${x + bw / 2}" y="${H - 8}" class="lbl" text-anchor="middle">${esc(d.l)}</text>` : ''}</g>`; }).join('')}</svg>`;
}
// 横の棒: 項目ごとの大きさ(内訳)。値は右に直書き
function barsH(data, color, opt = {}) {
  if (!data.length) return '';
  const max = Math.max(...data.map(d => d.v), 1), unit = opt.unit || '円';
  return `<div class="hbars" style="--c:${color}">${data.map(d => `<div class="hb"><span class="hl">${esc(d.l)}</span><span class="ht"><i style="width:${Math.max(1, d.v / max * 100)}%"></i></span><span class="hv">${Math.round(d.v).toLocaleString('ja-JP')}${unit}${d.pct != null ? ` <small>${d.pct}%</small>` : ''}</span></div>`).join('')}</div>`;
}
// 輪のグラフ(円グラフ): 内訳。5つまでにして、残りは「ほか」。色は同じ系統の濃さちがい
function donut(data, color, opt = {}) {
  const tot = data.reduce((a, d) => a + d.v, 0); if (!tot) return '';
  const top = data.slice().sort((a, b) => b.v - a.v), main = top.slice(0, 5), rest = top.slice(5).reduce((a, d) => a + d.v, 0);
  if (rest) main.push({ l: 'ほか', v: rest });
  const shades = [1, .78, .58, .42, .3, .2]; let acc = 0; const R = 42, C = 2 * Math.PI * R;
  return `<div class="dn"><svg viewBox="0 0 120 120" role="img" aria-label="${esc(opt.label || '')}">${main.map((d, i) => { const f = d.v / tot, off = acc; acc += f;
      return `<circle cx="60" cy="60" r="${R}" fill="none" stroke="${color}" stroke-opacity="${shades[i]}" stroke-width="16" stroke-dasharray="${Math.max(0, f * C - 2)} ${C}" stroke-dashoffset="${-off * C}" transform="rotate(-90 60 60)"><title>${esc(d.l)} ${Math.round(f * 100)}%</title></circle>`; }).join('')}
    <text x="60" y="56" text-anchor="middle" class="dv">${fmtK(tot)}</text><text x="60" y="72" text-anchor="middle" class="dl">${esc(opt.center || '合計')}</text></svg>
    <ul class="dlg">${main.map((d, i) => `<li><i style="background:${color};opacity:${shades[i]}"></i><span>${esc(d.l)}</span><b>${Math.round(d.v / tot * 100)}%</b><span class="k">${Math.round(d.v).toLocaleString('ja-JP')}円</span></li>`).join('')}</ul></div>`;
}
// 数字の札の並び
const tiles = arr => `<div class="tiles">${arr.map(t => `<div class="tile"${t.c ? ` style="--c:var(--c-${t.c})"` : ''}><span class="tt">${esc(t.t)}</span><span class="tv">${t.v}</span>${t.k ? `<span class="k">${t.k}</span>` : ''}</div>`).join('')}</div>`;

// ---------- 帳簿(支払い・仕分け・仕訳) ----------
const unpaid = () => (D.pays || []).filter(p => p.status === '未払い').sort((a, b) => (a.due || '9') < (b.due || '9') ? -1 : 1);
// ---------- きょう: 横にめくるカード ----------
const md = d => esc(d.slice(5).replace('-', '/'));
function renderHero(q) {
  const cards = [], up = unpaid(), low = ((D.stock || {}).items || []).filter(x => x.low);
  if (up.length) { const sum = up.reduce((a, p) => a + p.total, 0), n = up[0];
    cards.push({ cls: 'main', t: '払っていないもの', v: `${Math.round(sum).toLocaleString('ja-JP')}<small>円</small>`, k: `${up.length}件${n.due ? ' · 次の期限 ' + md(n.due) + ' ' + esc(n.supplier) : ''}`, go: () => show('book') }); }
  else cards.push({ cls: 'main', t: '払っていないもの', v: '0<small>円</small>', k: 'ぜんぶ払い済みです', go: () => show('book') });
  const ms = Object.keys(D.months || {}).sort(), lm = ms[ms.length - 1];
  const sm = Object.keys(D.sales || {}).sort().pop();
  if (sm) { const o = D.sales[sm]; cards.push({ cls: '', c: 'sales', t: `${+sm.slice(5)}月の売上`, v: `${Math.round(o.total).toLocaleString('ja-JP')}<small>円</small>`, k: `${o.nDays}日分 · 1日平均 ${yen(o.total / Math.max(1, o.nDays))}`, go: () => show('sales') }); }
  const wm = Object.keys(D.ws || {}).sort().pop();
  if (wm) { const w = D.ws[wm], tot = Object.values(w).reduce((a, x) => a + x.total, 0); cards.push({ cls: '', c: 'ws', t: `${+wm.slice(5)}月の卸(税抜)`, v: `${Math.round(tot).toLocaleString('ja-JP')}<small>円</small>`, k: Object.keys(w).map(esc).join('・'), go: () => show('ws') }); }
  if (lm) { const by = D.months[lm].by, top = Object.keys(by).sort((a, b) => by[b] - by[a]).slice(0, 2);
    cards.push({ cls: '', c: 'book', t: `${+lm.slice(5) || lm}月の仕入れ`, v: `${Math.round(D.months[lm].total).toLocaleString('ja-JP')}<small>円</small>`, k: top.map(esc).join('・'), go: () => show('book') }); }
  const h = $('hero');
  h.previousElementSibling.hidden = noMoney();
  if (noMoney()) { h.innerHTML = ''; $('hero-dots').innerHTML = ''; return; }
  h.innerHTML = cards.map((c, i) => `<div class="hc ${c.cls}" role="button" tabindex="0" data-i="${i}"${c.c ? ` style="--c:var(--c-${c.c})"` : ''}><div class="t">${c.t}</div><div class="v">${c.v}</div><div class="k">${c.k}</div><div class="go">くわしく ›</div></div>`).join('');
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
  ct: '<rect x="4" y="3" width="15" height="18" rx="2"/><circle cx="11.5" cy="10" r="2.6"/><path d="M7.5 17c.6-2.2 2.2-3.3 4-3.3s3.4 1.1 4 3.3M19 7h1.5M19 11h1.5M19 15h1.5"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><path d="M8 13h3M8 16.5h3M13.5 13h2.5"/>',
  memo: '<path d="M4 5.5h16v10H9l-4 3.5z"/><path d="M8 9h8M8 12h5"/>',
  set: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>'
};
function renderMenu(q) {
  const low = ((D.stock || {}).items || []).filter(x => x.low).length, up = unpaid().length;
  const items = [
    ['cam', '撮る', openCamera, 0, 'p'], ['cost', '原価', () => show('cost')], ['label', sellFace() ? 'アレルゲン' : '裏表示', () => show('label')], ['mat', '材料', () => { matF = 'all'; show('mat'); }],
    ['stock', '在庫', () => { matF = 'low'; show('mat'); }, low], ['hyg', '衛生', () => show('hyg'), hygMissing().length, hygMissing().length], ['book', '帳簿', () => show('book'), up], ['ws', '卸', () => show('ws')], ['ct', '業者・卸先', () => show('ct')], ['post', '発信', () => show('post')], ['sales', '売上', () => show('sales')], ['cal', '予定', () => show('cal'), (D.events || []).filter(e => dayDiff(e.date) === 0).length]];
  const m = $('menu');
  m.innerHTML = items.map(([k, l, , b, w], i) => w === 'p' || (noMoney() && MONEY_TABS.includes(k)) ? '' : `<button type="button" data-i="${i}" style="--c:var(--c-${k})"><span class="ic${w === 'p' ? ' p' : ''}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]}</svg></span>${l}${b ? `<span class="badge">${b}</span>` : ''}</button>`).join('');
  m.querySelectorAll('button').forEach(b => b.onclick = () => items[b.dataset.i][2]());
  // パソコンの広い画面では、同じメニューを左に縦に並べる
  const TAB = { cost: 'cost', label: 'label', mat: 'mat', hyg: 'hyg', book: 'book', ws: 'ws', ct: 'ct', post: 'post', sales: 'sales', cal: 'cal' };
  const all = [['home', 'ホーム', () => show('today'), 0, 0, 'today']].concat(items.map(x => [x[0], x[1], x[2], x[3] || 0, x[4] || 0, TAB[x[0]] || '']), [['set', '設定', () => show('set'), 0, 0, 'set']]);
  const side = $('side');
  side.innerHTML = `<div class="sname"><i></i>${esc(D.shop)}<small>${esc($('date').textContent)}</small></div>` + all.map(([k, l, , b, w, t], i) => noMoney() && MONEY_TABS.includes(k) ? '' : `<button type="button" data-i="${i}" data-tab="${t}" class="${w === 'p' ? 'p' : ''}" style="--c:var(--c-${k})"${t && t === cur ? ' aria-current="page"' : ''}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]}</svg>${l}${b ? `<span class="badge">${b}</span>` : ''}</button>`).join('');
  side.insertAdjacentHTML('beforeend', `<div class="gap"></div><div class="who">${esc(profileName || '')}${profileName ? ' · ' : ''}${esc(D.shop)}</div>`);
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
  const msAsc = Object.keys(D.months || {}).filter(k => k !== '不明').sort().slice(-6), jr = (D.journal || {})[sel] || {};
  const bySup = Object.entries((D.months || {})[sel] ? D.months[sel].by : {}).map(([l, v]) => ({ l, v })).sort((a, b) => b.v - a.v);
  box.innerHTML = `<div class="chgrid"><div><p class="ct">月ごとの仕入れ</p>${barsV(msAsc.map(k => ({ l: +k.slice(5) + '月', v: D.months[k].total })), 'var(--c-book)', { label: '月ごとの仕入れ', w: 320, h: 170 })}</div>
    ${Object.keys(jr).length ? `<div><p class="ct">${esc(sel.replace('-', '年'))}月の科目(案)</p>${donut(Object.entries(jr).map(([l, v]) => ({ l, v })), 'var(--c-book)', { center: '合計', label: '科目の内訳' })}</div>` : ''}
    ${bySup.length ? `<div class="wide"><p class="ct">業者ごと</p>${barsH(bySup.slice(0, 8), 'var(--c-book)')}</div>` : ''}</div>
    <table>${rows.map(p => `<tr><td><b>${esc(p.supplier)}</b><br><span class="k">${esc(p.doc)}${p.paidOn ? ' · ' + esc(p.paidOn.slice(5).replace('-', '/')) + '払い' : p.due ? ' · 期限 ' + esc(p.due.slice(5).replace('-', '/')) : ''}</span></td><td class="n">${yen(p.total)}<br><span class="pill ${PILL[p.status] ?? 'gray'}">${esc(p.status)}</span></td></tr>`).join('')}
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
  if (!(D.pays || []).length) { box.innerHTML = emptyBox('book', 'まだ請求書がありません', '請求書を撮ると、業者ごと・月ごとに仕分けて、払っていないものがここに並びます。', ['請求書を撮る', 'cam']); return; }
  const sum = up.reduce((a, p) => a + p.total, 0);
  box.innerHTML = `<div class="card"><div class="row"><span>${up.length ? `払っていないもの ${up.length}件` : '払っていないものはありません'}</span>${up.length ? `<span class="big" style="font-size:20px">${yen(sum)}</span>` : ''}</div>` +
    up.map(p => `<div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--line)"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span>${esc(p.supplier)} <span class="k">${+p.month.slice(5) || esc(p.month)}月分${p.due ? ' · 期限 ' + esc(p.due.slice(5).replace('-', '/')) : ''}</span></span>${callBtn(p.supplier)}</div>${bankOf(p.supplier) ? `<div class="bkline"><span class="k">振込先</span> <span class="bk">${esc(bankOf(p.supplier))}</span><button class="btn ghost sm" type="button" data-copy="${esc(bankOf(p.supplier))}">コピー</button></div>` : `<div class="bkline k">振込先: まだ(次の請求書を撮ると自動で入ります)</div>`}<div class="row" style="align-items:center;margin-top:6px"><b style="white-space:nowrap;font-size:17px">${yen(p.total)}</b><span style="display:flex;gap:6px;align-items:center;flex:0 0 auto"><button class="btn" style="white-space:nowrap" type="button" data-go="${p.row}">振込へ</button><button class="btn ghost" style="white-space:nowrap" type="button" data-paid="${p.row}">払った</button></span></div>`).join('') +
    `<p class="k" style="margin:8px 0 0">${payBank() ? `振込は ${esc(payBank().name)} を開きます(<a href="#" id="bank-change" style="color:var(--accent)">変える</a>)。` : '「振込へ」を使うには、<a href="#" id="bank-change" style="color:var(--accent)">設定で銀行を選んでください</a>。'}${VIA}「業者名 払った」でも済にできます</p></div>`;
  box.querySelectorAll('[data-paid]').forEach(b => b.onclick = () => setValue('', 'paid', +b.dataset.paid));
  box.querySelectorAll('[data-copy]').forEach(b => b.onclick = async () => { try { await navigator.clipboard.writeText(b.dataset.copy); toast('振込先をコピーしました', 'ok'); } catch (e) { chat(b.dataset.copy); } });
  box.querySelectorAll('[data-go]').forEach(b => b.onclick = () => goPay(up.find(p => p.row === +b.dataset.go)));
  if ($('bank-change')) $('bank-change').onclick = e => { e.preventDefault(); show('set'); setTimeout(() => $('bank-box').scrollIntoView({ block: 'start', behavior: 'smooth' }), 300); };
}

// 何もないときの箱(絵と一言と、次にすること)
const EMPTY_IC = { cam: IC.cam, book: IC.book, ws: IC.ws, sales: IC.sales, label: IC.label };
function emptyBox(ic, title, text, btn) {
  return `<div class="card empty"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${EMPTY_IC[ic] || IC.cam}</svg></div><b>${title}</b><span class="k">${text}</span>${btn ? `<div><button class="btn" type="button" data-empty="${btn[1]}">${btn[0]}</button></div>` : ''}</div>`;
}
document.addEventListener('click', e => { const b = e.target.closest('[data-empty]'); if (!b) return; if (b.dataset.empty === 'cam') openCamera(); else if (b.dataset.empty === 'ws') $('ws-to').focus(); });
// ---------- 原価 ----------
const open = new Set();
function renderCost() {
  const box = $('costs');
  if (!D.products.length) { box.innerHTML = emptyBox('cam', 'まだレシピがありません', '手書きのレシピを1枚撮ると、1個の原価がここに出ます。', ['レシピを撮る', 'cam']); return; }
  const rate = p => p.price && p.per_piece != null ? p.per_piece / p.price : -1;
  const SORT = { name: (a, b) => a.name.localeCompare(b.name, 'ja'), rate: (a, b) => rate(b) - rate(a), new: (a, b) => (b.updated || 0) - (a.updated || 0), est: (a, b) => a.sure - b.sure };
  const cs = $('cost-sort'); if (cs && !cs.dataset.bound) { cs.dataset.bound = 1; cs.onchange = () => { store.set('costSort', cs.value); renderCost(); }; }
  const sortKey = store.get('costSort', 'rate'); if (cs) cs.value = sortKey;
  const ordered = D.products.map((p, i) => [p, i]).sort((a, b) => ((a[0].kind === 'part') - (b[0].kind === 'part')) || SORT[sortKey](a[0], b[0]));
  let partHead = false;
  box.innerHTML = ordered.map(([p, i]) => {
    const head = p.per_piece != null ? `<div class="big">${yen1(p.per_piece)}<span class="k" style="font-weight:400"> / 1${U}</span></div>` : '<div class="big" style="font-size:18px;color:var(--ink-2)">1個の重さ待ち</div>';
    const meta = [`<span class="pill gray">1仕込み ${yen(p.batch_cost)}</span>`];
    if (p.pieces) meta.push(`<span class="pill gray">約${p.pieces}個</span>`);
    if (p.price && p.per_piece != null) { const r = p.per_piece / p.price * 100; meta.push(`<span class="pill ${r > 40 ? 'warn' : r > 30 ? 'gray' : ''}">原価率 ${Math.round(r)}%</span>`); }
    if (p.unknown.length) meta.push(`<span class="pill warn">不明な材料 ${p.unknown.length}</span>`);
    const det = `<table>${p.rows.map(r => `<tr><td>${esc(r.name)} <span class="k">${r.grams.toLocaleString()}g</span>${r.src === 'est' ? ' <span class="pill warn">仮</span>' : r.src === 'unknown' ? ' <span class="pill warn">不明</span>' : r.src === 'part' ? ' <span class="pill gray">半製品</span>' : ''}${r.which && r.src !== 'part' ? `<br><span class="k">→ ${esc(r.which)}${r.cands ? '(同じ種類が' + r.cands.length + 'つ。どれか確かめてください)' : ''}</span>` : ''}</td><td class="n">${r.cost == null ? '-' : yen1(r.cost)}</td></tr>`).join('')}<tr><td><b>1仕込み</b></td><td class="n"><b>${yen(p.batch_cost)}</b></td></tr></table>
      <div class="set"><span class="k">1${U}の重さ</span><input id="spw-${i}" inputmode="decimal" value="${p.pw || ''}" placeholder="例 40"><span class="k">g</span><button class="btn ghost" type="button" data-set="pw" data-i="${i}">決める</button></div>
      <div class="set"><span class="k">売価</span><input id="sprice-${i}" inputmode="decimal" value="${p.price || ''}" placeholder="例 250"><span class="k">円</span><button class="btn ghost" type="button" data-set="price" data-i="${i}">決める</button></div>`;
    const isOpen = open.has(p.name);
    const ph = p.kind === 'part' && !partHead ? (partHead = true, '<div style="grid-column:1/-1;margin-top:8px"><b>生地・餡などの半製品</b> <span class="k">商品ではなく、ほかのレシピの材料になるもの。「〇〇は商品」と話すと戻せます</span></div>') : '';
    return ph + `<div class="card prod" data-name="${esc(p.name)}"><div class="hd" role="button" tabindex="0" aria-expanded="${isOpen}" data-toggle>${avatar(p.name)}<span class="nm">${esc(p.name)} <span class="k">${esc(p.part)}</span></span><span class="k">${p.sure}% 確定</span></div>${head}<div class="meta">${meta.join('')}</div><div class="bar" aria-label="請求書で確かめた割合 ${p.sure}%" title="請求書で確かめた割合 ${p.sure}%"><i style="width:${p.sure}%"></i></div><div class="detail" ${isOpen ? '' : 'hidden'}>${det}</div></div>`;
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
const sellFace = () => (D.shopInfo || {}).sell === 'face';
// 店頭に置くもの: アレルゲン一覧表(全商品 × 特定原材料)とプライスカード。対面販売のお店はこちらが主役
const ALG_MUST = () => (D.allergenRules || {})['義務'] || ['えび', 'かに', 'くるみ', '小麦', 'そば', '卵', '乳', '落花生', 'カシューナッツ'];
const ALG_REC = () => (D.allergenRules || {})['推奨'] || [];
function allergenTable(forPrint) {
  const must = ALG_MUST(), used = new Set(), goods = D.products.filter(p => p.kind !== 'part'); goods.forEach(p => p.label.allergens.forEach(a => used.add(a)));
  const rec = ALG_REC().filter(a => used.has(a));
  const col = a => `<th style="padding:4px 3px;font-size:11.5px;line-height:1.25;white-space:normal;min-width:2.6em;vertical-align:bottom">${esc(a.replace('成分', ''))}</th>`;
  return `<table class="hgrid alg"><tr><th style="text-align:left">商品</th>${must.map(col).join('')}${rec.length ? `<th style="border-left:2px solid var(--line)"></th>${rec.map(col).join('')}` : ''}</tr>` +
    goods.map(p => { const has = new Set(p.label.allergens); return `<tr><td style="text-align:left;white-space:nowrap"><b>${esc(p.name)}</b>${p.label.check.length ? ' <span class="k">※</span>' : ''}</td>${must.map(a => `<td>${has.has(a) ? '●' : ''}</td>`).join('')}${rec.length ? `<td style="border-left:2px solid var(--line)"></td>${rec.map(a => `<td>${has.has(a) ? '●' : ''}</td>`).join('')}` : ''}</tr>`; }).join('') +
    `</table><p class="k" style="margin:6px 0 0">左が表示義務の${must.length}品目${rec.length ? '、右が表示推奨のうち使っているもの' : ''}。${D.products.some(p => p.label.check.length) ? '※は材料の確認がまだの商品で、変わることがあります。' : ''}レシピから自動で出した案です。最終確認はお店で。</p>`;
}
function priceCard(p) {
  const L = lblOf(p), alg = p.label.allergens;
  return `<div class="pcard"><div class="pn">${esc(p.name)}</div><div class="pp">${p.price ? p.price.toLocaleString('ja-JP') + '<small>円</small>' : '<small class="k">売価は原価の画面で</small>'}</div>
    <div class="pa">${alg.length ? 'アレルゲン: ' + alg.map(esc).join('・') : 'アレルゲン: 特定原材料は使っていません'}</div></div>`;
}
function storeBox() {
  if (!D.products.length) return '';
  const sel = D.products.find(x => x.name === labelName) || D.products[0];
  return `<div class="card" id="alg-card"><p style="margin:0 0 6px"><b>アレルゲン一覧表</b> <span class="k">店頭に置く・聞かれたら見せる</span></p><div class="scroll">${allergenTable()}</div>
      <div class="ask"><button class="btn ghost" type="button" id="alg-print">一覧表を印刷・PDF</button></div></div>
    <div class="card" style="margin-top:10px"><p style="margin:0 0 6px"><b>プライスカード</b> <span class="k">${esc(sel.name)} · 名前・値段・アレルゲン</span></p>${priceCard(sel)}
      <div class="ask"><button class="btn ghost" type="button" id="pc-print">この商品を印刷</button><button class="btn ghost" type="button" id="pc-print-all">全部の商品を印刷</button></div></div>`;
}
function bindStore() {
  const head = `<h2 style="letter-spacing:.1em">アレルゲン一覧表</h2><p>${esc(D.shop)} · ${new Date().toLocaleDateString('ja-JP')}時点</p>`;
  if ($('alg-print')) $('alg-print').onclick = () => openPrint(head + allergenTable(true).replace(/class="k"/g, 'style="font-size:11px"'));
  const cards = ps => `<style>.pcg{display:grid;grid-template-columns:1fr 1fr;gap:8mm}.pcard{border:1.5px solid #111;border-radius:4mm;padding:6mm;min-height:48mm;break-inside:avoid}.pn{font-size:22px;font-weight:700}.pp{font-size:34px;font-weight:700;margin:4px 0}.pp small{font-size:16px}.pa{font-size:14px;border-top:1px solid #999;padding-top:4px;margin-top:6px}</style><div class="pcg">${ps.map(priceCard).join('')}</div>`;
  if ($('pc-print')) $('pc-print').onclick = () => openPrint(cards([D.products.find(x => x.name === labelName) || D.products[0]]));
  if ($('pc-print-all')) $('pc-print-all').onclick = () => openPrint(cards(D.products.filter(p => p.kind !== 'part')));
}
function renderLabel() {
  const chips = $('label-chips'), box = $('label-box'), face = sellFace();
  $('label-h').textContent = face ? 'アレルゲン・店頭' : '裏表示';
  $('label-lead').innerHTML = face ? '対面販売では裏表示は要りません。店頭に置くアレルゲン一覧表とプライスカードを出します。卸す商品だけ、下でラベルを作れます。' : '一括表示の原案とラベル印刷。<mark>色つき</mark>は要確認。最終確認と表示の責任はお店にあります。';
  if (!D.products.length) { chips.innerHTML = ''; box.innerHTML = emptyBox('label', 'まだレシピがありません', 'レシピを撮ると、ここに' + (face ? 'アレルゲン一覧表' : '裏表示の案') + 'が出ます。', ['レシピを撮る', 'cam']); return; }
  if (!D.products.find(p => p.name === labelName)) labelName = D.products[0].name;
  const goods = D.products.filter(p => p.kind !== 'part');
  if (goods.length && !goods.find(p => p.name === labelName)) labelName = goods[0].name;
  chips.innerHTML = goods.map(p => `<button class="chip" type="button" aria-pressed="${p.name === labelName}">${esc(p.name)}</button>`).join('');
  chips.querySelectorAll('.chip').forEach((b, i) => b.onclick = () => { labelName = goods[i].name; renderLabel(); });
  if (cur === 'label' && labelName) setCrumb([labelName]);
  const p = D.products.find(x => x.name === labelName), lb = p.label, L = lblOf(p), si = D.shopInfo || {};
  box.innerHTML = (face ? storeBox() + `<details class="card" style="margin-top:14px" id="face-lbl"><summary><b>包装して卸す商品のラベル</b> <span class="k">道の駅・スーパーに出す分だけ</span></summary><div style="margin-top:10px">` : '') + `<div class="label">
    <div class="r"><div class="h">名称</div><div class="v">${esc(L.name)}</div></div>
    <div class="r"><div class="h">原材料名</div><div class="v"><span id="ing">${esc(lb.text) || '(まだ出せません)'}</span>${lb.check.length ? `、<mark>${lb.check.map(esc).join('、')}(要確認)</mark>` : ''}${esc(lb.contains)}</div></div>
    <div class="r"><div class="h">内容量</div><div class="v">${esc(L.content)}</div></div>
    <div class="r"><div class="h">${esc(L.dtype)}</div><div class="v">枠外下部に記載${L.days === '' ? '' : `<span class="k">(作った日から${L.days}日)</span>`}</div></div>
    <div class="r"><div class="h">保存方法</div><div class="v">${esc(L.storage)}</div></div>
    <div class="r"><div class="h">製造者</div><div class="v">${esc(si.name || D.shop)} ${si.addr ? esc(si.addr) : '<span class="k">(住所は設定から)</span>'}</div></div></div>
    <div class="ask" style="margin-top:10px"><button class="btn" id="copy" type="button">原材料名をコピー</button><span class="copied" id="copied"></span></div>
    ${lblPrintCard(p, L)}
    ${nutrBox(p)}` + (face ? '</div></details>' : '<h1 class="sub" style="margin-top:20px">店頭に置くもの</h1>' + storeBox());
  bindStore();
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
  const row = m => `<tr data-m="${esc(m.name)}" style="cursor:pointer"><td><b>${esc(m.name)}</b>${upNames.has(m.name) ? ' <span class="up">↑</span>' : ''}${m.spec || m.supplier ? ` <span class="k">${esc([m.spec, m.supplier].filter(Boolean).join(' · '))}</span>` : ''}<br><span class="k">${esc(m.display)}${m.allergens.length ? ' · ' + m.allergens.map(esc).join('・') : ''}${m.attrs ? ' · ' + esc(m.attrs) : ''}</span>${m.fromKind ? ' <span class="pill warn">種類の値で仮</span>' : ''}${stk[m.name] && stk[m.name].known ? `<br><span class="pill ${stk[m.name].low ? 'warn' : 'gray'}">残り ${amt(stk[m.name].left, stk[m.name].unit)}${stk[m.name].days != null ? ' · 約' + stk[m.name].days + '日' : ''}</span>` : ''}</td><td class="n">${noMoney() ? '' : m.ppg ? Math.round(m.ppg * 1000).toLocaleString() + '円/kg' : '-'}<br>${m.ok ? '<span class="pill">請求書</span>' : '<span class="pill warn">仮</span>'}</td></tr>`;
  const groups = {}; rows.forEach(m => (groups[m.kind || ''] = groups[m.kind || ''] || []).push(m));
  const gk = Object.keys(groups).sort((a, b) => (a === '') - (b === '') || a.localeCompare(b, 'ja'));
  $('mats').innerHTML = (gk.length > 1 || gk[0] ? gk.map(k => `<tr><td colspan="2" style="padding-top:10px"><b class="k">${k ? '種類: ' + esc(k) : '種類をまだ決めていない材料'}</b>${k && groups[k].length > 1 ? ' <span class="k">(' + groups[k].length + '商品)</span>' : ''}</td></tr>` + groups[k].map(row).join('')).join('') : rows.map(row).join('')) || '<tr><td class="k">ありません</td></tr>';
  $('mats').querySelectorAll('tr[data-m]').forEach(tr => tr.onclick = () => matEdit(tr.dataset.m));
  matAddBtn();
  const all = D.materials.filter(m => !m.packaging), est = all.filter(m => !m.ok).length;
  const ms = Object.keys(D.months).sort(), lastM = ms[ms.length - 1];
  setTimeout(renderCount, 0);
  $('mat-sum').textContent = `材料 ${all.length}種類のうち、確かめた ${all.length - est}、仮 ${est}。` + (lastM ? `${lastM.replace('-', '年')}月の仕入れ ${yen(D.months[lastM].total)}。` : '');
}
const kindList = () => `<datalist id="kinds">${(D.kinds || []).map(k => `<option value="${esc(k)}">`).join('')}</datalist>`;
const inp = (id, v, ph, w) => `<input id="${id}" value="${esc(v || '')}" placeholder="${esc(ph)}" style="width:${w || '100%'};box-sizing:border-box;font:inherit;font-size:15px;padding:6px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink)">`;
function matBox(html) {
  let b = $('mat-edit'); if (!b) { b = document.createElement('div'); b.id = 'mat-edit'; b.className = 'card'; b.style.margin = '0 0 12px'; $('mats').closest('.card').before(b); }
  b.innerHTML = html; b.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function matBoxClose() { const b = $('mat-edit'); if (b) b.remove(); }
function matAddBtn() {
  if ($('mat-add-top')) return;
  let b = $('mat-add'); if (b) return;
  b = document.createElement('div'); b.id = 'mat-add'; b.style.margin = '10px 0';
  b.innerHTML = '<button class="btn" type="button">＋ 材料(商品)を足す</button> <span class="k">種類(例: マーガリン)の中に、ブランドや規格ちがいの商品を足せます</span>';
  b.querySelector('button').onclick = () => matEdit(null);
  $('mats').closest('.card').after(b);
}
function matEdit(name, preset) {
  const m = name ? D.materials.find(x => x.name === name) : (preset || {});
  setCrumb([name || '材料を足す']);
  matBox(`<p style="margin:0 0 8px"><b>${name ? esc(name) : '材料(商品)を足す'}</b></p>${kindList()}
    <div style="display:grid;gap:8px">
    ${name ? '' : `<label>名前(袋に書いてある商品名)${inp('me-name', m.name, '商品名')}</label>`}
    <label>種類${inp('me-kind', m.kind, '例 マーガリン・強力粉・生クリーム')}</label>
    <label>規格${inp('me-spec', m.spec, '例 25kg・500g×20')}</label>
    <label>業者${inp('me-sup', m.supplier, '業者名')}</label>
    <label>中身${inp('me-attrs', m.attrs, '例 乳脂肪分47%・発酵・無塩・植物性')}</label>
    ${name ? `<label>別名を足す(レシピや請求書での書き方)${inp('me-alias', '', '商品名')}</label>${m.aliases && m.aliases.length ? `<span class="k">いまの別名: ${m.aliases.map(esc).join('、')}</span>` : ''}` : `<label>値段(1kgあたり・分かれば)${inp('me-ppkg', '', '例 600', '8em')}</label>`}
    </div><p class="k" style="margin:8px 0">原材料・アレルゲン・栄養は、袋の裏を撮ると本物に置きかわります。それまでは同じ種類の値で仮に出して「要確認」にします。</p>
    <button class="btn" type="button" id="me-go">保存</button> <button class="btn ghost" type="button" id="me-x">やめる</button>`);
  $('me-x').onclick = matBoxClose;
  $('me-kind').setAttribute('list', 'kinds');
  $('me-go').onclick = () => {
    const v = { kind: $('me-kind').value, spec: $('me-spec').value, supplier: $('me-sup').value, attrs: $('me-attrs').value };
    if (name) { const al = $('me-alias').value.trim(); if (al) v.alias = al; setValueX({ field: 'mat', name, value: v }); }
    else { const nm = $('me-name').value.trim(); if (!nm) { $('me-name').focus(); return; } v.ppkg = parseFloat($('me-ppkg').value) || ''; setValueX({ field: 'mat', name: nm, create: true, value: v }); }
    matBoxClose();
  };
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
  const out = await api(Object.assign({ kind: 'app_set' }, extra));
  if (!out.ok) { toast(out.error || 'うまく記録できませんでした', 'ng'); return; }
  D = out.data; renderAll(); if (out.msg) { chat(out.msg); return; } toast(extra.field === 'hyg' ? '記録しました。' : extra.field === 'deliv' ? '納品を記録しました。' : extra.field === 'shop' ? 'お店の情報を保存しました。' : extra.field === 'lbl' ? 'ラベルの設定を保存しました。' : extra.field === 'paybank' ? `振込は「${esc((payBank() || {}).name || '')}」を開くようにしました。` : ['biz', 'sell', 'closed', 'wsprice', 'regalias'].includes(extra.field) ? '変えました。' : extra.field === 'mat' ? (extra.value && extra.value.alias ? `「${esc(extra.value.alias)}」を「${esc(extra.name)}」の別名にしました。原価に反映しました。` : '材料を保存しました。') : extra.field === 'hygnotice' ? (extra.value === 'off' ? '衛生記録のお知らせは送らないようにしました。' : `衛生記録のお知らせは${extra.value}時に送ります。`) : extra.field === 'sales' ? '売上を記録しました。' : extra.field === 'cycle' ? `棚卸は「${extra.value}」にしました。その前にLINEでお知らせします。` : '覚えました。在庫を計算しなおしました。', 'ok'); act('heart', 1.3);
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
  $('shop').textContent = D.shop; if ($('shop2')) { $('shop2').textContent = D.shop; $('date2').textContent = $('date').textContent; }
  $('foot').textContent = `${new Date(D.at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 時点。開き直すと新しくなります。キャラの絵はAtelier SAISPEのLINE絵文字。`;
}

// ---------- タブ ----------
const tabs = ['today', 'hyg', 'sales', 'cost', 'label', 'mat', 'book', 'ws', 'ct', 'post', 'cal', 'set'];
let cur = 'today';
function show(t, quiet, keep) {
  if (!D) return;
  if (noMoney() && MONEY_TABS.includes(t)) { toast('お金の画面は、店主が「見せる」にした人だけが見られます'); t = 'today'; }
  const dir = tabs.indexOf(t) - tabs.indexOf(cur); cur = t;
  if (t === 'mat') renderMat();
  tabs.forEach(x => { const el = $('t-' + x); el.hidden = x !== t; el.classList.remove('inR', 'inL'); });
  if (dir) { const el = $('t-' + t); void el.offsetWidth; el.classList.add(dir > 0 ? 'inR' : 'inL'); }
  document.querySelectorAll('nav button[data-t]').forEach(b => b.dataset.t === t ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
  document.querySelectorAll('#side button[data-tab]').forEach(b => b.dataset.tab === t ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
  store.set('tab', t); if (!keep) window.scrollTo(0, 0);
  setCrumb(null); renderBar();
  if (!quiet) chat({ today: null, cost: '原価です。カードを押すと中身と入力欄が出ます。', label: '裏表示の案です。色のついたところだけ確かめてください。', mat: '材料の値段です。「仮」は請求書が来たら置き換えます。', set: '設定です。キャラや文字の大きさを変えられます。', hyg: hygMissing().length ? `今日まだの記録が${hygMissing().length}つあります。` : '今日の衛生記録はそろっています。', ws: '卸の納品と請求書です。', sales: '売上ともうけです。精算レシートを撮ると増えていきます。', post: 'ポップやインスタの文、いっしょに考えます。', cal: '予定です。納品・催事・休みを入れておくと、当日の「今日やること」に出ます。', book: unpaid().length ? `払っていないものが${unpaid().length}件あります。払ったら「払った」を押してください。` : '帳簿です。請求書は月ごとに仕分けてあります。' }[t], t === 'cost' ? 'clap' : t === 'label' ? 'point' : null);
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
  const grp = (t, k, body) => `<div class="card sgrp"><div class="sgh"><span class="ic" style="--c:var(--c-${k})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]}</svg></span><b>${t}</b></div>${body}</div>`;
  const stand = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const homeIcon = `<div class="card" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><b>${matchMedia('(pointer:coarse)').matches ? 'ホーム画面のアイコン' : 'パソコンのアイコン'}</b>${stand ? '<span class="pill">アイコンから開いています(置けています)</span>' : `<button class="btn sm" type="button" id="set-a2hs">${matchMedia('(pointer:coarse)').matches ? 'ホーム画面に置く' : 'パソコンに置く'}</button><span class="k">LINEやブラウザを通らず、アイコンから開けるようにします</span>`}</div>`;
  $('set-box').innerHTML = homeIcon + (CF ? `<div class="card" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><b>使い方ガイド</b><a class="btn ghost sm" href="/guide/start" target="_blank">はじめの設定(店主向け)</a><a class="btn ghost sm" href="/guide/daily" target="_blank">ふだんの使い方(みんな向け)</a></div>` : '') + grp('見え方', 'set', `
    <div class="set-row"><span>キャラ</span>${seg('pack', [['tanuki', 'たぬき'], ['robot', 'ロボット'], ['op', 'オペレーター']], PACK)}</div>
    <div class="set-row"><span>キャラの大きさ</span>${seg('csize', [['s', '小'], ['m', '中'], ['l', '大']], store.get('csize', 'm'))}</div>
    <div class="set-row"><span>文字の大きさ</span>${seg('size', [['normal', 'ふつう'], ['big', '大きめ']], store.get('size', 'normal'))}</div>
    <div class="set-row"><span>画面の色</span>${seg('theme', [['auto', '自動'], ['light', '明るい'], ['dark', '暗い']], store.get('theme', 'auto'))}</div>`) + grp('お店の決まりごと', 'stock', `
    <div class="set-row"><span>棚卸<br><span class="k">お店みんな共通</span></span>${seg('cycle', [['毎月', '毎月'], ['年1回', '年1回']], cyc)}</div>
    <div class="set-row"><span>売り方<br><span class="k">対面だけなら裏表示は要らず、店頭のアレルゲン表が主役になります</span></span>${seg('sell', [['pack', '包装して売る'], ['face', '対面だけ']], (D.shopInfo || {}).sell || 'pack')}</div>
    <div class="set-row"><span>業種<br><span class="k">お店みんな共通</span></span>${seg('biz', ((D.words || {}).list || []).map(b => [b, b]), (D.words || {}).biz)}</div>
    `) + grp('お知らせ', 'hyg', `
    <div class="set-row"><span>衛生記録のお知らせ<br><span class="k">記録がまだのとき、LINEで念押しする時刻</span></span><div class="seg" id="hygnotice" style="flex-wrap:wrap;justify-content:flex-end">${[['off', '送らない'], ['9', '9時'], ['12', '12時'], ['15', '15時'], ['17', '17時'], ['19', '19時'], ['21', '21時']].map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${String((D.shopInfo || {}).hygNotice || '17') === v}">${l}</button>`).join('')}</div></div>
    <div class="set-row"><span>定休日<br><span class="k">衛生の念押しを休む</span></span><div class="seg" id="closed">${['月', '火', '水', '木', '金', '土', '日'].map(w => `<button type="button" data-w="${w}" aria-pressed="${((D.shopInfo || {}).closed || '').includes(w)}">${w}</button>`).join('')}</div></div>
    `) + grp('業者・卸先', 'book', '<p class="k" style="margin:0 0 8px">電話・担当・振込先の一覧は、メニューの「業者・卸先」にあります</p><button class="btn ghost" type="button" id="set-ct">業者・卸先の一覧を開く</button>') + grp('お店の情報', 'ws', `<p class="k" style="margin:0 0 6px">卸の請求書とラベルの製造者欄に入ります</p>
    <div class="set-row" style="display:block;padding-top:0">
      <div class="fld" style="margin-top:8px">${[['name', '店名'], ['addr', '住所'], ['tel', '電話'], ['reg', '登録番号(T〜)'], ['bank', '振込先']].map(([k, l]) => `<span class="k">${l}</span><input data-shop="${k}" value="${esc((D.shopInfo || {})[k] || '')}">`).join('')}</div>
      <div class="ask"><button class="btn" type="button" id="shop-save">お店の情報を保存</button></div></div>`) + `
    <div class="set-row" style="padding:8px 4px"><span class="k">${esc(D.shop)} · ${new Date(D.at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 時点</span><span class="seg"><button type="button" id="reload">読み込み直す</button></span></div>`;
  $('set-box').querySelectorAll('.seg[data-key] button').forEach(b => b.onclick = () => {
    const key = b.parentNode.dataset.key, v = b.dataset.v;
    if (key === 'cycle') { setValueX({ field: 'cycle', value: v }); return; }
    if (key === 'biz' || key === 'sell') { setValueX({ field: key, value: v }); return; }
    store.set(key, v);
    if (key === 'pack') { location.reload(); return; }
    applyLook(); renderSet();
  });
  $('reload').onclick = () => location.reload();
  if ($('set-a2hs')) $('set-a2hs').onclick = async () => {
    if (IN_LINE) { const ext = location.origin + location.pathname.replace(/^\/l\//, '/') + '?openExternalBrowser=1'; if (window.liff && liff.isInClient && liff.isInClient()) liff.openWindow({ url: location.origin + location.pathname, external: true }); else location.href = ext; return; }
    if (a2hsEvt) { const ev = a2hsEvt; ev.prompt(); const r = await ev.userChoice.catch(() => null); a2hsEvt = null; if (r && r.outcome === 'accepted') toast('ホーム画面に置きました', 'ok'); return; }
    a2hsHelp();
  };
  $('set-ct').onclick = () => show('ct');
  renderMembers();
  const nb = document.querySelector('nav button[data-t="book"]'); if (nb) nb.style.display = noMoney() ? 'none' : '';
  $('hygnotice').querySelectorAll('button').forEach(b => b.onclick = () => setValueX({ field: 'hygnotice', value: b.dataset.v }));
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
function openPrint(html, opt) {
  if (opt && opt.bare) {} else if (!/<h2/.test(html.slice(0, 200))) html = `<div class="ph-print"><b>${esc(D.shop)}</b><span>${new Date().toLocaleDateString('ja-JP')}</span></div>` + html; else html = html.replace(/<\/h2>/, `</h2><div class="ph-print"><b>${esc(D.shop)}</b><span>${new Date().toLocaleDateString('ja-JP')}</span></div>`);
  const v = $('inv'); v.classList.remove('lprint'); const lp = document.getElementById('lb-page'); if (lp) lp.textContent = ''; v.innerHTML = html + '<div class="bar3"><button class="btn" type="button" id="inv-print">印刷・PDFにする</button><button class="btn ghost" type="button" id="inv-close">閉じる</button></div>'; v.hidden = false;
  $('inv-print').onclick = () => window.print(); $('inv-close').onclick = () => { v.hidden = true; };
}
// ---------- 卸 ----------
function renderWs() {
  const ws = D.ws || {}, ms = Object.keys(ws).sort().reverse(), chips = $('ws-chips');
  const tos = [...new Set(ms.flatMap(m => Object.keys(ws[m])))];
  $('ws-add').innerHTML = `<p style="margin:0 0 6px"><b>納品を記録</b></p><div class="fld"><span class="k">卸先</span><input id="ws-to" list="ws-tos" placeholder="卸先"><datalist id="ws-tos">${tos.map(t => `<option value="${esc(t)}">`).join('')}</datalist>
    <span class="k">商品と数</span><input id="ws-items" placeholder="商品と数"></div><div class="ask"><button class="btn" type="button" id="ws-go">記録</button><span class="k">話しかけても入ります</span></div>`;
  $('ws-go').onclick = () => { const to = $('ws-to').value.trim(), it = $('ws-items').value.trim(); if (!to || !it) { chat('卸先と、商品と数を入れてください'); return; } setValueX({ field: 'deliv', value: to + ' ' + it }); };
  if (!ms.length) { chips.innerHTML = ''; $('ws-list').innerHTML = emptyBox('ws', 'まだ納品の記録がありません', '上の欄に卸先と商品・数を入れると、ここに月ごとに並びます。'); return; }
  const sel = chips.dataset.m && ms.includes(chips.dataset.m) ? chips.dataset.m : ms[0];
  chips.innerHTML = ms.map(m => `<button class="chip" type="button" data-m="${m}" aria-pressed="${m === sel}">${m.replace('-', '年')}月</button>`).join('');
  chips.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { chips.dataset.m = b.dataset.m; renderWs(); });
  const by = ws[sel], wsTot = Object.values(by).reduce((a, x) => a + x.total, 0);
  const prevK = ms[ms.indexOf(sel) + 1], prevTot = prevK ? Object.values(ws[prevK]).reduce((a, x) => a + x.total, 0) : null;
  $('ws-list').innerHTML = `<div class="card">${tiles([{ t: `${+sel.slice(5)}月の卸(税抜)`, v: yen(wsTot), c: 'ws', k: prevTot != null ? `前月 ${yen(prevTot)}(${wsTot >= prevTot ? '+' : ''}${Math.round((wsTot - prevTot) / Math.max(1, prevTot) * 100)}%)` : '' }, { t: '卸先', v: Object.keys(by).length + '<small style="font-size:14px;font-weight:500"> 件</small>', c: 'ws' }])}
    ${Object.keys(by).length > 1 ? `<p class="ct" style="margin-top:12px">卸先ごと</p>${barsH(Object.keys(by).map(to => ({ l: to, v: by[to].total })).sort((a, b) => b.v - a.v), 'var(--c-ws)')}` : ''}</div>` + Object.keys(by).map((to, i) => { const o = by[to], miss = [...new Set(o.lines.filter(l => l.unit == null).map(l => l.item))];
    return `<div class="card"><div class="row"><b>${esc(to)} ${callBtn(to)}</b><span class="big" style="font-size:20px">${yen(o.total)}</span></div><p class="k" style="margin:2px 0 6px">税抜 · ${o.lines.length}回の納品</p>
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
  if (!ms.length) { chips.innerHTML = ''; $('sales-box').innerHTML = emptyBox('sales', 'まだ売上の記録がありません', '閉店後にレジの精算レシートを撮ると、売上ともうけがここに出ます。', ['レシートを撮る', 'cam']); return; }
  const sel = chips.dataset.m && ms.includes(chips.dataset.m) ? chips.dataset.m : ms[0];
  chips.innerHTML = ms.map(m => `<button class="chip" type="button" data-m="${m}" aria-pressed="${m === sel}">${m.replace('-', '年')}月</button>`).join('');
  chips.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { chips.dataset.m = b.dataset.m; renderSales(); });
  const o = sa[sel], items = Object.keys(o.items).sort((a, b) => (o.items[b].amount - o.items[b].cost) - (o.items[a].amount - o.items[a].cost)), unk = Object.keys(o.unknown || {});
  const rate = o.madeCost ? Math.round(o.madeCost / Math.max(1, o.total) * 100) : null;
  const [sy, smn] = sel.split('-').map(Number), nd = new Date(sy, smn, 0).getDate(), daily = []; for (let d = 1; d <= nd; d++) { const k = `${sel}-${String(d).padStart(2, '0')}`; daily.push({ l: String(d), v: (o.days || {})[k] || 0 }); }
  const prof = o.madeCost ? o.total - o.madeCost : null;
  $('sales-box').innerHTML = `<div class="card">${tiles([{ t: '売上(税込)', v: yen(o.total), c: 'sales', k: `${o.nDays}日分 · 1日平均 ${yen(o.total / Math.max(1, o.nDays))}` }, { t: '作った分の材料費', v: o.madeCost ? yen(o.madeCost) : '<span class="k">—</span>', c: 'cost', k: rate != null ? `原価率の目安 ${rate}%` : '1個の重さと作った数から' }, { t: 'もうけ(材料費を引いた分)', v: prof != null ? yen(prof) : '<span class="k">—</span>', c: 'ws', k: '人件費・光熱費は入っていません' }])}
    <p class="ct" style="margin-top:12px">日ごとの売上</p>${barsV(daily, 'var(--c-sales)', { label: '日ごとの売上', h: 150 })}</div>
    <div class="card" hidden><div class="row"><span>売上(税込)</span><span class="big">${yen(o.total)}</span></div>
      <p class="k" style="margin:4px 0 0">${o.nDays}日分 · 1日平均 ${yen(o.total / Math.max(1, o.nDays))}${o.customers ? ` · 客数 ${o.customers}人 · 客単価 ${yen(o.total / o.customers)}` : ''}</p>
      ${rate != null ? `<div class="row" style="margin-top:8px"><span>作った分の材料費</span><b>${yen(o.madeCost)}</b></div><p class="k" style="margin:2px 0 0">原価率の目安 ${rate}%(製造メモ × 1${U}の原価 ÷ 売上)</p>` : ''}</div>
    ${items.length ? `<div class="card"><p style="margin:0 0 6px"><b>商品ごとのもうけ</b> <span class="k">売上 − 材料費</span></p>${barsH(items.slice(0, 8).map(n => ({ l: n, v: o.items[n].amount - o.items[n].cost })), 'var(--c-sales)')}<table><tr><td class="k">商品</td><td class="n k">数</td><td class="n k">売上</td><td class="n k">もうけ</td></tr>${items.map(n => { const x = o.items[n], g = x.amount - x.cost; return `<tr><td>${esc(n)}${x.unit == null ? ' <span class="pill warn">重さ待ち</span>' : ''}</td><td class="n">${x.qty}</td><td class="n">${yen(x.amount)}</td><td class="n"><b>${yen(g)}</b><br><span class="k">${x.amount ? Math.round(g / x.amount * 100) : 0}%</span></td></tr>`; }).join('')}</table>
      <p class="k" style="margin:6px 0 0">人件費・光熱費などは入っていません。材料費だけを引いた額です</p></div>` : ''}
    ${unk.length ? `<div class="card"><p style="margin:0 0 6px"><b>レジの名前と商品をつなぐ</b></p><p class="k" style="margin:0 0 6px">商品ごとに打っている名前は、ピタット原価の商品を選ぶともうけが出ます。部門(和菓子など)はそのままで大丈夫です</p>
      ${unk.map((u, i) => `<div class="ask"><span style="min-width:7em">${esc(u)} <span class="k">${yen(o.unknown[u])}</span></span><select id="ra-${i}" style="font:inherit;font-size:14px;padding:5px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink)"><option value="">選ぶ</option>${D.products.map(p => `<option>${esc(p.name)}</option>`).join('')}</select><button class="btn ghost" type="button" data-ra="${i}" data-reg="${esc(u)}">つなぐ</button></div>`).join('')}</div>` : ''}`;
  $('sales-box').querySelectorAll('[data-ra]').forEach(b => b.onclick = () => { const p = $('ra-' + b.dataset.ra).value; if (!p) return; setValueX({ field: 'regalias', reg: b.dataset.reg, product: p }); });
}
// ---------- 発信 ----------
// ---------- 発信: SNSに上げる画像・店に置くもの(ポップ・値札・貼り紙) ----------
// 絵は画面の中(canvas)で作る。AIは言葉だけ。写真を入れると写真の上に文字をのせる
const THEMES = {
  wa: { bg: '#f5ecdc', bg2: '#ead9bd', ink: '#2b1d12', accent: '#a8322a', soft: '#7a5a3a', font: '"Shippori Mincho B1","Hiragino Mincho ProN","Yu Mincho",serif', label: '和' },
  white: { bg: '#ffffff', bg2: '#eef3f1', ink: '#1d2a28', accent: '#2f7d6d', soft: '#5d6b68', font: '"Zen Maru Gothic","Hiragino Maru Gothic ProN",sans-serif', label: 'しろ' },
  pop: { bg: '#ffe9a8', bg2: '#ffd45e', ink: '#3a2306', accent: '#d9481c', soft: '#7a5214', font: '"Zen Maru Gothic","Hiragino Maru Gothic ProN",sans-serif', label: 'あかるい' }
};
const PS = { theme: store.get('pTheme', 'wa'), size: 'sq', photo: null, d: null };
function wrapJa(ctx, text, maxW) {
  const out = []; let line = '';
  for (const ch of String(text || '')) {
    if (ch === '\n') { out.push(line); line = ''; continue; }
    if (ctx.measureText(line + ch).width > maxW && line) { if (/^[、。」』）)！!？?ー〜]$/.test(ch)) { line += ch; out.push(line); line = ''; continue; } out.push(line); line = ch; } else line += ch;
  }
  if (line) out.push(line); return out;
}
// 1枚の絵を描く。w,hはピクセル。kind: sns / pop / notice
function drawCard(cv, o) {
  const T = THEMES[o.theme] || THEMES.wa, w = cv.width, h = cv.height, c = cv.getContext('2d'), u = w / 1080;
  c.clearRect(0, 0, w, h);
  const photo = o.photo && o.kind !== 'notice';
  if (photo) {
    const im = o.photo, sc = Math.max(w / im.width, h / im.height), iw = im.width * sc, ih = im.height * sc;
    c.drawImage(im, (w - iw) / 2, (h - ih) / 2, iw, ih);
    const g = c.createLinearGradient(0, h * .38, 0, h); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.72)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  } else {
    c.fillStyle = T.bg; c.fillRect(0, 0, w, h);
    c.fillStyle = T.bg2; c.globalAlpha = .55;
    c.beginPath(); c.arc(w * .92, h * .1, w * .32, 0, 7); c.fill(); c.beginPath(); c.arc(w * .05, h * .95, w * .26, 0, 7); c.fill(); c.globalAlpha = 1;
    c.strokeStyle = T.accent; c.lineWidth = 6 * u; c.strokeRect(36 * u, 36 * u, w - 72 * u, h - 72 * u);
    c.lineWidth = 2 * u; c.strokeRect(50 * u, 50 * u, w - 100 * u, h - 100 * u);
  }
  const ink = photo ? '#fff' : T.ink, soft = photo ? 'rgba(255,255,255,.88)' : T.soft, pad = 110 * u, maxW = w - pad * 2;
  c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  // 店名(上)
  c.fillStyle = photo ? 'rgba(255,255,255,.95)' : T.accent; c.font = `700 ${40 * u}px ${T.font}`;
  if (!photo) c.fillText(o.shop || '', w / 2, 130 * u);
  // 見出し・ひと言・商品名と値段
  let fs = (o.kind === 'notice' ? 84 : 116) * u; c.font = `700 ${fs}px ${T.font}`;
  let lines = wrapJa(c, o.catch, maxW);
  // はみ出す1〜2文字だけの行ができないように、少し小さくして収める
  while ((lines.length > 3 || (lines.length > 1 && [...lines[lines.length - 1]].length <= 2)) && fs > 64 * u) { fs -= 4 * u; c.font = `700 ${fs}px ${T.font}`; lines = wrapJa(c, o.catch, maxW); }
  const sfs = (o.kind === 'notice' ? 58 : 46) * u; c.font = `500 ${sfs}px ${T.font}`; const slines = wrapJa(c, o.sub, maxW).slice(0, o.kind === 'notice' ? 8 : 3);
  const nm = o.name ? o.name + (o.price ? '  ' + Number(o.price).toLocaleString('ja-JP') + '円' : '') : '';
  const blockH = lines.length * fs * 1.25 + (slines.length ? 40 * u + slines.length * sfs * 1.5 : 0) + (nm ? 110 * u : 0);
  let y = photo ? h - 120 * u - blockH + fs : Math.max(220 * u + fs, (h - blockH) / 2 + fs * .9);
  if (photo) { c.textAlign = 'left'; }
  const x = photo ? pad * .7 : w / 2;
  c.fillStyle = ink; c.font = `700 ${fs}px ${T.font}`;
  if (photo) { c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 12 * u; }
  lines.forEach(l => { c.fillText(l, x, y); y += fs * 1.25; });
  if (!photo && lines.length) { c.fillStyle = T.accent; c.fillRect(w / 2 - 60 * u, y - fs * .55, 120 * u, 6 * u); }
  y += 40 * u - fs * .25 + sfs; c.fillStyle = soft; c.font = `500 ${sfs}px ${T.font}`;
  slines.forEach(l => { c.fillText(l, x, y); y += sfs * 1.5; });
  if (nm) {
    y += 40 * u; c.font = `700 ${52 * u}px ${T.font}`; const tw = Math.min(maxW, c.measureText(nm).width + 70 * u), bx = photo ? x - 10 * u : w / 2 - tw / 2;
    c.shadowBlur = 0; c.fillStyle = photo ? 'rgba(255,255,255,.92)' : T.accent; c.beginPath(); c.roundRect ? c.roundRect(bx, y - 62 * u, tw, 88 * u, 44 * u) : c.rect(bx, y - 62 * u, tw, 88 * u); c.fill();
    c.fillStyle = photo ? T.ink : '#fff'; c.textAlign = 'center'; c.fillText(nm, bx + tw / 2, y - 2 * u);
  }
  c.shadowBlur = 0;
  if (photo) { c.textAlign = 'right'; c.fillStyle = 'rgba(255,255,255,.9)'; c.font = `700 ${34 * u}px ${T.font}`; c.fillText(o.shop || '', w - 50 * u, 80 * u); }
}
async function fontsReady() { try { await Promise.all([document.fonts.load('700 40px "Shippori Mincho B1"'), document.fonts.load('700 40px "Zen Maru Gothic"')]); } catch (e) {} }
function cardOpts(kind) { const d = PS.d || {}; return { kind, theme: PS.theme, photo: PS.photo, shop: D.shop, catch: ($('ps-catch') || {}).value ?? d.catch, sub: ($('ps-sub') || {}).value ?? d.sub, name: ($('ps-name') && $('ps-name').checked) ? d.name : '', price: d.price }; }
function snsDraw() { const cv = $('ps-cv'); if (!cv) return; cv.width = 1080; cv.height = PS.size === 'tall' ? 1350 : 1080; drawCard(cv, cardOpts('sns')); }
function canvasBlob(cv) { return new Promise(r => cv.toBlob(r, 'image/png')); }
function printImage(cv, size) {
  const url = cv.toDataURL('image/jpeg', .92);
  openPrint(`<style>@page{size:${size};margin:0}.pimg{max-width:100%;max-height:calc(100vh - 110px);box-shadow:0 2px 12px rgba(0,0,0,.15)}@media print{.pimg{max-height:none;width:100%;box-shadow:none;display:block}}</style><div style="text-align:center"><img class="pimg" src="${url}" alt=""></div>`, { bare: true });
}
// 値札カード(A4に8枚)。商品名・値段・アレルゲン
function priceCards(list) {
  const T = THEMES[PS.theme] || THEMES.wa;
  const cards = list.map(p => `<div class="pc" style="border-color:${T.accent};background:${T.bg};color:${T.ink};font-family:${esc(T.font)}"><div class="pc-shop" style="color:${T.accent}">${esc(D.shop)}</div><div class="pc-name">${esc(p.name)}</div><div class="pc-price">${p.price ? Number(p.price).toLocaleString('ja-JP') + '<small>円</small>' : '<span style="display:inline-block;width:32mm;border-bottom:.4mm solid currentColor">&nbsp;</span><small>円</small>'}</div>${p.label && p.label.allergens && p.label.allergens.length ? `<div class="pc-al">アレルゲン: ${esc(p.label.allergens.join('・'))}</div>` : ''}</div>`).join('');
  openPrint(`<style>@page{size:A4;margin:8mm}.pcs{display:grid;grid-template-columns:1fr 1fr;gap:4mm}.pc{border:1.2mm double;border-radius:3mm;height:62mm;padding:4mm 5mm;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;text-align:center;break-inside:avoid}.pc-shop{font-size:10pt;font-weight:700;letter-spacing:.1em}.pc-name{font-size:20pt;font-weight:700;line-height:1.3;margin:2mm 0}.pc-price{font-size:26pt;font-weight:700}.pc-price small{font-size:12pt;margin-left:1mm}.pc-al{font-size:8.5pt;margin-top:2mm;opacity:.85}</style><div class="pcs">${cards}</div>`, { bare: true });
}
function renderPost() {
  const box = $('post-shop');
  if (box) {
    const goods = D.products.filter(p => p.kind !== 'part');
    box.innerHTML = `<div class="row"><b>店に置くもの</b></div>
      <p class="k" style="margin:4px 0 10px">印刷して店頭に。色は下の「SNSに上げる画像」と同じ3種類から選べます。</p>
      <div class="ps-acts"><button class="btn ghost" type="button" id="ps-cards">値札カード(全商品・A4に8枚)</button>${sellFace() ? '<button class="btn ghost" type="button" id="ps-al">アレルゲン表</button>' : ''}
      <button class="btn ghost" type="button" id="ps-pop" ${PS.d ? '' : 'disabled'}>ポップ(A5)</button><button class="btn ghost" type="button" id="ps-notice" ${PS.d ? '' : 'disabled'}>お知らせの貼り紙(A4)</button></div>
      ${PS.d ? '' : '<p class="k" style="margin:6px 0 0">ポップと貼り紙は、下で案を作るとできます。</p>'}`;
    $('ps-cards').onclick = () => { if (!goods.length) { chat('商品がまだありません'); return; } priceCards(goods); };
    if ($('ps-al')) $('ps-al').onclick = () => show('label');
    $('ps-pop').onclick = async () => { await fontsReady(); const cv = document.createElement('canvas'); cv.width = 1748; cv.height = 2480; drawCard(cv, Object.assign(cardOpts('pop'), { photo: null })); printImage(cv, 'A5 portrait'); };
    $('ps-notice').onclick = async () => { await fontsReady(); const cv = document.createElement('canvas'); cv.width = 2480; cv.height = 3508; const o = cardOpts('notice'); drawCard(cv, Object.assign(o, { photo: null, catch: o.catch, sub: (PS.d && PS.d.notice) || o.sub, name: '' })); printImage(cv, 'A4 portrait'); };
  }
  $('post-p').innerHTML = '<option value="">商品から選ぶ</option>' + D.products.filter(p => p.kind !== 'part').map(p => `<option>${esc(p.name)}</option>`).join('');
  $('post-go').onclick = async () => {
    const sub = $('post-free').value.trim() || $('post-p').value; if (!sub) { chat('商品を選ぶか、テーマを書いてください'); return; }
    $('post-out').innerHTML = '<div class="card"><p class="k" style="margin:0">考えています…(10秒ほど)</p></div>'; chat('考えています…', 'think');
    const out = await api({ kind: 'app_gen', subject: sub });
    if (!out.ok) { $('post-out').innerHTML = ''; chat(out.error || 'うまく作れませんでした'); return; }
    const d = out.drafts; d.catch = d.catch || String(d.pop || '').split('\n')[0].slice(0, 14); d.sub = d.sub || ''; PS.d = d; PS.photo = null;
    const segs = (id, list, v) => `<div class="seg" id="${id}">${list.map(([k, l]) => `<button type="button" data-v="${k}" aria-pressed="${k === v}">${l}</button>`).join('')}</div>`;
    $('post-out').innerHTML = `<div class="card"><div class="row"><b>SNSに上げる画像</b></div>
      <p class="k" style="margin:4px 0 10px">商品の写真を入れると、写真の上に言葉がのります。保存してインスタやLINEにそのまま上げられます。</p>
      <div class="ps-grid"><div><canvas id="ps-cv" class="ps-cv" width="1080" height="1080" aria-label="SNS用の画像"></canvas></div>
      <div class="ps-ctl">${segs('ps-theme', Object.keys(THEMES).map(k => [k, THEMES[k].label]), PS.theme)}${segs('ps-size', [['sq', '正方形'], ['tall', '縦長']], PS.size)}
        <label class="btn ghost ps-photo">📷 写真を入れる<input type="file" id="ps-file" accept="image/*" hidden></label><button class="btn ghost" type="button" id="ps-nophoto" hidden>写真を外す</button>
        <span class="k">大きい言葉</span><input id="ps-catch" value="${esc(d.catch)}"><span class="k">小さい言葉</span><input id="ps-sub" value="${esc(d.sub)}">
        ${d.name ? `<label class="k" style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="ps-name" checked> 商品名と値段を入れる</label>` : ''}
        <div class="ps-acts"><button class="btn" type="button" id="ps-save">画像を保存</button><button class="btn ghost" type="button" id="ps-share" hidden>共有(インスタ・LINEへ)</button></div></div></div></div>
      ${[['インスタの投稿文', d.insta, 'insta'], ['ポップの文', d.pop, 'pop'], ['お知らせの文(LINEなど)', d.notice, 'notice']].map(([l, t, k]) => `<div class="card"><div class="row"><b>${l}</b><button class="btn ghost" type="button" data-cp="${k}">コピー</button></div><p class="draft" id="dr-${k}">${esc(t || '')}</p></div>`).join('')}`;
    const redraw = () => snsDraw();
    $('post-out').querySelectorAll('[data-cp]').forEach(b => b.onclick = async () => { try { await navigator.clipboard.writeText($('dr-' + b.dataset.cp).textContent); chat('コピーしました', 'heart'); } catch (e) { chat('長押しで選んでコピーしてください'); } });
    $('ps-theme').querySelectorAll('button').forEach(b => b.onclick = () => { PS.theme = b.dataset.v; store.set('pTheme', PS.theme); $('ps-theme').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); redraw(); });
    $('ps-size').querySelectorAll('button').forEach(b => b.onclick = () => { PS.size = b.dataset.v; $('ps-size').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); redraw(); });
    ['ps-catch', 'ps-sub'].forEach(id => $(id).oninput = redraw); if ($('ps-name')) $('ps-name').onchange = redraw;
    $('ps-file').onchange = e => { const f = e.target.files[0]; if (!f) return; const im = new Image(); im.onload = () => { PS.photo = im; $('ps-nophoto').hidden = false; redraw(); }; im.src = URL.createObjectURL(f); };
    $('ps-nophoto').onclick = () => { PS.photo = null; $('ps-nophoto').hidden = true; $('ps-file').value = ''; redraw(); };
    const fname = () => `${(d.name || 'post').replace(/[\\/:*?"<>|\s]/g, '')}_${PS.size === 'tall' ? '縦' : '正方形'}.png`;
    $('ps-save').onclick = async () => { const bl = await canvasBlob($('ps-cv')); const a = document.createElement('a'); a.href = URL.createObjectURL(bl); a.download = fname(); document.body.appendChild(a); a.click(); a.remove(); chat('画像を保存しました。投稿文は「コピー」で写せます', 'clap'); };
    if (navigator.canShare && navigator.canShare({ files: [new File([''], 'a.png', { type: 'image/png' })] })) {
      $('ps-share').hidden = false;
      $('ps-share').onclick = async () => { try { try { await navigator.clipboard.writeText(d.insta || ''); } catch (e) {} const bl = await canvasBlob($('ps-cv')); await navigator.share({ files: [new File([bl], fname(), { type: 'image/png' })], text: d.insta || '' }); chat('投稿文はコピーしてあります。貼り付けるだけです', 'heart'); } catch (e) {} };
    }
    await fontsReady(); redraw(); renderPost();
    chat('案と画像ができました。書かれていないことは足していません。', 'clap');
  };
}

// ---------- 右下に座るキャラ:ふだんはお茶を持って座り、ときどきしぐさ。押すと会話が開く ----------
const PACK = (p => ['tanuki', 'robot', 'op'].includes(p) ? p : 'tanuki')(store.get('pack', 'tanuki'));
// ロボットとオペレーターは丸い顔の絵(動きは小さくうなずくだけ)。たぬきはLINE絵文字のコマで動く
const STILL = PACK !== 'tanuki', FACE = { robot: 'robot', op: 'operator' }[PACK];
const ROLE = { greet: '1', heart: '3', clap: '7', point: '10', surprise: '12', think: '13', tea: '19', walk: '20', sleepy: '23', sleep: '24' };
const ch = $('chara'), say = $('say'), CS = () => ch.offsetWidth || 72;
let busy = false, talkT = null; const anim = { gen: 0, t: null };
function faceUrl(smile) { return PACK === 'op' ? 'url(operator.webp?v=1)' : `url(${FACE}${smile ? '_smile' : ''}.svg?v=1)`; }
function play(r, loop = true, speed = 1.3) {
  if (STILL) {
    const smile = ['greet', 'heart', 'clap'].includes(r); ch.style.backgroundImage = faceUrl(smile);
    ch.classList.remove('nod'); void ch.offsetWidth; ch.classList.add('nod');
    return new Promise(res => setTimeout(res, smile ? 1600 : 900));
  }
  const e = window.EMOJI && EMOJI[PACK][ROLE[r]]; if (!e) return Promise.resolve();
  clearTimeout(anim.t); const g = ++anim.gen; let f = 0; ch.style.backgroundImage = `url(${e.src})`;
  return new Promise(res => { const st = () => { if (g !== anim.gen) return; ch.style.backgroundPosition = `-${f * CS()}px 0`; f++; if (f >= +e.frames) { if (loop) f = 0; else { res(); return; } } anim.t = setTimeout(st, e.delay * speed); }; st(); if (loop) res(); });
}
// ふだんの姿で止める(たぬきはお茶の最初のコマ)
function rest() {
  clearTimeout(anim.t); ++anim.gen;
  if (STILL) { ch.style.backgroundImage = faceUrl(false); ch.classList.remove('nod'); return; }
  if (!window.EMOJI) return; const e = EMOJI[PACK][ROLE.tea]; ch.style.backgroundImage = `url(${e.src})`; ch.style.backgroundPosition = '0 0';
}
async function act(r, speed = 1.3) { if (busy) return; busy = true; try { await play(r, false, speed); } finally { busy = false; rest(); } }
if (STILL) { ch.classList.add('still'); rest(); }
setInterval(() => { if (!STILL && !busy && document.visibilityState === 'visible' && Math.random() < .4) { const acts = ['tea', 'tea', 'sleepy', 'think', 'greet']; act(acts[Math.floor(Math.random() * acts.length)], 1.7); } }, 10000);
function place() {}
// 画面の上に短く出る知らせ(記録しました、など)。キャラの吹き出しは会話用に残す
let toastT = null;
function toast(text, kind) {
  let t = $('toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.className = kind || ''; t.innerHTML = `<span class="tk"></span>${esc(text)}`; t.hidden = false; requestAnimationFrame(() => t.classList.add('on'));
  clearTimeout(toastT); toastT = setTimeout(() => { t.classList.remove('on'); setTimeout(() => t.hidden = true, 250); }, 2600);
}
function chat(text, role) {
  if (role) act(role, 1.3);
  if (!text) return;
  clearTimeout(talkT); say.textContent = text; say.hidden = false; talkT = setTimeout(() => say.hidden = true, 5200);
}
function hello() {
  const q = notices().length, u = D.ups.length, h = new Date().getHours();
  const g = h < 10 ? 'おはようございます。' : h < 17 ? '' : 'おつかれさまです。';
  return q ? `${g}確認待ちが${q}つ` + (u ? `(値上がり${u}つ)` : '') + 'あります。' : `${g}確認待ちはありません。`;
}
$('date').textContent = new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' });
addEventListener('resize', place);

// ---------- 聞く ----------
const sheet = $('sheet'), msgs = $('msgs'), qIn = $('q');
function faces() { const el = $('sface'); if (STILL) { el.style.backgroundImage = faceUrl(false); el.classList.add('still'); return; } if (!window.EMOJI) return; el.style.backgroundImage = `url(${EMOJI[PACK]['1'].src})`; el.style.backgroundPosition = '0 0'; rest(); }
// たぬきの絵(大きい)は画面が出たあとで読む
if (STILL) faces(); else (() => { const s = document.createElement('script'); s.src = 'emoji.js?v=18'; s.async = true; s.onload = faces; document.body.appendChild(s); })();
function addMsg(html, me) { const d = document.createElement('div'); d.className = 'm' + (me ? ' me' : ''); d.innerHTML = html; msgs.appendChild(d); d.scrollIntoView({ block: 'end', behavior: 'smooth' }); return d; }
function botSay(html, role) { const d = addMsg('…'); setTimeout(() => { d.innerHTML = html; d.scrollIntoView({ block: 'end', behavior: 'smooth' }); }, 120); if (role) chat(null, role); }
function openAsk() { if (!D) return; sheet.hidden = false; if (!msgs.children.length) botSay('何でも聞いてください。'); renderChips(); setTimeout(() => qIn.focus(), 100); }
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
// キャラとの会話は表の側(AI)で。つながらないときだけ、この画面の中の簡単な答えに切り替える
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
// 青い枠のカメラで撮って戻ってきたとき、キャラの答えを出す
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

// 画面の見出しに、その機能の色の印をつける
(() => { const M = { cost: 'cost', label: 'label', mat: 'mat', book: 'book', hyg: 'hyg', sales: 'sales', ws: 'ws', post: 'post', set: 'set' };
  for (const [t, k] of Object.entries(M)) { const h = document.querySelector(`#t-${t} .ph h1, #t-${t} > h1`); if (h && !h.querySelector('.hic')) h.insertAdjacentHTML('afterbegin', `<span class="hic" style="--c:var(--c-${k})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]}</svg></span>`); } })();
// ページの頭の、さがす欄とボタン
(() => {
  const filt = (inp, sel, key) => { const q = inp.value.trim().toLowerCase(); document.querySelectorAll(sel).forEach(el => { el.hidden = !!q && !(el.dataset[key] || el.textContent).toLowerCase().includes(q); }); };
  if ($('cost-q')) $('cost-q').oninput = () => filt($('cost-q'), '#costs .prod', 'name');
  if ($('mat-q')) $('mat-q').oninput = () => filt($('mat-q'), '#mats tr[data-m]', 'm');
  if ($('mat-add-top')) $('mat-add-top').onclick = () => matEdit(null);
  if ($('label-print-top')) $('label-print-top').onclick = () => { const b = $('lb-print'); if (b) { b.scrollIntoView({ behavior: 'smooth', block: 'center' }); b.click(); } };
  if ($('book-copy-top')) $('book-copy-top').onclick = () => { const b = $('sort-copy'); if (b) b.click(); else chat('まだ請求書がありません'); };
  if ($('hyg-print-top')) $('hyg-print-top').onclick = () => { const b = $('hyg-print'); if (b) b.click(); };
  if ($('ws-add-top')) $('ws-add-top').onclick = () => { const i = $('ws-to'); if (i) { i.scrollIntoView({ behavior: 'smooth', block: 'center' }); i.focus(); } };
})();
// ---------- はじまり ----------
// パソコンの広い画面で左右2列に分けるための入れ物(ケイタイでは入れ物がないのと同じ)
(() => {
  const SPLIT = { book: 'h1.sub', hyg: 'h1.sub', sales: '#sales-add', ws: '#ws-chips', post: '#post-out', set: '#bank-h' };
  for (const [t, sel] of Object.entries(SPLIT)) {
    const sec = $('t-' + t), kids = [...sec.children], lead = sec.querySelector(':scope > .ph') || sec.querySelector(':scope > .lead'), cut = sec.querySelector(':scope > ' + sel);
    if (!cut) continue;
    const body = kids.slice(kids.indexOf(lead) + 1), ci = body.indexOf(cut);
    const cols = document.createElement('div'), L = document.createElement('div'), R = document.createElement('div');
    cols.className = 'cols'; L.className = 'colL'; R.className = 'colR';
    body.slice(0, ci).forEach(k => L.appendChild(k)); body.slice(ci).forEach(k => R.appendChild(k));
    cols.append(L, R); sec.appendChild(cols);
  }
})();
if (CF) { $('words-h').textContent = '話しかけられる言葉'; $('ct-via').textContent = '「問い合わせ 〜」と話しかけてもOK'; }
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
