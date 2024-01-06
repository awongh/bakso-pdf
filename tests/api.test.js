const express = require('express');
const serverRoutes = require('../src/router');
const request = require('supertest');

// comment from 2019
// https://github.com/mozilla/pdf.js/issues/10317#issuecomment-523430529
// the last version of pdfjs formatted for commonjs
// this package.json installs v2.11 for commonjs compatibility
const PDFJS = require('pdfjs-dist');

const app = express();
app.use(express.json());
app.use(serverRoutes);
describe('testing-healthcheck', () => {
  it('GET /healthcheck - success', async () => {
    const { text } = await request(app).get('/healthcheck');
    expect(text).toEqual('hello');
  });
});

describe('testing-pdf-generation', () => {
  it('POST /download/pdf - success', async () => {
    const inputs = {
      key: 'blah',
      pdfParams: {
        name: 'myfile',
        renderUrl: 'https://example.com',
        pageOptions: {
          width: 50,
          height: 50,
        },
        pdfOptions: {
          width: '8.5in',
          height: '11in',
          printBackground: true,
        },
      },
    };

    const result = await request(app)
      .post('/download/pdf')
      .send(inputs)
      .set('Accept', 'application/json');

    const uint8Array = new Uint8Array(result.body);
    // Load the PDF document using PDFJS.getDocument
    try {
      const pdfDoc = await PDFJS.getDocument(uint8Array).promise;
      expect(pdfDoc._pdfInfo.numPages).toEqual(1);
    } catch (e) {
      console.error('Error loading PDF:', e);
      throw e;
    }
  });

  it('POST /download/pdf - 400 bad params', async () => {
    const inputs = {
      foo: 'blah',
    };

    const result = await request(app)
      .post('/download/pdf')
      .send(inputs)
      .set('Accept', 'application/json');

    expect(result.status).toEqual(400);
  });
});
