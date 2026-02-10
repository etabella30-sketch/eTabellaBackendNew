const { spawn } = require('child_process');

// Extract the app name from the command-line arguments
const appNameArg = process.argv.find((arg) => arg.startsWith('app='));
// console.log('ALPHA APPLICATION', process);
const appName = appNameArg ? appNameArg.split('=')[1] : 'defaultAppName';

const appEnvirmentArg = process.argv.find((arg) => arg.startsWith('prod='));

let isBuildScript = false;
if (process.argv.includes('build')) {
  isBuildScript = true;
}

const envirmnt = appEnvirmentArg
  ? appEnvirmentArg.split('=')[1]
  : 'development';

// console.log('ALPHA TESTING',appName)
// Set the NODE_ENV environment variable
// const envMode = process.env.NODE_ENV || 'development';

// Initialize the command variable with `let` so it can be reassigned
let command = `cross-env APP_NAME=${appName} ENV_MODE=${envirmnt} PROC_NAME=${isBuildScript ? `build` : `start`} start-app.bat`;
    console.log('ACTUAL COMMAN',command)
if (envirmnt === 'development') {
  command += ' --debug --watch';
}

// Execute the command
const [cmd, ...args] = command.split(' ');
const proc = spawn(cmd, args, { stdio: 'inherit', shell: true });

proc.on('exit', (code, signal) => {
  console.log(`Process exited with code ${code} and signal ${signal}`);
});
