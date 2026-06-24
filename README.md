# NorCal Cash for Cars

Secure, responsive website and vehicle-offer flow for NorCal Cash for Cars in the Sacramento area.

## Included

- Focused multi-page customer experience
- One canonical `/api/contact` submission path
- Apache/PHP and Node/Express deployment support
- Strict validation, rate limiting, origin checks, CSP, HSTS, and private data isolation
- GA4 consent controls and privacy-safe lead conversion tracking
- Privacy, terms, accessibility, sitemap, robots, and branded 404 pages
- Automated source release verification

## Verify

```bash
node scripts/verify-release.mjs
node --check server/server.js
php -l php/mail.php
```

For Node deployments, generate and commit `server/package-lock.json`, then run:

```bash
cd server
npm install
npm run check
npm run audit:production
```

See `RELEASE_CHECKLIST.md`, `DEPLOYMENT.md`, and `SECURITY_ANALYTICS_REPORT.md` before public release.
