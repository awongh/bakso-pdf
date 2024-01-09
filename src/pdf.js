const { DEBUG, HEADFUL, CHROME_BIN } = process.env;

const puppeteer = require('puppeteer');

const truncate = (str, len) =>
  str.length > len ? str.slice(0, len) + '…' : str;

const puppeteerConfig = {
  // https://developer.chrome.com/articles/new-headless/
  headless: 'new',
  ignoreHTTPSErrors: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--enable-features=NetworkService',
    '-—disable-dev-tools',
    '--headless=new',
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

module.exports.puppeteerConfig = puppeteerConfig;

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
  const parsedUrl = new URL(url);

  // for nodejs < 20 fetch to localhost doesn't work
  // if it's local, don't check this
  // https://github.com/node-fetch/node-fetch/issues/1624
  if (parsedUrl.hostname === 'localhost') {
    return true;
  }

  const res = await fetch(url, {method: 'HEAD'});

  if (
    !res.ok ||
    !res.headers ||
    (res.status == 200 && !/text\/html/i.test(res.headers.get('content-type')))
  ) {
    throw new Error('HTTP check page HTML error');
  }

  return res;
}

module.exports.puppeteerPdf = async function puppeteerPdf(pdfParams) {
  let browser, page;

  try {
    if (DEBUG) puppeteerConfig.dumpio = true;

    if (HEADFUL) {
      puppeteerConfig.headless = false;
      puppeteerConfig.args.push('--auto-open-devtools-for-tabs');
    }

    if (CHROME_BIN) puppeteerConfig.executablePath = CHROME_BIN;

    browser = await puppeteer.launch(puppeteerConfig);
    page = await browser.newPage();

    return pdf({ browser, page, ...pdfParams });
  } catch (e) {
    console.error(e);

    // give up and throw up to retry
    throw e;
  }
};

async function pdf({
  browser,
  page,
  name,
  renderUrl,
  pdfOptions,
  windowViewportWidth,
  windowViewportHeight,
  pdfGenerationTimeout,
  pageRequestTimeout,
  isTest,
}) {
  try {
    // set default values if its not set
    name ||= 'document';
    pdfOptions ||= {};
    windowViewportWidth ||= 50;
    windowViewportHeight ||= 50;
    pdfGenerationTimeout ||= 1000000;
    pageRequestTimeout ||= 1000000;
    isTest ||= false;

    testUrl(renderUrl);

    await checkPageHTML(renderUrl);

    let actionDone = false;
    let reqCount = 0;
    const nowTime = +new Date();

    await page.setRequestInterception(true);

    page.on('request', (request) => {
      const url = request.url();
      const method = request.method();
      const resourceType = request.resourceType();

      // Skip data URIs
      if (/^data:/i.test(url) && isTest === false) {
        request.continue();
        return;
      }

      if (/\/favicon\.ico$/i.test(url) && isTest === false) {
        request.continue();
        return;
      }

      const seconds = (+new Date() - nowTime) / 1000;
      const shortURL = truncate(url, 70);
      const otherResources = /^(manifest|other)$/i.test(resourceType);
      // Abort requests that exceeds the timeout
      // Also abort if more than 100 requests
      if (
        isTest === false &&
        (seconds > pageRequestTimeout || reqCount > 100 || actionDone)
      ) {
        console.log(`❌⏳ ${method} ${shortURL}`);
        request.abort();
      } else if (isTest === false && otherResources) {
        console.log(`❌ ${method} ${shortURL}`);
        request.abort();
      } else if (isTest === false) {
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
      const headers = resp.headers();
      const status = resp.status();
      const renderTestUrl = new URL(renderUrl);
      const responseUrl = new URL(resp.url());

      if (/\/favicon\.ico$/i.test(responseUrl)) {
        return;
      }

      if (
        resp &&
        status !== undefined &&
        (status === 201 ||
          status === 301 ||
          status === 302 ||
          status === 303 ||
          status === 307 ||
          status === 308) &&
        headers &&
        headers.url() !== undefined &&
        responseUrl.hostname === renderTestUrl.hostname
      ) {
        responseReject(
          new Error(
            `Possible infinite redirects detected: ${responseUrl} ${resp.status()}`
          )
        );
        console.log(
          `Possible infinite redirects detected: ${responseUrl} ${status}`
        );
      } else if (resp && status !== undefined && status !== 200) {
        responseReject(new Error('Status not 200.'));
      }
    });

    await page.setViewport({
      width: windowViewportWidth,
      height: windowViewportHeight,
    });

    await Promise.race([
      responsePromise,
      page.goto(renderUrl, {
        waitUntil: 'networkidle2',
        timeout: pageRequestTimeout,
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
      timeoutAndReject(pdfGenerationTimeout, 'PDF timed out'),
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
}

module.exports.pdf = pdf;
