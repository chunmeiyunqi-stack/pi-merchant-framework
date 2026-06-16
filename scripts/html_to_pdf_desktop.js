const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
  try {
    const htmlPath = 'c:\\Users\\aizn\\Desktop\\copyright_final_50.html.txt';
    const outputPdf = 'c:\\Users\\aizn\\Desktop\\copyright_final_50.pdf';

    if (!fs.existsSync(htmlPath)) {
      console.error('HTML file not found:', htmlPath);
      process.exit(1);
    }

    // Launch Puppeteer with Chromium
    const commonPaths = [
      'C:/Program Files/Google/Chrome/Application/chrome.exe',
      'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
      'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
      'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    ];

    let browser;
    try {
      browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    } catch (err) {
      // try local executables
      let launched = false;
      for (const p of commonPaths) {
        if (fs.existsSync(p)) {
          browser = await puppeteer.launch({
            executablePath: p,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
          });
          launched = true;
          break;
        }
      }
      if (!launched) throw err;
    }

    const page = await browser.newPage();
    // Use file:// protocol to load the HTML
    const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');
    console.log('Loading HTML from:', fileUrl);
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });

    // Print to PDF with A4 size and 2cm margins to match CSS @page
    await page.pdf({
      path: outputPdf,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '2.2cm',
        bottom: '2.2cm',
        left: '3.17cm',
        right: '3.17cm',
      },
      headerTemplate: '',
      footerTemplate: '',
    });

    console.log('PDF generated successfully:', outputPdf);
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
