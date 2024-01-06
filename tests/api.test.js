require('dotenv').config();
const testPrivateKey =
  'rSM7yFSOHCz8btXXWOfW3WFA0k5Uk0X6iqPQ/eNBJlnm2cYOHwdhPgA4q3WTpjTF+UIpTpi+rlRxIy67w/+h4yA0jz8q0B7Da94EdXPZJPkWgV7rumclzdDXURr4X3Hutbg8l1jrjEvh5kPNqXrXnYaYr1vaF9GYN20UiDLVgOcYJuW3B6QMxxN2EQNKrizVT97jrLIYOWuXSpTY4H3y8aQxG7orTyCmTvMXOANdQRjgp2ZInpztR/oWIhZ4VPmDcvx+bA88YoOLSL2b8CO2ezG9jCFmLeDbJpnMvzgTfkPrOvHESX62s1o5sjBXjQMH+d2VdzHsaasKTu7qeGvPxg==';

process.env.BAKSO_SECRET_KEY = testPrivateKey;

const express = require('express');
require('express-async-errors');
const serverRoutes = require('../src/router');
const generateToken = require('../src/token');
const request = require('supertest');

// comment from 2019
// https://github.com/mozilla/pdf.js/issues/10317#issuecomment-523430529
// the last version of pdfjs formatted for commonjs
// this package.json installs v2.11 for commonjs compatibility
const PDFJS = require('pdfjs-dist');

const app = express();
app.use(express.json());
app.use(serverRoutes);

/* ========================================
 * ========================================
 *
 * start tests
 *
 * ========================================
 * ========================================
 */
describe('testing-healthcheck', () => {
  it('GET /healthcheck - success', async () => {
    const { text } = await request(app).get('/healthcheck');
    expect(text).toEqual('hello');
  });
});

describe('testing-pdf-generation', () => {
  it('POST /download/pdf - success', async () => {
    const pdfInputObj = {
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

    const token = generateToken(process.env.BAKSO_SECRET_KEY);

    const result = await request(app)
      .post('/download/pdf')
      .send(pdfInputObj)
      // .set('Authorization', 'Bearer ' + token)
      .set('Authorization', token)
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

    const token = generateToken(process.env.BAKSO_SECRET_KEY);

    const result = await request(app)
      .post('/download/pdf')
      .send(inputs)
      .set('Authorization', token)
      .set('Accept', 'application/json');

    expect(result.status).toEqual(400);
  });

  it('POST /download/pdf - 401 Unauthorized', async () => {
    const inputs = {
      foo: 'blah',
    };

    const result = await request(app)
      .post('/download/pdf')
      .send(inputs)
      .set('Accept', 'application/json');

    expect(result.status).toEqual(401);
  });

  it('POST /download/pdf - 403 Forbidden', async () => {
    const inputs = {
      foo: 'blah',
    };

    const result = await request(app)
      .post('/download/pdf')
      .send(inputs)
      .set('Authorization', 'FAKE TOKEN')
      .set('Accept', 'application/json');

    expect(result.status).toEqual(403);
  });
});
