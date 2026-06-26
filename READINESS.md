# Readiness

Last updated: 2026-06-25

## Status

**SOURCE BASELINE READY / DEPLOYMENT AND CONTACT PATH PENDING**

NorCal Cash for Cars has a security-conscious website and vehicle-offer flow baseline, but public readiness depends on deployment, production contact configuration, and final compliance checks.

## Current evidence

- Multi-page customer experience and canonical `/api/contact` submission path are documented.
- Apache/PHP and Node/Express deployment support are documented.
- Strict validation, rate limiting, origin checks, CSP, HSTS, private data isolation, consent controls, and privacy-safe lead tracking are documented.
- Source verification commands are documented in `README.md`.
- Release support documents include `RELEASE_CHECKLIST.md`, `DEPLOYMENT.md`, and `SECURITY_ANALYTICS_REPORT.md`.

## Blocking launch gates

- Run `node scripts/verify-release.mjs`, `node --check server/server.js`, and `php -l php/mail.php` on the launch commit.
- For Node deployment, generate and commit `server/package-lock.json`, then run `npm run check` and `npm run audit:production` from `server/`.
- Configure production contact destination, secrets, origin allowlist, rate limits, and mail/lead handling.
- Verify `/api/contact` end-to-end from the production domain.
- Confirm privacy, terms, accessibility, sitemap, robots, branded 404, CSP, HSTS, and GA4 consent behavior on production.

## Ready when

Mark **READY** only after release verification passes, deployment environment is configured, the production contact path successfully submits and stores/routes leads as intended, and compliance/security pages and headers are verified live.