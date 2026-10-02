/**
 * The localhost box console page: one HTML file, one stylesheet, one script, served by box-console.server.ts under a
 * strict CSP (`script-src 'self'`, no inline code). The script polls `GET /api/state` every 2 s and renders with
 * `textContent` only (never innerHTML), so nothing the cloud sends can become markup.
 */

export const CONSOLE_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Venue box console</title>
<link rel="stylesheet" href="/console.css">
</head>
<body>
<header class="top">
  <div class="brand">eTabella <span class="sep">·</span> <span id="box-name">Venue box</span></div>
  <div class="pills" id="top-right" hidden>
    <span class="pill" id="pill-reporter"><i></i><span>Reporter</span></span>
    <span class="pill" id="pill-cloud"><i></i><span>etabella.net</span></span>
    <span class="who" id="who"></span>
    <button type="button" class="link" id="btn-signout">Sign out</button>
  </div>
</header>

<section class="signin card" id="signin" hidden>
  <h1>Sign in to the venue box</h1>
  <p class="hint">Enter the email you use on etabella.net. No password is needed on this computer.</p>
  <form id="signin-form" autocomplete="on">
    <label>Email<input type="email" name="email" id="signin-email" autocomplete="email" placeholder="you@firm.com" required></label>
    <div class="form-msg" id="signin-msg" role="alert"></div>
    <button type="submit" id="btn-signin">Continue</button>
  </form>
</section>

<main id="app" hidden>
  <div class="banner" id="banner" hidden></div>

  <section class="card">
    <h2>Sessions from etabella.net</h2>
    <p class="mine" id="my-cases" hidden></p>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Session</th><th>Case</th><th>Starts</th><th>Status</th><th class="num">Lines</th><th>Reporter</th><th>Eclipse username</th></tr></thead>
        <tbody id="sessions"></tbody>
      </table>
    </div>
    <p class="hint" id="sessions-empty" hidden>No sessions yet. Create one on etabella.net (Admin › Realtime) with Feed path <b>Venue box</b> and this box. It appears here within seconds.</p>
    <p class="hint">The Eclipse password is the one shown on etabella.net when the session was created. A session with a reporter address needs no login: this box connects to the reporter's machine by itself.</p>
  </section>

  <section class="card">
    <h2>Reporter connection</h2>
    <div class="status" id="tx-status"><i></i><div><div class="status-label" id="tx-label">…</div><div class="status-sub" id="tx-sub"></div></div></div>
    <p class="note" id="tx-cloud" hidden></p>

    <p class="note" id="tx-readonly" hidden>Only a super admin can change the reporter connection.</p>
    <form id="tx-form" autocomplete="off">
      <label class="option" id="opt-listen">
        <input type="radio" name="mode" value="listen">
        <div>
          <div class="option-title">The reporter's Eclipse connects to this box</div>
          <div class="option-sub">In Eclipse realtime output choose <b>Connect to server</b>.</div>
          <dl class="kv" id="listen-info">
            <dt>Server address</dt><dd id="listen-address">…</dd>
            <dt>Port</dt><dd id="listen-port">…</dd>
            <dt>Login</dt><dd>The session's Eclipse username and password</dd>
          </dl>
        </div>
      </label>
      <label class="option" id="opt-dial">
        <input type="radio" name="mode" value="dial">
        <div>
          <div class="option-title">This box connects to the reporter's machine</div>
          <div class="option-sub">In Eclipse realtime output choose <b>Wait for connection</b>, then enter its address here.</div>
          <div class="fields">
            <label>Reporter machine IP<input name="host" placeholder="192.168.1.20" inputmode="decimal"></label>
            <label>Port<input name="port" placeholder="1337" inputmode="numeric"></label>
            <label>Protocol<select name="protocol"><option value="bridge">Bridge</option><option value="caseview">CaseView</option></select></label>
          </div>
        </div>
      </label>
      <div class="actions">
        <span class="form-msg" id="form-msg" role="status"></span>
        <button type="button" class="secondary" id="btn-reconnect" hidden>Reconnect</button>
        <button type="button" class="secondary" id="btn-connect" hidden>Connect</button>
        <button type="submit" id="btn-apply" disabled>Save</button>
      </div>
    </form>
  </section>

  <section class="card">
    <h2>etabella.net</h2>
    <dl class="kv">
      <dt>Link</dt><dd id="cloud-label">…</dd>
      <dt>Last sent</dt><dd id="cloud-synced">…</dd>
      <dt>Box address</dt><dd id="box-host">…</dd>
    </dl>
  </section>
