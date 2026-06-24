'use strict';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const Database = require('better-sqlite3');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';
const projectRoot = path.resolve(__dirname, '..');
const DB_PATH = path.resolve(process.env.DB_PATH || path.join(__dirname, 'data', 'contacts.db'));
const allowedOrigins = new Set([
    'https://norcalcashforcars.com',
    'https://www.norcalcashforcars.com'
]);

if (process.env.TRUST_PROXY) {
    app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);
}

app.disable('x-powered-by');

const scriptSources = [
    "'self'",
    'https://www.googletagmanager.com',
    "'sha256-aFprYjWCmbC0jPiYS8sUQtXZyDuHKBAv/xZjuVaAo/M='"
];

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            baseUri: ["'self'"],
            connectSrc: ["'self'", 'https://www.google-analytics.com', 'https://*.google-analytics.com'],
            fontSrc: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'none'"],
            imgSrc: ["'self'", 'data:', 'https://www.google-analytics.com'],
            objectSrc: ["'none'"],
            scriptSrc: scriptSources,
            styleSrc: ["'self'"],
            upgradeInsecureRequests: isProduction ? [] : null
        }
    },
    crossOriginEmbedderPolicy: false,
    hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
    next();
});
app.use(morgan(isProduction ? 'tiny' : 'dev'));
app.use(express.json({ limit: '50kb', strict: true }));
app.use(express.urlencoded({ extended: false, limit: '50kb', parameterLimit: 20 }));

const rateState = new Map();
function contactRateLimit(req, res, next) {
    const now = Date.now();
    const windowMs = 10 * 60 * 1000;
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const recent = (rateState.get(key) || []).filter(timestamp => timestamp > now - windowMs);

    if (recent.length >= 5) {
        res.setHeader('Retry-After', '600');
        return res.status(429).json({ error: 'Too many requests' });
    }

    recent.push(now);
    rateState.set(key, recent);
    if (rateState.size > 5000) {
        for (const [entryKey, timestamps] of rateState.entries()) {
            if (!timestamps.some(timestamp => timestamp > now - windowMs)) rateState.delete(entryKey);
        }
    }
    next();
}

function validOrigin(req) {
    const fetchSite = String(req.get('Sec-Fetch-Site') || '').toLowerCase();
    if (fetchSite && !['same-origin', 'same-site'].includes(fetchSite)) return false;

    const origin = req.get('Origin');
    if (!origin) return true;
    if (!isProduction && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
    return allowedOrigins.has(origin);
}

function text(value, maxLength) {
    return String(value ?? '').trim().replace(/[\u0000\r]/g, '').slice(0, maxLength);
}

function validateContact(body) {
    const record = {
        name: text(body.name, 100),
        email: text(body.email, 200),
        phone: text(body.phone, 30),
        paperwork: text(body.paperwork, 20),
        keys: text(body.keys, 20),
        zipcode: text(body.zipcode, 10),
        vehicle_type: text(body.vehicle_type, 30),
        notes: text(body.notes, 2000),
        source: 'website'
    };

    const digits = record.phone.replace(/\D/g, '');
    const allowedVehicles = new Set(['Car', 'Van', 'Truck', 'SUV', 'Motorcycle', 'Other']);
    const allowedAnswers = new Set(['yes', 'no', 'not sure']);

    if (record.name.length < 2 || /[\u0000-\u001f\u007f]/.test(record.name)) return null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email) || /[\r\n]/.test(record.email)) return null;
    if (!/^[0-9+().\-\s]{7,30}$/.test(record.phone) || digits.length < 7 || digits.length > 15) return null;
    if (!/^\d{5}(-\d{4})?$/.test(record.zipcode)) return null;
    if (!allowedAnswers.has(record.paperwork) || !allowedAnswers.has(record.keys)) return null;
    if (!allowedVehicles.has(record.vehicle_type)) return null;
    return record;
}

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true, mode: 0o700 });
const db = new Database(DB_PATH);
try {
    fs.chmodSync(DB_PATH, 0o600);
} catch (_) {
    if (isProduction) throw new Error('Unable to restrict database file permissions');
}
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(`
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  paperwork TEXT,
  keys TEXT,
  zipcode TEXT,
  vehicle_type TEXT,
  notes TEXT,
  source TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

const insertContact = db.prepare(`
INSERT INTO contacts (name, email, phone, paperwork, keys, zipcode, vehicle_type, notes, source)
VALUES (@name, @email, @phone, @paperwork, @keys, @zipcode, @vehicle_type, @notes, @source)
`);

app.get('/api/health', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ status: 'ok' });
});

app.post('/api/contact', contactRateLimit, (req, res) => {
    res.setHeader('Cache-Control', 'no-store');

    if (!validOrigin(req)) return res.status(403).json({ error: 'Invalid origin' });
    if (!req.is('application/json') && !req.is('application/x-www-form-urlencoded')) {
        return res.status(415).json({ error: 'Unsupported media type' });
    }
    if (text(req.body?.website, 200)) return res.status(400).json({ error: 'Invalid submission' });

    const startedAt = Number(req.body?._started_at || 0);
    const elapsed = Date.now() - startedAt;
    if (!Number.isFinite(startedAt) || startedAt <= 0 || elapsed < 1500 || elapsed > 86400000) {
        return res.status(400).json({ error: 'Invalid submission' });
    }

    const record = validateContact(req.body || {});
    if (!record) return res.status(400).json({ error: 'Invalid form data' });

    insertContact.run(record);
    return res.status(201).json({ message: 'Request received' });
});

const assetDirectories = ['css', 'js', 'images', 'img'];
for (const directory of assetDirectories) {
    app.use('/' + directory, express.static(path.join(projectRoot, directory), {
        dotfiles: 'deny',
        fallthrough: false,
        index: false,
        maxAge: isProduction ? '7d' : 0
    }));
}

const publicPages = [
    'index.html',
    'get-offer.html',
    'how-it-works.html',
    'faq.html',
    'contact.html',
    'privacy.html',
    'terms.html',
    'accessibility.html',
    'calculator.html',
    'robots.txt',
    'sitemap.xml'
];

app.get('/', (req, res) => res.sendFile(path.join(projectRoot, 'index.html')));
for (const page of publicPages) {
    app.get('/' + page, (req, res) => res.sendFile(path.join(projectRoot, page)));
}

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
app.use((req, res) => res.status(404).sendFile(path.join(projectRoot, '404.html')));
app.use((err, req, res, next) => {
    console.error('Request failed', { method: req.method, path: req.path, status: err.status || 500 });
    if (res.headersSent) return next(err);
    res.status(err.status || 500).json({ error: 'Request failed' });
});

const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

function shutdown() {
    server.close(() => {
        db.close();
        process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
