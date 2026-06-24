# Security and Analytics Release Report

Date: June 24, 2026

## Source audit result

Status: PASS with environment-dependent deployment gates remaining.

## Critical findings closed in source

- Removed the unauthenticated `GET /api/contacts` PII endpoint.
- Removed repository-wide Express static hosting.
- Allowlisted public pages and asset directories only.
- Denied access to `server/`, environment files, databases, SQL, logs, and backups under Apache.
- Consolidated the browser to one `POST /api/contact` request.
- Added strict field validation, allowed-value checks, size limits, rate limits, origin/fetch-metadata checks, honeypot validation, and generic errors.
- Prevented email header injection through strict email validation and CR/LF rejection.
- Restricted database file and directory permissions in the Node runtime.
- Removed unrestricted CORS.

## Defense-in-depth controls added

- Content Security Policy without `unsafe-inline`.
- HSTS for HTTPS production responses.
- Frame denial, MIME sniffing protection, referrer policy, and permissions policy.
- CSP hash validation for the homepage JSON-LD.
- No executable inline JavaScript.
- No public administrative endpoint.
- No PII in application error responses.
- No form data included in analytics events.
- Automated checks for broken links, duplicate IDs, stale CSP hashes, inline scripts, secret patterns, form-contract drift, and security-regression patterns.

## Analytics coverage

Measurement ID: `G-7D8R0SJ1WY`

Implemented:

- Analytics code on every public page.
- Basic consent: the Google tag does not load until permission is granted.
- Persistent allow/decline preference.
- Analytics preference reopening and consent revocation.
- `page_view` through GA4 configuration.
- `phone_click`.
- `email_click`.
- `offer_start`.
- `generate_lead` only after a successful backend response.
- Advertising storage, advertising user data, personalization, and Google signals disabled.

## Privacy controls

- Dedicated privacy policy.
- Optional analytics disclosure.
- Explicit statement that form PII is not sent to Analytics.
- Contact path for access, correction, deletion, and applicable privacy requests.
- Terms and accessibility pages.
- Warning not to submit sensitive identity or payment data.

## Verification completed here

- Release verification script: PASS.
- JavaScript syntax checks: PASS.
- Node server syntax check: PASS.
- Internal link and asset validation: PASS.
- JSON-LD parse and CSP hash validation: PASS.
- CSS structural validation: PASS.
- Form contract validation: PASS.
- Static secret-pattern scan: PASS.
- Security regression pattern scan: PASS.

## Mandatory deployment gates not executable in this environment

- `npm install`, lockfile generation, and `npm audit`: registry access returned 403.
- PHP syntax/runtime/mail test: PHP runtime is not installed.
- Chromium responsive screenshots and browser console checks: browser download is blocked.
- GA4 DebugView/property confirmation: requires deployed-domain and GA4 property access.
- Live header/endpoint probe: the audit environment receives a proxy 403 for the domain.

These items must pass using the deployment host or CI before public release.

