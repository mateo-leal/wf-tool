// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: 'https://96d68988e9c777b85d268bdd02a02eef@o4511262408900608.ingest.us.sentry.io/4511262410801152',

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  release: 'web@' + process.env.version,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
})

// Use metrics in both server and client code
Sentry.metrics.count('user_action', 1)
Sentry.metrics.distribution('api_response_time', 150)
