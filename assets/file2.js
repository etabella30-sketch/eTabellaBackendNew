require('dotenv').config({ path: `.env.${process.env.NODE_ENV ? process.env.NODE_ENV : 'development'}` });
const production = (process.env.NODE_ENV == 'production');
const http = require("http");
const https = require("https");
const fs = require('fs');
const { stat, createReadStream } = require('fs');
const { promisify } = require('util');
const { pipeline } = require('stream');

const port = process.env.PORT_PDF_SERVER_HTTP || 3000;
const httpsPort = process.env.PORT_PDF_SERVER_HTTPS || 3443;
const samplePDFOutPutPath = process.env.PDF_OUTPUT_PATH;
const fileInfo = promisify(stat);


const requestHandler = async (req, res) => {
  const file = req.url.split('?')[0];
  
  const samplePDF =  `${samplePDFOutPutPath}${file}`;
  console.log('\n\r\n\rCOMPLETE PATH', samplePDF);
  /** Calculate Size of file */
  const { size } = await fileInfo(samplePDF);
  const range = req.headers.range;
  console.log('Size', size)

  /** Check for Range header */
  if (range) {
    /** Extracting Start and End value from Range Header */
    let [start, end] = range.replace(/bytes=/, "").split("-");
    start = parseInt(start, 10);
    end = end ? parseInt(end, 10) : size - 1;

    if (!isNaN(start) && isNaN(end)) {
      start = start;
      end = size - 1;
    }
    if (isNaN(start) && !isNaN(end)) {
      start = size - end;
      end = size - 1;
    }

    // Handle unavailable range request
    if (start >= size || end >= size) {
      // Return the 416 Range Not Satisfiable.
      res.writeHead(416, {
        "Content-Range": `bytes */${size}`
      });
      return res.end();
    }

    /** Sending Partial Content With HTTP Code 206 */
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Accept-Ranges": "bytes",
      "Content-Length": end - start + 1,
      "Content-Type": "application/pdf",
      "Access-Control-Allow-Origin": "*"
    });

    const readable = createReadStream(samplePDF, { start, end });
    pipeline(readable, res, err => {
      console.log(err);
    });

  } else {

    res.writeHead(200, {
      "Access-Control-Expose-Headers": "Accept-Ranges",
      "Access-Control-Allow-Headers": "Accept-Ranges,range",
      "Accept-Ranges": "bytes",
      "Content-Length": size,
      "Content-Type": "application/pdf",
      "Access-Control-Allow-Origin": "*"
    });

    if (req.method === "GET") {
      const readable = createReadStream(samplePDF);
      pipeline(readable, res, err => {
        console.log(err);
      });
    } else {
      res.end();
    }

  }
};

http.createServer(requestHandler)
  .listen(port, () => console.log(`HTTP server running on port ${port}`));

if (production) {
  const options = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH),
  };
  https.createServer(options, requestHandler)
    .listen(httpsPort, () => console.log(`HTTPS server running on port ${httpsPort}`));
}