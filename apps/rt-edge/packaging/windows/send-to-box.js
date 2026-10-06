// Acts like the reporter's Eclipse in "Connect to server" mode: connects to the venue box's CAT port, logs in with
// the session's Eclipse username + password, then streams the recorded hearing of tcp-server-main (commands.json),
// one write per entry, exactly as tcp.js does. Reconnects and carries on if the box goes away.
//
// Usage:  node send-to-box.js <eclipse-username> <eclipse-password> [host=127.0.0.1] [port=2600] [msPerEntry=400] [commands.json]
// The recording defaults to tcp-server-main's commands.json on the development PC; pass its path as the 6th
// argument or in RT_COMMANDS_JSON on any other machine.
'use strict';
const fs = require('fs');
const net = require('net');
const path = require('path');

const [user, pass, host = '127.0.0.1', portArg = '2600', msArg = '400', commandsArg] = process.argv.slice(2);
if (!user || !pass) {
  console.log('Usage: node send-to-box.js <eclipse-username> <eclipse-password> [host] [port] [msPerEntry] [commands.json]');
  process.exit(2);
}
const port = Number(portArg);
const msPerEntry = Number(msArg);

const COMMANDS = commandsArg || process.env.RT_COMMANDS_JSON || 'D:/etabella tech/tcp-server-main/commands.json';
const toHex = s => s.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
const entries = JSON.parse(fs.readFileSync(COMMANDS, 'utf-8'))
  .map(a => Buffer.from(!a.cmdType ? toHex(String(a.data1 ?? '')) : String(a.hexCmd ?? ''), 'hex'));
console.log(`Loaded ${entries.length} entries from ${path.basename(COMMANDS)}`);

let next = 0;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  while (next < entries.length) {
    const socket = await new Promise(resolve => {
      const s = net.connect({ host, port }, () => resolve(s));
      s.on('error', err => { console.log(`Cannot connect to ${host}:${port} (${err.code}); retrying in 3 s`); resolve(null); });
    });
    if (!socket) { await sleep(3000); continue; }
    socket.setNoDelay(true);
    let open = true;
    socket.on('close', () => { open = false; });
    socket.on('data', d => console.log(`box says: ${JSON.stringify(d.toString('latin1'))}`));
    socket.write(`${user}\r\n${pass}\r\n`);
    console.log(`Connected to ${host}:${port} as ${user}; sending from entry ${next}`);
    while (open && next < entries.length) {
      await new Promise(r => socket.write(entries[next], r));
      next++;
      if (next % 50 === 0) console.log(`  sent ${next}/${entries.length}`);
      await sleep(msPerEntry);
    }
    if (!open) { console.log('Box closed the connection; reconnecting in 3 s'); await sleep(3000); }
    else socket.end();
  }
  console.log('All entries sent.');
}
run();
