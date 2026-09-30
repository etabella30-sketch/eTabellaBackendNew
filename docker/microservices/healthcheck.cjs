const http = require('node:http');
require('dotenv').config({ path: '.env.docker' });

const portKeys = {
  authapi: 'PORT_AUTHAPI', coreapi: 'PORT_COREAPI', 'socket-app': 'PORT_SOCKETAPI',
  realtime: 'PORT_REALTIMEAPI', 'realtime-server': 'PORT_REALTIME_SERVERAPI',
  upload: 'PORT_UPLOADAPI', indexapi: 'PORT_INDEXINGAPI', pagination: 'PORT_PAGINATIONAPI',
  batchfile: 'PORT_BATCHAPI', export: 'PORT_EXPORTAPI', downloadapi: 'PORT_DOWNLOADAPI',
  download: 'PORT_DOWNLOAD', hyperlink: 'PORT_HYPERLINK', presentation: 'PORT_PRESENTATION',
  sfu: 'PORT_SFU', 'etabella-nest': 'PORT_DEFAULT',
};
const port = Number(process.env[portKeys[process.env.APP_NAME]]);
if (!Number.isInteger(port) || port < 1 || port > 65535) process.exit(1);
const request = http.get({
  hostname: '127.0.0.1', port,
  path: process.env.APP_NAME === 'socket-app' ? '/' : '/swagger-json',
}, response => {
  response.resume();
  response.on('end', () => process.exit(response.statusCode === 200 ? 0 : 1));
});
request.setTimeout(4000, () => request.destroy(new Error('API health check timed out')));
request.on('error', () => process.exit(1));
