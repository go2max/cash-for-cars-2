import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(import.meta.dirname, '..');
const pages = [
  'index.html',
  'get-offer.html',
  'how-it-works.html',
  'faq.html',
  'contact.html',
  'privacy.html',
  'terms.html',
  'accessibility.html',
  'calculator.html',
  '404.html'
];
const errors = [];

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function assert(condition, message) {
  if (!condition) errors.push(message);
}

for (const page of pages) {
  const html = read(page);
  assert(/^<!doctype html>/i.test(html), `${page}: missing doctype`);
  assert(/<meta name="viewport"/.test(html), `${page}: missing viewport`);
  assert(/<meta name="description"/.test(html), `${page}: missing description`);
  assert(/<link rel="canonical"/.test(html), `${page}: missing canonical`);
  assert(/css\/site\.css/.test(html), `${page}: missing shared CSS`);
  assert(/js\/analytics\.js/.test(html), `${page}: missing analytics controller`);
  assert(/js\/site\.js/.test(html), `${page}: missing site controller`);
  assert(/id="analytics-consent"/.test(html), `${page}: missing analytics consent UI`);
  assert(/href="privacy\.html"/.test(html), `${page}: missing privacy link`);
  assert(/href="accessibility\.html"/.test(html), `${page}: missing accessibility link`);

  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  assert(duplicateIds.length === 0, `${page}: duplicate IDs ${[...new Set(duplicateIds)].join(', ')}`);

  const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi)];
  for (const [, attrs] of inlineScripts) {
    assert(/type="application\/ld\+json"/.test(attrs), `${page}: executable inline script violates CSP`);
  }

  const idsSet = new Set(ids);
  for (const match of html.matchAll(/href="#([^"]+)"/g)) {
    assert(idsSet.has(match[1]), `${page}: broken anchor #${match[1]}`);
  }

  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const target = match[1].split('#')[0].split('?')[0];
    if (!target || /^(?:https?:|mailto:|tel:|#)/.test(target)) continue;
    if (target.endsWith('.html') || target.endsWith('.css') || target.endsWith('.js') || /\.(?:jpg|png|svg|xml|txt)$/.test(target)) {
      assert(fs.existsSync(path.join(root, target)), `${page}: missing local asset ${target}`);
    }
  }
}

const offer = read('get-offer.html');
assert((offer.match(/<form\b/g) || []).length === 1, 'get-offer.html: expected one form');
assert(/action="\/api\/contact"/.test(offer), 'get-offer.html: form action changed');
assert(/method="POST"/.test(offer), 'get-offer.html: form method changed');
for (const field of ['name', 'email', 'phone', 'paperwork', 'keys', 'zipcode', 'vehicle_type', 'notes', 'source']) {
  assert(new RegExp(`name="${field}"`).test(offer), `get-offer.html: missing field ${field}`);
}
for (const page of pages.filter(page => page !== 'get-offer.html')) {
  assert(!/<form\b/.test(read(page)), `${page}: duplicate public form`);
}

const analytics = read('js/analytics.js');
assert(analytics.includes('G-7D8R0SJ1WY'), 'analytics.js: measurement ID missing');
for (const pii of ['email:', 'phone:', 'name:', 'zipcode:', 'notes:']) {
  assert(!analytics.includes(pii), `analytics.js: possible PII parameter ${pii}`);
}
assert(analytics.includes("analytics_storage: 'granted'"), 'analytics.js: consent initialization missing');
assert(analytics.includes("analytics_storage: 'denied'"), 'analytics.js: consent revocation missing');
assert(read('js/form.js').includes("'generate_lead'"), 'form.js: generate_lead event missing');

const php = read('php/mail.php');
assert(php.includes('FILTER_VALIDATE_EMAIL'), 'mail.php: email validation missing');
assert(php.includes('rate_limit('), 'mail.php: rate limiting missing');
assert(php.includes('HTTP_SEC_FETCH_SITE'), 'mail.php: fetch metadata protection missing');
assert(php.includes('CONTENT_LENGTH'), 'mail.php: request size control missing');
assert(!php.includes('htmlspecialchars($_POST'), 'mail.php: legacy weak sanitization remains');

const server = read('server/server.js');
assert(!server.includes("app.get('/api/contacts'"), 'server.js: public contacts endpoint remains');
assert(!server.includes("require('cors')"), 'server.js: unrestricted CORS dependency remains');
assert(!server.includes("express.static(path.join(__dirname, '..'))"), 'server.js: broad repository static hosting remains');
assert(server.includes("dotfiles: 'deny'"), 'server.js: dotfile denial missing');
assert(server.includes('contactRateLimit'), 'server.js: rate limiting missing');
assert(server.includes('contentSecurityPolicy'), 'server.js: CSP missing');

const css = read('css/site.css').replace(/\/\*[\s\S]*?\*\//g, '');
let braceDepth = 0;
let minimumDepth = 0;
for (const character of css) {
  if (character === '{') braceDepth += 1;
  if (character === '}') braceDepth -= 1;
  minimumDepth = Math.min(minimumDepth, braceDepth);
}
assert(braceDepth === 0 && minimumDepth === 0, 'site.css: unbalanced braces');

const index = read('index.html');
const schemaMatch = index.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
assert(Boolean(schemaMatch), 'index.html: JSON-LD missing');
if (schemaMatch) {
  try {
    JSON.parse(schemaMatch[1]);
    const hash = crypto.createHash('sha256').update(schemaMatch[1]).digest('base64');
    assert(read('server/server.js').includes(hash), 'server.js: JSON-LD CSP hash is stale');
    assert(read('.htaccess').includes(hash), '.htaccess: JSON-LD CSP hash is stale');
  } catch (error) {
    errors.push(`index.html: invalid JSON-LD: ${error.message}`);
  }
}

const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/,
  /\bAIza[0-9A-Za-z_-]{35}\b/,
  /\bsk-[A-Za-z0-9]{20,}\b/
];
for (const file of [...pages, 'js/analytics.js', 'js/site.js', 'js/form.js', 'js/faq.js', 'php/mail.php', 'server/server.js', 'server/.env.example']) {
  const content = read(file);
  for (const pattern of secretPatterns) {
    assert(!pattern.test(content), `${file}: possible committed secret`);
  }
}

if (errors.length) {
  console.error('Release verification failed:');
  errors.forEach(error => console.error('- ' + error));
  process.exit(1);
}

console.log(`Release verification passed: ${pages.length} pages, one form, analytics consent, security controls, links, assets, JSON-LD, CSS, and secret patterns.`);
