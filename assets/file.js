require('dotenv').config({ path: `.env.${process.env.NODE_ENV ? process.env.NODE_ENV : 'development'}` });
const production = (process.env.NODE_ENV == 'production');
const http = require("http");
const https = require("https");
const fs = require('fs');
const { pipeline } = require('stream');

const port = process.env.PORT_PDF_SERVER_HTTP || 3000;
const httpsPort = process.env.PORT_PDF_SERVER_HTTPS || 3443;
const samplePDFOutPutPath = process.env.PDF_OUTPUT_PATH;  // This will now hold the base URL instead of a path

// Function to fetch the file from the URL
const fetchPDF = (url, res, range, size) => {
  const protocol = url.startsWith('https') ? https : http;
  
  protocol.get(url, { headers: range ? { range } : {} }, (response) => {
    const { statusCode, headers } = response;
    
    if (statusCode === 200 || statusCode === 206) {
      res.writeHead(statusCode, {
        "Content-Length": headers['content-length'],
        "Content-Type": "application/pdf",
        "Access-Control-Allow-Origin": "*",
        ...(range && headers['content-range'] ? { "Content-Range": headers['content-range'] } : {})
      });

      pipeline(response, res, (err) => {
        if (err) console.log('Error in pipeline', err);
      });
    } else {
      res.writeHead(404);
      res.end("File not found");
    }
  }).on('error', (err) => {
    console.log('Error fetching file', err);
    res.writeHead(500);
    res.end("Error fetching file");
  });
};

const requestHandler = async (req, res) => {
  try {
    const file = req.url.split('?')[0];
    const samplePDF =  `${samplePDFOutPutPath}${file}`;  // Full URL to the PDF file 'https://etabella.sgp1.cdn.digitaloceanspaces.com/case139/dc_01714564036291.pdf';//
    console.log('\n\r\n\rCOMPLETE PATH', samplePDF);
  
    const range = req.headers.range;
    console.log('Requested Range:', range);
  
    if (range) {
      // If range is specified, fetch partial content
      fetchPDF(samplePDF, res, { range }, null);
    } else {
      // Fetch the full file
      fetchPDF(samplePDF, res);
    }
  } catch (error) {
    
  }

};

// HTTP server
http.createServer(requestHandler)
  .listen(port, () => console.log(`HTTP server running on port ${port}`));

// HTTPS server for production
if (production) {
  const options = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH),
  };
  https.createServer(options, requestHandler)
    .listen(httpsPort, () => console.log(`HTTPS server running on port ${httpsPort}`));
}
