const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
  try {
    // Use the project's properly formatted HTML (50 lines per page)
    const htmlPath = path.resolve('D:\\PiMerchantFramework\\source_code_print_for_pdf.html');
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
    const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');
    console.log('Loading HTML from:', fileUrl);
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });

    // Print to PDF: A4 with centered header and footer
    await page.pdf({
      path: outputPdf,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm',
        bottom: '0mm',
        left: '0mm',
        right: '0mm',
      },
    });

    console.log('PDF generated successfully:', outputPdf);
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
