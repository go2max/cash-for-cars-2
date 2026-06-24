# NorCal Cash for Cars - Production Deployment

## Release source

Deploy the contents of this archive as one unit. Do not merge selected HTML files into an older CSS or JavaScript bundle.

Choose exactly one backend runtime:

- Apache/PHP: the form posts to `/api/contact`, which `.htaccess` rewrites to `php/mail.php`.
- Node/Express: the form posts to the same `/api/contact` path, which stores the validated lead in SQLite.

Do not run both backends for the same public domain.

## Apache/PHP requirements

- HTTPS enabled before public launch.
- Apache `mod_rewrite` and `mod_headers` enabled.
- PHP mail delivery configured for `noreply@norcalcashforcars.com`.
- The root `.htaccess` and `server/.htaccess` uploaded, including hidden files.
- Confirm requests to `/server/server.js`, `/server/data/contacts.db`, and `/.env` return 403 or 404.
- Confirm `POST /api/contact` returns `success` for one controlled test submission.
- Confirm rate limiting returns 429 after repeated test requests.

## Node/Express requirements

- Node.js 20 or later.
- Install dependencies from `server/package.json` and commit the generated `package-lock.json`.
- Set `NODE_ENV=production`.
- Set `DB_PATH` to a private, writable location outside the deployed web root.
- Set `TRUST_PROXY=1` only when exactly one trusted reverse proxy is present.
- Terminate HTTPS at the trusted proxy and forward the original protocol correctly.
- Back up the SQLite database only to encrypted, access-controlled storage.
- Confirm the database and WAL files are mode 0600 and their directory is mode 0700.
- The Node backend stores leads but does not send email; configure operational lead review accordingly.

## Analytics verification

1. Open a private browser session.
2. Confirm no Google Analytics request occurs before choosing **Allow analytics**.
3. Allow analytics and confirm `page_view` in GA4 DebugView.
4. Confirm `phone_click`, `email_click`, and `offer_start` events.
5. Submit one controlled test lead and confirm one `generate_lead` event.
6. Verify event parameters contain no name, email, phone, ZIP code, vehicle notes, or URL query strings containing PII.
7. Mark `generate_lead` as a key event in GA4 if desired.
8. Open **Analytics choices**, decline, and confirm future analytics requests stop.

## Required commands

```bash
node scripts/verify-release.mjs
node --check js/analytics.js
node --check js/site.js
node --check js/form.js
node --check js/faq.js
php -l php/mail.php

cd server
npm install
npm run check
npm run audit:production
```

Do not launch if `npm audit --omit=dev` reports unresolved high or critical vulnerabilities.

## Final smoke test

- Homepage, offer, process, FAQ, contact, privacy, terms, accessibility, and 404 pages.
- Mobile widths: 360, 390, and 412 pixels.
- Desktop widths: 1280 and 1440 pixels.
- Keyboard navigation, focus visibility, menu, consent controls, FAQ filters, and form errors.
- Telephone and email links.
- Security headers through the public HTTPS URL.
- One form submission only; no duplicate email or database record.

