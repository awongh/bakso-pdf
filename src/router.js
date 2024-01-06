const { Router } = require('express');
const retry = require('async-retry');
const crypto = require('crypto');
const pdf = require('./pdf.js');
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');
const { baksoParamsSchema } = require('./schemas');

const Ajv = require('ajv');
const ajv = new Ajv(); // options can be passed, e.g. {allErrors: true}

const sentryDSN = process.env.BAKSO_SENTRY_DSN || null;

const router = new Router();

if (sentryDSN) {
  Sentry.init({
    dsn: sentryDSN,
    tracesSampleRate: 1.0,
  });
}

const PORT = process.env.PORT || '5003';
const KEY = process.env.BAKSO_SECRET_KEY || 'hello';

router.get('/healthcheck', (req, res) => {
  res.send('hello');
});

router.post('/download/pdf', async (req, res) => {
  const validate = ajv.compile(baksoParamsSchema);
  const valid = validate(req.body.pdfParams);
  if (!valid) {
    console.error(validate.errors);
    res.sendStatus(400);
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
    if (sentryDSN !== null) {
      Sentry.captureException(e);
    }
    console.error(e);
    res.sendStatus(500);
  }
});

module.exports = router;
