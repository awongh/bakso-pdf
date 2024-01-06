require('dotenv').config();
const express = require('express');
require('express-async-errors');
const serverRoutes = require('./router');

const app = express();

let Sentry;
const sentryDSN = process.env.BAKSO_SENTRY_DSN || null;

if (sentryDSN) {
  Sentry = require('@sentry/node');
  const tracesSampleRate = process.env.BAKSO_SENTRY_TRACERATE || 1.0;

  Sentry.init({
    dsn: sentryDSN,
    tracesSampleRate,
  });

  app.use(Sentry.Handlers.requestHandler());
}

app.use(express.json());
app.use(serverRoutes);

if (sentryDSN) {
  app.use(Sentry.Handlers.errorHandler());
}

app.use(function onError(error, request, response, next) {
  response.header('Content-Type', 'application/json');
  const status = error.status || 400;
  response.status(status).send(error.message);
  // res.end(res.sentry + "\n");
});

const PORT = process.env.PORT || '5003';
app.listen(PORT, () => console.log('Server started!'));