</main>
<footer>This page opens only on this computer. <span id="version"></span></footer>
<script src="/console.js"></script>
</body>
</html>
`;

export const CONSOLE_CSS = `
:root { --bg:#f4f6fa; --card:#fff; --ink:#0f1f3a; --muted:#5b6b82; --line:#e3e8f0; --accent:#e8603c; --ok:#14866d; --warn:#b7791f; --bad:#c0392b; --idle:#8a97ab; }
@media (prefers-color-scheme: dark) { :root { --bg:#0e1522; --card:#162133; --ink:#e7edf7; --muted:#9fb0c8; --line:#26344c; --idle:#6c7b93; } }
* { box-sizing: border-box; }
body { margin:0; background:var(--bg); color:var(--ink); font:14px/1.45 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
.top { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; padding:14px 24px; background:var(--card); border-bottom:1px solid var(--line); }
.brand { font-weight:700; font-size:16px; } .sep { color:var(--muted); margin:0 4px; } #box-name { font-weight:600; }
.pills { display:flex; gap:8px; flex-wrap:wrap; }
.pill { display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:999px; border:1px solid var(--line); font-size:12px; font-weight:600; color:var(--muted); }
.pill i, .status i { width:8px; height:8px; border-radius:50%; background:var(--idle); flex:none; }
.ok i { background:var(--ok); } .warn i { background:var(--warn); } .bad i { background:var(--bad); }
main { max-width:1080px; margin:0 auto; padding:20px 16px 8px; display:grid; gap:16px; }
.card { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:18px 20px; }
h2 { margin:0 0 12px; font-size:15px; }
.banner { padding:12px 16px; border-radius:10px; background:#fdf1e7; color:#8a4b14; border:1px solid #f3d3b4; font-weight:600; }
.table-wrap { overflow-x:auto; }
table { width:100%; border-collapse:collapse; }
th, td { text-align:left; padding:9px 10px; border-bottom:1px solid var(--line); white-space:nowrap; }
th { font-size:11px; text-transform:uppercase; letter-spacing:.04em; color:var(--muted); font-weight:700; }
td.num, th.num { text-align:right; font-variant-numeric:tabular-nums; }
tr.receiving td { background:rgba(20,134,109,.07); }
.tag { display:inline-block; padding:2px 8px; border-radius:999px; font-size:12px; font-weight:600; background:var(--line); color:var(--muted); }
.tag.live { background:rgba(20,134,109,.14); color:var(--ok); } .tag.ended { opacity:.8; }
.mono { font-family:ui-monospace, Consolas, monospace; }
.hint { margin:10px 0 0; color:var(--muted); font-size:13px; }
.mine { margin:0 0 10px; color:var(--muted); font-size:13px; }
.note { margin:-4px 0 14px; padding:9px 14px; border:1px solid var(--line); border-radius:10px; font-size:13px; color:var(--muted); }
.note.ok { color:var(--ok); } .note.warn { color:var(--warn); border-color:var(--warn); }
.status { display:flex; gap:10px; align-items:flex-start; padding:12px 14px; border:1px solid var(--line); border-radius:10px; margin-bottom:14px; }
.status i { margin-top:6px; width:10px; height:10px; }
.status-label { font-weight:700; } .status-sub { color:var(--muted); font-size:13px; }
form { display:grid; gap:10px; }
.option { display:flex; gap:12px; align-items:flex-start; padding:12px 14px; border:1px solid var(--line); border-radius:10px; cursor:pointer; }
.option.on { border-color:var(--accent); box-shadow:0 0 0 1px var(--accent) inset; }
.option input[type=radio] { margin-top:3px; accent-color:var(--accent); }
.option-title { font-weight:700; } .option-sub { color:var(--muted); font-size:13px; margin-bottom:6px; }
.kv { display:grid; grid-template-columns:max-content 1fr; gap:4px 16px; margin:6px 0 0; }
.kv dt { color:var(--muted); } .kv dd { margin:0; font-weight:600; }
.fields { display:flex; gap:10px; flex-wrap:wrap; margin-top:6px; }
.fields label { display:grid; gap:4px; font-size:12px; color:var(--muted); font-weight:600; }
input:not([type=radio]), select { font:inherit; padding:7px 9px; border:1px solid var(--line); border-radius:8px; background:var(--card); color:var(--ink); min-width:150px; }
.actions { display:flex; gap:8px; justify-content:flex-end; align-items:center; flex-wrap:wrap; }
.form-msg { margin-right:auto; color:var(--muted); font-size:13px; } .form-msg.bad { color:var(--bad); } .form-msg.ok { color:var(--ok); }
button { font:inherit; font-weight:700; padding:8px 16px; border-radius:8px; border:1px solid var(--accent); background:var(--accent); color:#fff; cursor:pointer; }
button.secondary { background:transparent; color:var(--accent); }
button:disabled { opacity:.5; cursor:default; }
.who { font-size:13px; color:var(--muted); align-self:center; }
button.link { background:none; border:none; color:var(--accent); padding:4px 6px; font-weight:600; }
.signin { max-width:420px; margin:48px auto 0; display:grid; gap:10px; }
.signin h1 { margin:0; font-size:18px; }
.signin form { gap:12px; }
.signin label { display:grid; gap:4px; font-size:12px; color:var(--muted); font-weight:600; }
.signin input { width:100%; }
[hidden] { display:none !important; }
footer { text-align:center; color:var(--muted); font-size:12px; padding:16px; }
@media (max-width:640px) { .top { padding:12px 16px; } .card { padding:14px; } }
`;

export const CONSOLE_JS = `
(function () {
  'use strict';
  var state = null, dirty = false, busy = false;
  var form = document.getElementById('tx-form');
  var $ = function (id) { return document.getElementById(id); };

  function fmtTime(ms, tz) {
    if (ms === null || ms === undefined) return '—';
    try { return new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(ms)); }
    catch (e) { return new Date(ms).toLocaleTimeString(); }
  }
  function fmtStart(iso, tz) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    try { return new Intl.DateTimeFormat('en-GB', { timeZone: tz, day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(d); }
    catch (e) { return d.toLocaleString(); }
  }
  function cell(text, cls) { var td = document.createElement('td'); td.textContent = text; if (cls) td.className = cls; return td; }
  function tone(el, t) { el.classList.remove('ok', 'warn', 'bad'); if (t) el.classList.add(t); }

  function render(s) {
    var tz = s.box.timeZone;
    $('box-name').textContent = s.box.name;
    $('who').textContent = s.me ? s.me.name : '';
    form.hidden = !s.canChangeSettings;
    $('tx-readonly').hidden = !!s.canChangeSettings;
    $('version').textContent = 'Box ' + s.box.version + (s.box.host ? ' · ' + s.box.host : '');
    var banner = $('banner');
    banner.hidden = !s.box.problem; banner.textContent = s.box.problem || '';

    // pills
    tone($('pill-cloud'), s.cloud.ok ? 'ok' : s.cloud.state === 'not-linked' ? null : 'warn');
    tone($('pill-reporter'), s.transmitter.ok ? 'ok' : s.transmitter.state === 'disconnected' ? 'bad' : s.transmitter.state === 'connecting' || s.transmitter.state === 'connected-no-session' ? 'warn' : null);

    // my cases
    var mine = $('my-cases');
    mine.hidden = !s.cases.length;
    mine.textContent = s.cases.length ? 'My cases: ' + s.cases.map(function (c) { return c.name; }).join(' · ') : '';

    // sessions
    var body = $('sessions'); body.textContent = '';
    s.sessions.forEach(function (r) {
      var tr = document.createElement('tr');
      if (r.receiving) tr.className = 'receiving';
      tr.appendChild(cell(r.name));
      tr.appendChild(cell(r.caseName || '—'));
      tr.appendChild(cell(fmtStart(r.startsAt, tz)));
      var st = document.createElement('td'); var tag = document.createElement('span');
      tag.className = 'tag' + (r.phase === 'live' ? ' live' : r.phase === 'ended' ? ' ended' : '');
      tag.textContent = r.phaseLabel + (r.receiving ? ' · receiving' : '');
      st.appendChild(tag); tr.appendChild(st);
      tr.appendChild(cell(String(r.lines), 'num'));
      tr.appendChild(cell(r.reporter, /^[0-9]/.test(r.reporter) ? 'mono' : ''));
      tr.appendChild(cell(r.eclipseUser || '—', 'mono'));
      body.appendChild(tr);
    });
    $('sessions-empty').hidden = s.sessions.length > 0;

    // transmitter status
    var t = s.transmitter;
    tone($('tx-status'), t.ok ? 'ok' : t.state === 'disconnected' ? 'bad' : t.state === 'connecting' || t.state === 'connected-no-session' ? 'warn' : null);
    $('tx-label').textContent = t.label + (t.lockout ? ' · Eclipse login locked after wrong passwords (unlock on etabella.net)' : '');
    var sub = [];
    if (t.peer) sub.push('Connected: ' + t.peer);
    if (t.lastLineAtMs) sub.push('Last line ' + fmtTime(t.lastLineAtMs, tz));
    if (t.bytesIn) sub.push(Math.round(t.bytesIn / 1024) + ' KB received');
    $('tx-sub').textContent = sub.join(' · ');
    var note = $('tx-cloud');
    note.hidden = !t.cloud;
    note.textContent = t.cloud ? t.cloud.text : '';
    note.className = 'note' + (t.cloud && t.cloud.tone ? ' ' + t.cloud.tone : '');
    $('listen-address').textContent = t.listen.addresses.length ? t.listen.addresses.join('  or  ') : 'This computer\\'s IP address';
    $('listen-port').textContent = String(t.listen.port);
    $('btn-connect').hidden = !t.canConnect;
    $('btn-reconnect').hidden = !t.canReconnect;

    if (!dirty) {
      form.elements.mode.value = t.mode;
      form.elements.host.value = t.host || '';
      form.elements.port.value = t.port ? String(t.port) : '';
      form.elements.protocol.value = t.protocol || 'bridge';
    }
    syncOptions();

    // cloud
    $('cloud-label').textContent = s.cloud.label;
    $('cloud-synced').textContent = s.cloud.lastSyncedAtMs ? fmtTime(s.cloud.lastSyncedAtMs, tz) : '—';
    $('box-host').textContent = s.box.host || '—';
  }

  function syncOptions() {
    var mode = form.elements.mode.value;
    $('opt-listen').classList.toggle('on', mode === 'listen');
    $('opt-dial').classList.toggle('on', mode === 'dial');
    $('btn-apply').disabled = busy || !dirty;
  }

  function msg(text, t) { var m = $('form-msg'); m.textContent = text || ''; m.className = 'form-msg' + (t ? ' ' + t : ''); }

  function post(path, body) {
    return fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Box-Console': '1' }, body: JSON.stringify(body) })
      .then(function (res) { return res.json().catch(function () { return {}; }).then(function (j) { return { ok: res.ok, body: j }; }); });
  }

  function show(signedIn) {
    $('signin').hidden = signedIn;
    $('app').hidden = !signedIn;
    $('top-right').hidden = !signedIn;
  }

  function refresh() {
    return fetch('/api/state', { headers: { 'X-Box-Console': '1' } })
      .then(function (r) { return r.json().then(function (j) { return { status: r.status, body: j }; }); })
      .then(function (r) {
        if (r.status === 401) {
          state = null;
          if (r.body.boxName) $('box-name').textContent = r.body.boxName;
          if ($('signin').hidden) { show(false); $('signin-email').focus(); }
          return;
        }
        if (r.status !== 200) return;
        state = r.body; show(true); render(r.body);
      })
      .catch(function () {
        msg('The box is not answering. Is it still running?', 'bad');
        signinMsg('The box is not answering. Is it still running?');
      });
  }

  function signinMsg(text) { $('signin-msg').textContent = text || ''; $('signin-msg').className = 'form-msg' + (text ? ' bad' : ''); }

  $('signin-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = $('btn-signin');
    btn.disabled = true; signinMsg('');
    post('/api/signin', { email: $('signin-email').value })
      .then(function (r) {
        btn.disabled = false;
        if (!r.ok) { signinMsg(r.body.message || 'Could not sign in.'); return; }
        dirty = false; msg('');
        return refresh();
      })
      .catch(function () { btn.disabled = false; signinMsg('The box is not answering. Is it still running?'); });
  });

  $('btn-signout').addEventListener('click', function () {
    post('/api/signout', {}).then(function () { state = null; dirty = false; show(false); $('signin-email').focus(); });
  });

  form.addEventListener('input', function () { dirty = true; msg(''); syncOptions(); });
  form.addEventListener('change', function () { dirty = true; syncOptions(); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!state || busy) return;
    var mode = form.elements.mode.value;
    var settings = mode === 'dial'
      ? { mode: 'dial', protocol: form.elements.protocol.value, host: form.elements.host.value.trim(), port: Number(form.elements.port.value) || null, autoReconnect: true, receivingSesid: null }
      : { mode: 'listen', protocol: null, host: null, port: null, autoReconnect: true, receivingSesid: null };
    var live = state.transmitter.ok;
    if (live && !window.confirm('Lines are coming in now. Changing the connection stops them until the reporter is connected again. Continue?')) return;
    busy = true; syncOptions(); msg('Saving…');
    post('/api/transmitter', { stateVersion: state.transmitter.stateVersion, settings: settings, confirmInterrupt: live })
      .then(function (r) {
        busy = false;
        if (r.ok) { dirty = false; msg(mode === 'dial' ? 'Saved. Connecting to the reporter\\'s machine…' : 'Saved. Waiting for the reporter\\'s Eclipse to connect.', 'ok'); }
        else msg(r.body.message || 'Could not save', 'bad');
        return refresh();
      });
  });

  function action(path, label) {
    if (!state || busy) return;
    busy = true; msg(label + '…');
    post(path, { stateVersion: state.transmitter.stateVersion }).then(function (r) {
      busy = false;
      msg(r.ok ? '' : (r.body.message || 'Could not ' + label.toLowerCase()), r.ok ? null : 'bad');
      return refresh();
    });
  }
  $('btn-connect').addEventListener('click', function () { action('/api/transmitter/connect', 'Connect'); });
  $('btn-reconnect').addEventListener('click', function () { action('/api/transmitter/reconnect', 'Reconnect'); });

  refresh();
  // Poll only while signed in (the sign-in screen has nothing to refresh).
  setInterval(function () { if (!busy && state) refresh(); }, 2000);
})();
`;
