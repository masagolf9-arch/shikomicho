// ピタット原価 管理画面(LINEの中でも、パソコンのブラウザでも開ける)
// データは Google の記録の表から読む。見られるのは「メンバー」シートで許可された人だけ。
// 確かめる窓(confirm・alert)を画面の中に出す。ブラウザによっては確認の窓が出ず「キャンセル」扱いになり、押しても動かなくなるため(11/19)。
// 確認したい操作は一度止めて画面の中で聞き、「OK」なら同じ操作をもう一度流す
(function(){var last=null,ok={};
function rec(e){var t=e.target;if(!t||!t.closest||t.closest('#cf-ov'))return;last={el:t,type:e.type,checked:t.checked,value:t.value,at:Date.now()}}
document.addEventListener('click',rec,true);document.addEventListener('change',rec,true);
function box(msg,yesNo,ev){var o=document.getElementById('cf-ov');if(o)o.remove();o=document.createElement('div');o.id='cf-ov';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');
 o.style.cssText='position:fixed;inset:0;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;z-index:2147483000;padding:16px';
 o.innerHTML='<div style="background:#fff;color:#1f2937;border-radius:14px;max-width:440px;width:100%;padding:20px 20px 16px;box-shadow:0 10px 30px rgba(0,0,0,.25);font-size:15px;line-height:1.7"><p style="margin:0 0 16px;white-space:pre-wrap"></p><div style="display:flex;gap:8px;justify-content:flex-end">'+(yesNo?'<button type="button" data-n style="padding:10px 16px;border-radius:10px;border:1px solid #cbd5e1;background:#fff;color:#1f2937;font:inherit;cursor:pointer">キャンセル</button>':'')+'<button type="button" data-y style="padding:10px 20px;border-radius:10px;border:0;background:#1a5fa0;color:#fff;font:inherit;font-weight:700;cursor:pointer">OK</button></div></div>';
 o.querySelector('p').textContent=msg;document.body.appendChild(o);var y=o.querySelector('[data-y]'),n=o.querySelector('[data-n]');y.focus();
 var close=function(){o.remove();document.removeEventListener('keydown',kd)},kd=function(e){if(e.key==='Escape')close()};document.addEventListener('keydown',kd);
 if(n)n.onclick=close;
 y.onclick=function(){close();if(!yesNo||!ev||!document.contains(ev.el))return;ok[msg]=Date.now();var el=ev.el;
  if(ev.type==='change'){if(el.type==='checkbox'||el.type==='radio')el.checked=ev.checked;else el.value=ev.value;el.dispatchEvent(new Event('change',{bubbles:true}))}else el.click()}}
window.confirm=function(msg){msg=String(msg==null?'':msg);if(ok[msg]&&Date.now()-ok[msg]<30000){delete ok[msg];return true}box(msg,true,last&&Date.now()-last.at<5000?last:null);return false};
window.alert=function(msg){box(String(msg==null?'':msg),false,null)};
})();
const LIFF_ID = '2012003912-ltVppjVx';
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxShAkcy1uEzK5ZUGWgW8lzdFBcd8baDNKjHwGKCBx7ocrEUNDHmzrSFdrZDikqL2VO/exec';
const CAMERA_URL = 'https://liff.line.me/' + LIFF_ID;
// 公式ホームページ(Cloudflare)から開いたときは、そちらの蔵とやりとりする。LINEの外ならログインの鍵で入る
const CF = location.hostname !== 'masagolf9-arch.github.io';
const IN_LINE = /\bLine\//i.test(navigator.userAgent);
// 画面の案内文: ホームページでは「撮る」「話す」を案内する(LINEは、お知らせが届く場所)
const CAMTXT = CF ? '「撮影」' : 'LINEの「📷 写真を撮る」', VIA = CF ? 'AIに' : 'LINEで', SHOT = CF ? '「撮影」で' : 'LINEで';

const $ = id => document.getElementById(id);
const store = { get(k, d) { try { const v = localStorage.getItem('shikomi:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
                set(k, v) { try { localStorage.setItem('shikomi:' + k, JSON.stringify(v)); } catch (e) {} } };
// お店のデータ(原価・売上など)は端末に残さない: 画面を閉じたら消える置き場(sessionStorage)にだけ置く。前の版が端末に残した控えは消す(2026-11-16)
const cache = { get() { try { const v = sessionStorage.getItem('shikomi:data'); return v == null ? null : JSON.parse(v); } catch (e) { return null; } },
                set(v) { try { if (v == null) sessionStorage.removeItem('shikomi:data'); else sessionStorage.setItem('shikomi:data', JSON.stringify(v)); } catch (e) {} } };
try { localStorage.removeItem('shikomi:data'); } catch (e) {}
// ログアウトしたら、画面を閉じたら消える置き場もその場で空にする
document.addEventListener('submit', e => { if (e.target && /\/auth\/logout$/.test(e.target.action || '')) cache.set(null); }, true);
// 見え方の設定(この端末だけ)
const applyLook = () => { const th = store.get('theme', 'auto'); if (th === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', th); document.body.style.zoom = store.get('size', 'normal') === 'big' ? '1.15' : ''; document.documentElement.style.setProperty('--cs', ({ s: 60, m: 72, l: 88 })[store.get('csize', 'm')] + 'px'); };
applyLook();
let U = '個';
// 商品ごとの数え方(個・人前・杯など)。商品に入れていなければ店舗の数え方
const PU = p => (p && p.unitw) || U;
const yen = n => Math.round(n).toLocaleString('ja-JP') + '円';
const amt = (v, u) => u === '枚' ? v.toLocaleString('ja-JP') + '枚' : v >= 1000 ? (Math.round(v / 100) / 10).toLocaleString('ja-JP') + 'kg' : Math.round(v) + 'g';
const yen1 = n => (Math.round(n * 10) / 10).toLocaleString('ja-JP') + '円';
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let D = null, idToken = null, profileName = '';

// ---------- 記録の表とのやり取り ----------
// 画面で直した時間(撮るだけの数字): 前に直してから・画面を移ってからの、見ていた時間(5分まで)。写真から入ったものを直したときだけ数に入る
const EDT = { acc: 0, since: Date.now() };
function editTimeReset() { EDT.acc = 0; EDT.since = document.hidden ? 0 : Date.now(); }
function editTimeTake() { const now = Date.now(), sec = Math.min(300, Math.round((EDT.acc + (EDT.since ? now - EDT.since : 0)) / 1000)); editTimeReset(); return sec; }
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (EDT.since) EDT.acc += Date.now() - EDT.since; EDT.since = 0; } else EDT.since = Date.now(); });
async function api(body) {
  if (body && body.kind === 'app_set' && body.sortSec == null && !$('sort-ov')) body = Object.assign({}, body, { sortSec: editTimeTake() });
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
      if (out.error === 'removed') { cache.set(null); D = null; document.querySelectorAll('section').forEach(s => s.hidden = true); return state('<b>この店舗のメンバーから外れています。</b><br>お心当たりがない場合は、店主にご確認ください。' + (CF && !IN_LINE ? '<form method="post" action="/auth/logout" style="margin-top:12px"><button class="btn ghost">ログアウト</button></form>' : '')); }
      if (out.error === 'wait' || out.error === 'login') { cache.set(null); if (D) { D = null; document.querySelectorAll('section').forEach(s => s.hidden = true); } }
      if (out.error === 'wait') return state('<b>店主の承認待ちです。</b><br>店主のLINEに閲覧の申請をお送りしました。<br>店主が承認した後、もう一度開いてください。<br><button class="btn ghost" onclick="load()">再読み込み</button>');
      if (out.error === 'login' && CF && !IN_LINE) { location.href = '/login?next=' + encodeURIComponent(location.pathname); return; }
      if (out.error === 'login') { liff.logout(); return state('ログインし直してください。<br><button class="btn" onclick="location.reload()">ログイン</button>'); }
      if (out.error === 'noshop') return state('<b>店舗に登録されていません。</b><br>店舗から届いた招待リンクを開いてください。<br><form method="post" action="/auth/logout" style="margin-top:12px"><button class="btn ghost">別の方法で再ログイン</button></form>');
      return state(esc(out.error));
    }
    const first = !D; D = out.data; MLOCK = D.mlock || null; cache.set(D); state(''); renderAll(); if (first) { show(store.get('tab', 'today'), true); setTimeout(() => showHints(cur), 800); } else show(cur, true, true);
    if (first) setTimeout(() => chat(hello(), 'greet'), 250);
    if (first) setTimeout(loadSup, 1500);   // 担当からのお返事があれば、設定に印
    if (CF && !window.__acct) { window.__acct = 1; renderAccount(); }
    if (CF) showShot();
  } catch (e) {
    if (D) { chat('通信状態が不安定なため、前回読み込んだ内容を表示しています'); return; }
    state('読み込めませんでした。通信状態のよい場所で、もう一度お試しください。<br><button class="btn ghost" onclick="load()">再読み込み</button>');
  }
}
async function setValue(product, field, value) {
  const out = await api({ kind: 'app_set', product, field, value });
  if (!out.ok) { toast(out.error || '記録できませんでした', 'ng'); return; }
  D = out.data; renderAll(); toast('記録しました。原価に反映しました。', 'ok'); act('heart', 1.3);
}
function openCamera() {
  if (CF) {
    // ケイタイ: 青い枠のカメラへ(撮ったら、この画面に戻ってキャラが答える)/ パソコン: 写真を選ぶ
    if (matchMedia('(pointer:coarse)').matches) { location.href = (IN_LINE ? '/l/' : '/camera/') + '?back=' + encodeURIComponent(location.pathname); return; }
    webPhoto(); return;
  }
  if (window.liff && liff.isInClient && liff.isInClient()) liff.openWindow({ url: CAMERA_URL, external: false });
  else chat('写真は、スマートフォンのLINEで「📷 写真を撮る」から送信してください。', 'point');
}

// ---------- きょう ----------
function notices() {
  const list = [];
  // 運営からのお知らせ(「読みました」を押すまで出す。読んだものはこの端末に覚える)
  let annDone = []; try { annDone = JSON.parse(localStorage.getItem('annDone') || '[]'); } catch (e) {}
  (D.anns || []).filter(a => !annDone.includes(a.id)).forEach(a => list.push({ type: a.important ? 'up' : 'q', html: `<p><b>${esc(a.kind)}: ${esc(a.title)}</b> <span class="k">${new Date(a.at).getMonth() + 1}/${new Date(a.at).getDate()} 運営より</span></p><p style="margin:4px 0;white-space:pre-wrap">${esc(a.body)}</p><div class="ask"><button class="btn ghost sm" type="button" data-ann-ok="${esc(a.id)}">確認しました</button></div>` }));
  if (D.opsNotice) list.push({ type: 'q', html: `<p><b>お支払いについて</b></p><p class="k">${esc(D.opsNotice)}</p>` });   // 運営からのお知らせ(店主だけ)
  for (const u of D.ups) list.push({ type: 'up', html: `<p><b>${esc(u.item)}が値上がり</b></p><p class="k">${esc(u.supplier)} ${esc(u.spec)} ${u.old.toLocaleString()}円 → ${u.now.toLocaleString()}円(+${u.pct}%)</p><div class="ask"><button class="btn ghost" type="button" data-go-mat="up">材料の単価を見る</button><button class="btn ghost" type="button" data-go-cost>原価を見る</button></div>` });
  const needPw = D.products.filter(p => !p.pw);
  if (needPw.length) list.push({ type: 'q', html: `<p><b>1${U}あたりの重さ(${needPw.length}品)</b></p><p class="k">重さを入力すると、1仕込みの個数と1個あたりの原価を計算します。分かる商品だけご入力ください。</p>` +
    needPw.map((p, i) => `<div class="ask pwrow"><span class="pwn" title="${esc(p.name)}">${esc(p.name)}</span><input id="pw-${i}" inputmode="decimal" placeholder="例 40" aria-label="${esc(p.name)}の1${U}の重さ"><span class="k">g</span><button class="btn ghost" data-pw="${i}" type="button">決定</button></div>`).join('') });
  // 材料の確認は、1件ずつの札にせず、種類ごとに1枚のカードにまとめる(11/19 確認の手間を減らす)
  const noPrice = new Set(), unknown = new Set(); D.products.forEach(p => { const np = p.noPrice || []; p.unknown.forEach(n => (np.includes(n) || D.materials.some(m => m.name === n) ? noPrice : unknown).add(n)); });
  const matNames = D.materials.filter(m => !m.packaging).map(m => m.name), SH0 = D.starterHints || {};
  // 手書きの読みちがい(デトラップ/テトラップ)や、かっこ書き(薄力粉(ロマン))でも、似た材料を先に選んでおく
  const loose = x => String(x || '').normalize('NFD').replace(/[゙゚]/g, '').normalize('NFC').replace(/[（(【\[][^）)】\]]*[）)】\]]/g, '').replace(/[\s・]/g, '').replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60)).toLowerCase();
  const guess = n => { const k = loose(n); if (!k) return ''; const m = D.materials.find(m => !m.packaging && [m.name].concat(m.aliases || []).some(a => loose(a) === k)); return m ? m.name : ''; };
  const usedIn = n => D.products.filter(p => p.unknown.includes(n) || (p.label.check || []).includes(n)).map(p => p.name);
  const forTxt = n => { const u = usedIn(n); return u.length ? `<span class="k">${esc(u.slice(0, 3).join('・'))}${u.length > 3 ? ' ほか' : ''}</span>` : ''; };
  if (unknown.size) {
    const rows = [...unknown].map((n, i) => { const g = guess(n), st = SH0[n];
      return `<div class="mq-row"><div class="mq-h"><b>${esc(n)}</b>${forTxt(n)}</div>
      ${st ? `<div class="ask"><button class="btn sm" type="button" data-unk-st="${esc(n)}">「${esc(st[0])}」として登録</button><span class="k">表示: ${esc(st[1])}${st[2] ? '・アレルゲン: ' + esc(st[2]) : ''}</span></div>` : ''}
      <div class="ask"><select id="unk-${i}" class="mq-sel" aria-label="「${esc(n)}」と同じ材料"><option value="">登録済みの材料から選ぶ…</option>${matNames.map(m => `<option${m === g ? ' selected' : ''}>${esc(m)}</option>`).join('')}</select><button class="btn ghost sm" type="button" data-unk-same="${i}" data-n="${esc(n)}">同じ材料にする</button><button class="btn ghost sm" type="button" data-unk-new="${esc(n)}">新しく登録</button></div></div>`; }).join('');
    list.push({ type: 'q', html: `<p><b>未登録の材料 ${unknown.size}種</b></p><p class="k">レシピの材料名が材料一覧に見つかりません。「名前をまとめて照合」を押すと、表記の異なる材料(Soft Mix とソフトMix など)をAIがまとめて照合します。残った材料のみ選択してください。</p>
      <div class="ask"><button class="btn" type="button" id="unk-ai">名前をまとめて照合</button></div><div class="mq">${rows}</div>` });
  }
  if (noPrice.size) list.push({ type: 'q', html: `<p><b>単価が未登録の材料 ${noPrice.size}種</b></p><p class="k">請求書を撮影すると自動で登録されます。分かる材料は、購入金額と量をご入力ください。</p>
    <div class="mq">${[...noPrice].map(n => `<div class="mq-row"><div class="mq-h"><b>${esc(n)}</b>${forTxt(n)}</div>${unkForm(n)}</div>`).join('')}</div>` });
  const check = new Set(); D.products.forEach(p => p.label.check.forEach(n => { if (!unknown.has(n)) check.add(n); }));
  if (check.size) list.push({ type: 'q', html: `<p><b>裏面表示の撮影が必要な材料 ${check.size}種</b></p><p class="k">業務用の商品など、原材料とアレルゲンが不明な材料です。袋の裏面(名称・原材料名の欄)を撮影すると、食品表示が確定します。続けて複数枚撮影できます。</p>
    <div class="mq">${[...check].map(n => `<div class="mq-row mq-1"><div class="mq-h"><b>${esc(n)}</b>${forTxt(n)}</div></div>`).join('')}</div><div class="ask"><button class="btn" type="button" data-cam>裏面表示を撮影</button></div>` });
  if (!D.products.length) list.push({ type: 'q', cam: true, html: '<p><b>まずはレシピを1枚撮影してください</b></p><p class="k">' + CAMTXT + 'で手書きのレシピを撮影すると、ここに原価と食品表示の案が表示されます</p>' });
  return list;
}
// 組み合わせて1個にする(生ドラ = 生地 + 生クリーム + 餡)。撮った配合は「〇〇の生地」(半製品)になる
function composeHtml(p) {
  const fromMode = !p.composed, partName = p.name + 'の生地';
  const rows = fromMode ? [[partName, ''], ['', ''], ['', '']] : p.rows.map(r => [r.name, r.grams]);
  const row = (n, g, first, ph) => `<div class="ask cmp-row" style="flex-wrap:nowrap"><input class="cmp-n" list="cmp-list" value="${esc(n)}" placeholder="${ph || '例 生クリーム'}" aria-label="使うもの"${first && fromMode ? ' readonly' : ''} style="flex:1;min-width:0"><input class="cmp-g" inputmode="decimal" value="${g || ''}" placeholder="g" aria-label="1個に使う量" style="width:4.5em"><span class="k">g</span></div>`;
  return `<div style="margin-top:12px"><button class="btn ghost" type="button" data-cmp-open="${esc(p.name)}">${fromMode ? '生地・クリーム・餡を組み合わせて1個にする' : '組み合わせを編集'}</button>
    <div class="cmp card" data-cmp="${esc(p.name)}" data-from="${fromMode ? 1 : ''}" hidden style="margin-top:8px">
    <p class="k" style="margin:0 0 8px">${fromMode ? `撮った配合を「生地」として使い、1個に使う量で「${esc(p.name)}」を作り直します。生地は焼く前の重さで(皮2枚なら2枚分)。` : '1個に使うものと量を直します。'}</p>
    ${fromMode ? `<label class="k">撮った配合の新しい名前(半製品になります)<input class="cmp-part" value="${esc(partName)}" style="width:100%;box-sizing:border-box;font:inherit;font-size:16px;padding:12px 12px;border:1.5px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink);margin-top:4px"></label>` : ''}
    <div class="cmp-rows">${rows.map((r, j) => row(r[0], r[1], j === 0, ['', '例 生クリーム', '例 粒あん'][j])).join('')}</div>
    <div class="ask"><button class="btn ghost sm" type="button" data-cmp-add>＋ 行を追加</button><button class="btn" type="button" data-cmp-go>${fromMode ? 'この内容で作成' : '編集を保存'}</button></div>
    <p class="k" style="margin:8px 0 0">餡やクリームも、配合を撮影すると半製品として選択できます。単価が未登録の材料は、後から単価を入力すると原価に反映されます。</p></div></div>`;
}
function bindCompose(root) {
  if (!document.getElementById('cmp-list')) document.body.insertAdjacentHTML('beforeend', '<datalist id="cmp-list"></datalist>');
  $('cmp-list').innerHTML = D.products.filter(p => p.kind === 'part').map(p => p.name).concat(D.materials.filter(m => !m.packaging).map(m => m.name)).map(n => `<option value="${esc(n)}">`).join('');
  root.querySelectorAll('[data-cmp-open]').forEach(b => b.onclick = () => { const f = root.querySelector(`.cmp[data-cmp="${CSS.escape(b.dataset.cmpOpen)}"]`); f.hidden = !f.hidden; });
  root.querySelectorAll('.cmp').forEach(f => {
    const part = f.querySelector('.cmp-part'); if (part) part.oninput = () => { f.querySelector('.cmp-n').value = part.value; };
    f.querySelector('[data-cmp-add]').onclick = () => { const r = f.querySelector('.cmp-row').cloneNode(true); r.querySelectorAll('input').forEach(i => { i.value = ''; i.readOnly = false; }); f.querySelector('.cmp-rows').appendChild(r); };
    f.querySelector('[data-cmp-go]').onclick = () => {
      const items = [...f.querySelectorAll('.cmp-row')].map(r => [r.querySelector('.cmp-n').value.trim(), parseFloat(r.querySelector('.cmp-g').value)]).filter(x => x[0] && x[1] > 0);
      if (!items.length) { f.querySelector('.cmp-g').focus(); return; }
      setValueX({ field: 'compose', value: { name: f.dataset.cmp, from: f.dataset.from ? f.dataset.cmp : '', partName: part ? part.value.trim() : '', items } });
    };
  });
}
// まだ表にない材料の値段を、その場で入れる(種類などは後で)。入れるとすぐ原価に入る
const unkForm = n => `<div class="ask unkf" data-n="${esc(n)}"><span class="k" style="min-width:auto">購入金額</span><input class="uq-yen" inputmode="numeric" placeholder="800" aria-label="「${esc(n)}」の購入金額" style="width:5.5em"><span class="k">円 ／ 量</span><input class="uq-q" inputmode="decimal" placeholder="1" aria-label="購入した量" style="width:4em"><select class="uq-u" aria-label="量の単位" style="font:inherit;font-size:15px;padding:8px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink)"><option>kg</option><option>g</option></select><button class="btn ghost" type="button" data-uq>登録</button></div>`;
function bindUnk(root) {
  root.querySelectorAll('[data-uq]').forEach(b => b.onclick = () => {
    const f = b.closest('.unkf'), y = parseFloat(f.querySelector('.uq-yen').value), q = parseFloat(f.querySelector('.uq-q').value), u = f.querySelector('.uq-u').value;
    if (!(y > 0)) { f.querySelector('.uq-yen').focus(); return; }
    if (!(q > 0)) { f.querySelector('.uq-q').focus(); return; }
    const kg = u === 'kg' ? q : q / 1000;
    const has = D.materials.some(m => m.name === f.dataset.n);
    setValueX(has ? { field: 'mat', name: f.dataset.n, value: { ppkg: Math.round(y / kg) } } : { field: 'mat', name: f.dataset.n, create: true, value: { ppkg: Math.round(y / kg) } });
  });
}
function renderToday() {
  const list = notices();
  $('notices').innerHTML = list.length ? list.map(n => `<div class="card notice"><span class="mark ${n.type}">${n.type === 'up' ? '↑' : '?'}</span><div style="flex:1;min-width:0">${n.html}${n.cam ? '<div class="ask"><button class="btn ghost" type="button" data-cam>撮影する</button></div>' : ''}</div></div>`).join('')
    : '<div class="card notice"><span class="mark done">✓</span><div><p>確認待ちはありません。</p></div></div>';
  const needPw = D.products.filter(p => !p.pw);
  $('notices').querySelectorAll('[data-pw]').forEach(b => b.onclick = () => {
    const i = b.dataset.pw, inp = $('pw-' + i), v = parseFloat(inp.value);
    if (!(v > 0)) { inp.focus(); return; }
    setValue(needPw[i].name, 'pw', v);
  });
  $('notices').querySelectorAll('[data-cam]').forEach(b => b.onclick = openCamera);
  $('notices').querySelectorAll('[data-ann-ok]').forEach(b => b.onclick = () => { let d = []; try { d = JSON.parse(localStorage.getItem('annDone') || '[]'); } catch (e) {} d.push(b.dataset.annOk); try { localStorage.setItem('annDone', JSON.stringify(d.slice(-100))); } catch (e) {} api({ kind: 'app_ann_seen', id: b.dataset.annOk }).catch(() => {}); renderToday(); });
  bindUnk($('notices'));
  $('notices').querySelectorAll('[data-chk-ok]').forEach(b => b.onclick = () => setValueX({ field: 'check', value: { row: +b.dataset.chkOk, ok: true } }));
  $('notices').querySelectorAll('[data-chk-re]').forEach(b => b.onclick = async () => { await setValueX({ field: 'check', value: { row: +b.dataset.chkRe, ok: false } }); openCamera(); });
  $('notices').querySelectorAll('[data-go-mat]').forEach(b => b.onclick = () => { matF = b.dataset.goMat; show('mat'); });
  $('notices').querySelectorAll('[data-go-cost]').forEach(b => b.onclick = () => show('cost'));
  $('notices').querySelectorAll('[data-unk-same]').forEach(b => b.onclick = () => { const sel = $('unk-' + b.dataset.unkSame); if (!sel.value) { sel.focus(); chat('一覧から材料を選択してください'); return; } setValueX({ field: 'mat', name: sel.value, value: { alias: b.dataset.n } }); });
  $('notices').querySelectorAll('[data-unk-new]').forEach(b => b.onclick = () => { show('mat', true); setTimeout(() => matEdit(null, { name: b.dataset.unkNew }), 100); });
  $('notices').querySelectorAll('[data-unk-st]').forEach(b => b.onclick = () => setValueX({ field: 'matstarter', name: b.dataset.unkSt }));
  if ($('unk-ai')) $('unk-ai').onclick = async () => { const b = $('unk-ai'); b.disabled = true; b.textContent = '照合しています…'; await setValueX({ field: 'matmatch' }); };
  const q = list.length; const bd = $('badge'); bd.textContent = q; bd.hidden = !q;
  const up0 = unpaid(), bb = $('badge-book'); bb.textContent = up0.length; bb.hidden = !up0.length;
  const hm0 = hygMissing().length, bh = $('badge-hyg'); bh.textContent = hm0; bh.hidden = !hm0;
  renderHero(q); renderMenu(q); renderGreet(); renderHomeProds();
  renderA2hs(); renderTodo(list); renderStart(); renderMemos(); renderPromises(); renderInspect(); renderHomeEvents(); renderBar(); renderCal(); renderReg(); renderCt();
  if ($('made')) $('made').innerHTML = D.made.length ? `<ul class="tl">${D.made.map(m => `<li><span class="tt">${new Date(m.t).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}</span><span>${esc(m.text)}</span></li>`).join('')}</ul>`
    : '<p class="k" style="margin:0">記録はまだありません。製造数をAIに入力すると、ここに表示されます</p>';
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
  if (IN_LINE) how = `<p class="k" style="margin:4px 0 8px">LINEの画面からはホーム画面に追加できません。下のボタンで標準のブラウザを開き、そちらから追加してください。</p><a class="btn" id="a2hs-ext" href="${esc(ext)}" style="text-decoration:none">ブラウザで開く</a>`;
  else if (android || ios || a2hsEvt) how = `<p style="margin:12px 0 0"><button class="btn" type="button" id="a2hs-go" style="font-size:16px;padding:12px 24px">ホーム画面に追加</button></p>`;
  else if (ios) how = `<ol class="k" style="margin:4px 0 0;padding-left:1.3em;line-height:1.9"><li>画面の下(または上)の <b>共有ボタン</b>(四角に上向きの矢印)を押す</li><li><b>「ホーム画面に追加」</b>を押す</li><li>右上の<b>「追加」</b>を押す</li></ol>`;
  else how = `<p class="k" style="margin:4px 0 0">ブラウザのメニューから「ホーム画面に追加」を選んでください。</p>`;
  box.hidden = false;
  box.innerHTML = `<div style="display:flex;gap:12px;align-items:flex-start"><img src="icon-192.png" alt="" width="44" height="44" style="border-radius:10px;flex:0 0 44px"><div style="flex:1;min-width:0"><b>ホーム画面にピタット原価を追加</b><p class="k" style="margin:4px 0 0">次回からはアイコンを押すだけで、LINEを経由せずにこの画面が開きます。</p>${how}<p style="margin:8px 0 0"><a href="#" id="a2hs-no" class="k" style="color:var(--accent)">後で</a></p></div></div>`;
  const go = $('a2hs-go'); if (go) go.onclick = async () => {
    if (a2hsEvt) { const ev = a2hsEvt; ev.prompt(); const r = await ev.userChoice.catch(() => null); a2hsEvt = null; if (r && r.outcome === 'accepted') { store.set('a2hsHide', 1); box.hidden = true; toast('ホーム画面に追加しました', 'ok'); } return; }
    a2hsHelp();
  };
  const ex = $('a2hs-ext'); if (ex) ex.onclick = async e => {   // LINEの中(LIFF)では、リンクでは標準のブラウザに出られないので LIFF で開く(まだLIFFを始めていなければ始める)
    e.preventDefault(); const url = location.origin + location.pathname.replace(/^\/l\//, '/');
    if (!(await openOutside(url))) location.href = ex.href;
  };
  $('a2hs-no').onclick = e => { e.preventDefault(); store.set('a2hsHide', 1); box.hidden = true; };
}
// 「ホーム画面に置く」を押したのに、ブラウザが自動で置いてくれないとき: 1つずつ、絵つきで案内する
function a2hsHelp() {
  const ov = document.createElement('div');
  ov.className = 'a2ov';
  const iosSteps = [
    { t: '追加済みかどうかをご確認ください', b: 'スマートフォンのホーム画面(アプリが並ぶ画面)に「ピタット原価」のアイコンがあるかご確認ください。別のページにある場合もあります。' },
    { t: 'ない場合: 共有ボタンを押します', b: '画面の<b>下部中央</b>にある、<b>四角から上向きの矢印が出ているボタン</b>を押してください。<br><span class="k">見当たらない場合は、右下の「…」を押すと「共有」が表示されます。</span>', img: 'a2hs_ios_1.webp?v=2' },
    { t: '「ホーム画面に追加」を押します', b: '表示された一覧を上にスクロールし、<b>「ホーム画面に追加」</b>を押してください。', img: 'a2hs_ios_2.webp?v=2' },
    { t: '最後に右上の「追加」を押します', b: '右上の<b>「追加」</b>を押します。<br>スマートフォンのホーム画面に「ピタット原価」のアイコンが追加されます。', img: 'a2hs_ios_3.webp?v=2' }];
  const pcSteps = [
    { t: 'パソコンにピタット原価を追加', b: '<b>Chrome</b>または<b>Edge</b>で開いている場合に追加できます。アドレスバーの右端にある<b>「インストール」ボタン</b>(画面に下向きの矢印)を押し、確認画面で<b>「インストール」</b>を押してください。', img: 'a2hs_pc_1.webp?v=2' },
    { t: 'ボタンが表示されない場合', b: '右上の <b>︙</b> を押して、<b>「キャスト、保存、共有」</b>→<b>「ページをアプリとしてインストール」</b>を押します。<br><span class="k">Edgeの場合は、右上の「…」→「アプリ」→「このサイトをアプリとしてインストール」を選びます。Macの Safari の場合は、メニューの「ファイル」→「Dockに追加」を選びます。</span>', img: 'a2hs_pc_2.webp?v=2' },
    { t: '完了', b: 'デスクトップやタスクバーに「ピタット原価」のアイコンが追加されます。アイコンを押すと、ピタット原価が専用の画面で開きます。', img: 'a2hs_pc_3.webp?v=2' }];
  const isPc = !matchMedia('(pointer:coarse)').matches;
  const steps = isPc ? pcSteps : /iPhone|iPad|iPod/.test(navigator.userAgent) ? iosSteps : [
    { t: '追加済みかどうかをご確認ください', b: '以前に「インストール」を押している場合は、すでに追加されています。スマートフォンのホーム画面(アプリが並ぶ画面)に「ピタット原価」のアイコンがあるかご確認ください。別のページにある場合もあります。', pic: '' },
    { t: 'ない場合: メニュー(縦に3つの点)を押します', b: '画面の<b>右下</b>(機種によっては<b>右上</b>)にある <b style="font-size:20px">︙</b> を押してください。', img: 'a2hs_1.webp?v=2' },
    { t: '「ショートカット作成」を押します', b: '表示された一覧から<b>「ショートカット作成」</b>を押します。<br><span class="k">機種によっては<b>「ホーム画面に追加」「アプリをインストール」「ページを追加」</b>と書いてあります。どれか1つがあれば、それを押してください。</span>', img: 'a2hs_2.webp?v=2' },
    { t: '最後に「追加」を押します', b: '確認画面が表示されたら<b>「追加」</b>(または「OK」「インストール」)を押します。<br>スマートフォンのホーム画面に「ピタット原価」のアイコンが追加されます。', img: 'a2hs_3.webp?v=2' }];
  let i = 0;
  const PIC = {
    dots: `<svg viewBox="0 0 240 150" width="240" height="150" aria-hidden="true"><rect x="20" y="6" width="200" height="138" rx="16" fill="#fff" stroke="#c9d3df" stroke-width="3"/><rect x="34" y="18" width="172" height="20" rx="10" fill="#eef2f7"/><circle cx="198" cy="28" r="3" fill="#555"/><circle cx="198" cy="20" r="3" fill="#555"/><circle cx="198" cy="36" r="3" fill="#555"/><rect x="34" y="112" width="172" height="20" rx="6" fill="#eef2f7"/><circle cx="196" cy="114" r="3" fill="#555"/><circle cx="196" cy="122" r="3" fill="#555"/><circle cx="196" cy="130" r="3" fill="#555"/><circle cx="198" cy="28" r="14" fill="none" stroke="#e2531c" stroke-width="4"/><circle cx="196" cy="122" r="14" fill="none" stroke="#e2531c" stroke-width="4"/><text x="120" y="80" font-size="14" text-anchor="middle" fill="#8a94a3">上か下の右はし</text></svg>`,
    menu: `<svg viewBox="0 0 240 150" width="240" height="150" aria-hidden="true"><rect x="60" y="6" width="160" height="138" rx="12" fill="#fff" stroke="#c9d3df" stroke-width="3"/><rect x="74" y="20" width="110" height="10" rx="5" fill="#e3e8ef"/><rect x="74" y="42" width="90" height="10" rx="5" fill="#e3e8ef"/><rect x="68" y="60" width="144" height="28" rx="8" fill="#fff4e8" stroke="#e2531c" stroke-width="3"/><text x="140" y="79" font-size="14" text-anchor="middle" fill="#b23d0f" font-weight="700">ホーム画面に追加</text><rect x="74" y="100" width="100" height="10" rx="5" fill="#e3e8ef"/><rect x="74" y="120" width="80" height="10" rx="5" fill="#e3e8ef"/></svg>`,
    done: `<svg viewBox="0 0 240 150" width="240" height="150" aria-hidden="true"><rect x="70" y="6" width="100" height="138" rx="16" fill="#fff" stroke="#c9d3df" stroke-width="3"/><rect x="86" y="24" width="20" height="20" rx="5" fill="#e3e8ef"/><rect x="110" y="24" width="20" height="20" rx="5" fill="#e3e8ef"/><rect x="134" y="24" width="20" height="20" rx="5" fill="#e3e8ef"/><rect x="86" y="54" width="20" height="20" rx="5" fill="#185fa5"/><rect x="91" y="59" width="10" height="11" fill="none" stroke="#fff" stroke-width="2"/><text x="96" y="88" font-size="7" text-anchor="middle" fill="#333">ピタット原価</text><circle cx="96" cy="64" r="17" fill="none" stroke="#e2531c" stroke-width="3"/></svg>`
  };
  const draw = () => {
    const s0 = steps[i];
    ov.innerHTML = `<div class="a2card" role="dialog" aria-modal="true"><div class="k" style="margin-bottom:8px">${i + 1} / ${steps.length}</div><h3 style="margin:0 0 8px;font-size:20px">${s0.t}</h3>${s0.img ? `<div style="text-align:center;margin:8px 0 12px"><img src="${s0.img}?v=1" alt="" style="max-width:100%;max-height:46vh;border-radius:10px;border:1px solid var(--line)"></div>` : s0.pic ? `<div style="text-align:center;margin:8px 0 12px">${PIC[s0.pic]}</div>` : ''}<p style="margin:0;font-size:16px;line-height:1.8">${s0.b}</p>
      <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">${i < steps.length - 1 ? `<button class="btn" type="button" data-next style="font-size:16px;padding:12px 24px">${i === 0 && !isPc ? '無かった(つぎへ)' : 'つぎへ'}</button>` : ''}${i === 0 && !isPc ? '<button class="btn ghost" type="button" data-have style="font-size:16px;padding:12px 24px">あった</button>' : ''}${i > 0 ? '<button class="btn ghost" type="button" data-back>← 戻る</button>' : ''}<button class="btn ghost" type="button" data-close>${i === steps.length - 1 ? 'できた' : '閉じる'}</button></div>
      <p class="k" style="margin:12px 0 0">うまくいかない場合は、その画面のスクリーンショットを設定の「問い合わせ」からお送りください。</p></div>`;
    const q = sel => ov.querySelector(sel);
    if (q('[data-next]')) q('[data-next]').onclick = () => { i++; draw(); };
    if (q('[data-back]')) q('[data-back]').onclick = () => { i--; draw(); };
    if (q('[data-have]')) q('[data-have]').onclick = () => { store.set('a2hsHide', 1); ov.remove(); const b = $('a2hs'); if (b) b.hidden = true; toast('すでに追加されています。次回からはアイコンから開けます', 'ok'); };
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
  // 印をつけた仕事に入っていないのに使っているもの → メニューの前に出すか聞く(1回押したら、今後表示しない)
  if (D.me && D.me.owner && Array.isArray(D.jobs)) jobSignals().filter(j => !D.jobs.includes(j)).forEach(j => { let seen = ''; try { seen = localStorage.getItem('shikomi:jobsug:' + j) || ''; } catch (e) {} if (seen) return; const l = { ws: ['卸', '卸の納品が入っています'], stock: ['在庫', '在庫の数が入っています'], cal: ['予定', '予定が入っています'] }[j]; t.push({ c: 'more', ic: 'more', b: `「${l[0]}」をメニューの上位に表示しますか`, k: l[1] + '。設定の「利用する業務」で選べます', d: '', star: 1, go: () => { try { localStorage.setItem('shikomi:jobsug:' + j, '1'); } catch (e) {} show('set'); setTimeout(() => { const el = $('jobs'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 200); } }); });
  (D.memos || []).filter(m => !m.seen.includes(me)).slice(0, 3).forEach(m => t.push({ c: 'post', ic: 'memo', b: `連絡事項: ${m.text}`, k: `${m.by}から`, d: '', star: 3, go: () => $('memos').scrollIntoView({ behavior: 'smooth', block: 'start' }) }));
  if (!noMoney()) unpaid().forEach(p => { const dd = p.due ? dayDiff(p.due) : null; if (dd == null || dd <= 7) t.push({ c: 'book', ic: 'book', b: `${p.supplier}への支払い ${yen(p.total)}`, k: `${+p.month.slice(5) || p.month}月分`, d: dd == null ? '期限なし' : dd < 0 ? `${-dd}日超過` : dd === 0 ? '本日まで' : dd === 1 ? '明日まで' : md(p.due) + 'まで', due: dd != null && dd <= 1, star: dd != null && dd <= 1 ? 3 : 2, go: () => show('book') }); });
  const regs = noMoney() ? [] : (D.priceChanges || []).filter(x => !x.done); if (regs.length) t.push({ c: 'sales', ic: 'sales', b: `レジの売価の変更 ${regs.length}品`, k: regs.slice(0, 3).map(x => `${x.name} ${x.old ? x.old + '→' : ''}${x.now}円`).join('・') + (regs.length > 3 ? ' ほか' : ''), d: regs.some(x => x.at && Date.now() - x.at > DAY) ? '昨日から' : '今日', star: 3, go: () => { $('reg-box').scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
  if (evOn()) {
    const td = todayS();
    D.shutten.list.filter(e => e.from <= td && e.to >= td || dayDiff(e.from) === 1).forEach(e => { const dd = dayDiff(e.from); t.push({ c: 'ev', ic: 'ev', b: `${dd === 1 ? '明日の出店' : '本日の出店'}: ${e.name}`, k: [e.kind, e.place].filter(Boolean).join('・'), d: dd === 1 ? '明日' : '今日', star: 2, go: () => openEv(e.id) }); });
    evWarns().forEach(x => t.push({ c: 'ev', ic: 'ev', b: `${x.name}の有効期限${x.warn === 'out' ? 'が切れています' : 'が近づいています'}`, k: `${x.kind}・${evYmd(x.exp)}まで`, d: x.warn === 'out' ? '期限切れ' : x.days === 0 ? '本日まで' : `残り${x.days}日`, star: x.warn === 'out' ? 3 : 2, go: () => openEvDoc(x.id) }));
  }
  const hm = hygMissing(); if (hm.length) t.push({ c: 'hyg', ic: 'hyg', b: `本日の衛生記録 残り${hm.length}つ`, k: hm.join('・'), d: '今日', star: new Date().getHours() >= 15 ? 3 : 2, go: () => show('hyg') });
  (D.promises || []).forEach(p => { const dd = p.date ? dayDiff(p.date) : null; if (dd != null && dd > 1) return; if (dd == null && !['折り返し', '返事'].includes(p.kind)) return; t.push({ c: PRK[p.kind] || 'set', ic: 'memo', b: `${p.kind}: ${p.text}`, k: `${p.who || ''}${p.who ? ' · ' : ''}${p.src}で受けた`, d: dd == null ? '期限なし' : prDue(p), due: dd != null && dd <= 0, star: dd != null && dd <= 0 ? 3 : 2, go: () => $('promises').scrollIntoView({ behavior: 'smooth', block: 'start' }) }); });
  (D.events || []).filter(e => { const dd = dayDiff(e.date); return dd >= 0 && dd <= 1; }).forEach(e => t.push({ c: EVK[e.kind] || 'set', ic: 'cal', b: `${e.kind === '納品' ? '納品: ' : ''}${e.text}${e.who ? '(' + e.who + ')' : ''}`, k: e.kind, d: dayDiff(e.date) === 0 ? '今日' : '明日', star: 2, go: () => show('cal') }));
  if (q) t.push({ c: 'cam', ic: 'cam', b: `確認待ちの回答 ${q}件`, k: '回答すると、原価と食品表示が確定します', d: '', star: 1, go: () => $('notices').scrollIntoView({ behavior: 'smooth', block: 'start' }) });
  (D.ups || []).slice(-2).forEach(u => t.push({ c: 'mat', ic: 'mat', b: `${u.item}が値上がり(+${u.pct}%)`, k: `${u.supplier} ${u.old.toLocaleString()}円→${u.now.toLocaleString()}円。原価を見直してください`, d: '', star: 1, go: () => { matF = 'up'; show('mat'); } }));
  const low = SH('stock') ? [] : ((D.stock || {}).items || []).filter(x => x.low); if (low.length) t.push({ c: 'stock', ic: 'stock', b: `在庫が少ない材料 ${low.length}品`, k: low.slice(0, 4).map(x => x.key).join('・') + (orderOn() ? ' → 発注書を作成' : ''), d: '', star: 1, go: () => { if (orderOn()) openOrder(); else { matF = 'low'; show('mat'); } } });
  return t.sort((a, b) => b.star - a.star);
}
function renderTodo(list) {
  const t = todoItems(list.length), box = $('todo');
  box.innerHTML = t.length ? t.map((x, i) => `<div class="tr" role="button" tabindex="0" data-i="${i}" style="--c:var(--c-${x.c})"><span class="ti"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[x.ic]}</svg></span><span class="tb"><b>${esc(x.b)}</b><span class="k">${esc(x.k)}</span></span><span class="td${x.due ? ' due' : ''}">${esc(x.d)}<br><span class="st">${'★'.repeat(x.star)}</span></span></div>`).join('')
    : `<div class="none"><span class="mark">✓</span><span>本日の作業はすべて完了しています。</span></div>`;
  box.querySelectorAll('.tr').forEach(el => el.onclick = () => t[el.dataset.i].go());
}
// 上の1行: 今いちばん大事なこと(1つだけ)
function renderBar() {
  const t = todoItems(notices().length).filter(x => x.star >= 2), bar = $('bar');
  const t2 = t.filter(x => x.c !== cur);
  if (!t2.length || cur === 'today') { bar.hidden = true; return; }
  const x = t2[0]; bar.hidden = false; bar.className = 'bar' + (x.due || x.star >= 3 ? ' warn' : '');
  bar.innerHTML = `<i></i><span>${esc(x.b)}</span><b>${esc(x.d)}${t2.length > 1 ? ` · ほか${t2.length - 1}件` : ''} ›</b>`;
  bar.onclick = () => x.go();
}
// はじめの5つ(新しいお店。終わると消える)
function renderStart() {
  const si = D.shopInfo || {}, goods = D.products.filter(p => p.kind !== 'part');
  // 最初の3分で、強み(写真1枚から原価→袋の裏でアレルゲン→店の外に出すラベル→衛生→AI)に触れる順番
  const mats = D.materials || [];
  const steps = [
    ['レシピを1枚撮影する(1個あたりの原価が表示されます)', goods.length > 0, openCamera, '撮影'],
    ['材料の裏面表示を1枚撮影する(原材料名とアレルゲンが登録されます)', mats.some(m => !m.fromKind && ((m.allergens || []).length || (m.display && m.display !== m.name))), openCamera, '撮影'],
    ['食品表示ラベルを確認して印刷する(店名と住所もここで登録)', !!(si.name && si.addr) && !!store.get('labelSeen'), () => { store.set('labelSeen', 1); show('label'); }, '食品表示へ'],
    ['本日の衛生記録を入力する', !!(D.hyg && D.hyg.today && D.hyg.today.missing.length < (D.hyg.today.items || []).length) || !!(D.hyg && D.hyg.months && Object.keys(D.hyg.months).length), () => show('hyg'), '衛生へ'],
    ['AIに質問する(例:「この商品の原価率は?」)', !!store.get('chatTried'), () => openAsk(), '質問する']];
  const done = steps.filter(x => x[1]).length, box = $('start');
  if (done === steps.length || store.get('startHide') || !(D.me && D.me.owner)) { box.hidden = true; return; }
  box.hidden = false;
  box.innerHTML = `<div class="sh"><b>初期設定</b><span class="k">${done}/${steps.length} 済</span></div><div class="pg"><i style="width:${done / steps.length * 100}%"></i></div><ol>${steps.map((x, i) => `<li class="${x[1] ? 'ok' : ''}" data-i="${i}"><span class="n">${x[1] ? '✓' : i + 1}</span><span>${esc(x[0])}</span>${x[1] ? '' : `<span class="go">${esc(x[3])} ›</span>`}</li>`).join('')}</ol><p class="k" style="margin:8px 0 0">5つすべて完了すると、この欄は表示されなくなります。<a href="#" id="start-hide" style="color:var(--accent)">今は隠す</a></p>`;
  box.querySelectorAll('li').forEach(li => li.onclick = () => { const x = steps[li.dataset.i]; if (!x[1]) x[2](); });
  $('start-hide').onclick = e => { e.preventDefault(); store.set('startHide', 1); box.hidden = true; };
}
// 初期登録: 初日の30分で10品を原価つきでそろえる。レシピ・請求書の写真をまとめて選ぶ、文字で貼り付ける、よく使う材料を入れる
// 写真は1枚ずつ順に送る(待つ間もほかの画面を使える)。進み具合はお店のデータから出すので、途中でやめても続きから
const INTAKE_GOAL = 10;
let intakeQ = [], intakeBusy = false, intakeMsgs = [];
function intakeState() {
  const goods = D.products.filter(p => p.kind !== 'part'), ready = goods.filter(p => p.batch_cost > 0 && !(p.unknown || []).length);
  const noPrice = [...new Set(goods.flatMap(p => p.noPrice || []))], unknown = [...new Set(goods.flatMap(p => (p.unknown || []).filter(u => !(p.noPrice || []).includes(u))))];
  return { goods, ready, noPrice, unknown };
}
function renderIntake() {
  const box = $('intake'); if (!box) return;
  const S = intakeState(), canEdit = D.me && (D.me.owner || perm('recipe'));
  if (!canEdit || store.get('intakeHide') || (S.ready.length >= INTAKE_GOAL && !intakeQ.length)) { box.hidden = true; return; }
  box.hidden = false;
  const left = intakeQ.filter(x => x.st === 'wait' || x.st === 'run').length, lost = (() => { try { return JSON.parse(localStorage.getItem('intakeLost') || '[]'); } catch (e) { return []; } })();
  const fewMats = (D.materials || []).length < 30;
  box.innerHTML = `<div class="sh"><b>初期登録</b><span class="k">目標: ${INTAKE_GOAL}品の原価を登録</span></div>
    <div class="goal">${S.ready.length}<small> / ${INTAKE_GOAL}品 原価算出済み</small></div>
    <div class="pg"><i style="width:${Math.min(100, S.ready.length / INTAKE_GOAL * 100)}%"></i></div>
    <p class="k" style="margin:8px 0 0">${S.goods.length ? `登録済みの商品 ${S.goods.length}品。` : ''}${S.noPrice.length ? `単価が未登録の材料: <b>${S.noPrice.slice(0, 6).map(esc).join('、')}${S.noPrice.length > 6 ? ' ほか' + (S.noPrice.length - 6) : ''}</b> → 該当する請求書を撮影すると登録されます。` : ''}${S.unknown.length ? `材料一覧にない材料: ${S.unknown.slice(0, 4).map(esc).join('、')}${S.unknown.length > 4 ? ' ほか' : ''}。` : ''}${!S.goods.length ? 'レシピの写真かテキストから登録を始めてください。請求書を撮影すると、記載された材料と単価がまとめて登録されます。' : ''}</p>
    <div class="acts">
      <label class="btn">レシピの写真を選択(複数可)<input type="file" id="in-rec" accept="image/*" multiple hidden></label>
      <label class="btn ghost">請求書の写真・PDF・CSVを選択(複数可)<input type="file" id="in-inv" accept="image/*,.pdf,.csv,.txt,.tsv,application/pdf,text/csv" multiple hidden></label>
      <button class="btn ghost" type="button" id="in-txt">テキストを貼り付ける(紙・Excel)</button>
      ${fewMats ? '<button class="btn ghost" type="button" id="in-st">よく使う材料を登録</button>' : ''}
    </div>
    <div id="in-txtbox" hidden><textarea id="in-text" placeholder="例)\nどら焼き 20個分\n薄力粉 300g\n卵 6個\n砂糖 280g\n…\n\n商品ごとに、商品名と材料・分量を記入してください。複数の商品をまとめて貼り付けられます。"></textarea><div class="ask"><button class="btn" type="button" id="in-txtgo">取り込む</button></div></div>
    ${intakeQ.length ? `<ul class="q">${intakeQ.map(x => `<li class="${x.st === 'ok' ? 'ok' : x.st === 'ng' ? 'ng' : ''}"><span>${esc(x.kind)} ${esc(x.name)}</span><span class="st">${x.st === 'wait' ? '待ち' : x.st === 'run' ? '読んでいます…' : x.st === 'ok' ? '入りました' : esc(x.err || '読めませんでした')}</span></li>`).join('')}</ul>${left ? `<p class="k" style="margin:6px 0 0">残り${left}枚。待つ間も、ほかの画面を使えます(この画面を閉じると、残りは送られません)。</p>` : ''}` : ''}
    ${!left && lost.length ? `<p class="k" style="margin:8px 0 0">前に送りきれなかった写真が${lost.length}枚あります(${lost.slice(0, 3).map(esc).join('、')}${lost.length > 3 ? ' ほか' : ''})。もう一度選択してください。<a href="#" id="in-lostx">閉じる</a></p>` : ''}
    ${intakeMsgs.length ? `<details style="margin-top:8px"><summary class="k" style="cursor:pointer">読み取りの結果(${intakeMsgs.length})</summary><div class="k" style="margin-top:6px;white-space:pre-wrap">${intakeMsgs.slice(-12).map(esc).join('\n\n')}</div></details>` : ''}
    <p class="k" style="margin:10px 0 0">${S.ready.length >= INTAKE_GOAL ? `${INTAKE_GOAL}品そろいました。` : ''}<a href="#" id="in-hide">この欄を閉じる</a></p>`;
  const pick = (id, kind) => { const f = $(id); f.onchange = () => { intakeAdd([...f.files], kind); f.value = ''; }; };
  pick('in-rec', 'レシピ'); pick('in-inv', '請求書');
  $('in-txt').onclick = () => { $('in-txtbox').hidden = !$('in-txtbox').hidden; if (!$('in-txtbox').hidden) $('in-text').focus(); };
  $('in-txtgo').onclick = async () => {
    const v = $('in-text').value.trim(); if (!v) { $('in-text').focus(); return; }
    const b = $('in-txtgo'); b.disabled = true; b.textContent = '読み取っています…(20〜60秒)';
    const out = await api({ kind: 'app_set', field: 'recipetext', value: v }).catch(() => ({ ok: false, error: '通信できませんでした' }));
    b.disabled = false; b.textContent = '取り込む';
    if (!out.ok) { toast(out.error || '取り込めませんでした', 'ng'); return; }
    $('in-text').value = ''; intakeMsgs.push(out.msg || ''); D = out.data; renderAll(); toast(out.msg || '取り込みました', 'ok');
  };
  if ($('in-st')) $('in-st').onclick = () => setValueX({ field: 'starter', value: 1 });
  if ($('in-lostx')) $('in-lostx').onclick = e => { e.preventDefault(); try { localStorage.removeItem('intakeLost'); } catch (x) {} renderIntake(); };
  $('in-hide').onclick = e => { e.preventDefault(); store.set('intakeHide', 1); box.hidden = true; };
}
function intakeSaveLost() { try { const l = intakeQ.filter(x => x.st === 'wait' || x.st === 'run').map(x => x.name); if (l.length) localStorage.setItem('intakeLost', JSON.stringify(l)); else localStorage.removeItem('intakeLost'); } catch (e) {} }
function intakeAdd(files, kind) {
  files.filter(f => /^image\//.test(f.type) || isDocFile(f)).slice(0, 40).forEach(f => intakeQ.push({ file: f, name: f.name.replace(/\.[a-z0-9]+$/i, '').slice(0, 24), kind: isDocFile(f) ? '請求書' : kind, st: 'wait', doc: isDocFile(f) }));
  intakeSaveLost(); renderIntake(); intakeRun();
}
async function intakeRun() {
  if (intakeBusy) return; intakeBusy = true;
  try {
    for (let x; (x = intakeQ.find(y => y.st === 'wait'));) {
      x.st = 'run'; renderIntake();
      try {
        const out = x.doc ? await invoiceDoc(x.file) : await api({ kind: 'liff_upload', web: true, sort: true, image: await shrink(x.file), type: 'image/jpeg' });
        if (!out.ok) throw new Error(out.error || '読めませんでした');
        x.st = 'ok'; intakeMsgs.push(`【${x.kind} ${x.name}】\n` + (out.msgs || []).join('\n'));
      } catch (e) { x.st = 'ng'; x.err = String(e.message || e).slice(0, 40); }
      delete x.file; intakeSaveLost();
      const fresh = await api({ kind: 'app_data' }).catch(() => null); if (fresh && fresh.ok) { D = fresh.data; renderAll(); } else renderIntake();
    }
  } finally { intakeBusy = false; intakeSaveLost(); renderIntake(); sortLoad(); }
}
// 請求書のPDF・CSV(受発注システムの書き出し)を1つ送る。PDFはそのまま、CSV・文字は中身を送る
const isDocFile = f => /\.(pdf|csv|txt|tsv)$/i.test(f.name) || /pdf|csv|text\/plain/.test(f.type);
async function invoiceDoc(f) {
  if (f.size > 8 * 1024 * 1024) return { ok: false, error: '8MBを超えるファイルは送信できません' };
  let value;
  if (/pdf/i.test(f.type) || /\.pdf$/i.test(f.name)) {
    const data = await new Promise((ok, ng) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = ng; r.readAsDataURL(f); });
    value = { file: { data, type: 'application/pdf' } };
  } else {
    let text = await f.text();
    if (/[\ufffd]/.test(text) || !/[ぁ-んァ-ン一-龥]/.test(text)) { try { const b = await f.arrayBuffer(); const t2 = new TextDecoder('shift_jis').decode(b); if (/[ぁ-んァ-ン一-龥]/.test(t2)) text = t2; } catch (e) {} }
    value = { text };
  }
  const out = await api({ kind: 'app_set', field: 'invoicedoc', value }).catch(() => ({ ok: false, error: '通信できませんでした' }));
  if (out.ok) out.msgs = out.msgs || [out.msg];
  return out;
}
addEventListener('beforeunload', e => { if (intakeQ.some(x => x.st === 'wait' || x.st === 'run')) { intakeSaveLost(); e.preventDefault(); e.returnValue = ''; } });
// 伝言: お店のみんなに残すメモ。「見た」で名前が残り、「済」で消える
function renderMemos() {
  const box = $('memos'), ms = D.memos || [], me = profileName || '';
  box.hidden = SH('memo'); $('memo-add').closest('h1').hidden = SH('memo'); if (SH('memo')) return;
  box.innerHTML = ms.length ? `<div class="card" style="padding:0">${ms.map(m => `<div class="memo"><div class="mb"><p>${esc(m.text)}</p><span class="k">${esc(m.by)} · ${m.t ? new Date(m.t).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}${m.seen.length ? ' · 見た: ' + m.seen.map(esc).join('、') : ''}</span></div><span class="acts">${m.seen.includes(me) ? '' : `<button class="btn sm" type="button" data-seen="${m.row}">確認</button>`}<button class="btn ghost sm" type="button" data-done="${m.row}">完了</button></span></div>`).join('')}</div>`
    : `<div class="card"><p class="k" style="margin:0">連絡事項はありません。「＋ 追加」から登録すると、スタッフ全員のホームに表示されます。</p></div>`;
  box.querySelectorAll('[data-seen]').forEach(b => b.onclick = () => setValueX({ field: 'memo', value: { row: +b.dataset.seen } }));
  box.querySelectorAll('[data-done]').forEach(b => b.onclick = () => setValueX({ field: 'memo', value: { row: +b.dataset.done, done: true } }));
}
$('memo-add').onclick = () => {
  const box = $('memos'); if ($('memo-form')) { $('memo-form').remove(); return; }
  box.insertAdjacentHTML('afterbegin', `<div class="card" id="memo-form"><textarea id="memo-text" rows="2" placeholder="連絡事項を入力" style="width:100%;box-sizing:border-box;font:inherit;font-size:15px;padding:8px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink)"></textarea><div class="ask"><button class="btn" type="button" id="memo-go">残す</button><button class="btn ghost" type="button" id="memo-cancel">やめる</button><span class="k">スタッフ全員にLINEでも届きます</span></div></div>`);
  $('memo-text').focus();
  $('memo-cancel').onclick = () => $('memo-form').remove();
  $('memo-go').onclick = () => { const v = $('memo-text').value.trim(); if (!v) { $('memo-text').focus(); return; } setValueX({ field: 'memo', value: { text: v } }); };
};
// 約束: 電話・メール・店頭で受けた予約・注文、折り返し、返事、支払い。言ったまま入れるとAIが分ける。済で消える
const PRK = { '予約・注文': 'ws', '折り返し': 'post', '返事': 'post', '支払い': 'book', 'その他': 'set' };
const prDue = p => { if (!p.date) return ''; const dd = dayDiff(p.date); return (dd < 0 ? `${-dd}日超過` : dd === 0 ? '今日' : dd === 1 ? '明日' : md(p.date)) + (p.time ? ' ' + p.time : ''); };
function renderPromises() {
  const box = $('promises'), ps = D.promises || [];
  box.innerHTML = ps.length ? `<div class="card" style="padding:0">${ps.map(p => { const dd = p.date ? dayDiff(p.date) : null; return `<div class="memo" style="--c:var(--c-${PRK[p.kind] || 'set'})"><div class="mb"><p><span class="prk">${esc(p.kind)}</span>${esc(p.text)}</p><span class="k">${p.who ? esc(p.who) + ' ' : ''}${p.tel ? `<a href="tel:${esc(p.tel.replace(/[^\d+]/g, ''))}">☎ ${esc(p.tel)}</a> ` : ''}· ${p.date ? `<b class="${dd != null && dd <= 0 ? 'prdue' : ''}">${esc(prDue(p))}</b>` : '期限なし'} · ${esc(p.src)}で${esc(p.by)}が受付</span></div><span class="acts"><button class="btn ghost sm" type="button" data-pedit="${p.row}">編集</button><button class="btn sm" type="button" data-pdone="${p.row}">完了</button></span></div>`; }).join('')}</div>`
    : `<div class="card"><p class="k" style="margin:0">未対応のメモはありません。電話や店頭で受けた予約・注文・折り返しは「＋ 追加」から、聞いた内容をそのまま入力してください。</p></div>`;
  box.querySelectorAll('[data-pdone]').forEach(b => b.onclick = () => setValueX({ field: 'promise', value: { row: +b.dataset.pdone, done: true } }));
  box.querySelectorAll('[data-pedit]').forEach(b => b.onclick = () => editPromise(ps.find(p => p.row === +b.dataset.pedit), b.closest('.memo')));
}
function editPromise(p, el) {
  if (!p || !el) return; if (el.nextElementSibling && el.nextElementSibling.id === 'pr-edit') { el.nextElementSibling.remove(); return; }
  const f = document.getElementById('pr-edit'); if (f) f.remove();
  el.insertAdjacentHTML('afterend', `<div class="memo" id="pr-edit" style="display:block"><div class="prf"><label>内容<input id="pe-text" value="${esc(p.text)}"></label><label>種類<select id="pe-kind">${Object.keys(PRK).map(k => `<option${k === p.kind ? ' selected' : ''}>${k}</option>`).join('')}</select></label><label>相手<input id="pe-who" value="${esc(p.who)}"></label><label>電話<input id="pe-tel" inputmode="tel" value="${esc(p.tel)}"></label><label>期限<input id="pe-date" type="date" value="${esc(p.date)}"></label><label>時間<input id="pe-time" type="time" value="${esc(p.time)}"></label></div>${p.raw ? `<p class="k" style="margin:8px 0 0">受けたときの言葉: ${esc(p.raw)}</p>` : ''}<div class="ask"><button class="btn" type="button" id="pe-save">保存</button><button class="btn ghost" type="button" id="pe-del">削除</button></div></div>`);
  $('pe-save').onclick = () => setValueX({ field: 'promise', value: { row: p.row, text: $('pe-text').value, kind: $('pe-kind').value, who: $('pe-who').value, tel: $('pe-tel').value, date: $('pe-date').value, time: $('pe-time').value } });
  twice($('pe-del'), '削除する(もう一度押すと確定)', () => setValueX({ field: 'promise', value: { row: p.row, del: true } }));
}
let prRec = null;
$('pr-add').onclick = () => {
  const box = $('promises'); if ($('pr-form')) { $('pr-form').remove(); return; }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  box.insertAdjacentHTML('afterbegin', `<div class="card" id="pr-form"><div class="seg segw" id="pr-src">${['電話', 'メール', '店頭', 'LINE'].map((s, i) => `<button type="button" data-s="${s}" aria-pressed="${i === 0}">${s}</button>`).join('')}</div>
    <textarea id="pr-text" rows="3" placeholder="伺った内容をそのまま入力してください。例: 山田さん 土曜の10時 チーズ饅頭8個 箱で 取りに来る 090-xxxx" style="width:100%;box-sizing:border-box;font:inherit;font-size:15px;padding:8px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink);margin-top:8px"></textarea>
    <div class="ask">${SR ? '<button class="btn ghost" type="button" id="pr-mic">🎤 音声で入力</button>' : ''}<button class="btn" type="button" id="pr-go">メモに登録</button><button class="btn ghost" type="button" id="pr-cancel">キャンセル</button></div>
    <p class="k" style="margin:8px 0 0">順番は問いません。AIが相手・内容・期限に分け、不足している情報があればお知らせします。${SR ? '' : 'キーボードの音声入力も利用できます。'}</p></div>`);
  let src = '電話';
  $('pr-src').querySelectorAll('button').forEach(b => b.onclick = () => { src = b.dataset.s; $('pr-src').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); });
  const stop = () => { if (prRec) { try { prRec.stop(); } catch (e) {} prRec = null; } const m = $('pr-mic'); if (m) m.textContent = '🎤 音声で入力'; };
  if (SR) $('pr-mic').onclick = () => {
    if (prRec) { stop(); return; }
    const r = new SR(), ta = $('pr-text'), base = ta.value ? ta.value + ' ' : ''; r.lang = 'ja-JP'; r.continuous = true; r.interimResults = true;
    r.onresult = e => { ta.value = base + [...e.results].map(x => x[0].transcript).join(''); };
    r.onerror = e => { stop(); if (e.error === 'not-allowed') toast('マイクを利用できません。ブラウザでマイクの使用を許可するか、キーボードの音声入力をご利用ください', 'ng'); };
    r.onend = () => { if (prRec === r) stop(); };
    try { r.start(); prRec = r; $('pr-mic').textContent = '■ 停止'; } catch (e) { toast('マイクを起動できませんでした', 'ng'); }
  };
  $('pr-text').focus();
  $('pr-cancel').onclick = () => { stop(); $('pr-form').remove(); };
  $('pr-go').onclick = async () => { stop(); const v = $('pr-text').value.trim(); if (!v) { $('pr-text').focus(); return; } const b = $('pr-go'); b.disabled = true; b.textContent = '整理しています…'; await setValueX({ field: 'promise', value: { raw: v, src } }); if ($('pr-go')) { b.disabled = false; b.textContent = 'メモに登録'; } };
};
// 予定: ホームにはこれからの5件、予定の画面には月の表と一覧
const evRow = (e, del) => `<li style="--c:var(--c-${EVK[e.kind] || 'set'})"${e.src === 'gcal' ? ' title="Googleカレンダーの予定"' : ''}><span class="ed"><b>${+e.date.slice(8)}</b><small>${+e.date.slice(5, 7)}月 ${['日', '月', '火', '水', '木', '金', '土'][new Date(e.date.slice(0, 4), +e.date.slice(5, 7) - 1, +e.date.slice(8)).getDay()]}</small></span><span class="ek">${esc(e.kind)}</span><span class="et">${esc(e.text)}${e.who ? `<span class="k">${esc(e.who)}</span>` : ''}${e.src === 'gcal' ? '<span class="k">Googleカレンダーから</span>' : e.by ? `<span class="k">${avatar(e.by, true)} ${esc(e.by)}</span>` : ''}${(e.notes || []).length ? `<ul class="notes">${e.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}${del && e.src !== 'gcal' ? `<span class="ask" style="margin-top:8px"><input class="note-in" data-row="${e.row}" placeholder="補足" style="flex:1;min-width:0;font-size:13px;padding:4px 8px"><button class="btn ghost sm" type="button" data-note="${e.row}">追加</button></span>` : ''}</span>${del && e.src !== 'gcal' ? `<button class="x" type="button" data-del="${e.row}" aria-label="削除">✕</button>` : ''}</li>`;
function renderHomeEvents() {
  if ($('home-ev-wrap')) $('home-ev-wrap').hidden = SH('cal');
  if (SH('cal')) return;
  const box = $('home-events'), t = todayS(), evs = (D.events || []).filter(e => e.date >= t).slice(0, 5);
  box.innerHTML = evs.length ? `<ul class="evl">${evs.map(e => evRow(e)).join('')}</ul>` : `<p class="k" style="margin:0">今後の予定はありません。予定の画面から追加できます。</p>`;
  box.style.padding = evs.length ? '0' : '';
}
$('ev-more').onclick = () => show('cal');
// レジに入れる値段(ピタット原価で売値を変えた → レジを直して「済」)。値段表の印刷も
// 点検: 見回りで見つけた所。押すと直す場所へ
let inspAll = false;
function renderInspect() {
  const w = $('insp-wrap'), box = $('insp'); if (!w || !box) return;
  const xs = D.inspect || []; w.hidden = !xs.length; if (!xs.length) return;
  const warn = xs.filter(x => x.lv === 'warn').length;
  $('insp-n').textContent = `${xs.length}件${warn ? '(うち要注意 ' + warn + ')' : ''}`;
  const shown = inspAll ? xs : xs.slice(0, 5);
  // その場で片づくもの(仮の値段のまとめて確定・1仕込みの個数)は、行の下に入力を開く
  const panel = (x, i) => x.key === 'tent' ? `<div class="insp-pn" id="insp-pn-${i}" hidden><div class="chips">${x.items.map(n => `<span class="chip">${esc(n)}</span>`).join('')}</div><div class="ask"><button class="btn sm" type="button" data-tent="${i}">この単価で一括確定</button><button class="btn ghost sm" type="button" data-tent-go>材料の画面で確認</button></div><p class="k" style="margin:6px 0 0">確定した後でも、請求書を撮影すると新しい単価に置き換わります。</p></div>`
    : x.ask && x.ask.type === 'pieces' ? `<div class="insp-pn" id="insp-pn-${i}" hidden><p class="k" style="margin:0 0 6px">「${esc(x.ask.product)}」は1仕込みで何${esc(U)}できますか?</p><div class="ask">${(x.ask.cands || []).map(c => `<button class="btn ghost sm" type="button" data-pc="${i}" data-v="${c}">約${c.toLocaleString()}${esc(U)}</button>`).join('')}<input id="insp-pc-${i}" inputmode="numeric" placeholder="数" aria-label="1仕込みの数" style="width:6em"><span class="k">${esc(U)}</span><button class="btn sm" type="button" data-pc="${i}">保存</button></div></div>` : '';
  box.innerHTML = shown.map((x, i) => `<div class="insp-row ${x.lv}" role="button" tabindex="0" data-insp="${i}"${panel(x, i) ? ' aria-expanded="false"' : ''}><span class="dot"></span><span><b>${esc(x.title)}</b><span class="k">${esc(x.why)}</span></span></div>${panel(x, i)}`).join('') +
    (xs.length > 5 ? `<div class="ask"><button class="btn ghost sm" type="button" id="insp-more">${inspAll ? '少なく表示' : 'すべて見る(' + xs.length + '件)'}</button></div>` : '');
  box.querySelectorAll('[data-insp]').forEach(r => { const i = +r.dataset.insp, x = shown[i], pn = $('insp-pn-' + i);
    const go = () => { if (pn) { pn.hidden = !pn.hidden; r.setAttribute('aria-expanded', String(!pn.hidden)); return; } if (x.key === 'label') { show('today'); setTimeout(() => { const n = $('notices'); if (n) n.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 200); return; } inspGo(x.go || {}); }; r.onclick = go; r.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }; });
  if ($('insp-more')) $('insp-more').onclick = () => { inspAll = !inspAll; renderInspect(); };
  box.querySelectorAll('[data-tent]').forEach(b => b.onclick = () => setValueX({ field: 'matok', value: shown[+b.dataset.tent].items }));
  box.querySelectorAll('[data-tent-go]').forEach(b => b.onclick = () => { matF = 'all'; show('mat'); });
  box.querySelectorAll('[data-pc]').forEach(b => b.onclick = () => { const i = +b.dataset.pc, x = shown[i], v = b.dataset.v ? +b.dataset.v : parseFloat(($('insp-pc-' + i) || {}).value);
    if (!(v > 0)) { const e = $('insp-pc-' + i); if (e) e.focus(); return; } setValue(x.ask.product, 'pieces', Math.round(v)); });
}
function inspGo(g) {
  if (g.tab === 'cost' && g.product) { prodSel = g.product; show('cost'); renderCost(); setTimeout(() => { const c = $('pdet'); if (c && !c.hidden) c.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 250); return; }
  if (g.tab === 'label' && g.product) { labelName = g.product; show('label'); return; }
  if (g.tab === 'mat' && g.material) { matF = 'all'; show('mat'); setTimeout(() => matEdit(g.material), 250); return; }
  show(g.tab || 'today');
}
function renderReg() {
  const box = $('reg-box'); if (!box) return;
  const all = noMoney() ? [] : (D.priceChanges || []), pend = all.filter(x => !x.done), done = all.filter(x => x.done).slice(-5).reverse();
  box.parentNode.hidden = !all.length;
  if (!all.length) return;
  const row = x => `<div class="regrow${x.done ? ' done' : ''}"><div class="rb"><b>${esc(x.name)}</b>${x.reg && x.reg !== x.name ? ` <span class="k">レジでは「${esc(x.reg)}」</span>` : ''}<span class="k">${x.old ? `${x.old}円 → ` : '新しく '}<b style="color:var(--ink)">${x.now}円</b> · ${x.at ? new Date(x.at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }) : ''}${x.done ? ` · レジ済 ${md(x.done)}${x.by ? ' ' + esc(x.by) : ''}` : ''}</span></div>${x.done ? '' : `<button class="btn sm" type="button" data-regdone="${x.row}">レジに入れた</button>`}</div>`;
  box.innerHTML = `<p class="k" style="margin:0 0 8px">${pend.length ? `ピタット原価で売価を変更した商品が${pend.length}品あります。レジの売価を変更したら「レジに登録済み」を押してください。押すまでこの一覧に表示されます。` : 'レジに未登録の変更はありません。'}</p>
    ${pend.map(row).join('')}${done.length ? `<details style="margin-top:8px"><summary class="k">最近レジに入れたもの(${done.length})</summary>${done.map(row).join('')}</details>` : ''}
    ${pend.length ? `<div class="ask"><button class="btn ghost sm" type="button" id="reg-print">レジ用の売価一覧を表示</button><span class="k">印刷するか、スマートフォンで確認しながらレジに登録してください</span></div>` : ''}
    ${pend.some(x => x.old && x.now > x.old) ? `<div class="ask"><button class="btn ghost sm" type="button" id="reg-notice">値上げのお知らせ文を作成</button><span class="k">店頭やLINEでお客様にお知らせする文章の案</span></div>` : ''}`;
  const rn = $('reg-notice'); if (rn) rn.onclick = async () => {
    const ups = pend.filter(x => x.old && x.now > x.old);
    const sub = '値上げのお知らせ: ' + ups.map(x => `${x.name} ${x.old}円→${x.now}円`).join('、') + '。材料の値上がりのため。日付と理由の書き足しは店舗が行う。';
    openAsk(); const wait = addMsg('<span class="k">お知らせ文を作成しています…(10秒ほど)</span>');
    const out = await api({ kind: 'app_gen', subject: sub }); wait.remove();
    if (!out.ok) { botSay(esc(out.error || '作成できませんでした')); return; }
    const d = out.drafts || {};
    botSay('<b>お知らせ文の案</b><br>' + esc(d.notice || '').replace(/\n/g, '<br>'));
    if (d.pop) botSay('<b>店頭の貼り紙の案</b><br>' + esc(d.pop).replace(/\n/g, '<br>'));
    botSay('<span class="k">入力された内容以外は記載していません。値上げの開始日を追記してご利用ください。</span>');
  };
  box.querySelectorAll('[data-regdone]').forEach(b => b.onclick = () => setValueX({ field: 'regdone', value: +b.dataset.regdone }));
  const pr = $('reg-print'); if (pr) pr.onclick = () => openPrint(`<h2>レジに登録する売価</h2><p class="k">${new Date().toLocaleDateString('ja-JP')} 時点。ピタット原価で売価を変更した商品です。</p><table class="pt"><tr><th>レジでの商品名</th><th>商品</th><th>変更前の売価</th><th>変更後の売価</th><th>変更日</th><th>レジ登録✓</th></tr>${pend.map(x => `<tr><td><b>${esc(x.reg || x.name)}</b></td><td>${esc(x.name)}</td><td>${x.old ? x.old + '円' : '—'}</td><td><b style="font-size:18px">${x.now}円</b></td><td>${x.at ? new Date(x.at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }) : ''}</td><td style="width:60px"></td></tr>`).join('')}</table><p class="k">精算レシートを撮影した際に、レジの売価とピタット原価の売価が異なる場合はお知らせします。</p>`);
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
    <p class="k" style="margin:8px 0 0">薄い赤の日は定休日(設定で変更できます)、赤い日付は日曜・祝日です。日付を押すと、その日の予定を追加できます。点線はGoogleカレンダーの予定です。${(() => { const who = [...new Set((D.events || []).filter(e => e.by && e.src !== 'gcal').map(e => e.by))]; return who.length ? '丸の色は入れた人: ' + who.map(w => `<i class="who" style="background:${avColor(w)};display:inline-block;width:8px;height:8px;border-radius:50%;margin:0 4px 0 8px"></i>${esc(w)}`).join('') : ''; })()} 当日の朝8時に、今日の予定をLINEでお知らせします。</p>
    <h1 class="sub">${m + 1}月の予定</h1><div class="card" style="padding:0">${list.length ? `<ul class="evl">${list.map(e => evRow(e, true)).join('')}</ul>` : '<p class="k" style="margin:0;padding:16px">この月の予定はまだありません。</p>'}</div>` + gcalBox();
  const mv = n => { const d = new Date(y, m + n, 1); calYM = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; renderCal(); };
  $('cal-prev').onclick = () => mv(-1); $('cal-next').onclick = () => mv(1); $('cal-today').onclick = () => { calYM = null; renderCal(); };
  box.querySelectorAll('.d').forEach(el => el.onclick = () => evForm(el.dataset.d));
  bindGcal(box);
  box.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { if (confirmOnce('ev' + b.dataset.del, 'もう一度押すと、この予定を削除します')) setValueX({ field: 'event', value: { row: +b.dataset.del, del: true } }); });
  box.querySelectorAll('[data-note]').forEach(b => b.onclick = () => { const i = box.querySelector(`.note-in[data-row="${b.dataset.note}"]`), v = i.value.trim(); if (!v) { i.focus(); return; } setValueX({ field: 'event', value: { row: +b.dataset.note, note: v } }); });
  box.querySelectorAll('.note-in').forEach(i => i.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); box.querySelector(`[data-note="${i.dataset.row}"]`).click(); } });
}
function evForm(date) {
  const f = $('ev-form'); f.hidden = false;
  const tos = Object.keys(Object.assign({}, ...Object.values(D.ws || {}))).filter(Boolean);
  f.innerHTML = `<div class="fld"><span class="k">日付</span><input id="ev-date" type="date" value="${esc(date || todayS())}"><span class="k">種類</span><div class="seg" id="ev-kind">${['納品', '催事', '休み', 'その他'].map((k, i) => `<button type="button" data-v="${k}" aria-pressed="${i === 0}">${k}</button>`).join('')}</div><span class="k">内容</span><input id="ev-text" placeholder="内容"><span class="k">相手先</span><input id="ev-who" list="ev-tos" placeholder="任意"><datalist id="ev-tos">${tos.map(x => `<option value="${esc(x)}">`).join('')}</datalist></div><div class="ask"><button class="btn" type="button" id="ev-go">予定に登録</button><button class="btn ghost" type="button" id="ev-cancel">やめる</button></div>`;
  f.scrollIntoView({ behavior: 'smooth', block: 'start' });
  $('ev-kind').querySelectorAll('button').forEach(b => b.onclick = () => $('ev-kind').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)));
  $('ev-cancel').onclick = () => { f.hidden = true; };
  $('ev-go').onclick = () => { const kind = $('ev-kind').querySelector('[aria-pressed="true"]').dataset.v, text = $('ev-text').value.trim(); if (!text && kind !== '休み') { $('ev-text').focus(); return; } setValueX({ field: 'event', value: { date: $('ev-date').value, kind, text: text || kind, who: $('ev-who').value.trim() } }); f.hidden = true; };
}
$('ev-add-top').onclick = () => evForm();
// Googleカレンダーとつなぐ(購読の仕組み。入れるのは1か所でいい)
function gcalBox() {
  const c = D.cal || {}; if (!D.me || !D.me.owner) return c.gcal ? '<p class="k" style="margin:12px 0 0">Googleカレンダーの予定も、この表に表示しています(店主が設定)。</p>' : '';
  return `<h1 class="sub">Googleカレンダーとの連携 <span class="k" style="font-weight:400;font-size:13px">(任意。連携しなくてもご利用いただけます)</span></h1>
  <div class="card"><p style="margin:0 0 4px"><b>① ピタット原価の予定をGoogleカレンダーに表示する</b></p><p class="k" style="margin:0 0 8px">ピタット原価に登録した納品・催事・休業日が、自動でGoogleカレンダーに表示されます(反映まで数時間かかる場合があります)。</p>
    <div class="ask" style="margin-top:0"><input id="cal-feed" readonly value="${esc(c.feed || '')}" style="flex:1;min-width:0;font-size:13px"><button class="btn ghost sm" type="button" id="cal-copy">コピー</button></div>
    <details style="margin-top:8px"><summary class="k">Googleカレンダーでの設定方法</summary><ol class="k" style="margin:8px 0 0;padding-left:1.4em;line-height:1.8"><li>パソコンで Googleカレンダー を開く</li><li>左の「他のカレンダー」の「＋」→「URLで追加」</li><li>上のURLを貼り付けて「カレンダーを追加」</li><li>スマートフォンのGoogleカレンダーの設定で、追加したカレンダーの表示をオンにする</li></ol><p class="k" style="margin:8px 0 0">このURLには認証用の文字列が含まれています。店舗のスタッフ以外には共有しないでください。</p></details>
    <hr style="border:0;border-top:1px solid var(--line-2);margin:16px 0">
    <p style="margin:0 0 4px"><b>② Googleカレンダーの予定をピタット原価に表示する</b></p><p class="k" style="margin:0 0 8px">Googleカレンダーの設定 › 対象のカレンダー › 「iCal 形式の非公開 URL」をコピーし、ここに貼り付けます。Googleカレンダーの予定が、ピタット原価の予定と「今日やること」に表示されます(表示のみ。削除・編集はGoogleカレンダーで行ってください)。</p>
    <div class="ask" style="margin-top:0"><input id="gcal-url" placeholder="https://calendar.google.com/calendar/ical/…/basic.ics" value="${esc(c.gcal || '')}" style="flex:1;min-width:0;font-size:13px"><button class="btn sm" type="button" id="gcal-save">${c.gcal ? '更新する' : '連携する'}</button>${c.gcal ? '<button class="btn ghost sm" type="button" id="gcal-off">連携を解除</button>' : ''}</div>
    ${c.gcal ? '<p class="k" style="margin:8px 0 0">つながっています。Googleの予定は1時間ごとに読み直します。</p>' : ''}</div>`;
}
function bindGcal(root) {
  const cp = root.querySelector('#cal-copy'); if (cp) cp.onclick = async () => { try { await navigator.clipboard.writeText($('cal-feed').value); toast('URLをコピーしました', 'ok'); } catch (e) { $('cal-feed').select(); } };
  const sv = root.querySelector('#gcal-save'); if (sv) sv.onclick = () => { const v = $('gcal-url').value.trim(); if (!v) { $('gcal-url').focus(); return; } setValueX({ field: 'gcal', value: v }); };
  const off = root.querySelector('#gcal-off'); if (off) off.onclick = () => setValueX({ field: 'gcal', value: '' });
}
// 連絡先(仕入先・卸先の電話と担当)
const contactOf = n => (D.contacts || []).find(c => c.name === n || (n && (n.includes(c.name) || c.name.includes(n))));
const bankOf = n => { const c = contactOf(n); return c && (c.bank || c.number) ? [c.bank, c.branch, c.type, c.number, c.holder].filter(Boolean).join(' ') : ''; };
const callBtn = n => { const c = contactOf(n); return c && c.tel ? `<a class="btn ghost sm call" href="tel:${esc(c.tel.replace(/[^\d+]/g, ''))}" title="${esc(c.person ? '担当 ' + c.person : '')}">☎ 電話</a>` : ''; };
const telLink = n => { const c = contactOf(n); return c && c.tel ? ` <a href="tel:${esc(c.tel.replace(/[^\\d+]/g, ''))}" style="color:var(--accent);text-decoration:none;font-weight:600;white-space:nowrap" title="${esc(c.person ? '担当 ' + c.person : '')}">☎ ${esc(c.tel)}</a>` : ''; };
// 仕入先・卸先の一覧(メニューの「仕入先・卸先」)
function renderCt() { const b = $('ct-box'); if (!b) return; b.innerHTML = contactsBox(); bindContacts(b); }
function contactsBox() {
  const cs = D.contacts || [], sup = Object.keys(Object.assign({}, ...Object.values(D.months || {}).map(m => m.by))), tos = Object.keys(Object.assign({}, ...Object.values(D.ws || {})));
  const cand = [...new Set(sup.concat(tos))].filter(n => !cs.find(c => c.name === n));
  return `${orderOn() ? '<div class="od-entry"><div><b>発注書をつくる</b><span class="k">仕入先を選ぶと、いつもの品と前回の数が出ます。FAXで送れる形で印刷・PDFにします</span></div><button class="btn" type="button" id="od-open">発注書をつくる</button></div>' : ''}${cs.length ? '' : '<p class="k" style="margin:0 0 8px">まだありません。請求書を撮影すると仕入先が自動で登録されます。手入力で追加することもできます</p>'}
    ${cs.map(c => `<div class="contact-row"><b>${esc(c.name)}</b><span class="k">${esc(c.kind)}</span><span class="tel">${c.tel ? `<a href="tel:${esc(c.tel.replace(/[^\\d+]/g, ''))}">☎ ${esc(c.tel)}</a>` : '<span class="k">電話番号未登録</span>'}</span><span class="k">${esc(c.person)}${c.regno ? ` · ${esc(c.regno)}` : ''}${c.fax ? ` · FAX ${esc(c.fax)}` : ''}</span><button class="btn ghost sm" type="button" data-ct-edit="${esc(c.name)}">編集</button>${c.addr ? `<div class="k" style="grid-column:1/-1;margin-top:-4px">住所: ${esc(c.addr)}</div>` : ''}${c.bank || c.number ? `<div class="k" style="grid-column:1/-1;margin-top:-4px">振込先: ${esc([c.bank, c.branch, c.type, c.number, c.holder].filter(Boolean).join(' '))}</div>` : ''}</div>`).join('')}
    ${cs.length ? '<div class="ask"><button class="btn ghost" type="button" id="ct-add">＋ 仕入先・卸先を追加</button></div>' : ''}<div id="ct-form" style="margin-top:12px"${cs.length ? ' hidden' : ''}><div class="fld"><span class="k">名称</span><input id="ct-name" list="ct-cand" placeholder="仕入先・卸先の名称"><datalist id="ct-cand">${cand.map(n => `<option value="${esc(n)}">`).join('')}</datalist><span class="k">種類</span><div class="seg" id="ct-kind">${['業者', '卸先', 'その他'].map((k, i) => `<button type="button" data-v="${k}" aria-pressed="${i === 0}">${k === '業者' ? '仕入先' : k}</button>`).join('')}</div><span class="k">電話</span><input id="ct-tel" inputmode="tel" placeholder="電話番号"><input id="ct-fax" inputmode="tel" placeholder="FAX番号(発注書を送る先)"><span class="k">担当者</span><input id="ct-person" placeholder="担当者名"><span class="k">住所</span><input id="ct-addr" placeholder="住所"><span class="k">登録番号</span><input id="ct-regno" placeholder="T から始まる13桁(インボイス)" autocomplete="off">${noMoney() ? '<span class="k">振込先</span><span class="k">店主と、金額の閲覧権限がある方のみ表示されます</span>' : `<span class="k">振込先</span><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><input id="ct-bank" placeholder="銀行"><input id="ct-branch" placeholder="支店"><select id="ct-type" class="sel"><option value="">種別</option><option>普通</option><option>当座</option></select><input id="ct-number" inputmode="numeric" placeholder="口座番号"><input id="ct-holder" placeholder="名義(カナ)" style="grid-column:1/-1"></div>`}</div><p class="k" style="margin:4px 0 0">請求書を撮影すると、電話番号・担当者・住所・振込先が自動で入力されます(読み取れなかった項目は空欄のままです)</p><div class="ask"><button class="btn" type="button" id="ct-save">連絡先を保存</button><button class="btn ghost" type="button" id="ct-del" hidden>削除</button></div></div>`;
}
const ctv = id => { const e = $(id); return e ? e.value.trim() : ''; }, ctset = (id, v) => { const e = $(id); if (e) e.value = v; };
function bindContacts(root) {
  const odb = root.querySelector('#od-open'); if (odb) odb.onclick = () => openOrder();
  const kindSel = k => root.querySelectorAll('#ct-kind button').forEach(x => x.setAttribute('aria-pressed', x.dataset.v === k));
  root.querySelectorAll('#ct-kind button').forEach(b => b.onclick = () => kindSel(b.dataset.v));
  const open = () => { const f = root.querySelector('#ct-form'); f.hidden = false; const a = root.querySelector('#ct-add'); if (a) a.hidden = true; f.scrollIntoView({ block: 'center', behavior: 'smooth' }); };
  const ad = root.querySelector('#ct-add'); if (ad) ad.onclick = () => { open(); $('ct-name').focus(); };
  root.querySelectorAll('[data-ct-edit]').forEach(b => b.onclick = () => { open(); const c = (D.contacts || []).find(x => x.name === b.dataset.ctEdit); if (!c) return; $('ct-name').value = c.name; $('ct-tel').value = c.tel; $('ct-fax').value = c.fax || ''; $('ct-person').value = c.person; $('ct-addr').value = c.addr || ''; ctset('ct-regno', c.regno || ''); ctset('ct-bank', c.bank || ''); ctset('ct-branch', c.branch || ''); ctset('ct-type', c.type || ''); ctset('ct-number', c.number || ''); ctset('ct-holder', c.holder || ''); kindSel(c.kind); $('ct-del').hidden = false; $('ct-name').scrollIntoView({ block: 'center', behavior: 'smooth' }); });
  $('ct-save').onclick = () => { const name = $('ct-name').value.trim(); if (!name) { $('ct-name').focus(); return; } setValueX({ field: 'contact', value: { name, kind: root.querySelector('#ct-kind [aria-pressed="true"]').dataset.v, tel: $('ct-tel').value.trim(), fax: $('ct-fax').value.trim(), person: $('ct-person').value.trim(), addr: $('ct-addr').value.trim(), regno: ctv('ct-regno'), bank: ctv('ct-bank'), branch: ctv('ct-branch'), type: ctv('ct-type'), number: ctv('ct-number'), holder: ctv('ct-holder') } }); };
  $('ct-del').onclick = () => { const name = $('ct-name').value.trim(); if (name && confirmOnce('ct' + name, 'もう一度押すと、この連絡先を削除します')) setValueX({ field: 'contact', value: { name, del: true } }); };
}
// ---------- メンバー(店主だけ): 役割・金額の表示/非表示・外す ----------
const MONEY_TABS = ['cost', 'book', 'sales'];
let mLocked = false, MLOCK = null;   // 金額表示のロック(しばらく使わなければ閉じる)。閉じている間は、金額の閲覧権限がない人と同じ見え方にする
const noMoney = () => !!(D && D.hideMoney) || mLocked;
const noCost = () => !!(D && D.hideCost);
const tabLocked = k => k === 'cost' ? noCost() : noMoney() && MONEY_TABS.includes(k);
const perm = k => !D || !D.me || !D.me.perms || !!D.me.perms[k];
const SH = k => !!(D && (D.shelved || []).includes(k));
// プランで使える機能(全プラン共通のものは常に true)
const PL = f => !D || !D.plan || (D.plan.feats || []).includes(f);
const PLAN_NEED = { analysis: 'スタンダード', sales: 'スタンダード', shelf: 'スタンダード', post: 'スタンダード', ws: 'スタンダード', target: 'プロ', brand: 'プロ' };
// 使える量(設定に出す)
function planUse() {
  const u = D.plan, bar = (n, m) => m ? `<span class="ubar"><i style="width:${Math.min(100, Math.round(n / m * 100))}%"></i></span>` : '';
  const row = (l, n, m, note) => `<div class="urow"><span>${l}</span><span class="k">${n}${m ? ' / ' + m : ''}${note || ''}</span>${bar(n, m)}</div>`;
  return `<div class="ubox">${row('AIへの相談(今日)', u.chat.n, u.chat.max, u.chat.normal ? `(通常の速度${u.chat.normal}回まで・毎朝4時に戻ります)` : '(上限なし)')}
    ${row('写真の読み取り(今月)', u.photo.used, u.photo.limit, u.photo.pack ? `(パック残り${u.photo.pack})` : '')}${row('文案づくり(今月)', u.text.used, u.text.limit, u.text.pack ? `(パック残り${u.text.pack})` : '')}
    ${u.items ? row('品数', u.itemCount, u.items) : ''}</div>`;
}
// プランにない機能の画面: 中身をしまって、何ができるかとプランを出す
function applyPlanLocks() {
  [['sales', 'sales', '売上と経費を集計し、月ごとの入金・出金・差額を確認できます。商品分析(利益の大きい商品と見直しが必要な商品)もこちらです。'], ['ws', 'ws', '卸先ごとの納品を記録し、月ごとの請求書を作成します。']].forEach(([tab, f, what]) => {
    const sec = $('t-' + tab); if (!sec) return;
    const lock = !PL(f); sec.classList.toggle('locked', lock);
    let c = sec.querySelector(':scope > .lockcard');
    if (lock && !c) { c = document.createElement('div'); c.className = 'card lockcard'; const ph = sec.querySelector(':scope > .ph'); ph ? ph.after(c) : sec.prepend(c); }
    if (c) { c.hidden = !lock; if (lock) c.innerHTML = `<p style="margin:0 0 8px"><b>${PLAN_NEED[f]}プランからご利用いただけます</b></p><p class="k" style="margin:0 0 12px">${what}</p><button class="btn ghost" type="button" data-plan-ask>運営に問い合わせる</button>`; }
    if (c) c.querySelectorAll('[data-plan-ask]').forEach(b => b.onclick = () => { show('set'); setTimeout(() => { const x = $('ct-text'); if (x) { x.scrollIntoView({ block: 'center' }); x.value = x.value || (PLAN_NEED[f] + 'プランについて詳しく知りたいです。'); } }, 200); });
  });
}   // しまった機能(伝言・在庫・インスタ)
// 画面でエラーが起きたら「つまずき」として残す(店主に夕方まとめて届く)
window.addEventListener('error', e => { try { if (!D) return; api({ kind: 'app_err', text: (cur || '') + ' ' + String(e.message || '').slice(0, 150) }); } catch (x) {} });
window.addEventListener('unhandledrejection', e => { try { if (!D) return; api({ kind: 'app_err', text: (cur || '') + ' ' + String((e.reason && e.reason.message) || e.reason || '').slice(0, 150) }); } catch (x) {} });
// 消すボタンを押したら「あとで戻せる/完全に消す」を選んでもらう(LINEの中では確認の窓が出ないので、画面の中で選ぶ)
function delChoice(b, onTrash, onPurge) {
  if (!b) return;
  b.onclick = () => {
    if (b.dataset.open) return;
    b.dataset.open = 1; b.hidden = true;
    const wrap = document.createElement('span');
    wrap.style.cssText = 'display:inline-flex;gap:8px;flex-wrap:wrap;justify-content:flex-end';
    wrap.innerHTML = '<button class="btn ghost sm" type="button" data-c="t">削除(後で元に戻せます)</button><button class="btn sm" type="button" data-c="p" style="background:var(--warn);border-color:var(--warn);color:#fff">完全に削除(元に戻せません)</button><button class="btn ghost sm" type="button" data-c="x">キャンセル</button>';
    b.after(wrap);
    const close = () => { clearTimeout(tm); wrap.remove(); b.hidden = false; delete b.dataset.open; };
    const tm = setTimeout(close, 10000);
    wrap.querySelector('[data-c="t"]').onclick = () => { close(); onTrash(); };
    wrap.querySelector('[data-c="p"]').onclick = () => { close(); onPurge(); };
    wrap.querySelector('[data-c="x"]').onclick = close;
  };
}
// 消すボタンは2回押し(LINEの中では確認の窓が出ないことがあるので、画面の中で確かめる)
function twice(b, label, fn) {
  if (!b) return; const orig = b.textContent, st0 = b.getAttribute('style') || '';
  b.onclick = () => {
    if (b.dataset.armed) { clearTimeout(b._t); fn(); return; }
    b.dataset.armed = 1; b.textContent = label; b.setAttribute('style', st0 + ';background:var(--warn);color:#fff;border-color:var(--warn)');
    b._t = setTimeout(() => { delete b.dataset.armed; b.textContent = orig; b.setAttribute('style', st0); }, 5000);
  };
}
async function renderMembers() {
  const box = $('members-box'); if (!box) return;
  if (!D.me || !(D.me.owner || perm('member'))) { box.parentNode.hidden = true; return; }
  box.parentNode.hidden = false;
  box.innerHTML = '<p class="k" style="margin:0">読み込んでいます…</p>';
  const r = await api({ kind: 'app_members' }).catch(() => null); if (!r || !r.ok) { box.innerHTML = `<p class="k" style="margin:0">${esc((r && r.error) || '読めませんでした')}</p>`; return; }
  drawMembers(r.members, r.plan, r.count);
}
function drawMembers(ms, plan, count) {
  const box = $('members-box'), live = ms.filter(m => m.role !== '外した'), gone = ms.filter(m => m.role === '外した');
  const idle = m => { if (!m.last) return ''; const d = Math.round((Date.now() - new Date(m.last)) / DAY); return d >= 90 ? `<span style="color:var(--warn);font-weight:700">${Math.floor(d / 30)}か月利用がありません</span>` : d >= 1 ? `${d}日前` : '今日'; };
  box.innerHTML = `<p style="margin:0 0 4px"><b>${esc((plan || {}).name || '')}プラン</b> <span class="k">${plan && plan.limit ? `${plan.limit}人まで(現在 ${count}人)` : '人数の上限なし'}${plan && plan.limit && count >= plan.limit ? ' · <span style="color:var(--warn)">上限に達しています。メンバーを削除するか、上位のプランに変更してください</span>' : ''}</span></p><p class="k" style="margin:0 0 8px">${live.filter(m => m.allowed).length}人が利用できます。メンバーごとに権限(原価・レシピ・売上と経費・衛生・メンバー管理)を設定できます。副店長・スタッフ・パートの標準の権限も用意しています。退職した方は「削除」を押すと、すぐにログインできなくなります(その方が入力した記録は残ります)。</p>
    <div class="mem-list">${live.map(m => `<div class="mem"${m.allowed ? '' : ' style="opacity:.75"'}>${avatar(m.name, true)}<div class="mb"><b>${esc(m.name)}</b> <span class="pill ${m.role === '店主' ? '' : 'gray'}">${esc(m.role)}</span>${m.allowed ? '' : ' <span class="pill warn">許可待ち</span>'}<span class="k">${m.line ? 'LINE' : 'メール'} · 最後に使った日 ${idle(m) || '—'}</span></div>
      <div class="macts">${m.allowed ? (m.role === '店主' ? '<span class="k">すべてできます</span>' : `<button class="btn ghost sm" type="button" data-remove="${m.row}" data-n="${esc(m.name)}">外す</button>`) : `<button class="btn sm" type="button" data-allow="${m.row}">許可</button><button class="btn ghost sm" type="button" data-remove="${m.row}" data-n="${esc(m.name)}">断る</button>`}</div></div>`).join('')}</div>
    ${gone.length ? `<details style="margin-top:8px"><summary class="k">外した人(${gone.length})</summary>${gone.map(m => `<div class="mem" style="opacity:.6">${avatar(m.name, true)}<div class="mb"><b>${esc(m.name)}</b><span class="k">外した</span></div><div class="macts"><button class="btn ghost sm" type="button" data-allow="${m.row}">戻す</button></div></div>`).join('')}</details>` : ''}
    <p class="k" style="margin:8px 0 0">新しいメンバーを追加するには、上の「スタッフを招待するリンク」を送ってください。3か月利用のないメンバーがいる場合は、店主のLINEに確認のお知らせが届きます。</p>`;
  const PN = [['cost', '原価の閲覧'], ['recipe', 'レシピの作成・編集'], ['money', '売上・経費の閲覧'], ['hyg', '衛生記録の入力'], ['member', 'メンバーの管理']], PRE = ['副店長', 'スタッフ', 'パート'];
  live.filter(m => m.allowed && m.role !== '店主').forEach(m => {
    const el = box.querySelector(`[data-remove="${m.row}"]`); const row = el && el.closest('.mem'); if (!row) return;
    const p = m.perms || {}, on = PN.filter(([k]) => p[k]).map(([, l]) => l);
    row.insertAdjacentHTML('afterend', `<details class="mem-perm" style="margin:-4px 0 8px 52px"><summary class="k" style="cursor:pointer">${m.title ? esc(m.title) + ' · ' : ''}できること: ${on.length ? on.map(esc).join('・') : '見るだけ'}</summary>
      <div class="seg" style="flex-wrap:wrap;margin:8px 0">${PRE.map(x => `<button type="button" data-pre="${m.row}" data-v="${x}" aria-pressed="${m.title === x}">${x}</button>`).join('')}</div>
      <div style="display:grid;gap:6px">${PN.map(([k, l]) => `<label class="sw"><input type="checkbox" data-pm="${m.row}" data-k="${k}"${p[k] ? ' checked' : ''}${k === 'member' && !D.me.owner ? ' disabled' : ''}><span></span>${l}</label>`).join('')}</div>
      <p class="k" style="margin:8px 0 0">副店長はすべての操作、スタッフはレシピと衛生記録、パートは衛生記録のみ利用できます。役割を選んだ後に、権限を個別に変更することもできます。</p></details>`);
  });
  const act = async (row, action, value) => { const r = await api({ kind: 'app_set', field: 'member', value: { row, action, value } }).catch(() => null); if (!r || !r.ok) { chat((r && r.error) || 'できませんでした'); return; } drawMembers(r.members, r.plan, r.count); toast('メンバーを更新しました', 'ok'); };
  box.querySelectorAll('[data-pre]').forEach(b => b.onclick = () => act(+b.dataset.pre, 'perms', { preset: b.dataset.v }));
  box.querySelectorAll('[data-pm]').forEach(i => i.onchange = () => { const v = {}; box.querySelectorAll(`[data-pm="${i.dataset.pm}"]`).forEach(x => v[x.dataset.k] = x.checked); act(+i.dataset.pm, 'perms', v); });
  box.querySelectorAll('[data-allow]').forEach(b => b.onclick = () => act(+b.dataset.allow, 'allow'));
  box.querySelectorAll('[data-remove]').forEach(b => b.onclick = () => { if (confirmOnce('mem' + b.dataset.remove, `もう一度押すと、${b.dataset.n}さんをメンバーから削除します(すぐにログインできなくなります)`)) act(+b.dataset.remove, 'remove'); });
}
// パンくず(パソコン): ホーム › 原価 › 栗万十
const TABNAME = { today: 'ホーム', cost: '原価', label: '食品表示', mat: '材料', book: '帳簿', hyg: '衛生記録', ws: '卸', ev: '出店', ct: '仕入先・卸先', post: '発信', sales: '商品分析', set: '設定', cal: '予定', howto: '作り方' };
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
  const S = D.status, mo = new Date();
  $('greet-h').textContent = noMoney() ? `${D.shop}` : `${mo.getMonth() + 1}月の状況`;
  $('greet-p').textContent = noMoney() ? $('date').textContent : `${D.shop} · ${$('date').textContent}${S && S.prevMonth ? ` · 先月(${+S.prevMonth.slice(5)}月)と比べて` : ''}`;
  renderStatus();
}
// 今月の状況: 原価率(大きく)と先月との差、売上の内わけの円グラフ、なぜ上がったか(上から3つ)、売値の目安
// 更新情報: 大きな変更があったときだけ、ホームの上に1行。「見た」で消え、次の大きな変更まで出ない。一覧は /guide/updates
let UPD = null;
async function renderUpdBar() {
  const bar = $('updbar'); if (!bar || !CF) return;
  if (UPD === null) { try { const r = await fetch('/guide/updates.json', { cache: 'no-store' }); UPD = (await r.json()).updates || []; } catch (e) { UPD = []; } }
  const big = UPD.find(u => u.big), seen = store.get('updSeen', '');
  if (!big || seen === big.d + big.t) { bar.hidden = true; return; }
  bar.hidden = false; bar.innerHTML = `<b>更新情報</b><span>${esc(big.t)}</span><a href="/guide/updates" target="_blank" rel="noopener">一覧</a><button class="btn ghost sm" type="button" id="upd-ok">確認済み</button>`;
  $('upd-ok').onclick = () => { store.set('updSeen', big.d + big.t); bar.hidden = true; };
}
function renderStatus() {
  renderUpdBar();
  const box = $('status'), S = D.status; if (!box) return;
  if (noMoney() || !S) { box.hidden = true; return; }
  box.hidden = false;
  const pct = v => v == null ? '—' : (Math.round(v * 10) / 10).toLocaleString('ja-JP');
  const arrow = d => d > 0 ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>';
  const hasSales = S.salesEx > 0 && S.rate != null;
  // 円グラフ(材料費と残り)。数字がないときは目標原価率を薄く描く
  const r = 44, c = 2 * Math.PI * r, share = hasSales ? Math.min(1, Math.max(0, S.rate / 100)) : 0;
  const pie = `<svg viewBox="0 0 112 112" role="img" aria-label="売上の内わけ: 材料費 ${pct(S.rate)}%"><circle cx="56" cy="56" r="${r}" fill="none" stroke="var(--ok-soft)" stroke-width="18"/><circle cx="56" cy="56" r="${r}" fill="none" stroke="var(--accent)" stroke-width="18" stroke-dasharray="${(share * c).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 56 56)" stroke-linecap="butt"/><text x="56" y="52" text-anchor="middle" font-size="18" font-weight="700" fill="var(--ink)" font-family="Zen Maru Gothic,sans-serif">${hasSales ? pct(S.rate) + '%' : '—'}</text><text x="56" y="68" text-anchor="middle" font-size="10" fill="var(--ink-2)">材料費</text></svg>`;
  const diffHtml = S.diff == null ? `<span class="d">${S.prevRate == null ? '先月の数字なし' : '先月と同じ'}</span>` : S.diff === 0 ? '<span class="d">先月と同じ</span>' : `<span class="d ${S.diff > 0 ? 'up' : 'dn'}">${arrow(S.diff)}先月より ${Math.abs(S.diff).toLocaleString('ja-JP')}ポイント${S.diff > 0 ? '上がった' : '下がった'}</span>`;
  const why = S.why || [], guide = S.guide || [];
  box.innerHTML = `<div class="rate"><span class="t">今月の原価率 <span style="font-weight:400">(税抜の売上に対する材料費)</span></span><span class="v">${hasSales ? `${pct(S.rate)}<small>%</small>` : '<small style="font-size:20px">販売数を入力すると表示されます</small>'}</span>${hasSales ? diffHtml : ''}${hasSales ? `<span class="k">売上 ${yen(S.salesEx)}(税抜) ・ 材料費 ${yen(S.matCost)} ・ 差額 ${yen(S.profit)} ・ 今月は集計中です</span>` : '<span class="k">精算レシートを撮影するか、売上の報告を取り込むと、今月の原価率が表示されます。</span>'}</div>
    <div class="pie">${pie}<div class="lg"><span><i style="background:var(--accent)"></i>材料費<b>${hasSales ? yen(S.matCost) : '—'}</b></span><span><i style="background:var(--ok-soft);border:1px solid var(--ok)"></i>残り(売上−材料費)<b>${hasSales ? yen(S.profit) : '—'}</b></span></div></div>
    ${why.length ? `<div class="why"><span class="h">原価が上がった理由(直近60日の値上がり)</span>${why.map((w, i) => `<div class="r"><span class="n">${i + 1}</span><span><b>${esc(w.item)}</b>${w.spec ? ` <span class="g">${esc(w.spec)}</span>` : ''} が ${Math.round(w.old).toLocaleString('ja-JP')}円 → ${Math.round(w.now).toLocaleString('ja-JP')}円(+${w.pct}%)。<span class="g">${esc(w.prod)}が苦しい</span></span><span class="u">1${U} +${w.up}円</span></div>`).join('')}</div>` : hasSales ? '<p class="empty">直近60日で、原価を押し上げた値上がりはありません。</p>' : ''}
    ${guide.length ? `<div class="why"><span class="h">売値の目安(原価率${S.target}%にするなら)</span>${guide.map((g, i) => `<div class="r"><span class="n">${i + 1}</span><span><b>${esc(g.name)}</b> <span class="g">原価率 ${g.rate}% ・ 今 ${yen(g.price)}</span></span><span class="u ok">${yen(g.guide)}〜</span></div>`).join('')}</div>` : ''}`;
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
    cards.push({ cls: 'main', t: '未払い', v: `${Math.round(sum).toLocaleString('ja-JP')}<small>円</small>`, k: `${up.length}件${n.due ? ' · 次の期限 ' + md(n.due) + ' ' + esc(n.supplier) : ''}`, go: () => show('book') }); }
  else cards.push({ cls: 'main', t: '未払い', v: '0<small>円</small>', k: '未払いはありません', go: () => show('book') });
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
  h.innerHTML = cards.map((c, i) => `<div class="hc ${c.cls}" role="button" tabindex="0" data-i="${i}"${c.c ? ` style="--c:var(--c-${c.c})"` : ''}><div class="t">${c.t}</div><div class="v">${c.v}</div><div class="k">${c.k}</div><div class="go">詳細 ›</div></div>`).join('');
  h.querySelectorAll('.hc').forEach(el => el.onclick = () => cards[el.dataset.i].go());
  $('hero-dots').innerHTML = cards.length > 1 ? cards.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('') : '';
  h.onscroll = () => { const w = h.firstChild ? h.firstChild.offsetWidth + 10 : 1, i = Math.round(h.scrollLeft / w); $('hero-dots').querySelectorAll('i').forEach((d, j) => d.className = j === i ? 'on' : ''); };
}
// ---------- きょう: アイコンの並び ----------
const IC = {
  howto: '<path d="M9 6.5h11M9 12h11M9 17.5h7"/><circle cx="4.5" cy="6.5" r="1.6"/><circle cx="4.5" cy="12" r="1.6"/><circle cx="4.5" cy="17.5" r="1.6"/>',
  cam: '<path d="M3.5 8.5h3.3l1.7-2.5h7l1.7 2.5h3.3v10.5h-17z"/><circle cx="12" cy="13.4" r="3.4"/>',
  cost: '<circle cx="12" cy="12" r="8.5"/><path d="M9 7.5l3 4.2 3-4.2M12 11.7V17M9.3 13.3h5.4M9.3 15.5h5.4"/>',
  label: '<path d="M6 3.5h12v17H6z"/><path d="M9.5 9h5M9.5 12.5h5M9.5 16h3"/>',
  mat: '<path d="M7 9c-1.6 2.3-2.2 5.2-1.6 8.3.3 1.5 1.4 2.4 2.9 2.4h7.4c1.5 0 2.6-.9 2.9-2.4.6-3.1 0-6-1.6-8.3z"/><path d="M8.5 9 7.5 5M15.5 9l1-4M7.5 5c1.4.7 2.9 1 4.5 1s3.1-.3 4.5-1"/>',
  stock: '<path d="M3 9.5 12 4.5l9 5"/><path d="M5 8.5V20h14V8.5"/><path d="M10 20v-5h4v5"/>',
  order: '<path d="M6 9V3h9l3 3v3"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 17v4h10v-4"/><path d="M7 13h4"/>',
  hyg: '<path d="M10 4.5a2 2 0 0 1 4 0v9.2a4 4 0 1 1-4 0z"/><path d="M12 10v7"/><path d="M17 6h2.5M17 9.5h2.5"/>',
  book: '<rect x="4.5" y="3.5" width="15" height="17" rx="2"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',
  ev: '<path d="M3 9l2-5h14l2 5"/><path d="M3 9c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3"/><path d="M5 12v8h14v-8"/><path d="M10 20v-5h4v5"/>',
  ws: '<path d="M3.5 9h11v10h-11z"/><path d="M14.5 12h3.5l2.5 3v4h-6z"/><circle cx="7" cy="19.5" r="1.6"/><circle cx="17.5" cy="19.5" r="1.6"/>',
  post: '<path d="M4 10v4h3l6 4V6L7 10z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11"/>',
  sales: '<path d="M4 19h16"/><path d="M6 15.5l4-5 3.5 3 4.5-6"/><path d="M14.5 7.5H18V11"/>',
  home: '<path d="M3 11.2 12 4l9 7.2"/><path d="M5.5 10v10h13V10"/><path d="M10 20v-6h4v6"/>',
  ct: '<rect x="4" y="3" width="15" height="18" rx="2"/><circle cx="11.5" cy="10" r="2.6"/><path d="M7.5 17c.6-2.2 2.2-3.3 4-3.3s3.4 1.1 4 3.3M19 7h1.5M19 11h1.5M19 15h1.5"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><path d="M8 13h3M8 16.5h3M13.5 13h2.5"/>',
  memo: '<path d="M4 5.5h16v10H9l-4 3.5z"/><path d="M8 9h8M8 12h5"/>',
  more: '<circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/>',
  sort: '<path d="M3 7l2-3h14l2 3"/><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 12h6"/>',
  set: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>'
};
// ---------- 入口をしぼる: 利用する業務で、メニューの前に出すものを決める ----------
let MORE = false;
const JOB_TABS = { ws: ['ws', 'ct'], stock: ['stock'], cal: ['cal'], sales: ['sales'], post: ['post'], howto: ['howto'], ev: ['ev'] };
// 印をつける前は、いま使っているもの(卸の納品・在庫・予定がある)から決める
function jobSignals() { const s = []; if (D && D.ws && Object.keys(D.ws).length) s.push('ws'); if (D && ((D.stock || {}).items || []).length) s.push('stock'); if (D && (D.events || []).length) s.push('cal'); return s; }
function jobsNow() { return D && Array.isArray(D.jobs) ? D.jobs : jobSignals(); }
function frontKeys() {
  if (noMoney()) return ['cam', 'sort', 'hyg', 'howto'];
  const f = ['cam', 'sort', 'cost', 'label', 'hyg', 'book'];
  if (orderOn()) f.push('order');   // 発注書(オプション)を使うお店は、前に出す
  jobsNow().forEach(j => (JOB_TABS[j] || []).forEach(k => f.includes(k) || f.push(k)));
  return f;
}
function renderMenu(q) {
  const low = ((D.stock || {}).items || []).filter(x => x.low).length, up = unpaid().length;
  const items0 = [
    ['cam', '撮影', openCamera, 0, 'p'], ...(CF ? [['sort', '取り込み一覧', sortOpen, (SORT || []).filter(x => x.state === '聞く' || x.state === '確かめ').length, (SORT || []).filter(x => x.state === '聞く').length]] : []), ['cost', '原価', () => show('cost')], ['label', sellFace() ? 'アレルゲン' : '食品表示', () => show('label')], ['howto', '作り方', () => show('howto')], ['mat', '材料', () => { matF = 'all'; show('mat'); }],
    ...(SH('stock') ? [] : [['stock', '在庫', () => { matF = 'low'; show('mat'); }, low]]), ['hyg', '衛生', () => show('hyg'), hygMissing().length, hygMissing().length], ['book', '帳簿', () => show('book'), up], ['ws', '卸', () => show('ws')], ...(orderOn() ? [['order', '発注書', () => openOrder(), ((D.order || {}).sups || []).reduce((a, x) => a + (x.lowN || 0), 0)]] : []), ['ct', '仕入先・卸先', () => show('ct')], ...(evOn() ? [['ev', '出店', () => show('ev'), evWarns().length, evWarns().filter(d => d.warn === 'out').length]] : []), ...(SH('post') ? [] : [['post', '発信', () => show('post')]]), ['sales', '商品分析', () => show('sales')], ...(SH('cal') ? [] : [['cal', '予定', () => show('cal'), (D.events || []).filter(e => dayDiff(e.date) === 0).length]])];
  // 前に出すのは、よく使う入口だけ。ほかは「その他の機能」にしまう(消さない)。スタッフは4つ
  const F = new Set(frontKeys()), vis = x => !(tabLocked(x[0]) || SH(x[0]));
  const restAll = items0.filter(x => !F.has(x[0]) && vis(x)), TAB0 = { stock: 'mat', mat: 'mat' };
  const open = MORE || restAll.some(x => (TAB0[x[0]] || x[0]) === cur);
  const moreB = restAll.reduce((a, x) => a + (x[3] || 0), 0);
  const items = items0.filter(x => F.has(x[0])).concat(restAll.length ? [['more', open ? '閉じる' : 'その他の機能', () => { MORE = !open; renderMenu(); }, open ? 0 : moreB]] : [], open ? restAll : []);
  const m = $('menu');
  m.innerHTML = items.map(([k, l, , b, w], i) => w === 'p' || tabLocked(k) || SH(k) ? '' : `<button type="button" data-i="${i}" style="--c:var(--c-${k})"><span class="ic${w === 'p' ? ' p' : ''}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]}</svg></span>${l}${b ? `<span class="badge">${b}</span>` : ''}</button>`).join('');
  m.querySelectorAll('button').forEach(b => b.onclick = () => items[b.dataset.i][2]());
  // パソコンの広い画面では、同じメニューを左に縦に並べる
  const TAB = { cost: 'cost', howto: 'howto', label: 'label', mat: 'mat', hyg: 'hyg', book: 'book', ws: 'ws', ct: 'ct', post: 'post', sales: 'sales', cal: 'cal', ev: 'ev' };
  const all = [['home', 'ホーム', () => show('today'), 0, 0, 'today']].concat(items.map(x => [x[0], x[1], x[2], x[3] || 0, x[4] || 0, TAB[x[0]] || '']), [['set', '設定', () => show('set'), 0, 0, 'set']]);
  const side = $('side');
  side.innerHTML = `<div class="sname"><i></i>${esc(D.shop)}<small>${esc($('date').textContent)}</small></div>` + all.map(([k, l, , b, w, t], i) => tabLocked(k) || SH(k) ? '' : `<button type="button" data-i="${i}" data-tab="${t}" class="${w === 'p' ? 'p' : k === 'more' ? 'more' : ''}" style="--c:var(--c-${k})"${t && t === cur ? ' aria-current="page"' : ''}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]}</svg>${l}${b ? `<span class="badge">${b}</span>` : ''}</button>`).join('');
  side.insertAdjacentHTML('beforeend', `<div class="gap"></div><div class="who">${esc(profileName || '')}${profileName ? ' · ' : ''}${esc(D.shop)}</div>`);
  side.querySelectorAll('button').forEach(b => b.onclick = () => all[b.dataset.i][2]());
}
// ---------- 作り方(スタッフも見られる。書く・直すのは原価のカード) ----------
function bindStepImgs(box) {
  box.querySelectorAll('img.stimg[data-img]').forEach(async im => {
    const id = im.dataset.img;
    if (IMG_CACHE[id]) { im.src = IMG_CACHE[id]; return; }
    const r = await api({ kind: 'app_img_get', id });
    if (r.ok) { IMG_CACHE[id] = `data:${r.type};base64,${r.data}`; im.src = IMG_CACHE[id]; } else im.alt = '写真を表示できませんでした';
  });
}
let howtoSel = null;
function renderHowto() {
  const box = $('howto-box'); if (!box) return;
  const ps = D.products.filter(p => p.kind !== 'part');
  if (!ps.length) { box.innerHTML = emptyBox('cam', 'レシピが登録されていません', 'レシピを撮影すると、ここに作り方が表示されます。', ['レシピを撮影', 'cam']); return; }
  const sel = ps.find(p => p.name === howtoSel);
  if (!sel) {
    box.innerHTML = ps.map(p => `<div class="card prod" role="button" tabindex="0" data-howto="${esc(p.name)}"><div class="hd">${avatar(p.name)}<span class="nm">${esc(p.name)}</span><span class="k">${(p.steps || []).length ? p.steps.length + '手順' + ((p.simgs || []).filter(Boolean).length ? '・写真' + p.simgs.filter(Boolean).length : '') : '手順未登録'}</span></div></div>`).join('');
    box.querySelectorAll('[data-howto]').forEach(c => { const go = () => { howtoSel = c.dataset.howto; renderHowto(); window.scrollTo(0, 0); }; c.onclick = go; c.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }; });
    return;
  }
  const p = sel, canCost = !noMoney() && p.batch_cost != null;
  box.innerHTML = `<div class="card" style="grid-column:1/-1">
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><button class="btn ghost sm" type="button" id="howto-back">← 一覧に戻る</button><b style="font-size:18px">${esc(p.name)}</b></div>
    <div class="set" style="margin-top:12px"><span class="k">仕込み量</span><input id="hq" inputmode="numeric" placeholder="例 60"><span class="k">${U}分</span><button class="btn ghost" type="button" id="hq-go">分量を計算</button></div><div id="hq-out"></div>
    ${(p.steps || []).length ? `<ol class="steps" style="margin-top:12px">${p.steps.map((st, si) => `<li>${esc(st)}${(p.simgs || [])[si] ? `<div><img class="stimg" data-img="${esc(p.simgs[si])}" alt="手順${si + 1}の写真"></div>` : ''}</li>`).join('')}</ol>` : '<p class="k" style="margin-top:12px">手順は登録されていません。' + (noMoney() ? '店主にご相談ください。' : '「原価」の商品画面から登録できます。') + '</p>'}
  </div>`;
  $('howto-back').onclick = () => { howtoSel = null; renderHowto(); };
  $('hq-go').onclick = () => {
    const n = +($('hq').value || 0), out = $('hq-out');
    if (!(n > 0)) { out.innerHTML = '<p class="k" style="margin:4px 0 0">製造数を入力してください。</p>'; return; }
    if (!p.pieces) { out.innerHTML = `<p class="k" style="margin:4px 0 0">1${U}の重さが未入力のため、分量を計算できません。${noMoney() ? '店主に声をかけてください。' : '「原価」のカードで入れられます。'}</p>`; return; }
    const f = n / p.pieces, fq = v => (v >= 20 ? Math.round(v).toLocaleString() : Math.round(v * 10) / 10) + 'g';
    out.innerHTML = `<table style="margin:4px 0 0">${p.rows.map(r => `<tr><td>${esc(r.name)}</td><td class="n">${r.grams == null ? (Math.round(r.qty * f * 10) / 10) + esc(r.unit) : fq(r.grams * f)}</td></tr>`).join('')}${canCost ? `<tr><td><b>材料費</b></td><td class="n"><b>${yen(p.batch_cost * f)}</b></td></tr>` : ''}</table>`;
  };
  bindStepImgs(box);
}
function renderBook() { renderPays(); renderSort(); renderJournal(); }
const PILL = { '未払い': 'warn', '済': '', '現金済': '', '請求待ち': 'gray' };
function renderSort() {
  const all = D.pays || [], ms = [...new Set(all.map(p => p.month))].sort().reverse();
  const chips = $('sort-chips'), box = $('sort-box');
  if (!ms.length) { chips.innerHTML = ''; box.innerHTML = '<p class="k" style="margin:0">請求書が登録されていません。撮影すると、月別に表示されます</p>'; return; }
  const sel = chips.dataset.m && ms.includes(chips.dataset.m) ? chips.dataset.m : ms[0];
  chips.innerHTML = ms.map(m => `<button class="chip" type="button" data-m="${esc(m)}" aria-pressed="${m === sel}">${esc(m.replace('-', '年'))}月分</button>`).join('');
  chips.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { chips.dataset.m = b.dataset.m; renderSort(); });
  const rows = all.filter(p => p.month === sel).sort((a, b) => a.supplier.localeCompare(b.supplier, 'ja'));
  const tot = rows.reduce((a, p) => a + p.total, 0), done = rows.filter(p => p.status !== '未払い' && p.status !== '請求待ち').reduce((a, p) => a + p.total, 0);
  const msAsc = Object.keys(D.months || {}).filter(k => k !== '不明').sort().slice(-6), jr = (D.journal || {})[sel] || {};
  const bySup = Object.entries((D.months || {})[sel] ? D.months[sel].by : {}).map(([l, v]) => ({ l, v })).sort((a, b) => b.v - a.v);
  box.innerHTML = `<div class="chgrid"><div><p class="ct">月ごとの仕入れ</p>${barsV(msAsc.map(k => ({ l: +k.slice(5) + '月', v: D.months[k].total })), 'var(--c-book)', { label: '月ごとの仕入れ', w: 320, h: 170 })}</div>
    ${Object.keys(jr).length ? `<div><p class="ct">${esc(sel.replace('-', '年'))}月の科目(案)</p>${donut(Object.entries(jr).map(([l, v]) => ({ l, v })), 'var(--c-book)', { center: '合計', label: '科目の内訳' })}</div>` : ''}
    ${bySup.length ? `<div class="wide"><p class="ct">仕入先別</p>${barsH(bySup.slice(0, 8), 'var(--c-book)')}</div>` : ''}</div>
    <table>${rows.map(p => `<tr><td><b>${esc(p.supplier)}</b><br><span class="k">${esc(p.doc)}${p.paidOn ? ' · ' + esc(p.paidOn.slice(5).replace('-', '/')) + '払い' : p.due ? ' · 期限 ' + esc(p.due.slice(5).replace('-', '/')) : ''}</span></td><td class="n">${yen(p.total)}<br><span class="pill ${PILL[p.status] ?? 'gray'}">${esc(p.status)}</span></td></tr>`).join('')}
    <tr><td><b>合計 ${rows.length}件</b></td><td class="n"><b>${yen(tot)}</b><br><span class="k">払い済み ${yen(done)}</span></td></tr></table>
    <div class="ask" style="margin-top:8px"><button class="btn ghost" type="button" id="sort-copy">この月をコピー</button></div>
    <p class="k" style="margin:8px 0 0">コピーした内容は、税理士へのメールや会計ソフトのメモに貼り付けられます</p>`;
  $('sort-copy').onclick = async () => {
    const sums = (D.journal || {})[sel] || {};
    const txt = `${sel.replace('-', '年')}月分 請求書\n` + rows.map(p => `${p.supplier}\t${p.doc}\t${p.total}円\t${p.status}${p.paidOn ? '(' + p.paidOn + ')' : ''}`).join('\n') + `\n合計\t\t${tot}円\n\n科目ごと(案)\n` + Object.keys(sums).map(k => `${k}\t${sums[k]}円`).join('\n');
    try { await navigator.clipboard.writeText(txt); chat('コピーしました。貼り付けてご利用ください。', 'heart'); } catch (e) { chat('コピーできませんでした。長押しで選択してください。'); }
  };
}
// ---------- 振込先一覧(押すと銀行の公式サイトへ。送金はしない) ----------
// 銀行名と公式サイトは、全国銀行協会の会員一覧(2026-11-18 確認)より
const BANKS = [
  ['主要銀行', [['yucho', 'ゆうちょ銀行', 'https://www.jp-bank.japanpost.jp/'], ['mizuho', 'みずほ銀行', 'https://www.mizuhobank.co.jp/'], ['mufg', '三菱UFJ銀行', 'https://www.bk.mufg.jp/'], ['smbc', '三井住友銀行', 'https://www.smbc.co.jp/'], ['resona', 'りそな銀行', 'https://www.resonabank.co.jp/']]],
  ['ネット銀行', [['paypay', 'PayPay銀行', 'https://www.paypay-bank.co.jp/'], ['rakuten', '楽天銀行', 'https://www.rakuten-bank.co.jp/'], ['sbi', 'ドコモSMTBネット銀行(旧 住信SBIネット銀行)', 'https://www.netbk.co.jp/'], ['sony', 'ソニー銀行', 'https://moneykit.net/'], ['jibun', 'auじぶん銀行', 'https://www.jibunbank.co.jp/'], ['gmo', 'GMOあおぞらネット銀行', 'https://gmo-aozora.com/'], ['b0040', 'イオン銀行', 'https://www.aeonbank.co.jp/']]]
];
// 地方銀行・第二地方銀行(都道府県ごと)
const BANKS_REG = [
  ['北海道', [['b0116', '北海道銀行', 'https://www.hokkaidobank.co.jp/'], ['b0501', '北洋銀行', 'https://www.hokuyobank.co.jp/']]],
  ['青森県', [['b0117', '青森みちのく銀行', 'https://www.am-bk.co.jp/']]],
  ['岩手県', [['b0123', '岩手銀行', 'https://www.iwatebank.co.jp/'], ['b0124', '東北銀行', 'https://www.tohoku-bank.co.jp/'], ['b0509', '北日本銀行', 'https://www.kitagin.co.jp/']]],
  ['宮城県', [['b0125', '七十七銀行', 'https://www.77bank.co.jp/'], ['b0512', '仙台銀行', 'https://www.sendaibank.co.jp/']]],
  ['秋田県', [['b0119', '秋田銀行', 'https://www.akita-bank.co.jp/'], ['b0120', '北都銀行', 'https://www.hokutobank.co.jp/']]],
  ['山形県', [['b0121', '荘内銀行', 'https://www.shonai.co.jp/'], ['b0122', '山形銀行', 'https://www.yamagatabank.co.jp/'], ['b0508', 'きらやか銀行', 'https://www.kirayaka.co.jp/']]],
  ['福島県', [['b0126', '東邦銀行', 'https://www.tohobank.co.jp/'], ['b0513', '福島銀行', 'https://www.fukushimabank.co.jp/'], ['b0514', '大東銀行', 'https://www.daitobank.co.jp/']]],
  ['茨城県', [['b0130', '常陽銀行', 'https://www.joyobank.co.jp/'], ['b0131', '筑波銀行', 'https://www.tsukubabank.co.jp/']]],
  ['栃木県', [['b0129', '足利銀行', 'https://www.ashikagabank.co.jp/'], ['b0517', '栃木銀行', 'https://www.tochigibank.co.jp/']]],
  ['群馬県', [['b0128', '群馬銀行', 'https://www.gunmabank.co.jp/'], ['b0516', '東和銀行', 'https://www.towabank.co.jp/']]],
  ['埼玉県', [['b0133', '武蔵野銀行', 'https://www.musashinobank.co.jp/'], ['b0017', '埼玉りそな銀行', 'https://www.resona-gr.co.jp/saitamaresona/']]],
  ['千葉県', [['b0134', '千葉銀行', 'https://www.chibabank.co.jp/'], ['b0135', '千葉興業銀行', 'https://www.chibakogyo-bank.co.jp/'], ['b0522', '京葉銀行', 'https://www.keiyobank.co.jp/']]],
  ['東京都', [['b0137', 'きらぼし銀行', 'https://www.kiraboshibank.co.jp/'], ['b0525', '東日本銀行', 'https://www.higashi-nipponbank.co.jp/'], ['b0526', '東京スター銀行', 'https://www.tokyostarbank.co.jp/']]],
  ['神奈川県', [['b0138', '横浜銀行', 'https://www.boy.co.jp/'], ['b0530', '神奈川銀行', 'https://www.kanagawabank.co.jp/']]],
  ['新潟県', [['b0140', '第四北越銀行', 'https://www.dhbk.co.jp/'], ['b0532', '大光銀行', 'https://www.taikobank.jp/']]],
  ['富山県', [['b0144', '北陸銀行', 'https://www.hokugin.co.jp/'], ['b0145', '富山銀行', 'https://www.toyamabank.co.jp/'], ['b0534', '富山第一銀行', 'https://www.first-bank.co.jp/']]],
  ['石川県', [['b0146', '北國銀行', 'https://www.hokkokubank.co.jp/']]],
  ['福井県', [['b0147', '福井銀行', 'https://www.fukuibank.co.jp/']]],
  ['山梨県', [['b0142', '山梨中央銀行', 'https://www.yamanashibank.co.jp/']]],
  ['長野県', [['b0143', '八十二長野銀行', 'https://bank.82group.jp/']]],
  ['岐阜県', [['b0152', '大垣共立銀行', 'https://www.okb.co.jp/'], ['b0153', '十六銀行', 'https://www.juroku.co.jp/']]],
  ['静岡県', [['b0149', '静岡銀行', 'https://www.shizuokabank.co.jp/'], ['b0150', 'スルガ銀行', 'https://www.surugabank.co.jp/'], ['b0151', '清水銀行', 'https://www.shimizubank.co.jp/'], ['b0538', '静岡中央銀行', 'https://www.shizuokachuo-bank.co.jp/']]],
  ['愛知県', [['b0542', 'あいち銀行', 'https://www.aichibank.co.jp/'], ['b0543', '名古屋銀行', 'https://www.meigin.com/']]],
  ['三重県', [['b0154', '三十三銀行', 'https://www.33bank.co.jp/'], ['b0155', '百五銀行', 'https://www.hyakugo.co.jp/']]],
  ['滋賀県', [['b0157', '滋賀銀行', 'https://www.shigagin.com/']]],
  ['京都府', [['b0158', '京都銀行', 'https://www.kyotobank.co.jp/']]],
  ['大阪府', [['b0159', '関西みらい銀行', 'https://www.kansaimiraibank.co.jp/'], ['b0161', '池田泉州銀行', 'https://www.sihd-bk.jp/']]],
  ['兵庫県', [['b0164', '但馬銀行', 'https://www.tajimabank.co.jp/'], ['b0562', 'みなと銀行', 'https://www.minatobk.co.jp/']]],
  ['奈良県', [['b0162', '南都銀行', 'https://www.nantobank.co.jp/']]],
  ['和歌山県', [['b0163', '紀陽銀行', 'https://www.kiyobank.co.jp/']]],
  ['鳥取県', [['b0166', '鳥取銀行', 'https://www.tottoribank.co.jp/']]],
  ['島根県', [['b0167', '山陰合同銀行', 'https://www.gogin.co.jp/'], ['b0565', '島根銀行', 'https://www.shimagin.co.jp/']]],
  ['岡山県', [['b0168', '中国銀行', 'https://www.chugin.co.jp/'], ['b0566', 'トマト銀行', 'https://www.tomatobank.co.jp/']]],
  ['広島県', [['b0169', '広島銀行', 'https://www.hirogin.co.jp/'], ['b0569', 'もみじ銀行', 'https://www.momijibank.co.jp/']]],
  ['山口県', [['b0170', '山口銀行', 'https://www.yamaguchibank.co.jp/'], ['b0570', '西京銀行', 'https://www.saikyobank.co.jp/']]],
  ['徳島県', [['b0172', '阿波銀行', 'https://www.awabank.co.jp/'], ['b0572', '徳島大正銀行', 'https://www.tokugin.co.jp/']]],
  ['香川県', [['b0173', '百十四銀行', 'https://www.114bank.co.jp/'], ['b0573', '香川銀行', 'https://www.kagawabank.co.jp/']]],
  ['愛媛県', [['b0174', '伊予銀行', 'https://www.iyobank.co.jp/'], ['b0576', '愛媛銀行', 'https://www.himegin.co.jp/']]],
  ['高知県', [['b0175', '四国銀行', 'https://www.shikokubank.co.jp/'], ['b0578', '高知銀行', 'https://www.kochi-bank.co.jp/']]],
  ['福岡県', [['b0177', '福岡銀行', 'https://www.fukuokabank.co.jp/'], ['b0178', '筑邦銀行', 'https://www.chikugin.co.jp/'], ['b0190', '西日本シティ銀行', 'https://www.ncbank.co.jp/'], ['b0191', '北九州銀行', 'https://www.kitakyushubank.co.jp/'], ['b0582', '福岡中央銀行', 'https://www.fukuokachuo-bank.co.jp/']]],
  ['佐賀県', [['b0179', '佐賀銀行', 'https://www.sagabank.co.jp/'], ['b0583', '佐賀共栄銀行', 'https://www.kyogin.co.jp/']]],
  ['長崎県', [['b0181', '十八親和銀行', 'https://www.18shinwabank.co.jp/'], ['b0585', '長崎銀行', 'https://www.nagasakibank.co.jp/']]],
  ['熊本県', [['b0182', '肥後銀行', 'https://www.higobank.co.jp/'], ['b0587', '熊本銀行', 'https://www.kumamotobank.co.jp/']]],
  ['大分県', [['b0183', '大分銀行', 'https://www.oitabank.co.jp/'], ['b0590', '豊和銀行', 'https://www.howabank.co.jp/']]],
  ['宮崎県', [['b0184', '宮崎銀行', 'https://www.miyagin.co.jp/'], ['taiyo', '宮崎太陽銀行', 'https://www.taiyobank.co.jp/']]],
  ['鹿児島県', [['b0185', '鹿児島銀行', 'https://www.kagin.co.jp/'], ['b0594', '南日本銀行', 'https://nangin.jp/']]],
  ['沖縄県', [['b0187', '琉球銀行', 'https://www.ryugin.co.jp/'], ['b0188', '沖縄銀行', 'https://www.okinawa-bank.co.jp/'], ['b0596', '沖縄海邦銀行', 'https://www.kaiho-bank.co.jp/']]]
];
// 以前に選べた銀行(一覧には出さないが、選んであれば使える・その他の入力で候補に出る)
const BANKS_OLD = [['miyasin', '宮崎第一信用金庫(法人)', 'https://www.miyasin.co.jp/business/netbanking/'], ['miyasin_p', '宮崎第一信用金庫(個人)', 'https://www.miyasin.co.jp/netbanking/'], ['miyagin', '宮崎銀行(法人)', 'https://www.miyagin.co.jp/hojin/settlement/banking/']];
const bankAll = () => BANKS.flatMap(([, l]) => l).concat(BANKS_REG.flatMap(([, l]) => l), BANKS_OLD);
function payBank() {
  const si = D.shopInfo || {};
  if (si.payBank === 'other' && si.payBankUrl) return { id: 'other', name: si.payBankName || '登録した銀行', url: si.payBankUrl };
  for (const [id, name, url] of bankAll()) if (id === si.payBank) return { id, name, url };
  return null;
}
// LINEの中から、標準のブラウザで開く(LIFFを始めていなければ始めてから)
async function openOutside(url) {
  if (IN_LINE && window.liff) { try { if (!liff.id) await liff.init({ liffId: LIFF_ID }); if (liff.isInClient()) { liff.openWindow({ url, external: true }); return true; } } catch (e) {} }
  return false;
}
async function openBank(url) {
  if (await openOutside(url)) return;
  window.open(url, '_blank', 'noopener');
}
async function goPay(p) {
  const b = payBank();
  if (!b) { chat('先に「設定」の振込先一覧で銀行を選択してください', 'think'); show('set'); setTimeout(() => $('bank-box') && $('bank-box').scrollIntoView({ block: 'start', behavior: 'smooth' }), 120); return; }
  const txt = `${p.supplier} ${p.total}円`;
  let copied = false; try { await navigator.clipboard.writeText(txt); copied = true; } catch (e) {}
  chat(`${copied ? `「${p.supplier} ${p.total.toLocaleString('ja-JP')}円」をコピーしました。` : ''}${b.name}を開きます。振込が完了したら「支払済にする」を押してください。`, 'heart');
  openBank(b.url);
}
function renderBanks() {
  const box = $('bank-box'); if (!box) return;
  const cur = payBank(), si = D.shopInfo || {};
  const btn = ([id, name, url]) => `<div class="bank${cur && cur.id === id ? ' on' : ''}"><button type="button" data-bank="${id}" aria-pressed="${!!(cur && cur.id === id)}">${cur && cur.id === id ? '✓ ' : ''}${esc(name)}</button><a href="${esc(url)}" target="_blank" rel="noopener" data-open="${esc(url)}" aria-label="${esc(name)}を開く">↗</a></div>`;
  const prefOf = () => { const a = si.addr || ''; const hit = BANKS_REG.find(([pf]) => a.includes(pf) || a.includes(pf.replace(/[都府県]$/, ''))); return hit ? hit[0] : ''; };
  let pref = renderBanks.pref || (cur && (BANKS_REG.find(([, l]) => l.some(x => x[0] === cur.id)) || [])[0]) || prefOf();
  box.innerHTML = `<p class="k" style="margin:0 0 8px">帳簿の「振込へ」を押すと、ここで選んだ銀行の公式サイトが開きます(仕入先名と金額がコピーされます)。振込の操作は銀行のサイトで行います。銀行名を押すと選択でき、↗ で公式サイトを開きます。</p>
    ${cur ? `<p style="margin:0 0 4px"><b>選択中:</b> ${esc(cur.name)}</p>` : '<p class="k" style="margin:0 0 4px"><b>まだ選んでいません</b></p>'}` +
    BANKS.map(([g, list]) => `<p class="k" style="margin:12px 0 4px"><b>${g}</b></p><div class="banks">${list.map(btn).join('')}</div>`).join('') +
    `<p class="k" style="margin:12px 0 4px"><b>地方銀行</b></p><select id="bk-pref" aria-label="都道府県" style="font:inherit;font-size:15px;padding:8px 10px;border:1px solid var(--line);border-radius:6px;background:var(--bg);color:var(--ink)"><option value="">都道府県を選ぶ</option>${BANKS_REG.map(([pf]) => `<option${pf === pref ? ' selected' : ''}>${pf}</option>`).join('')}</select>
    <div class="banks" style="margin-top:8px">${pref ? (BANKS_REG.find(([pf]) => pf === pref) || [, []])[1].map(btn).join('') : ''}</div>
    <p class="k" style="margin:12px 0 4px"><b>その他(信用金庫・信用組合など)</b></p>
    <div class="fld"><span class="k">銀行名</span><input id="bk-name" list="bk-names" value="${esc(si.payBank === 'other' ? si.payBankName : '')}" placeholder="例: 〇〇信用金庫" autocomplete="off"><datalist id="bk-names">${bankAll().map(([, n]) => `<option value="${esc(n)}">`).join('')}</datalist></div>
    <div id="bk-hit"></div>
    <div id="bk-urlrow" class="fld" hidden><span class="k">公式サイトのURL</span><input id="bk-url" inputmode="url" value="${esc(si.payBank === 'other' ? si.payBankUrl : '')}" placeholder="https://"></div>
    <div class="ask"><button class="btn ghost" type="button" id="bk-save">この銀行にする</button></div>`;
  box.querySelectorAll('[data-bank]').forEach(b => b.onclick = () => setValueX({ field: 'paybank', value: { id: b.dataset.bank } }));
  box.querySelectorAll('[data-open]').forEach(a => a.onclick = e => { e.preventDefault(); openBank(a.dataset.open); });
  $('bk-pref').onchange = () => { renderBanks.pref = $('bk-pref').value; renderBanks(); };
  // その他: 一覧にある銀行名なら公式サイトを自動で出す。ない名前のときだけURLを入力する
  const hitOf = () => { const n = $('bk-name').value.trim(); return n ? bankAll().find(x => x[1] === n) : null; };
  const show2 = () => { const h = hitOf(), n = $('bk-name').value.trim(); $('bk-hit').innerHTML = h ? `<p class="k" style="margin:4px 0 0">公式サイト: <a href="${esc(h[2])}" target="_blank" rel="noopener">${esc(h[2])}</a></p>` : ''; $('bk-urlrow').hidden = !!h || !n; };
  $('bk-name').oninput = show2; show2();
  if (si.payBank === 'other' && si.payBankUrl) $('bk-urlrow').hidden = false;
  $('bk-save').onclick = () => {
    const h = hitOf(); if (h) { setValueX({ field: 'paybank', value: { id: h[0] } }); return; }
    const name = $('bk-name').value.trim(), url = $('bk-url').value.trim();
    if (!name) { $('bk-name').focus(); return; }
    if (!/^https:\/\//.test(url)) { $('bk-urlrow').hidden = false; chat('一覧にない銀行は、公式サイトのURL(https://〜)を入力してください'); $('bk-url').focus(); return; }
    setValueX({ field: 'paybank', value: { id: 'other', name, url } });
  };
}
function renderPays() {
  const box = $('pays');
  if ($('book-doc') && !$('book-doc').dataset.b) { $('book-doc').dataset.b = 1; $('book-doc').onchange = async () => {
    const files = [...$('book-doc').files].filter(isDocFile).slice(0, 20); $('book-doc').value = ''; if (!files.length) return;
    const out = $('book-doc-out'); out.hidden = false; out.innerHTML = `<div class="card"><p class="k" style="margin:0">読み取っています… ${files.length}件(1件あたり20〜60秒)</p></div>`;
    const logs = [];
    for (const f of files) {
      const r = await invoiceDoc(f);
      logs.push(`【${esc(f.name)}】 ${r.ok ? (r.msgs || []).map(esc).join('<br>') : '<mark>' + esc(r.error || '読めませんでした') + '</mark>'}`);
      out.innerHTML = `<div class="card"><div class="k" style="white-space:normal">${logs.join('<hr style="border:0;border-top:1px solid var(--line);margin:8px 0">')}</div><p class="k" style="margin:8px 0 0"><a href="#" id="book-doc-x">閉じる</a></p></div>`;
      $('book-doc-x').onclick = e => { e.preventDefault(); out.hidden = true; };
      if (r.ok && r.data) { D = r.data; renderAll(); }
    }
  }; }
  const up = unpaid();
  if (!(D.pays || []).length) { box.innerHTML = emptyBox('book', '請求書が登録されていません', '請求書を撮影すると仕入先別・月別に整理され、未払いの請求がここに表示されます。', ['請求書を撮影', 'cam']); return; }
  const sum = up.reduce((a, p) => a + p.total, 0);
  box.innerHTML = `<div class="card"><div class="row"><span>${up.length ? `未払い ${up.length}件` : '未払いはありません'}</span>${up.length ? `<span class="big" style="font-size:20px">${yen(sum)}</span>` : ''}</div>` +
    up.map(p => `<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line)"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span>${esc(p.supplier)} <span class="k">${+p.month.slice(5) || esc(p.month)}月分${p.due ? ' · 期限 ' + esc(p.due.slice(5).replace('-', '/')) : ''}</span></span>${callBtn(p.supplier)}</div>${bankOf(p.supplier) ? `<div class="bkline"><span class="k">振込先</span> <span class="bk">${esc(bankOf(p.supplier))}</span><button class="btn ghost sm" type="button" data-copy="${esc(bankOf(p.supplier))}">コピー</button></div>` : `<div class="bkline k">振込先: 未登録(次回の請求書を撮影すると自動で登録されます)</div>`}<div class="row" style="align-items:center;margin-top:8px"><b style="white-space:nowrap;font-size:16px">${yen(p.total)}</b><span style="display:flex;gap:8px;align-items:center;flex:0 0 auto"><button class="btn" style="white-space:nowrap" type="button" data-go="${p.row}">振込へ</button><button class="btn ghost" style="white-space:nowrap" type="button" data-paid="${p.row}">支払済にする</button></span></div>`).join('') +
    `<p class="k" style="margin:8px 0 0">${payBank() ? `振込は ${esc(payBank().name)} を開きます(<a href="#" id="bank-change" style="color:var(--accent)">変更</a>)。` : '「振込へ」を利用するには、<a href="#" id="bank-change" style="color:var(--accent)">設定で銀行を選択してください</a>。'}${VIA}「仕入先名 払った」と入力しても、支払済にできます</p></div>`;
  box.querySelectorAll('[data-paid]').forEach(b => b.onclick = () => setValue('', 'paid', +b.dataset.paid));
  box.querySelectorAll('[data-copy]').forEach(b => b.onclick = async () => { try { await navigator.clipboard.writeText(b.dataset.copy); toast('振込先をコピーしました', 'ok'); } catch (e) { chat(b.dataset.copy); } });
  box.querySelectorAll('[data-go]').forEach(b => b.onclick = () => goPay(up.find(p => p.row === +b.dataset.go)));
  if ($('bank-change')) $('bank-change').onclick = e => { e.preventDefault(); show('set'); setTimeout(() => $('bank-box').scrollIntoView({ block: 'start', behavior: 'smooth' }), 300); };
}

// 何もないときの箱(絵と一言と、次にすること)
const EMPTY_IC = { cam: IC.cam, book: IC.book, ws: IC.ws, sales: IC.sales, label: IC.label, ev: IC.ev };
function emptyBox(ic, title, text, btn) {
  return `<div class="card empty"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${EMPTY_IC[ic] || IC.cam}</svg></div><b>${title}</b><span class="k">${text}</span>${btn ? `<div><button class="btn" type="button" data-empty="${btn[1]}">${btn[0]}</button></div>` : ''}</div>`;
}
document.addEventListener('click', e => { const b = e.target.closest('[data-empty]'); if (!b) return; if (b.dataset.empty === 'cam') openCamera(); else if (b.dataset.empty === 'ws') $('ws-to').focus(); });
// ---------- 原価 ----------
// 原価率は税抜で見る(税の表があればその値、なければ税込の売価から)
function exRatio(p) { const t = p.tax && (p.serve === 'eatin' ? p.tax.eatin : p.tax.takeout); return t && t.ratio != null ? t.ratio : p.per_piece / p.price * 100; }
// 目標原価率から出した売値の目安
function guideHtml(p, i) {
  const g = p.guide; if (!g) return '';
  const head = `<div class="set"><span class="k">目標原価率</span><input id="sptg-${i}" inputmode="decimal" style="width:4.5em" value="${g.own ? g.target : ''}" placeholder="${g.target}"><span class="k">%</span><button class="btn ghost" type="button" data-ptg="${i}">決定</button></div>`;
  if (!g.inc) return head + `<p class="k" style="margin:0 0 8px">1${U}の原価を算出すると、売価の目安が表示されます。</p>`;
  const now = p.price ? (p.price >= g.inc ? `現在の売価${p.price}円は目安以上です。` : `現在の売価${p.price}円は目安より${g.inc - p.price}円低くなっています。`) : '';
  return head + `<p style="margin:0 0 8px"><b>売価の目安 税込${g.inc.toLocaleString('ja-JP')}円</b> <span class="k">(目標${g.target}%${g.own ? '・この商品だけ' : '・店舗の目標'}、税抜${g.ex.toLocaleString('ja-JP')}円、${g.rate}%込み、10円単位で切り上げ)</span><br><span class="k">${now}</span></p>`;
}
// 税込の売価から、出し方ごとの税抜と原価率(税抜)を出す
function taxHtml2(p) {
  const t = p.tax; if (!t) return p.price ? '' : '<p class="k" style="margin:4px 0 8px">売価を入力すると、税抜の売価と原価率が表示されます。</p>';
  const row = (l, o) => `<tr><td>${l} <span class="k">${o.rate}%</span></td><td class="n">税抜 ${o.ex.toLocaleString('ja-JP')}円</td><td class="n">${o.ratio != null ? '原価率 ' + o.ratio + '%' : '-'}</td></tr>`;
  let h = '<table style="margin:4px 0 8px">';
  if (t.takeout) h += row('持ち帰り', t.takeout);
  if (t.takeoutNext) h += row(`持ち帰り(${esc(t.takeoutNext.from.slice(0, 7).replace('-', '年'))}月〜)`, t.takeoutNext);
  if (t.eatin) h += row('店内', t.eatin);
  h += '</table>';
  if (t.takeout && t.eatin) h += `<p class="k" style="margin:0 0 8px">税込が同じ${p.price}円の場合、店内飲食は税抜で${(Math.round((t.takeout.ex - t.eatin.ex) * 10) / 10).toLocaleString('ja-JP')}円少なくなります。</p>`;
  if (t.takeoutNext) h += `<p class="k" style="margin:0 0 8px">税込${p.price}円のままの場合、${esc(t.takeoutNext.from.slice(5).replace('-', '/'))}から持ち帰りの税抜が${(Math.round((t.takeoutNext.ex - t.takeout.ex) * 10) / 10).toLocaleString('ja-JP')}円増えます。</p>`;
  return h;
}
const open = new Set();
// 商品の分類: 分類ごとの原価率(税抜の売上に対する材料費)と、今月の売上。押すとその分類だけ並ぶ
let catSel = '';
function renderCats(rate) {
  const box = $('cat-box'); if (!box) return;
  const ps = D.products.filter(p => p.kind !== 'part'), cats = [...new Set(ps.map(p => p.cat).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ja'));
  if (!cats.length) { box.innerHTML = `<datalist id="cat-list"></datalist>${ps.length >= 3 ? '<p class="k" style="margin:0 0 8px">商品を開いて「分類」(焼き菓子・ドリンク・弁当など)を決めると、分類ごとの原価率が見られます。</p>' : ''}`; catSel = ''; return; }
  if (catSel && catSel !== '(なし)' && !cats.includes(catSel)) catSel = '';
  const mo = Object.keys((D.menu || {})).sort().pop(), items = mo ? (D.menu[mo].items || []) : [], sold = {};
  items.forEach(it => { const p = ps.find(x => x.name === it.name); const c = (p && p.cat) || '(なし)'; sold[c] = (sold[c] || 0) + (it.salesEx || 0); });
  const row = c => { const list = ps.filter(p => c === '(なし)' ? !p.cat : p.cat === c), rs = list.map(rate).filter(r => r >= 0), avg = rs.length ? Math.round(rs.reduce((a, b) => a + b, 0) / rs.length * 100) : null;
    return `<button class="chip" type="button" data-cs="${esc(c)}" aria-pressed="${catSel === c}"><b>${esc(c)}</b> ${list.length}品${noCost() || avg == null ? '' : ` · 原価率 ${avg}%`}${!noMoney() && sold[c] ? ` · ${+mo.slice(5)}月 ${yen(sold[c])}(税抜)` : ''}</button>`; };
  const none = ps.some(p => !p.cat);
  box.innerHTML = `<datalist id="cat-list">${cats.map(c => `<option value="${esc(c)}">`).join('')}</datalist><div class="chips" style="margin:0 0 12px"><button class="chip" type="button" data-cs="" aria-pressed="${!catSel}">すべて</button>${cats.map(row).join('')}${none ? row('(なし)') : ''}</div>`;
  box.querySelectorAll('[data-cs]').forEach(b => b.onclick = () => { catSel = b.dataset.cs; renderCost(); });
}
// ---------- 原価: 表(表計算の密度) → 行を押すと下に商品(写真・材料と量・作り方) → レシピ票(製造モード) ----------
let prodSel = null, prodN = null, prodEditI = -1, prodEditS = -1, costQ = '', costFilt = 'all', pdetEdit = null;
const COST_COLS = [['name', '商品'], ['cat', '分類'], ['cost', `1${'個'}の原価`], ['diff', '先月比'], ['price', '売価(税込)'], ['rate', '原価率'], ['gp', '粗利/個'], ['sold', '今月の販売数'], ['sure', '確認済みの割合'], ['upd', '更新']];
function prodSold(p) { const mo = (D.status || {}).month || new Date().toISOString().slice(0, 7), m = (D.menu || {})[mo]; const it = m && (m.items || []).find(x => x.name === p.name); return it ? it.qty : null; }
function prodVals(p) {
  const r = p.price && p.per_piece != null ? exRatio(p) : null, ex = p.price ? p.price / (1 + ((p.tax && (p.serve === 'eatin' ? 10 : 8)) || 8) / 100) : null;
  return { cost: p.per_piece, diff: p.prevCost && p.per_piece != null ? Math.round((p.per_piece - p.prevCost) * 10) / 10 : null, price: p.price, rate: r != null ? Math.round(r) : null, gp: ex != null && p.per_piece != null ? Math.round(ex - p.per_piece) : null, sold: prodSold(p), sure: p.sure, upd: p.updated || 0 };
}
function renderCost() {
  const tw = $('cost-tw'), tb = $('cost-table'), chips = $('cost-chips'), foot = $('cost-foot');
  if (!D.products.length) { tw.hidden = true; chips.innerHTML = ''; foot.innerHTML = ''; $('pdet').hidden = true; costsEl().innerHTML = emptyBox('cam', 'レシピが登録されていません', '手書きのレシピを1枚撮影すると、1個あたりの原価がここに表示されます。', ['レシピを撮影', 'cam']); return; }
  tw.hidden = false; if (!prodSel) costsEl().innerHTML = '';
  const rate = p => p.price && p.per_piece != null ? exRatio(p) / 100 : -1;
  renderCats(rate);
  const cs = $('cost-sort'); if (cs && !cs.dataset.bound) { cs.dataset.bound = 1; cs.onchange = () => { store.set('costSort', cs.value); store.set('costDir', cs.value === 'name' ? 1 : -1); renderCost(); }; }
  const sortKey = store.get('costSort', 'rate'), dir = store.get('costDir', -1); if (cs) cs.value = ['rate', 'name', 'new', 'est'].includes(sortKey) ? sortKey : 'rate';
  const tg = p => (p.guide || {}).target || (D.shopInfo || {}).targetRate || 30;
  const list = D.products.filter(p => !catSel || (catSel === '(なし)' ? !p.cat : p.cat === catSel)).filter(p => !costQ || (p.name + (p.cat || '') + (p.part || '')).includes(costQ))
    .filter(p => { const v = prodVals(p); return costFilt === 'up' ? v.diff > 0 : costFilt === 'warn' ? (v.rate != null && v.rate > tg(p)) : costFilt === 'na' ? (p.unknown.length || (p.noWeight || []).length) : costFilt === 'part' ? p.kind === 'part' : true; });
  const key = sortKey === 'new' ? 'upd' : sortKey === 'est' ? 'sure' : sortKey;
  list.sort((a, b) => { if ((a.kind === 'part') !== (b.kind === 'part')) return (a.kind === 'part') - (b.kind === 'part'); const va = key === 'name' ? a.name : key === 'cat' ? (a.cat || '') : prodVals(a)[key], vb = key === 'name' ? b.name : key === 'cat' ? (b.cat || '') : prodVals(b)[key]; if (va == null && vb == null) return 0; if (va == null) return 1; if (vb == null) return -1; return (typeof va === 'string' ? va.localeCompare(vb, 'ja') : va - vb) * (sortKey === 'est' ? 1 : dir); });
  const goods = D.products.filter(p => p.kind !== 'part'), nUp = goods.filter(p => prodVals(p).diff > 0).length, nWarn = goods.filter(p => { const v = prodVals(p); return v.rate != null && v.rate > tg(p); }).length, nNa = goods.filter(p => p.unknown.length || (p.noWeight || []).length).length, nPart = D.products.length - goods.length;
  chips.innerHTML = [['all', 'すべて'], ['up', `値上がり ${nUp}`], ['warn', `目標より高い ${nWarn}`], ['na', `原価未設定の材料 ${nNa}`], ['part', `半製品 ${nPart}`]].map(([k, l]) => `<button class="chip" type="button" data-cf="${k}" aria-pressed="${costFilt === k}">${l}</button>`).join('');
  chips.querySelectorAll('[data-cf]').forEach(b => b.onclick = () => { costFilt = b.dataset.cf; renderCost(); });
  const money = !noMoney();
  const cols = COST_COLS.filter(([k]) => money || !['cost', 'diff', 'price', 'rate', 'gp'].includes(k)).map(([k, l]) => [k, k === 'cost' ? `1${U}の原価` : k === 'gp' ? `粗利/${U}` : l]);
  const fmtDiff = v => v == null ? '—' : (v > 0 ? '+' : '') + v.toFixed(1) + '円';
  tb.innerHTML = `<thead><tr>${cols.map(([k, l]) => `<th class="${['cost', 'diff', 'price', 'rate', 'gp', 'sold', 'sure'].includes(k) ? 'n' : ''} ${key === k ? (dir > 0 ? 'asc' : 'desc') : ''}" data-k="${k}">${l}<i class="s"></i></th>`).join('')}</tr></thead><tbody>${list.map(p => {
    const v = prodVals(p), img = (p.simgs || [])[0];
    return `<tr data-p="${esc(p.name)}" class="${p.name === prodSel ? 'sel' : ''} ${p.kind === 'part' ? 'part' : ''}">${cols.map(([k]) => {
      if (k === 'name') return `<td><span class="th"><i>${img ? `<img class="stimg" data-img="${esc(img)}" alt="">` : esc(p.name.slice(0, 1))}</i><b>${esc(p.name)}</b>${p.label && p.label.check.length ? ' <span class="k">※</span>' : ''}</span></td>`;
      if (k === 'cat') return `<td>${p.kind === 'part' ? '<span class="k">半製品</span>' : esc(p.cat || '—')}</td>`;
      if (k === 'cost') return `<td class="n">${v.cost != null ? `<b>${v.cost.toFixed(1)}</b><span class="k">円${PU(p) !== U ? '/' + esc(PU(p)) : ''}</span>` : `<span class="k">${p.kind === 'part' ? yen(p.batch_cost) + '/仕込み' : '1' + esc(PU(p)) + 'の重さ待ち'}</span>`}</td>`;
      if (k === 'diff') return `<td class="n ${v.diff > 0 ? 'up' : v.diff < 0 ? 'dn' : ''}">${fmtDiff(v.diff)}</td>`;
      if (k === 'price') return `<td class="n">${v.price ? yen(v.price) : '<span class="k">未設定</span>'}</td>`;
      if (k === 'rate') return `<td class="n ${v.rate != null && v.rate > tg(p) ? 'up' : ''}">${v.rate != null ? v.rate + '%' : '—'}</td>`;
      if (k === 'gp') return `<td class="n">${v.gp != null ? yen(v.gp) : '—'}</td>`;
      if (k === 'sold') return `<td class="n">${v.sold != null ? v.sold.toLocaleString() : '—'}</td>`;
      if (k === 'sure') return `<td class="n">${p.sure}%${p.unknown.length ? ' <span class="k">未設定' + p.unknown.length + '</span>' : ''}</td>`;
      return `<td><span class="k">${p.updated ? new Date(p.updated).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }) : '—'}</span></td>`;
    }).join('')}</tr>`; }).join('')}</tbody>`;
  tb.querySelectorAll('th[data-k]').forEach(th => th.onclick = () => { const k = th.dataset.k; if (key === k) store.set('costDir', -dir); else { store.set('costSort', k === 'upd' ? 'new' : k); store.set('costDir', ['name', 'cat'].includes(k) ? 1 : -1); } renderCost(); });
  tb.querySelectorAll('tbody tr').forEach(tr => tr.onclick = () => { prodSel = tr.dataset.p; prodN = null; pdetEdit = null; renderCost(); });
  bindStepImgs(tb);
  const gl = list.filter(p => p.kind !== 'part' && prodVals(p).rate != null), avg = gl.length ? Math.round(gl.reduce((a, p) => a + prodVals(p).rate, 0) / gl.length) : null;
  foot.innerHTML = `<span>${list.length} / ${D.products.length} 品${avg != null && money ? ` ・ 原価率の平均 ${avg}%` : ''}</span><span>行を押すと、商品の詳細(写真・材料と分量・作り方)が開きます</span>`;
  if (prodSel && !D.products.find(p => p.name === prodSel)) prodSel = null;
  if (prodSel) renderPdet(); else { $('pdet').hidden = true; $('pdet').classList.remove('modal'); const ov = $('pdet-ov'); if (ov) ov.hidden = true; document.body.classList.remove('pdet-on'); costsEl().innerHTML = ''; }
  renderCostBack();
}
// 戻す: 消したレシピ(戻す・完全に消す)と、材料・作り方を直す前の控え
function renderCostBack() {
  const old = $('cost-back'); if (old) old.remove();
  const acts = document.querySelector('#t-cost .ph .acts'); if (!acts) return;
  let bt = $('cost-undo');
  if (!bt) { bt = document.createElement('button'); bt.id = 'cost-undo'; bt.type = 'button'; bt.className = 'undo-btn'; acts.prepend(bt); bt.onclick = () => costUndo(); }
  const u = lastUndo(), ic = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>';
  bt.innerHTML = ic + '<span>元に戻す</span>';
  bt.disabled = !u; bt.title = u ? '元に戻す: ' + u.label + (/Mac/.test(navigator.platform) ? '(⌘Z)' : '(Ctrl+Z)') : '元に戻せる操作はありません';
  bt.setAttribute('aria-label', bt.title);
  if (!renderCostBack.key) { renderCostBack.key = 1; document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z') && cur === 'cost' && !/^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || '') && !(pdetEdit)) { e.preventDefault(); costUndo(); } }); }
}
// 最後の操作(編集の窓でまとめて保存した変更・材料や作り方の変更・商品の削除)を1つ取り出す
const UNDO_NAME = { ing: '材料', steps: '作り方', pw: '重さ', pieces: '取れる数', baked: '焼き上がりの重さ', price: '売価', pcat: '分類', punit: '数え方' };
function lastUndo() {
  const tr = noMoney() ? [] : (D.trash || []), un = perm('recipe') ? (D.undo || []) : [];
  const when = t => t ? new Date(t).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
  let a = null;
  if (un[0]) {
    const g = un[0].grp, rows = g ? un.filter(u => u.grp === g && u.product === un[0].product) : [un[0]];
    const ord = Object.keys(UNDO_NAME), names = [...new Set(rows.slice().sort((x, y) => ord.indexOf(x.field) - ord.indexOf(y.field)).map(u => UNDO_NAME[u.field] || '変更'))];
    a = { kind: 'undo', rows: rows.map(u => u.row).sort((x, y) => y - x), at: un[0].at || 0, product: un[0].product, label: `「${un[0].product}」の${rows.length > 1 ? '編集(' + names.join('・') + ')' : names[0] + 'の変更'} ${when(un[0].at)}` };
  }
  const b = tr[0] ? { kind: 'restore', row: tr[0].row, at: tr[0].at || 0, product: tr[0].name, label: `「${tr[0].name}」の削除 ${when(tr[0].at)}` } : null;
  return a && b ? (b.at > a.at ? b : a) : (a || b);
}
async function costUndo() {
  const u = lastUndo(); if (!u) { toast('元に戻せる操作はありません'); return; }
  if (u.kind === 'restore') { prodSel = null; setValueX({ field: 'restoreprod', value: u.row }); return; }
  if (u.rows.length === 1) { setValueX({ field: 'undo', value: u.rows[0] }); return; }
  // まとめて保存した変更は、行の大きい(新しい)順に戻す。戻すと行が消えるので、大きい順なら番号はずれない
  for (const row of u.rows) { const out = await api({ kind: 'app_set', field: 'undo', value: row }); if (!out.ok) { toast(out.error || '元に戻せませんでした', 'ng'); if (out.data) { D = out.data; renderAll(); } return; } D = out.data; }
  renderAll(); toast(`「${u.product}」の編集を元に戻しました。`, 'ok');
}
// 商品: 左に写真、右に材料と量(個数を変えられる・1つずつ直せる)、下に作り方(1つずつ直せる)。設定はたたんで下に
function costsEl() { let c = $('costs'); if (!c) { c = document.createElement('div'); c.id = 'costs'; c.className = 'stack'; $('pdet').after(c); } return c; }
// 商品の詳細は、画面の手前に開く窓。閉じると原価の表に戻る
function pdetOpen(box) {
  box.hidden = false; box.classList.add('modal'); box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
  let ov = $('pdet-ov'); if (!ov) { ov = document.createElement('div'); ov.id = 'pdet-ov'; ov.className = 'pdet-ov'; document.body.appendChild(ov); ov.onclick = () => pdetClose(); }
  ov.hidden = false; document.body.classList.add('pdet-on');
  if (!pdetOpen.key) { pdetOpen.key = 1; document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('pdet').hidden) pdetClose(); }); }
}
function pdetClose() {
  if (pdetEdit && pdetEdit.dirty && !pdetClose.ok) { pdetClose.ok = 1; toast('保存されていない変更があります。もう一度閉じると、変更は破棄されます。'); setTimeout(() => { pdetClose.ok = 0; }, 4000); return; }
  pdetClose.ok = 0; pdetEdit = null; prodSel = null;
  const box = $('pdet'); box.hidden = true; box.innerHTML = ''; box.classList.remove('modal'); const ov = $('pdet-ov'); if (ov) ov.hidden = true; document.body.classList.remove('pdet-on');
  renderCost();
}
// まとめて編集: 材料と分量・作り方・1個の重さ・取れる数・売価・分類を1つの画面で直し、「保存する」で一度に反映する
function renderPdetEdit(p, box) {
  const U = PU(p), E = pdetEdit, UNITS = ['g', '個', 'kg', 'cc', 'ml', '枚', '本', '袋'];
  const grab = () => {
    E.rows = [...box.querySelectorAll('[data-er]')].map(tr => ({ name: tr.querySelector('.er-n').value.trim(), q: parseFloat(tr.querySelector('.er-q').value) || 0, u: tr.querySelector('.er-u').value }));
    E.steps = [...box.querySelectorAll('[data-es2]')].map(x => x.value.trim());
    ['pw', 'pieces', 'price', 'cat', 'unit', 'name'].forEach(k => { const e = $('rx-' + k); if (e) E[k === 'name' ? 'name2' : k] = e.value.trim(); });
  };
  box.innerHTML = `<div class="hd2"><h2>${esc(p.name)} を編集</h2><button class="pdx" type="button" id="rx-x" aria-label="閉じる">×</button></div>
    <div class="pe">
      <section><h3>材料と分量 <span class="k">1回の仕込み(${p.pieces ? p.pieces + U : '1仕込み'})の量で入力します</span></h3>
        <table class="pe-t"><thead><tr><th>材料名</th><th class="n">分量</th><th>単位</th><th></th></tr></thead><tbody>
        ${E.rows.map((r, i) => `<tr data-er="${i}"><td><input class="er-n" value="${esc(r.name)}" list="mat-names2" aria-label="材料名" placeholder="名前の一部を入力(例 チーズ)"><small class="er-h"${matKnown(r.name) ? ' hidden' : ''}>材料一覧にない名前です。保存すると「単価が未登録の材料」として確認の一覧に表示されます</small></td><td class="n"><input class="er-q" type="number" step="0.1" min="0" inputmode="decimal" value="${r.q || ''}" aria-label="分量"></td><td><select class="er-u" aria-label="単位">${UNITS.concat(UNITS.includes(r.u) ? [] : [r.u]).map(u => `<option${r.u === u ? ' selected' : ''}>${esc(u)}</option>`).join('')}</select></td><td><button class="pe-del" type="button" data-erd="${i}" aria-label="${esc(r.name || '材料')}を削除">削除</button></td></tr>`).join('')}
        </tbody></table><button class="btn ghost sm" type="button" id="rx-addr">＋ 材料を追加</button>
        <datalist id="mat-names2">${matOpts()}</datalist></section>
      <section><h3>作り方</h3><ol class="pe-s">${E.steps.map((t, i) => `<li><input data-es2="${i}" value="${esc(t)}" maxlength="300" aria-label="手順${i + 1}"><button class="pe-mv" type="button" data-esu="${i}" aria-label="上へ"${i ? '' : ' disabled'}>↑</button><button class="pe-mv" type="button" data-esd="${i}" aria-label="下へ"${i < E.steps.length - 1 ? '' : ' disabled'}>↓</button><button class="pe-del" type="button" data-esx="${i}">削除</button></li>`).join('')}</ol><button class="btn ghost sm" type="button" id="rx-adds">＋ 手順を追加</button></section>
      <section><h3>商品の情報</h3><div class="pe-g">
        <label style="grid-column:1/-1">商品名<span><input id="rx-name" value="${esc(E.name2)}" maxlength="30" placeholder="例 どら焼き"></span><small>変更すると、卸値・納品・コース・レジの呼び方など、この名前でつながる記録もまとめて新しい名前に付け替えます</small></label>
        <label>数え方<span><input id="rx-unit" list="unit-list" value="${esc(E.unit)}" maxlength="4" placeholder="例 個" style="width:6em"></span><small>原価や分量の「1${esc(U)}あたり」に使います(例: 個・人前・杯・皿)</small><datalist id="unit-list">${['個', '人前', '杯', '皿', '本', '枚', '切れ', '台', '袋', '箱', 'g'].map(u => `<option value="${u}">`).join('')}</datalist></label>
        <label>1${U}の重さ<span><input id="rx-pw" type="number" step="0.1" min="0" inputmode="decimal" value="${esc(E.pw)}" placeholder="例 40"> g</span></label>
        ${p.composed ? '' : `<label>1仕込みで取れる数<span><input id="rx-pieces" type="number" min="0" inputmode="numeric" value="${esc(E.pieces)}" placeholder="例 8"> ${U}</span><small>入力すると、重さより数を優先します。空にすると重さに戻ります</small></label>`}
        ${noMoney() ? '' : `<label>売価(税込)<span><input id="rx-price" type="number" min="0" inputmode="decimal" value="${esc(E.price)}" placeholder="例 250"> 円</span></label>`}
        ${p.kind === 'part' ? '' : `<label>分類<span><input id="rx-cat" list="cat-list" value="${esc(E.cat)}" placeholder="例 焼き菓子" maxlength="16"></span></label>`}
      </div></section>
    </div>
    <div class="pe-foot"><span class="k" id="rx-msg">保存すると、原価と食品表示を計算し直します。保存後に「↶ 元に戻す」を押すと、この保存の前に戻せます。</span><button class="btn ghost" type="button" id="rx-cancel">キャンセル</button><button class="btn" type="button" id="rx-save">保存する</button></div>`;
  box.oninput = () => { E.dirty = true; };
  const re = () => { grab(); E.dirty = true; renderPdetEdit(p, box); };
  box.querySelectorAll('.er-n').forEach(inp => inp.addEventListener('input', () => { const h = inp.parentNode.querySelector('.er-h'); if (h) h.hidden = matKnown(inp.value.trim()); }));
  $('rx-addr').onclick = () => { grab(); E.rows.push({ name: '', q: 0, u: 'g' }); E.dirty = true; renderPdetEdit(p, box); const n = box.querySelectorAll('.er-n'); n[n.length - 1].focus(); };
  $('rx-adds').onclick = () => { grab(); E.steps.push(''); E.dirty = true; renderPdetEdit(p, box); const n = box.querySelectorAll('[data-es2]'); n[n.length - 1].focus(); };
  box.querySelectorAll('[data-erd]').forEach(b => b.onclick = () => { grab(); E.rows.splice(+b.dataset.erd, 1); re(); });
  box.querySelectorAll('[data-esx]').forEach(b => b.onclick = () => { grab(); E.steps.splice(+b.dataset.esx, 1); re(); });
  box.querySelectorAll('[data-esu]').forEach(b => b.onclick = () => { grab(); const i = +b.dataset.esu; if (i > 0) [E.steps[i - 1], E.steps[i]] = [E.steps[i], E.steps[i - 1]]; re(); });
  box.querySelectorAll('[data-esd]').forEach(b => b.onclick = () => { grab(); const i = +b.dataset.esd; if (i < E.steps.length - 1) [E.steps[i + 1], E.steps[i]] = [E.steps[i], E.steps[i + 1]]; re(); });
  const back = () => { pdetEdit = null; renderPdet(); };
  $('rx-cancel').onclick = back;
  $('rx-x').onclick = pdetClose;
  $('rx-save').onclick = async () => {
    grab();
    const rows = E.rows.filter(r => r.name), steps = E.steps.filter(Boolean), msg = $('rx-msg');
    if (!rows.length) { msg.innerHTML = '<mark>材料を1つ以上入力してください。</mark>'; return; }
    if (rows.some(r => !(r.q > 0))) { msg.innerHTML = '<mark>分量が空欄か0の材料があります。分量を入力するか、その行を削除してください。</mark>'; return; }
    const sameRows = JSON.stringify(rows.map(r => [r.name, +r.q, r.u])) === JSON.stringify(p.rows.map(r => [r.name, +(r.q != null ? r.q : r.qty), r.u || r.unit || 'g']));
    const calls = [];
    if (!sameRows) calls.push({ field: 'ing', value: rows.map(r => [r.name, r.q, r.u]) });
    if (JSON.stringify(steps) !== JSON.stringify(p.steps || [])) calls.push({ field: 'steps', value: steps });
    const num = v => v === '' ? null : parseFloat(v);
    if (num(E.pw) != null && num(E.pw) > 0 && num(E.pw) !== (p.pw || null)) calls.push({ field: 'pw', value: num(E.pw) });
    if (!p.composed && (num(E.pieces) || 0) !== (p.piecesN || 0)) calls.push({ field: 'pieces', value: num(E.pieces) || 0 });
    if (!noMoney() && num(E.price) != null && num(E.price) > 0 && num(E.price) !== (p.price || null)) calls.push({ field: 'price', value: num(E.price) });
    if (p.kind !== 'part' && (E.cat || '') !== (p.cat || '')) calls.push({ field: 'pcat', value: E.cat });
    if ((E.unit || '') !== PU(p)) calls.push({ field: 'punit', value: E.unit === U && !p.unitw ? '' : E.unit });
    if (!E.name2) { msg.innerHTML = '<mark>商品名を入力してください。</mark>'; return; }
    if (E.name2 !== p.name) { if (D.products.some(x => x.name === E.name2)) { msg.innerHTML = `<mark>「${esc(E.name2)}」という商品はすでに登録されています。別の商品名を入力してください。</mark>`; return; } calls.push({ field: 'pname', value: E.name2 }); }
    if (!calls.length) { back(); return; }
    const sv = $('rx-save'), grp = 'g' + Date.now().toString(36); sv.disabled = true; sv.textContent = '保存しています…';
    for (const c of calls) {
      const out = await api(Object.assign({ kind: 'app_set', product: p.name, grp }, c));
      if (!out.ok) { sv.disabled = false; sv.textContent = '保存する'; msg.innerHTML = `<mark>${esc(out.error || '保存できませんでした')}</mark>`; if (out.data) D = out.data; return; }
      D = out.data;
    }
    if (E.name2 && E.name2 !== p.name) prodSel = E.name2;
    pdetEdit = null; renderAll(); toast(`「${prodSel || p.name}」を保存しました。`, 'ok');
  };
}
function renderPdet() {
  const p = D.products.find(x => x.name === prodSel), box = $('pdet'); if (!p) return;
  const U = PU(p);
  const costs0 = costsEl(); box.after(costs0);
  pdetOpen(box);
  if (pdetEdit && pdetEdit.name === p.name) { costs0.innerHTML = ''; renderPdetEdit(p, box); return; }
  pdetEdit = null;
  const per = p.pieces || null, base = per || 1, n = prodN == null ? (per || 1) : prodN, f = per ? n / per : 1;
  const fq = v => (v >= 20 ? Math.round(v).toLocaleString() : Math.round(v * 10) / 10) + 'g';
  const canEdit = perm('recipe'), img = (p.simgs || [])[0];
  const algs = p.label ? p.label.allergens : [];
  const matOf = r => D.materials.find(m => m.name === (r.which || r.name) || m.name === r.name || (m.aliases || []).includes(r.name));
  const qn = per ? `<span class="qn">${[1, per, 50, 100, 200].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b).map(v => `<button type="button" data-qn="${v}" class="${v === n ? 'on' : ''}">${v}${U}</button>`).join('')}<label><input type="number" id="qn-in" min="1" max="9999" inputmode="numeric" value="${n}" aria-label="個数">${U}分</label></span>` : `<span class="k">1仕込み分 ${p.batch_grams ? fq(p.batch_grams) : ''}<br>(「1${U}の重さ」を入力すると、個数で表示できます)</span>`;
  const rows = p.rows.map((r, i) => {
    const m = matOf(r), al = m ? (m.allergens || []) : [];
    const amt = r.grams == null ? `<b>${(Math.round(r.qty * f * 10) / 10)}<small>${esc(r.unit)}</small></b>` : `<b>${fq(r.grams * f).replace(/(kg|g)$/, '<small>$1</small>')}</b>`;
    return `<div class="row"><span>${esc(r.name)}${r.src === 'part' ? ' <span class="k">半製品</span>' : ''}${al.length ? `<span class="alg">${al.map(esc).join('・')}</span>` : ''}${r.src === 'est' ? '<span class="est">仮</span>' : r.src === 'unknown' ? '<span class="est" style="color:var(--warn)">材料未登録</span>' : ''}</span>${amt}<span></span></div>`;
  }).join('');
  const total = p.batch_grams ? fq(p.batch_grams * f) : '';
  const steps = (p.steps || []).map((t, i) => `<li><span>${esc(t)}${(p.simgs || [])[i] ? `<div><img class="stimg" data-img="${esc(p.simgs[i])}" alt="手順${i + 1}の写真" style="max-width:220px;border-radius:8px;margin-top:6px"></div>` : ''}</span><span></span></li>`).join('');
  box.innerHTML = `<div class="hd2"><h2>${esc(p.name)} <span class="k">${esc(p.part || p.cat || '')}</span></h2><div class="row" style="gap:8px;flex-wrap:wrap">${(() => { const u = lastUndo(); return u && u.kind === 'undo' && u.product === p.name ? `<button class="undo-btn" type="button" id="pdet-undo" title="元に戻す: ${esc(u.label)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg><span>元に戻す</span></button>` : ''; })()}${canEdit ? '<button class="btn" type="button" id="pdet-edit">編集する</button>' : ''}<button class="btn ghost" type="button" id="mk-open">レシピ票<span class="mkx">(製造モード)</span></button><button class="pdx" type="button" id="pdet-x" aria-label="閉じる">×</button></div></div>
    <div class="rv"><div class="pic"><div class="img">${img ? `<img class="stimg" data-img="${esc(img)}" alt="${esc(p.name)}">` : esc(p.name)}</div><div class="cap">${p.kind === 'part' ? '半製品' : esc(p.cat || '分類なし')} ・ 1回の仕込み ${per ? per + U : (p.batch_grams ? fq(p.batch_grams) : '—')}${p.pw ? ` ・ 1${U} ${p.pw}g` : ''}</div><div class="btns"><button class="btn ghost sm" type="button" id="pdet-photo">写真を撮影・追加</button>${p.kind !== 'part' ? `<button class="btn ghost sm" type="button" id="pdet-label">食品表示</button>` : ''}</div></div>
    <div class="ml"><div class="mh"><span>材料</span>${qn}</div>${rows}${total ? `<div class="row sub"><span>合計(${per ? n + U : '1仕込み'}分)</span><b style="font-size:16px">${total}</b><span></span></div>` : ''}<div class="row sub"><span>アレルゲン</span><span style="font-weight:500;font-size:13px">${algs.length ? algs.map(esc).join('・') : 'なし'}</span><span></span></div></div></div>
    <datalist id="mat-names">${matOpts()}</datalist>
    <div class="steps2"><h3>作り方</h3>${(p.steps || []).length ? `<ol>${steps}</ol>` : '<p class="k" style="margin:0">まだ手順がありません。</p>'}</div>
    <details class="setd"><summary>その他の設定(提供方法・税率・単価が未登録の材料・組み合わせ・削除)</summary><div id="pdet-set"></div></details>`;
  bindStepImgs(box);
  $('pdet-x').onclick = pdetClose;
  if ($('pdet-undo')) $('pdet-undo').onclick = () => costUndo();
  if ($('pdet-bk')) $('pdet-bk').onclick = async () => {
    const out = $('pdet-bkout'); out.innerHTML = '<p class="k">控えを読み込んでいます…</p>';
    const r = await api({ kind: 'app_backup_recipe', product: p.name });
    if (!r.ok) { out.innerHTML = `<p class="k">${esc(r.error)}</p>`; return; }
    if (!r.found) { out.innerHTML = `<p class="k">${esc(r.day)}の控えに「${esc(p.name)}」はありません。</p>`; return; }
    const cur = p.rows.map(x => [x.name, x.q, x.u]), key = x => x[0] + '|' + x[1] + x[2];
    const curK = new Set(cur.map(key)), bkK = new Set(r.ingredients.map(key));
    const gone = r.ingredients.filter(x => !curK.has(key(x))), added = cur.filter(x => !bkK.has(key(x)));
    const sgone = (r.steps || []).filter(t => !(p.steps || []).includes(t));
    out.innerHTML = `<div class="card" style="margin:8px 0"><p style="margin:0 0 6px"><b>${esc(r.day)} 4時の控え</b></p>
      <p style="margin:0">材料: ${gone.length ? `控えにあって今ない: ${gone.map(x => `<b>${esc(x[0])} ${x[1]}${esc(x[2])}</b>`).join('、')}` : '控えと同じ'}${added.length ? `<br><span class="k">今だけにある: ${added.map(x => esc(x[0]) + ' ' + x[1] + esc(x[2])).join('、')}</span>` : ''}</p>
      ${sgone.length ? `<p style="margin:6px 0 0">作り方: 控えにあって今ない <b>${sgone.map(esc).join(' / ')}</b></p>` : ''}
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">${gone.length ? `<button class="btn sm" type="button" id="bk-ing">削除された材料のみ追加</button><button class="btn ghost sm" type="button" id="bk-ing-all">材料を控えの内容にすべて戻す</button>` : ''}${sgone.length ? `<button class="btn ghost sm" type="button" id="bk-steps">作り方を控えの内容に戻す</button>` : ''}</div>
      <p class="k" style="margin:8px 0 0">戻した後も、最下部の「戻す」から修正前の状態に戻せます。</p></div>`;
    if ($('bk-ing')) $('bk-ing').onclick = () => setValueX({ field: 'ing', product: p.name, value: cur.concat(gone) });
    if ($('bk-ing-all')) $('bk-ing-all').onclick = () => setValueX({ field: 'ing', product: p.name, value: r.ingredients });
    if ($('bk-steps')) $('bk-steps').onclick = () => setValueX({ field: 'steps', product: p.name, value: r.steps });
  };
  $('mk-open').onclick = () => openMk(p);
  if ($('pdet-label')) $('pdet-label').onclick = () => { labelName = p.name; show('label'); };
  $('pdet-photo').onclick = () => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.onchange = async () => { const fl = inp.files[0]; if (!fl) return; try { const img64 = await shrinkStep(fl); const r = await api({ kind: 'app_img', product: p.name, idx: 0, image: img64, type: 'image/jpeg' }); if (!r.ok) throw new Error(r.error); D = r.data; renderAll(); toast('写真を追加しました', 'ok'); } catch (e) { toast(e.message || '写真を送信できませんでした'); } }; inp.click(); };
  box.querySelectorAll('[data-qn]').forEach(b => b.onclick = () => { prodN = +b.dataset.qn; renderPdet(); });
  if ($('qn-in')) $('qn-in').onchange = () => { prodN = Math.max(1, Math.min(9999, parseInt($('qn-in').value) || 1)); renderPdet(); };
  if ($('pdet-edit')) $('pdet-edit').onclick = () => { pdetEdit = { name: p.name, rows: p.rows.map(r => ({ name: r.name, q: r.q != null ? r.q : r.qty, u: r.u || r.unit || 'g' })), steps: (p.steps || []).slice(), pw: p.pw || '', pieces: p.piecesN || '', price: p.price || '', cat: p.cat || '', unit: PU(p), name2: p.name }; renderPdet(); };
  // 設定は今までのカードをそのまま、たたんで下に
  renderCostCards(p.name); const set = $('pdet-set'), costs = costs0; set.appendChild(costs);
  costs.querySelectorAll('.prod > .hd, .prod > .big, .prod > .bar').forEach(h => { h.hidden = true; });
  costs.querySelectorAll('.prod .detail').forEach(d => { d.hidden = false; d.querySelectorAll(':scope > table, :scope > details').forEach(x => { x.hidden = true; }); d.querySelectorAll(':scope > div').forEach(x => { if (/^<b>作り方<\/b>/.test(x.innerHTML)) x.hidden = true; }); d.querySelectorAll(':scope > .set').forEach(x => { if (x.querySelector('[data-set],[data-cat],[data-scale]')) x.hidden = true; }); d.querySelectorAll(':scope > p.k').forEach(x => { if (/ホールケーキ/.test(x.textContent)) x.hidden = true; }); d.querySelectorAll('[id^=sqout-]').forEach(x => { x.hidden = true; }); });
}
// レシピ票(製造モード): 紙と同じ並び。材料名と分量だけ大きく。店主は「金額も見る」で原体価格・価格・原価率
function openMk(p) {
  const U = PU(p), mk = $('mk'); let mul = 1, money = false;
  const per = p.pieces || null, fq = v => (v >= 20 ? Math.round(v).toLocaleString() : Math.round(v * 10) / 10) + 'g';
  const draw = () => {
    const rows = p.rows, tot = (p.batch_cost || 0) * mul, pp = p.per_piece, price = p.price, ex = price ? price / (1 + (p.serve === 'eatin' ? 10 : 8) / 100) : null;
    const sheet = `<div class="rsheet${money ? '' : ' nomoney'}"><div class="head"><div>料理名</div><div><b>${esc(p.name)}</b></div><div>取り数</div><div>${per ? per * mul + U + '(1仕込み×' + mul + ')' : '1仕込み×' + mul}${p.pw ? ' ・ 1' + U + ' ' + p.pw + 'g' : ''}</div><div class="m">売価</div><div class="m">${price ? yen(price) + '(税込)' : '未設定'}</div><div class="m">原価</div><div class="m">${pp != null ? pp.toFixed(1) + '円 /' + U + '(1仕込み ' + yen(p.batch_cost) + ')' : yen(p.batch_cost) + '/仕込み'}</div><div class="m">原価率</div><div class="m">${pp != null && ex ? Math.round(pp / ex * 1000) / 10 + '%(税抜)' : '—'}</div></div>
      <table><thead><tr><th style="width:38%">材料名</th><th style="width:18%">分量</th><th class="money" style="width:16%">原体価格</th><th class="money" style="width:14%">価格</th><th>備考</th></tr></thead><tbody>
      ${rows.map(r => { const m = D.materials.find(x => x.name === (r.which || r.name) || x.name === r.name); const amt = r.grams == null ? (Math.round(r.qty * mul * 10) / 10) + esc(r.unit) : fq(r.grams * mul); const ppg = m && m.ppg ? Math.round(m.ppg * 10000) / 10 + '円/kg' : m && m.ppu ? m.ppu + '円/枚' : '—'; return `<tr><td>${esc(r.name)}${r.src === 'part' ? ' <span class="rem">(半製品)</span>' : ''}</td><td class="n">${amt}</td><td class="money" style="font-size:15px">${ppg}</td><td class="money n" style="font-size:18px">${r.cost != null ? Math.round(r.cost * mul) + '円' : '—'}</td><td class="rem">${r.src === 'est' ? '仮の単価' : r.src === 'unknown' ? '材料が未登録' : ''}</td></tr>`; }).join('')}
      <tr class="gap"><td colspan="5"></td></tr>${(p.steps || []).length ? `<tr class="grp"><td>作り方</td><td></td><td class="money"></td><td class="money"></td><td class="rem"></td></tr>${p.steps.map((t, i) => `<tr><td colspan="5">${i + 1}. ${esc(t)}</td></tr>`).join('')}` : ''}
      <tr class="gap"><td colspan="5"></td></tr><tr class="gap"><td colspan="5"></td></tr></tbody></table></div>`;
    mk.innerHTML = `<div class="mkt"><h2>${esc(p.name)}</h2><div class="ctl"><span class="qty">${[1, 2, 3].map(q => `<button type="button" data-q="${q}" class="${q === mul ? 'on' : ''}">${q}仕込み</button>`).join('')}</span>${noMoney() ? '' : `<label class="tg"><input type="checkbox" id="mk-money"${money ? ' checked' : ''}>金額も見る</label>`}<button class="x" type="button" id="mk-print">印刷する</button><button class="x" type="button" id="mk-x">閉じる</button></div></div>${sheet}<p class="tip">紙のレシピ票と同じ並びです。通常は材料名と分量のみを表示します。「仕込み」の数に応じて分量が変わります。</p>`;
    mk.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { mul = +b.dataset.q; draw(); });
    if ($('mk-money')) $('mk-money').onchange = e => { money = e.target.checked; draw(); };
    $('mk-x').onclick = () => { mk.hidden = true; };
    $('mk-print').onclick = () => { mk.hidden = true; openPrint(`<style>.rsheet{font-size:14pt}.rsheet .head{display:grid;grid-template-columns:30mm 1fr;border:1.5pt solid #000;width:120mm;margin-bottom:6mm}.rsheet .head div{padding:2mm 3mm;border-bottom:.5pt dotted #333}.rsheet .head div:nth-child(odd){border-right:.5pt dotted #333}.rsheet table{width:100%;border:1.5pt solid #000;border-collapse:collapse}.rsheet th,.rsheet td{padding:2mm 3mm;border-bottom:.5pt dotted #333;border-right:.5pt dotted #333;text-align:left}.rsheet th{border-bottom:1.5pt solid #000;font-size:11pt}.rsheet td.n{text-align:right;font-size:16pt;font-weight:700}.rsheet tr.grp td{font-weight:700}.rsheet tr.gap td{height:6mm}.rsheet .rem{color:#555;font-size:10pt}.rsheet.nomoney .money{display:none}.rsheet.nomoney .head .m{display:none}</style>` + sheet, { bare: true }); };
  };
  mk.hidden = false; draw(); mk.scrollTop = 0;
}
// 商品の設定(1個の重さ・売価・分類・出し方・値段のない材料・手順の写真・消す)。表で選んだ商品だけを出す
function renderCostCards(only) {
  const box = costsEl();
  if (!D.products.length) { box.innerHTML = ''; return; }
  const rate = p => p.price && p.per_piece != null ? exRatio(p) / 100 : -1;
  const ordered = D.products.map((p, i) => [p, i]).filter(([p]) => p.name === only);
  if (only) open.add(only);
  let partHead = false;
  box.innerHTML = ordered.map(([p, i]) => {
    const U = PU(p);
    const head = p.per_piece != null ? `<div class="big">${yen1(p.per_piece)}<span class="k" style="font-weight:400"> / 1${U}</span></div>` : '<div class="big" style="font-size:18px;color:var(--ink-2)">1個の重さが未入力</div>';
    const meta = [p.composed ? `<span class="pill gray">組み合わせ ${p.rows.length}つ</span>` : `<span class="pill gray">1仕込み ${yen(p.batch_cost)}</span>`];
    if (p.pieces && !p.composed) meta.push(`<span class="pill gray">約${p.pieces}個</span>`);
    if (p.price && p.per_piece != null) { const r = exRatio(p), tg = (p.guide || {}).target || 30; meta.push(`<span class="pill ${r > tg ? 'warn' : ''}">原価率(税抜) ${Math.round(r)}%${r > tg ? ' · 目標' + tg + '%超え' : ''}</span>`); }
    if (p.unknown.length) meta.push(`<span class="pill warn">単価が未登録の材料 ${p.unknown.length}(原価に含まれていません)</span>`);
    if ((p.noWeight || []).length) meta.push(`<span class="pill warn">1個の重さが未入力の材料 ${p.noWeight.length}(原価に含まれていません)</span>`);
    const det = `<table>${p.rows.map(r => `<tr><td>${esc(r.name)} <span class="k">${r.grams == null ? (r.qty + esc(r.unit)) : r.grams.toLocaleString() + 'g'}</span>${r.src === 'est' ? ' <span class="pill warn">仮</span>' : r.src === 'unknown' ? ' <span class="pill warn">不明</span>' : r.src === 'noweight' ? ' <span class="pill warn">1個の重さ未登録</span>' : r.src === 'part' ? ' <span class="pill gray">半製品</span>' : ''}${r.which && r.src !== 'part' ? `<br><span class="k">→ ${esc(r.which)}${r.cands ? '(同じ種類が' + r.cands.length + '件あります。該当するものをご確認ください)' : ''}</span>` : ''}</td><td class="n">${r.cost == null ? '-' : yen1(r.cost)}</td></tr>`).join('')}<tr><td><b>1仕込み</b></td><td class="n"><b>${yen(p.batch_cost)}</b></td></tr></table>${p.unknown.length ? `<div style="margin-top:8px"><p class="k" style="margin:0 0 4px">単価が未登録の材料は、原価に含まれていません。分かるものだけ入力してください(請求書を撮影しても登録されます)。</p>${p.unknown.map(n => `<p style="margin:8px 0 0"><b>${esc(n)}</b></p>${unkForm(n)}`).join('')}</div>` : ''}${(p.noWeight || []).length ? `<div style="margin-top:8px"><p class="k" style="margin:0 0 4px">個数で記載された材料は、1個の重さを入力すると原価に含まれます。</p>${p.rows.filter(r => r.src === 'noweight').map(r => `<div class="set"><span class="k">${esc(r.name)} 1${esc(r.unit)}</span><input data-pgn="${esc(r.which || r.name)}" inputmode="decimal" placeholder="例 200" style="width:6em"><span class="k">g</span><button class="btn ghost" type="button" data-pgo="${esc(r.which || r.name)}">決定</button></div>`).join('')}</div>` : ''}
      <div class="set"><span class="k">仕込み量</span><input id="sqty-${i}" inputmode="numeric" placeholder="例 60"><span class="k">${U}分</span><button class="btn ghost" type="button" data-scale="${i}">分量を出す</button></div><div id="sqout-${i}"></div>
      <div style="margin-top:12px"><b>作り方</b>${(p.steps || []).length ? `<ol class="steps">${p.steps.map((s, si) => `<li>${esc(s)}${(p.simgs || [])[si] ? `<div><img class="stimg" data-img="${esc(p.simgs[si])}" alt="手順${si + 1}の写真"><div><button class="btn ghost sm" type="button" data-imgdel="${i}:${si}">写真を消す</button></div></div>` : ` <button class="btn ghost sm" type="button" data-imgadd="${i}:${si}">写真を付ける</button>`}</li>`).join('')}</ol>` : ' <span class="k">未登録</span>'}
      <details><summary class="k" style="cursor:pointer">作り方の入力・編集(1行に1手順)</summary><textarea id="stp-${i}" rows="6" style="width:100%;margin-top:8px;font:inherit;font-size:16px;padding:8px 12px;border:1.5px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink)" placeholder="例&#10;粉と砂糖を合わせる&#10;卵を混ぜて生地にする&#10;30gずつ包んで焼く">${esc((p.steps || []).join('\n'))}</textarea><div class="ask" style="margin-top:8px"><button class="btn ghost sm" type="button" data-steps="${i}">作り方を保存</button></div></details></div>
      <div class="set"><span class="k">1${U}の重さ</span><input id="spw-${i}" inputmode="decimal" value="${p.pw || ''}" placeholder="例 40"><span class="k">g</span><button class="btn ghost" type="button" data-set="pw" data-i="${i}">決定</button></div>
      ${p.composed ? '' : `<div class="set"><span class="k">または 1仕込みで</span><input id="spn-${i}" inputmode="numeric" value="${p.piecesN || ''}" placeholder="例 8"><span class="k">${U}取れる</span><button class="btn ghost" type="button" data-set="pieces" data-i="${i}">決定</button></div><p class="k" style="margin:0 0 8px">ホールケーキ1台を8切れ、1鍋で20${U === '個' ? '個' : U}のように、数で決めることもできます。${p.piecesN ? '今は数で決めています(空にして決めると重さに戻ります)。' : ''}</p>`}
      <div class="set"><span class="k">売価(税込)</span><input id="sprice-${i}" inputmode="decimal" value="${p.price || ''}" placeholder="例 250"><span class="k">円</span><button class="btn ghost" type="button" data-set="price" data-i="${i}">決定</button></div>
      ${p.kind === 'part' ? '' : `<div class="set"><span class="k">分類</span><input id="scat-${i}" list="cat-list" value="${esc(p.cat || '')}" placeholder="例 焼き菓子" maxlength="16"><button class="btn ghost" type="button" data-cat="${i}">決定</button></div>`}
      ${noMoney() || p.kind === 'part' ? '' : `<div class="set"><span class="k">出し方</span><span class="seg" data-serve="${i}">${[['takeout', '持ち帰り'], ['eatin', '店内'], ['both', '両方']].map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${(p.serve || 'takeout') === v}">${l}</button>`).join('')}</span></div>${taxHtml2(p)}${guideHtml(p, i)}`}
      ${noMoney() || p.kind === 'part' ? '' : composeHtml(p)}
      ${noMoney() ? '' : `<div style="margin-top:16px;text-align:right"><button class="btn ghost sm" type="button" data-delprod="${esc(p.name)}" style="color:var(--warn);border-color:var(--warn)">この商品を削除</button></div>`}`;
    const isOpen = open.has(p.name);
    const ph = p.kind === 'part' && !partHead ? (partHead = true, '<div style="grid-column:1/-1;margin-top:8px"><b>生地・餡などの半製品</b> <span class="k">商品ではなく、他のレシピの材料として使うものです。AIに「〇〇は商品」と入力すると、商品に戻せます</span></div>') : '';
    return ph + `<div class="card prod" data-name="${esc(p.name)}"><div class="hd" role="button" tabindex="0" aria-expanded="${isOpen}" data-toggle>${avatar(p.name)}<span class="nm">${esc(p.name)} <span class="k">${esc(p.part)}</span></span><span class="k">${p.sure}% 確定</span></div>${head}<div class="meta">${meta.join('')}</div><div class="bar" aria-label="請求書で確認済みの割合 ${p.sure}%" title="請求書で確認済みの割合 ${p.sure}%"><i style="width:${p.sure}%"></i></div><div class="detail" ${isOpen ? '' : 'hidden'}>${det}</div></div>`;
  }).join('');
  bindUnk(box); bindCompose(box);
  box.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => { const p = D.products[b.dataset.cat]; setValueX({ field: 'pcat', product: p.name, value: $('scat-' + b.dataset.cat).value.trim() }); });
  box.querySelectorAll('[data-scale]').forEach(b => b.onclick = () => {
    const i = +b.dataset.scale, p = D.products[i], out = $('sqout-' + i), n = +($('sqty-' + i).value || 0);
    if (!(n > 0)) { out.innerHTML = '<p class="k" style="margin:4px 0 8px">製造数を入力してください。</p>'; return; }
    if (!p.pieces) { out.innerHTML = `<p class="k" style="margin:4px 0 8px">先に「1${U}の重さ」を入力すると、分量を計算できます。</p>`; return; }
    const f = n / p.pieces, fq = v => (v >= 20 ? Math.round(v).toLocaleString() : Math.round(v * 10) / 10) + 'g';
    out.innerHTML = `<table style="margin:4px 0 8px">${p.rows.map(r => `<tr><td>${esc(r.name)}</td><td class="n">${r.grams == null ? (Math.round(r.qty * f * 10) / 10) + esc(r.unit) : fq(r.grams * f)}</td></tr>`).join('')}<tr><td><b>材料費</b></td><td class="n"><b>${yen(p.batch_cost * f)}</b></td></tr></table><p class="k" style="margin:0 0 8px">${p.composed ? `1${U}の配合 × ${n}` : `ふだんの1仕込み 約${p.pieces}${U} × ${Math.round(f * 100) / 100}`}。この画面は、ブラウザの印刷機能で印刷できます。</p>`;
  });
  // 手順の写真: 出す・付ける・消す
  bindStepImgs(box);
  box.querySelectorAll('[data-imgadd]').forEach(b => b.onclick = () => {
    const [i, si] = b.dataset.imgadd.split(':').map(Number);
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = async () => {
      const f = inp.files[0]; if (!f) return;
      b.textContent = '送信しています…'; b.disabled = true;
      try {
        const img64 = await shrinkStep(f);
        const r = await api({ kind: 'app_img', product: D.products[i].name, idx: si, image: img64, type: 'image/jpeg' });
        if (!r.ok) throw new Error(r.error || '送信できませんでした');
        D = r.data; renderAll(); toast(r.msg || '写真を追加しました。', 'ok');
      } catch (e) { toast(e.message || '写真を送信できませんでした'); b.textContent = '写真を追加'; b.disabled = false; }
    };
    inp.click();
  });
  box.querySelectorAll('[data-imgdel]').forEach(b => twice(b, '写真を削除(もう一度押すと確定)', async () => {
    const [i, si] = b.dataset.imgdel.split(':').map(Number);
    const r = await api({ kind: 'app_img', product: D.products[i].name, idx: si });
    if (r.ok) { D = r.data; renderAll(); toast(r.msg || '写真を削除しました。', 'ok'); } else toast(r.error || '削除できませんでした');
  }));
  box.querySelectorAll('[data-ptg]').forEach(b => b.onclick = () => {
    const i = +b.dataset.ptg, inp = $('sptg-' + i), v = inp.value.trim() === '' ? 0 : parseFloat(inp.value);
    if (v !== 0 && !(v >= 5 && v <= 90)) { inp.focus(); chat('目標原価率は5〜90(%)の範囲で入力してください。空欄にすると店舗の目標値に戻ります'); return; }
    setValueX({ field: 'ptarget', product: D.products[i].name, value: v });
  });
  box.querySelectorAll('[data-pgo]').forEach(b => b.onclick = () => {
    const inp = box.querySelector(`[data-pgn="${CSS.escape(b.dataset.pgo)}"]`), g = parseFloat(inp.value);
    if (!(g > 0)) { inp.focus(); return; }
    const m = D.materials.find(x => x.name === b.dataset.pgo || (x.aliases || []).includes(b.dataset.pgo));
    if (!m) { chat(`「${esc(b.dataset.pgo)}」は材料一覧に登録されていません。先に材料の単価を登録してください`); return; }
    setValueX({ field: 'mat', name: m.name, value: { pieceG: g } });
  });
  box.querySelectorAll('[data-serve]').forEach(sg => sg.querySelectorAll('button').forEach(b => b.onclick = () => setValueX({ field: 'serve', product: D.products[+sg.dataset.serve].name, value: b.dataset.v })));
  box.querySelectorAll('[data-steps]').forEach(b => b.onclick = () => {
    const i = +b.dataset.steps, p = D.products[i];
    setValueX({ field: 'steps', product: p.name, value: $('stp-' + i).value.split('\n').map(x => x.trim()).filter(Boolean) });
  });
  box.querySelectorAll('[data-delprod]').forEach(b => delChoice(b,
    () => setValueX({ field: 'delprod', product: b.dataset.delprod }),
    () => setValueX({ field: 'delprod', product: b.dataset.delprod, value: { purge: true } })));
  box.querySelectorAll('.prod').forEach(c => {
    const t = c.querySelector('[data-toggle]'), name = c.dataset.name;
    const tog = () => { const d = c.querySelector('.detail'); d.hidden = !d.hidden; t.setAttribute('aria-expanded', String(!d.hidden)); d.hidden ? open.delete(name) : open.add(name); };
    t.onclick = tog; c.querySelector('.big').onclick = tog;
    t.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tog(); } };
  });
  box.querySelectorAll('[data-set]').forEach(b => b.onclick = () => {
    const i = b.dataset.i, f = b.dataset.set, inp = $((f === 'pw' ? 'spw-' : f === 'pieces' ? 'spn-' : 'sprice-') + i), v = f === 'pieces' && !inp.value.trim() ? 0 : parseFloat(inp.value);
    if (!(v > 0) && !(f === 'pieces' && v === 0)) { inp.focus(); return; }
    setValue(D.products[i].name, f, v);
  });
}

// ---------- 裏表示 ----------
let labelName = null;
const LBL_STORAGE = '直射日光、高温多湿を避けて保存してください';
// 保存方法のよく使う言い方(選ぶか、自分で書く)
const STORAGES = ['直射日光や高温多湿を避けて保存してください。', '直射日光や高温多湿を避けて冷暗所で保存してください。', '直射日光や高温多湿を避け冷暗所又は冷蔵庫で保存してください。', '高温・多湿を避けて保存してください。',
  '要冷蔵(10℃以下で保存してください)', '要冷蔵(4℃以下で保存してください)', '要冷凍(-18℃以下で保存してください)', '開封後は冷蔵庫に入れ、お早めにお召し上がりください。'];
// 名称の初めの案: 菓子のお店(または菓子とわかる商品名)は和菓子の名称、それ以外は商品名(業種で分けない。最終確認はお店)
const WAGASHI_RE = /羊羹|ようかん|餅|もち|大福|団子|だんご|饅頭|万十|まんじゅう|どら焼|最中|もなか|わらび|きんつば|おはぎ|ぼたもち/;
const lblDefName = p => { const biz = (D && D.words && D.words.biz) || ''; if (!(/菓子/.test(biz) || (!biz && WAGASHI_RE.test(p.name)))) return p.name; return /羊羹|ようかん/.test(p.name) ? '和生菓子(羊羹)' : /餅|もち/.test(p.name) ? '和生菓子' : '和菓子'; };
// 商品ごとのラベル設定(未設定のところは案で埋める)
function lblOf(p) {
  const s = p.lbl || {};
  return { name: s.name || lblDefName(p), dtype: s.dtype || '消費期限', days: s.days === 0 || s.days ? Number(s.days) : '', storage: s.storage || LBL_STORAGE,
    content: s.content || `1${U}${p.nutr && p.nutr.weight ? `(${p.nutr.weight}g)` : ''}`, jan: s.jan || '', nut: !!s.nut && !!((p.nutr && p.nutr.per) || s.nutMan), saved: !!p.lbl,
    packs: Array.isArray(s.packs) ? s.packs : [], pla: !!s.pla, nutMan: s.nutMan || null,
    origin: s.origin || '', makerKind: s.makerKind || '製造者', factory: s.factory || '', fcode: s.fcode || '', caution: s.caution || '', opened: s.opened || '', contam: Array.isArray(s.contam) ? s.contam : [], free: s.free || '' };
}
// 原材料名に原料原産地名を入れる(いちばん多い原材料のすぐ後ろに「(国内製造)」など)
function ingWithOrigin(text, origin) {
  if (!text || !origin) return text || '';
  const m = text.match(/^([^、\/(]+)(\([^)]*\))?/); if (!m || (m[2] && m[2].includes(origin))) return text;
  const head = m[1] + (m[2] ? m[2].slice(0, -1) + '、' + origin + ')' : '(' + origin + ')');
  return head + text.slice(m[0].length);
}
// 枠の外に書く注意書き(使用上の注意・開封後・同じ工場のアレルゲン・自由記入)
function lblNotes(L) {
  const n = [];
  if (L.caution) n.push(L.caution);
  if (L.opened) n.push(L.opened);
  if (L.contam && L.contam.length) n.push(`本品製造工場では、${L.contam.join('・')}を含む製品を製造しています。`);
  if (L.free) n.push(L.free);
  return n;
}
const ALLG_ALL = ['卵', '乳', '小麦', 'えび', 'かに', 'くるみ', 'そば', '落花生', 'カシューナッツ', 'アーモンド', 'あわび', 'いか', 'いくら', 'オレンジ', 'キウイフルーツ', '牛肉', 'ごま', 'さけ', 'さば', '大豆', '鶏肉', 'バナナ', '豚肉', 'マカダミアナッツ', 'もも', 'やまいも', 'りんご', 'ゼラチン'];
// 包装の種類の入力行(包装・内容量・JAN)
const packRow = (k, i) => `<div class="pkrow" style="display:grid;grid-template-columns:1.2fr 1fr 1.6fr auto;gap:8px;margin-bottom:8px">
  <input class="pk-name" placeholder="例 4個入り袋" value="${esc(k.name || '')}" aria-label="包装${i + 1}の名前">
  <input class="pk-ct" placeholder="例 4個" value="${esc(k.content || '')}" aria-label="包装${i + 1}の内容量">
  <input class="pk-jan" inputmode="numeric" placeholder="JAN(13桁)" value="${esc(k.jan || '')}" aria-label="包装${i + 1}のJANコード">
  <button class="btn ghost pk-del" type="button" aria-label="この包装を消す" style="padding:0 12px">×</button></div>`;
function janCheck(d) {
  d = String(d || '').replace(/[\s-]/g, '');
  if (!d) return { ok: true, empty: true };
  if (!/^\d{13}$/.test(d)) return { ok: false, msg: `JANコードは13桁の数字です(現在${d.replace(/\D/g, '').length}桁)` };
  let t = 0; for (let i = 0; i < 12; i++) t += +d[i] * (i % 2 ? 3 : 1);
  return (10 - t % 10) % 10 === +d[12] ? { ok: true, code: d } : { ok: false, msg: 'チェックデジット(最後の数字)が一致しません。番号をご確認ください' };
}
const sellFace = () => (D.shopInfo || {}).sell === 'face';
// 店頭に置くもの: アレルゲン一覧表(全商品 × 特定原材料)とプライスカード。対面販売のお店はこちらが主役
const ALG_MUST = () => (D.allergenRules || {})['義務'] || ['えび', 'かに', 'くるみ', '小麦', 'そば', '卵', '乳', '落花生', 'カシューナッツ'];
const ALG_REC = () => (D.allergenRules || {})['推奨'] || [];
function allergenTable(forPrint) {
  const must = ALG_MUST(), used = new Set(), goods = D.products.filter(p => p.kind !== 'part'); goods.forEach(p => p.label.allergens.forEach(a => used.add(a)));
  const rec = ALG_REC().filter(a => used.has(a));
  const col = a => `<th style="padding:4px 4px;font-size:12px;line-height:1.25;white-space:normal;min-width:2.6em;vertical-align:bottom">${esc(a.replace('成分', ''))}</th>`;
  return `<table class="hgrid alg"><tr><th style="text-align:left">商品</th>${must.map(col).join('')}${rec.length ? `<th style="border-left:2px solid var(--line)"></th>${rec.map(col).join('')}` : ''}</tr>` +
    goods.map(p => { const has = new Set(p.label.allergens); return `<tr><td style="text-align:left;white-space:nowrap"><b>${esc(p.name)}</b>${p.label.check.length ? ' <span class="k">※</span>' : ''}</td>${must.map(a => `<td>${has.has(a) ? '●' : ''}</td>`).join('')}${rec.length ? `<td style="border-left:2px solid var(--line)"></td>${rec.map(a => `<td>${has.has(a) ? '●' : ''}</td>`).join('')}` : ''}</tr>`; }).join('') +
    `</table><p class="k" style="margin:8px 0 0">左が表示義務の${must.length}品目${rec.length ? '、右が表示推奨のうち使っているもの' : ''}。${D.products.some(p => p.label.check.length) ? '※は材料の確認が完了していない商品で、内容が変わる場合があります。' : ''}レシピから自動で作成した案です。最終確認は店舗で行ってください。</p>`;
}
function priceCard(p) {
  const L = lblOf(p), alg = p.label.allergens;
  return `<div class="pcard"><div class="pn">${esc(p.name)}</div><div class="pp">${p.price ? p.price.toLocaleString('ja-JP') + '<small>円</small>' : '<small class="k">売価は原価の画面で</small>'}</div>
    <div class="pa">${alg.length ? 'アレルゲン: ' + alg.map(esc).join('・') : 'アレルゲン: 特定原材料は使っていません'}</div>${store.get('qrOnCard', false) && D.pubUrl ? `<img class="pqr" src="${qrDataUrl(D.pubUrl, 120)}" alt="" style="position:absolute;right:4mm;bottom:4mm;width:16mm;height:16mm">` : ''}</div>`;
}
// QRの絵(データURL)。qrcodejs を隠した箱に描いて取り出す。使えないときは空
function qrDataUrl(text, size) {
  try { if (!window.QRCode) return ''; const d = document.createElement('div'); d.style.cssText = 'position:absolute;left:-9999px;top:0'; document.body.appendChild(d);
    new QRCode(d, { text, width: size || 300, height: size || 300, correctLevel: QRCode.CorrectLevel.M }); const c = d.querySelector('canvas'), u = c ? c.toDataURL('image/png') : (d.querySelector('img') || {}).src || ''; d.remove(); return u; } catch (e) { return ''; }
}
// お客様向けのアレルゲン一覧のQR(全プラン)。出すのは商品名とアレルゲンだけ
function qrBox() {
  if (!D.pubUrl) return '';
  const goods = D.products.filter(p => p.kind !== 'part'), shown = goods.filter(p => !p.pubHide).length, u = qrDataUrl(D.pubUrl, 300);
  return `<div class="card" id="qr-card" style="margin-top:12px"><p style="margin:0 0 8px"><b>お客様向けのアレルゲン一覧(QR)</b> <span class="k">お客様がスマートフォンで読み取ると、商品ごとのアレルゲンを確認できます。ログインは不要で、原価・売価・原材料名は表示されません</span></p>
    <div class="qrbox"><div class="qr">${u ? `<img src="${u}" alt="アレルゲン一覧のQRコード">` : '<span class="k">QRコードを作成できませんでした</span>'}</div>
    <div><p class="url" style="margin:0 0 6px">${esc(D.pubUrl)}</p><p class="k" style="margin:0 0 8px">掲載中の商品 ${shown}/${goods.length}品。レシピを変更すると、一覧にも反映されます。</p>
      <div class="ask" style="justify-content:flex-start"><a class="btn ghost sm" href="${esc(D.pubUrl)}" target="_blank" rel="noopener">開いて確認</a><button class="btn ghost sm" type="button" id="qr-a5">A5用紙に印刷</button><button class="btn ghost sm" type="button" id="qr-cards">名刺サイズで印刷(A4に10枚)</button><button class="btn ghost sm" type="button" id="qr-copy">URLをコピー</button>${D.me && D.me.owner ? '<button class="btn ghost sm" type="button" id="qr-renew">QRコードを再発行</button>' : ''}</div>
      <details style="margin-top:8px"><summary class="k">掲載する商品の選択</summary><div class="publ">${goods.map(p => `<label class="${p.pubHide ? 'off' : ''}"><input type="checkbox" data-pub="${esc(p.name)}"${p.pubHide ? '' : ' checked'}>${esc(p.name)}${p.label.allergens.length ? ` <span class="k">${p.label.allergens.map(esc).join('・')}</span>` : ''}</label>`).join('')}</div></details>
      <label style="display:flex;gap:8px;align-items:center;margin-top:8px;font-size:14px"><input type="checkbox" id="qr-oncard"${store.get('qrOnCard', false) ? ' checked' : ''}>プライスカード・POPの隅にもQRコードを入れる</label></div></div></div>`;
}
function bindQr() {
  if (!$('qr-card')) return;
  const si = D.shopInfo || {}, u = qrDataUrl(D.pubUrl, 600), name = esc(si.name || D.shop);
  const sheet = (w, h, n) => `<style>.qg{display:grid;grid-template-columns:repeat(${n === 1 ? 1 : 2},1fr);gap:6mm}.qc{border:1px solid #999;border-radius:3mm;padding:${n === 1 ? '10mm' : '4mm'};width:${w};height:${h};display:grid;grid-template-columns:${n === 1 ? '1fr' : '28mm 1fr'};gap:${n === 1 ? '6mm' : '3mm'};align-items:center;break-inside:avoid;page-break-inside:avoid;text-align:${n === 1 ? 'center' : 'left'}}.qc img{width:${n === 1 ? '70mm' : '28mm'};height:auto;margin:0 auto}.qc b{display:block;font-size:${n === 1 ? '20pt' : '11pt'}}.qc p{margin:2mm 0 0;font-size:${n === 1 ? '13pt' : '8pt'};line-height:1.4}</style><div class="qg">` +
    Array.from({ length: n }, () => `<div class="qc"><img src="${u}" alt=""><div><b>${name}</b><p>アレルゲン一覧</p><p>このQRで、商品ごとのアレルゲンをスマートフォンで確認できます。</p><p style="font-size:${n === 1 ? '10pt' : '7pt'}">詳しくは店舗のスタッフにお尋ねください</p></div></div>`).join('') + '</div>';
  $('qr-a5').onclick = () => openPrint(sheet('128mm', '170mm', 1), { bare: true });
  $('qr-cards').onclick = () => openPrint(sheet('91mm', '55mm', 10), { bare: true });
  $('qr-copy').onclick = async () => { try { await navigator.clipboard.writeText(D.pubUrl); toast('URLをコピーしました'); } catch (e) { alert('このURLをコピーしてください\n' + D.pubUrl); } };
  if ($('qr-renew')) $('qr-renew').onclick = () => { if (confirm('QRコードを再発行すると、これまでのQRコード(印刷済みの紙)は使えなくなります。再発行しますか?')) setValueX({ field: 'pubqr', value: 1 }); };
  $('qr-oncard').onchange = () => { store.set('qrOnCard', $('qr-oncard').checked); renderLabel(); };
  document.querySelectorAll('[data-pub]').forEach(c => c.onchange = () => setValueX({ field: 'pubhide', product: c.dataset.pub, value: !c.checked }));
}
function storeBox() {
  if (!D.products.length) return '';
  const sel = D.products.find(x => x.name === labelName) || D.products[0];
  return `<div class="card" id="alg-card"><p style="margin:0 0 8px"><b>アレルゲン一覧表</b> <span class="k">店頭やメニューの近くに置き、お客様からお問い合わせがあった際に提示します</span></p><div class="scroll">${allergenTable()}</div>
      <div class="ask"><button class="btn ghost" type="button" id="alg-print">一覧表を印刷・PDF</button></div></div>
    <div class="card" style="margin-top:12px"><p style="margin:0 0 8px"><b>プライスカード</b> <span class="k">${esc(sel.name)} · 商品名・価格・アレルゲン</span></p>${priceCard(sel)}
      <div class="ask"><button class="btn ghost" type="button" id="pc-print">この商品を印刷</button><button class="btn ghost" type="button" id="pc-print-all">全部の商品を印刷</button></div></div>` + qrBox();
}
function bindStore() {
  const head = `<h2 style="letter-spacing:.1em">アレルゲン一覧表</h2><p>${esc(D.shop)} · ${new Date().toLocaleDateString('ja-JP')}時点</p>`;
  if ($('alg-print')) $('alg-print').onclick = () => openPrint(head + allergenTable(true).replace(/class="k"/g, 'style="font-size:11px"'));
  const cards = ps => `<style>.pcg{display:grid;grid-template-columns:1fr 1fr;gap:8mm}.pcard{position:relative;border:1.5px solid #111;border-radius:4mm;padding:6mm;min-height:48mm;break-inside:avoid}.pn{font-size:22px;font-weight:700}.pp{font-size:34px;font-weight:700;margin:4px 0}.pp small{font-size:16px}.pa{font-size:14px;border-top:1px solid #999;padding-top:4px;margin-top:6px}</style><div class="pcg">${ps.map(priceCard).join('')}</div>`;
  if ($('pc-print')) $('pc-print').onclick = () => openPrint(cards([D.products.find(x => x.name === labelName) || D.products[0]]));
  if ($('pc-print-all')) $('pc-print-all').onclick = () => openPrint(cards(D.products.filter(p => p.kind !== 'part')));
  bindQr();
}
document.addEventListener('click', e => { if (e.target && e.target.id === 'hint-again') { store.set('hintsOff', false); store.set('hintSeen', {}); toast('次に画面を開いたときに、ヒントを表示します'); show('today'); } });
document.addEventListener('click', e => { if (e.target && e.target.id === 'ls-go') { const name = $('ls-name').value.trim(), addr = $('ls-addr').value.trim(); if (!addr) { $('ls-addr').focus(); return; } setValueX({ field: 'shop', value: { name, addr } }); } });
// 表示の画面は作るのに時間がかかる(ラベル・QR・栄養)ので、開いている時だけ作り直す
let labelStale = true;
function renderLabel() {
  labelStale = false;
  const chips = $('label-chips'), box = $('label-box'), face = sellFace();
  $('label-h').textContent = face ? 'アレルゲン' : '食品表示';
  $('label-lead').innerHTML = face ? '対面販売・店内飲食の商品には、食品表示ラベルは不要です。お客様に提示するアレルゲン一覧表とプライスカードを作成できます。包装して販売する商品や卸す商品は、下の「ラベルを印刷」から食品表示ラベルを作成できます。' : '一括表示の案とラベルの印刷。<mark>色の付いた箇所</mark>はご確認ください。最終確認と表示の責任は事業者様にあります。<a href="/law" target="_blank" rel="noopener">食品表示の改正と対応の記録</a>';
  if (!D.products.length) { chips.innerHTML = ''; box.innerHTML = emptyBox('label', 'レシピが登録されていません', 'レシピを撮影すると、ここに' + (face ? 'アレルゲン一覧表' : '食品表示の案') + 'が表示されます。', ['レシピを撮影', 'cam']); return; }
  if (!D.products.find(p => p.name === labelName)) labelName = D.products[0].name;
  const goods = D.products.filter(p => p.kind !== 'part');
  if (goods.length && !goods.find(p => p.name === labelName)) labelName = goods[0].name;
  chips.innerHTML = goods.map(p => `<button class="chip" type="button" aria-pressed="${p.name === labelName}">${esc(p.name)}</button>`).join('');
  chips.querySelectorAll('.chip').forEach((b, i) => b.onclick = () => { labelName = goods[i].name; renderLabel(); });
  if (cur === 'label' && labelName) setCrumb([labelName]);
  const p = D.products.find(x => x.name === labelName), lb = p.label, L = lblOf(p), si = D.shopInfo || {};
  const needShop = !(si.name && si.addr) && D.me && D.me.owner;
  const shopMini = needShop ? `<div class="card" id="lbl-shop"><p style="margin:0 0 8px"><b>ラベルの「製造者」欄に記載する店舗名と住所</b></p><div class="mn-add" style="margin:0;padding:0;border:0"><input id="ls-name" placeholder="店舗名" value="${esc(si.name || D.shop || '')}" style="flex:1 1 140px;min-width:0"><input id="ls-addr" placeholder="住所(例: 千葉県勝浦市〜)" value="${esc(si.addr || '')}" style="flex:2 1 200px;min-width:0"><button class="btn" type="button" id="ls-go">保存</button></div></div>` : '';
  box.innerHTML = shopMini + (face ? storeBox() + `<details class="card" style="margin-top:16px" id="face-lbl"><summary><b>包装販売・卸売の商品のラベル</b> <span class="k">持ち帰り・道の駅・スーパーなどに出す商品</span></summary><div style="margin-top:12px">` : '') + `<div class="label">
    <div class="r"><div class="h">名称</div><div class="v">${esc(L.name)}</div></div>
    <div class="r"><div class="h">原材料名</div><div class="v"><span id="ing">${esc(ingWithOrigin(lb.text, L.origin)) || '(まだ作成できません)'}</span>${lb.check.length ? `、<mark>${lb.check.map(esc).join('、')}(要確認)</mark>` : ''}${esc(lb.contains)}</div></div>
    <div class="r"><div class="h">内容量</div><div class="v">${esc(L.content)}</div></div>
    <div class="r"><div class="h">${esc(L.dtype)}</div><div class="v">枠外下部に記載${L.days === '' ? '' : `<span class="k">(作った日から${L.days}日)</span>`}</div></div>
    <div class="r"><div class="h">保存方法</div><div class="v">${esc(L.storage)}</div></div>
    <div class="r"><div class="h">${esc(L.makerKind)}</div><div class="v">${esc(si.name || D.shop)} ${si.addr ? esc(si.addr) : '<span class="k">(住所は設定から)</span>'}${L.fcode ? ` <b>${esc(L.fcode)}</b>` : ''}</div></div>${L.factory ? `<div class="r"><div class="h">製造所</div><div class="v">${esc(L.factory)}</div></div>` : ''}</div>
    ${lblNotes(L).length ? `<div class="k" style="margin-top:8px">${lblNotes(L).map(esc).join('<br>')}</div>` : ''}
    <div class="ask" style="margin-top:12px"><button class="btn" id="copy" type="button">原材料名をコピー</button>${specOn() ? '<button class="btn ghost" id="spec-one" type="button">商品規格書(Excel)</button><button class="btn ghost" id="spec-all" type="button">全商品の規格書</button>' : ''}<span class="copied" id="copied"></span></div>
    ${lblPrintCard(p, L)}
    ${nutrBox(p)}` + (face ? '</div></details>' : '<h1 class="sub" style="margin-top:24px">店頭掲示物</h1>' + storeBox());
  bindStore();
  if ($('spec-one')) $('spec-one').onclick = () => specExport([p]);
  if ($('spec-all')) $('spec-all').onclick = () => specExport(D.products);
  if ($('bk-go')) $('bk-go').onclick = () => { const v = parseFloat($('bk-v').value); if (!(v > 0)) { $('bk-v').focus(); return; } setValue(p.name, 'baked', v); };
  if ($('nu-copy')) $('nu-copy').onclick = async () => { try { await navigator.clipboard.writeText($('nu-txt').innerText); chat('コピーしました', 'heart'); } catch (e) { chat('長押しで選択してコピーしてください'); } };
  $('copy').onclick = async () => {
    const t = $('ing').textContent + (lb.contains || '');
    try { await navigator.clipboard.writeText(t); $('copied').textContent = 'コピーしました'; }
    catch (e) { const r = document.createRange(); r.selectNodeContents($('ing')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); $('copied').textContent = '選択しました。長押しでコピーしてください'; }
  };
  bindLblPrint(p, L);
}

// ---------- ラベル印刷: どの機械で刷るかを最初に聞く ----------
// シート: コピー機・家庭用プリンタでA4のシール用紙に刷る(用紙は種類が多いので、面数と大きさ・自分で測った値で合わせる)
// ロール: ラベルプリンターのロールに1枚ずつ刷る(1枚=1ページ)
// 設定は機械ごとに違うので、この端末に覚える
const SHEETS = {
  p10: ['10面', 86.4, 50.8, 2, 5, 21.5, 18.6, 0, 0], p12: ['12面', 86.4, 42.3, 2, 6, 21.6, 18.6, 0, 0], p14: ['14面', 99.1, 38.1, 2, 7, 15.15, 4.65, 2.5, 0],
  p18: ['18面', 70, 42.3, 3, 6, 21.6, 0, 0, 0], p18b: ['18面 余白付', 63.5, 46.6, 3, 6, 8.7, 7.25, 2.5, 0], p21: ['21面', 63.5, 38.1, 3, 7, 15.15, 7.25, 2.5, 0],
  p24: ['24面', 70, 33.9, 3, 8, 12.9, 0, 0, 0], p44: ['44面', 48.3, 25.4, 4, 11, 8.8, 8.4, 0, 0]
}; // 名前, 幅, 高さ, 列, 段, 上余白, 左余白, 横すき間, 縦すき間(ミリ)
// よく使う用紙の品番(袋に書いてある面数と大きさで確かめる。同じ面数でも大きさがちがう品番がある)
const SHEET_PN = { p10: 'エーワン 72210 など', p12: 'エーワン 72212・28915 など', p14: 'エーワン 72214 など', p18: 'エーワン 72218 など', p18b: 'エーワン 28918 など', p21: 'エーワン 72221 など', p24: 'エーワン 72224 など', p44: 'エーワン 72244 など' };
// ラベルプリンターのロール: [幅, 長さ, 機械と用紙の名前]
const ROLLS = {
  r62x100: [62, 100, 'ブラザー QL DK-1202'], r62x29: [62, 29, 'ブラザー QL DK-1209(宛名小)'], r29x90: [29, 90, 'ブラザー QL DK-1201'], r62x60: [62, 60, 'ブラザー QL 62mm連続テープを60mmで'], r62x80: [62, 80, 'ブラザー QL 62mm連続テープを80mmで'],
  r60x40: [60, 40, 'SATO・感熱ラベル 60×40'], r50x30: [50, 30, 'SATO・感熱ラベル 50×30'], r40x30: [40, 30, 'SATO・感熱ラベル 40×30'], r80x60: [80, 60, 'SATO・感熱ラベル 80×60'], r100x60: [100, 60, 'SATO・感熱ラベル 100×60'], r58x40: [58, 40, '感熱プリンター 58mm幅'], r80x50: [80, 50, '感熱プリンター 80mm幅']
};
const LS_DEF = { mode: '', sheet: 'p12', pt: 6, dx: 0, dy: 0, scale: 100, datePos: 'foot', custom: { w: 86.4, h: 42.3, cols: 2, rows: 6, top: 21.6, left: 18.6, gx: 0, gy: 0 }, roll: 'r62x100', rw: 62, rh: 100, rot: false };
const lsGet = () => { try { const o = JSON.parse(localStorage.getItem('shikomi:lblsheet') || '{}'); return Object.assign({}, LS_DEF, o, { custom: Object.assign({}, LS_DEF.custom, o.custom || {}) }); } catch (e) { return JSON.parse(JSON.stringify(LS_DEF)); } };
const lsSet = o => { try { localStorage.setItem('shikomi:lblsheet', JSON.stringify(o)); } catch (e) {} };
// 用紙の形(シート): [名前, 幅, 高さ, 列, 段, 上余白, 左余白, 横すき間, 縦すき間]
const sheetOf = S => S.sheet === 'custom' ? ['用紙サイズを指定', +S.custom.w, +S.custom.h, +S.custom.cols, +S.custom.rows, +S.custom.top, +S.custom.left, +S.custom.gx, +S.custom.gy] : (SHEETS[S.sheet] || SHEETS.p12);
const rollOf = S => S.roll === 'custom' ? [+S.rw || 62, +S.rh || 100] : (ROLLS[S.roll] || ROLLS.r62x100);
function lblPrintCard(p, L) {
  const S = lsGet();
  const head = `<p style="margin:0 0 4px"><b>ラベルを印刷</b></p>`;
  if (!S.mode) return `<div class="card lpc" style="margin-top:16px">${head}
    <p style="margin:0 0 12px">印刷に使用する機器を選択してください</p>
    <div class="lmode"><button type="button" data-lm="sheet"><b>コピー機・家庭用プリンタ</b><span>A4のラベル用紙(10面・12面・21面など)に、まとめて印刷します</span></button>
    <button type="button" data-lm="roll"><b>ラベルプリンター</b><span>ロール状のラベルに、1枚ずつ印刷します(ブラザーのQLシリーズなど)</span></button></div>
    <p class="k" style="margin:8px 0 0">後から変更できます。この端末に保存されます。</p></div>`;
  const today = new Date(), iso = new Date(today - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const sheet = S.mode === 'sheet', sh = sheetOf(S), per = sheet ? sh[3] * sh[4] : 10, [rw, rh] = rollOf(S), C = S.custom;
  const num = (id, v, u) => `<span style="display:flex;gap:4px;align-items:center"><input id="${id}" inputmode="decimal" value="${v}" style="width:5em">${u || ''}</span>`;
  return `<div class="card lpc" style="margin-top:16px">${head}
    <p class="k" style="margin:0 0 8px">刷る機械: <b>${sheet ? 'コピー機・家庭用プリンタ(A4のシール用紙)' : 'ラベルプリンター(ロール)'}</b> <a href="#" id="lb-mode" style="color:var(--accent)">変える</a></p>
    <details${L.saved ? '' : ' open'}><summary class="k">この商品のラベル設定${L.saved ? '' : '(はじめに1回)'}</summary>
      <div class="fld" style="margin-top:8px">
        <span class="k">名称</span><input id="lb-name" value="${esc(L.name)}">
        <span class="k">期限</span><span style="display:flex;gap:8px;align-items:center"><select id="lb-dtype"><option${L.dtype === '消費期限' ? ' selected' : ''}>消費期限</option><option${L.dtype === '賞味期限' ? ' selected' : ''}>賞味期限</option></select>作った日から<input id="lb-days" inputmode="numeric" value="${L.days}" style="width:4em">日</span>
        <span class="k">保存方法</span><div><select id="lb-stsel" style="width:100%">${STORAGES.map(x => `<option${x === L.storage ? ' selected' : ''}>${esc(x)}</option>`).join('')}<option value=""${STORAGES.includes(L.storage) ? '' : ' selected'}>自分で書く</option></select>
          <input id="lb-st" value="${esc(L.storage)}" style="margin-top:8px${STORAGES.includes(L.storage) ? ';display:none' : ''}" placeholder="保存方法を書く"></div>
        <span class="k">包装</span><div><div id="lb-packs">${(L.packs.length ? L.packs : [{ name: '', content: L.content, jan: L.jan }]).map(packRow).join('')}</div>
          <button class="btn ghost" type="button" id="lb-addpack">包装を追加</button><p class="k" style="margin:4px 0 0">袋・箱など包装ごとに、内容量とJANコード(卸売の商品のみ)を入力します</p></div>
        <span class="k">栄養成分</span><div><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="lb-nut"${L.nut ? ' checked' : ''}>ラベルに載せる</label>
          <details${L.nutMan ? ' open' : ''}><summary class="k">前の表示や分析の値を使う(入れなければ計算した値)</summary><div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:8px"><select id="lb-nbase"><option${!L.nutMan || L.nutMan.base === '100g' ? ' selected' : ''}>100g</option><option${L.nutMan && L.nutMan.base === '1個' ? ' selected' : ''}>1個</option></select><span class="k">当たり</span>
          ${['熱量kcal', 'たんぱく質g', '脂質g', '炭水化物g', '食塩相当量g'].map((l, i) => `<label class="k" style="display:flex;flex-direction:column">${l}<input class="lb-nv" inputmode="decimal" style="width:5.5em" value="${L.nutMan ? L.nutMan.v[i] : ''}"></label>`).join('')}</div></details></div>
        <span class="k">プラマーク</span><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="lb-pla"${L.pla ? ' checked' : ''}>ラベルに表示する(袋がプラスチック製の場合)</label>
        <span class="k">原料原産地</span><div><input id="lb-origin" list="lb-origin-l" value="${esc(L.origin)}" placeholder="例: 国内製造、国産、アメリカ産"><datalist id="lb-origin-l"><option value="国内製造"><option value="国産"><option value="北海道産"><option value="アメリカ産"><option value="カナダ産"><option value="中国産"><option value="輸入"></datalist><p class="k" style="margin:4px 0 0">最も多い原材料の直後に「(国内製造)」の形で表示されます。加工品は「国内製造」、生鮮品は「国産」「〇〇産」と入力します</p></div>
        <span class="k">表示する者</span><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><select id="lb-mk"><option${L.makerKind === '製造者' ? ' selected' : ''}>製造者</option><option${L.makerKind === '販売者' ? ' selected' : ''}>販売者</option><option${L.makerKind === '加工者' ? ' selected' : ''}>加工者</option></select><input id="lb-fcode" value="${esc(L.fcode)}" placeholder="固有記号(あれば。例: +AB1)" style="width:12em"></div>
        <span class="k">製造所</span><div><input id="lb-factory" value="${esc(L.factory)}" placeholder="店舗と別の場所で作るときだけ(名前と住所)"><p class="k" style="margin:4px 0 0">空なら、上の「${esc(L.makerKind)}」の住所で作っている扱いです</p></div>
        <span class="k">使用上の注意</span><input id="lb-caution" list="lb-caution-l" value="${esc(L.caution)}" placeholder="例: 開封後はお早めにお召し上がりください"><datalist id="lb-caution-l"><option value="開封後はお早めにお召し上がりください。"><option value="お早めにお召し上がりください。"><option value="小さなお子様やお年寄りの方は、のどに詰まらせないようご注意ください。"><option value="温め直すときは袋から出してください。"><option value="乾燥剤は食べられません。"></datalist>
        <span class="k">開封後</span><input id="lb-opened" list="lb-opened-l" value="${esc(L.opened)}" placeholder="例: 開封後は冷蔵庫で保存し、2日以内に"><datalist id="lb-opened-l"><option value="開封後は冷蔵庫(10℃以下)で保存し、お早めにお召し上がりください。"><option value="開封後は密封して冷蔵庫で保存してください。"><option value="開封後は当日中にお召し上がりください。"></datalist>
        <span class="k">同じ工場で</span><div><div class="chips" style="margin:0">${ALLG_ALL.map(a => `<label class="chip" style="cursor:pointer"><input type="checkbox" class="lb-ct" value="${a}"${L.contam.includes(a) ? ' checked' : ''} style="margin:0 4px 0 0">${a}</label>`).join('')}</div><p class="k" style="margin:4px 0 0">この商品には含まれないものの、同じ厨房で使用しているアレルゲンです。「本品製造工場では、〇〇を含む製品を製造しています」と枠外に表示されます</p></div>
        <span class="k">自由記入</span><input id="lb-free" value="${esc(L.free)}" placeholder="例: 詰め合わせの内容、原材料の一部にはちみつを使用(1歳未満の乳児には与えないでください)">
      </div><div class="ask"><button class="btn ghost" type="button" id="lb-save">設定を保存</button><span class="k" id="lb-msg"></span></div></details>
    <div class="fld" style="margin-top:8px">
      ${L.packs.length > 1 ? `<span class="k">包装</span><select id="lb-pack">${L.packs.map((k, i) => `<option value="${i}">${esc(k.name || k.content)}</option>`).join('')}</select>` : ''}
      ${sheet ? `<span class="k">用紙</span><select id="lb-sheet">${Object.entries(SHEETS).map(([k, v]) => `<option value="${k}"${k === S.sheet ? ' selected' : ''}>${v[0]} ${v[1]}×${v[2]}ミリ(${SHEET_PN[k] || ''})</option>`).join('')}<option value="custom"${S.sheet === 'custom' ? ' selected' : ''}>該当なし(寸法を測って入力)</option></select>`
        : `<span class="k">ラベルの大きさ</span><select id="lb-roll">${Object.entries(ROLLS).map(([k, v]) => `<option value="${k}"${k === S.roll ? ' selected' : ''}>${v[2]} 幅${v[0]}×長さ${v[1]}ミリ</option>`).join('')}<option value="custom"${S.roll === 'custom' ? ' selected' : ''}>ほかの大きさ</option></select>
        ${S.roll === 'custom' ? `<span class="k">幅×長さ</span><span style="display:flex;gap:4px;align-items:center"><input id="lb-rw" inputmode="decimal" value="${rw}" style="width:4.5em">×<input id="lb-rh" inputmode="decimal" value="${rh}" style="width:4.5em">ミリ</span>` : ''}`}
      <span class="k">向き</span><select id="lb-rot"><option value="0"${S.rot ? '' : ' selected'}>ラベルの向きのまま刷る</option><option value="1"${S.rot ? ' selected' : ''}>90度回して刷る(縦と横を入れかえ)</option></select>
      <span class="k">並べ方</span><select id="lb-lay"><option value="auto"${(S.lay || 'auto') === 'auto' ? ' selected' : ''}>おまかせ(形に合わせる)</option><option value="side"${S.lay === 'side' ? ' selected' : ''}>横版(栄養・バーコードは右)</option><option value="stack"${S.lay === 'stack' ? ' selected' : ''}>縦版(栄養・バーコードは下)</option></select>
      <span class="k">作った日</span><input id="lb-day" type="date" value="${iso}">
      <span class="k">期限</span><span style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><select id="lb-dt2"><option${L.dtype === '賞味期限' ? '' : ' selected'}>消費期限</option><option${L.dtype === '賞味期限' ? ' selected' : ''}>賞味期限</option></select><input id="lb-exp" type="date" style="width:auto"><span class="k">${L.days !== '' ? `空欄の場合は製造日から${L.days}日` : '日付を入れる'}</span></span>
      <span class="k">枚数</span><span style="display:flex;gap:8px;align-items:center"><input id="lb-n" inputmode="numeric" value="${per}" style="width:5em">枚</span>
      ${sheet ? `<span class="k">使用済み</span><span style="display:flex;gap:8px;align-items:center"><input id="lb-skip" inputmode="numeric" value="0" style="width:5em">枚を飛ばす<span class="k">(使いかけの用紙)</span></span>` : ''}
      <span class="k">文字</span><select id="lb-pt">${[5.5, 6, 7, 8, 9].map(v => `<option${v == S.pt ? ' selected' : ''}>${v}</option>`).join('')}</select>
      <span class="k">期限の日付</span><select id="lb-dpos"><option value="foot"${S.datePos === 'foot' ? ' selected' : ''}>ラベルの下に刷る</option><option value="inside"${S.datePos === 'inside' ? ' selected' : ''}>表の中に刷る</option><option value="stamp"${S.datePos === 'stamp' ? ' selected' : ''}>刷らない(日付印を押す)</option></select>
    </div>
    ${sheet && S.sheet === 'custom' ? `<details open><summary class="k">用紙の寸法を入力(ミリ)</summary><p class="k" style="margin:8px 0">用紙の袋に記載されたサイズでも構いません。左上のラベルから測ってください。</p><div class="fld">
      <span class="k">1枚の幅×高さ</span><span style="display:flex;gap:4px;align-items:center"><input id="lc-w" inputmode="decimal" value="${C.w}" style="width:4.5em">×<input id="lc-h" inputmode="decimal" value="${C.h}" style="width:4.5em"></span>
      <span class="k">横に何枚×縦に何段</span><span style="display:flex;gap:4px;align-items:center"><input id="lc-cols" inputmode="numeric" value="${C.cols}" style="width:3.5em">×<input id="lc-rows" inputmode="numeric" value="${C.rows}" style="width:3.5em"></span>
      <span class="k">紙の上の端から</span>${num('lc-top', C.top, 'ミリ')}<span class="k">紙の左の端から</span>${num('lc-left', C.left, 'ミリ')}
      <span class="k">ラベルの間(横・縦)</span><span style="display:flex;gap:4px;align-items:center"><input id="lc-gx" inputmode="decimal" value="${C.gx}" style="width:4.5em"><input id="lc-gy" inputmode="decimal" value="${C.gy}" style="width:4.5em">ミリ</span></div></details>` : ''}
    <details${S.dx || S.dy || S.scale != 100 ? ' open' : ''}><summary class="k">印刷位置やサイズがずれる場合</summary>
      <p class="k" style="margin:8px 0">まず「位置合わせ用の試し印刷」を普通紙に印刷し、ラベル用紙に重ねてご確認ください。ずれた分の数値を入力します。</p>
      <div class="fld"><span class="k">右方向(ミリ)</span><input id="lb-dx" inputmode="decimal" value="${S.dx}"><span class="k">下方向(ミリ)</span><input id="lb-dy" inputmode="decimal" value="${S.dy}">
      <span class="k">倍率(%)</span><input id="lb-scale" inputmode="decimal" value="${S.scale}"></div>
      <p class="k" style="margin:4px 0 0">左方向・上方向は、マイナスの値(-1.5 など)で入力します。</p></details>
    <div class="ask"><button class="btn" type="button" id="lb-print">印刷する</button><button class="btn ghost" type="button" id="lb-test">位置合わせ用の試し印刷</button><button class="btn ghost" type="button" id="lb-csv">他のラベルソフト用に出力(CSV)</button></div>
    <p class="k" style="margin:4px 0 0">${sheet ? '印刷の画面で、用紙は「A4」、倍率は「100%」(実際のサイズ)、余白は「なし」を選択してください。' : '印刷の画面で、プリンターにラベルプリンターを選び、用紙サイズをラベルと同じにしてください(倍率100%・余白なし)。'}</p></div>`;
}
function bindLblPrint(p, L) {
  const val = id => $(id) ? $(id).value.trim() : '';
  document.querySelectorAll('[data-lm]').forEach(b => b.onclick = () => { const S = lsGet(); S.mode = b.dataset.lm; lsSet(S); renderLabel(); });
  if (!$('lb-packs')) return;
  if ($('lb-mode')) $('lb-mode').onclick = e => { e.preventDefault(); const S = lsGet(); S.mode = ''; lsSet(S); renderLabel(); };
  if ($('lb-stsel')) $('lb-stsel').onchange = () => { const v = $('lb-stsel').value; $('lb-st').style.display = v ? 'none' : ''; if (v) $('lb-st').value = v; else $('lb-st').focus(); };
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
    const d = val('lb-days'); if (d !== '' && !(/^\d{1,3}$/.test(d))) { $('lb-msg').textContent = '日数は数字で入力してください'; return; }
    const first = packs[0] || {};
    const nv = [...document.querySelectorAll('.lb-nv')].map(x => x.value.trim()), nutMan = nv.every(x => x !== '') ? { base: val('lb-nbase') || '100g', v: nv } : null;
    if (nv.some(x => x !== '') && !nutMan) { $('lb-msg').textContent = '栄養成分は5項目すべてを入力してください(表示しない場合は、すべて空欄にしてください)'; return; }
    setValueX({ field: 'lbl', product: p.name, value: { name: val('lb-name'), dtype: val('lb-dtype'), days: d, storage: val('lb-st'), content: first.content || '', jan: first.jan || '', packs, nut: $('lb-nut') ? $('lb-nut').checked : false, pla: $('lb-pla') ? $('lb-pla').checked : false, nutMan,
      origin: val('lb-origin'), makerKind: val('lb-mk'), fcode: val('lb-fcode'), factory: val('lb-factory'), caution: val('lb-caution'), opened: val('lb-opened'), contam: [...document.querySelectorAll('.lb-ct:checked')].map(x => x.value), free: val('lb-free') } });
  };
  const n0 = (id, d) => { const v = parseFloat(val(id)); return isFinite(v) ? v : d; };
  const keep = () => {
    const S = lsGet();
    if ($('lb-sheet')) S.sheet = val('lb-sheet'); if ($('lb-roll')) S.roll = val('lb-roll'); if ($('lb-rw')) { S.rw = n0('lb-rw', 62); S.rh = n0('lb-rh', 100); }
    if ($('lb-rot')) S.rot = val('lb-rot') === '1'; if ($('lb-lay')) S.lay = val('lb-lay');
    S.pt = +val('lb-pt') || 6; S.dx = n0('lb-dx', 0); S.dy = n0('lb-dy', 0); S.scale = Math.min(130, Math.max(70, n0('lb-scale', 100))); S.datePos = val('lb-dpos') || 'foot';
    if ($('lc-w')) S.custom = { w: n0('lc-w', 86.4), h: n0('lc-h', 42.3), cols: Math.max(1, Math.round(n0('lc-cols', 2))), rows: Math.max(1, Math.round(n0('lc-rows', 6))), top: n0('lc-top', 0), left: n0('lc-left', 0), gx: n0('lc-gx', 0), gy: n0('lc-gy', 0) };
    lsSet(S); return S;
  };
  if ($('lb-sheet')) $('lb-sheet').onchange = () => { const was = lsGet().sheet; const S = keep(); if ((was === 'custom') !== (S.sheet === 'custom')) { renderLabel(); return; } const sh = sheetOf(S); $('lb-n').value = sh[3] * sh[4]; };
  if ($('lb-roll')) $('lb-roll').onchange = () => { const was = lsGet().roll; const S = keep(); if ((was === 'custom') !== (S.roll === 'custom')) renderLabel(); };
  document.querySelectorAll('.lpc input, .lpc select').forEach(x => { if (!x.closest('#lb-packs') && !/^lb-(name|dtype|days|st|nut|day|n|skip|pack)$/.test(x.id)) x.addEventListener('change', keep); });
  const go = test => {
    if (!test && p.label.check.length && !confirmOnce('lbchk', `「${p.label.check.join('、')}」が要確認のままです。このまま印刷する場合は、もう一度押してください`)) return;
    const S = keep(), n = Math.min(Math.max(parseInt(val('lb-n')) || 0, 1), 500), skip = Math.max(parseInt(val('lb-skip')) || 0, 0);
    const pk = L.packs[+val('lb-pack') || 0];
    const L2 = Object.assign({}, L, { dtype: val('lb-dt2') || L.dtype, exp: val('lb-exp') });
    openLabelSheet(p, pk ? Object.assign({}, L2, { content: pk.content || L.content, jan: pk.jan, pack: pk.name }) : L2, S, test ? (S.mode === 'sheet' ? sheetOf(S)[3] * sheetOf(S)[4] : 1) : n, test ? 0 : skip, val('lb-day'), test);
  };
  $('lb-print').onclick = () => go(false); $('lb-test').onclick = () => go(true);
  if ($('lb-csv')) $('lb-csv').onclick = labelCsv;
}
// 全商品の表示をCSVに(ウラベル・ラベル屋・P-touch Editor などのラベルソフトに渡す。Excelで開けるようBOMつき)
function labelCsv() {
  const si = D.shopInfo || {}, goods = D.products.filter(p => p.kind !== 'part');
  const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const head = ['商品名', '名称', '原材料名', 'アレルゲン', '内容量', '期限の種類', '日数', '保存方法', '表示責任者', '表示者名', '住所', '電話番号', '固有記号', '製造所', '原料原産地', '使用上の注意', '開封後の取り扱い', '同一工場のアレルゲン', '自由記入', 'JAN', '栄養成分の表示単位', '熱量kcal', 'たんぱく質g', '脂質g', '炭水化物g', '食塩相当量g'];
  const rows = goods.map(p => {
    const L = lblOf(p), lb = p.label || { text: '', allergens: [], contains: '', check: [] };
    const nm = L.nutMan ? { base: L.nutMan.base === '1個' ? `1${U}` : '100g', v: L.nutMan.v } : (p.nutr && p.nutr.per ? { base: `1${U}`, v: p.nutr.per } : null);
    return [p.name, L.name, ingWithOrigin(lb.text, L.origin) + (lb.check.length ? '、' + lb.check.join('、') + '(要確認)' : '') + (lb.contains || ''), (lb.allergens || []).join('・'), L.content, L.dtype, L.days, L.storage, L.makerKind, si.name || D.shop, si.addr || '', si.tel || '', L.fcode, L.factory, L.origin, L.caution, L.opened, (L.contam || []).join('・'), L.free, L.jan, nm ? nm.base + '当たり' : '', ...(nm ? nm.v.map((x, i) => i === 0 ? Math.round(x) : Math.round(x * 10) / 10) : ['', '', '', '', ''])].map(q).join(',');
  });
  const csv = '\ufeff' + head.map(q).join(',') + '\r\n' + rows.join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `食品表示_${(si.name || D.shop || '').replace(/[\\/:*?"<>|]/g, '')}_${new Date().toISOString().slice(0, 10)}.csv`; document.body.appendChild(a); a.click(); a.remove();
  chat(`${goods.length}品の表示をCSVに書き出しました。ラベルソフトの「CSVの読み込み」から開けます`, 'heart');
}
let confirmKey = '';
function confirmOnce(k, msg) { if (confirmKey === k) { confirmKey = ''; return true; } confirmKey = k; chat(esc(msg), 'think'); setTimeout(() => { if (confirmKey === k) confirmKey = ''; }, 8000); return false; }

// JANコード(EAN-13)を線で描く。大きさは決まり(GS1)の最小の0.8倍(横29.83mm)より小さくしない
const JAN_W = 29.83, JAN_H = JAN_W * 79 / 113;
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
function openLabelSheet(p, L, S, n, skip, day, test) {
  const sheet = S.mode !== 'roll', si = D.shopInfo || {}, lb = p.label, k = (S.scale || 100) / 100;
  let date = '';
  if (L.exp && /^\d{4}-\d\d-\d\d$/.test(L.exp)) date = L.exp.replace(/-/g, '.');
  else if (L.days !== '' && /^\d{4}-\d\d-\d\d$/.test(day)) { const d = new Date(day + 'T00:00:00'); d.setDate(d.getDate() + Number(L.days)); date = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`; }
  const j = janCheck(L.jan), hasJan = j.ok && !!j.code, noJan = !!L.noJan && !L.janOnly;
  // 栄養: 手で入れた値があればそれ(100g当たり/1個当たり)、なければ計算した1個当たり
  const nm = L.nut ? (L.nutMan ? { v: L.nutMan.v.map(Number), base: L.nutMan.base === '1個' ? `1${U}当たり` : '100g当たり', est: true } : (p.nutr && p.nutr.per ? { v: p.nutr.per, base: `1${U}当たり`, est: true } : null)) : null;
  const saltOf = x => x > 0 && x < 0.1 ? (Math.round(x * 100) / 100).toFixed(2) : r1(x);
  const inside = S.datePos === 'inside' && date;
  const mk = esc(si.name || D.shop) + (si.rep ? `<span class="lrep">代表者 ${esc(si.rep)}</span>` : '') + (si.addr ? `<br>${esc(si.addr)}` : '') + (si.tel ? `<br>TEL ${esc(si.tel)}` : '');
  const rowsH = [['名称', esc(L.name)], ['原材料名', esc(ingWithOrigin(lb.text, L.origin) + (lb.check.length ? '、' + lb.check.join('、') : '') + (lb.contains || ''))], ['内容量', esc(L.content)], [esc(L.dtype), inside ? date : '枠外下部に記載'], ['保存方法', esc(L.storage)], [esc(L.makerKind || '製造者'), mk + (L.fcode ? ` ${esc(L.fcode)}` : '')]];
  if (L.factory) rowsH.push(['製造所', esc(L.factory)]);
  const notes = lblNotes(L);
  const nutBox = nm ? `<div class="lnut"><b>栄養成分表示</b><span>(${esc(nm.base)})</span><table><tr><td>熱量</td><td>${Math.round(nm.v[0])}kcal</td></tr><tr><td>たんぱく質</td><td>${r1(nm.v[1])}g</td></tr><tr><td>脂質</td><td>${r1(nm.v[2])}g</td></tr><tr><td>炭水化物</td><td>${r1(nm.v[3])}g</td></tr><tr><td>食塩相当量</td><td>${saltOf(nm.v[4])}g</td></tr></table><span>(推定値)</span></div>` : '';
  const pla = L.pla ? `<svg class="lpla" viewBox="0 0 40 40" aria-label="プラ"><path d="M8 14a12 12 0 0 1 20-6M32 26a12 12 0 0 1-20 6" fill="none" stroke="#000" stroke-width="2.6"/><path d="M27 4l2 5-5 1M13 36l-2-5 5-1" fill="none" stroke="#000" stroke-width="2.6"/><text x="20" y="25" font-size="12" font-weight="700" text-anchor="middle" font-family="sans-serif">プラ</text></svg>` : '';
  // ラベル1枚の大きさ(回すときは中身を横長にする)
  let w, h, sh;
  if (sheet) { sh = sheetOf(S); w = sh[1]; h = sh[2]; } else { [w, h] = rollOf(S); }
  const cw = S.rot ? h : w, chh = S.rot ? w : h;
  // 縦版(栄養・バーコードを下に)か横版(右に)か。おまかせは、刷る形が縦長なら縦版
  const stack = S.lay === 'stack' || ((S.lay || 'auto') === 'auto' && chh > cw * 1.1);
  const bcw = Math.min(37.29 * 0.8, cw * 0.4);
  const foot = S.datePos === 'foot' && date ? `${esc(L.dtype)} ${date}` : '';
  const janIn = hasJan && !noJan;
  const side = nutBox || pla || janIn ? `<div class="lside">${nutBox}<div class="lsrow">${pla}${janIn ? janSvg(j.code, JAN_W) : ''}</div></div>` : '';
  const janCell = `<div class="ljan">${hasJan ? janSvg(j.code, JAN_W) : ''}${chh >= JAN_H + 6 ? `<span>${esc(p.name)}${L.pack ? ' ' + esc(L.pack) : ''}</span>` : ''}</div>`;
  const cell = test ? `<div class="ltest"><span>${cw}×${chh}</span></div>` : L.janOnly ? janCell : `<div class="lbody"><table><tr class="lhrow"><th>品名</th><td><b>${esc(p.name)}</b></td></tr>${rowsH.map(([a, b]) => `<tr><th>${a}</th><td>${b}</td></tr>`).join('')}</table>${side}</div>
    ${notes.length ? `<div class="lnotes">${notes.map(esc).join(' ')}</div>` : ''}<div class="lfoot">${foot}</div>`;
  const box = (x, y) => {
    const st = `width:${cw}mm;height:${chh}mm;font-size:${S.pt}pt`;
    if (S.rot) return `<div class="lcell${test ? ' lt' : ''}${stack ? ' lport' : ''}" style="left:${x}mm;top:${y}mm;${st};transform-origin:0 0;transform:translate(${w}mm,0) rotate(90deg)">${cell}</div>`;
    return `<div class="lcell${test ? ' lt' : ''}${stack ? ' lport' : ''}" style="left:${x}mm;top:${y}mm;${st}">${cell}</div>`;
  };
  let pages = '', pageCount = 0, pageCss;
  if (sheet) {
    const [, , , cols, rows, top, left, gx, gy] = sh, per = cols * rows;
    const slots = []; for (let i = 0; i < skip % per; i++) slots.push(false); for (let i = 0; i < n; i++) slots.push(true);
    for (let pg = 0; pg < slots.length; pg += per) {
      pages += `<div class="lsheet"><div class="lscale" style="transform:translate(${S.dx}mm,${S.dy}mm) scale(${k})">` + slots.slice(pg, pg + per).map((on, i) => on ? box(left + (i % cols) * (w + gx), top + Math.floor(i / cols) * (h + gy)) : '').join('') + '</div></div>';
      pageCount++;
    }
    pageCss = '@page{size:A4 portrait;margin:0}';
  } else {
    for (let i = 0; i < n; i++) pages += `<div class="lsheet lroll" style="width:${w}mm;height:${h}mm"><div class="lscale" style="transform:translate(${S.dx}mm,${S.dy}mm) scale(${k})">${box(0, 0)}</div></div>`;
    pageCount = n; pageCss = `@page{size:${w}mm ${h}mm;margin:0}`;
  }
  const v = $('inv');
  const close0 = () => { v.hidden = true; v.classList.remove('lprint'); window.removeEventListener('resize', fit); };
  v.innerHTML = `<div class="bar3" style="margin-top:0"><button class="btn" type="button" id="inv-print">印刷する</button><button class="btn ghost" type="button" id="inv-close">閉じる</button></div>
    <p class="k lnote">${test ? '位置合わせ用の試し印刷(枠と中央の十字のみ)です。普通紙に印刷し、ラベルに重ねて位置をご確認ください。' : `${esc(p.name)}${L.pack ? ' ' + esc(L.pack) : ''}${L.janOnly ? ' のバーコード' : ''} ${n}枚`} · ${sheet ? esc(sh[0]) + `(${pageCount}ページ)。印刷の画面で、用紙は「A4」、倍率は「100%」、余白は「なし」を選択してください。` : `ラベル ${w}×${h}ミリ(${pageCount}枚)。印刷の画面で、ラベルプリンターと同じサイズの用紙を選択してください。`}<span id="lb-over"></span></p>
    <div class="lwrap" id="lwrap">${pages}</div>`;
  v.hidden = false; v.classList.add('lprint');
  let st = document.getElementById('lb-page'); if (!st) { st = document.createElement('style'); st.id = 'lb-page'; document.head.appendChild(st); }
  st.textContent = pageCss;
  const pw = sheet ? 210 : w;
  const fit = () => { const wr = $('lwrap'); if (!wr) return; const kk = Math.min(sheet ? 1 : 3, (wr.clientWidth || 360) / (pw * 96 / 25.4)); wr.style.setProperty('--k', kk); };
  fit(); window.addEventListener('resize', fit);
  const c0 = v.querySelector('.lcell'), over = c0 && (c0.scrollHeight > c0.clientHeight + 1 || c0.scrollWidth > c0.clientWidth + 1);
  // バーコードが入りきらないときは縮めずに外して、バーコードだけ別のシールに刷れるようにする
  if (!test && !L.janOnly && hasJan && !noJan && over) { close0(); return openLabelSheet(p, Object.assign({}, L, { noJan: true }), S, n, skip, day, test); }
  if (!test && L.janOnly) { if (cw < JAN_W + 3 || chh < JAN_H + 3) $('lb-over').innerHTML = `<br><mark>この用紙ではバーコードを規定のサイズで印刷できません。横${Math.ceil(JAN_W + 3)}×縦${Math.ceil(JAN_H + 3)}ミリ以上の用紙をお使いください。</mark>`; }
  else if (!test && over) $('lb-over').innerHTML = '<br><mark>文字がラベルからはみ出しています。文字を小さくするか、大きいサイズのラベルをお使いください。</mark>';
  if (!test && noJan && hasJan) $('lb-over').insertAdjacentHTML('beforeend', `<br><mark>このラベルのサイズでは、バーコードを規定のサイズ(横約30ミリ)で印刷できないため、バーコードを除いています。</mark> 大きいサイズのラベルを使うか、バーコードのみを別のラベルに印刷してください。<br><button class="btn ghost" type="button" id="lb-janonly">バーコードのみ印刷(${n}枚)</button>`);
  const close = () => { v.hidden = true; v.classList.remove('lprint'); st.textContent = ''; window.removeEventListener('resize', fit); };
  $('inv-print').onclick = () => window.print(); $('inv-close').onclick = close;
  const jb = $('lb-janonly'); if (jb) jb.onclick = () => { close(); openLabelSheet(p, Object.assign({}, L, { noJan: false, janOnly: true }), S, n, 0, day, false); };
}

// 栄養成分表示(日本食品標準成分表の計算による推定値)
const r1 = x => x < 0.05 ? '0' : (Math.round(x * 10) / 10).toFixed(1);
function nutrBox(p) {
  const n = p.nutr;
  if (!n) return '';
  if (!n.per) return `<div class="card" style="margin-top:16px"><p style="margin:0"><b>栄養成分表示</b></p><p class="k" style="margin:4px 0 0">1${U}の重さを入力すると、栄養成分(熱量・たんぱく質・脂質・炭水化物・食塩相当量)の案を表示します。「原価」の画面で入力するか、${VIA}「${esc(p.name)}は1個30g」と入力してください。</p></div>`;
  const v = n.per, salt = v[4] > 0 && v[4] < 0.1 ? (Math.round(v[4] * 100) / 100).toFixed(2) : r1(v[4]);
  return `<div style="margin-top:16px"><div class="label" id="nu-txt">
      <div class="r"><div class="h" style="grid-column:1/-1;border-right:0;font-weight:700">栄養成分表示 1${U}${n.weight ? `(${n.weight}g)` : ''}当たり</div></div>
      <div class="r"><div class="h">熱量</div><div class="v">${Math.round(v[0])}kcal</div></div>
      <div class="r"><div class="h">たんぱく質</div><div class="v">${r1(v[1])}g</div></div>
      <div class="r"><div class="h">脂質</div><div class="v">${r1(v[2])}g</div></div>
      <div class="r"><div class="h">炭水化物</div><div class="v">${r1(v[3])}g</div></div>
      <div class="r"><div class="h">食塩相当量</div><div class="v">${salt}g</div></div>
      <div class="r"><div class="v" style="grid-column:1/-1;font-size:12px">この表示値は、目安です。(日本食品標準成分表（八訂）増補2023年の計算による推定値)</div></div></div>
    <div class="ask"><button class="btn ghost" type="button" id="nu-copy">栄養成分をコピー</button></div>
    ${n.baked ? '' : `<div class="card" style="margin-top:8px"><p class="k" style="margin:0 0 8px">( )内は焼成前の生地の重さです。焼き上がり1${U}の重さを入力すると、表示用の重さに置き換わります(栄養成分の値は変わりません)</p><div class="ask" style="margin-top:0"><input id="bk-v" inputmode="decimal" placeholder="例 26"><span class="k">g</span><button class="btn ghost" type="button" id="bk-go">決定</button></div></div>`}
    ${n.missing.length ? `<p class="k" style="margin:8px 0 0"><mark>栄養成分が未登録の材料: ${n.missing.map(esc).join('、')}</mark> この分は少なめに表示されています。業務用の材料は、袋の栄養成分表示を${SHOT}撮影すると、その値が反映されます</p>` : ''}
    <p class="k" style="margin:8px 0 0">計算に使用したデータ: ${n.srcs.map(s => s === '袋の表示' ? '材料の袋の表示' : '日本食品標準成分表').join('・')}。材料ごとの値は「栄養の対応」シートで確認・修正できます</p></div>`;
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
  const row = m => `<tr data-m="${esc(m.name)}" style="cursor:pointer"><td><b>${esc(m.name)}</b>${upNames.has(m.name) ? ' <span class="up">↑</span>' : ''}${m.spec || m.supplier ? ` <span class="k">${esc([m.spec, m.supplier].filter(Boolean).join(' · '))}</span>` : ''}<br><span class="k">${esc(m.display)}${m.allergens.length ? ' · ' + m.allergens.map(esc).join('・') : ''}${m.attrs ? ' · ' + esc(m.attrs) : ''}</span>${m.fromKind ? ' <span class="pill warn">種類の標準値(仮)</span>' : ''}${m.yield && m.yield < 100 ? ` <span class="pill gray">歩留まり${m.yield}%</span>` : ''}${m.pieceG ? ` <span class="pill gray">1個${m.pieceG}g</span>` : ''}${m.avg ? ' <span class="pill gray">平均単価</span>' : ''}${stk[m.name] && stk[m.name].known ? `<br><span class="pill ${stk[m.name].low ? 'warn' : 'gray'}">残り ${amt(stk[m.name].left, stk[m.name].unit)}${stk[m.name].days != null ? ' · 約' + stk[m.name].days + '日' : ''}</span>` : ''}</td><td class="n">${noMoney() ? '' : m.ppg ? Math.round(m.ppg * 1000).toLocaleString() + '円/kg' : '-'}<br>${m.ok ? '<span class="pill">請求書</span>' : '<span class="pill warn">仮</span>'}</td></tr>`;
  const groups = {}; rows.forEach(m => (groups[m.kind || ''] = groups[m.kind || ''] || []).push(m));
  const gk = Object.keys(groups).sort((a, b) => (a === '') - (b === '') || a.localeCompare(b, 'ja'));
  $('mats').innerHTML = (gk.length > 1 || gk[0] ? gk.map(k => `<tr><td colspan="2" style="padding-top:12px"><b class="k">${k ? '種類: ' + esc(k) : '種類が未設定の材料'}</b>${k && groups[k].length > 1 ? ' <span class="k">(' + groups[k].length + '商品)</span>' : ''}</td></tr>` + groups[k].map(row).join('')).join('') : rows.map(row).join('')) || '<tr><td class="k">ありません</td></tr>';
  $('mats').querySelectorAll('tr[data-m]').forEach(tr => tr.onclick = () => matEdit(tr.dataset.m));
  matAddBtn();
  const all = D.materials.filter(m => !m.packaging), est = all.filter(m => !m.ok).length;
  const ms = Object.keys(D.months).sort(), lastM = ms[ms.length - 1];
  setTimeout(renderCount, 0);
  $('mat-sum').textContent = `材料 ${all.length}種類のうち、確認済み ${all.length - est}、仮 ${est}。` + (lastM ? `${lastM.replace('-', '年')}月の仕入れ ${yen(D.months[lastM].total)}。` : '');
}
// 材料の候補: 五十音順。別名(クリームチーズなど)や表示名でも絞り込めるように label に入れる
const matOpts = () => D.materials.slice().sort((a, b) => a.name.localeCompare(b.name, 'ja')).map(m => { const sub = [].concat(m.aliases || [], m.display && m.display !== m.name ? [m.display] : []).join('・').slice(0, 40); return `<option value="${esc(m.name)}"${sub ? ` label="${esc(sub)}"` : ''}>`; }).join('');
const matKnown = n => !n || D.materials.some(m => m.name === n || (m.aliases || []).includes(n));
const kindList = () => `<datalist id="kinds">${(D.kinds || []).map(k => `<option value="${esc(k)}">`).join('')}</datalist>`;
const inp = (id, v, ph, w) => `<input id="${id}" value="${esc(v || '')}" placeholder="${esc(ph)}" style="width:${w || '100%'};box-sizing:border-box;font:inherit;font-size:15px;padding:8px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink)">`;
function matBox(html) {
  let b = $('mat-edit'); if (!b) { b = document.createElement('div'); b.id = 'mat-edit'; b.className = 'card'; b.style.margin = '0 0 12px'; $('mats').closest('.card').before(b); }
  b.innerHTML = html; b.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function matBoxClose() { const b = $('mat-edit'); if (b) b.remove(); }
function matAddBtn() {
  if ($('mat-add-top')) return;
  let b = $('mat-add'); if (b) return;
  b = document.createElement('div'); b.id = 'mat-add'; b.style.margin = '10px 0';
  b.innerHTML = '<button class="btn" type="button">＋ 材料(商品)を追加</button> <span class="k">種類(例: マーガリン)の中に、ブランドや規格の異なる商品を追加できます</span>';
  b.querySelector('button').onclick = () => matEdit(null);
  $('mats').closest('.card').after(b);
}
// 規格から1袋のgを出す(25kg・500g・1L・500g×20 は 1つ500g)
function parseSpecG(spec) {
  const t = String(spec || '').replace(/[Ａ-Ｚａ-ｚ０-９．]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
  const m = t.match(/([\d.]+)\s*(kg|KG|Kg|キロ|g|グラム|L|l|ℓ|リットル|ml|mL|cc)/); if (!m) return 0;
  return Number(m[1]) * (/^(kg|KG|Kg|キロ|L|l|ℓ|リットル)$/.test(m[2]) ? 1000 : 1);
}
function matEdit(name, preset) {
  const m = name ? D.materials.find(x => x.name === name) : (preset || {});
  setCrumb([name || '材料を追加']);
  matBox(`<p style="margin:0 0 8px"><b>${name ? esc(name) : '材料(商品)を追加'}</b></p>${kindList()}
    <div style="display:grid;gap:8px">
    ${name ? '' : `<label>名前(袋に書いてある商品名)${inp('me-name', m.name, '商品名')}</label>`}
    <label>種類${inp('me-kind', m.kind, '例 マーガリン・強力粉・生クリーム')}</label>
    <label>規格${inp('me-spec', m.spec, '例 25kg・500g×20')}</label>
    <label>仕入先${inp('me-sup', m.supplier, '仕入先名')}</label>
    <label>中身${inp('me-attrs', m.attrs, '例 乳脂肪分47%・発酵・無塩・植物性')}</label>
    ${m.packaging ? '' : `<label>1個の重さ${inp('me-pg', m.pieceG || '', '例 200', '6em')} g<br><span class="k">1個・1玉・1尾・1杯・1本など、個数で使う場合の重さです。入力すると、レシピに個数で記載できます。</span>${m.pieceG && m.spec && parseSpecG(m.spec) ? `<br><span class="k">規格 ${esc(m.spec)} の場合、1袋から約${Math.floor(parseSpecG(m.spec) / m.pieceG)}個取れます。</span>` : ''}</label>`}
    ${m.packaging || !name ? '' : `<label style="display:flex;gap:8px;align-items:flex-start"><input type="checkbox" id="me-avg"${m.avg ? ' checked' : ''} style="margin-top:4px"><span>単価は直近3回の平均で計算する<br><span class="k">野菜・魚など、相場で価格が変わる材料向けです。請求書を撮影するたびに、直近3回(90日以内)の平均単価で原価を計算します。</span></span></label>`}
    ${m.packaging ? '' : `<label>歩留まり${inp('me-yield', m.yield && m.yield < 100 ? m.yield : '', '例 90', '6em')} %<br><span class="k">皮・骨・ヘタなどを除いた後に使える割合です。空欄の場合は100%とします。原価は使える分で計算します(レシピの分量は、下処理後の量で記載してください)。</span>${!noMoney() && m.ppg && m.yield && m.yield < 100 ? `<br><span class="k">可食部 1kgあたり ${Math.round(m.ppg * 100 / m.yield * 1000).toLocaleString()}円(購入価格 1kgあたり ${Math.round(m.ppg * 1000).toLocaleString()}円)</span>` : ''}</label>`}
    ${name ? `<label>別名を追加(レシピや請求書での表記)${inp('me-alias', '', '商品名')}</label>${m.aliases && m.aliases.length ? `<span class="k">登録済みの別名: ${m.aliases.map(esc).join('、')}</span>` : ''}` : `<label>単価(1kgあたり・分かる場合)${inp('me-ppkg', '', '例 600', '8em')}</label>`}
    </div><p class="k" style="margin:8px 0">原材料・アレルゲン・栄養成分は、袋の裏面表示を撮影すると実際の値に置き換わります。それまでは同じ種類の標準値を仮に使い、「要確認」と表示します。</p>
    <button class="btn" type="button" id="me-go">保存</button> <button class="btn ghost" type="button" id="me-x">やめる</button>`);
  $('me-x').onclick = matBoxClose;
  $('me-kind').setAttribute('list', 'kinds');
  $('me-go').onclick = () => {
    const v = { kind: $('me-kind').value, spec: $('me-spec').value, supplier: $('me-sup').value, attrs: $('me-attrs').value };
    if ($('me-avg')) v.avg = $('me-avg').checked;
    if ($('me-pg')) { const pg = $('me-pg').value.trim(); if (pg && !(+pg > 0)) { $('me-pg').focus(); chat('1個の重さはgの数値で入力してください'); return; } v.pieceG = pg ? +pg : 0; }
    if ($('me-yield')) { const y = $('me-yield').value.trim(); if (y && !(+y > 0 && +y <= 100)) { $('me-yield').focus(); chat('歩留まりは1〜100(%)の範囲で入力してください'); return; } v.yield = y ? +y : 100; }
    if (name) { const al = $('me-alias').value.trim(); if (al) v.alias = al; setValueX({ field: 'mat', name, value: v }); }
    else { const nm = $('me-name').value.trim(); if (!nm) { $('me-name').focus(); return; } v.ppkg = parseFloat($('me-ppkg').value) || ''; setValueX({ field: 'mat', name: nm, create: true, value: v }); }
    matBoxClose();
  };
}
function renderCount() {
  if (!D) return;
  let box = $('countbox');
  if (SH('stock')) { if (box) box.remove(); return; }
  if (!box) { box = document.createElement('div'); box.id = 'countbox'; $('mat-sum').after(box); }
  const names = D.materials.filter(m => !m.packaging).map(m => m.name);
  box.innerHTML = `<div class="card" style="margin-top:12px"><p style="margin:0 0 8px"><b>棚卸(数えた量を入力)</b> <span class="k">棚卸は${esc((D.stock || {}).cycle || '年1回')}</span></p>
    <div class="ask"><select id="cnt-m" style="font:inherit;font-size:15px;padding:8px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink);max-width:11em">${names.map(n => `<option>${esc(n)}</option>`).join('')}</select>
    <input id="cnt-v" inputmode="decimal" placeholder="例 2" style="width:70px"><select id="cnt-u" style="font:inherit;font-size:15px;padding:8px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink)"><option>kg</option><option>g</option><option>袋</option><option>缶</option></select>
    <button class="btn" type="button" id="cnt-go">記録する</button></div>
    <p class="k" style="margin:8px 0 0">差がありそうな材料だけで構いません。${VIA}「バイオレット 残り2袋」と入力しても記録できます</p></div>`;
  $('cnt-go').onclick = () => { const v = parseFloat($('cnt-v').value); if (!(v >= 0)) { $('cnt-v').focus(); return; } setValueX({ field: 'count', product: $('cnt-m').value, value: v, unit: $('cnt-u').value }); };
}
async function setValueX(extra) {
  const out = await api(Object.assign({ kind: 'app_set' }, extra));
  if (!out.ok) { toast(out.error || '記録できませんでした', 'ng'); return; }
  D = out.data; renderAll();
  if ((extra.field === 'ing' || extra.field === 'steps') && (D.undo || [])[0] && D.undo[0].product === extra.product) { const u0 = D.undo[0]; toast(out.msg || '修正しました', 'ok', ['元に戻す', () => setValueX({ field: 'undo', value: u0.row })]); return; }
  if (out.msg) { chat(out.msg); return; } toast(extra.field === 'check' ? '確認しました。' : extra.field === 'restoreprod' ? 'レシピを元に戻しました。' : extra.field === 'hyg' ? '記録しました。' : extra.field === 'deliv' ? '納品を記録しました。' : extra.field === 'shop' ? '店舗情報を保存しました。' : extra.field === 'lbl' ? 'ラベルの設定を保存しました。' : extra.field === 'paybank' ? `振込先を「${esc((payBank() || {}).name || '')}」に設定しました。` : ['biz', 'sell', 'unitword', 'serve', 'closed', 'wsprice', 'regalias'].includes(extra.field) ? '変更しました。' : extra.field === 'tax' ? '税率を保存しました。' : extra.field === 'target' || extra.field === 'ptarget' ? '目標原価率を保存しました。' : extra.field === 'aicap' ? 'AI利用料の上限を保存しました。' : extra.field === 'mat' ? (extra.value && extra.value.alias ? `「${esc(extra.value.alias)}」を「${esc(extra.name)}」の別名にしました。原価に反映しました。` : '材料を保存しました。') : extra.field === 'hygnotice' ? (extra.value === 'off' ? '衛生記録のお知らせを停止しました。' : `衛生記録のお知らせは${extra.value}時に送ります。`) : extra.field === 'sales' ? '売上を記録しました。' : extra.field === 'cycle' ? `棚卸は「${extra.value}」に設定しました。その前にLINEでお知らせします。` : '記録しました。在庫を再計算しました。', 'ok'); act('heart', 1.3);
}
// 小さな確認の窓(画面の手前)。閉じるボタン・外側・Escで閉じる
// ---------- 商品規格書(オプション・11/19) ----------
// 取引先(道の駅・スーパー・卸先)に求められる商品規格書を、食品表示のデータから作る。新しい入力は増やさない。
// Excel(.xlsx)はブラウザの中で組み立てる(外の部品は使わない)。版と改訂日は、中身が変わったときだけサーバーで1つ上げる
const specOn = () => !!(D && D.connOpts && D.connOpts.spec);
const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC_T[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
// 圧縮しないZIP(Excelはこれで開ける)
function zipStore(files) {
  const enc = new TextEncoder(), parts = [], cent = []; let off = 0;
  const u16 = v => [v & 255, (v >>> 8) & 255], u32 = v => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255];
  files.forEach(f => {
    const name = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, c = crc32(data);
    const head = new Uint8Array([...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(c), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0)]);
    parts.push(head, name, data);
    cent.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(c), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(off)]), name);
    off += head.length + name.length + data.length;
  });
  const cs = cent.reduce((a, x) => a + x.length, 0);
  const end = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cs), ...u32(off), ...u16(0)]);
  return new Blob([...parts, ...cent, end], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
const xe = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
const colL = n => { let s = ''; n++; while (n) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
// sheets: [{ name, cols:[幅], rows:[[{v,s,span}]], heights:{行:高さ} }]  s: 0ふつう 1題 2見出し 3中身 4区切り 5中央 6小さい注記 7下線だけ(右寄せ) 8見出し(中央)
function xlsxBlob(sheets) {
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="5"><font><sz val="10.5"/><name val="游ゴシック"/></font><font><b/><sz val="18"/><name val="游ゴシック"/></font><font><b/><sz val="10.5"/><name val="游ゴシック"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="游ゴシック"/></font><font><sz val="9"/><color rgb="FF555555"/><name val="游ゴシック"/></font></fonts>
<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEEF2F6"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1A5FA0"/></patternFill></fill></fills>
<borders count="3"><border/><border><left style="thin"><color rgb="FF8A94A6"/></left><right style="thin"><color rgb="FF8A94A6"/></right><top style="thin"><color rgb="FF8A94A6"/></top><bottom style="thin"><color rgb="FF8A94A6"/></bottom></border><border><bottom style="thin"><color rgb="FF333333"/></bottom></border></borders>
<cellStyleXfs count="1"><xf/></cellStyleXfs>
<cellXfs count="9"><xf/><xf fontId="1" applyFont="1"><alignment horizontal="center" vertical="center"/></xf><xf fontId="2" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center" wrapText="1"/></xf><xf borderId="1" applyBorder="1"><alignment vertical="center" wrapText="1"/></xf><xf fontId="3" fillId="3" applyFont="1" applyFill="1"><alignment vertical="center"/></xf><xf borderId="1" applyBorder="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf fontId="4" applyFont="1"><alignment vertical="center" wrapText="1"/></xf><xf borderId="2" applyBorder="1"><alignment horizontal="right" vertical="center"/></xf><xf fontId="2" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf></cellXfs><cellStyles count="1"><cellStyle name="標準" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
  const files = [
    { name: '[Content_Types].xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>` },
    { name: '_rels/.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
    { name: 'xl/workbook.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((sh, i) => `<sheet name="${xe(sh.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>` },
    { name: 'xl/_rels/workbook.xml.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
    { name: 'xl/styles.xml', data: styles }
  ];
  sheets.forEach((sh, si) => {
    const merges = [], rows = sh.rows.map((r, ri) => {
      let ci = 0; const cells = [];
      r.forEach(c => { if (c == null) { ci++; return; } const ref = colL(ci) + (ri + 1), span = c.span || 1;
        cells.push(c.v === '' || c.v == null ? `<c r="${ref}" s="${c.s || 0}"/>` : typeof c.v === 'number' ? `<c r="${ref}" s="${c.s || 0}"><v>${c.v}</v></c>` : `<c r="${ref}" s="${c.s || 0}" t="inlineStr"><is><t xml:space="preserve">${xe(c.v)}</t></is></c>`);
        for (let k = 1; k < span; k++) cells.push(`<c r="${colL(ci + k)}${ri + 1}" s="${c.s || 0}"/>`);
        if (span > 1) merges.push(`${ref}:${colL(ci + span - 1)}${ri + 1}`); ci += span; });
      const h = (sh.heights || {})[ri]; return `<row r="${ri + 1}"${h ? ` ht="${h}" customHeight="1"` : ''}>${cells.join('')}</row>`;
    });
    files.push({ name: `xl/worksheets/sheet${si + 1}.xml`, data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews><cols>${sh.cols.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols><sheetData>${rows.join('')}</sheetData>${merges.length ? `<mergeCells count="${merges.length}">${merges.map(m => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>` : ''}<printOptions horizontalCentered="1"/><pageMargins left="0.5" right="0.5" top="0.5" bottom="0.5" header="0.3" footer="0.3"/><pageSetup paperSize="9" orientation="portrait" fitToWidth="1" fitToHeight="1"/></worksheet>` });
  });
  return zipStore(files);
}
// 1商品ぶんの中身(画面にも、Excelにも使う)
function specOf(p) {
  const L = lblOf(p), lb = p.label || {}, si = D.shopInfo || {}, t = String(lb.text || ''), cut = t.indexOf('/');
  const ing = ingWithOrigin(cut >= 0 ? t.slice(0, cut) : t, L.origin), add = cut >= 0 ? t.slice(cut + 1) : '';
  const must = ((D.allergenRules || {})['義務']) || ['卵', '乳', '小麦', 'えび', 'かに', 'くるみ', 'そば', '落花生', 'カシューナッツ'];
  const has = new Set(lb.allergens || []);
  const nm = L.nutMan ? { base: L.nutMan.base === '1個' ? `1${U}` : (L.nutMan.base || '100g'), v: L.nutMan.v.map(Number) } : (p.nutr && p.nutr.per ? { base: `1${U}${p.nutr.weight ? `(${p.nutr.weight}g)` : ''}`, v: p.nutr.per } : null);
  const packs = L.packs && L.packs.length ? L.packs : [{ name: '', content: L.content, jan: L.jan }];
  return { name: p.name, kind: L.name, packs, dtype: L.dtype, days: L.days, storage: L.storage, ing, add, origin: L.origin, must: ALLG_ALL.filter(a => must.includes(a)).concat(must.filter(a => !ALLG_ALL.includes(a))).map(a => [a, has.has(a)]), rec: ALLG_ALL.filter(a => !must.includes(a)).map(a => [a, has.has(a)]), contam: L.contam || [],
    nut: nm, nutEst: !L.nutMan, maker: { kind: L.makerKind, name: si.name || D.shop, addr: si.addr || '', tel: si.tel || '', fax: si.fax || '', factory: L.factory, fcode: L.fcode }, caution: L.caution, opened: L.opened, check: (lb.check || []).length };
}
const specSig = S => { const s = JSON.stringify(S); let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36) + s.length.toString(36); };
// 12列の方眼で組む(項目名3列・中身9列。アレルゲンは「名前2列+印1列」を4組)。A4縦1枚に収める
function specSheet(S, ver) {
  const R = [], H = {}, row = (...c) => { R.push(c); H[R.length - 1] = H[R.length - 1] || 21; return R.length - 1; };
  const gap = () => { const i = row(); H[i] = 9; };
  const kv = (k, v, lines) => { const i = row({ v: k, s: 2, span: 3 }, { v, s: 3, span: 9 }); if (lines > 1) H[i] = 6 + lines * 15; };
  const sec = t => { const i = row({ v: t, s: 4, span: 12 }); H[i] = 22; };
  const r1n = x => Math.round(x * 10) / 10;
  const jd = x => x ? x.replace(/^(\d+)-0?(\d+)-0?(\d+)$/, '$1年$2月$3日') : '';
  const lines = (t, w) => Math.max(1, Math.ceil(String(t || '').length / w));
  H[row({ v: '商　品　規　格　書', s: 1, span: 12 })] = 34;
  gap();
  row({ v: '提出先', s: 2, span: 2 }, { v: '御中', s: 7, span: 4 }, null, { v: '作成日', s: 2, span: 2 }, { v: jd(ver.first), s: 5, span: 3 });
  row({ v: '提出日', s: 2, span: 2 }, { v: '年　　月　　日', s: 7, span: 4 }, null, { v: '改訂日', s: 2, span: 2 }, { v: jd(ver.at), s: 5, span: 3 });
  row(null, null, null, null, null, null, null, { v: '版', s: 2, span: 2 }, { v: `第${ver.v || 1}版`, s: 5, span: 3 });
  gap();
  sec('１．基本情報');
  kv('商品名', S.name); kv('名称', S.kind);
  const pk = S.packs.map(k => `${k.name ? k.name + '：' : ''}${k.content || ''}${k.jan ? '　JAN ' + k.jan : ''}`);
  kv('内容量・JANコード', pk.join('\n'), pk.length);
  kv(S.dtype || '期限', S.days === '' || S.days == null ? '' : `製造日から${S.days}日`); kv('保存方法', S.storage, lines(S.storage, 42));
  gap();
  sec('２．原材料');
  kv('原材料名', S.ing, lines(S.ing, 42)); kv('添加物', S.add || 'なし', lines(S.add, 42)); kv('原料原産地', S.origin || '');
  gap();
  sec('３．アレルゲン（●＝含む）');
  const grid = (title, list) => { row({ v: title, s: 8, span: 12 }); for (let i = 0; i < list.length; i += 4) { const c = []; list.slice(i, i + 4).forEach(([a, on]) => c.push({ v: a, s: 3, span: 2 }, { v: on ? '●' : '', s: 5 })); while (c.length < 8) c.push({ v: '', s: 3, span: 2 }, { v: '', s: 5 }); row(...c); } };
  grid('特定原材料（表示義務）', S.must); grid('特定原材料に準ずるもの（表示推奨）', S.rec);
  kv('同じ工場で扱うアレルゲン', S.contam.length ? S.contam.join('・') : 'なし');
  gap();
  sec('４．栄養成分表示');
  if (S.nut) { const v = S.nut.v;
    row({ v: '', s: 8, span: 2 }, ...['熱量', 'たんぱく質', '脂質', '炭水化物', '食塩相当量'].map(x => ({ v: x, s: 8, span: 2 })));
    row({ v: S.nut.base + '当たり', s: 2, span: 2 }, ...[Math.round(v[0]) + 'kcal', r1n(v[1]) + 'g', r1n(v[2]) + 'g', r1n(v[3]) + 'g', (v[4] > 0 && v[4] < 0.1 ? Math.round(v[4] * 100) / 100 : r1n(v[4])) + 'g'].map(x => ({ v: x, s: 5, span: 2 })));
    if (S.nutEst) row({ v: 'この表示値は、目安です。（日本食品標準成分表の計算による推定値）', s: 6, span: 12 }); }
  else kv('栄養成分', '（未設定）');
  gap();
  sec('５．製造者等');
  kv(S.maker.kind || '製造者', S.maker.name); kv('所在地', S.maker.addr); kv('電話・FAX', `${S.maker.tel ? 'TEL ' + S.maker.tel : ''}${S.maker.fax ? '　FAX ' + S.maker.fax : ''}`);
  if (S.maker.factory || S.maker.fcode) kv('製造所・固有記号', `${S.maker.factory || ''}${S.maker.fcode ? '　' + S.maker.fcode : ''}`);
  if (S.caution || S.opened) { gap(); sec('６．注意事項'); if (S.caution) kv('使用上の注意', S.caution, lines(S.caution, 42)); if (S.opened) kv('開封後の取り扱い', S.opened, lines(S.opened, 42)); }
  gap();
  H[row({ v: '本書は、ピタット原価の食品表示データから作成しています。内容の最終確認は、製造者が行ってください。', s: 6, span: 12 })] = 20;
  return { name: S.name.replace(/[\[\]:*?\/\\]/g, '').slice(0, 31) || '商品', cols: Array(12).fill(7.6), rows: R, heights: H };
}
async function specExport(products) {
  const list = products.filter(p => p.kind !== 'part'); if (!list.length) { toast('商品がありません'); return; }
  const specs = list.map(specOf), r = await api({ kind: 'app_spec', items: specs.map(S => ({ name: S.name, sig: specSig(S) })) }).catch(() => ({ ok: false, error: '通信できませんでした' }));
  if (!r.ok) { toast(r.error || '作れませんでした'); return; }
  const used = new Set(), sheets = specs.map(S => { const sh = specSheet(S, r.vers[S.name] || {}); let n = sh.name, k = 2; while (used.has(n)) n = sh.name.slice(0, 28) + '(' + k++ + ')'; used.add(n); sh.name = n; return sh; });
  const shop = ((D.shopInfo || {}).name || D.shop || '').replace(/[\\/:*?"<>|]/g, ''), d = new Date(), ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const name = list.length === 1 ? `商品規格書_${list[0].name.replace(/[\\/:*?"<>|]/g, '')}_${ymd}.xlsx` : `商品規格書_${shop}_${list.length}商品_${ymd}.xlsx`;
  const a = document.createElement('a'); a.href = URL.createObjectURL(xlsxBlob(sheets)); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  const warn = specs.filter(S => S.check).length;
  toast(`商品規格書(Excel)を書き出しました${warn ? `。${warn}商品に確認が残っています` : ''}`, 'ok');
}
// ---------- 発注書(オプション・11/19) ----------
// 小さなお店は、仕事終わりに作る人が自分でFAXで発注する。仕入先を選ぶ → いつもの品に数を入れる(前回と同じ も1回で)→ FAXに向く白黒のA4
const orderOn = () => !!(D && D.connOpts && D.connOpts.order && D.order);
const jpDay = t => { const d = new Date(t); return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`; };
// 設定の「オプション」: このお店で使っているオプションと、使っていないもの(申し込み方)を並べる
function optBox() {
  const c = D.connOpts || {}, L = [['order', '発注書(FAXで送る)', '仕入先ごとの発注書を作成し、印刷・PDFにしてFAXで送信できます。取引のある品目と前回の数量がすぐに入力されます', true], ['spec', '商品規格書の書き出し', '取引先に提出する商品規格書(Excel)を、食品表示のデータから作成します。食品表示の画面から出力できます', true]];
  return L.filter(x => x[3] || c[x[0]]).map(([k, n, w]) => `<div class="opt-row"><div><b>${n}</b> ${c[k] ? '<span class="pill">お使いいただけます</span>' : '<span class="pill gray">お申し込み後にご利用いただけます</span>'}<div class="k">${w}</div></div>${c[k] ? (k === 'order' ? '<button class="btn" type="button" data-optgo="order">発注書を作成</button>' : '') : '<button class="btn ghost" type="button" data-optask="' + k + '">申し込む</button>'}</div>`).join('') + '<p class="k" style="margin:8px 0 0">オプションのお申し込み・解約は、「申し込む」または「相談」からご連絡ください。</p>';
}
// ---------- 出店(催事・キッチンカー) 第1段の標準部分(11/23) ----------
// 出店先と日程の登録、持ち込み数・販売数・出店料の記録、許可証・保険の有効期限の管理。
// もうけの見込みは出さない。表示するのは、そのお店が入力した実績だけ
let evF = 'all';
const evOn = () => !!(D && D.shutten);
const evDay = s => s ? `${+s.slice(5, 7)}月${+s.slice(8, 10)}日(${'日月火水木金土'[new Date(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)).getDay()]})` : '';
const evSpan = e => e.to && e.to !== e.from ? `${evDay(e.from)}〜${e.to.slice(0, 7) === e.from.slice(0, 7) ? +e.to.slice(8, 10) + '日' : evDay(e.to)}` : evDay(e.from);
const evYmd = s => s ? `${+s.slice(0, 4)}年${+s.slice(5, 7)}月${+s.slice(8, 10)}日` : '';
const evDocBadge = d => d.warn === 'out' ? `<span class="pill warn">期限切れ(${evYmd(d.exp)})</span>` : d.warn === 'soon' ? `<span class="pill warn">${d.days === 0 ? '本日まで' : `残り${d.days}日`}</span>` : d.exp ? `<span class="pill">${evYmd(d.exp)}まで</span>` : '<span class="pill">期限なし</span>';
function evWarns() { return evOn() ? D.shutten.docs.filter(d => d.warn) : []; }
function renderEv() {
  const box = $('ev-box'); if (!box) return;
  if ($('ev-add-top')) { $('ev-add-top').hidden = !evOn(); $('ev-add-top').onclick = () => openEv(null); }
  if (!evOn()) {
    box.innerHTML = emptyBox('ev', '出店の記録はありません', '設定の「利用する業務」で「催事・キッチンカーへの出店」を選ぶと、この画面を使えます。');
    return;
  }
  const S = D.shutten, td = todayS(), hm = !!S.hidden || noMoney();
  const list = S.list.filter(e => evF === 'all' || e.kind === evF);
  const next = list.filter(e => e.to >= td).sort((a, b) => a.from.localeCompare(b.from));
  const past = list.filter(e => e.to < td);
  const mo = td.slice(0, 7), mine = S.list.filter(e => e.from.slice(0, 7) === mo && e.from <= td);
  const sum = k => mine.reduce((a, e) => a + (e.calc[k] || 0), 0);
  const warn = evWarns();
  const row = e => `<button class="ev-row" type="button" data-ev="${esc(e.id)}"><span class="ev-d"><b>${evSpan(e)}</b><span class="pill">${esc(e.kind)}</span></span><span class="ev-n"><b>${esc(e.name)}</b><span class="k">${esc([e.place, e.host].filter(Boolean).join('・'))}</span></span><span class="ev-v">${e.calc.bring ? `<span class="k">販売 ${e.calc.sold} / 持ち込み ${e.calc.bring}</span>` : '<span class="k">数量は未記録</span>'}${!hm && e.calc.net != null ? `<b>${yen(e.calc.net)}</b>` : ''}</span></button>`;
  box.innerHTML = `${warn.length ? `<div class="card ev-warn"><b>有効期限が近い書類があります</b>${warn.map(d => `<button class="ev-row" type="button" data-evd="${esc(d.id)}"><span class="ev-n"><b>${esc(d.name)}</b><span class="k">${esc(d.kind)}${d.no ? '・' + esc(d.no) : ''}</span></span>${evDocBadge(d)}</button>`).join('')}</div>` : ''}
    ${hm ? '' : `<div class="card">${tiles([{ t: `${+mo.slice(5)}月の出店`, v: `${mine.length}<small>回</small>`, c: 'ev' }, { t: '売上(税込)', v: yen(sum('sales')), c: 'ev', k: '入力した実績の合計' }, { t: '出店料・歩合', v: yen(sum('feeAmt')), c: 'ev' }, { t: '差し引き', v: yen(sum('net')), c: 'ev', k: '売上から出店料・歩合を引いた額' }])}</div>`}
    <div class="chips" id="ev-chips" style="margin-top:16px">${[['all', 'すべて'], ...S.kinds.map(k => [k, k])].map(([k, l]) => `<button type="button" class="chip" data-evf="${esc(k)}" aria-pressed="${evF === k}">${l}</button>`).join('')}</div>
    <h1 class="sub">これからの出店</h1>
    <div class="card">${next.length ? next.map(row).join('') : '<p class="k" style="margin:0">登録されている出店はありません。「＋ 出店を登録」から追加してください。</p>'}</div>
    <h1 class="sub">過去の出店</h1>
    <div class="card">${past.length ? past.slice(0, 30).map(row).join('') + (past.length > 30 ? `<p class="k" style="margin:8px 0 0">ほか${past.length - 30}件</p>` : '') : '<p class="k" style="margin:0">記録はまだありません。</p>'}</div>
    <div class="ev-h"><div><h1 class="sub">許可証・保険などの書類</h1><p class="k">有効期限の${S.warnDays}日前・7日前・前日・当日に、朝のお知らせでお伝えします。</p></div><button class="btn ghost sm" type="button" id="ev-doc-add">＋ 書類を登録</button></div>
    <div class="card">${S.docs.length ? S.docs.map(d => `<button class="ev-row" type="button" data-evd="${esc(d.id)}"><span class="ev-n"><b>${esc(d.name)}</b><span class="k">${esc(d.kind)}${d.no ? '・番号 ' + esc(d.no) : ''}${d.img ? '・写真あり' : ''}</span></span>${evDocBadge(d)}</button>`).join('') : '<p class="k" style="margin:0">営業許可証・食品衛生責任者・PL保険・自動車検査証などを登録すると、有効期限をお知らせします。</p>'}</div>`;
  box.querySelectorAll('[data-ev]').forEach(b => b.onclick = () => openEv(b.dataset.ev));
  box.querySelectorAll('[data-evd]').forEach(b => b.onclick = () => openEvDoc(b.dataset.evd));
  box.querySelectorAll('[data-evf]').forEach(b => b.onclick = () => { evF = b.dataset.evf; renderEv(); });
  $('ev-doc-add').onclick = () => openEvDoc(null);
}
function openEv(id) {
  const S = D.shutten || { list: [], kinds: ['催事', 'キッチンカー'], places: [] }, hm = !!S.hidden || noMoney();
  const E = S.list.find(e => e.id === id) || { id: '', kind: S.kinds[0], name: '', from: todayS(), to: '', place: '', host: '', fee: 0, rate: 0, settle: 'self', items: [], sales: 0, paid: 0, memo: '' };
  const prodPrice = n => { const p = (D.products || []).find(x => x.name === n); return p && p.price ? p.price : ''; };
  const irow = x => `<div class="ev-it"><input class="ev-in" list="ev-pl" aria-label="商品名" placeholder="商品名" value="${esc(x.name || '')}"><input class="ev-ib" inputmode="numeric" aria-label="持ち込み数" placeholder="持ち込み" value="${x.bring || ''}"><input class="ev-is" inputmode="numeric" aria-label="販売数" placeholder="販売" value="${x.sold || ''}"><input class="ev-il" inputmode="numeric" aria-label="廃棄・試食" placeholder="廃棄等" value="${x.loss || ''}"><span class="ev-ir k"></span>${hm ? '' : `<input class="ev-ip" inputmode="numeric" aria-label="単価(税込)" placeholder="単価" value="${x.price || ''}">`}</div>`;
  const prevSame = S.list.filter(e => e.id !== E.id && e.items.length).sort((a, b) => b.from.localeCompare(a.from));
  openSheet(`<h2 style="margin:0 0 4px">${E.id ? '出店の記録' : '出店を登録'}</h2><p class="k" style="margin:0 0 10px">出店の前に予定を登録し、終わったら数量と売上を記録してください。</p>
    <div class="fld"><span class="k">種類</span><div class="seg" id="ev-kind">${S.kinds.map(k => `<button type="button" data-v="${esc(k)}" aria-pressed="${E.kind === k}">${esc(k)}</button>`).join('')}</div>
    <span class="k">出店先</span><input id="ev-name" list="ev-nl" maxlength="60" placeholder="例 〇〇百貨店 北海道物産展、〇〇公園 週末マルシェ" value="${esc(E.name)}"><datalist id="ev-nl">${S.places.map(p => `<option value="${esc(p)}">`).join('')}</datalist>
    <span class="k">出店日</span><span style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><input id="ev-from" type="date" style="width:auto" value="${esc(E.from)}"><span class="k">〜</span><input id="ev-to" type="date" style="width:auto" value="${esc(E.to && E.to !== E.from ? E.to : '')}"><span class="k">1日のみの場合、終了日は空欄</span></span>
    <span class="k">会場・場所</span><input id="ev-place" maxlength="80" placeholder="例 本館7階 催事場" value="${esc(E.place)}">
    <span class="k">主催・担当</span><input id="ev-host" maxlength="60" placeholder="例 〇〇百貨店 催事担当、〇〇市 商工観光課" value="${esc(E.host)}">
    ${hm ? '' : `<span class="k">出店料・歩合</span><span style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><input id="ev-fee" inputmode="numeric" style="width:7em" placeholder="0" value="${E.fee || ''}"><span class="k">円 ＋ 売上の</span><input id="ev-rate" inputmode="decimal" style="width:4.5em" placeholder="0" value="${E.rate || ''}"><span class="k">%</span></span>
    <span class="k">売上の受け取り方</span><div class="seg" id="ev-settle"><button type="button" data-v="self" aria-pressed="${E.settle !== 'host'}">自店で受け取る</button><button type="button" data-v="host" aria-pressed="${E.settle === 'host'}">主催者・施設が精算</button></div>`}</div>
    <h3 style="margin:16px 0 4px;font-size:15px">商品ごとの数量${hm ? '' : '・単価'}</h3><p class="k" style="margin:0 0 6px">残りは「持ち込み − 販売 − 廃棄等」で自動計算します。${hm ? '' : '単価は売価(税込)を初期値として入れています。'}</p>
    <div class="ev-it ev-ih k"><span>商品名</span><span>持ち込み</span><span>販売</span><span>廃棄等</span><span>残り</span>${hm ? '' : '<span>単価</span>'}</div>
    <div id="ev-items">${(E.items.length ? E.items : [{}, {}, {}]).map(irow).join('')}</div><datalist id="ev-pl">${(D.products || []).map(p => `<option value="${esc(p.name)}">`).join('')}</datalist>
    <div class="ask" style="margin-top:6px"><button class="btn ghost sm" type="button" id="ev-row-add">＋ 行を追加</button>${prevSame.length ? '<button class="btn ghost sm" type="button" id="ev-prev">前回と同じ商品を入れる</button>' : ''}</div>
    ${hm ? '' : `<div class="fld" style="margin-top:8px"><span class="k">売上(税込)</span><span style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><input id="ev-sales" inputmode="numeric" style="width:11em" placeholder="自動計算" value="${E.sales || ''}"><span class="k">円(空欄の場合は単価×販売数。レジの集計額があれば入力してください)</span></span>
    <span class="k" id="ev-paid-l"${E.settle === 'host' ? '' : ' hidden'}>精算で受け取った額</span><span id="ev-paid-w" style="display:${E.settle === 'host' ? 'flex' : 'none'};gap:8px;align-items:center;flex-wrap:wrap"><input id="ev-paid" inputmode="numeric" style="width:9em" placeholder="精算書の振込額" value="${E.paid || ''}"><span class="k">円</span></span></div>
    <div class="ev-sum" id="ev-sum"></div>`}
    <div class="fld"><span class="k">メモ</span><textarea id="ev-memo" rows="2" maxlength="500" placeholder="例 雨で午後は客足が少なかった。釣銭は千円札を多めに" style="width:100%;font:inherit;font-size:15px;padding:8px 12px;border:1.5px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink)">${esc(E.memo)}</textarea></div>
    <div class="ask"><button class="btn" type="button" id="ev-save">保存する</button>${E.id ? '<button class="btn ghost" type="button" id="ev-del">削除</button>' : ''}</div>`);
  const seg = id => { const el = $(id); if (!el) return; el.querySelectorAll('button').forEach(b => b.onclick = () => { el.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); if (id === 'ev-settle') { const h = b.dataset.v === 'host'; $('ev-paid-l').hidden = !h; $('ev-paid-w').style.display = h ? 'flex' : 'none'; } }); };
  seg('ev-kind'); seg('ev-settle');
  const segV = id => { const b = $(id) && $(id).querySelector('[aria-pressed="true"]'); return b ? b.dataset.v : ''; };
  const num = v => { const n = Number(String(v || '').replace(/[,，円%\s]/g, '')); return n > 0 ? n : 0; };
  const read = () => [...document.querySelectorAll('#ev-items .ev-it')].map(r => ({ name: r.querySelector('.ev-in').value.trim(), bring: num(r.querySelector('.ev-ib').value), sold: num(r.querySelector('.ev-is').value), loss: num(r.querySelector('.ev-il').value), price: r.querySelector('.ev-ip') ? num(r.querySelector('.ev-ip').value) : 0 })).filter(x => x.name);
  const recalc = () => {
    document.querySelectorAll('#ev-items .ev-it').forEach(r => { const b = num(r.querySelector('.ev-ib').value), s = num(r.querySelector('.ev-is').value), l = num(r.querySelector('.ev-il').value); r.querySelector('.ev-ir').textContent = b ? String(Math.max(0, b - s - l)) : ''; });
    if (hm || !$('ev-sum')) return;
    const it = read(), by = it.reduce((a, x) => a + x.sold * x.price, 0), sales = num($('ev-sales').value) || by, fee = num($('ev-fee').value) + Math.round(sales * num($('ev-rate').value) / 100);
    $('ev-sales').placeholder = by ? `自動 ${by.toLocaleString('ja-JP')}` : '自動計算';
    $('ev-sum').innerHTML = sales || fee ? `<span>売上 <b>${yen(sales)}</b></span><span>出店料・歩合 <b>${yen(fee)}</b></span><span>差し引き <b>${yen(sales - fee)}</b></span>` : '';
  };
  const bindRows = () => document.querySelectorAll('#ev-items .ev-it').forEach(r => {
    r.querySelectorAll('input').forEach(i => i.oninput = recalc);
    const n = r.querySelector('.ev-in'), p = r.querySelector('.ev-ip');
    n.onchange = () => { if (p && !p.value) { const v = prodPrice(n.value.trim()); if (v) { p.value = v; recalc(); } } };
  });
  bindRows(); recalc();
  ['ev-sales', 'ev-fee', 'ev-rate'].forEach(k => { if ($(k)) $(k).oninput = recalc; });
  $('ev-row-add').onclick = () => { $('ev-items').insertAdjacentHTML('beforeend', irow({})); bindRows(); };
  if ($('ev-prev')) $('ev-prev').onclick = () => {
    const nm = $('ev-name').value.trim(), src = prevSame.find(e => e.name === nm) || prevSame[0];
    $('ev-items').innerHTML = src.items.map(x => irow({ name: x.name, price: hm ? 0 : x.price || prodPrice(x.name) })).join(''); bindRows(); recalc();
    toast(`${src.name}(${evDay(src.from)})と同じ商品を入れました。数量を入力してください`, 'ok');
  };
  $('ev-save').onclick = async () => {
    const v = { id: E.id, kind: segV('ev-kind'), name: $('ev-name').value.trim(), from: $('ev-from').value, to: $('ev-to').value, place: $('ev-place').value.trim(), host: $('ev-host').value.trim(), items: read(), memo: $('ev-memo').value };
    if (!hm) Object.assign(v, { fee: num($('ev-fee').value), rate: num($('ev-rate').value), settle: segV('ev-settle') || 'self', sales: num($('ev-sales').value), paid: $('ev-paid') ? num($('ev-paid').value) : 0 });
    if (!v.name) { toast('出店先を入力してください'); $('ev-name').focus(); return; }
    if (!v.from) { toast('出店日を入力してください'); $('ev-from').focus(); return; }
    const go = $('ev-save'); go.disabled = true;
    const r = await api({ kind: 'app_set', field: 'ev', value: v }).catch(() => ({ ok: false, error: '通信できませんでした' }));
    go.disabled = false;
    if (!r.ok) { toast(r.error || '保存できませんでした'); return; }
    D = r.data; renderAll(); closeSheet(); toast(E.id ? '出店の記録を更新しました' : '出店を登録しました', 'ok');
  };
  if ($('ev-del')) $('ev-del').onclick = () => {
    const b = $('ev-del'); if (b.dataset.sure) return;
    b.dataset.sure = 1; b.textContent = '削除する(元に戻せません)'; b.style.cssText = 'background:var(--warn);border-color:var(--warn);color:#fff';
    b.onclick = async () => {
      const r = await api({ kind: 'app_set', field: 'ev', value: { id: E.id, del: true } }).catch(() => ({ ok: false, error: '通信できませんでした' }));
      if (!r.ok) { toast(r.error || '削除できませんでした'); return; }
      D = r.data; renderAll(); closeSheet(); toast('出店の記録を削除しました', 'ok');
    };
  };
}
function openEvDoc(id) {
  const S = D.shutten || { docs: [], docKinds: ['営業許可証', 'その他'] };
  const X = S.docs.find(d => d.id === id) || { id: '', kind: S.docKinds[0], name: '', no: '', exp: '', img: '', memo: '' };
  openSheet(`<h2 style="margin:0 0 4px">${X.id ? '書類の内容' : '書類を登録'}</h2><p class="k" style="margin:0 0 10px">応募のたびに提出を求められる許可証や保険を、写真と有効期限で管理します。</p>
    <div class="fld"><span class="k">種類</span><select id="ed-kind">${S.docKinds.map(k => `<option${k === X.kind ? ' selected' : ''}>${esc(k)}</option>`).join('')}</select>
    <span class="k">名称</span><input id="ed-name" maxlength="60" placeholder="例 飲食店営業許可(キッチンカー)、生産物賠償責任保険" value="${esc(X.name)}">
    <span class="k">番号</span><input id="ed-no" maxlength="40" placeholder="例 許可番号・証券番号・登録番号" value="${esc(X.no)}">
    <span class="k">有効期限</span><input id="ed-exp" type="date" style="width:auto" value="${esc(X.exp)}">
    <span class="k">備考</span><input id="ed-memo" maxlength="300" placeholder="例 千葉市保健所・更新は2か月前から" value="${esc(X.memo)}"></div>
    <div class="ed-img" id="ed-img">${X.img ? '<span class="k">写真を読み込んでいます…</span>' : '<span class="k">写真は保存後に追加できます</span>'}</div>
    <div class="ask"><button class="btn" type="button" id="ed-save">保存する</button>${X.id ? `<button class="btn ghost" type="button" id="ed-pic">${X.img ? '写真を差し替え' : '写真を追加'}</button><button class="btn ghost" type="button" id="ed-del">削除</button>` : ''}</div>`);
  if (X.img) api({ kind: 'app_img_get', id: X.img }).then(r => { const b = $('ed-img'); if (!b) return; b.innerHTML = r.ok ? `<img alt="${esc(X.name)}の写真" src="data:${r.type};base64,${r.data}">` : '<span class="k">写真を表示できませんでした</span>'; }).catch(() => {});
  $('ed-save').onclick = async () => {
    const v = { id: X.id, kind: $('ed-kind').value, name: $('ed-name').value.trim(), no: $('ed-no').value.trim(), exp: $('ed-exp').value, memo: $('ed-memo').value.trim() };
    const go = $('ed-save'); go.disabled = true;
    const r = await api({ kind: 'app_set', field: 'evdoc', value: v }).catch(() => ({ ok: false, error: '通信できませんでした' }));
    go.disabled = false;
    if (!r.ok) { toast(r.error || '保存できませんでした'); return; }
    D = r.data; renderAll(); toast(X.id ? '書類を更新しました' : '書類を登録しました。写真も追加できます', 'ok');
    if (!X.id && r.id) openEvDoc(r.id); else closeSheet();
  };
  if ($('ed-pic')) $('ed-pic').onclick = () => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = async () => {
      const f = inp.files[0]; if (!f) return; const b = $('ed-pic'); b.disabled = true; b.textContent = '送信しています…';
      try {
        const img64 = await shrinkStep(f);
        const r = await api({ kind: 'app_img', doc: X.id, image: img64, type: 'image/jpeg' });
        if (!r.ok) throw new Error(r.error || '送信できませんでした');
        D = r.data; renderAll(); toast('写真を保存しました', 'ok'); openEvDoc(X.id);
      } catch (e) { toast(e.message || '写真を送信できませんでした'); b.disabled = false; b.textContent = X.img ? '写真を差し替え' : '写真を追加'; }
    };
    inp.click();
  };
  if ($('ed-del')) $('ed-del').onclick = () => {
    const b = $('ed-del'); if (b.dataset.sure) return;
    b.dataset.sure = 1; b.textContent = '削除する(元に戻せません)'; b.style.cssText = 'background:var(--warn);border-color:var(--warn);color:#fff';
    b.onclick = async () => {
      const r = await api({ kind: 'app_img', doc: X.id, del: true }).catch(() => ({ ok: false, error: '通信できませんでした' }));
      if (!r.ok) { toast(r.error || '削除できませんでした'); return; }
      D = r.data; renderAll(); closeSheet(); toast('書類を削除しました', 'ok');
    };
  };
}
function openOrder(supName) {
  const O = D.order || { sups: [] };
  if (supName == null) {
    openSheet(`<h2 style="margin:0 0 4px">発注書の作成</h2><p class="k" style="margin:0 0 10px">仕入先を選択してください。在庫が少ない材料がある仕入先を上に表示しています</p>
      ${O.sups.length ? O.sups.map((x, i) => `<button class="od-sup" type="button" data-os="${i}"><b>${esc(x.name)}</b><span class="k">${x.lowN ? `<mark>そろそろ ${x.lowN}品</mark> ` : ''}${x.last ? `前回 ${jpDay(x.last.at).replace(/^\d+年/, '')}` : ''}${x.fax ? '' : ' FAX番号なし'}</span></button>`).join('') : '<p class="k">仕入先が登録されていません。請求書を撮影すると、仕入先と取引のある品目が登録されます</p>'}
      <div class="fld" style="margin-top:12px"><span class="k">その他の仕入先</span><input id="od-new" placeholder="仕入先名"></div><div class="ask"><button class="btn ghost" type="button" id="od-new-go">この仕入先で作成</button></div>`);
    document.querySelectorAll('[data-os]').forEach(b => b.onclick = () => openOrder(O.sups[+b.dataset.os].name));
    $('od-new-go').onclick = () => { const n = $('od-new').value.trim(); if (!n) { $('od-new').focus(); return; } openOrder(n); };
    return;
  }
  const S = O.sups.find(x => x.name === supName) || { name: supName, fax: '', items: [], last: null };
  const row = (it, i) => `<div class="od-row" data-i="${i}"><div class="od-n"><b>${esc(it.name)}</b><span class="k">${esc(it.spec || '')}${it.low ? ` <mark>在庫少${it.left ? '(' + esc(it.left) + ')' : ''}</mark>` : ''}${it.qty !== '' ? ` 前回 ${esc(String(it.qty))}${esc(it.unit || '')}` : ''}</span></div><input class="od-q" inputmode="decimal" aria-label="${esc(it.name)}の数" value="${it.low && it.qty !== '' ? esc(String(it.qty)) : ''}" placeholder="数"><input class="od-u" aria-label="単位" value="${esc(it.unit || '')}" placeholder="単位"></div>`;
  const free = i => `<div class="od-row od-free"><input class="od-fn" aria-label="品名" placeholder="品名(一覧にない品目)"><input class="od-q" inputmode="decimal" aria-label="数" placeholder="数"><input class="od-u" aria-label="単位" placeholder="単位"></div>`;
  openSheet(`<h2 style="margin:0 0 4px">${esc(S.name)} への発注書</h2><p class="k" style="margin:0 0 8px">発注する品目に数量を入力してください。空欄の品目は発注書に記載されません</p>
    ${S.last ? `<div class="ask" style="margin:0 0 8px"><button class="btn ghost sm" type="button" id="od-same">前回(${jpDay(S.last.at).replace(/^\d+年/, '')})と同じにする</button></div>` : ''}
    <div id="od-items">${S.items.map(row).join('')}${free(0)}${free(1)}${free(2)}</div>
    <div class="fld" style="margin-top:12px"><span class="k">送り先のFAX番号</span><input id="od-fax" inputmode="tel" value="${esc(S.fax || '')}" placeholder="例 0436-00-0000(仕入先に保存されます)">
    <span class="k">納品希望日</span><input id="od-day" type="date">
    <span class="k">備考</span><input id="od-memo" placeholder="例 いつもの時間にお願いします"></div>
    <div class="ask"><button class="btn" type="button" id="od-go">発注書を作成</button><button class="btn ghost" type="button" id="od-back">仕入先を選び直す</button></div>`);
  $('od-back').onclick = () => openOrder();
  if ($('od-same')) $('od-same').onclick = () => {
    const items = document.querySelectorAll('#od-items .od-row:not(.od-free)'), frees = [...document.querySelectorAll('#od-items .od-free')];
    items.forEach(r => { r.querySelector('.od-q').value = ''; });
    S.last.lines.forEach(l => {
      const i = S.items.findIndex(it => it.name === l.name), r = i >= 0 ? items[i] : null;
      if (r) { r.querySelector('.od-q').value = l.qty; r.querySelector('.od-u').value = l.unit || ''; return; }
      const f = frees.find(x => !x.querySelector('.od-fn').value); if (f) { f.dataset.spec = l.spec || ''; f.querySelector('.od-fn').value = l.name; f.querySelector('.od-q').value = l.qty; f.querySelector('.od-u').value = l.unit || ''; }
    });
    toast('前回と同じ数量を入力しました。変更する箇所のみ修正してください', 'ok');
  };
  $('od-go').onclick = async () => {
    const lines = [];
    document.querySelectorAll('#od-items .od-row').forEach(r => {
      const q = r.querySelector('.od-q').value.trim(), u = r.querySelector('.od-u').value.trim(); if (!q) return;
      if (r.classList.contains('od-free')) { const n = r.querySelector('.od-fn').value.trim(); if (n) lines.push({ name: n, spec: r.dataset.spec || '', qty: q, unit: u }); return; }
      const it = S.items[+r.dataset.i]; lines.push({ name: it.name, spec: it.spec || '', qty: q, unit: u });
    });
    if (!lines.length) { toast('発注する品目に数量を入力してください'); return; }
    const go = $('od-go'); go.disabled = true;
    const day = $('od-day').value, memo = $('od-memo').value.trim(), fax = $('od-fax').value.trim();
    const r = await api({ kind: 'app_order', sup: S.name, fax, lines, day, memo }).catch(() => ({ ok: false, error: '通信できませんでした' }));
    go.disabled = false;
    if (!r.ok) { toast(r.error || '作れませんでした'); return; }
    if (r.data) { D = r.data; renderAll(); }
    closeSheet(); openPrint(orderHtml(S, { no: r.no, lines, day, memo, fax }), { bare: true });
  };
}
function orderHtml(S, o) {
  const si = D.shopInfo || {}, rows = o.lines.map((l, i) => `<tr><td class="c">${i + 1}</td><td>${esc(l.name)}</td><td>${esc(l.spec || '')}</td><td class="r"><b>${esc(String(l.qty))}</b> ${esc(l.unit || '')}</td><td>${esc(l.note || '')}</td></tr>`);
  for (let i = rows.length; i < 10; i++) rows.push(`<tr><td class="c">${i + 1}</td><td></td><td></td><td></td><td></td></tr>`);
  const day = o.day ? jpDay(o.day.replace(/-/g, '/')) + `(${'日月火水木金土'[new Date(o.day.replace(/-/g, '/')).getDay()]})` : 'ご相談';
  return `<p class="k od-np">FAXでの送信方法: スマートフォンの場合は「印刷・PDFにする」→ 共有からFAXアプリへ送信します。パソコンの場合はPDFで保存し、ご利用のFAXサービスから送信してください。紙に印刷して、店舗のFAX機から送信することもできます</p>
  <div class="od-doc"><h1>発　注　書</h1>
    <div class="od-top"><div class="od-to"><div class="od-big">${esc(S.name)}　御中</div>${S.person ? `<div>ご担当　${esc(S.person)}　様</div>` : ''}<div>FAX　${esc(o.fax || '')}</div></div>
      <div class="od-from"><div>No.　${esc(o.no || '')}</div><div>発注日　${jpDay(Date.now())}</div><div class="od-shop">${esc(si.name || D.shop)}</div>${si.addr ? `<div>${esc(si.addr)}</div>` : ''}<div>${si.tel ? 'TEL　' + esc(si.tel) : ''}${si.fax ? '　FAX　' + esc(si.fax) : ''}</div>${D.me && D.me.name ? `<div>発注者　${esc(D.me.name)}</div>` : ''}</div></div>
    <p>いつもお世話になっております。下記のとおり発注いたします。よろしくお願いいたします。</p>
    <table class="od-t"><tr><th style="width:8%">No.</th><th style="width:36%">品名</th><th style="width:20%">規格</th><th style="width:16%">数量</th><th>備考</th></tr>${rows.join('')}</table>
    <table class="od-t od-f"><tr><th style="width:24%">納品希望日</th><td>${esc(day)}</td></tr><tr><th>備考</th><td>${esc(o.memo || '')}</td></tr></table>
    <p class="od-foot">ご不明な点は、上記の電話番号までご連絡ください。</p></div>`;
}
function openSheet(html) {
  closeSheet(); const ov = document.createElement('div'); ov.id = 'mini-ov'; ov.className = 'a2ov'; ov.style.alignItems = 'center';
  ov.innerHTML = `<div class="card" role="dialog" aria-modal="true" style="max-width:520px;width:100%;max-height:90vh;overflow:auto;position:relative"><button class="btn ghost sm" type="button" id="mini-x" style="position:absolute;top:10px;right:10px">閉じる</button>${html}</div>`;
  document.body.appendChild(ov); $('mini-x').onclick = closeSheet; ov.onclick = e => { if (e.target === ov) closeSheet(); };
  ov._esc = e => { if (e.key === 'Escape') closeSheet(); }; document.addEventListener('keydown', ov._esc);
}
function closeSheet() { const ov = $('mini-ov'); if (ov) { document.removeEventListener('keydown', ov._esc); ov.remove(); } }
// 会計ソフトの取り込みはShift_JISが多い。ブラウザに書き出しの仕組みがないので、読み取りの仕組み(TextDecoder)から対応表を一度だけ作る
let SJIS_MAP = null;
function sjisBytes(text) {
  if (!SJIS_MAP) {
    SJIS_MAP = new Map(); const dec = new TextDecoder('shift_jis');
    for (let b = 0xA1; b <= 0xDF; b++) SJIS_MAP.set(dec.decode(new Uint8Array([b])), [b]);
    for (let h = 0x81; h <= 0xFC; h++) { if (h > 0x9F && h < 0xE0) continue; for (let l = 0x40; l <= 0xFC; l++) { if (l === 0x7F) continue; const c = dec.decode(new Uint8Array([h, l])); if (c.length === 1 && c !== '\ufffd' && !SJIS_MAP.has(c)) SJIS_MAP.set(c, [h, l]); } }
  }
  const out = []; const t = String(text).normalize('NFC');
  for (const ch of t) { const c = ch.codePointAt(0); if (c < 0x80) { out.push(c); continue; } const m = SJIS_MAP.get(ch); if (m) out.push(...m); else out.push(0x3F); }
  return new Uint8Array(out);
}
// 税理士に渡す一式(印刷用)
function taxHtml(r) {
  const yen0 = n => Math.round(n).toLocaleString('ja-JP');
  const sk = Object.keys(r.sums).sort((a, b) => r.sums[b] - r.sums[a]), st = sk.reduce((a, k) => a + r.sums[k], 0), bt = r.buys.reduce((a, b) => a + b[6], 0), sl = r.sales.reduce((a, x) => a + x[1], 0);
  return `<h2>${esc(r.month.replace('-', '年'))}月分 税理士用</h2>
    <h3>科目ごとの合計(仕入れ・案)</h3><table class="ptab">${sk.map(k => `<tr><td>${esc(k)}</td><td class="n">${yen0(r.sums[k])}円</td></tr>`).join('')}<tr><td><b>合計</b></td><td class="n"><b>${yen0(st)}円</b></td></tr></table>
    <h3>売上(レジの精算・税込)</h3>${r.sales.length ? `<table class="ptab"><tr><th>日付</th><th class="n">売上</th><th class="n">客数</th></tr>${r.sales.map(x => `<tr><td>${esc(x[0])}</td><td class="n">${yen0(x[1])}円</td><td class="n">${x[2] || ''}</td></tr>`).join('')}<tr><td><b>合計</b></td><td class="n"><b>${yen0(sl)}円</b></td><td></td></tr></table>` : '<p>この月の売上の記録はありません。</p>'}
    <h3>支払い</h3>${r.pays.length ? `<table class="ptab"><tr><th>仕入先</th><th class="n">金額</th><th>期限</th><th>状態</th><th>支払日</th></tr>${r.pays.map(x => `<tr><td>${esc(x[0])}</td><td class="n">${yen0(x[2])}円</td><td>${esc(x[3])}</td><td>${esc(x[4])}</td><td>${esc(x[5])}</td></tr>`).join('')}</table>` : '<p>この月の支払いの記録はありません。</p>'}
    <h3>仕入れの明細</h3>${r.buys.length ? `<table class="ptab"><tr><th>日付</th><th>仕入先</th><th>品名</th><th class="n">金額</th><th>科目(案)</th><th>税率</th></tr>${r.buys.map(b => `<tr><td>${esc(b[0])}</td><td>${esc(b[1])}</td><td>${esc(b[2])}${b[3] ? ' ' + esc(b[3]) : ''}</td><td class="n">${yen0(b[6])}</td><td>${esc(b[7])}</td><td>${esc(b[8])}</td></tr>`).join('')}<tr><td colspan="3"><b>合計</b></td><td class="n"><b>${yen0(bt)}</b></td><td colspan="2"></td></tr></table>` : '<p>この月の仕入れの記録はありません。</p>'}
    <p class="k">科目はピタット原価の案です。請求書の原本と合わせてご確認ください。</p>`;
}
function renderJournal() {
  const box = $('journal');
  const ms = Object.keys(D.journal || {}).sort().reverse();
  if (!ms.length) { box.innerHTML = ''; return; }
  const sel = box.dataset.m && ms.includes(box.dataset.m) ? box.dataset.m : ms[0];
  const sums = D.journal[sel], keys = Object.keys(sums).sort((a, b) => sums[b] - sums[a]), tot = keys.reduce((a, k) => a + sums[k], 0);
  box.innerHTML = `<h1 style="font-size:18px;margin-top:24px">科目ごとの合計(仕訳の案)</h1><div class="chips">${ms.map(m => `<button class="chip" type="button" data-m="${esc(m)}" aria-pressed="${m === sel}">${esc(m.replace('-', '年'))}月</button>`).join('')}</div>
    <div class="card"><table>${keys.map(k => `<tr><td>${k === '要確認' ? '<mark>要確認</mark>' : esc(k)}</td><td class="n">${yen(sums[k])}</td></tr>`).join('')}<tr><td><b>合計</b></td><td class="n"><b>${yen(tot)}</b></td></tr></table>
    <p class="k" style="margin:8px 0 0">科目は案です。「仕入れ」の表で修正するか、「科目」シートに規則を追加すると、次回から自動で分類します</p></div>
    <div class="card" style="margin-top:12px"><p style="margin:0 0 4px"><b>税理士に渡す(${esc(sel.replace('-', '年'))}月分)</b></p><p class="k" style="margin:0 0 8px">仕入れの明細・支払い・売上・科目ごとの合計を1つにまとめます。印刷してお渡しいただくか、CSV(表計算ソフトや会計ソフトで開ける形式)でお送りください。</p>
    <div class="ask"><button class="btn" type="button" id="tx-print">印刷・PDFにする</button><button class="btn ghost" type="button" id="tx-csv">CSVで保存</button><button class="btn ghost" type="button" id="tx-acct">会計ソフト用に書き出す</button>${SH('journal') ? '' : '<button class="btn ghost" type="button" id="tx-jcsv">仕訳の案(会計ソフト用CSV)</button>'}</div>${SH('journal') ? '' : '<p class="k" style="margin:8px 0 0">仕訳の案は「日付・借方・貸方・金額・摘要」の形式です。支払いはすべて現金として計上しています。掛け払いや口座引き落としの分は、会計ソフトで修正してください。</p>'}</div>`;
  box.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { box.dataset.m = b.dataset.m; renderJournal(); });
  // 会計ソフト向けの書き出し(連携): freee・マネーフォワード・弥生の取り込みの形。売上の税率は選ぶ(持ち帰り・菓子は軽減8%、店内飲食は10%)
  $('tx-acct').onclick = () => {
    let rate = '8'; try { rate = localStorage.getItem('shikomi:salesRate') || '8'; } catch (e) {}
    openSheet(`<h2 style="margin:0 70px 8px 0;font-size:19px">会計ソフト用に書き出す(${esc(sel.replace('-', '年'))}月分)</h2>
      <p class="k">ご利用の会計ソフトの取り込み形式で保存します。会計ソフトの「インポート」から読み込んでください。</p>
      <label class="k" for="ax-fmt">会計ソフト</label><select id="ax-fmt" class="mq-sel" style="max-width:none;width:100%"><option value="freee">freee会計(取引のインポート)</option><option value="mf">マネーフォワード クラウド会計(仕訳帳のインポート)</option><option value="yayoi">弥生会計(仕訳データのインポート)</option></select>
      <label class="k" for="ax-rate" style="display:block;margin-top:10px">売上の消費税率</label><select id="ax-rate" class="mq-sel" style="max-width:none;width:100%"><option value="8"${rate === '8' ? ' selected' : ''}>8%(軽減税率。持ち帰り・菓子・パンなど)</option><option value="10"${rate === '10' ? ' selected' : ''}>10%(店内での飲食など)</option></select>
      <p class="k" style="margin-top:10px">仕入れの科目と税率は、ピタット原価の案のまま出力します。科目が「要確認」のものは仕入高、税率が不明なものは8%として出力し、摘要に「要確認」と記載します。取り込み後、会計ソフトでご確認ください。</p>
      <div class="ask" style="margin-top:12px"><button class="btn" type="button" id="ax-go">保存する</button></div>`);
    $('ax-go').onclick = async () => {
      if (IN_LINE) { chat('LINEの画面からはファイルを保存できません。パソコンまたはスマートフォンのブラウザで開いてください。', 'point'); return; }
      const fmt = $('ax-fmt').value, sr = $('ax-rate').value; try { localStorage.setItem('shikomi:salesRate', sr); } catch (e) {}
      const r = await api({ kind: 'app_export', month: sel, fmt, salesRate: sr }); if (!r.ok) { toast(r.error || '出力できませんでした', 'ng'); return; }
      const bytes = sjisBytes(r.csv.text);
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([bytes], { type: 'text/csv' })); a.download = r.csv.name; document.body.appendChild(a); a.click(); a.remove();
      const w = r.csv.warn || {}; closeSheet();
      toast(r.csv.n + '件を保存しました' + (w.acct || w.rate ? '(要確認 ' + ((w.acct || 0) + (w.rate || 0)) + '件)' : ''), 'ok');
    };
  };
  const getX = async () => { const r = await api({ kind: 'app_export', month: sel }); if (!r.ok) { toast(r.error || '出力できませんでした', 'ng'); return null; } return r; };
  $('tx-print').onclick = async () => { const r = await getX(); if (r) openPrint(taxHtml(r)); };
  $('tx-csv').onclick = async () => {
    const r = await getX(); if (!r) return;
    if (IN_LINE) { chat('LINEの画面からはファイルを保存できません。パソコンまたはスマートフォンのブラウザで開いて「CSVで保存」を押すか、「印刷・PDFにする」をご利用ください。', 'point'); return; }
    const q = v => { const t = String(v == null ? '' : v); return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
    const rows = [['区分', '日付', '取引先', '品名', '規格', '数量', '単位', '金額(円)', '科目(案)', '税率', 'メモ', '登録番号']];
    r.buys.forEach(b => rows.push(['仕入れ', b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7], b[8], '', b[9] || '']));
    r.sales.forEach(x => rows.push(['売上', x[0], '', 'レジの売上(税込)', '', '', '', x[1], '売上高', '', x[2] ? '客数 ' + x[2] : '']));
    r.pays.forEach(x => rows.push(['支払い', x[5] || x[3], x[0], x[1] + '分の請求', '', '', '', x[2], '', '', x[4] + (x[3] ? ' 期限 ' + x[3] : '')]));
    (r.regs || []).forEach(x => rows.push(['現金の過不足', x[0], '', x[2] || '理由なし', '', '', '', Math.abs(x[1]), x[1] < 0 ? '雑損失' : '雑収入', '', x[3] || '']));
    const csv = '\ufeff' + rows.map(rw => rw.map(q).join(',')).join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `${r.shop || '店舗'}_${r.month}_税理士用.csv`; document.body.appendChild(a); a.click(); a.remove();
    toast('CSVを保存しました', 'ok');
  };
  if ($('tx-jcsv')) $('tx-jcsv').onclick = async () => {
    const r = await getX(); if (!r) return;
    if (IN_LINE) { chat('LINEの画面からはファイルを保存できません。パソコンまたはスマートフォンのブラウザで開いてください。', 'point'); return; }
    const q = v => { const t = String(v == null ? '' : v); return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
    const rows = [['日付', '借方勘定科目', '借方金額', '貸方勘定科目', '貸方金額', '摘要']];
    r.sales.forEach(x => rows.push([x[0], '現金', x[1], '売上高', x[1], 'レジの売上(税込)']));
    r.buys.forEach(b => { const ac = b[7] || '要確認', cr = b[3] === '店主の立替' ? '事業主借' : '現金'; rows.push([b[0], ac, b[6], cr, b[6], [b[1], b[2], b[3] && b[3] !== '店主の立替' && b[3] !== '私用' ? b[3] : ''].filter(Boolean).join(' ')]); });
    (r.regs || []).forEach(x => rows.push(x[1] < 0 ? [x[0], '雑損失', -x[1], '現金', -x[1], '現金の不足 ' + (x[2] || '')] : [x[0], '現金', x[1], '雑収入', x[1], '現金の過剰 ' + (x[2] || '')]));
    rows.splice(1, rows.length - 1, ...rows.slice(1).sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
    const csv = '\ufeff' + rows.map(rw => rw.map(q).join(',')).join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `${r.shop || '店舗'}_${r.month}_仕訳の案.csv`; document.body.appendChild(a); a.click(); a.remove();
    toast('仕訳の案を保存しました', 'ok');
  };
}
// ---- 金額表示のロック: 店主が決めた分だけさわらないと、帳簿・売上を閉じ、原価画面の金額の列も隠す。開くときは人ごとの4けたの暗証番号 ----
const MLK = 'shikomi:mlast';
let mlockTimer = null;
const mlockOn = () => !!(D && MLOCK && MLOCK.min && (D.__masked || !D.hideMoney));
function mlockTouch() { if (!mLocked && mlockOn()) { try { sessionStorage.setItem(MLK, String(Date.now())); } catch (e) {} } }
function mlockSet(v) {
  if (mLocked === v) return; mLocked = v;
  if (v && MONEY_TABS.includes(cur) && cur !== 'cost') show('today', true);
  renderAll();
}
function mlockInit() {
  if (!mlockOn()) { if (mLocked) { mLocked = false; } clearInterval(mlockTimer); mlockTimer = null; mlockBar(); return; }
  if (!mlockTimer) {
    let last = 0; try { last = Number(sessionStorage.getItem(MLK) || 0); } catch (e) {}
    mLocked = !last || Date.now() - last > MLOCK.min * 60e3;
    ['pointerdown', 'keydown', 'scroll'].forEach(e => addEventListener(e, mlockTouch, { passive: true }));
    mlockTimer = setInterval(() => { if (!mlockOn() || mLocked) return; let l = 0; try { l = Number(sessionStorage.getItem(MLK) || 0); } catch (e) {} if (!l || Date.now() - l > MLOCK.min * 60e3) mlockSet(true); }, 15000);
  }
  mlockBar();
}
function mlockBar() {
  let b = $('mlock-bar'); const want = mlockOn() && mLocked;
  if (!want) { if (b) b.remove(); return; }
  if (!b) { b = document.createElement('div'); b.id = 'mlock-bar'; b.className = 'card'; b.style.cssText = 'display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-bottom:12px'; $('t-today').prepend(b); }
  b.innerHTML = `<span><b>🔒 金額は非表示です</b><br><span class="k">${MLOCK.min}分間操作がなかったため、帳簿・売上・原価の金額を非表示にしました。レシピと分量はそのままご覧いただけます</span></span><button class="btn sm" type="button" id="mlock-open">開く</button>`;
  $('mlock-open').onclick = () => mlockAsk();
}
function mlockAsk(next) {
  if ($('mlock-ov')) return;
  const hasPin = MLOCK.hasPin;
  const ov = document.createElement('div'); ov.id = 'mlock-ov'; ov.className = 'a2ov'; ov.style.alignItems = 'center';
  const draw = mode => {
    const pinIn = (id, ph) => `<input id="${id}" type="password" inputmode="numeric" autocomplete="off" maxlength="4" placeholder="${ph}" style="font-size:28px;letter-spacing:.4em;text-align:center;width:100%;margin:6px 0">`;
    ov.innerHTML = `<div class="card" role="dialog" aria-modal="true" aria-labelledby="mlk-h" style="max-width:380px;width:100%">
      <h2 id="mlk-h" style="font-family:var(--round);margin:0 0 6px">${mode === 'set' ? '金額表示の暗証番号を設定' : mode === 'reset' ? '暗証番号を再設定' : '金額を表示する'}</h2>
      <p class="k" style="margin:0 0 6px">${mode === 'set' ? 'ご本人専用の4桁の番号です。店舗のスタッフには教えないでください(1111のような同じ数字や、1234のような連番は使えません)' : mode === 'reset' ? '店主のLINEに届いた6桁の番号と、新しい4桁の暗証番号を入力してください' : '4桁の暗証番号を入力してください'}</p>
      ${mode === 'reset' ? `<input id="mlk-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="6けたの数字" style="font-size:22px;text-align:center;width:100%;margin:6px 0">` : ''}
      ${pinIn('mlk-pin', '4けた')}${mode !== 'open' ? pinIn('mlk-pin2', 'もう一度') : ''}
      <p class="k" id="mlk-msg" style="margin:4px 0 8px;color:var(--warn)"></p>
      <div style="display:flex;gap:8px"><button class="btn" type="button" id="mlk-ok" style="flex:2">${mode === 'open' ? '開く' : '決める'}</button><button class="btn ghost" type="button" id="mlk-x" style="flex:1">やめる</button></div>
      ${mode === 'open' ? `<p style="margin:10px 0 0;text-align:center"><button class="btn ghost sm" type="button" id="mlk-forgot">暗証番号をお忘れの場合</button></p>` : ''}</div>`;
    const msg = t => { $('mlk-msg').textContent = t; };
    $('mlk-x').onclick = () => ov.remove();
    $('mlk-pin').focus();
    const go = async () => {
      const pin = $('mlk-pin').value.trim();
      if (mode !== 'open' && pin !== $('mlk-pin2').value.trim()) { msg('入力した2つの番号が一致しません'); return; }
      $('mlk-ok').disabled = true;
      let r = mode === 'set' ? await api({ kind: 'app_mlock_pin', pin }) : mode === 'reset' ? await api({ kind: 'app_mlock_reset', code: $('mlk-code').value.trim(), pin }) : await api({ kind: 'app_mlock_unlock', pin });
      if (r.ok && mode !== 'open') { MLOCK.hasPin = true; r = await api({ kind: 'app_mlock_unlock', pin }); }
      $('mlk-ok').disabled = false;
      if (!r.ok) { if (r.needPin) { draw('set'); return; } msg(r.error || '表示できませんでした'); $('mlk-pin').value = ''; $('mlk-pin').focus(); return; }
      ov.remove(); try { sessionStorage.setItem(MLK, String(Date.now())); } catch (e) {} mlockSet(false); toast('金額を表示しました', 'ok'); if (next) show(next);
    };
    $('mlk-ok').onclick = go;
    ov.querySelectorAll('input').forEach(i => i.onkeydown = e => { if (e.key === 'Enter') go(); });
    if ($('mlk-forgot')) $('mlk-forgot').onclick = async () => { const r = await api({ kind: 'app_mlock_forgot' }); if (!r.ok) { msg(r.error); return; } toast(r.msg, 'ok'); draw('reset'); };
  };
  document.body.appendChild(ov); draw(hasPin ? 'open' : 'set');
}
// ---- 顔認証・指紋認証のログイン(パスキー)。ブラウザで開いたときだけ(LINEの中はLINEのログインで守る) ----
const PK_OK = CF && !IN_LINE && !!window.PublicKeyCredential && !!navigator.credentials;
let PK_KEYS = null;
const pkU = s => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return Uint8Array.from(atob(s), c => c.charCodeAt(0)); };
const pkE = a => btoa(String.fromCharCode(...new Uint8Array(a))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const pkPost = (p, o) => fetch(p, { method: 'POST', headers: { 'content-type': 'application/json', 'x-shikomi': '1' }, body: JSON.stringify(o || {}) }).then(r => r.json());
async function pkLoad() {
  if (!PK_OK) return;
  const r = await pkPost('/auth/passkey/list').catch(() => null); if (!r || !r.ok) return;
  PK_KEYS = r.keys; pkBanner();
  const box = $('pk-set'); if (!box) return;
  const day = t => t ? new Date(t).toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric' }) : '—';
  box.innerHTML = `<b>顔認証・指紋認証のログイン</b><p class="k" style="margin:6px 0 8px">iPhone・Androidに登録済みの顔認証・指紋認証(Face IDなど)を、そのままログインに使用します。新たに顔や指紋を登録する必要はなく、顔・指紋のデータが端末の外に送られることはありません。設定済みの端末では、メールアドレスとパスワードの入力が不要になります。${D && D.me && D.me.owner ? '<b>店主の方は設定をお願いします。</b>' : ''}</p>
    ${PK_KEYS.length ? PK_KEYS.map(k => `<div class="ask" style="justify-content:space-between;flex-wrap:wrap"><span>${esc(k.dev || '端末')} <span class="k">設定日 ${day(k.at)}・最終利用日 ${day(k.last)}</span></span><button class="btn ghost sm" type="button" data-pkdel="${esc(k.id)}">削除</button></div>`).join('') : '<p class="k" style="margin:0 0 8px">まだ設定されていません。</p>'}
    <div style="margin-top:8px"><button class="btn sm" type="button" id="pk-add">この端末で顔認証・指紋認証を設定する</button> <span class="k" id="pk-msg"></span></div>`;
  $('pk-add').onclick = pkAdd;
  box.querySelectorAll('[data-pkdel]').forEach(b => twice(b, 'もう一度押すと削除します', async () => { const r2 = await pkPost('/auth/passkey/del', { id: b.dataset.pkdel }); if (!r2.ok) { toast(r2.error); return; } toast('削除しました', 'ok'); pkLoad(); }));
}
async function pkAdd() {
  const m = $('pk-msg'); if (m) m.textContent = '端末の顔認証・指紋認証の画面を表示します…';
  try {
    const r = await pkPost('/auth/passkey/reg-options'); if (!r.ok) throw new Error(r.error);
    const o = r.options; o.challenge = pkU(o.challenge); o.user.id = pkU(o.user.id); o.excludeCredentials = (o.excludeCredentials || []).map(x => Object.assign({}, x, { id: pkU(x.id) }));
    const c = await navigator.credentials.create({ publicKey: o });
    const r2 = await pkPost('/auth/passkey/reg', { id: c.id, clientDataJSON: pkE(c.response.clientDataJSON), attestationObject: pkE(c.response.attestationObject) });
    if (!r2.ok) throw new Error(r2.error);
    toast('この端末の顔認証・指紋認証でログインできるようになりました', 'ok'); pkLoad();
  } catch (e) { const t = e && e.name === 'InvalidStateError' ? 'この端末はすでに設定されています' : e && e.name === 'NotAllowedError' ? '中止しました' : (e && e.message) || '設定できませんでした'; if (m) m.textContent = t; else toast(t); }
}
// 店主で、まだ1台も登録していないときは、ホームに1行(「あとで」で1日出さない)
const PK_NUDGE = false;
function pkBanner() {
  // 独自のドメインに移ると登録し直しになるため、決まるまではホームで勧めない(設定からは使える)
  let b = $('pk-ban'); const want = PK_NUDGE && PK_OK && PK_KEYS && !PK_KEYS.length && D && D.me && D.me.owner && Date.now() - store.get('pkLater', 0) > 86400000;
  if (!want) { if (b) b.remove(); return; }
  if (!b) { b = document.createElement('div'); b.id = 'pk-ban'; b.className = 'card'; b.style.cssText = 'display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-bottom:12px'; const t = $('t-today'); t.insertBefore(b, $('mlock-bar') ? $('mlock-bar').nextSibling : t.firstChild); }
  b.innerHTML = `<span><b>顔認証・指紋認証によるログインを設定してください</b><br><span class="k">端末のFace ID・指紋認証をそのまま使用します。店主アカウントの保護のため、設定をお願いします</span></span><span style="display:flex;gap:8px"><button class="btn ghost sm" type="button" id="pk-later">後で</button><button class="btn sm" type="button" id="pk-ban-add">設定する</button></span>`;
  $('pk-later').onclick = () => { store.set('pkLater', Date.now()); b.remove(); };
  $('pk-ban-add').onclick = pkAdd;
}
// テスト中のサービスだと了解をもらう(店主だけ・1回)
function betaAsk() {
  if (!D.betaAsk || $('beta-ov')) return;
  const ov = document.createElement('div'); ov.id = 'beta-ov'; ov.className = 'a2ov'; ov.style.alignItems = 'center';
  ov.innerHTML = `<div class="card" role="dialog" aria-modal="true" aria-labelledby="beta-h" style="max-width:520px;width:100%;max-height:90vh;overflow:auto">
    <h2 id="beta-h" style="font-family:var(--round);margin:0 0 8px">ピタット原価はテスト提供中です</h2>
    <p style="margin:0 0 8px">限られた店舗でご利用いただきながら、改善を進めている段階です。ご利用の前に、次の点をご確認ください。</p>
    <ul style="margin:0 0 12px;padding-left:1.2em;line-height:1.8">
      <li>画面や操作方法は、予告なく変更される場合があります。</li>
      <li>動作の停止や計算の誤りが発生する場合があります。原価や食品表示は、店舗でもご確認のうえご利用ください。</li>
      <li>店舗のデータは毎日バックアップしていますが、すべてを復元できるとは限りません。重要なデータは「書き出し」で手元にも保存してください。</li>
      <li>お気づきの点は「相談」からお知らせください。改善の参考にさせていただきます。</li>
    </ul>
    <label style="display:flex;gap:8px;align-items:center;font-weight:700;margin:0 0 12px"><input type="checkbox" id="beta-read" style="width:22px;height:22px"> 上記の内容を確認しました</label>
    <button class="btn" type="button" id="beta-ok" disabled style="width:100%">テスト提供中であることを了承して利用する</button>
    <p class="k" id="beta-msg" style="margin:8px 0 0"></p></div>`;
  document.body.appendChild(ov);
  $('beta-read').onchange = e => { $('beta-ok').disabled = !e.target.checked; };
  $('beta-ok').onclick = async () => { $('beta-ok').disabled = true; const r = await api({ kind: 'app_beta_ok', v: D.betaAsk, read: $('beta-read').checked }); if (!r.ok) { $('beta-msg').textContent = r.error || '送信できませんでした'; $('beta-ok').disabled = false; return; } delete D.betaAsk; ov.remove(); toast('ありがとうございます。よろしくお願いいたします', 'ok'); };
}
// 鍵が閉じている間は、金額の閲覧権限がない人と同じ形にしたデータで画面を作る(サーバーがスタッフに隠すものと同じ)
function maskMoney(d) {
  const m = Object.assign({}, d, { hideMoney: true, status: null, gap: null, courses: null, months: {}, journal: {}, sales: {}, money: {}, ups: [], priceChanges: [], fixedExps: [], menu: {} });
  m.inspect = (d.inspect || []).filter(x => !x.money);
  m.products = (d.products || []).map(p => Object.assign({}, p, { batch_cost: null, per_piece: null, price: null, guide: null, prevCost: null, rows: (p.rows || []).map(r => Object.assign({}, r, { cost: null })) }));
  m.materials = (d.materials || []).map(x => Object.assign({}, x, { ppg: null, ppu: null }));
  return m;
}
function renderAll() {
  mlockInit();
  if (mLocked && D && !D.__masked) { const real = D; D = Object.assign(maskMoney(real), { __masked: 1 }); try { renderAllInner(); } finally { D = real; } return; }
  renderAllInner();
}
function renderAllInner() {
  U = (D.words || {}).unit || '個';
  renderToday(); renderIntake(); renderRegClose(); renderCost(); renderHowto(); if (cur === 'label') renderLabel(); else labelStale = true; renderMat(); renderBook(); renderHyg(); renderSales(); renderEv(); renderWs(); renderPost(); renderSet(); applyPlanLocks();
  betaAsk(); mlockBar(); if (PK_KEYS) pkBanner(); else if (PK_OK && !window.__pkl) { window.__pkl = 1; pkLoad(); }
  stuckBind(); if (SORT) sortCard(); else if (CF && !window.__sortl) { window.__sortl = 1; sortLoad(); }
  $('shop').textContent = D.shop; if ($('shop2')) { $('shop2').textContent = D.shop; $('date2').textContent = $('date').textContent; }
  $('foot').textContent = `${new Date(D.at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 時点の情報です。画面を開き直すと最新の情報に更新されます。キャラクターのイラストはAtelier SAISPEのLINE絵文字です。`;
}

// ---------- タブ ----------
const tabs = ['today', 'hyg', 'sales', 'cost', 'howto', 'label', 'mat', 'book', 'ws', 'ev', 'ct', 'post', 'cal', 'set'];
let cur = 'today';
// ---------- この画面についてご意見を送る(迷った所を集めて、画面を直す) ----------
const SCREEN_NAME = { today: 'ホーム', cost: '原価', label: '表示', howto: '作り方', mat: '材料', hyg: '衛生', book: '帳簿', ws: '卸', ev: '出店', ct: '仕入先・卸先', post: '発信', sales: '商品分析', cal: '予定', set: '設定' };
function stuckBind() {
  const box = $('stuck'); if (!box || !CF || box.dataset.b) return; box.dataset.b = 1; box.hidden = false;
  const f = $('stuck-f'), b = $('stuck-b');
  b.onclick = () => { f.hidden = false; b.hidden = true; $('stuck-t').focus(); };
  $('stuck-x').onclick = () => { f.hidden = true; b.hidden = false; };
  $('stuck-go').onclick = async () => {
    const go = $('stuck-go'); go.disabled = true;
    const scr = ($('sort-ov') ? '取り込み一覧' : SCREEN_NAME[cur] || cur) + (innerWidth < 700 ? '(スマホ)' : innerWidth < 1100 ? '(タブレット)' : '(パソコン)');
    const r = await api({ kind: 'app_stuck', screen: scr, text: $('stuck-t').value, width: innerWidth }).catch(() => ({ ok: false, error: '通信できませんでした' }));
    go.disabled = false;
    if (!r.ok) { toast(r.error || '送信できませんでした'); return; }
    $('stuck-t').value = ''; f.hidden = true; b.hidden = false; toast('送信しました。ありがとうございます。改善した際は「更新情報」でお知らせします', 'ok');
  };
}
function show(t, quiet, keep) {
  editTimeReset();
  if (t === 'label') store.set('labelSeen', 1);
  if (!D) return;
  if (mLocked && MONEY_TABS.includes(t) && t !== 'cost') { mlockAsk(t); return; }
  if (tabLocked(t)) { toast(t === 'cost' ? '原価の画面は、店主が許可した方のみ閲覧できます' : '金額は、店主が表示を許可した方のみ閲覧できます'); t = 'today'; }
  if (t !== 'today' && t !== 'set' && SH(t)) t = 'today';
  const dir = tabs.indexOf(t) - tabs.indexOf(cur); if (t === 'set' && cur !== 'set') { supPrev = cur; loadSup(); } cur = t;
  if (t === 'mat') renderMat();
  if (t === 'label' && labelStale) renderLabel();
  tabs.forEach(x => { const el = $('t-' + x); el.hidden = x !== t; el.classList.remove('inR', 'inL'); });
  if (dir) { const el = $('t-' + t); void el.offsetWidth; el.classList.add(dir > 0 ? 'inR' : 'inL'); }
  document.querySelectorAll('nav button[data-t]').forEach(b => b.dataset.t === t ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
  document.querySelectorAll('#side button[data-tab]').forEach(b => b.dataset.tab === t ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
  store.set('tab', t); if (!keep) window.scrollTo(0, 0);
  setCrumb(null); renderBar(); hintClear(); if (!quiet) showHints(t);
  const seen = (() => { try { const k = 'shikomi:seen:' + t; if (localStorage.getItem(k)) return true; localStorage.setItem(k, '1'); } catch (e) {} return false; })();
  const busy = (t === 'hyg' && hygMissing().length) || (t === 'book' && unpaid().length);
  if (!quiet && (!seen || busy)) chat({ today: null, cost: '原価の一覧です。行を押すと、その商品の材料と量・作り方が表示されます。', label: '食品表示の案です。色の付いた箇所をご確認ください。', howto: '作り方の画面です。商品を押すと、手順と写真が表示されます。', mat: '材料の単価の画面です。「仮」の単価は、請求書を登録すると置き換わります。', set: '設定の画面です。AIのサイズや文字の大きさを変更できます。', hyg: hygMissing().length ? `本日の未記録の項目が${hygMissing().length}件あります。` : '本日の衛生記録はすべて完了しています。', ws: '卸の納品と請求書の画面です。', sales: '売上と粗利の画面です。精算レシートを撮影すると記録が増えていきます。', post: 'POPやInstagramの文章の作成をお手伝いします。', cal: '予定の画面です。納品・催事・休業日を登録すると、当日の「今日やること」に表示されます。', book: unpaid().length ? `未払いが${unpaid().length}件あります。支払いが完了したら「支払済にする」を押してください。` : '帳簿の画面です。請求書は月ごとに整理しています。' }[t], t === 'cost' ? 'clap' : t === 'label' ? 'point' : null);
}
// ---------- ふきだしヒント(初めてでも迷わない) ----------
// 画面ごとに1〜2個。「次へ」で進み、「今後表示しない」で全部止める。設定の「使い方のヒントを再表示」で戻る
const HINTS = {
  today: [{ sel: '#status', t: '今月の状況です。原価率と先月との差、上昇の要因が表示されます。' }, { sel: 'nav button[data-t="shot"], #side button[data-tab="shot"]', t: 'レシピ・請求書・材料の裏面表示は、ここから撮影して取り込みます。' }],
  cost: [{ sel: '#chara', t: 'ここを押して「バター 1kg 2,260円」と入力するだけで、材料の単価が更新されます。FAX・紙の請求書は「撮影」から取り込めます。' }, { sel: '#cost-table', t: '商品を押すと、材料ごとの原価と、売価・原価率の入力欄が表示されます。' }],
  label: [{ sel: '.label', t: 'レシピから食品表示の案を作成します。色の付いた箇所を確認し、ラベルを印刷できます。' }, { sel: '#qr-card', t: 'このQRを店頭に置くと、お客様がスマートフォンで商品ごとのアレルゲンを確認できます。' }],
  hyg: [{ sel: '#hyg-today', t: '始業時と終業時に、温度・体調・清掃をボタンで記録します。基準を外れた場合は、その場でお知らせします。' }],
  sales: [{ sel: '#gap-wrap', t: 'レシピから計算した材料費と、実際の仕入額の差です。ロスや分量のばらつきの把握に役立ちます。' }, { sel: '#course-wrap', t: 'コース・セット・宴会の売価を、原価から設定できます。' }],
  book: [{ sel: '#book-doc', t: '請求書のPDFや受発注システムのCSVは、ここからまとめて取り込めます。' }]
};
let hintEl = null;
function hintClear() { if (hintEl) { hintEl.classList.remove('hint-ring'); hintEl = null; } const h = $('hint'); if (h) h.hidden = true; }
function showHints(tab) {
  const h = $('hint'); if (!h || store.get('hintsOff', false)) return;
  const seen = store.get('hintSeen', {}); if (seen[tab]) return;
  const list = (HINTS[tab] || []).map(x => ({ ...x, el: document.querySelector(x.sel) })).filter(x => x.el && !x.el.hidden && x.el.getBoundingClientRect().width > 0);
  if (!list.length) return;
  let i = 0;
  const draw = () => {
    hintClear(); const x = list[i]; hintEl = x.el; x.el.classList.add('hint-ring'); try { x.el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {}
    h.hidden = false; h.innerHTML = `<p class="n">使い方のヒント ${i + 1}/${list.length}</p><p>${esc(x.t)}</p><div class="acts"><button class="btn ghost sm" type="button" id="hint-off">今後表示しない</button><button class="btn sm" type="button" id="hint-next">${i + 1 < list.length ? '次へ' : '分かった'}</button></div>`;
    $('hint-next').onclick = () => { i++; if (i < list.length) draw(); else { seen[tab] = 1; store.set('hintSeen', seen); hintClear(); } };
    $('hint-off').onclick = () => { store.set('hintsOff', true); hintClear(); toast('ヒントを非表示にしました。設定から再度表示できます'); };
  };
  setTimeout(draw, 500);
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
    const vis = tabs.filter(x => !SH(x) && !tabLocked(x)), i = vis.indexOf(cur) + (dx < 0 ? 1 : -1);
    if (i >= 0 && i < vis.length) show(vis[i], true);
  }, { passive: true });
})();
$('go-cam').onclick = openCamera;
$('nav-cam').onclick = openCamera;
// ---------- 設定 ----------
function renderSet() {
  const seg = (key, opts, cur) => `<div class="seg" data-key="${key}">${opts.map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${v === cur}">${l}</button>`).join('')}</div>`;
  const cyc = (D.stock || {}).cycle || '年1回';
  const grp = (t, k, body) => `<h1 class="sub">${t}</h1><div class="card sgrp">${body}</div>`;
  const stand = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const homeIcon = `<div class="card" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><b>${matchMedia('(pointer:coarse)').matches ? 'ホーム画面のアイコン' : 'パソコンのアイコン'}</b>${stand ? '<span class="pill">アイコンから起動しています(追加済み)</span>' : `<button class="btn sm" type="button" id="set-a2hs">${matchMedia('(pointer:coarse)').matches ? 'ホーム画面に追加' : 'パソコンに追加'}</button><span class="k">LINEやブラウザを経由せず、アイコンから開けるようにします</span>`}</div>`;
  $('set-box').innerHTML = '<h1 class="sub">この端末</h1>' + homeIcon + (PK_OK ? '<div class="card" id="pk-set"><b>顔認証・指紋認証のログイン</b><p class="k" style="margin:6px 0 0">読み込んでいます…</p></div>' : '') + (CF ? `<h1 class="sub">使い方ガイド</h1><div class="card" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><a class="btn ghost sm" href="/guide/start" target="_blank">初期設定(店主・管理者向け)</a><a class="btn ghost sm" href="/guide/daily" target="_blank">日々の操作(すべての利用者向け)</a><a class="btn ghost sm" href="/guide/faq" target="_blank">よくあるご質問(動画付き)</a><button class="btn ghost sm" type="button" id="hint-again">使い方のヒントを再表示</button></div>` : '') + grp('見え方', 'set', `
    <div class="set-row"><span>AIのサイズ</span>${seg('csize', [['s', '小'], ['m', '中'], ['l', '大']], store.get('csize', 'm'))}</div>
    <div class="set-row"><span>文字の大きさ</span>${seg('size', [['normal', '標準'], ['big', '大きめ']], store.get('size', 'normal'))}</div>
    <div class="set-row"><span>画面の色</span>${seg('theme', [['auto', '自動'], ['light', '明るい'], ['dark', '暗い']], store.get('theme', 'auto'))}</div>`) + grp('店舗の運用設定', 'stock', `
    ${SH('stock') ? '' : `<div class="set-row"><span>棚卸<br><span class="k">店舗全体で共通</span></span>${seg('cycle', [['毎月', '毎月'], ['年1回', '年1回']], cyc)}</div>`}
    <div class="set-row"><span>販売方法<br><span class="k">対面販売・店内飲食が中心の店舗では、食品表示ラベルよりもアレルゲン一覧表が中心になります</span></span>${seg('sell', [['pack', '包装して販売'], ['face', '対面販売・店内飲食']], (D.shopInfo || {}).sell || 'pack')}</div>
    ${noMoney() || !PL('target') ? '' : `<div class="set-row"><span>目標原価率<br><span class="k">税抜で計算します。売価の目安はこの値から算出します</span></span><span style="display:flex;gap:8px;align-items:center"><input id="tg-v" inputmode="decimal" style="width:4.5em" value="${(D.shopInfo || {}).targetRate || 30}"><span class="k">%</span><button class="btn ghost sm" type="button" id="tg-save">決定</button></span></div>`}
    ${D.plan ? `<div class="set-row" style="display:block"><span>プランと使える量<br><span class="k">${esc(D.plan.planName)}プランです。プランの変更は運営にご相談ください</span></span>${planUse()}</div>` : ''}
    ${D.me && D.me.owner ? `<div class="set-row" style="display:block"><span>税率<br><span class="k">売価は税込で入力します。原価率は税抜で計算します</span></span>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px"><span class="k">持ち帰り</span><input id="tx-to" inputmode="decimal" style="width:4.5em" value="${((D.shopInfo || {}).tax || {}).takeout ?? 8}"><span class="k">%</span><span class="k" style="margin-left:8px">店内</span><input id="tx-ei" inputmode="decimal" style="width:4.5em" value="${((D.shopInfo || {}).tax || {}).eatin ?? 10}"><span class="k">%</span></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px"><span class="k">持ち帰りの税率の変更日</span><input id="tx-from" type="date" style="width:auto" value="${(((D.shopInfo || {}).tax || {}).next || {}).from || ''}"><span class="k">から</span><input id="tx-next" inputmode="decimal" style="width:4.5em" placeholder="例 1" value="${(((D.shopInfo || {}).tax || {}).next || {}).rate ?? ''}"><span class="k">%</span></div>
      <p class="k" style="margin:8px 0 0">法改正により税率が変わる場合は、変更日と税率を入力してください。その日から自動で切り替わります。</p>
      <div class="ask"><button class="btn ghost sm" type="button" id="tx-save">税率を保存</button></div></div>` : ''}
    ${D.me && D.me.owner && PL('sales') && !SH('regclose') ? `<div class="set-row" style="display:block"><span>レジ<br><span class="k">POSレジの有無によって、閉店後のレジ締めの方法が変わります。釣銭準備金は、毎朝レジに用意しておく金額です</span></span><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px">${seg('regmode', [['pos', 'POSレジがある'], ['none', 'POSレジはない']], (D.reg || {}).mode || '')}<span class="k">釣銭準備金</span><input id="rg-fl" inputmode="numeric" style="width:7em" value="${(D.reg || {}).float || ''}" aria-label="釣銭準備金"><span class="k">円</span><button class="btn ghost sm" type="button" id="rg-fls">決定</button></div></div>` : ''}
    ${D.me && D.me.owner ? `<div class="set-row"><span>金額表示のロック<br><span class="k">店舗のタブレットを置いたままにしても、売上や原価を見られないようにします。設定した時間操作がないと非表示になり、再表示には各自の4桁の暗証番号が必要です</span></span><div class="seg" id="mlock-seg">${[[0, '使用しない'], [5, '5分'], [10, '10分'], [30, '30分']].map(([v, l]) => `<button type="button" data-ml="${v}" aria-pressed="${((MLOCK || {}).min || 0) === v}">${l}</button>`).join('')}</div></div>` : ''}
    ${D.me && D.me.owner && (D.jobList || []).length ? `<div class="set-row" style="display:block"><span>利用する業務<br><span class="k">選択した業務の画面が、メニューの上位に表示されます。撮影・取り込み一覧・原価・食品表示・衛生・帳簿は常に表示されます。その他の画面は「その他の機能」から開けます</span></span><div class="seg" id="jobs" style="flex-wrap:wrap;margin-top:8px">${D.jobList.map(([k, l]) => `<button type="button" data-k="${k}" aria-pressed="${jobsNow().includes(k)}">${l}</button>`).join('')}</div></div>` : ''}
    ${D.me && D.me.owner && CF ? `<div class="set-row" style="display:block"><span>店舗のデータを書き出す<br><span class="k">店舗の記録をすべて、いつでも書き出せます(解約時も同様です)。表ごとのCSVはExcelで開けます。店主のみ利用できます</span></span><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn sm" type="button" id="exp-all">すべて書き出す</button></div><div id="exp-list" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"></div></div>` : ''}
    ${D.me && D.me.owner && (D.hideable || []).length ? `<div class="set-row" style="display:block"><span>表示する画面<br><span class="k">使わない画面を非表示にすると、メニューに表示されなくなります。データは削除されず、いつでも再表示できます</span></span><div class="seg" id="hide-tabs" style="flex-wrap:wrap;margin-top:8px">${D.hideable.map(([k, l]) => `<button type="button" data-k="${k}" aria-pressed="${!(D.hidden || []).includes(k)}">${l}</button>`).join('')}</div></div>` : ''}
    <div class="set-row"><span>業種<br><span class="k">AIへの補足情報として使います。画面や機能は変わりません</span>${(D.words || {}).biz ? '' : '<br><span class="pill">未記入</span>'}</span>${seg('biz', ((D.words || {}).list || []).map(b => [b, b]), (D.words || {}).biz)}</div>
    `) + grp('お知らせ', 'hyg', `
    <div class="set-row"><span>衛生記録のお知らせ<br><span class="k">未記録の場合に、LINEでお知らせする時刻</span></span><div class="seg" id="hygnotice" style="flex-wrap:wrap;justify-content:flex-end">${[['off', '送らない'], ['9', '9時'], ['12', '12時'], ['15', '15時'], ['17', '17時'], ['19', '19時'], ['21', '21時']].map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${String((D.shopInfo || {}).hygNotice || '17') === v}">${l}</button>`).join('')}</div></div>
    <div class="set-row"><span>定休日<br><span class="k">衛生記録のお知らせを停止</span></span><div class="seg" id="closed">${['月', '火', '水', '木', '金', '土', '日'].map(w => `<button type="button" data-w="${w}" aria-pressed="${((D.shopInfo || {}).closed || '').includes(w)}">${w}</button>`).join('')}</div></div>
    `) + (D.me && D.me.owner ? grp('オプション', 'set', optBox()) : '') + grp('仕入先・卸先', 'book', '<p class="k" style="margin:0 0 8px">電話番号・担当者・振込先の一覧は、メニューの「仕入先・卸先」にあります</p><button class="btn ghost" type="button" id="set-ct">仕入先・卸先の一覧を開く</button>') + grp('店舗情報', 'ws', `<p class="k" style="margin:0 0 8px">卸の請求書と、ラベルの製造者欄に記載されます</p>
    <div class="set-row" style="display:block;padding-top:0">
      <div class="fld" style="margin-top:8px">${[['name', '店名'], ['rep', '代表者'], ['addr', '住所'], ['tel', '電話'], ['fax', 'FAX'], ['reg', '登録番号(T〜)'], ['bank', '振込先']].map(([k, l]) => `<span class="k">${l}</span><input data-shop="${k}" value="${esc((D.shopInfo || {})[k] || '')}">`).join('')}</div>
      <div class="ask"><button class="btn" type="button" id="shop-save">店舗情報を保存</button></div></div>`) + grp('データの取り扱い', 'label', `
    <ul class="k" style="margin:0;padding-left:1.2em;line-height:1.9">
      <li>撮影した写真や記録は、店舗のデータ作成のためにのみ使用します。</li>
      <li>読み取りに使用するAI(Anthropic社)の商用サービスでは、お客様のデータをAIの学習に使用しないことが定められています。</li>
      <li>データは店舗ごとに分けて管理し、閲覧できるのは招待したメンバーのみです。</li>
      <li>解約時は、記録をまとめて書き出してお渡しし、残りのデータは削除します。</li>
    </ul>`) + `
    <div class="set-row" style="padding:8px 4px"><span class="k">${esc(D.shop)} · ${new Date(D.at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 時点</span><span class="seg"><button type="button" id="reload">再読み込み</button></span></div>`;
  $('set-box').querySelectorAll('.seg[data-key] button').forEach(b => b.onclick = () => {
    const key = b.parentNode.dataset.key, v = b.dataset.v;
    if (key === 'cycle') { setValueX({ field: 'cycle', value: v }); return; }
    if (key === 'biz' || key === 'sell' || key === 'unitword') { setValueX({ field: key, value: v }); return; }
    if (key === 'regmode') { setValueX({ field: 'regset', value: { mode: v } }); return; }
    store.set(key, v);
    if (key === 'pack') { location.reload(); return; }
    applyLook(); renderSet();
  });
  $('set-box').querySelectorAll('[data-ml]').forEach(b => b.onclick = async () => {
    const min = +b.dataset.ml, r = await api({ kind: 'app_mlock_cfg', min });
    if (!r.ok) { toast(r.error || '変更できませんでした'); return; }
    MLOCK = min ? r.mlock : null; try { sessionStorage.setItem(MLK, String(Date.now())); } catch (e) {} mLocked = false; clearInterval(mlockTimer); mlockTimer = null; mlockInit(); renderSet();
    toast(min ? `金額の表示は、${min}分間操作がないと非表示にする設定にしました` : '金額表示のロックを解除しました', 'ok');
    if (min && !r.mlock.hasPin) setTimeout(() => mlockAsk(), 300);
  });
  pkLoad();
  $('reload').onclick = () => location.reload();
  if ($('set-a2hs')) $('set-a2hs').onclick = async () => {
    if (IN_LINE) { const base = location.origin + location.pathname.replace(/^\/l\//, '/'); if (!(await openOutside(base))) location.href = base + '?openExternalBrowser=1'; return; }
    if (a2hsEvt) { const ev = a2hsEvt; ev.prompt(); const r = await ev.userChoice.catch(() => null); a2hsEvt = null; if (r && r.outcome === 'accepted') toast('ホーム画面に追加しました', 'ok'); return; }
    a2hsHelp();
  };
  $('set-ct').onclick = () => show('ct');
  document.querySelectorAll('[data-optgo]').forEach(b => b.onclick = () => openOrder());
  document.querySelectorAll('[data-optask]').forEach(b => b.onclick = async () => {
    const nm = { order: '発注書(FAXで送る)', spec: '商品規格書の書き出し' }[b.dataset.optask]; b.disabled = true;
    const r = await api({ kind: 'app_contact', cat: 'その他', text: `オプション「${nm}」の利用を申し込みます。` }).catch(() => ({ ok: false }));
    b.disabled = false; toast(r.ok ? `「${nm}」のお申し込みを送信しました。運営よりご連絡します` : (r.error || '送信できませんでした'), r.ok ? 'ok' : undefined);
  });
  renderMembers();
  const nb = document.querySelector('nav button[data-t="book"]'); if (nb) nb.style.display = noMoney() ? 'none' : '';
  $('hygnotice').querySelectorAll('button').forEach(b => b.onclick = () => setValueX({ field: 'hygnotice', value: b.dataset.v }));
  $('closed').querySelectorAll('button').forEach(b => b.onclick = () => { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); const v = [...$('closed').querySelectorAll('[aria-pressed="true"]')].map(x => x.dataset.w).join(''); setValueX({ field: 'closed', value: v }); });
  if (false && $('ai-cap-save')) $('ai-cap-save').onclick = () => { const v = parseFloat($('ai-cap').value); if (!(v >= 100 && v <= 30000)) { $('ai-cap').focus(); chat('上限は100〜30,000円の範囲で入力してください'); return; } setValueX({ field: 'aicap', value: v }); };
  if ($('uw-save')) $('uw-save').onclick = () => { const v = $('uw-v').value.trim(); if (!v) { $('uw-v').focus(); return; } setValueX({ field: 'unitword', value: v }); };
  if ($('exp-all')) $('exp-all').onclick = async () => {
    const b = $('exp-all'); b.disabled = true; const r = await api({ kind: 'app_export_all' }).catch(() => ({ ok: false, error: '通信できませんでした' })); b.disabled = false;
    if (!r.ok) { toast(r.error || '書き出せませんでした', 'ng'); return; }
    const day = new Date().toISOString().slice(0, 10), nm = String(r.shop || '店舗').replace(/[\\/:*?"<>|]/g, '');
    const save = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); };
    save(new Blob([JSON.stringify({ shop: r.shop, at: new Date(r.at).toISOString(), sheets: r.sheets }, null, 1)], { type: 'application/json' }), `${nm}_全データ_${day}.json`);
    const csv = rows => '\ufeff' + rows.map(row => row.map(v => { const t = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v); return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; }).join(',')).join('\r\n');
    $('exp-list').innerHTML = '<span class="k" style="width:100%">表ごとのCSV:</span>' + r.sheets.map((x, i) => `<button class="btn ghost sm" type="button" data-exp="${i}">${esc(x.name)}</button>`).join('');
    $('exp-list').querySelectorAll('[data-exp]').forEach(e => e.onclick = () => { const x = r.sheets[+e.dataset.exp]; save(new Blob([csv(x.rows)], { type: 'text/csv' }), `${nm}_${x.name}_${day}.csv`); });
    toast('全データを書き出しました。表ごとのCSVは下のボタンから保存できます', 'ok');
  };
  if ($('jobs')) $('jobs').querySelectorAll('button').forEach(b => b.onclick = () => { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); setValueX({ field: 'jobs', value: [...$('jobs').querySelectorAll('[aria-pressed="true"]')].map(x => x.dataset.k) }); });
  if ($('hide-tabs')) $('hide-tabs').querySelectorAll('button').forEach(b => b.onclick = () => { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); setValueX({ field: 'hidetabs', value: [...$('hide-tabs').querySelectorAll('[aria-pressed="false"]')].map(x => x.dataset.k) }); });
  if ($('rg-fls')) $('rg-fls').onclick = () => setValueX({ field: 'regset', value: { float: $('rg-fl').value.trim() || '0' } });
  if ($('tg-save')) $('tg-save').onclick = () => { const v = parseFloat($('tg-v').value); if (!(v >= 5 && v <= 90)) { $('tg-v').focus(); chat('目標原価率は5〜90(%)の範囲で入力してください'); return; } setValueX({ field: 'target', value: v }); };
  if ($('tx-save')) $('tx-save').onclick = () => setValueX({ field: 'tax', value: { takeout: $('tx-to').value.trim(), eatin: $('tx-ei').value.trim(), next: $('tx-next').value.trim(), from: $('tx-from').value } });
  $('shop-save').onclick = () => { const v = {}; $('set-box').querySelectorAll('[data-shop]').forEach(i => v[i.dataset.shop] = i.value.trim()); setValueX({ field: 'shop', value: v }); };
  renderBanks();
}
// ---------- 問い合わせ(まずAIが答え、解決しなければ担当へ) ----------
$('ct-cat').querySelectorAll('button').forEach(b => b.onclick = () => $('ct-cat').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)));
const APPV = ((document.querySelector('script[src*="app.js"]') || {}).src || '').split('v=')[1] || '';
var supPrev = 'today';
$('ct-go').onclick = async () => {
  const text = $('ct-text').value.trim(), cat = ($('ct-cat').querySelector('[aria-pressed="true"]') || {}).dataset?.v || 'その他';
  if (!text) { chat('内容を入力してください'); $('ct-text').focus(); return; }
  if (!CF) {   // 前の形(Google版)は、そのまま送る
    const out = await api({ kind: 'app_contact', cat, text }); chat(out.ok ? 'お問い合わせを送信しました' : (out.error || '送信できませんでした'), out.ok ? 'heart' : undefined); if (out.ok) $('ct-text').value = ''; return;
  }
  const go = $('ct-go'), box = $('ct-ans'); go.disabled = true; box.hidden = false;
  box.innerHTML = '<div class="sup-ans"><p class="k">確認しています…</p></div>';
  try {
    const out = await api({ kind: 'sup_ask', cat, text, screen: supPrev, ver: APPV });
    if (!out.ok) throw new Error(out.error);
    $('ct-text').value = '';
    if (out.sent) { box.innerHTML = '<div class="sup-ans"><p>担当者に送信しました。回答はこの画面とLINEでお知らせします。</p></div>'; loadSup(); return; }
    box.innerHTML = `<div class="sup-ans"><div class="who">AIの回答</div><p>${esc(out.answer)}</p></div>
      <p class="k" style="margin:12px 0 8px">${out.needHuman ? 'この内容は担当の確認が必要かもしれません。' : '解決しましたか?'}</p>
      <div class="ask" style="margin:0"><button class="btn ${out.needHuman ? '' : 'ghost'}" type="button" id="sup-h">担当者に問い合わせる</button><button class="btn ${out.needHuman ? 'ghost' : ''}" type="button" id="sup-ok">解決しました</button></div>
      <div id="sup-note" hidden style="margin-top:8px"><textarea id="sup-note-t" rows="3" maxlength="2000" placeholder="担当者への補足があればご入力ください(任意)" aria-label="担当者への補足"></textarea><div class="ask"><button class="btn" type="button" id="sup-send">担当者に送信</button></div></div>`;
    $('sup-ok').onclick = async () => { await api({ kind: 'sup_solved', id: out.id }); box.innerHTML = '<div class="sup-ans"><p>解決してよかったです。ほかにもご不明な点があれば、いつでもお問い合わせください。</p></div>'; chat('解決してよかったです', 'heart'); };
    $('sup-h').onclick = () => { $('sup-note').hidden = false; $('sup-note-t').focus(); };
    $('sup-send').onclick = async () => {
      const r = await api({ kind: 'sup_human', id: out.id, text: $('sup-note-t').value.trim() });
      if (!r.ok) { chat(r.error || '送信できませんでした'); return; }
      box.innerHTML = '<div class="sup-ans"><p>担当者に送信しました。回答はこの画面とLINEでお知らせします。</p></div>'; chat('担当者に送信しました', 'heart'); loadSup();
    };
  } catch (e) { box.innerHTML = `<div class="sup-ans"><p>${esc((e && e.message) || '送れませんでした。電波のよいところでもう一度どうぞ')}</p></div>`; }
  finally { go.disabled = false; }
};
// これまでのお問い合わせ(担当からのお返事があれば、設定に印)
const SUP_ST = { new: ['担当者が確認中', 'gray'], open: ['担当者が対応中', 'gray'], wait: ['回答があります', 'warn'], done: ['完了', ''] };
async function loadSup() {
  if (!CF) return;
  let r; try { r = await api({ kind: 'sup_list' }); } catch (e) { return; }
  if (!r || !r.ok) return;
  const ts = r.tickets || [], unread = ts.filter(t => t.status === 'wait').length, bs = $('badge-set');
  if (bs) bs.hidden = !unread;
  const box = $('ct-hist'); box.hidden = !ts.length; if (!ts.length) return;
  box.innerHTML = `<h2 class="ch">これまでのお問い合わせ</h2>` + ts.map(t => { const st = SUP_ST[t.status] || ['', ''];
    return `<details class="sup-t"${t.status === 'wait' ? ' open' : ''}><summary><span><b>${esc(t.title)}</b><span class="k" style="display:block">${esc(t.cat)}・${new Date(t.created).toLocaleDateString('ja-JP')}</span></span><span class="pill ${st[1]}">${st[0]}</span></summary>
      ${t.msgs.map(m => `<div class="sup-m ${m.sender === 'ops' ? 'ops' : ''}"><span class="who">${m.sender === 'ops' ? '担当' : m.sender === 'ai' ? 'AI' : 'あなた'}・${new Date(m.at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>${esc(m.text)}</div>`).join('')}
      <div class="ask" style="margin-top:8px"><input id="sup-r-${t.id}" placeholder="${t.status === 'done' ? '続けて聞く' : '返事を書く'}" style="flex:1;min-width:0;width:auto" aria-label="追記する"><button class="btn ghost sm" type="button" data-sup="${t.id}">送る</button></div></details>`; }).join('');
  box.querySelectorAll('[data-sup]').forEach(b => b.onclick = async () => { const i = $('sup-r-' + b.dataset.sup), text = i.value.trim(); if (!text) { i.focus(); return; } b.disabled = true; const x = await api({ kind: 'sup_msg', id: b.dataset.sup, text }); b.disabled = false; if (!x.ok) { chat(x.error || '送信できませんでした'); return; } chat('担当者に送信しました', 'heart'); loadSup(); });
}
// ---------- 衛生記録 ----------
const hygMissing = () => (D && D.hyg && !D.closedToday) ? D.hyg.today.missing : [];
// 基準を外れた場合の対応: よくある対応を押して入れる
function fixActs(f) {
  if (/体調/.test(f.label)) return ['食品を扱わない作業に変更した', '休ませた', '手袋をして作業した', '医療機関の受診を指示した'];
  if (/[-\d.]+\s*$/.test(f.label) && !/NG$/.test(f.label)) return ['扉を閉め直し、30分後に再測定した', '温度設定を修正した', '詰め込みすぎを解消した', '中身を別の冷蔵庫に移した', '中身を廃棄した', '修理を依頼した'];
  if (/受入/.test(f.label)) return ['返品した', '交換を依頼した', '使用を中止して分けた'];
  if (/加熱/.test(f.label)) return ['再加熱した', '廃棄した'];
  return ['やり直した', '店主に伝えた', '交換・修理を依頼した'];
}
// 衛生管理計画: 一般衛生管理の7つ(いつ・方法・問題があった場合)と、重要管理(商品を3つに分ける)。印刷して保健所に見せる
function renderHygPlan(own) {
  const box = $('hyg-plan'), P = D.hyg && D.hyg.plan; if (!box) return;
  if (!P) { box.innerHTML = '<p class="k" style="margin:0">読み込めませんでした</p>'; return; }
  const goods = D.products.filter(p => p.kind !== 'part');
  box.innerHTML = `<p class="k" style="margin:0 0 8px">保健所の確認では「計画」と「記録」の両方が求められます。下の計画には、標準の文例が入っています。店舗の運用に合わせて編集し、印刷して記録表と一緒に保管してください。${P.made ? `(最終更新日 ${esc(P.made)})` : ''}</p>
    <div class="row" style="gap:8px;flex-wrap:wrap"><span class="k">衛生の責任者</span>${own ? `<input id="hp-resp" value="${esc(P.resp)}" placeholder="例: 山田" maxlength="30" style="width:10em"><button class="btn ghost sm" type="button" id="hp-resp-go">決定</button>` : `<b>${esc(P.resp || '未記入')}</b>`}</div>
    <h2 class="ch" style="margin-top:14px">一般衛生管理</h2>
    <div class="scroll"><table class="hp-tbl"><thead><tr><th>項目</th><th>いつ</th><th>方法</th><th>問題があった場合</th>${own ? '<th></th>' : ''}</tr></thead><tbody>
    ${P.gen.map((g, i) => `<tr><td>${esc(g.name)}</td><td data-l="いつ">${esc(g.when)}</td><td data-l="方法">${esc(g.how)}</td><td data-l="問題があった場合">${esc(g.ng)}</td>${own ? `<td><button class="btn ghost sm" type="button" data-hpe="${i}">編集</button></td>` : ''}</tr>
      ${own ? `<tr id="hp-ed-${i}" hidden><td colspan="5"><div class="fld"><span class="k">いつ</span><input id="hp-w-${i}" value="${esc(g.when)}" maxlength="40"><span class="k">方法</span><input id="hp-h-${i}" value="${esc(g.how)}" maxlength="120"><span class="k">問題があった場合</span><input id="hp-n-${i}" value="${esc(g.ng)}" maxlength="120"></div><div class="ask"><button class="btn sm" type="button" data-hps="${i}">保存</button></div></td></tr>` : ''}`).join('')}
    </tbody></table></div>
    <div id="hp-pick" hidden style="margin-top:10px"></div>
    <div class="ask" style="margin-top:12px"><button class="btn" type="button" id="hp-print">衛生管理計画を印刷・PDF</button></div>`;
  if ($('hp-resp-go')) $('hp-resp-go').onclick = () => setValueX({ field: 'hygplan', value: { resp: $('hp-resp').value.trim() } });
  box.querySelectorAll('[data-hpe]').forEach(b => b.onclick = () => { const e = $('hp-ed-' + b.dataset.hpe); e.hidden = !e.hidden; b.textContent = e.hidden ? '編集' : '閉じる'; });
  box.querySelectorAll('[data-hps]').forEach(b => b.onclick = () => { const i = b.dataset.hps; setValueX({ field: 'hygplan', value: { gen: P.gen[i].key, when: $('hp-w-' + i).value, how: $('hp-h-' + i).value, ng: $('hp-n-' + i).value } }); });
  const canG = own || perm('recipe');
  box.querySelectorAll('[data-hgp]').forEach(b => b.onclick = () => {
    if (!canG) { toast('商品の分類は、店主またはレシピの編集権限がある方が設定します'); return; }
    const n = b.dataset.hgp, pk = $('hp-pick');
    pk.hidden = false; pk.innerHTML = `<b>${esc(n)}</b> を<div class="seg" style="flex-wrap:wrap;margin-top:6px">${P.groups.map(g => `<button type="button" data-v="${g.key}" aria-pressed="${b.dataset.g === g.key}">第${g.key} ${esc(g.name)}</button>`).join('')}<button type="button" data-v="">分けない</button></div>`;
    pk.querySelectorAll('button').forEach(x => x.onclick = () => setValueX({ field: 'hgrp', product: n, value: x.dataset.v }));
    pk.scrollIntoView({ block: 'nearest' });
  });
  $('hp-print').onclick = () => openPrint(`<h2>衛生管理計画</h2><p>${esc(D.shop)} ・ 作成 ${esc(P.made || new Date().toLocaleDateString('sv-SE'))} ・ 責任者 ${esc(P.resp || '　　　　　')}</p>
    <h3>一般衛生管理</h3><table><thead><tr><th>項目</th><th>いつ</th><th>方法</th><th>問題があった場合</th></tr></thead><tbody>${P.gen.map(g => `<tr><td>${esc(g.name)}</td><td>${esc(g.when)}</td><td>${esc(g.how)}</td><td>${esc(g.ng)}</td></tr>`).join('')}</tbody></table>
    <h3>重要管理</h3><table><thead><tr><th>分け方</th><th>商品</th><th>確認方法</th></tr></thead><tbody>${P.groups.map(g => `<tr><td>第${g.key}グループ<br>${esc(g.name)}</td><td>${g.items.map(esc).join('、') || '—'}</td><td>${esc(g.how)}</td></tr>`).join('')}</tbody></table>
    <p style="font-size:12px">記録は「衛生管理記録」(月次の記録表)に残します。計画は、製造方法や商品が変わった際に見直します。</p>`);
}
function renderHyg() {
  if (!D.hyg) { $('hyg-today').innerHTML = '<p class="k" style="margin:0">読み込めませんでした</p>'; return; }
  const t = D.hyg.today, own = !!(D.me && D.me.owner), me = (D.me && D.me.name) || '';
  const range = it => it.kind === 'temp' ? `目安 ${it.lo ?? ''}〜${it.hi ?? ''}℃` : '点検';
  const recPill = r => r ? `<span class="pill ${r.j === 'OK' ? '' : 'warn'}">${esc(String(r.v))}${typeof r.v === 'number' ? '℃' : ''}</span>` : '';
  // 今日の温度と点検: 朝 / 終業時 / いつでも に分けて、それぞれで記録する
  const WN = { '朝': '朝', '夕': '終業時', '': 'いつでも' };
  const group = g => t.items.map((it, i) => ({ it, i, xs: it.slots.map((x, j) => ({ x, j })).filter(o => o.x.s === g) })).filter(o => o.xs.length);
  const rowsHtml = g => group(g).map(({ it, i, xs }) => `<div class="hy-row"><div class="hy-nm"><b>${esc(it.name)}</b><span class="k">${range(it)}</span></div>
      <div class="hy-vals">${xs.map(({ x, j }) => `<div class="hy-slot">${it.kind === 'temp' ? `<input id="hy-${i}-${j}" inputmode="decimal" placeholder="${x.rec ? esc(String(x.rec.v)) : '℃'}" aria-label="${esc(it.name)}${x.s}の温度">` : `<span class="seg" data-hy="${i}-${j}"><button type="button" data-v="OK" aria-pressed="false">OK</button><button type="button" data-v="NG" aria-pressed="false">NG</button></span>`}${recPill(x.rec)}</div>`).join('')}</div></div>`).join('');
  const left = g => group(g).reduce((n, o) => n + o.xs.filter(({ x }) => !x.rec).length, 0);
  const cardHtml = g => `<div class="hy-h"><span>${WN[g]}</span><span class="pill ${left(g) ? 'gray' : ''}">${left(g) ? 'あと' + left(g) + 'つ' : '済'}</span></div>
    <div class="hy-list">${rowsHtml(g)}</div><div class="ask"><button class="btn" type="button" data-hygo="${g}">記録する</button></div>`;
  $('hyg-st').textContent = `${md(t.date)} ・ ${D.closedToday ? '定休日' : t.missing.length ? '未記録 ' + t.missing.length + '件' : 'すべて記録済み'}`;
  const gAny = group('').length;
  $('hyg-today').innerHTML = (group('朝').length ? cardHtml('朝') : '') + (gAny ? cardHtml('') : '') || '<p class="k" style="margin:10px 0 0">本日記録する項目はありません。</p>';
  $('hyg-eve').hidden = !group('夕').length; $('hyg-eve').innerHTML = group('夕').length ? cardHtml('夕') : '';
  (group('夕').length ? $('hyg-eve') : $('hyg-today')).insertAdjacentHTML('beforeend', `<p class="k" style="margin:8px 0 0">${VIA}「冷蔵 3 冷凍 -18」「掃除OK」と入力しても記録できます(14時より前は朝、14時以降は夕として記録)。</p>`);
  ['hyg-today', 'hyg-eve'].forEach(id => $(id).querySelectorAll('[data-hy] button').forEach(b => b.onclick = () => { b.parentNode.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); }));
  document.querySelectorAll('[data-hygo]').forEach(btn => btn.onclick = () => { const g = btn.dataset.hygo, v = {};
    group(g).forEach(({ it, i, xs }) => xs.forEach(({ x, j }) => { const key = it.name + (x.s ? '|' + x.s : '');
      if (it.kind === 'temp') { const val = $(`hy-${i}-${j}`).value.trim(); if (val) v[key] = val; } else { const p = document.querySelector(`[data-hy="${i}-${j}"] [aria-pressed="true"]`); if (p) v[key] = p.dataset.v; } }));
    if (!Object.keys(v).length) { chat('温度または点検結果を入力してから押してください'); return; } setValueX({ field: 'hyg', value: v }); });
  // 基準を外れた場合の対応
  const fx = $('hyg-fix');
  fx.hidden = !t.fixes.length;
  fx.innerHTML = t.fixes.length ? `<h2 class="ch">対応を残す <span class="pill warn">${t.fixes.length}件</span></h2><p class="k" style="margin:0 0 8px">基準を外れた記録には、実施した対応を残します。保健所の確認でも参照される項目です。</p>
    ${t.fixes.map((f, i) => `<div style="margin-top:12px"><b>${esc(f.label)}</b><div class="fx-chips">${fixActs(f).map(a => `<button type="button" data-fxa="${i}">${esc(a)}</button>`).join('')}</div><div class="ask" style="margin-top:4px"><input id="fx-${i}" placeholder="例: 扉を閉め直し、30分後に4℃を確認" style="flex:1;min-width:0;width:auto"><button class="btn ghost" type="button" data-fx="${i}">残す</button></div></div>`).join('')}` : '';
  fx.querySelectorAll('[data-fxa]').forEach(b => b.onclick = () => { const inp = $('fx-' + b.dataset.fxa), v = inp.value.trim(); inp.value = v ? v + '、' + b.textContent : b.textContent; inp.focus(); });
  fx.querySelectorAll('[data-fx]').forEach(b => b.onclick = () => { const f = t.fixes[b.dataset.fx], text = $('fx-' + b.dataset.fx).value.trim(); if (!text) { $('fx-' + b.dataset.fx).focus(); return; } setValueX({ field: 'hygfix', value: { sheet: f.sheet, row: f.row, text } }); });
  // 体調チェック表(1人ずつ)
  const H = t.health || { cols: [], people: [] }, ppl = H.people.slice();
  if (me && !ppl.some(p => p.name === me)) ppl.unshift({ name: me, rec: null });
  const mark = v => v === '×' ? '<b class="ng">×</b>' : v === '○' ? '○' : '';
  $('hyg-health').innerHTML = `<p class="k" style="margin:10px 0 4px">作業前に1人ずつ記録します。×が1つでもある場合は、店主にお知らせします。LINEで「体調OK」と送信しても記録できます。</p>
    ${ppl.map((p, i) => { const r = p.rec, mine = p.name === me, can = mine || own;
      const st = r ? `<span class="pill ${r.j === '要注意' ? 'warn' : r.j === '休み' ? 'gray' : ''}">${r.j === 'OK' ? '記録済み' : esc(r.j)}</span>` : '<span class="pill gray">未記録</span>';
      const body = r ? (r.j === '休み' ? '' : `<div class="hc-marks">${H.cols.map((c, j) => `<span class="hc-m ${r.v[j] === '×' ? 'ng' : ''}">${esc(c)} ${r.v[j] === '×' ? '×' : '○'}</span>`).join('')}</div>`)
        : can ? `<div class="hc-marks">${H.cols.map((c, j) => `<button type="button" class="hc-t" data-hp="${i}" data-j="${j}" aria-pressed="true">${esc(c)} <b>○</b></button>`).join('')}</div>
          <div class="ask" style="margin-top:8px"><button class="btn sm" type="button" data-hgo="${i}">つける</button>${own && !mine ? `<button class="btn ghost sm" type="button" data-hoff="${i}">休み</button>` : ''}</div>` : '';
      return `<div class="hpx"><div class="row"><b>${esc(p.name)}</b>${st}</div>${body}</div>`; }).join('')}
    <p class="k" style="margin:12px 0 0">○は「問題なし」です。該当する項目を押して×にします(発熱・せき、下痢・おう吐、手の傷は、症状があれば×。手洗い・服装は、できていなければ×)。</p>`;
  $('hyg-health').querySelectorAll('.hc-t').forEach(b => b.onclick = () => { const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on); b.querySelector('b').textContent = on ? '○' : '×'; b.classList.toggle('ng', !on); });
  $('hyg-health').querySelectorAll('[data-hgo]').forEach(b => b.onclick = () => { const i = b.dataset.hgo, marks = [...$('hyg-health').querySelectorAll(`.hc-t[data-hp="${i}"]`)].map(x => x.getAttribute('aria-pressed') === 'true'); setValueX({ field: 'health', value: { person: ppl[i].name, marks } }); });
  $('hyg-health').querySelectorAll('[data-hoff]').forEach(b => b.onclick = () => setValueX({ field: 'health', value: { person: ppl[b.dataset.hoff].name, off: true } }));
  // 機器と点検の項目(店主)
  const ib = $('hyg-items'); ib.hidden = !own; $('hyg-items-wrap').hidden = !own;
  if (own) {
    ib.innerHTML = `<p class="k" style="margin:10px 0 8px">冷蔵庫・冷凍庫は台数の制限なく、1台ずつ名前を付けて追加できます。ショーケース・温蔵庫・清掃などの点検も追加できます。</p>
      <div class="ask" style="margin:0 0 10px"><button class="btn ghost sm" type="button" id="hi-std">手引書の点検項目を追加(受入れ・器具の消毒・トイレ・加熱の確認)</button></div>
      <div class="hy-list">${t.items.map((it, i) => `<div class="hy-row"><div class="hy-nm"><b>${esc(it.name)}</b><span class="k">${range(it)}・${{ '朝': '朝', '夕': '終業時', '朝夕': '朝と夕', '': 'いつでも' }[it.when || '']}</span></div><button class="btn ghost sm" type="button" data-hiopen="${i}">編集</button>
        <div class="hy-ed" id="hi-ed-${i}" hidden>${it.kind === 'temp' ? `<label class="k">目安</label><input id="hi-lo-${i}" inputmode="decimal" value="${it.lo ?? ''}" aria-label="${esc(it.name)}の下限"><span class="k">〜</span><input id="hi-hi-${i}" inputmode="decimal" value="${it.hi ?? ''}" aria-label="${esc(it.name)}の上限"><span class="k">℃</span>` : ''}
          <select id="hi-t-${i}" aria-label="${esc(it.name)}を記録するとき">${[['朝夕', '始業時と終業時(2回)'], ['朝', '朝'], ['夕', '終業時'], ['', '随時(1回)']].map(([v, l]) => `<option value="${v}"${(it.when || '') === v ? ' selected' : ''}>${l}</option>`).join('')}</select>
          <div class="ask" style="margin:0;width:100%"><button class="btn sm" type="button" data-hie="${i}">保存</button><button class="btn ghost sm" type="button" data-hio="${i}">記録を停止</button></div></div></div>`).join('')}</div>
      <div class="hy-add"><input id="hi-name" placeholder="名前(例: 冷蔵庫2、ショーケース)" maxlength="20"><select id="hi-type" aria-label="種類"><option value="冷蔵">冷蔵(0〜10℃)</option><option value="冷凍">冷凍(-30〜-15℃)</option><option value="温蔵">温蔵(65℃以上)</option><option value="中心温度">加熱の中心温度(75℃以上)</option><option value="チェック">点検(OK/NG)</option></select><select id="hi-times" aria-label="記録するとき"><option value="朝夕">始業時と終業時(2回)</option><option value="朝">朝</option><option value="夕">終業時</option><option value="">随時(1回)</option></select><button class="btn" type="button" id="hi-add">追加</button></div>`;
    $('hi-std').onclick = () => setValueX({ field: 'hygstd', value: 1 });
    $('hi-add').onclick = () => { const name = $('hi-name').value.trim(); if (!name) { $('hi-name').focus(); return; } setValueX({ field: 'hygitem', value: { action: 'add', name, type: $('hi-type').value, when: $('hi-times').value } }); };
    ib.querySelectorAll('[data-hiopen]').forEach(b => b.onclick = () => { const e = $('hi-ed-' + b.dataset.hiopen); e.hidden = !e.hidden; b.textContent = e.hidden ? '編集' : '閉じる'; });
    ib.querySelectorAll('[data-hie]').forEach(b => b.onclick = () => { const i = b.dataset.hie, it = t.items[i]; setValueX({ field: 'hygitem', value: { action: 'edit', name: it.name, lo: it.kind === 'temp' ? $('hi-lo-' + i).value : '', hi: it.kind === 'temp' ? $('hi-hi-' + i).value : '', when: $('hi-t-' + i).value } }); });
    ib.querySelectorAll('[data-hio]').forEach(b => b.onclick = () => { const it = t.items[b.dataset.hio]; if (confirm(`「${it.name}」の記録を停止しますか? これまでの記録は残ります。`)) setValueX({ field: 'hygitem', value: { action: 'off', name: it.name } }); });
  }
  renderHygPlan(own);
  // 月の記録表
  const ms = Object.keys(D.hyg.months || {}).sort().reverse(), chips = $('hyg-chips');
  if (!ms.length) { chips.innerHTML = ''; $('hyg-month').innerHTML = '<p class="k" style="margin:0">記録が蓄積されると、ここに月次の記録表が作成されます</p>'; return; }
  const sel = chips.dataset.m && ms.includes(chips.dataset.m) ? chips.dataset.m : ms[0], M = D.hyg.months[sel];
  chips.innerHTML = ms.map(m => `<button class="chip" type="button" data-m="${m}" aria-pressed="${m === sel}">${+m.slice(5)}月</button>`).join('');
  chips.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { chips.dataset.m = b.dataset.m; renderHyg(); });
  $('hyg-month').innerHTML = `<div class="row" style="margin-bottom:8px"><span>${M.ok ? `<span class="pill">確認済み</span> <span class="k">${esc(M.ok)}</span>` : '<span class="pill gray">店主の確認待ち</span>'}</span>${own && !M.ok ? '<button class="btn ghost sm" type="button" id="hyg-ok">この月を確認しました</button>' : ''}</div>` + hygTable(sel);
  if ($('hyg-ok')) $('hyg-ok').onclick = () => setValueX({ field: 'hygok', value: sel });
  $('hyg-print').onclick = () => openPrint(`<h2>衛生管理記録</h2><p>${esc(D.shop)} ・ ${sel.replace('-', '年')}月${M.ok ? ' ・ 確認: ' + esc(M.ok) : ' ・ 確認者:　　　　　'}</p>${hygTable(sel)}<p style="font-size:12px">目安: ${t.items.filter(i => i.kind === 'temp').map(i => `${esc(i.name)} ${i.lo ?? ''}〜${i.hi ?? ''}℃`).join(' / ')}</p>`);
}
function hygTable(mo) {
  const M = D.hyg.months[mo], days = M.days || {}, names = M.cols || [], [y, m] = mo.split('-').map(Number), n = new Date(y, m, 0).getDate();
  const wd = d => '日月火水木金土'[new Date(y, m - 1, d).getDay()], key = d => `${mo}-${String(d).padStart(2, '0')}`;
  let h = `<h3 class="ht">温度と点検</h3><table class="hgrid"><tr><th>日</th>${names.map(x => `<th>${esc(x)}</th>`).join('')}<th>記録した人</th></tr>`;
  for (let d = 1; d <= n; d++) { const r = days[key(d)] || {}; const who = [...new Set(Object.values(r).map(x => x.who))].join('・');
    h += `<tr><td>${d}(${wd(d)})</td>${names.map(x => r[x] ? `<td class="${r[x].j === 'OK' ? '' : 'bad'}">${esc(String(r[x].v))}</td>` : '<td></td>').join('')}<td>${esc(who)}</td></tr>`; }
  h += '</table>';
  const hp = M.health || {}, people = [...new Set(Object.values(hp).flatMap(x => Object.keys(x)))];
  if (people.length) {
    h += `<h3 class="ht">体調チェック表</h3><table class="hgrid"><tr><th>日</th>${people.map(p => `<th>${esc(p)}</th>`).join('')}</tr>`;
    for (let d = 1; d <= n; d++) { const r = hp[key(d)] || {}; h += `<tr><td>${d}(${wd(d)})</td>${people.map(p => { const x = r[p]; return !x ? '<td></td>' : x.j === '休み' ? '<td>休</td>' : `<td class="${x.j === 'OK' ? '' : 'bad'}">${x.j === 'OK' ? '○' : '×'}</td>`; }).join('')}</tr>`; }
    h += '</table>';
  }
  if ((M.fixes || []).length) h += `<h3 class="ht">基準を外れた場合の対応</h3><table class="hgrid fx"><tr><th>日</th><th>記録</th><th>対応</th></tr>${M.fixes.map(f => `<tr><td>${+f.d.slice(8)}日</td><td>${esc(f.what)}</td><td>${esc(f.fix)}</td></tr>`).join('')}</table>`;
  return h;
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
  $('ws-add').innerHTML = `<p style="margin:0 0 8px"><b>納品を記録</b></p><div class="fld"><span class="k">卸先</span><input id="ws-to" list="ws-tos" placeholder="卸先"><datalist id="ws-tos">${tos.map(t => `<option value="${esc(t)}">`).join('')}</datalist>
    <span class="k">商品と数</span><input id="ws-items" placeholder="商品と数"></div><div class="ask"><button class="btn" type="button" id="ws-go">記録する</button><span class="k">AIに入力しても記録できます</span></div>`;
  $('ws-go').onclick = () => { const to = $('ws-to').value.trim(), it = $('ws-items').value.trim(); if (!to || !it) { chat('卸先・商品・数量を入力してください'); return; } setValueX({ field: 'deliv', value: to + ' ' + it }); };
  if (!ms.length) { chips.innerHTML = ''; $('ws-list').innerHTML = emptyBox('ws', '納品の記録がありません', '上の欄に卸先・商品・数量を入力すると、ここに月ごとに表示されます。'); return; }
  const sel = chips.dataset.m && ms.includes(chips.dataset.m) ? chips.dataset.m : ms[0];
  chips.innerHTML = ms.map(m => `<button class="chip" type="button" data-m="${m}" aria-pressed="${m === sel}">${m.replace('-', '年')}月</button>`).join('');
  chips.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { chips.dataset.m = b.dataset.m; renderWs(); });
  const by = ws[sel], wsTot = Object.values(by).reduce((a, x) => a + x.total, 0);
  const prevK = ms[ms.indexOf(sel) + 1], prevTot = prevK ? Object.values(ws[prevK]).reduce((a, x) => a + x.total, 0) : null;
  $('ws-list').innerHTML = `<div class="card">${tiles([{ t: `${+sel.slice(5)}月の卸(税抜)`, v: yen(wsTot), c: 'ws', k: prevTot != null ? `前月 ${yen(prevTot)}(${wsTot >= prevTot ? '+' : ''}${Math.round((wsTot - prevTot) / Math.max(1, prevTot) * 100)}%)` : '' }, { t: '卸先', v: Object.keys(by).length + '<small style="font-size:14px;font-weight:500"> 件</small>', c: 'ws' }])}
    ${Object.keys(by).length > 1 ? `<p class="ct" style="margin-top:12px">卸先ごと</p>${barsH(Object.keys(by).map(to => ({ l: to, v: by[to].total })).sort((a, b) => b.v - a.v), 'var(--c-ws)')}` : ''}</div>` + Object.keys(by).map((to, i) => { const o = by[to], miss = [...new Set(o.lines.filter(l => l.unit == null).map(l => l.item))];
    return `<div class="card"><div class="row"><b>${esc(to)} ${callBtn(to)}</b><span class="big" style="font-size:20px">${yen(o.total)}</span></div><p class="k" style="margin:4px 0 8px">税抜 · ${o.lines.length}回の納品</p>
    ${miss.length ? `<div class="ask" style="margin-top:0">${miss.map((it, j) => `<span class="k">${esc(it)}の卸値</span><input id="wp-${i}-${j}" inputmode="numeric" placeholder="円" style="width:80px"><button class="btn ghost" type="button" data-wp="${i}-${j}" data-to="${esc(to)}" data-it="${esc(it)}">決定</button>`).join('')}</div>` : ''}
    <div class="ask"><button class="btn ghost" type="button" data-inv="${esc(to)}">請求書の表示・印刷</button></div></div>`; }).join('');
  $('ws-list').querySelectorAll('[data-wp]').forEach(b => b.onclick = () => { const v = +$('wp-' + b.dataset.wp).value; if (!(v > 0)) return; setValueX({ field: 'wsprice', to: b.dataset.to, product: b.dataset.it, value: v }); });
  $('ws-list').querySelectorAll('[data-inv]').forEach(b => b.onclick = () => openInvoice(sel, b.dataset.inv));
}
function openInvoice(mo, to) {
  const o = D.ws[mo][to], si = D.shopInfo || {}, sum = {};
  o.lines.forEach(l => { const k = l.item + '|' + (l.unit ?? ''); sum[k] = sum[k] || { item: l.item, unit: l.unit, qty: 0 }; sum[k].qty += l.qty; });
  const rows = Object.values(sum), sub = rows.reduce((a, r) => a + (r.unit || 0) * r.qty, 0), tax = Math.floor(sub * 0.08), [y, m] = mo.split('-').map(Number), last = new Date(y, m, 0);
  openPrint(`<h2>請 求 書</h2>
    <div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap"><div><p style="font-size:18px;border-bottom:1px solid #333;padding-bottom:4px;margin:0 0 8px">${esc(to)} 御中</p><p style="margin:0">${y}年${m}月分(${m}月1日〜${m}月${last.getDate()}日)</p>
      <p style="font-size:20px;margin:12px 0">ご請求額 <b>${(sub + tax).toLocaleString('ja-JP')}円</b>(税込)</p></div>
      <div style="font-size:13px;text-align:right"><img src="logo_mark.webp?v=1" alt="" onerror="this.remove()" style="height:56px;display:block;margin:0 0 8px auto">${esc(si.name || D.shop)}<br>${esc(si.addr || '')}<br>${si.tel ? 'TEL ' + esc(si.tel) : ''}<br>${si.reg ? '登録番号 ' + esc(si.reg) : ''}<br>発行日 ${new Date().toLocaleDateString('ja-JP')}</div></div>
    <table style="margin-top:12px"><tr><th>品名</th><th>数量</th><th>単価(税抜)</th><th>金額(税抜)</th></tr>
      ${rows.map(r => `<tr><td>${esc(r.item)} ※</td><td style="text-align:right">${r.qty}</td><td style="text-align:right">${r.unit != null ? r.unit.toLocaleString('ja-JP') : '未定'}</td><td style="text-align:right">${r.unit != null ? (r.unit * r.qty).toLocaleString('ja-JP') : ''}</td></tr>`).join('')}
      <tr><td colspan="3" style="text-align:right">小計(8%対象)</td><td style="text-align:right">${sub.toLocaleString('ja-JP')}</td></tr>
      <tr><td colspan="3" style="text-align:right">消費税(8%)</td><td style="text-align:right">${tax.toLocaleString('ja-JP')}</td></tr>
      <tr><td colspan="3" style="text-align:right"><b>合計</b></td><td style="text-align:right"><b>${(sub + tax).toLocaleString('ja-JP')}</b></td></tr></table>
    <p style="font-size:12px">※は軽減税率(8%)対象です。</p>
    <p style="font-size:12px">納品日: ${[...new Set(o.lines.map(l => l.day))].sort().map(d => +d.slice(5, 7) + '/' + +d.slice(8)).join('、')}</p>
    ${si.bank ? `<p>お振込先: ${esc(si.bank)}</p>` : ''}${rows.some(r => r.unit == null) ? '<p style="color:#a4512a">単価が未設定の品目があります。「卸」の画面で卸値を入力してください。</p>' : ''}`);
}
// ---------- 売上と粗利 ----------
// 売上のお知らせメールをまとめて取り込む(読み取る → 中身を見せる → 取り込む)
let sbFile = null, sbReports = null;
if ($('sb-file')) $('sb-file').onchange = () => {
  const f = $('sb-file').files[0]; if (!f) return; sbFile = null; sbReports = null; $('sb-go').hidden = true; $('sb-out').innerHTML = '';
  if (f.size > 5 * 1024 * 1024) { chat('ファイルサイズが上限(5MB)を超えています。期間を分けて書き出してください'); return; }
  const rd = new FileReader();
  if (/^text\/|\.(csv|tsv|txt)$/i.test(f.type + ' ' + f.name) && !/pdf|image/.test(f.type)) {   // CSV・テキストは、そのまま欄に入れる(Shift_JISのCSVにも対応)
    rd.onload = () => { const buf = new Uint8Array(rd.result); let t = new TextDecoder('utf-8').decode(buf); if (/�/.test(t)) { try { t = new TextDecoder('shift_jis').decode(buf); } catch (e) {} } $('sb-text').value = t; $('sb-fname').textContent = f.name + ' を入れました'; };
    rd.readAsArrayBuffer(f);
  } else {
    rd.onload = () => { sbFile = { data: String(rd.result).split(',')[1], type: f.type || 'application/pdf' }; $('sb-fname').textContent = f.name + '(「読み取る」を押すと、AIが読み取ります)'; };
    rd.readAsDataURL(f);
  }
};
if ($('sb-text')) $('sb-text').addEventListener('input', () => { sbReports = null; sbFile = null; $('sb-go').hidden = true; });
if ($('sb-check')) {
  $('sb-check').onclick = async () => {
    const text = $('sb-text').value; if (!text.trim() && !sbFile) { $('sb-text').focus(); return; }
    $('sb-out').innerHTML = '<p class="k">読み取っています…(AIによる読み取りには少し時間がかかります)</p>'; $('sb-go').hidden = true; $('sb-check').disabled = true;
    let r; try { r = await api({ kind: 'app_set', field: 'salesbulk', value: { text, dry: true, file: sbFile || undefined } }); } finally { $('sb-check').disabled = false; }
    if (!r.ok) { $('sb-out').innerHTML = `<p class="k">${esc(r.error || '読み取れませんでした')}</p>`; return; }
    sbReports = r.reports || null;
    const p = r.preview, its = Object.entries(p.items).sort((a, b) => b[1] - a[1]);
    $('sb-out').innerHTML = `<p style="margin:8px 0 4px"><b>${p.days}日分・合計 ${yen(p.total)}</b> <span class="k">${esc(p.from)} 〜 ${esc(p.to)}${p.conn ? '・' + esc(p.conn) + 'のCSVとして読み取りました' : ''}${p.byAI ? '・AIが読み取りました。数値をご確認ください' : ''}</span></p>${p.note ? `<p class="k" style="margin:0 0 6px">${esc(p.note)}</p>` : ''}<div class="scroll"><table>${its.map(([n, q]) => `<tr><td>${esc(n)}</td><td class="n">${q}点</td></tr>`).join('')}</table></div>`;
    $('sb-go').hidden = false;
  };
  $('sb-go').onclick = async () => {
    $('sb-go').disabled = true;
    const r = await api({ kind: 'app_set', field: 'salesbulk', value: sbReports ? { text: '', reports: sbReports } : { text: $('sb-text').value } });
    $('sb-go').disabled = false;
    if (!r.ok) { toast(r.error || '取り込めませんでした'); return; }
    D = r.data; renderAll(); $('sb-text').value = ''; sbFile = null; sbReports = null; $('sb-fname').textContent = ''; $('sb-go').hidden = true; $('sb-out').innerHTML = `<p style="margin:8px 0 0">${esc(r.msg)}</p>`; toast('売上を取り込みました。', 'ok');
  };
}
// メニューの分析(看板・見直し・販売方法の工夫・販売中止の候補)
let menuMo = null;
function renderMenuA() {
  const box = $('menu-box'); if (!box) return;
  const mm = D.menu || {}, ms = Object.keys(mm).sort().reverse().filter(k => (mm[k].items || []).length || (mm[k].missing || []).length);
  if (noMoney()) { box.innerHTML = ''; return; }
  if (!ms.length) { box.innerHTML = `<div class="card"><p style="margin:0"><b>品目別の売上はまだありません</b></p><p class="k" style="margin:8px 0 0">品目ごとの数量が印字された精算レシートを撮影するか、卸の納品を記録すると、ここに表示されます。部門の合計(例: 和菓子 ○○円)のみのレシートでは、品目別に分けられません。</p></div>`; return; }
  const sel = ms.includes(menuMo) ? menuMo : ms[0], o = mm[sel], Q = { star: ['看板', '販売数・粗利ともに高い', '現状維持。欠品に注意'], plow: ['見直し', '販売数は多いが、粗利が低い', '値上げ、または原価の見直し'], puzzle: ['販売方法の工夫', '粗利は高いが、販売数が少ない', '陳列・おすすめ・試食で販売を促進'], dog: ['販売中止の候補', '販売数・粗利ともに低い', '商品の入れ替え、または製造数の削減'] };
  const by = k => (o.items || []).filter(i => i.quad === k);
  box.innerHTML = `${ms.length > 1 ? `<div class="chips" style="margin-bottom:8px">${ms.map(m => `<button class="chip" type="button" data-mm="${m}" aria-pressed="${m === sel}">${m.replace('-', '年')}月</button>`).join('')}</div>` : ''}
    ${(o.notes || []).length || o.partial ? `<div class="card ma-notes"><h2 class="ch">${+sel.slice(5)}月の見通し</h2><ul>${o.notes.map(n => `<li class="${n.k}">${esc(n.t)}</li>`).join('')}</ul>${o.prev ? `<p class="k" style="margin:8px 0 0">比較月: ${+o.prev.slice(5)}月</p>` : o.partial ? '<p class="k" style="margin:8px 0 0">今月は集計中のため、前月との比較は月末後に表示します。</p>' : ''}</div>` : ''}
    ${(o.items || []).length ? `<div class="mq">${['star', 'plow', 'puzzle', 'dog'].map(k => `<div class="${k}"><b>${Q[k][0]}</b><span class="k">${Q[k][1]} → ${Q[k][2]}</span>${by(k).length ? `<ul>${by(k).map(i => `<li>${esc(i.name)} <span class="k" style="display:inline">${i.qty}${U} · 1${U} ${i.unitMargin.toLocaleString('ja-JP')}円</span></li>`).join('')}</ul>` : '<span class="k">なし</span>'}</div>`).join('')}</div>
    <div class="card" style="margin-top:12px"><div class="scroll"><table><tr><th style="text-align:left">商品</th><th>売れた数</th><th>売上(税抜)</th><th>1${U}の粗利</th><th>原価率</th><th>粗利計</th><th>前の月</th></tr>${o.items.map(i => `<tr><td style="text-align:left">${esc(i.name)}</td><td class="n">${i.qty}</td><td class="n">${yen(i.salesEx)}</td><td class="n">${i.unitMargin.toLocaleString('ja-JP')}円</td><td class="n">${i.rate != null ? i.rate + '%' : '-'}</td><td class="n"><b>${yen(i.profit)}</b></td><td class="n">${i.prevQty != null ? (i.qty >= i.prevQty ? '<span class="upx">+' : '<span class="dnx">') + (i.qty - i.prevQty) + U + '</span>' : '<span class="k">-</span>'}</td></tr>`).join('')}</table></div>
    <p class="k" style="margin:8px 0 0">粗利は、税抜の売上から材料費のみを差し引いた額です(人件費・光熱費は含みません)。分類の基準: 販売数 ${o.popLine}${U}以上を「販売数が多い」、1${U}の粗利 ${o.marginLine}円以上を「粗利が高い」とします(この月の平均から算出)。</p></div>` : ''}
    ${(o.missing || []).length ? `<p class="k" style="margin:8px 0 0">原価が未算出のため分類できない商品: ${o.missing.map(esc).join('、')}(1個の重さ、または1仕込みで取れる個数を入力すると分類されます)</p>` : ''}`;
  box.querySelectorAll('[data-mm]').forEach(b => b.onclick = () => { menuMo = b.dataset.mm; renderMenuA(); });
}
// 入出金(月): 入金(売上+卸)・出金(帳簿の科目ごと)・残り
let moneyMo = null;
function renderMoney() {
  const box = $('money-box'); if (!box) return;
  const mm = D.money || {}, ms = Object.keys(mm).sort();
  if (noMoney() || !ms.length) { box.innerHTML = noMoney() ? '' : `<div class="card"><h2 class="ch">入出金</h2><p class="k" style="margin:0">売上(レジの精算レシート)と、仕入れの請求書や購入時のレシートを撮影すると、月ごとの「入金・出金・差額」がここに表示されます。</p>${expForm()}</div>`; bindExp(); return; }
  const sel = ms.includes(moneyMo) ? moneyMo : ms[ms.length - 1], o = mm[sel], mx = Math.max(1, ...ms.map(k => Math.max(mm[k].in, mm[k].out)));
  box.innerHTML = `<div class="card"><div class="row"><h2 class="ch">入出金</h2>${ms.length > 1 ? `<select id="mn-mo" aria-label="月">${ms.slice().reverse().map(k => `<option value="${k}"${k === sel ? ' selected' : ''}>${k.replace('-', '年')}月</option>`).join('')}</select>` : `<span class="k">${sel.replace('-', '年')}月</span>`}</div>
    <div class="mn-sum"><div><b>${yen(o.in)}</b><span>入金</span></div><div><b>${yen(o.out)}</b><span>出金</span></div><div class="${o.left < 0 ? 'neg' : ''}"><b>${yen(o.left)}</b><span>残り</span></div></div>
    <p class="k" style="margin:0">入金: 売上 ${yen(o.sales)}(税込)${o.ws ? `・卸 ${yen(o.ws)}` : ''}${o.misc ? `・現金の過不足(多い分) ${yen(o.misc)}` : ''}。出金は、帳簿に登録された請求書・レシート・手入力の経費です(人件費は含みません)。${o.personal ? `店のお金で買った私用の物 ${yen(o.personal)} は、出金に含めず区分しています(事業主貸)。` : ''}</p>
    ${regMonthHtml(sel)}
    ${(o.channels || []).map((c, i) => `<div class="mn-ch"><div class="row"><b>${esc(c.name)}</b><span class="pill ${c.actual ? '' : 'gray'}">${c.actual ? '入金で確定' : '見込み'}</span></div>
      <div class="mn-eq"><span>売上 ${yen(c.gross)}</span><span>− 手数料 ${yen(c.fee)}${c.actual ? '' : `(${c.rate}%)`}</span><span>= 入金 <b>${yen(c.deposit)}</b></span></div>
      ${c.actual && c.diff ? `<p class="k" style="margin:4px 0 0">${c.rate}%で計算した額との差: ${c.diff > 0 ? '+' : ''}${c.diff.toLocaleString('ja-JP')}円(端数や返品などによる差。入金額に合わせています)</p>` : ''}
      ${SH('chdeposit') ? '' : `<div class="ask" style="margin-top:8px"><input id="dp-${i}" inputmode="numeric" placeholder="実際の入金額(円)" value="${c.actual ? c.deposit : ''}" style="flex:1;min-width:0;width:auto" aria-label="${esc(c.name)}の実際の入金額"><button class="btn ghost sm" type="button" data-dp="${i}">${c.actual ? '修正' : '入金額を入力'}</button>${c.actual ? `<button class="btn ghost sm" type="button" data-dpx="${i}">見込み額に戻す</button>` : ''}</div>`}</div>`).join('')}
    ${o.outs.length ? `<div class="mn-out">${o.outs.map(x => `<div class="rw"><span>${esc(x.acct)}${x.est ? ' <span class="k" style="display:inline">(見込み)</span>' : ''}</span><span class="n">${yen(x.amount)}</span></div>`).join('')}</div>` : ''}
    ${ms.length > 1 ? `<div class="mn-bars" aria-label="月ごとの入金と出金">${ms.map(k => `<div class="mn-bar"><span class="k">${+k.slice(5)}月</span><span class="t"><i style="width:${Math.round(mm[k].in / mx * 100)}%"></i><i class="o" style="width:${Math.round(mm[k].out / mx * 100)}%"></i></span><span class="v ${mm[k].left < 0 ? 'dnx' : ''}">${yen(mm[k].left)}</span></div>`).join('')}<p class="k" style="margin:4px 0 0">青は入金、赤は出金、右は差額です。</p></div>` : ''}
    ${expForm()}</div>`;
  if ($('mn-mo')) $('mn-mo').onchange = () => { moneyMo = $('mn-mo').value; renderMoney(); };
  box.querySelectorAll('[data-dp]').forEach(b => b.onclick = () => { const c = o.channels[b.dataset.dp], v = $('dp-' + b.dataset.dp).value.trim(); if (!v) { $('dp-' + b.dataset.dp).focus(); return; } setValueX({ field: 'deposit', value: { name: c.name, month: sel, amount: v } }); });
  box.querySelectorAll('[data-dpx]').forEach(b => b.onclick = () => setValueX({ field: 'deposit', value: { name: o.channels[b.dataset.dpx].name, month: sel, amount: '' } }));
  bindExp();
}
// ---------- レジ締め(閉店後に現金を数える。スタッフもできる) ----------
function renderRegClose() {
  const wrap = $('regc-wrap'), box = $('regc'); if (!wrap) return;
  if (SH('regclose')) { wrap.hidden = true; return; }
  const R = D.reg || {};
  if (!R.mode || !PL('sales')) { wrap.hidden = !(D.me && D.me.owner && PL('sales') && !R.mode); if (!wrap.hidden) box.innerHTML = `<p class="k" style="margin:0 0 8px">閉店後にレジの現金を数え、売上と一致しているかを確認できます。先に、POSレジの有無を選択してください。</p><div class="seg" id="rg-mode0"><button type="button" data-v="pos">POSレジがある</button><button type="button" data-v="none">POSレジはない</button></div>`; if ($('rg-mode0')) $('rg-mode0').querySelectorAll('button').forEach(b => b.onclick = () => setValueX({ field: 'regset', value: { mode: b.dataset.v } })); return; }
  wrap.hidden = false;
  const today = new Date().toLocaleDateString('sv-SE'), done = (R.closes || []).find(c => c.date === today), pos = R.mode === 'pos';
  if (done && !box.dataset.redo) {
    const m = !noMoney() && done.counted != null;
    box.innerHTML = `<div class="row"><b>本日のレジ締めは完了しています</b><button class="btn ghost sm" type="button" id="rg-redo">再入力</button></div>${m ? `<p class="k" style="margin:6px 0 0">${done.diff === 0 ? '現金は一致していました' : `現金が${Math.abs(done.diff).toLocaleString('ja-JP')}円${done.diff < 0 ? '不足していました' : '過剰でした'}${done.reason ? '(' + esc(done.reason) + ')' : ''}`}${done.sales != null ? `。売上 ${yen(done.sales)}` : ''}${done.who ? `。記録: ${esc(done.who)}` : ''}</p>` : ''}`;
    $('rg-redo').onclick = () => { box.dataset.redo = '1'; renderRegClose(); };
    return;
  }
  const num = id => { const v = ($(id) || {}).value; if (v == null || String(v).trim() === '') return null; const n = Number(String(v).replace(/[,円\s]/g, '')); return isNaN(n) ? null : n; };
  box.innerHTML = `<p class="k" style="margin:0 0 8px">${pos ? '精算レシートの「現金」の売上と、レジの中の現金を比べます。' : '数えた現金から、本日の売上を出します。'}</p>
    <div class="fld">
      ${pos ? '<span class="k">精算レシートの「現金」の売上</span><input id="rg-cash" inputmode="numeric" placeholder="例 52300" autocomplete="off">' : ''}
      <span class="k">数えた現金(レジ内の全額)</span><input id="rg-cnt" inputmode="numeric" placeholder="例 82000" autocomplete="off">
      ${pos ? '' : '<span class="k">カード・電子マネーの売上</span><input id="rg-cl" inputmode="numeric" placeholder="なければ空のまま" autocomplete="off"><span class="k">伝票の合計(ある場合)</span><input id="rg-slip" inputmode="numeric" placeholder="手書きの伝票などの合計" autocomplete="off">'}
      <span class="k">釣銭準備金</span><input id="rg-flt" inputmode="numeric" value="${R.float || ''}" placeholder="例 30000" autocomplete="off">
    </div>
    <div id="rg-live" class="k" style="margin:8px 0 0" aria-live="polite"></div>
    <div id="rg-why" hidden style="margin-top:8px"><span class="k">差異の理由</span><div class="seg" id="rg-rs" style="flex-wrap:wrap">${(R.reasons || []).map(r => `<button type="button" data-v="${esc(r)}">${esc(r)}</button>`).join('')}</div><input id="rg-memo" placeholder="補足(任意)" maxlength="80" style="margin-top:8px"></div>
    <div class="ask"><button class="btn" type="button" id="rg-go">レジ締めを記録</button>${done ? '<button class="btn ghost" type="button" id="rg-cancel">やめる</button>' : ''}</div>`;
  const live = () => {
    const cnt = num('rg-cnt'), flt = num('rg-flt') || 0; let diff = null, txt = '';
    if (cnt == null) { $('rg-live').textContent = ''; $('rg-why').hidden = true; return; }
    if (pos) { const cash = num('rg-cash'); if (cash != null) { diff = cnt - flt - cash; } }
    else { const cl = num('rg-cl') || 0, slip = num('rg-slip'); txt = `本日の売上 ${yen(cnt - flt + cl)}(現金 ${yen(cnt - flt)} + キャッシュレス ${yen(cl)})`; if (slip != null) diff = cnt - flt - (slip - cl); }
    if (diff != null) txt += (txt ? '。' : '') + (diff === 0 ? '現金は一致しています' : `現金が${Math.abs(diff).toLocaleString('ja-JP')}円${diff < 0 ? '足りません' : '多いです'}`);
    $('rg-live').textContent = txt; $('rg-why').hidden = !diff;
  };
  box.querySelectorAll('input').forEach(i => i.oninput = live);
  let reason = '';
  box.querySelectorAll('#rg-rs button').forEach(b => b.onclick = () => { reason = b.dataset.v; box.querySelectorAll('#rg-rs button').forEach(x => x.setAttribute('aria-pressed', x === b)); });
  if ($('rg-cancel')) $('rg-cancel').onclick = () => { delete box.dataset.redo; renderRegClose(); };
  $('rg-go').onclick = () => {
    if (num('rg-cnt') == null) { $('rg-cnt').focus(); return; }
    if (pos && num('rg-cash') == null) { $('rg-cash').focus(); return; }
    delete box.dataset.redo;
    setValueX({ field: 'regclose', value: { date: today, cash: pos ? $('rg-cash').value : '', counted: $('rg-cnt').value, cashless: pos ? '' : $('rg-cl').value, slip: pos ? '' : $('rg-slip').value, float: $('rg-flt').value, reason, memo: $('rg-memo').value } });
  };
}
function regMonthHtml(mo) {
  const cs = ((D.reg || {}).closes || []).filter(c => c.date.slice(0, 7) === mo); if (!cs.length) return '';
  const off = cs.filter(c => c.diff);
  return `<details style="margin-top:12px"><summary class="k" style="cursor:pointer">レジ締め ${cs.length}日 ・ 差異があった日 ${off.length}日</summary>
    ${off.length ? `<div class="mn-out">${off.map(c => `<div class="rw"><span>${+c.date.slice(5, 7)}/${+c.date.slice(8)} ${esc(c.reason || '理由なし')}${c.memo ? ` <span class="k" style="display:inline">${esc(c.memo)}</span>` : ''}</span><span class="n ${c.diff < 0 ? 'dnx' : ''}">${c.diff > 0 ? '+' : ''}${c.diff.toLocaleString('ja-JP')}円</span></div>`).join('')}</div><p class="k" style="margin:4px 0 0">不足分は「雑損失」、過剰分は「雑収入」として入出金に計上しています。POSの売上は修正しません。</p>` : '<p class="k" style="margin:8px 0 0">この月は、現金の差異はありませんでした。</p>'}</details>`;
}
function expForm() {
  const cf = D.chFees || [];
  return `<details style="margin-top:12px"${cf.length ? '' : ' open'}><summary class="k" style="cursor:pointer">販路の手数料(道の駅・直売所など、入金の前に引かれる分)${cf.length ? ': ' + cf.map(x => esc(x.name) + ' ' + x.rate + '%').join('・') : ''}</summary>
    <p class="k" style="margin:8px 0">売上はそのまま記録し、手数料は「出金」に計上します。売上の記録名(メールの店舗名など)にこの名前が含まれる場合、その販路の売上として集計します。</p>
    ${cf.map((x, i) => `<div class="row" style="padding:4px 0"><span>${esc(x.name)} ${x.rate}%</span><button class="btn ghost sm" type="button" data-cfx="${i}">外す</button></div>`).join('')}
    <div class="mn-add"><input id="cf-name" placeholder="販路の名前(例: 道の駅)" maxlength="20" style="flex:1 1 140px;min-width:0"><input id="cf-rate" inputmode="decimal" placeholder="手数料(%)" style="width:110px"><button class="btn" type="button" id="cf-go">登録</button></div></details>
  <details style="margin-top:12px"><summary class="k" style="cursor:pointer">レシートのない経費を入力(家賃・電気代など)</summary><div class="mn-add"><input id="ex-date" type="date" value="${new Date().toLocaleDateString('sv-SE')}" aria-label="日付"><input id="ex-item" placeholder="内容(例: 電気代)" maxlength="40"><input id="ex-amt" inputmode="numeric" placeholder="金額(円)"><select id="ex-acct" aria-label="科目"><option value="">科目は自動で判定</option>${(D.expAccts || []).map(a => `<option>${esc(a)}</option>`).join('')}</select>${SH('privatepay') ? '' : `<select id="ex-pay" aria-label="支払額"><option value="shop">店の資金で支払った</option><option value="owner">店主が立て替えた</option><option value="private">店の資金で私用の物を購入した</option></select>`}<button class="btn" type="button" id="ex-go">記録する</button></div><p class="k" style="margin:8px 0 0">${VIA}「経費 電気代 8000」と入力しても記録できます。${SH('privatepay') ? '' : '私用の物は経費にせず「事業主貸」として分けます。'}</p></details>
  ${SH('fixedexp') ? '' : `<details style="margin-top:12px"><summary class="k" style="cursor:pointer">毎月決まって出ていくお金${(D.fixedExps || []).length ? ': ' + D.fixedExps.map(x => esc(x.item)).join('・') : '(家賃・リース・ソフト代など)'}</summary>
    <p class="k" style="margin:8px 0">一度登録すると、毎月その日を過ぎた時点で帳簿に自動で記録されます。金額が変わった場合は、同じ名前で登録し直してください。</p>
    ${(D.fixedExps || []).map((x, i) => `<div class="row" style="padding:4px 0"><span>${esc(x.item)} ${yen(x.amount)} ・ 毎月${x.day}日${x.acct ? ' ・ ' + esc(x.acct) : ''}</span><button class="btn ghost sm" type="button" data-fxx="${i}">外す</button></div>`).join('')}
    <div class="mn-add"><input id="fx-item" placeholder="内容(例: 家賃)" maxlength="40"><input id="fx-amt" inputmode="numeric" placeholder="金額(円)"><input id="fx-day" inputmode="numeric" placeholder="日(1〜28)" style="width:100px"><select id="fx-acct" aria-label="科目"><option value="">科目は自動で判定</option>${(D.expAccts || []).map(a => `<option>${esc(a)}</option>`).join('')}</select><button class="btn" type="button" id="fx-go">登録</button></div></details>`}
  <details style="margin-top:12px"><summary class="k" style="cursor:pointer">経費の科目を追加${(D.expExtra || []).length ? ': ' + D.expExtra.map(esc).join('・') : ''}</summary>
    <p class="k" style="margin:8px 0">標準の科目のほかに、店舗で使用する科目を追加できます(例: 荷造運賃、支払手数料)。</p>
    ${(D.expExtra || []).map((x, i) => `<div class="row" style="padding:4px 0"><span>${esc(x)}</span><button class="btn ghost sm" type="button" data-eax="${i}">外す</button></div>`).join('')}
    <div class="mn-add"><input id="ea-name" placeholder="科目名" maxlength="20" style="flex:1 1 160px;min-width:0"><button class="btn" type="button" id="ea-go">追加</button></div></details>`;
}
function bindExp() {
  if ($('cf-go')) $('cf-go').onclick = () => { const name = $('cf-name').value.trim(), rate = $('cf-rate').value.trim(); if (!name) { $('cf-name').focus(); return; } if (!rate) { $('cf-rate').focus(); return; } setValueX({ field: 'chfee', value: { name, rate } }); };
  document.querySelectorAll('[data-cfx]').forEach(b => b.onclick = () => { const x = (D.chFees || [])[b.dataset.cfx]; if (x && confirm(x.name + 'の手数料を削除しますか?')) setValueX({ field: 'chfee', value: { name: x.name, remove: true } }); });
  if (!$('ex-go')) return;
  $('ex-go').onclick = async () => {
    const item = $('ex-item').value.trim(), amount = $('ex-amt').value.trim(); if (!item) { $('ex-item').focus(); return; } if (!amount) { $('ex-amt').focus(); return; }
    const value = { date: $('ex-date').value, item, amount, acct: $('ex-acct').value, pay: $('ex-pay') ? $('ex-pay').value : 'shop' }, key = JSON.stringify(value);
    if (exDupKey === key) value.force = true;
    const out = await api({ kind: 'app_set', field: 'expense', value });
    if (!out.ok) { if (/同じ日・同じ金額/.test(out.error || '')) { exDupKey = key; chat(out.error, 'point'); return; } toast(out.error || '記録できませんでした', 'ng'); return; }
    exDupKey = ''; D = out.data; renderAll(); chat(out.msg || '経費を記録しました');
  };
  if ($('fx-go')) $('fx-go').onclick = () => { const item = $('fx-item').value.trim(), amount = $('fx-amt').value.trim(), day = $('fx-day').value.trim() || '1'; if (!item) { $('fx-item').focus(); return; } if (!amount) { $('fx-amt').focus(); return; } setValueX({ field: 'fixedexp', value: { item, amount, day, acct: $('fx-acct').value } }); };
  document.querySelectorAll('[data-fxx]').forEach(b => b.onclick = () => { const x = (D.fixedExps || [])[b.dataset.fxx]; if (x && confirm(x.item + 'を毎月の支出から削除しますか?(記録済みの月の分は残ります)')) setValueX({ field: 'fixedexp', value: { item: x.item, remove: true } }); });
  if ($('ea-go')) $('ea-go').onclick = () => { const name = $('ea-name').value.trim(); if (!name) { $('ea-name').focus(); return; } setValueX({ field: 'expacct', value: { name } }); };
  document.querySelectorAll('[data-eax]').forEach(b => b.onclick = () => { const x = (D.expExtra || [])[b.dataset.eax]; if (x) setValueX({ field: 'expacct', value: { name: x, remove: true } }); });
}
let exDupKey = '';
// コース・セット・飲み放題: 商品を組んで1人前の原価 → 目標原価率で売値を提案。飲み会は人数と値引きで原価率と粗利
let crsEdit = null;
function renderCourses() {
  const wrap = $('course-wrap'), box = $('courses'), pbox = $('party'); if (!wrap) return;
  if (noMoney() || !PL('analysis')) { wrap.hidden = true; return; }
  wrap.hidden = false;
  const cs = D.courses || [], goods = D.products.filter(p => p.kind !== 'part'), tgt = (D.shopInfo || {}).targetRate || 30;
  const pct = v => v == null ? '—' : v + '%';
  const card = c => `<div class="crs"><div class="hd2"><b>${esc(c.name)}</b><span class="k">${c.type === 'drink' ? `飲み放題 ・ 1人 ${c.cups}杯` : `コース ・ ${c.items.length}品`} ・ 目標 ${c.target}% ・ ${c.serve === 'takeout' ? '持ち帰り' : '店内'}</span><span><button class="btn ghost sm" type="button" data-ce="${esc(c.name)}">編集</button> <button class="btn ghost sm" type="button" data-cx="${esc(c.name)}">削除</button></span></div>
    <div class="nums"><div><span>1人あたりの原価</span><b>${c.cost ? yen(c.cost) : '—'}</b></div><div><span>売価の目安(税込)</span><b class="ac">${c.guide ? yen(c.guide) : '—'}</b></div><div><span>今の売値</span><b>${c.price ? yen(c.price) : '未設定'}</b></div><div><span>原価率</span><b class="${c.ratio != null && c.ratio > c.target + 5 ? 'ng' : ''}">${pct(c.ratio)}</b></div>${c.margin != null ? `<div><span>1人あたりの粗利(税抜)</span><b>${yen(c.margin)}</b></div>` : ''}</div>
    <p class="say">${esc(c.say)}</p>
    <p class="its">${c.items.map(i => `${esc(i.name)}${i.qty !== 1 ? ' ×' + i.qty : ''}${i.cost != null ? ` ${yen(i.cost)}` : ` <span class="ng">(原価未設定)</span>`}`).join(' ・ ')}${c.note ? `<br>${esc(c.note)}` : ''}</p></div>`;
  const e = crsEdit || {};
  const form = `<div class="crs crs-f" id="crs-form"><div class="row" style="flex-wrap:wrap;gap:8px"><input id="cr-name" placeholder="名前(例: 季節のコース、2時間飲み放題)" value="${esc(e.name || '')}" maxlength="40" style="flex:1 1 200px;min-width:0"><select id="cr-type" aria-label="種類"><option value="course"${e.type !== 'drink' ? ' selected' : ''}>コース・セット</option><option value="drink"${e.type === 'drink' ? ' selected' : ''}>飲み放題</option></select><select id="cr-serve" aria-label="出し方"><option value="eatin"${e.serve !== 'takeout' ? ' selected' : ''}>店内(10%)</option><option value="takeout"${e.serve === 'takeout' ? ' selected' : ''}>持ち帰り(8%)</option></select></div>
    <div id="cr-rows">${(e.items && e.items.length ? e.items : [{ name: '', qty: 1 }]).map(i => `<div class="rw"><input class="cr-n" list="cr-list" placeholder="料理・ドリンク(商品名)" value="${esc(i.name)}"><input class="cr-q" inputmode="decimal" value="${i.qty || 1}" aria-label="数"><button class="btn ghost sm" type="button" data-cr-del aria-label="この行を削除">✕</button></div>`).join('')}</div>
    <datalist id="cr-list">${goods.map(p => `<option value="${esc(p.name)}">`).join('')}</datalist>
    <div class="row" style="flex-wrap:wrap;gap:8px;justify-content:flex-start"><button class="btn ghost sm" type="button" id="cr-add">＋ 品目を追加</button><span class="k">現在の売価(税込)</span><input id="cr-price" inputmode="numeric" value="${e.price || ''}" placeholder="例 5000" style="width:7em"><span class="k">目標原価率</span><input id="cr-tgt" inputmode="numeric" value="${e.target || ''}" placeholder="${tgt}" style="width:4em"><span class="k">%</span><span id="cr-cups-w"${e.type === 'drink' ? '' : ' hidden'}><span class="k">1人あたりの平均杯数</span><input id="cr-cups" inputmode="numeric" value="${e.cups || 4}" style="width:4em"></span></div>
    <input id="cr-note" placeholder="メモ(任意。例: 前菜・魚・肉・デザート)" value="${esc(e.note || '')}" maxlength="120">
    <div class="ask"><button class="btn" type="button" id="cr-go">${e.name ? '保存して計算' : '作って計算'}</button>${crsEdit ? '<button class="btn ghost" type="button" id="cr-cancel">やめる</button>' : ''}</div></div>`;
  box.innerHTML = `<p class="k" style="margin:0">料理は、原価の画面に登録された商品から選びます。飲み放題は、複数のドリンクを登録すると1杯あたりの平均原価で計算します。目標原価率を空欄にすると、設定の${tgt}%を使います。</p>${cs.map(card).join('')}${form}`;
  box.querySelectorAll('[data-ce]').forEach(b => b.onclick = () => { crsEdit = cs.find(c => c.name === b.dataset.ce); renderCourses(); $('crs-form').scrollIntoView({ block: 'nearest' }); });
  box.querySelectorAll('[data-cx]').forEach(b => b.onclick = () => { if (confirm(`「${b.dataset.cx}」を削除しますか?`)) setValueX({ field: 'course', value: { name: b.dataset.cx, remove: true } }); });
  $('cr-type').onchange = () => { $('cr-cups-w').hidden = $('cr-type').value !== 'drink'; };
  const bindDel = () => box.querySelectorAll('[data-cr-del]').forEach(x => x.onclick = () => { if ($('cr-rows').children.length > 1) x.parentNode.remove(); });
  bindDel();
  $('cr-add').onclick = () => { $('cr-rows').insertAdjacentHTML('beforeend', '<div class="rw"><input class="cr-n" list="cr-list" placeholder="料理・ドリンク(商品名)"><input class="cr-q" inputmode="decimal" value="1" aria-label="数"><button class="btn ghost sm" type="button" data-cr-del aria-label="この行を削除">✕</button></div>'); bindDel(); $('cr-rows').lastElementChild.querySelector('.cr-n').focus(); };
  if ($('cr-cancel')) $('cr-cancel').onclick = () => { crsEdit = null; renderCourses(); };
  $('cr-go').onclick = async () => {
    const name = $('cr-name').value.trim(); if (!name) { $('cr-name').focus(); return; }
    const items = [...$('cr-rows').querySelectorAll('.rw')].map(r => ({ name: r.querySelector('.cr-n').value.trim(), qty: parseFloat(r.querySelector('.cr-q').value) || 1 })).filter(i => i.name);
    if (!items.length) { $('cr-rows').querySelector('.cr-n').focus(); return; }
    const out = await api({ kind: 'app_set', field: 'course', value: { name, type: $('cr-type').value, serve: $('cr-serve').value, items, price: $('cr-price').value, target: $('cr-tgt').value, cups: $('cr-cups').value, note: $('cr-note').value } }).catch(() => ({ ok: false, error: '通信できませんでした' }));
    if (!out.ok) { toast(out.error || '保存できませんでした', 'ng'); return; }
    crsEdit = null; D = out.data; renderAll(); chat(out.msg || '保存しました');
  };
  // 飲み会・宴会の料金
  const foods = cs.filter(c => c.type !== 'drink'), drinks = cs.filter(c => c.type === 'drink');
  pbox.innerHTML = `<p style="margin:0 0 4px"><b>宴会の料金設定</b></p><p class="k" style="margin:0 0 8px">コースと飲み放題を選び、人数を入力すると、1人あたりの料金の目安と全体の原価率・粗利が表示されます。値引きした場合の試算もできます。</p>
    <div class="row" style="flex-wrap:wrap;gap:8px;justify-content:flex-start"><select id="pt-food" aria-label="コース"><option value="">コースなし</option>${foods.map(c => `<option value="${esc(c.name)}">${esc(c.name)}</option>`).join('')}</select><select id="pt-drink" aria-label="飲み放題"><option value="">飲み放題なし</option>${drinks.map(c => `<option value="${esc(c.name)}">${esc(c.name)}</option>`).join('')}</select><span class="k">人数</span><input id="pt-n" inputmode="numeric" value="8" style="width:4em"><span class="k">1人あたりの料金(税込)</span><input id="pt-price" inputmode="numeric" placeholder="空欄の場合は目安額" style="width:7em"><span class="k">1人あたりの値引き</span><input id="pt-disc" inputmode="numeric" placeholder="0" style="width:5em"><button class="btn" type="button" id="pt-go">計算</button></div>
    <div id="pt-out" style="margin-top:10px"></div>`;
  if (!cs.length) { pbox.hidden = true; } else pbox.hidden = false;
  $('pt-go').onclick = async () => {
    const out = await api({ kind: 'app_set', field: 'party', value: { course: $('pt-food').value, drink: $('pt-drink').value, people: $('pt-n').value, price: $('pt-price').value, discount: $('pt-disc').value } }).catch(() => ({ ok: false }));
    if (!out.ok) { toast(out.error || '計算できませんでした', 'ng'); return; }
    const p = out.party;
    $('pt-out').innerHTML = `<div class="crs"><div class="nums"><div><span>1人あたりの料金(税込)</span><b class="ac">${yen(p.price1)}</b></div><div><span>1人あたりの原価</span><b>${yen(p.cost1)}</b></div><div><span>${p.people}名の売上</span><b>${yen(p.total)}</b></div><div><span>粗利(税抜)</span><b>${yen(p.margin)}</b></div><div><span>原価率</span><b class="${p.ratio > p.target + 5 ? 'ng' : ''}">${p.ratio == null ? '—' : p.ratio + '%'}</b></div>${p.discount ? `<div><span>値引き後の原価率</span><b class="${p.ratioAfter > p.target + 5 ? 'ng' : ''}">${p.ratioAfter}%</b></div>` : ''}</div><p class="say">${esc(p.say)}</p></div>`;
  };
}
// 理論と実際の差(簡易版): 月ごとに2本の棒(レシピどおり / 実際の仕入額)と差、材料の上位5つ
function renderGap() {
  const wrap = $('gap-wrap'), box = $('gap'); if (!wrap) return;
  if (noMoney() || !PL('analysis') || !Array.isArray(D.gap)) { wrap.hidden = true; return; }
  wrap.hidden = false;
  if (!D.gap.length) { box.innerHTML = '<p class="k" style="margin:0">請求書と製造数(製造メモ)がそろうと、ここに月ごとの差額が表示されます。製造数は「どら焼き 40個」のように入力できます。</p>'; return; }
  const cards = D.gap.slice().reverse().map(g => {
    const mx = Math.max(g.theory, g.actual, 1), pct = v => Math.round(v / mx * 100), ym = g.ym.slice(0, 4) + '年' + (+g.ym.slice(5)) + '月';
    const note = !g.madeN ? '製造数(製造メモ)の記録がない月です。差額は算出できません' : !g.invN ? '請求書がない月' : g.rate == null ? '' : g.rate > 15 ? '仕入額がレシピより' + g.rate + '%多くなっています。ロス・分量のばらつき・在庫の増加をご確認ください' : g.rate < -15 ? '仕入額がレシピより少なくなっています。在庫の使用、または製造数の入力漏れが考えられます' : 'レシピどおりの範囲内(±15%)';
    return `<div class="gapc"><div class="ym">${ym}<span>作った ${g.madeN}${U} ・ 請求書 ${g.invN}行</span></div>
      <div class="gbar"><span>レシピどおり</span><i><b style="width:${pct(g.theory)}%"></b></i><em>${yen(g.theory)}</em></div>
      <div class="gbar ac"><span>実際の仕入額</span><i><b style="width:${pct(g.actual)}%"></b></i><em>${yen(g.actual)}</em></div>
      <p class="df">差 <b class="${g.rate == null ? '' : Math.abs(g.rate) > 15 ? 'ng' : 'ok'}">${g.diff >= 0 ? '+' : ''}${yen(g.diff)}</b>${g.rate != null ? ` <span class="k">(${g.rate >= 0 ? '+' : ''}${g.rate}%)</span>` : ''}</p>
      ${note ? `<p class="k" style="margin:4px 0 0">${esc(note)}</p>` : ''}
      ${g.top.length ? `<table class="gapt"><tr><th>材料</th><th>買った</th><th>理論使用量</th><th>差</th></tr>${g.top.map(t => `<tr><td>${esc(t.display)}</td><td>${t.boughtG ? fmtG(t.boughtG) : '—'}<br><span class="k">${yen(t.boughtYen)}</span></td><td>${t.usedG ? fmtG(t.usedG) : '—'}<br><span class="k">${yen(t.usedYen)}</span></td><td class="${Math.abs(t.diffYen) > Math.max(500, t.usedYen * 0.2) ? 'ng' : ''}" style="font-weight:700">${t.diffYen >= 0 ? '+' : ''}${yen(t.diffYen)}</td></tr>`).join('')}</table>` : ''}</div>`;
  });
  box.innerHTML = `<div class="gapm">${cards.join('')}</div><p class="k" style="margin:10px 0 0">レシピどおり＝製造数 × レシピの分量 × 現在の材料単価。実際＝その月の請求書の材料の行(包材は除く)。材料の在庫が増えた月は「実際」が大きくなります。</p>`;
}
const fmtG = v => v >= 1000 ? (Math.round(v / 100) / 10) + 'kg' : Math.round(v) + 'g';
function renderSales() {
  renderGap();
  renderCourses();
  renderMoney();
  renderMenuA();
  if ($('sales-bulk')) $('sales-bulk').hidden = noMoney();
  const sa = D.sales || {}, ms = Object.keys(sa).sort().reverse(), chips = $('sales-chips');
  $('sales-add').innerHTML = `<p style="margin:0 0 8px"><b>写真がない場合は数値で入力</b></p><div class="fld"><span class="k">日付</span><input id="sl-date" type="date" value="${new Date().toLocaleDateString('sv-SE')}"><span class="k">売上(税込)</span><input id="sl-total" inputmode="numeric" placeholder="52300"><span class="k">客数</span><input id="sl-cust" inputmode="numeric" placeholder="48(なくても可)"></div><div class="ask"><button class="btn" type="button" id="sl-go">記録する</button><span class="k">${SHOT}精算レシートを撮影する方法が簡単です</span></div>`;
  $('sl-go').onclick = () => { const t = $('sl-total').value.trim(); if (!t) { chat('売上の金額を入力してください'); return; } setValueX({ field: 'sales', value: { date: $('sl-date').value, total: t, customers: $('sl-cust').value.trim() } }); };
  if (!ms.length) { chips.innerHTML = ''; $('sales-box').innerHTML = emptyBox('sales', '売上の記録はまだありません', '閉店後にレジの精算レシートを撮影すると、売上と粗利がここに表示されます。', ['レシートを撮影', 'cam']); return; }
  const sel = chips.dataset.m && ms.includes(chips.dataset.m) ? chips.dataset.m : ms[0];
  chips.innerHTML = ms.map(m => `<button class="chip" type="button" data-m="${m}" aria-pressed="${m === sel}">${m.replace('-', '年')}月</button>`).join('');
  chips.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { chips.dataset.m = b.dataset.m; renderSales(); });
  const o = sa[sel], items = Object.keys(o.items).sort((a, b) => (o.items[b].amount - o.items[b].cost) - (o.items[a].amount - o.items[a].cost)), unk = Object.keys(o.unknown || {});
  const rate = o.madeCost ? Math.round(o.madeCost / Math.max(1, o.total) * 100) : null;
  const [sy, smn] = sel.split('-').map(Number), nd = new Date(sy, smn, 0).getDate(), daily = []; for (let d = 1; d <= nd; d++) { const k = `${sel}-${String(d).padStart(2, '0')}`; daily.push({ l: String(d), v: (o.days || {})[k] || 0 }); }
  const prof = o.madeCost ? o.total - o.madeCost : null;
  $('sales-box').innerHTML = `<div class="card">${tiles([{ t: '売上(税込)', v: yen(o.total), c: 'sales', k: `${o.nDays}日分 · 1日平均 ${yen(o.total / Math.max(1, o.nDays))}` }, { t: '製造分の材料費', v: o.madeCost ? yen(o.madeCost) : '<span class="k">—</span>', c: 'cost', k: rate != null ? `原価率の目安 ${rate}%` : '1個の重さと製造数から算出' }, { t: '粗利(材料費を差し引いた額)', v: prof != null ? yen(prof) : '<span class="k">—</span>', c: 'ws', k: '人件費・光熱費は含みません' }])}
    <p class="ct" style="margin-top:12px">日ごとの売上</p>${barsV(daily, 'var(--c-sales)', { label: '日ごとの売上', h: 150 })}</div>
    <div class="card" hidden><div class="row"><span>売上(税込)</span><span class="big">${yen(o.total)}</span></div>
      <p class="k" style="margin:4px 0 0">${o.nDays}日分 · 1日平均 ${yen(o.total / Math.max(1, o.nDays))}${o.customers ? ` · 客数 ${o.customers}人 · 客単価 ${yen(o.total / o.customers)}` : ''}</p>
      ${rate != null ? `<div class="row" style="margin-top:8px"><span>製造分の材料費</span><b>${yen(o.madeCost)}</b></div><p class="k" style="margin:4px 0 0">原価率の目安 ${rate}%(製造メモ × 1${U}の原価 ÷ 売上)</p>` : ''}</div>
    ${items.length ? `<div class="card"><p style="margin:0 0 8px"><b>商品ごとの粗利</b> <span class="k">売上 − 材料費</span></p>${barsH(items.slice(0, 8).map(n => ({ l: n, v: o.items[n].amount - o.items[n].cost })), 'var(--c-sales)')}<table><tr><td class="k">商品</td><td class="n k">数</td><td class="n k">売上</td><td class="n k">粗利</td></tr>${items.map(n => { const x = o.items[n], g = x.amount - x.cost; return `<tr><td>${esc(n)}${x.unit == null ? ' <span class="pill warn">重さ待ち</span>' : ''}</td><td class="n">${x.qty}</td><td class="n">${yen(x.amount)}</td><td class="n"><b>${yen(g)}</b><br><span class="k">${x.amount ? Math.round(g / x.amount * 100) : 0}%</span></td></tr>`; }).join('')}</table>
      <p class="k" style="margin:8px 0 0">人件費・光熱費などは含みません。材料費のみを差し引いた額です</p></div>` : ''}
    ${unk.length ? `<div class="card"><p style="margin:0 0 8px"><b>レジの商品名と商品の対応付け</b></p><p class="k" style="margin:0 0 8px">レジで商品ごとに登録している名前に、ピタット原価の商品を対応付けると粗利が表示されます。部門(和菓子など)はそのままで構いません</p>
      ${unk.map((u, i) => `<div class="ask"><span style="min-width:7em">${esc(u)} <span class="k">${yen(o.unknown[u])}</span></span><select id="ra-${i}" style="font:inherit;font-size:14px;padding:4px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink)"><option value="">選ぶ</option>${D.products.map(p => `<option>${esc(p.name)}</option>`).join('')}</select><button class="btn ghost" type="button" data-ra="${i}" data-reg="${esc(u)}">対応付ける</button></div>`).join('')}</div>` : ''}`;
  $('sales-box').querySelectorAll('[data-ra]').forEach(b => b.onclick = () => { const p = $('ra-' + b.dataset.ra).value; if (!p) return; setValueX({ field: 'regalias', reg: b.dataset.reg, product: p }); });
}
// ---------- 発信: SNSに投稿する画像・店頭掲示物(ポップ・値札・貼り紙)・投稿の予定表 ----------
// 絵は画面の中(canvas)で作る。AIは言葉だけ(型の一言だけなら、AIを使わずに作れる)。
// お店の型(ロゴ・色・書体)を登録すると、どの型にも入るので、ほかのお店と同じ見た目にならない
const FONTS = {
  mincho: { css: '"Shippori Mincho B1","Hiragino Mincho ProN","Yu Mincho",serif', label: '明朝(和風)' },
  maru: { css: '"Zen Maru Gothic","Hiragino Maru Gothic ProN",sans-serif', label: '丸ゴシック(柔らかい印象)' },
  gothic: { css: '"Noto Sans JP","Hiragino Sans","Yu Gothic",sans-serif', label: 'ゴシック(すっきりした印象)' }
};
// 型: 色・模様・書体と、そのまま使える一言
const TPL = {
  wa: { label: '和', bg: '#f5ecdc', bg2: '#ead9bd', ink: '#2b1d12', accent: '#a8322a', soft: '#7a5a3a', font: 'mincho', motif: 'circles', c: 'いつもの味を、どうぞ', s: 'ひとつひとつ手づくりしています' },
  yo: { label: '洋', bg: '#1f2a44', bg2: '#2b3a5c', ink: '#fbf6ea', accent: '#c9a45c', soft: '#d9cfb6', font: 'mincho', motif: 'frame', c: '季節のお菓子', s: 'ショーケースでお待ちしています' },
  pan: { label: 'パン', bg: '#efe0c8', bg2: '#d9bf96', ink: '#3b2614', accent: '#8a4b1c', soft: '#6e4d2c', font: 'maru', motif: 'dots', c: '焼きたてです', s: 'お昼ごはんに、おやつに' },
  white: { label: 'しろ', bg: '#ffffff', bg2: '#eef3f1', ink: '#1d2a28', accent: '#2f7d6d', soft: '#5d6b68', font: 'maru', motif: 'circles', c: '本日のおすすめ', s: '数に限りがあります。お早めにどうぞ' },
  pop: { label: 'あかるい', bg: '#ffe9a8', bg2: '#ffd45e', ink: '#3a2306', accent: '#d9481c', soft: '#7a5214', font: 'maru', motif: 'circles', c: 'できたて！', s: 'お店でお待ちしています' },
  newyear: { label: '正月', bg: '#b4232a', bg2: '#d33a3f', ink: '#fff8e6', accent: '#e9c46a', soft: '#f6e3b4', font: 'mincho', motif: 'sun', c: '謹賀新年', s: '本年もどうぞよろしくお願いいたします' },
  sakura: { label: '桜', bg: '#fdeef2', bg2: '#f8c9d6', ink: '#4a2230', accent: '#d6577a', soft: '#8a5566', font: 'mincho', motif: 'petals', c: '桜の季節になりました', s: '春のお菓子が並んでいます' },
  shinryoku: { label: '新緑', bg: '#eef6e6', bg2: '#cfe6b8', ink: '#1f3318', accent: '#4f8a2e', soft: '#557048', font: 'maru', motif: 'leaves', c: '新茶の季節に', s: 'さわやかなお菓子をどうぞ' },
  natsu: { label: '夏', bg: '#e6f5fb', bg2: '#bfe5f3', ink: '#123247', accent: '#1d7fb3', soft: '#46708a', font: 'maru', motif: 'waves', c: '冷たいお菓子はじめました', s: '暑い日のおやつに' },
  aki: { label: '秋', bg: '#f7ead9', bg2: '#ebc79c', ink: '#3a2412', accent: '#b5541c', soft: '#7a5634', font: 'mincho', motif: 'leaves', c: '秋の味覚が並びました', s: '栗やお芋のお菓子をどうぞ' },
  oseibo: { label: 'お歳暮', bg: '#18352d', bg2: '#24493e', ink: '#f7f1e3', accent: '#d8b45a', soft: '#d6cdb6', font: 'mincho', motif: 'frame', c: '冬のご挨拶に', s: 'お歳暮・手みやげのご予約を承ります' },
  xmas: { label: 'クリスマス', bg: '#7a1d24', bg2: '#94262f', ink: '#fff8ee', accent: '#e8c46a', soft: '#f3dcc0', font: 'maru', motif: 'snow', c: 'クリスマスのご予約受付中', s: '数に限りがあります。お早めにどうぞ' }
};
const SIZES = { sq: [1080, 1080, '正方形(インスタ投稿)'], tall: [1080, 1350, '縦長(インスタ投稿)'], story: [1080, 1920, 'ストーリー'], wide: [1200, 628, '横長(LINE・お知らせ)'] };
const PS = { tpl: store.get('pTpl', 'wa'), size: 'sq', photo: null, auto: true, zoom: 1, ox: 0, oy: 0, bright: 0, d: null, c: null, s: null, useName: true };
const brand = () => { const si = (D && D.shopInfo) || {}; return { color: si.brandColor || '', font: si.brandFont || '', logo: si.brandLogo || '' }; };
let LOGO = null, LOGO_SRC = '';
function logoImg() { const b = brand(); if (!b.logo) { LOGO = null; LOGO_SRC = ''; return null; } if (LOGO_SRC !== b.logo) { LOGO_SRC = b.logo; LOGO = new Image(); LOGO.onload = () => snsDraw(); LOGO.src = b.logo; } return LOGO && LOGO.complete && LOGO.naturalWidth ? LOGO : null; }
function wrapJa(ctx, text, maxW) {
  const out = []; let line = '';
  for (const ch of String(text || '')) {
    if (ch === '\n') { out.push(line); line = ''; continue; }
    if (ctx.measureText(line + ch).width > maxW && line) { if (/^[、。」』）)！!？?ー〜]$/.test(ch)) { line += ch; out.push(line); line = ''; continue; } out.push(line); line = ch; } else line += ch;
  }
  if (line) out.push(line); return out;
}
// 写真を整える: 小さく縮めて明るさと色かぶりを測り、商品のありそうな所(細かい模様が多い所)を中心にする
function analyzePhoto(im) {
  const n = 64, cv = document.createElement('canvas'); cv.width = n; cv.height = n; const c = cv.getContext('2d'); c.drawImage(im, 0, 0, n, n);
  const px = c.getImageData(0, 0, n, n).data; let r = 0, g = 0, b = 0, sx = 0, sy = 0, sw = 0; const L = new Float32Array(n * n);
  for (let i = 0; i < n * n; i++) { r += px[i * 4]; g += px[i * 4 + 1]; b += px[i * 4 + 2]; L[i] = .299 * px[i * 4] + .587 * px[i * 4 + 1] + .114 * px[i * 4 + 2]; }
  for (let y = 1; y < n - 1; y++) for (let x = 1; x < n - 1; x++) { const i = y * n + x, e = Math.abs(L[i + 1] - L[i - 1]) + Math.abs(L[i + n] - L[i - n]); const w = e * e; sx += x * w; sy += y * w; sw += w; }
  r /= n * n; g /= n * n; b /= n * n; const m = (r + g + b) / 3;
  return { cx: sw ? sx / sw / n : .5, cy: sw ? sy / sw / n : .5, gain: Math.max(.9, Math.min(1.5, 128 / Math.max(m, 1))), wb: [m / Math.max(r, 1), m / Math.max(g, 1), m / Math.max(b, 1)] };
}
function photoFilter(o) {
  const a = PS.photo && PS.photo.an; if (!a) return 'none';
  const br = (o.auto ? a.gain : 1) * (1 + PS.bright / 100);
  // 色かぶりは半分だけ戻す(やりすぎると料理の色が変わる)
  const sat = o.auto ? 1.08 : 1; return `brightness(${br.toFixed(3)}) saturate(${sat}) contrast(${o.auto ? 1.05 : 1})`;
}
function motif(c, T, kind, w, h, u, acc) {
  c.save(); c.globalAlpha = .5; c.fillStyle = T.bg2; c.strokeStyle = acc;
  if (kind === 'circles') { c.beginPath(); c.arc(w * .92, h * .1, w * .32, 0, 7); c.fill(); c.beginPath(); c.arc(w * .05, h * .95, w * .26, 0, 7); c.fill(); }
  if (kind === 'dots') { for (let y = 40 * u; y < h; y += 60 * u) for (let x = (y / (60 * u)) % 2 ? 40 * u : 70 * u; x < w; x += 60 * u) { c.beginPath(); c.arc(x, y, 6 * u, 0, 7); c.fill(); } }
  if (kind === 'sun') { c.globalAlpha = .35; c.fillStyle = acc; c.beginPath(); c.arc(w * .82, h * .2, w * .2, 0, 7); c.fill(); }
  if (kind === 'petals' || kind === 'leaves' || kind === 'snow') {
    let s = 7; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < 26; i++) { const x = rnd() * w, y = rnd() * h, r = (12 + rnd() * 22) * u; if (Math.abs(y - h / 2) < h * .22 && x > w * .15 && x < w * .85) continue;
      c.save(); c.translate(x, y); c.rotate(rnd() * 6.3); c.fillStyle = kind === 'snow' ? '#ffffff' : kind === 'leaves' ? acc : '#f4a7bb'; c.globalAlpha = kind === 'snow' ? .7 : .45;
      c.beginPath(); if (kind === 'snow') c.arc(0, 0, r * .35, 0, 7); else { c.ellipse(0, 0, r, r * .55, 0, 0, 7); } c.fill(); c.restore(); }
  }
  if (kind === 'waves') { c.lineWidth = 5 * u; c.globalAlpha = .35; for (let k = 0; k < 3; k++) { c.beginPath(); const y0 = h * (.82 + k * .05); for (let x = 0; x <= w; x += 10 * u) c.lineTo(x, y0 + Math.sin(x / (60 * u) + k) * 14 * u); c.stroke(); } }
  c.restore();
}
// 1枚の絵を描く。kind: sns / pop / notice
function drawCard(cv, o) {
  const T = TPL[o.tpl] || TPL.wa, b = o.brand || {}, w = cv.width, h = cv.height, c = cv.getContext('2d'), u = Math.min(w, h * 1.25) / 1080;
  const acc = b.color || T.accent, F = (FONTS[b.font] || FONTS[T.font]).css;
  c.clearRect(0, 0, w, h); c.filter = 'none';
  const photo = o.photo && o.kind === 'sns';
  if (photo) {
    const im = o.photo, a = im.an || { cx: .5, cy: .5 }, sc = Math.max(w / im.width, h / im.height) * o.zoom, iw = im.width * sc, ih = im.height * sc;
    let x = w / 2 - (o.auto ? a.cx : .5) * iw + o.ox * w, y = h / 2 - (o.auto ? a.cy : .5) * ih + o.oy * h;
    x = Math.min(0, Math.max(w - iw, x)); y = Math.min(0, Math.max(h - ih, y));
    c.filter = o.filter || 'none'; c.drawImage(im, x, y, iw, ih); c.filter = 'none';
    const g = c.createLinearGradient(0, h * .38, 0, h); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.72)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  } else {
    c.fillStyle = T.bg; c.fillRect(0, 0, w, h); motif(c, T, T.motif, w, h, u, acc);
    c.strokeStyle = acc; c.lineWidth = 6 * u; c.strokeRect(36 * u, 36 * u, w - 72 * u, h - 72 * u);
    c.lineWidth = 2 * u; c.strokeRect(50 * u, 50 * u, w - 100 * u, h - 100 * u);
  }
  const ink = photo ? '#fff' : T.ink, soft = photo ? 'rgba(255,255,255,.88)' : T.soft, pad = 110 * u, maxW = w - pad * 2;
  c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  // 上: ロゴと店名
  const lg = o.logo; let topY = 130 * u;
  if (!photo) {
    if (lg) { const s = 110 * u, r = lg.width / lg.height, lw = r >= 1 ? s * Math.min(r, 2.4) : s * r; if (['yo', 'newyear', 'oseibo', 'xmas'].includes(o.tpl)) { c.fillStyle = 'rgba(255,255,255,.92)'; c.beginPath(); c.roundRect ? c.roundRect(w / 2 - lw / 2 - 18 * u, 68 * u, lw + 36 * u, s + 24 * u, 20 * u) : c.rect(w / 2 - lw / 2 - 18 * u, 68 * u, lw + 36 * u, s + 24 * u); c.fill(); } c.drawImage(lg, w / 2 - lw / 2, 80 * u, lw, s); topY = 80 * u + s + 46 * u; }
    c.fillStyle = acc; c.font = `700 ${40 * u}px ${F}`; c.fillText(o.shop || '', w / 2, topY);
  }
  let fs = (o.kind === 'notice' ? 84 : 116) * u; c.font = `700 ${fs}px ${F}`;
  let lines = wrapJa(c, o.catch, maxW);
  while ((lines.length > 3 || (lines.length > 1 && [...lines[lines.length - 1]].length <= 2)) && fs > 64 * u) { fs -= 4 * u; c.font = `700 ${fs}px ${F}`; lines = wrapJa(c, o.catch, maxW); }
  const sfs = (o.kind === 'notice' ? 58 : 46) * u; c.font = `500 ${sfs}px ${F}`; const slines = wrapJa(c, o.sub, maxW).slice(0, o.kind === 'notice' ? 8 : 3);
  const nm = o.name ? o.name + (o.price ? '  ' + Number(o.price).toLocaleString('ja-JP') + '円' : '') : '';
  const blockH = lines.length * fs * 1.25 + (slines.length ? 40 * u + slines.length * sfs * 1.5 : 0) + (nm ? 110 * u : 0);
  let y = photo ? h - 120 * u - blockH + fs : Math.max(topY + 90 * u + fs * .5, (h - blockH) / 2 + fs * .9);
  if (photo) c.textAlign = 'left';
  const x = photo ? pad * .7 : w / 2;
  c.fillStyle = ink; c.font = `700 ${fs}px ${F}`;
  if (photo) { c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 12 * u; }
  lines.forEach(l => { c.fillText(l, x, y); y += fs * 1.25; });
  if (!photo && lines.length) { c.fillStyle = acc; c.fillRect(w / 2 - 60 * u, y - fs * .55, 120 * u, 6 * u); }
  y += 40 * u - fs * .25 + sfs; c.fillStyle = soft; c.font = `500 ${sfs}px ${F}`;
  slines.forEach(l => { c.fillText(l, x, y); y += sfs * 1.5; });
  if (nm) {
    y += 40 * u; c.font = `700 ${52 * u}px ${F}`; const tw = Math.min(maxW, c.measureText(nm).width + 70 * u), bx = photo ? x - 10 * u : w / 2 - tw / 2;
    c.shadowBlur = 0; c.fillStyle = photo ? 'rgba(255,255,255,.92)' : acc; c.beginPath(); c.roundRect ? c.roundRect(bx, y - 62 * u, tw, 88 * u, 44 * u) : c.rect(bx, y - 62 * u, tw, 88 * u); c.fill();
    c.fillStyle = photo ? T.ink : (o.tpl === 'yo' || o.tpl === 'oseibo' ? T.bg : '#fff'); c.textAlign = 'center'; c.fillText(nm, bx + tw / 2, y - 2 * u);
  }
  c.shadowBlur = 0;
  if (photo) {
    c.textAlign = 'right'; let ry = 80 * u;
    if (lg) { const s = 90 * u, lw = s * Math.min(lg.width / lg.height, 2.4); c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.roundRect ? c.roundRect(w - 40 * u - lw - 20 * u, 30 * u, lw + 20 * u, s + 20 * u, 18 * u) : c.rect(w - 60 * u - lw, 30 * u, lw + 20 * u, s + 20 * u); c.fill(); c.drawImage(lg, w - 50 * u - lw, 40 * u, lw, s); ry = 40 * u + s + 50 * u; }
    c.fillStyle = 'rgba(255,255,255,.95)'; c.font = `700 ${34 * u}px ${F}`; c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 8 * u; c.fillText(o.shop || '', w - 50 * u, ry); c.shadowBlur = 0;
  }
}
async function fontsReady() { try { await Promise.all(['"Shippori Mincho B1"', '"Zen Maru Gothic"', '"Noto Sans JP"'].map(f => document.fonts.load(`700 40px ${f}`))); } catch (e) {} }
function cardOpts(kind) {
  const T = TPL[PS.tpl] || TPL.wa, d = PS.d || {};
  return { kind, tpl: PS.tpl, brand: brand(), logo: logoImg(), photo: PS.photo, auto: PS.auto, zoom: PS.zoom, ox: PS.ox, oy: PS.oy, filter: photoFilter(PS), shop: D.shop,
    catch: PS.c != null ? PS.c : T.c, sub: PS.s != null ? PS.s : T.s, name: PS.useName && d.name ? d.name : '', price: d.price };
}
function snsDraw() { const cv = $('ps-cv'); if (!cv) return; const [w, h] = SIZES[PS.size]; cv.width = w; cv.height = h; drawCard(cv, cardOpts('sns')); }
function canvasBlob(cv, type) { return new Promise(r => cv.toBlob(r, type || 'image/png', .92)); }
function printImage(cv, size) {
  const url = cv.toDataURL('image/jpeg', .92);
  openPrint(`<style>@page{size:${size};margin:0}.pimg{max-width:100%;max-height:calc(100vh - 110px);box-shadow:0 2px 12px rgba(0,0,0,.15)}@media print{.pimg{max-height:none;width:100%;box-shadow:none;display:block}}</style><div style="text-align:center"><img class="pimg" src="${url}" alt=""></div>`, { bare: true });
}
// 値札カード(A4に8枚)。商品名・値段・アレルゲン。お店の色と書体が入る
function priceCards(list) {
  const T = TPL[PS.tpl] || TPL.wa, b = brand(), acc = b.color || T.accent, F = (FONTS[b.font] || FONTS[T.font]).css, lg = b.logo ? `<img src="${b.logo}" alt="" style="height:9mm;max-width:30mm;object-fit:contain;display:block;margin:0 auto 1mm">` : '';
  const cards = list.map(p => `<div class="pc" style="border-color:${acc};background:${T.bg};color:${T.ink};font-family:${esc(F)}">${lg}<div class="pc-shop" style="color:${acc}">${esc(D.shop)}</div><div class="pc-name">${esc(p.name)}</div><div class="pc-price">${p.price ? Number(p.price).toLocaleString('ja-JP') + '<small>円</small>' : '<span style="display:inline-block;width:32mm;border-bottom:.4mm solid currentColor">&nbsp;</span><small>円</small>'}</div>${p.label && p.label.allergens && p.label.allergens.length ? `<div class="pc-al">アレルゲン: ${esc(p.label.allergens.join('・'))}</div>` : ''}</div>`).join('');
  openPrint(`<style>@page{size:A4;margin:8mm}.pcs{display:grid;grid-template-columns:1fr 1fr;gap:4mm}.pc{border:1.2mm double;border-radius:3mm;height:62mm;padding:4mm 5mm;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;text-align:center;break-inside:avoid}.pc-shop{font-size:10pt;font-weight:700;letter-spacing:.1em}.pc-name{font-size:20pt;font-weight:700;line-height:1.3;margin:2mm 0}.pc-price{font-size:26pt;font-weight:700}.pc-price small{font-size:12pt;margin-left:1mm}.pc-al{font-size:8.5pt;margin-top:2mm;opacity:.85}</style><div class="pcs">${cards}</div>`, { bare: true });
}
// 投稿の予定表: 季節の行事と、お店の予定(休み・催事)から「今週はこれを出すとよい」
function nthWeekday(y, m, n, wd) { const d = new Date(y, m, 1); const add = (wd - d.getDay() + 7) % 7 + (n - 1) * 7; return new Date(y, m, 1 + add); }
function seasonEvents(y) {
  const E = (m, d, t, tpl, theme) => ({ date: new Date(y, m - 1, d), t, tpl, theme });
  return [E(1, 1, 'お正月', 'newyear', '新年のごあいさつと営業日のお知らせ'), E(1, 11, '鏡開き', 'wa', 'お汁粉・ぜんざいのお知らせ'), E(2, 3, '節分', 'wa', '節分のお菓子'), E(2, 14, 'バレンタイン', 'yo', 'バレンタインの贈りもの'),
    E(3, 3, 'ひな祭り', 'sakura', 'ひな祭りのお菓子'), E(3, 14, 'ホワイトデー', 'yo', 'ホワイトデーのお返しに'), E(3, 20, '春のお彼岸', 'wa', 'おはぎ・お供えのお菓子'), E(4, 1, 'お花見', 'sakura', '桜のお菓子・お花見のおともに'),
    { date: nthWeekday(y, 4, 2, 0), t: '母の日', tpl: 'sakura', theme: '母の日の贈りもの' }, E(5, 5, 'こどもの日', 'shinryoku', '柏餅・ちまき'), E(5, 10, '新茶', 'shinryoku', '新茶に合うお菓子'),
    { date: nthWeekday(y, 5, 3, 0), t: '父の日', tpl: 'natsu', theme: '父の日の贈りもの' }, E(6, 16, '和菓子の日', 'wa', '和菓子の日のおすすめ'), E(7, 1, 'お中元', 'natsu', 'お中元・夏のご挨拶'), E(7, 7, '七夕', 'natsu', '七夕のお菓子'), E(7, 20, '夏休み', 'natsu', '冷たいお菓子'),
    E(8, 13, 'お盆', 'wa', 'お盆のお供え・帰省の手みやげ'), { date: nthWeekday(y, 8, 3, 1), t: '敬老の日', tpl: 'aki', theme: '敬老の日の贈りもの' }, E(9, 20, '秋のお彼岸', 'aki', 'おはぎ・お供えのお菓子'), E(9, 25, '十五夜', 'aki', 'お月見団子'),
    E(10, 1, '栗・お芋の季節', 'aki', '栗やお芋のお菓子'), E(10, 31, 'ハロウィン', 'pop', 'ハロウィンのお菓子'), E(11, 15, '七五三', 'wa', '七五三のお祝いに'), E(11, 20, 'お歳暮', 'oseibo', 'お歳暮・冬のご挨拶のご予約'),
    E(12, 1, 'クリスマス予約', 'xmas', 'クリスマスのご予約'), E(12, 25, '年末年始', 'newyear', '年末年始の営業日のお知らせ')];
}
function postPlan() {
  const now = new Date(), y = now.getFullYear(), lo = new Date(now.getFullYear(), now.getMonth(), now.getDate()), hi = new Date(lo.getTime() + 45 * 864e5);
  const ev = seasonEvents(y).concat(seasonEvents(y + 1)).filter(e => e.date >= new Date(lo.getTime() - 3 * 864e5) && e.date <= hi);
  (D.events || []).forEach(e => { const d = new Date(e.date); if (d >= lo && d <= hi && (e.kind === '休み' || e.kind === '催事')) ev.push({ date: d, t: e.kind === '休み' ? 'お休み: ' + e.text : '催事: ' + e.text, tpl: e.kind === '休み' ? 'white' : 'pop', theme: e.kind === '休み' ? 'お休みのお知らせ ' + e.date + ' ' + e.text : e.text + ' に出店のお知らせ(' + e.date + ')', own: true }); });
  // 行事の1週間前に出すのがよい
  return ev.map(e => Object.assign(e, { post: new Date(Math.max(lo.getTime(), e.date.getTime() - 7 * 864e5)) })).sort((a, b) => a.post - b.post).slice(0, 8);
}
function renderPost() {
  const goods = D.products.filter(p => p.kind !== 'part'), b = brand();
  // インスタの普段の投稿(画像・予定表)はしまって、値上げのお知らせ文とPOP・値札・貼り紙にしぼる(2026-10-23)
  if ($('post-plan')) $('post-plan').hidden = SH('insta'); if ($('post-sns')) $('post-sns').hidden = SH('insta');
  if (SH('insta')) { const ld = document.querySelector('#t-post .lead'); if (ld) ld.textContent = '値上げのお知らせ文と、店頭に置くPOP・値札・貼り紙を作成します。'; if ($('post-free')) $('post-free').placeholder = '例: 11月1日からの値上げのお知らせ'; }
  // お店の型
  const bb = $('post-brand');
  if (bb && !(D.me && D.me.owner)) bb.innerHTML = `<div class="row"><b>店舗のデザイン</b></div><p class="k" style="margin:4px 0 0">ロゴ・店舗の色・書体は、店主が設定します。${b.color || b.logo ? '登録済みのデザインが、画像と印刷物に反映されます。' : ''}</p>`;
  else if (bb) {
    bb.innerHTML = `<div class="row"><b>店舗のデザイン</b><span class="k">${b.color || b.font || b.logo ? '登録済み' : '未登録'}</span></div>
      <p class="k" style="margin:4px 0 12px">ロゴ・店舗の色・書体を一度設定すると、画像・POP・値札・貼り紙のすべてに反映されます。他店と同じデザインになることはありません。</p>
      <div class="brand-row"><div class="brand-logo">${b.logo ? `<img src="${b.logo}" alt="ロゴ">` : '<span class="k">ロゴなし</span>'}</div>
        <div class="ps-ctl"><label class="btn ghost ps-photo">ロゴを設定<input type="file" id="br-logo" accept="image/*" hidden></label>${b.logo ? '<button class="btn ghost" type="button" id="br-nologo">ロゴを削除</button>' : ''}
        <span class="k">店舗の色</span><div class="brand-colors">${['', '#a8322a', '#b5541c', '#8a4b1c', '#2f7d6d', '#1d7fb3', '#1f2a44', '#d6577a', '#5a4fcf'].map(c => `<button type="button" class="sw2" data-bc="${c}" aria-pressed="${(b.color || '') === c}" style="background:${c || 'conic-gradient(#a8322a,#2f7d6d,#1d7fb3,#d6577a,#a8322a)'}" title="${c ? c : '型の色のまま'}"></button>`).join('')}<input type="color" id="br-color" value="${b.color || '#a8322a'}" aria-label="ほかの色"></div>
        <span class="k">書体</span><div class="seg" id="br-font">${[['', '型のまま']].concat(Object.keys(FONTS).map(k => [k, FONTS[k].label])).map(([k, l]) => `<button type="button" data-v="${k}" aria-pressed="${(b.font || '') === k}">${l}</button>`).join('')}</div></div></div>`;
    const saveB = v => setValueX({ field: 'shop', value: v });
    bb.querySelectorAll('[data-bc]').forEach(x => x.onclick = () => saveB({ brandColor: x.dataset.bc }));
    $('br-color').onchange = e => saveB({ brandColor: e.target.value });
    $('br-font').querySelectorAll('button').forEach(x => x.onclick = () => saveB({ brandFont: x.dataset.v }));
    if ($('br-nologo')) $('br-nologo').onclick = () => saveB({ brandLogo: '' });
    $('br-logo').onchange = e => { const f = e.target.files[0]; if (!f) return; const im = new Image(); im.onload = () => {
      // 小さく縮めて保存(8KBくらいまで)
      for (const [s, q] of [[200, .85], [160, .75], [120, .7], [96, .6]]) { const r = Math.min(1, s / Math.max(im.width, im.height)), cv = document.createElement('canvas'); cv.width = Math.round(im.width * r); cv.height = Math.round(im.height * r); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); let u = cv.toDataURL('image/webp', q); if (!/^data:image\/webp/.test(u)) u = cv.toDataURL('image/png'); if (u.length < 8400) { saveB({ brandLogo: u }); return; } }
      toast('ロゴの画像サイズが大きすぎます。小さめの画像をお使いください', 'ng'); }; im.src = URL.createObjectURL(f); };
  }
  // 店頭掲示物
  const box = $('post-shop');
  if (box) {
    box.innerHTML = `<div class="row"><b>店頭掲示物</b></div>
      <p class="k" style="margin:4px 0 12px">印刷して店頭に掲示します。${SH('insta') ? '色と書体は、下の「店舗のデザイン」で設定したものが使われます。' : '色と模様は、下の「SNSに投稿する画像」で選んだテンプレートが使われます。'}</p>
      <div class="ps-acts"><button class="btn ghost" type="button" id="ps-cards">値札カード(全商品・A4に8枚)</button>${sellFace() ? '<button class="btn ghost" type="button" id="ps-al">アレルゲン表</button>' : ''}
      <button class="btn ghost" type="button" id="ps-pop">POP(A5)</button><button class="btn ghost" type="button" id="ps-notice">お知らせの貼り紙(A4)</button></div>`;
    $('ps-cards').onclick = () => { if (!goods.length) { chat('商品が登録されていません'); return; } priceCards(goods); };
    if ($('ps-al')) $('ps-al').onclick = () => show('label');
    $('ps-pop').onclick = async () => { await fontsReady(); const cv = document.createElement('canvas'); cv.width = 1748; cv.height = 2480; drawCard(cv, Object.assign(cardOpts('pop'), { photo: null })); printImage(cv, 'A5 portrait'); };
    $('ps-notice').onclick = async () => { await fontsReady(); const cv = document.createElement('canvas'); cv.width = 2480; cv.height = 3508; const o = cardOpts('notice'); drawCard(cv, Object.assign(o, { photo: null, sub: (PS.d && PS.d.notice) || o.sub, name: '' })); printImage(cv, 'A4 portrait'); };
  }
  // 投稿の予定表
  const pl = $('post-plan');
  if (pl) {
    const plan = postPlan(), md = d => `${d.getMonth() + 1}/${d.getDate()}`;
    pl.innerHTML = `<div class="row"><b>投稿の予定表</b><span class="k">これから45日</span></div><p class="k" style="margin:4px 0 8px">行事の1週間前に投稿すると、お客様が予定を立てやすくなります。店舗の予定(休業日・催事)も表示されます。</p>
      ${plan.length ? plan.map((e, i) => `<div class="plan-row"><span class="plan-d">${md(e.post)}<small>に出す</small></span><span><b>${esc(e.t)}</b>${e.own ? '' : `<span class="k">(${md(e.date)})</span>`}<br><span class="k">${esc(e.theme)}</span></span><button class="btn ghost sm" type="button" data-plan="${i}">この内容で作成</button></div>`).join('') : '<p class="k">近い行事はありません。</p>'}`;
    pl.querySelectorAll('[data-plan]').forEach(x => x.onclick = () => { const e = plan[x.dataset.plan]; PS.tpl = e.tpl; store.set('pTpl', PS.tpl); PS.c = null; PS.s = null; $('post-free').value = e.theme; renderPost(); $('post-free').scrollIntoView({ block: 'center', behavior: 'smooth' }); chat('テンプレートを選択しました。「案を作る」で文章を作成できます。テンプレートの文章のままでもご利用いただけます'); });
  }
  // SNSに投稿する画像(AIを使わなくても、型の一言で作れる)
  const sb = $('post-sns'), T = TPL[PS.tpl] || TPL.wa, d = PS.d || {};
  if (sb) {
    const segs = (id, list, v) => `<div class="seg segw" id="${id}">${list.map(([k, l]) => `<button type="button" data-v="${k}" aria-pressed="${k === v}">${l}</button>`).join('')}</div>`;
    sb.innerHTML = `<div class="row"><b>SNSに投稿する画像</b></div>
      <p class="k" style="margin:4px 0 12px">テンプレートを選ぶと、文章が自動で入力されます。商品の写真を追加すると、写真の上に文字が重なります。保存した画像は、そのままInstagramやLINEに投稿できます。</p>
      <div class="ps-grid"><div><canvas id="ps-cv" class="ps-cv" width="1080" height="1080" aria-label="SNS用の画像"></canvas>${PS.photo ? '<p class="k" style="margin:8px 0 0;text-align:center">写真は指で位置を調整できます</p>' : ''}</div>
      <div class="ps-ctl"><span class="k">型</span>${segs('ps-tpl', Object.keys(TPL).map(k => [k, TPL[k].label]), PS.tpl)}
        <span class="k">大きさ</span>${segs('ps-size', Object.keys(SIZES).map(k => [k, SIZES[k][2]]), PS.size)}
        <label class="btn ghost ps-photo">📷 写真を追加<input type="file" id="ps-file" accept="image/*" hidden></label>
        ${PS.photo ? `<div class="ps-adj"><label class="k"><input type="checkbox" id="ps-auto" ${PS.auto ? 'checked' : ''}> 明るさ・位置を自動で調整</label>
          <span class="k">明るさ</span><input type="range" id="ps-bright" min="-40" max="40" value="${PS.bright}"><span class="k">大きさ</span><input type="range" id="ps-zoom" min="100" max="250" value="${Math.round(PS.zoom * 100)}">
          <button class="btn ghost sm" type="button" id="ps-nophoto">写真を削除</button></div>` : ''}
        <span class="k">見出し</span><input id="ps-catch" value="${esc(PS.c != null ? PS.c : T.c)}"><span class="k">本文</span><input id="ps-sub" value="${esc(PS.s != null ? PS.s : T.s)}">
        <button class="btn ghost sm" type="button" id="ps-tplword" style="align-self:flex-start">テンプレートの文章に戻す</button>
        ${d.name ? `<label class="k" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="ps-name" ${PS.useName ? 'checked' : ''}> 商品名と価格を入れる</label>` : ''}
        <div class="ps-acts"><button class="btn" type="button" id="ps-save">画像を保存</button><button class="btn ghost" type="button" id="ps-all">4つのサイズをまとめて保存</button><button class="btn ghost" type="button" id="ps-share" hidden>共有(Instagram・LINEへ)</button></div></div></div>`;
    const redraw = () => snsDraw();
    $('ps-tpl').querySelectorAll('button').forEach(x => x.onclick = () => { const wasDefault = PS.c == null || PS.c === T.c; PS.tpl = x.dataset.v; store.set('pTpl', PS.tpl); if (wasDefault && !PS.d) { PS.c = null; PS.s = null; } renderPost(); });
    $('ps-size').querySelectorAll('button').forEach(x => x.onclick = () => { PS.size = x.dataset.v; $('ps-size').querySelectorAll('button').forEach(y => y.setAttribute('aria-pressed', y === x)); redraw(); });
    $('ps-catch').oninput = e => { PS.c = e.target.value; redraw(); }; $('ps-sub').oninput = e => { PS.s = e.target.value; redraw(); };
    $('ps-tplword').onclick = () => { PS.c = null; PS.s = null; renderPost(); };
    if ($('ps-name')) $('ps-name').onchange = e => { PS.useName = e.target.checked; redraw(); };
    $('ps-file').onchange = e => { const f = e.target.files[0]; if (!f) return; const im = new Image(); im.onload = () => { im.an = analyzePhoto(im); PS.photo = im; PS.zoom = 1; PS.ox = 0; PS.oy = 0; PS.bright = 0; renderPost(); }; im.src = URL.createObjectURL(f); };
    if (PS.photo) {
      $('ps-auto').onchange = e => { PS.auto = e.target.checked; redraw(); };
      $('ps-bright').oninput = e => { PS.bright = +e.target.value; redraw(); };
      $('ps-zoom').oninput = e => { PS.zoom = +e.target.value / 100; redraw(); };
      $('ps-nophoto').onclick = () => { PS.photo = null; renderPost(); };
      // 指(マウス)で写真をずらす
      const cv = $('ps-cv'); let drag = null;
      cv.onpointerdown = e => { drag = { x: e.clientX, y: e.clientY, ox: PS.ox, oy: PS.oy }; cv.setPointerCapture(e.pointerId); };
      cv.onpointermove = e => { if (!drag) return; const r = cv.getBoundingClientRect(); PS.ox = drag.ox + (e.clientX - drag.x) / r.width; PS.oy = drag.oy + (e.clientY - drag.y) / r.height; redraw(); };
      cv.onpointerup = cv.onpointercancel = () => { drag = null; }; cv.style.touchAction = 'none'; cv.style.cursor = 'grab';
    }
    const fname = k => `${(d.name || D.shop || 'post').replace(/[\\/:*?"<>|\s]/g, '')}_${SIZES[k || PS.size][2].replace(/\(.*\)/, '')}.png`;
    const dl = (bl, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(bl); a.download = name; document.body.appendChild(a); a.click(); a.remove(); };
    $('ps-save').onclick = async () => { dl(await canvasBlob($('ps-cv')), fname()); chat('画像を保存しました。投稿文は「コピー」で写せます', 'clap'); };
    const allBlobs = async () => { const out = []; for (const k of Object.keys(SIZES)) { const cv = document.createElement('canvas'); [cv.width, cv.height] = SIZES[k]; drawCard(cv, cardOpts('sns')); out.push([await canvasBlob(cv), fname(k)]); } return out; };
    $('ps-all').onclick = async () => { for (const [bl, n] of await allBlobs()) { dl(bl, n); await new Promise(r => setTimeout(r, 300)); } chat('4つのサイズで保存しました', 'clap'); };
    if (navigator.canShare && navigator.canShare({ files: [new File([''], 'a.png', { type: 'image/png' })] })) {
      $('ps-share').hidden = false;
      $('ps-share').onclick = async () => { try { try { await navigator.clipboard.writeText(d.insta || ''); } catch (e) {} const bl = await canvasBlob($('ps-cv')); await navigator.share({ files: [new File([bl], fname(), { type: 'image/png' })], text: d.insta || '' }); if (d.insta) chat('投稿文はコピー済みです。貼り付けてご利用ください', 'heart'); } catch (e) {} };
    }
    fontsReady().then(redraw); redraw();
  }
  // 文の案(AI)
  $('post-p').innerHTML = '<option value="">商品から選ぶ</option>' + goods.map(p => `<option${d.name === p.name ? ' selected' : ''}>${esc(p.name)}</option>`).join('');
  $('post-out').innerHTML = PS.d ? [['Instagramの投稿文', PS.d.insta, 'insta'], ['POPの文章', PS.d.pop, 'pop'], ['お知らせの文章(LINEなど)', PS.d.notice, 'notice']].map(([l, t, k]) => `<div class="card"><div class="row"><b>${l}</b><button class="btn ghost" type="button" data-cp="${k}">コピー</button></div><p class="draft" id="dr-${k}">${esc(t || '')}</p></div>`).join('') : '';
  $('post-out').querySelectorAll('[data-cp]').forEach(x => x.onclick = async () => { try { await navigator.clipboard.writeText($('dr-' + x.dataset.cp).textContent); chat('コピーしました', 'heart'); } catch (e) { chat('長押しで選択してコピーしてください'); } });
  $('post-go').onclick = async () => {
    const sub = $('post-free').value.trim() || $('post-p').value; if (!sub) { chat('商品を選択するか、テーマを入力してください'); return; }
    $('post-out').innerHTML = '<div class="card"><p class="k" style="margin:0">作成しています…(10秒ほど)</p></div>'; chat('考えています…', 'think');
    const out = await api({ kind: 'app_gen', subject: sub });
    if (!out.ok) { $('post-out').innerHTML = ''; chat(out.error || '作成できませんでした'); return; }
    const dd = out.drafts; dd.catch = dd.catch || String(dd.pop || '').split('\n')[0].slice(0, 14); dd.sub = dd.sub || '';
    PS.d = dd; PS.c = dd.catch; PS.s = dd.sub; PS.useName = true;
    await fontsReady(); renderPost(); $('post-sns').scrollIntoView({ block: 'start', behavior: 'smooth' });
    chat('案と画像を作成しました。入力された内容以外は記載していません。', 'clap');
  };
}

// ---------- 右下に座るキャラ:ふだんはお茶を持って座り、ときどきしぐさ。押すと会話が開く ----------
const PACK = 'robot';   // キャラはロボット1つ(2026-10-23。たぬき・オペレーターはしまった)
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
function toast(text, kind, act0) {
  let t = $('toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.className = kind || ''; t.innerHTML = `<span class="tk"></span>${esc(text)}${act0 ? `<button type="button" class="ta">${esc(act0[0])}</button>` : ''}`; t.hidden = false; requestAnimationFrame(() => t.classList.add('on'));
  if (act0) t.querySelector('.ta').onclick = () => { t.classList.remove('on'); t.hidden = true; act0[1](); };
  clearTimeout(toastT); toastT = setTimeout(() => { t.classList.remove('on'); setTimeout(() => t.hidden = true, 250); }, act0 ? 7000 : 2600);
}
function chat(text, role) {
  if (role) act(role, 1.3);
  if (!text) return;
  // 長さに合わせて出す時間を決める(短い言葉はすぐ消える)。押すか、画面を動かすと消える
  clearTimeout(talkT); say.textContent = text; say.hidden = false; say.classList.remove('off');
  talkT = setTimeout(sayOff, Math.min(5200, 2200 + String(text).length * 60));
}
function sayOff() { if (say.hidden) return; say.classList.add('off'); clearTimeout(talkT); talkT = setTimeout(() => { say.hidden = true; say.classList.remove('off'); }, 220); }
say.addEventListener('click', sayOff);
addEventListener('scroll', () => { if (!say.hidden && !say.classList.contains('off')) sayOff(); }, { passive: true });
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
function openAsk() { if (!D) return; sheet.hidden = false; if (!msgs.children.length) botSay('ご不明な点は何でもお尋ねください。操作方法から店舗のデータまでお答えします。'); renderChips(); setTimeout(() => qIn.focus(), 100); }
$('sclose').onclick = () => sheet.hidden = true; sheet.onclick = e => { if (e.target === sheet) sheet.hidden = true; };
ch.onclick = openAsk; ch.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAsk(); } };
$('cam').onclick = openCamera;
function renderChips(quick) {
  const p0 = D.products[0] ? D.products[0].name : '看板商品';
  const c = quick && quick.length ? quick : (noMoney() ? ['本日の衛生記録で未記録のものは?', 'ラベルの印刷位置がずれる', '仕入先の電話番号はどこ?', 'インスタの画像を作りたい', '賞味期限と消費期限の違いは?', `${p0}の栄養成分は?`] : ['今月の利益は?', `${p0}の原価は?`, '値上げを検討すべき商品は?', 'ラベルの印刷位置がずれる', '仕入先の電話番号はどこ?', 'インスタの画像を作りたい', '未払いの請求は?', '賞味期限と消費期限の違いは?']);
  const box = $('qchips'); box.innerHTML = c.map(s => `<button type="button">${esc(s)}</button>`).join('');
  box.querySelectorAll('button').forEach(b => b.onclick = () => ask(b.textContent));
}
const findProd = s => D.products.slice().sort((a, b) => b.name.length - a.name.length).find(p => s.includes(p.name));
const findMat = s => D.materials.slice().sort((a, b) => b.name.length - a.name.length).find(m => s.includes(m.name));
async function answer(s) {
  s = s.replace(/\s+/g, ' ').trim(); let m;
  const p = findProd(s);
  if (p && (m = s.match(/(\d+(?:\.\d+)?)\s*(g|ｇ|グラム)/))) { await setValue(p.name, 'pw', +m[1]); const q = D.products.find(x => x.name === p.name); return [`記録しました。${esc(p.name)}は1個${m[1]}g、約${q.pieces}個、1個 <b>${yen1(q.per_piece)}</b> です。`, 'heart']; }
  if (p && (m = s.match(/(\d+)\s*円/))) { await setValue(p.name, 'price', +m[1]); const q = D.products.find(x => x.name === p.name); return [`記録しました。${esc(p.name)}は${m[1]}円。` + (q.per_piece != null ? `原価率は <b>${Math.round(q.per_piece / q.price * 100)}%</b> です。` : '1個の重さを入力すると、原価率も算出します。'), 'heart']; }
  if (p && /裏表示|表示|ラベル|原材料/.test(s)) return [`${esc(p.name)}の原材料名の案です。\n<b>${esc(p.label.text)}${esc(p.label.contains)}</b>` + (p.label.check.length ? `\n要確認:${p.label.check.map(esc).join('、')}` : ''), 'point'];
  if (p && /アレルゲン|アレルギー/.test(s)) return [`${esc(p.name)}は ${p.label.allergens.length ? p.label.allergens.map(esc).join('・') : '該当なし'} です(案)。`, 'point'];
  if (p) { if (p.per_piece == null) return [`${esc(p.name)}は1仕込み ${yen(p.batch_cost)} です。「${esc(p.name)}は1個40g」のように重さを入力すると、1個あたりの原価を算出します。`, 'think'];
    return [`${esc(p.name)}は1個 <b>${yen1(p.per_piece)}</b> です。1仕込み ${yen(p.batch_cost)}、約${p.pieces}個。` + (p.price ? `原価率 ${Math.round(p.per_piece / p.price * 100)}%。` : ''), 'clap']; }
  if ((m = s.match(/^(.+?)\s*(に|へ|を|は)?\s*(払った|払いました|支払った|振り込んだ|振込んだ)/))) {
    const who = m[1].replace(/\s/g, ''), hit = unpaid().find(p => p.supplier.includes(who) || who.includes(p.supplier.slice(0, 4)));
    if (!hit) return [`「${esc(who)}」の未払いは見つかりませんでした。` + (unpaid().length ? `\n未払い:${unpaid().map(p => esc(p.supplier)).join('、')}` : ''), 'think'];
    await setValue('', 'paid', hit.row); return [`「${esc(hit.supplier)}」${esc(hit.month)}分 ${yen(hit.total)} を支払済にしました。`, 'heart'];
  }
  if (/在庫|残り|棚卸/.test(s)) { const it = ((D.stock || {}).items || []).filter(x => x.known && x.unit === 'g'); return [it.length ? '計算上の残りです。\n' + it.slice(0, 10).map(x => `${x.low ? '⚠' : '・'}${esc(x.key)} ${amt(x.left, x.unit)}${x.days != null ? `(あと約${x.days}日)` : ''}`).join('\n') : '在庫を計算できる材料がまだありません。請求書を撮影するか、「材料」の画面で数えた量を入力してください。', 'think']; }
  if (/買い物|買い出し|買うもの/.test(s)) { const low = ((D.stock || {}).items || []).filter(x => x.low); return [low.length ? '在庫が少ない材料です。\n' + low.map(x => `・${esc(x.key)}(残り${amt(x.left, x.unit)})`).join('\n') : '現在、不足しそうな材料はありません。', 'point']; }
  if (/支払|払うもの|振込|振り込み/.test(s)) { const up = unpaid(); return [up.length ? `未払いの請求は${up.length}件、合計 <b>${yen(up.reduce((a, p) => a + p.total, 0))}</b>。\n` + up.map(p => `・${esc(p.supplier)}(${esc(p.month)}分)${yen(p.total)}${p.due ? ' 期限' + esc(p.due) : ''}`).join('\n') : '未払いの請求書はありません。', 'point']; }
  if (/仕訳|科目/.test(s)) { const ms = Object.keys(D.journal || {}).sort(); if (!ms.length) return ['請求書が登録されていません。', 'think']; const k = ms[ms.length - 1], sm = D.journal[k];
    return [`${esc(k)}分の科目ごとの合計(案):\n` + Object.keys(sm).map(a => `・${esc(a)} ${yen(sm[a])}`).join('\n'), 'point']; }
  if (/値上が|上がっ|高くな/.test(s)) return [D.ups.length ? D.ups.map(u => `・${esc(u.item)}(${esc(u.spec)}) ${u.old.toLocaleString()}円→${u.now.toLocaleString()}円(+${u.pct}%)`).join('\n') : '現在、値上がりした材料はありません。', 'surprise'];
  if (/仕入|先月|合計|まとめ/.test(s)) { const ms = Object.keys(D.months).sort(); if (!ms.length) return ['請求書が登録されていません。請求書を撮影して送信してください。', 'think']; const k = ms[ms.length - 1], mm = D.months[k];
    return [`${esc(k)}の仕入れは <b>${yen(mm.total)}</b>。\n` + Object.entries(mm.by).map(([a, v]) => `・${esc(a)} ${yen(v)}`).join('\n'), 'point']; }
  const mt = findMat(s);
  if (mt) return [`「${esc(mt.name)}」は <b>${esc(mt.display)}</b> として扱っています。` + (mt.ppg ? ` ${Math.round(mt.ppg * 1000).toLocaleString()}円/kg(${mt.ok ? '請求書' : '仮'})。` : '') + (mt.allergens.length ? ` アレルゲン:${mt.allergens.map(esc).join('・')}。` : '') + (mt.note ? `\n${esc(mt.note)}` : ''), 'think'];
  if (/確認|待ち|やること/.test(s)) { const n = notices().length; return [n ? `確認待ちは${n}件です。ホームの画面にまとめています。` : '確認待ちはありません。', 'greet']; }
  if (/ありがと|助か/.test(s)) return ['どういたしまして。', 'heart'];
  return ['申し訳ありません。この内容にはまだお答えできません。\nお答えできるのは、原価・食品表示・アレルゲン・値上がり・先月の仕入れ・材料名です。\n「〇〇は1個40g」「〇〇は250円」と入力していただくと記録します。', 'think'];
}
// キャラとの会話は表の側(AI)で。つながらないときだけ、この画面の中の簡単な答えに切り替える
let asking = false;
async function ask(s) {
  store.set('chatTried', 1);
  if (!s.trim() || asking) return; asking = true;
  addMsg(esc(s), true); qIn.value = '';
  const pc = D && D.plan && D.plan.chat, slow = pc && pc.normal && pc.n >= pc.normal && pc.n < pc.max;
  const wait = addMsg(slow ? '<span class="k">本日は応答速度を抑えています(明朝4時に通常に戻ります)。回答まで30秒〜1分ほどお待ちください…</span>' : '<span class="k">考えています…</span>'); chat(null, 'think');
  try {
    const out = await api({ kind: 'app_chat', text: s, pack: PACK, lockMoney: mLocked || undefined });
    if (pc) pc.n++;
    if (!out.ok) throw new Error(out.error || 'ng');
    wait.remove();
    (out.texts || []).forEach((t, i) => setTimeout(() => botSay(openBtns(esc(t)).replace(/\n/g, '<br>')), i * 200));
    if (out.data) { D = out.data; renderAll(); }
    renderChips(out.quick);
  } catch (e) {
    wait.remove(); const [a, role] = await answer(s); botSay(a, role);
  } finally { asking = false; }
}
// 返事の [[open:〜]] を「〇〇を開く」ボタンにする
const OPEN_TO = { today: ['ホーム'], cost: ['原価'], howto: ['作り方', '手順'], label: ['食品表示'], labelprint: ['ラベルを印刷', 'label', '.lpc'], mat: ['材料'], hyg: ['衛生'], book: ['帳簿'], ws: ['卸'], ct: ['仕入先・卸先'], post: ['発信'], brand: ['店舗のデザイン', 'post', '#post-brand'], cal: ['予定'], sales: ['売上'], set: ['設定'], members: ['メンバー', 'set', '#members-box'], a2hs: ['ホーム画面への追加方法'], guide: ['使い方ガイド'] };
function openBtns(h) { return h.replace(/\n?\[\[open:([a-z0-9]+)\]\]/g, (m, k) => OPEN_TO[k] ? `<br><button class="btn ghost sm" type="button" data-open="${k}">「${OPEN_TO[k][0]}」を開く</button>` : ''); }
function openTo(k) {
  const o = OPEN_TO[k]; if (!o) return; sheet.hidden = true;
  if (k === 'a2hs') { a2hsHelp(); return; }
  if (k === 'guide') { location.href = CF ? '/guide/' : 'https://shikomicho.masagolf9.workers.dev/guide/'; return; }
  show(o[1] || k);
  if (o[2]) setTimeout(() => { const el = document.querySelector(o[2]); if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 250);
}
msgs.addEventListener('click', e => { const b = e.target.closest('[data-open]'); if (b) openTo(b.dataset.open); });
$('composer').onsubmit = e => { e.preventDefault(); ask(qIn.value); };

// 作り方の手順の写真: 置き場に収まる大きさに縮める(長い辺1000px→収まらなければ800px)
const IMG_CACHE = {};
async function shrinkStep(file) {
  if (!/^image\//.test(file.type)) throw new Error('写真を選択してください');
  const img = await createImageBitmap(file);
  for (const [px, q] of [[1000, 0.8], [800, 0.7], [640, 0.6]]) {
    const k = Math.min(1, px / Math.max(img.width, img.height));
    const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const b64 = c.toDataURL('image/jpeg', q).split(',')[1];
    if (b64.length <= 650000) return b64;
  }
  throw new Error('写真のサイズが大きすぎます。撮り直してください');
}
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
  openAsk(); addMsg('<span class="k">📷 写真を送信しました</span>', true);
  const wait = addMsg('<span class="k">読み取っています…(10〜30秒かかります)</span>'); chat(null, 'think');
  try {
    const out = await api({ kind: 'liff_upload', web: true, sort: true, image: await shrink(file), type: 'image/jpeg' });
    wait.remove(); sortLoad();
    if (!out.ok) throw new Error(out.error || '読み取れませんでした');
    sayShot(out); load();
  } catch (e) { wait.remove(); botSay(esc(e.message || '送信できませんでした')); }
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
// ---------- 取り込み一覧: 撮った写真の行き先。回答が必要なもの・確認待ち・登録済み(7日間) ----------
let SORT = null, SORTW = null; const sortImgs = {};
// 確認にかかった秒数: 箱を開いて見ていた時間だけを数える(ほかのアプリに行った間は数えない)。押したものに、前に押してからの時間をつける
const BOXT = { acc: 0, since: 0 };
function boxTimeStart() { BOXT.acc = 0; BOXT.since = document.hidden ? 0 : Date.now(); }
function boxTimeTake() { const now = Date.now(), sec = (BOXT.acc + (BOXT.since ? now - BOXT.since : 0)) / 1000; BOXT.acc = 0; BOXT.since = document.hidden ? 0 : now; return Math.min(600, Math.round(sec)); }
document.addEventListener('visibilitychange', () => { if (!$('sort-ov')) return; if (document.hidden) { if (BOXT.since) BOXT.acc += Date.now() - BOXT.since; BOXT.since = 0; } else BOXT.since = Date.now(); });
const SORT_CH = [['label', '食品表示・ラベル'], ['mat', '材料(裏面表示・単価)'], ['recipe', 'レシピ'], ['money', '金額(納品書・売上)'], ['device', '機器の設定'], ['mistake', '誤って撮影した']];
async function sortLoad() {
  if (!CF) return;
  const r = await api({ kind: 'app_sort' }).catch(() => null);
  if (r && r.ok) { SORT = r.items || []; SORTW = r.weeks || null; sortCard(); if ($('sort-ov')) sortDraw(); try { renderMenu(); } catch (e) {} }
}
function sortCard() {
  let c = $('sort-card'); const L = SORT || [], ask = L.filter(x => x.state === '聞く').length, hold = L.filter(x => x.state === '確かめ').length;
  const today = new Date().toDateString(), done = L.filter(x => x.state === '済' && new Date(x.at).toDateString() === today).length, gap = costGaps().length;
  if (!L.length && !gap) { if (c) c.remove(); return; }
  if (!c) { c = document.createElement('div'); c.id = 'sort-card'; c.className = 'card'; c.style.cssText = 'display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-bottom:12px'; }
  const t = $('t-today'), anchor = $('pk-ban') || $('mlock-bar'); if (c.parentNode !== t) t.insertBefore(c, anchor ? anchor.nextSibling : t.firstChild);
  c.style.borderColor = ask ? 'var(--warn)' : '';
  c.innerHTML = `<span><b>取り込み一覧</b><br><span class="k">${ask ? `<b style="color:var(--warn)">回答が必要なもの ${ask}</b>・` : ''}${hold ? `確認待ち ${hold}・` : ''}${gap ? `未入力項目 ${gap}・` : ''}本日の取り込み ${done}</span></span><button class="btn sm${ask || hold || gap ? '' : ' ghost'}" type="button" id="sort-open">開く</button>`;
  $('sort-open').onclick = sortOpen;
}
function sortOpen() {
  if ($('sort-ov')) return;
  const ov = document.createElement('div'); ov.id = 'sort-ov'; ov.className = 'a2ov'; ov.style.alignItems = 'stretch';
  ov.innerHTML = `<div class="card" role="dialog" aria-modal="true" aria-labelledby="sort-h" style="max-width:720px;width:100%;margin:auto;max-height:92vh;overflow:auto"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h2 id="sort-h" style="font-family:var(--round);margin:0">取り込み一覧</h2><button class="btn ghost sm" type="button" id="sort-x">閉じる</button></div><p class="k" style="margin:6px 0 10px">撮影した写真の取り込み状況です。仕入・売上・新しいレシピなどの追加はすぐに反映し、材料の表示・既存レシピ・機器の設定など既存のデータを変更するものは、確認後に反映します。写真は確認後60日で削除されます。紙の原本は保管してください。</p><div id="sort-num"></div><div id="sort-list"></div></div>`;
  document.body.appendChild(ov);
  $('sort-x').onclick = () => ov.remove(); ov.onclick = e => { if (e.target === ov) ov.remove(); };
  sortDraw(); sortLoad(); boxTimeStart();
}
// 確認の数(使うほど減るか): この7日と、はじめの週。数だけ
function sortNumHtml() {
  const W = SORTW; if (!W || !W.week) return '';
  const tot = o => Object.values(o || {}).reduce((a, x) => ({ n: a.n + x.n, c: a.c + x.checks, s: a.s + x.sec }), { n: 0, c: 0, s: 0 });
  const w = tot(W.week), f = tot(W.first); if (!w.n) return '';
  const per = x => (Math.round(x.c / x.n * 10) / 10).toLocaleString('ja-JP'), mins = s => s < 60 ? `${s}秒` : `約${Math.round(s / 60)}分`;
  const old = Date.now() - W.since >= 14 * 864e5 && f.n;
  return `<div class="card" style="background:var(--bg);margin:0 0 6px;padding:12px 14px"><b>直近7日間</b> <span class="k">写真 ${w.n}枚・確認 ${w.c}件(1枚あたり ${per(w)}か所)・確認にかかった時間 ${mins(w.s)}</span>${costGaps().length ? `<div class="k" style="margin-top:4px">このほか、原価計算に必要な未入力項目が ${costGaps().length}件あります(下記)</div>` : ''}${old ? `<div class="k" style="margin-top:4px">開始1週目は1枚あたり ${per(f)}件でした${f.c / f.n > w.c / w.n ? '。使うほど確認が減っています' : ''}</div>` : '<div class="k" style="margin-top:4px">一度確認した内容(材料名・1袋の重量など)は記憶し、次回からは確認しません</div>'}</div>`;
}
function sortDraw() {
  const box = $('sort-list'); if (!box) return;
  if ($('sort-num')) $('sort-num').innerHTML = sortNumHtml();
  const L = SORT || [], when = t => new Date(t).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  const row = x => `<div class="sort-row" data-id="${esc(x.id)}" style="display:flex;gap:12px;padding:12px 0;border-top:1px solid var(--line);align-items:flex-start">
      <button type="button" data-img="${esc(x.photo)}" aria-label="元の写真を表示" style="flex:none;width:72px;height:72px;border-radius:10px;border:1px solid var(--line);background:var(--bg);padding:0;overflow:hidden;cursor:${x.photo ? 'zoom-in' : 'default'}">${x.photo ? (sortImgs[x.photo] ? `<img src="${sortImgs[x.photo]}" alt="" style="width:100%;height:100%;object-fit:cover">` : '<span class="k">写真</span>') : '<span class="k">なし</span>'}</button>
      <div style="flex:1;min-width:0"><b>${esc(x.kind || '')}</b> ${esc(x.title || '')}<div class="k">${when(x.at)}${x.who ? '・' + esc(x.who) : ''}</div>
      <div class="k" style="white-space:pre-wrap;margin-top:4px;max-height:7.5em;overflow:auto">${esc(x.result || '')}</div>
      ${x.state === '聞く' && x.ask === 'mat' ? `${matCands(x.title).length ? `<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:8px"><span class="k">候補</span>${matCands(x.title).map(c => `<button class="btn sm" type="button" data-matc="${esc(x.id)}" data-v="${esc(c)}">${esc(c)}</button>`).join('')}</div>` : ''}<div style="display:flex;gap:8px;margin-top:8px"><input data-matin="${esc(x.id)}" placeholder="異なる場合は材料名を入力(例: 生クリーム)" style="flex:1"><button class="btn ghost sm" type="button" data-mat="${esc(x.id)}">決定</button></div>` : ''}
      ${x.state === '聞く' && x.ask !== 'mat' ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">${SORT_CH.map(c => `<button class="btn ghost sm" type="button" data-ans="${esc(x.id)}" data-c="${c[0]}">${c[1]}</button>`).join('')}</div>` : ''}
      ${x.state === '確かめ' ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn sm" type="button" data-ok="${esc(x.id)}">確認して登録</button><button class="btn ghost sm" type="button" data-drop="${esc(x.id)}">登録せずに削除</button></div>` : ''}
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">${x.undo ? `<button class="btn ghost sm" type="button" data-undo="${esc(x.id)}">取り消す(登録前の状態に戻す)</button>` : ''}${x.photo ? `<button class="btn ghost sm" type="button" data-share="${esc(x.id)}">サポートに確認を依頼</button>` : ''}</div>
      <div data-sharebox="${esc(x.id)}" hidden style="margin-top:8px"><textarea rows="3" placeholder="問題の内容(例: 材料が別の欄に登録された)" style="width:100%"></textarea><p class="k" style="margin:4px 0">この写真1枚のみ、ピタット原価のサポート担当が閲覧できるようになります。他の写真や帳簿は閲覧できません。</p><button class="btn sm" type="button" data-sharego="${esc(x.id)}">送る</button></div>
      </div></div>`;
  const grp = (t, xs, note) => xs.length ? `<h3 style="margin:14px 0 4px;font-size:16px">${t} <span class="k">${xs.length}</span></h3>${note ? `<p class="k" style="margin:0 0 4px">${note}</p>` : ''}${xs.map(row).join('')}` : '';
  box.innerHTML = (L.length || costGaps().length ? '' : '<p class="k">取り込みはまだありません。「撮影」から、納品書・レシピ・裏面表示・売上の伝票・ラベル・機器の画面などを撮影してください。</p>') +
    grp('回答が必要なもの', L.filter(x => x.state === '聞く'), '回答すると、その内容で再度読み取ります。次回からは同じ確認をしません') +
    gapHtml() +
    grp('確認待ち', L.filter(x => x.state === '確かめ'), '店主、またはレシピの編集権限がある方が確認します') +
    grp('登録済み(7日間)', L.filter(x => x.state === '済')) + grp('削除済み(7日間)', L.filter(x => x.state === '消した'));
  box.querySelectorAll('[data-img]').forEach(b => { const id = b.dataset.img; if (!id) return; if (!sortImgs[id]) api({ kind: 'app_img_get', id }).then(r => { if (r.ok) { sortImgs[id] = 'data:' + r.type + ';base64,' + r.data; const im = b.querySelector('img') || document.createElement('img'); im.src = sortImgs[id]; im.alt = ''; im.style.cssText = 'width:100%;height:100%;object-fit:cover'; b.innerHTML = ''; b.appendChild(im); } }); b.onclick = () => { if (sortImgs[id]) openPrint(`<img src="${sortImgs[id]}" style="max-width:100%">`, { bare: true }); }; });
  box.querySelectorAll('[data-ans]').forEach(b => b.onclick = () => sortDo(b.dataset.ans, { act: 'answer', choice: b.dataset.c }, b));
  gapBind(box);
  box.querySelectorAll('[data-matc]').forEach(b => b.onclick = () => sortDo(b.dataset.matc, { act: 'mat', value: b.dataset.v }, b));
  box.querySelectorAll('[data-mat]').forEach(b => b.onclick = () => { const v = box.querySelector(`[data-matin="${CSS.escape(b.dataset.mat)}"]`).value.trim(); if (!v) return; sortDo(b.dataset.mat, { act: 'mat', value: v }, b); });
  box.querySelectorAll('[data-ok]').forEach(b => b.onclick = () => { const x = (SORT || []).find(y => y.id === b.dataset.ok); if (x && x.dev) sortApplyDev(x.dev); sortDo(b.dataset.ok, { act: 'ok' }, b); });
  box.querySelectorAll('[data-drop]').forEach(b => twice(b, 'もう一度押すと削除します', () => sortDo(b.dataset.drop, { act: 'drop' }, b)));
  box.querySelectorAll('[data-undo]').forEach(b => twice(b, 'もう一度押すと取り消します', () => sortDo(b.dataset.undo, { act: 'undo' }, b)));
  box.querySelectorAll('[data-share]').forEach(b => b.onclick = () => { const sb = box.querySelector(`[data-sharebox="${CSS.escape(b.dataset.share)}"]`); sb.hidden = !sb.hidden; if (!sb.hidden) sb.querySelector('textarea').focus(); });
  box.querySelectorAll('[data-sharego]').forEach(b => b.onclick = async () => { const sb = box.querySelector(`[data-sharebox="${CSS.escape(b.dataset.sharego)}"]`); b.disabled = true; const r = await api({ kind: 'app_sort_share', id: b.dataset.sharego, text: sb.querySelector('textarea').value }).catch(() => ({ ok: false, error: '通信できませんでした' })); b.disabled = false; if (!r.ok) { toast(r.error || '送信できませんでした'); return; } sb.hidden = true; toast('サポートに送信しました。回答は「設定」の問い合わせとLINEでお知らせします', 'ok'); });
}
// 書き方のちがう材料の候補(手書きの読みちがい・かっこ書き・ひらがなとカタカナ)。打ち込まずに押すだけで済ませるため
const looseG = x => String(x || '').normalize('NFD').replace(/[゙゚]/g, '').normalize('NFC').replace(/[（(【\[][^）)】\]]*[）)】\]]/g, '').replace(/[\s・①-⑳0-9０-９]/g, '').replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60)).toLowerCase();
function matCands(n, max) {
  const k = looseG(n); if (!k || !D) return [];
  const bg = x => { const o = new Set(); for (let i = 0; i < x.length - 1; i++) o.add(x.slice(i, i + 2)); return o; }, A = bg(k), out = [];
  (D.materials || []).filter(m => !m.packaging && m.name !== n).forEach(m => {
    let best = 0;
    [m.name].concat(m.aliases || []).forEach(a => { const b = looseG(a); if (!b) return; let sc = 0; if (b === k) sc = 100; else if (b.length >= 2 && k.length >= 2 && (b.includes(k) || k.includes(b))) sc = 60 + Math.min(b.length, k.length); else { const [sh, lg] = k.length <= b.length ? [k, b] : [b, k]; let j = 0; for (const ch of lg) if (ch === sh[j]) j++; if (sh.length >= 2 && j === sh.length && sh.length / lg.length >= 0.6) sc = 50; else { const B = bg(b); let c = 0; A.forEach(x => B.has(x) && c++); sc = c >= 2 && A.size && B.size ? Math.round(c * 2 / (A.size + B.size) * 50) : 0; } } best = Math.max(best, sc); });
    if (best >= 35) out.push([best, m.name]);
  });
  return out.sort((a, b) => b[0] - a[0]).slice(0, max || 3).map(x => x[1]);
}
// 原価計算に必要な未入力項目: 撮った写真だけでは埋まらない所(1個の重さ・値段のない材料・数で書いた材料の重さ)を、箱でたずねる
// 金額の閲覧権限がある人にだけ出す。答えると、その場で原価が出なおす
function costGaps() {
  if (!D || noMoney()) return [];
  const has = n => (D.materials || []).find(m => m.name === n || (m.aliases || []).includes(n)), out = [], mats = {};
  (D.products || []).filter(p => p.kind !== 'part' && (p.rows || []).length).forEach(p => {
    if (p.per_piece == null && !p.pw && !p.piecesN) out.push({ t: 'pieces', n: p.name, ps: [p.name] });
    (p.unknown || []).forEach(n => (mats['p:' + n] = mats['p:' + n] || { t: 'price', n, ps: [], m: has(n) }).ps.push(p.name));
    (p.noWeight || []).forEach(n => (mats['w:' + n] = mats['w:' + n] || { t: 'weight', n, ps: [], m: has(n) }).ps.push(p.name));
  });
  return out.concat(Object.values(mats).sort((a, b) => b.ps.length - a.ps.length));
}
let GAP_ALL = false;
function gapHtml() {
  const G = costGaps(); if (!G.length) return '';
  const id = (g, i) => `data-gap="${i}"`, inp = (k, ph, w) => `<input data-gk="${k}" inputmode="decimal" placeholder="${ph}" style="width:${w || 6}em">`;
  const used = g => `<div class="k">${g.ps.length > 1 ? esc(g.ps.slice(0, 3).join('・')) + (g.ps.length > 3 ? ` ほか${g.ps.length - 3}品` : '') + 'で使用しています' : esc(g.ps[0]) + 'で使用しています'}</div>`;
  const row = (g, i) => `<div class="sort-row" ${id(g, i)} style="padding:12px 0;border-top:1px solid var(--line)">` + (
    g.t === 'pieces' ? `<b>${esc(g.n)}</b> <span class="k">1個あたりの原価が未算出です</span><div class="k">どちらかを入力すると算出できます</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px">1${U}の重さ ${inp('pw', '例 45')} g <button class="btn sm" type="button" data-gs="pw">決定</button></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:6px">1回の仕込みで ${inp('pieces', '例 24')} ${U}できる <button class="btn ghost sm" type="button" data-gs="pieces">決定</button></div>`
    : g.t === 'price' ? `<b>${esc(g.n)}</b> <span class="k">単価が未登録のため、原価に含まれていません</span>${used(g)}${!g.m && matCands(g.n).length ? `<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:8px"><span class="k">候補</span>${matCands(g.n).map(c => `<button class="btn sm" type="button" data-gs="same" data-to="${esc(c)}">「${esc(c)}」と同じ</button>`).join('')}</div>` : ''}${!g.m ? `<div style="margin-top:6px"><button class="btn ghost sm" type="button" data-gs="cam">自店で製造するもの(レシピを撮影)</button></div>` : ''}
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px">${inp('yen', '例 1980')} 円で ${inp('qty', '例 1')} <select data-gk="unit"><option value="kg">kg</option><option value="g">g</option></select> <button class="btn sm" type="button" data-gs="price">決定</button></div>
`
    : `<b>${esc(g.n)}</b> <span class="k">個数で記載されており、重量が不明です</span>${used(g)}
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px">1つ ${inp('g', '例 60')} g${g.m ? '' : ` ・1つ ${inp('yen', '例 30')} 円`} <button class="btn sm" type="button" data-gs="weight">決定</button></div>`) + '</div>';
  const N0 = 6, more = G.length > N0 && !GAP_ALL;
  return `<h3 style="margin:14px 0 4px;font-size:16px">原価計算に必要な未入力項目 <span class="k">${G.length}</span></h3><p class="k" style="margin:0 0 4px">写真からは読み取れなかった項目です。使用する商品の多いものから表示しています。分かる項目だけご回答ください。単価は、請求書や納品書を撮影しても登録されます</p>` + (more ? G.slice(0, N0) : G).map(row).join('') + (more ? `<button class="btn ghost sm" type="button" id="gap-all" style="margin-top:8px">残り${G.length - N0}件も見る</button>` : '');
}
function gapBind(box) {
  const G = costGaps();
  if ($('gap-all')) $('gap-all').onclick = () => { GAP_ALL = true; sortDraw(); };
  box.querySelectorAll('[data-gap] [data-gs]').forEach(b => b.onclick = async () => {
    const el = b.closest('[data-gap]'), g = G[+el.dataset.gap], v = k => { const x = el.querySelector(`[data-gk="${k}"]`); return x ? x.value.trim() : ''; }, num = k => Number(v(k).replace(/[,，円gｇ]/g, ''));
    let body = null, bad = '';
    if (b.dataset.gs === 'cam') { boxTimeTake(); $('sort-ov') && $('sort-ov').remove(); openCamera(); return; }
    if (b.dataset.gs === 'same') body = { kind: 'app_set', field: 'mat', name: b.dataset.to, value: { alias: g.n } };
    else if (b.dataset.gs === 'pw' || b.dataset.gs === 'pieces') { const n = num(b.dataset.gs); if (!(n > 0)) bad = '数値を入力してください'; else body = { kind: 'app_set', field: b.dataset.gs, product: g.n, value: n }; }
    else if (b.dataset.gs === 'price') { const y = num('yen'), q = num('qty'), kg = v('unit') === 'g' ? q / 1000 : q; if (!(y > 0) || !(q > 0)) bad = '金額と量を入力してください'; else body = { kind: 'app_set', field: 'mat', name: g.m ? g.m.name : g.n, create: !g.m, value: { ppkg: Math.round(y / kg) } }; }
    else { const w = num('g'), y = num('yen'); if (!(w > 0)) bad = '1個の重さ(g)を入力してください'; else if (!g.m && !(y > 0)) bad = '未登録の材料のため、1個あたりの金額も入力してください'; else body = { kind: 'app_set', field: 'mat', name: g.m ? g.m.name : g.n, create: !g.m, value: g.m ? { pieceG: w } : { pieceG: w, ppkg: Math.round(y / w * 1000) } }; }
    if (bad) { toast(bad); return; }
    b.disabled = true; body.sortSec = boxTimeTake(); body.sortFor = g.ps[0];
    const r = await api(body).catch(() => ({ ok: false, error: '通信できませんでした' }));
    b.disabled = false;
    if (!r.ok) { toast(r.error || 'できませんでした'); return; }
    if (r.data) { D = r.data; renderAll(); }
    const p = g.t === 'pieces' ? (D.products || []).find(x => x.name === g.n) : null;
    if (b.dataset.gs === 'same') { toast(`「${g.n}」を「${b.dataset.to}」として登録しました。次回からは確認しません`, 'ok'); sortDraw(); sortCard(); return; }
    toast(p && p.per_piece != null ? `${g.n}: 1${U} ${yen1(p.per_piece)}になりました` + ((p.unknown || []).length ? `(単価が未登録の材料${p.unknown.length}件は、原価に含まれていません)` : '') : `「${g.n}」を登録しました。原価を再計算しました`, 'ok');
    sortDraw(); sortCard();
  });
}
// 機械・ラベルの用紙を確かめたら、この端末のラベル印刷の設定にする
function sortApplyDev(dv) {
  const S = lsGet();
  if (dv.kind === 'device') S.mode = 'roll';
  if (dv.kind === 'labelpaper' && dv.w && dv.h) {
    if (dv.roll) { const k = Object.keys(ROLLS).find(k => ROLLS[k][0] === dv.w && ROLLS[k][1] === dv.h); S.mode = 'roll'; if (k) S.roll = k; else { S.roll = 'custom'; S.rw = dv.w; S.rh = dv.h; } }
    else { S.mode = 'sheet'; S.sheet = 'custom'; S.custom = Object.assign({}, S.custom, { w: dv.w, h: dv.h }); }
  }
  lsSet(S); toast('この端末のラベル印刷の設定を変更しました(食品表示の印刷画面で確認できます)', 'ok');
}
async function sortDo(id, o, btn) {
  if (btn) btn.disabled = true;
  const r = await api(Object.assign({ kind: 'app_sort_act', id, sec: boxTimeTake() }, o)).catch(() => ({ ok: false, error: '通信できませんでした' }));
  if (btn) btn.disabled = false;
  if (!r.ok) { toast(r.error || 'できませんでした'); return; }
  if (r.data) { D = r.data; renderAll(); }
  toast((r.msgs && r.msgs[0]) ? String(r.msgs[0]).slice(0, 80) : '完了しました', 'ok');
  await sortLoad(); if (!r.data) load();
}
// 青い枠のカメラで撮って戻ってきたとき、キャラの答えを出す
function showShot() {
  let n = null; try { n = sessionStorage.getItem('shikomi:sorted'); sessionStorage.removeItem('shikomi:sorted'); } catch (e) {}
  if (n != null && D) { sortLoad().then(() => { if ((SORT || []).some(x => x.state === '聞く' || x.state === '確かめ')) sortOpen(); }); return; }
  let out = null; try { out = JSON.parse(sessionStorage.getItem('shikomi:shot') || 'null'); sessionStorage.removeItem('shikomi:shot'); } catch (e) {}
  if (!out || !D) return;
  openAsk(); addMsg('<span class="k">📷 撮影した写真を送信しました</span>', true); sayShot(out);
}
// ---------- 運営の人には、運営の画面への入り口をいつも見える所に出す ----------
// パソコン: 左のメニューのいちばん下。スマホ: 上の帯の右。運営の人(店主・サポート役)にだけ出す
const OPS_IC = '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>';
async function opsMark() {
  if (!CF || IN_LINE) return;
  if (window.__ops === undefined) {
    window.__ops = null;
    const a = await api({ kind: 'app_account' }).catch(() => null);
    window.__ops = a && a.ok && a.ops ? a.ops : '';
  }
  if (!window.__ops) return;
  const side = $('side');
  if (side && !side.querySelector('.opsgo')) {
    const who = side.querySelector('.who');
    const html = `<a class="opsgo" href="/ops"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${OPS_IC}</svg>運営管理</a>`;
    if (who) who.insertAdjacentHTML('beforebegin', html); else side.insertAdjacentHTML('beforeend', html);
  }
  const top = document.querySelector('.top');
  if (top && !top.querySelector('.opsgo')) top.insertAdjacentHTML('beforeend', `<a class="opsgo" href="/ops" aria-label="運営管理"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${OPS_IC}</svg>運営</a>`);
}
// ---------- ログインの設定(ホームページのときだけ) ----------
async function renderAccount() {
  const box = $('acct-box'); if (!CF || !box) return;
  box.parentNode.hidden = false; $('acct-h').hidden = false;
  const a = await api({ kind: 'app_account' }).catch(() => null); if (!a || !a.ok) return;
  box.innerHTML = `<p style="margin:0 0 8px"><b>${esc(a.shop ? a.shop.name || D.shop : '')}</b></p>
    <p class="k" style="margin:0 0 12px">メール: ${a.email ? esc(a.email) : '未設定'} ・ LINE: ${a.line ? '連携済み' : '未連携'}</p>
    ${a.email ? '' : '<div class="ask" style="margin-top:0"><input id="ac-mail" type="email" placeholder="メールアドレス" style="flex:1" aria-label="メールアドレス"><button class="btn ghost" type="button" id="ac-mail-go">メールアドレスでもログインできるようにする</button></div><p class="k" id="ac-mail-msg" style="margin:4px 0 0"></p>'}
    ${a.line || IN_LINE || !a.lineLogin ? '' : '<div class="ask"><a class="btn ghost" href="/auth/line?link=1&next=/app/">LINEと連携</a></div>'}
    ${(a.shops || []).length > 1 ? `<div class="ask"><select id="ac-shop" aria-label="店舗を切り替える" style="flex:1">${a.shops.map(x => `<option value="${esc(x.id)}"${a.shop && a.shop.id === x.id ? ' selected' : ''}>${esc(x.name || x.id)}</option>`).join('')}</select><button class="btn ghost" type="button" id="ac-shop-go">切り替える</button></div>` : ''}
    <div class="ask"><button class="btn ghost" type="button" id="ac-inv">スタッフを招待するリンク</button></div><p class="k" id="ac-inv-out" style="margin:4px 0 0;word-break:break-all"></p>

    ${IN_LINE ? '' : '<div class="ask"><a class="btn ghost" href="/password">パスワードを再設定</a></div>'}
    ${IN_LINE ? '' : '<form method="post" action="/auth/logout" class="ask"><button class="btn ghost" type="submit">ログアウト</button></form>'}`;
  if ($('ac-mail-go')) $('ac-mail-go').onclick = async () => {
    const m = $('ac-mail').value.trim(); if (!m) { $('ac-mail').focus(); return; }
    const r = await api({ kind: 'app_link_email', email: m });
    $('ac-mail-msg').innerHTML = r.ok ? `${esc(m)} に確認用のリンクを送信しました。リンクを開くと、メールアドレスでもログインできるようになります。${r.devLink ? `<br><a href="${esc(r.devLink)}">(試験中)ここから開く</a>` : ''}` : esc(r.error || '送信できませんでした');
  };
  if ($('ac-shop-go')) $('ac-shop-go').onclick = () => { location.href = '/switch?shop=' + encodeURIComponent($('ac-shop').value); };
  // 作ったリンクを、選べる欄・コピー・開くの3つで出す(コピーが使えない画面でも、欄を長押しで写せる)
  const linkOut = (box, url, note) => {
    box.innerHTML = `<div class="ask" style="margin-top:4px"><input type="text" readonly value="${esc(url)}" aria-label="リンク" style="flex:1;min-width:0;font-size:14px"><button class="btn ghost" type="button" data-cp>コピー</button><a class="btn ghost" href="${esc(url)}" target="_blank" rel="noopener">開く</a></div><p class="k" style="margin:4px 0 0">${note}</p>`;
    const inp = box.querySelector('input'); inp.onfocus = () => inp.select();
    box.querySelector('[data-cp]').onclick = async () => {
      let done = false;
      try { await navigator.clipboard.writeText(url); done = true; } catch (e) {}
      if (!done) { try { inp.focus(); inp.select(); done = document.execCommand('copy'); } catch (e) {} }
      chat(done ? 'リンクをコピーしました' : 'コピーできませんでした。欄を長押ししてコピーしてください', done ? 'heart' : undefined);
    };
  };
  if ($('ac-start')) $('ac-start').onclick = async () => {
    const r = await api({ kind: 'app_start_link' });
    if (!r.ok) { $('ac-start-out').textContent = r.error || '作れませんでした'; return; }
    linkOut($('ac-start-out'), r.link, '新しく利用を始める店舗に送るリンクです(1回限り・7日間有効)。リンクを開いた方が店主として登録され、新しい店舗が作成されます。');
  };
  $('ac-inv').onclick = async () => {
    const r = await api({ kind: 'app_new_invite' });
    if (!r.ok) { $('ac-inv-out').textContent = r.error || '作れませんでした'; return; }
    linkOut($('ac-inv-out'), r.invite, 'このリンクをスタッフに送ってください。リンクを開いて登録すると、すぐに管理画面を利用できます。スタッフ以外には送らないでください。');
  };
}

// 画面の見出しに、その機能の色の印をつける
(() => { const M = { cost: 'cost', label: 'label', mat: 'mat', book: 'book', hyg: 'hyg', sales: 'sales', ws: 'ws', post: 'post', set: 'set' };
  for (const [t, k] of Object.entries(M)) { const h = document.querySelector(`#t-${t} .ph h1, #t-${t} > h1`); if (h && !h.querySelector('.hic')) h.insertAdjacentHTML('afterbegin', `<span class="hic" style="--c:var(--c-${k})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]}</svg></span>`); } })();
// ページの頭の、さがす欄とボタン
(() => {
  const filt = (inp, sel, key) => { const q = inp.value.trim().toLowerCase(); document.querySelectorAll(sel).forEach(el => { el.hidden = !!q && !(el.dataset[key] || el.textContent).toLowerCase().includes(q); }); };
  if ($('cost-q')) $('cost-q').oninput = () => { costQ = $('cost-q').value.trim(); renderCost(); };
  if ($('mat-q')) $('mat-q').oninput = () => filt($('mat-q'), '#mats tr[data-m]', 'm');
  if ($('mat-add-top')) $('mat-add-top').onclick = () => matEdit(null);
  if ($('label-print-top')) $('label-print-top').onclick = () => { const b = $('lb-print'); if (b) { b.scrollIntoView({ behavior: 'smooth', block: 'center' }); b.click(); } };
  if ($('book-copy-top')) $('book-copy-top').onclick = () => { const b = $('sort-copy'); if (b) b.click(); else chat('請求書が登録されていません'); };
  if ($('hyg-print-top')) $('hyg-print-top').onclick = () => { const b = $('hyg-print'); if (b) b.click(); };
  if ($('ws-add-top')) $('ws-add-top').onclick = () => { const i = $('ws-to'); if (i) { i.scrollIntoView({ behavior: 'smooth', block: 'center' }); i.focus(); } };
})();
// ---------- はじまり ----------
// パソコンの広い画面で左右2列に分けるための入れ物(ケイタイでは入れ物がないのと同じ)
(() => {
  const SPLIT = { book: 'h1.sub', hyg: '#hyg-plan-h', sales: '#sales-add', ws: '#ws-chips', set: '#bank-h' };
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
if (CF) { $('ct-via').textContent = 'AIに「問い合わせ 〜」と入力しても受け付けます'; }
rest();
// 前に読んだ内容をすぐ出して、裏で新しいものを読み直す(電波が弱くても待たない)
(() => { const c = cache.get(); if (c && c.products) { try { D = c; MLOCK = D.mlock || null; state(''); renderAll(); show(store.get('tab', 'today'), true); setTimeout(() => chat(hello(), 'greet'), 250); } catch (e) { D = null; } } })();
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
    state('LINEに接続できませんでした。<br><button class="btn ghost" onclick="location.reload()">もう一度</button>');
  }
})();
