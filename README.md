# NorCal Cash for Cars

Secure, responsive website and vehicle-offer flow for NorCal Cash for Cars in the Sacramento area. The project is built to support a fast local-service launch with clear customer pages, a single controlled contact API, deployment options for PHP or Node, and production-focused privacy/security documentation.

## Website Summary

Use this copy when referencing the project externally:

> NorCal Cash for Cars is a Sacramento-area lead-generation website for vehicle sellers. It includes a focused customer funnel, privacy-conscious contact handling, consent-aware analytics, deployment documentation, and release verification scripts for a production handoff.

## Readiness

Current launch status is tracked in [`READINESS.md`](READINESS.md). The repository has a source baseline, but it should not be treated as publicly launched until production deployment, contact routing, security headers, consent behavior, and legal/support pages are verified live.

## Included

- Focused multi-page customer experience
- One canonical `/api/contact` submission path
- Apache/PHP and Node/Express deployment support
- Strict validation, rate limiting, origin checks, CSP, HSTS, and private data isolation
- GA4 consent controls and privacy-safe lead conversion tracking
- Privacy, terms, accessibility, sitemap, robots, and branded 404 pages
- Automated source release verification

## Privacy And Security Posture

- Customer submissions should flow through the canonical `/api/contact` path only.
- Production deployments must configure secrets outside the repository.
- Origin checks, rate limits, CSP, HSTS, and private-data handling must be verified against the live domain.
- Analytics must remain consent-aware and privacy-safe.
- Lead handling must be verified before public traffic is sent to the site.

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

## Deployment Gate

Before public launch:

1. Configure production domain, hosting, environment variables, secrets, and mail/lead destination.
2. Verify `/api/contact` from the production origin.
3. Confirm privacy, terms, accessibility, robots, sitemap, branded 404, CSP, and HSTS on the live site.
4. Confirm GA4 consent state and conversion tracking behavior.
5. Record final status in `READINESS.md`.

See `RELEASE_CHECKLIST.md`, `DEPLOYMENT.md`, and `SECURITY_ANALYTICS_REPORT.md` before public release.
