# Release Checklist

## Completed

- [x] Responsive multi-page UX rebuild
- [x] Mobile navigation and persistent call-to-action controls
- [x] Canonical vehicle-offer form and `/api/contact` contract
- [x] Apache/PHP and Node/Express backend options
- [x] Input validation, rate limiting, origin checks, and private data isolation
- [x] CSP, HSTS, clickjacking, MIME-sniffing, referrer, and permissions headers
- [x] GA4 consent controls and privacy-safe conversion events
- [x] Privacy, terms, accessibility, sitemap, robots, and branded 404 pages
- [x] Automated release verification and static security checks
- [x] Production source published to `go2max/cash-for-cars-2`

## Deployment Gates

- [ ] Choose and configure exactly one backend runtime
- [ ] Generate and commit `server/package-lock.json` when deploying with Node
- [ ] Run the production dependency audit on the deployment host
- [ ] Verify PHP syntax and mail delivery when deploying with Apache/PHP
- [ ] Verify HTTPS headers and protected paths on the public domain
- [ ] Complete desktop and mobile browser smoke tests
- [ ] Confirm GA4 events in DebugView without personally identifiable information
- [ ] Submit one controlled lead and confirm a single delivery or database record

The source release is complete. Public launch is complete only after every deployment gate above passes. See `DEPLOYMENT.md` and `SECURITY_ANALYTICS_REPORT.md` for exact procedures.
