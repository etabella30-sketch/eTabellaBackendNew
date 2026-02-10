const { exec } = require('child_process');
const fs = require('fs');

const child = exec('node dist/apps/realtime/main.js');

child.stdout.on('data', (data) => {
  fs.appendFileSync('full-output.log', data);
});

child.stderr.on('data', (data) => {
  fs.appendFileSync('full-output.log', data);
});

child.on('close', (code) => {
  fs.appendFileSync('full-output.log', `\nProcess exited with code ${code}\n`);
});
