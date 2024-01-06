const { DEBUG, HEADFUL, CHROME_BIN, PORT } = process.env;

// set the default to heroku max ?
const PDF_TIMEOUT = process.env.PDF_TIMEOUT || 1000000;
const PAGE_TIMEOUT = process.env.PAGE_TIMEOUT || 1000000;

const puppeteer = require('puppeteer');
const axios = require('axios').default;

const truncate = (str, len) =>
  str.length > len ? str.slice(0, len) + '…' : str;

const puppeteerConfig = {
  headless: true,
  ignoreHTTPSErrors: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--enable-features=NetworkService',
    '-—disable-dev-tools',
    '--headless',
    '--disable-gpu',
    '--full-memory-crash-report',
    '--unlimited-storage',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',

    // from: https://stackoverflow.com/a/66994528/271932
    '--no-first-run',
    '--no-zygote',
    '--deterministic-fetch',
    '--disable-features=IsolateOrigins',
    '--disable-site-isolation-trials',
  ],
  devtools: false,
};

function testUrl(url) {
  if (!/^https?:\/\//i.test(url)) {
    throw new Error('Invalid URL');
  }
}

function timeoutAndReject(timeout, message) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      reject(message);
    }, timeout);
  });
}

async function checkPageHTML(url) {

  const res = await fetch(url, {
    method: 'HEAD', // Change the method to 'HEAD'
  });

  if (
    !res.ok ||
    !res.headers ||
    (res.status == 200 && !/text\/html/i.test(res.headers.get('content-type')))
  ) {
    throw new Error('HTTP check page HTML error');
  }

  return res;
}

module.exports = async function pdf({
  renderUrl,
  pageOptions,
  pdfOptions,
  name,
}) {
  let browser, page;

  try {
    console.log(renderUrl);
    testUrl(renderUrl);

    await checkPageHTML(renderUrl);

    if (DEBUG) puppeteerConfig.dumpio = true;

    if (HEADFUL) {
      puppeteerConfig.headless = false;
      puppeteerConfig.args.push('--auto-open-devtools-for-tabs');
    }

    if (CHROME_BIN) puppeteerConfig.executablePath = CHROME_BIN;

    browser = await puppeteer.launch(puppeteerConfig);
    page = await browser.newPage();

    let actionDone = false;
    let reqCount = 0;
    const nowTime = +new Date();

    await page.setRequestInterception(true);

    page.on('request', (request) => {
      const url = request.url();
      const method = request.method();
      const resourceType = request.resourceType();

      // Skip data URIs
      if (/^data:/i.test(url)) {
        request.continue();
        return;
      }

      const seconds = (+new Date() - nowTime) / 1000;
      const shortURL = truncate(url, 70);
      const otherResources = /^(manifest|other)$/i.test(resourceType);
      // Abort requests that exceeds 15 seconds
      // Also abort if more than 100 requests
      if (seconds > 15 || reqCount > 100 || actionDone) {
        console.log(`❌⏳ ${method} ${shortURL}`);
        request.abort();
      } else if (otherResources) {
        console.log(`❌ ${method} ${shortURL}`);
        request.abort();
      } else {
        console.log(`✅ ${method} ${shortURL}`);
        request.continue();
        reqCount++;
      }
    });

    let responseReject;
    const responsePromise = new Promise((_, reject) => {
      responseReject = reject;
    });

    page.on('response', (resp) => {
      const headers = resp._headers;
      const renderTestUrl = new URL(renderUrl);
      if (
        resp &&
        resp._status !== undefined &&
        (resp._status === 201 ||
          resp._status === 301 ||
          resp._status === 302 ||
          resp._status === 303 ||
          resp._status === 307 ||
          resp._status === 308) &&
        headers &&
        headers.location !== undefined &&
        headers.location.includes(renderTestUrl.hostname)
      ) {
        // responseReject(new Error(`Possible infinite redirects detected: ${headers['location']} ${resp._status}`));
        console.log(
          `Possible infinite redirects detected: ${headers.location} ${resp._status}`
        );
      } else if (resp && resp._status !== undefined && resp._status !== 200) {
        responseReject(new Error('Status not 200.'));
      }
    });

    await page.setViewport({
      width: pageOptions.width,
      height: pageOptions.height,
    });

    await Promise.race([
      responsePromise,
      page.goto(renderUrl, {
        waitUntil: 'networkidle2',
        timeout: PAGE_TIMEOUT,
      }),
    ]);

    // Pause all media and stop buffering
    page.frames().forEach((frame) => {
      frame.evaluate(() => {
        document.querySelectorAll('video, audio').forEach((m) => {
          if (!m) return;
          if (m.pause) m.pause();
          m.preload = 'none';
        });
      });
    });

    // wait to render pdf
    const pdf = await Promise.race([
      timeoutAndReject(PDF_TIMEOUT, 'PDF timed out'),
      page.pdf(pdfOptions),
    ]);

    actionDone = true;

    if (browser) {
      await browser.close();
    }

    return pdf;
  } catch (e) {
    console.error(e);

    if (!DEBUG && page) {
      await page.removeAllListeners();
      await page.close();
    }
    const { message = '' } = e;

    // Handle websocket not opened error
    if (/not opened/i.test(message) && browser) {
      console.error('🕸 Web socket failed');
      try {
        await browser.close();
        browser = null;
      } catch (err) {
        console.warn(`Chrome could not be killed ${err.message}`);
        browser = null;
      }
    }

    if (browser) {
      await browser.close();
      browser = null;
    }

    // give up and throw up to retry
    throw e;
  }
};
