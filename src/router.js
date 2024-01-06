const { Router } = require('express');
const retry = require('async-retry');
// const crypto = require('crypto');
const pdf = require('./pdf.js');
const { baksoParamsSchema } = require('./schemas');

const Ajv = require('ajv');
const ajv = new Ajv(); // options can be passed, e.g. {allErrors: true}

const router = new Router();

// const KEY = process.env.BAKSO_SECRET_KEY || 'hello';

router.get('/healthcheck', (req, res) => {
  res.send('hello');
});

router.post('/download/pdf', async (req, res) => {
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
        return await pdf(req.body.pdfParams);
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
