const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
  try {
    const htmlPath = path.resolve('D:\\PiMerchantFramework\\user_manual_v2.0.0.html');
    const outputPdf = 'c:\\Users\\aizn\\Desktop\\先锋人工智能服务框架软件_V2.0.0_用户操作手册.pdf';

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

    // Print to PDF with A4 size and standard margins
    await page.pdf({
      path: outputPdf,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '2cm',
        bottom: '2cm',
        left: '2.5cm',
        right: '2.5cm',
      },
    });

    console.log('User Manual PDF generated successfully:', outputPdf);
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
