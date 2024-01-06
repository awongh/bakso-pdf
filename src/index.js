require('dotenv').config();
const express = require('express');
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');
const serverRoutes = require('./router');

const sentryDSN = process.env.BAKSO_SENTRY_DSN || null;

if (sentryDSN) {
  Sentry.init({
    dsn: sentryDSN,
    tracesSampleRate: 1.0,
  });
}

// Serve on PORT on Heroku and on localhost:5000 locally
const PORT = process.env.PORT || '5003';
const KEY = process.env.BAKSO_SECRET_KEY || 'hello';

const app = express();
app.use(express.json());

app.use(serverRoutes);
app.listen(PORT, () => console.log('Server started!'));
