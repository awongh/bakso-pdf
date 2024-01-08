require('dotenv').config();
const nock = require('nock');
const puppeteer = require('puppeteer');
const useNock = require('nock-puppeteer');
const { pdf, puppeteerConfig } = require('../src/pdf');
const fs = require('fs/promises');

// comment from 2019
// https://github.com/mozilla/pdf.js/issues/10317#issuecomment-523430529
// the last version of pdfjs formatted for commonjs
// package.json installs v2.11 for commonjs compatibility
const PDFJS = require('pdfjs-dist');

describe('pdf gen tests', () => {
  it('GET /healthcheck - success', async () => {

    const browser = await puppeteer.launch(puppeteerConfig);
    const page = await browser.newPage();
    useNock(page, ['https://example.com']);

    const inputParams = {
      browser,
      page,
      isTest:true,
      renderUrl: 'https://example.com',
    };

    const exampleHtml = await fs.readFile(
      './tests/fixtures/example.com.html',
      'utf-8'
    );

    // await nock('https://example.com').get('/favicon.ico').reply(200, '');
    await nock('https://example.com').get('/').reply(200, exampleHtml);

    const pdfResult = await pdf(inputParams);
    console.log('done');
    await fs.writeFile('try99.pdf', pdfResult, 'utf-8');

    const uint8Array = new Uint8Array(pdfResult);
    // const uint8Array = await new Uint8Array(pdfResult);
    // Load the PDF document using PDFJS.getDocument
    try {
      const pdfDoc = await PDFJS.getDocument(uint8Array).promise;
      expect(pdfDoc._pdfInfo.numPages).toEqual(1);
    } catch (e) {
      console.error('Error loading PDF:', e);
      throw e;
    }
  });
});
