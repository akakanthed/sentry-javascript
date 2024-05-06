import type { Route } from '@playwright/test';
import { expect } from '@playwright/test';
import type { SessionContext } from '@sentry/types';

import { sentryTest } from '../../../utils/fixtures';
import { getFirstSentryEnvelopeRequest } from '../../../utils/helpers';

sentryTest('should start a new session on pageload.', async ({ getLocalTestUrl, page }) => {
  const url = await getLocalTestUrl({ testDir: __dirname });
  const session = await getFirstSentryEnvelopeRequest<SessionContext>(page, url);

  expect(session).toBeDefined();
  expect(session.init).toBe(true);
  expect(session.errors).toBe(0);
  expect(session.status).toBe('ok');
});

sentryTest('should start a new session with navigation.', async ({ getLocalTestUrl, page }) => {
  const url = await getLocalTestUrl({ testDir: __dirname });
  await page.route('**/foo', (route: Route) => route.fulfill({ path: `${__dirname}/dist/index.html` }));

  await page.route('https://dsn.ingest.sentry.io/**/*', route => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'test-id' }),
    });
  });

  const initSession = await getFirstSentryEnvelopeRequest<SessionContext>(page, url);

  await page.locator('#navigate').click();

  const newSession = await getFirstSentryEnvelopeRequest<SessionContext>(page, url);

  expect(newSession).toBeDefined();
  expect(newSession.init).toBe(true);
  expect(newSession.errors).toBe(0);
  expect(newSession.status).toBe('ok');
  expect(newSession.sid).toBeDefined();
  expect(initSession.sid).not.toBe(newSession.sid);
});
