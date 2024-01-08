const { Router } = require('express');
const retry = require('async-retry');
const { puppeteerPdf } = require('./pdf.js');
const { baksoParamsSchema } = require('./schemas');
const authenticateToken = require('./auth');

const Ajv = require('ajv');
const ajv = new Ajv();

const router = new Router();

router.get('/healthcheck', (req, res) => {
  res.send('hello');
});

router.post('/download/pdf', authenticateToken, async (req, res) => {
  const validate = ajv.compile(baksoParamsSchema);
  const valid = validate(req.body.pdfParams);
  if (!valid) {
    res.status(400).send(validate.errors);
    return;
  }

  try {
    const file = await retry(
      async (bail, count) => {
        console.log(`tried ${count} times`);
        return await puppeteerPdf(req.body.pdfParams);
      },
      {
        retries: 3,
      }
    );

    res.send(file);
  } catch (e) {
    throw new Error({
      status: 500,
      message: {
        exception: e,
        message: 'pdf generation error',
      },
    });
  }
});

module.exports = router;
