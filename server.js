const path = require('node:path');
const express = require('express');

const trackCatalog = require('./server/trackCatalog');
const serverConfig = require('./server/config.json');

const DEFAULT_HOST = serverConfig.host || '127.0.0.1';

const CDN_BASE_URL = 'https://stjaudio.b-cdn.net/audio';
const DEFAULT_ARTIST = 'saintjustus';

function normaliseTitle(filename) {
    return filename
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function encodeCdnPath(filename) {
    return filename
        .split('/')
        .map((segment) => encodeURIComponent(segment))
        .join('/');
}

function prepareTrack(entry, index) {
    if (!entry) {
        return null;
    }

    const source = typeof entry === 'string' ? { filename: entry } : entry;
    const { filename } = source;

    if (!filename) {
        return null;
    }

    const id = source.id || `stj ${String(index + 1).padStart(3, '0')}`;
    const artist = source.artist || DEFAULT_ARTIST;
    const title = source.title || normaliseTitle(filename);
    const src = `${CDN_BASE_URL}/${encodeCdnPath(filename)}`;

    return {
        id,
        title,
        artist,
        src,
        filename
    };
}

function buildTrackResponse() {
    return trackCatalog
        .map((entry, index) => prepareTrack(entry, index))
        .filter((track) => Boolean(track));
}

const app = express();

app.use(express.static(path.join(__dirname)));

app.get('/api/tracks', (req, res) => {
    res.json({ tracks: buildTrackResponse() });
});

app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'not found' });
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
