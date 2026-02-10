const puppeteer = require('puppeteer');
const path = require('path');

const generatePdf = async (outputHtmlPath, outputPdfPath) => {
  const browser = await puppeteer.launch({
    headless: true, // Set to false to see Chromium output
    args: ['--no-sandbox', '--disable-setuid-sandbox'], // Add these arguments
    timeout: 60000,
  });
  console.log('Browser launched!');
  const page = await browser.newPage();
  // const filePath = path.join(__dirname, outputHtmlPath);
  const fileUrl = outputHtmlPath// `${filePath}`;

  console.log('File URL', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'networkidle2' });
  console.log('Page loaded!');
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('Waited for 1 second!');
  await page.pdf({ path: outputPdfPath, format: 'A4', printBackground: true });
  console.log('PDF generated successfully!');
  await browser.close();
  console.log('Bro close!');
};
const outputHtmlPath = 'file:///C:/Users/Admin/Desktop/E%20BackUP/apiportal/etabella-nestjs/assets/realtime-transcripts/exports/output.html';//process.argv[2];
const outputPdfPath = 'output.pdf' //process.argv[3];

console.log('URL', outputHtmlPath, outputPdfPath)
generatePdf(outputHtmlPath, outputPdfPath);
