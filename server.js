const path = require('node:path');
const express = require('express');

const trackCatalog = require('./server/trackCatalog');
const serverConfig = require('./server/config.json');
const { pageRegistry, getPageByRoute } = require('./server/pageRegistry');
const { buildPagePayload, renderFullDocument } = require('./server/pageRenderer');

const DEFAULT_HOST = serverConfig.host || '127.0.0.1';
const DEFAULT_ARTIST = 'saintjustus';
const SHELL_HEADER = 'saintjustus-shell';

trackCatalog.initialize();

function normaliseTitle(filename) {
    return filename
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function prepareTrack(entry, index) {
    if (!entry) {
        return null;
    }

    const source = typeof entry === 'string' ? { url: entry } : entry;
    const { filename, url } = source;

    if (!url) {
        return null;
    }

    const id = source.id || `stj ${String(index + 1).padStart(3, '0')}`;
    const artist = source.artist || DEFAULT_ARTIST;
    let parsedUrl;
    try {
        parsedUrl = new URL(url);
    } catch (error) {
        return null;
    }

    const resolvedFilename = filename || decodeURIComponent(parsedUrl.pathname.split('/').pop() || '');
    const title = source.title || normaliseTitle(resolvedFilename);
    const cdnSrc = parsedUrl.toString();
    const src = parsedUrl.toString();

    return {
        id,
        title,
        artist,
        cdnSrc,
        src,
        filename: resolvedFilename
    };
}

function buildTrackResponse() {
    return trackCatalog
        .getTrackCatalog()
        .map((entry, index) => prepareTrack(entry, index))
        .filter((track) => Boolean(track));
}

const app = express();

app.use(express.static(path.join(__dirname)));

app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

app.get('/api/tracks', (req, res) => {
    res.json({ tracks: buildTrackResponse() });
});

function isShellRequest(req) {
    return req.get('X-Requested-With') === SHELL_HEADER || req.query.fragment === '1';
}

function sendPage(pageConfig, req, res, next) {
    const payload = buildPagePayload(pageConfig.id);
    if (!payload) {
        return next();
    }

    if (isShellRequest(req)) {
        return res.json({ page: payload });
    }

    return res.send(renderFullDocument(payload));
}

function routePattern(route) {
    const cleanRoute = route === '/' ? '/' : route.replace(/\/+$/, '');
    if (cleanRoute === '/') {
        return ['/'];
    }
    return [cleanRoute, `${cleanRoute}/`];
}

pageRegistry.forEach((pageConfig) => {
    const patterns = routePattern(pageConfig.route);
    app.get(patterns, (req, res, next) => sendPage(pageConfig, req, res, next));
});

app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'not found' });
    }

    const page = getPageByRoute(req.path);
    if (page) {
        return sendPage(page, req, res, next);
    }

    if (req.accepts('html')) {
        return res.status(404).send('<!DOCTYPE html><html><head><title>not found — saintjustus.xyz</title></head><body><p>page not found.</p></body></html>');
    }

    return next();
});

app.use((error, req, res, next) => {
    // eslint-disable-next-line no-console
    console.error('server error', error);
    res.status(500).json({ error: 'internal server error' });
});

module.exports = app;

if (require.main === module) {
    const port = process.env.PORT || 3000;
    const host = process.env.HOST || DEFAULT_HOST;
    app.listen(port, host, () => {
        // eslint-disable-next-line no-console
        console.log(`saintjustus backend listening on http://${host}:${port}`);
    });
}
