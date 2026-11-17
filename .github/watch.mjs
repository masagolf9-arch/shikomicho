// ピタット原価の見張り(5分おき・GitHub Actions・無料)
// ホームページ・お店の画面・本体の様子を外から開き、2回続けて開けなければ税所さんのLINEに知らせる。戻ったらもう一度知らせる
// 戦略室 2026-11-16「保守の契約なしで守る形」1
import fs from 'node:fs';

const BASE = process.env.BASE || 'https://shikomicho.masagolf9.workers.dev';
const STATE = process.env.STATE_FILE || '.watch/state.json';
const LINE_TOKEN = process.env.LINE_TOKEN || '', LINE_TO = process.env.LINE_TO || '';
const MODE = process.env.EVENT_SCHEDULE === '0 0 1 * *' ? 'monthly' : process.env.TEST === 'true' ? 'test' : 'watch';
const REMIND = 3 * 3600e3;   // 止まったままなら3時間ごとにもう一度

const jst = t => new Date(t + 9 * 3600e3).toISOString().slice(5, 16).replace('T', ' ').replace('-', '/');
async function get(path) {
  try { const r = await fetch(BASE + path, { redirect: 'manual', signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'pitatto-watch' } }); return { status: r.status, text: await r.text() }; }
  catch (e) { return { status: 0, text: String(e && e.message || e) }; }
}
const CHECKS = [
  ['ホームページ', '/', r => r.status === 200 ? '' : '開けません(' + (r.status || '返事なし') + ')'],
  ['お店の画面', '/app/', r => r.status > 0 && r.status < 400 ? '' : '開けません(' + (r.status || '返事なし') + ')'],
  ['本体の様子', '/health', r => {
    if (r.status !== 200) return '返事がありません(' + (r.status || '返事なし') + ')';
    let j; try { j = JSON.parse(r.text); } catch (e) { return '返事が読めません'; }
    const miss = [['line', 'LINE'], ['ai', 'AI'], ['liff', 'LINEのお店の画面']].filter(([k]) => j[k] === false).map(([, n]) => n);
    return miss.length ? '鍵が見当たりません: ' + miss.join('・') + '(鍵の入れ替えのあとなら、入れ忘れがないか確かめてください)' : '';
  }]
];
async function runChecks() {
  const out = {};
  for (const [name, path, judge] of CHECKS) out[name] = judge(await get(path));
  return out;
}
async function line(text) {
  if (!LINE_TOKEN || !LINE_TO) { console.log('LINEの送り先が未設定(WATCH_LINE_TOKEN / WATCH_LINE_TO)。代わりにGitHubの失敗メールで知らせます'); return false; }
  try {
    const r = await fetch('https://api.line.me/v2/bot/message/push', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + LINE_TOKEN }, body: JSON.stringify({ to: LINE_TO, messages: [{ type: 'text', text }] }), signal: AbortSignal.timeout(15000) });
    if (!r.ok) console.log('LINEに送れませんでした', r.status, await r.text());
    return r.ok;
  } catch (e) { console.log('LINEに送れませんでした', String(e)); return false; }
}

let st = { down: false, since: 0, told: 0, what: {} };
try { st = Object.assign(st, JSON.parse(fs.readFileSync(STATE, 'utf8'))); } catch (e) {}
const now = Date.now();
let res = await runChecks();
// 1回目で開けなかったものは、1分待ってもう一度(2回続けて開けなければ「止まった」)
if (Object.values(res).some(Boolean) && MODE === 'watch') { await new Promise(r => setTimeout(r, Number(process.env.WAIT_MS || 60000))); const again = await runChecks(); for (const k of Object.keys(res)) if (!again[k]) res[k] = ''; else if (res[k]) res[k] = again[k]; }
const bad = Object.entries(res).filter(([, v]) => v);
console.log(jst(now), bad.length ? '止まっています: ' + JSON.stringify(Object.fromEntries(bad)) : 'すべて開けました');
const list = bad.map(([k, v]) => '・' + k + ': ' + v).join('\n');
let need = '', sent = true;

if (MODE === 'test') need = '【見張り・試し】これは試しの知らせです。見張りの知らせはこのLINEに届きます。\n今の様子: ' + (bad.length ? '\n' + list : 'すべて開けました');
else if (MODE === 'monthly') need = '【見張り】今月も見張りは動いています(5分おき)。\n今の様子: ' + (bad.length ? '\n' + list : 'すべて開けました');
else if (bad.length && !st.down) { need = `【見張り】ピタット原価に止まっているところがあります(${jst(now)} から)\n${list}\n\n手順書: 運営の画面の「事故のとき」\n戻ったら、また知らせます。`; st = { down: true, since: now, told: now, what: Object.fromEntries(bad) }; }
else if (bad.length && st.down && now - st.told >= REMIND) { need = `【見張り】まだ戻っていません(${jst(st.since)} から ${Math.round((now - st.since) / 60000)}分)\n${list}`; st.told = now; st.what = Object.fromEntries(bad); }
else if (!bad.length && st.down) { need = `【見張り】ピタット原価が戻りました(${jst(now)})。止まっていた時間: 約${Math.max(1, Math.round((now - st.since) / 60000))}分`; st = { down: false, since: 0, told: 0, what: {} }; }

if (need) { console.log(need); sent = await line(need); }
fs.mkdirSync(STATE.split('/').slice(0, -1).join('/') || '.', { recursive: true });
fs.writeFileSync(STATE, JSON.stringify(st));
// 知らせが必要なのにLINEで届けられなかったときだけ、この実行を「失敗」にする(GitHubから失敗のメールが届く)
if (need && !sent) process.exit(1);
