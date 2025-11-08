const path = require('node:path');
const https = require('node:https');
const express = require('express');

const trackCatalog = require('./server/trackCatalog');
const serverConfig = require('./server/config.json');

const DEFAULT_HOST = serverConfig.host || '127.0.0.1';

const CDN_BASE_URL = 'https://stjaudio.b-cdn.net/audio';
const CDN_PROXY_BASE_PATH = '/media';
const DEFAULT_ARTIST = 'saintjustus';
const CDN_TOKEN = process.env.CDN_TOKEN || serverConfig.cdnToken || null;

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

function buildCdnUrl(filename) {
    return `${CDN_BASE_URL}/${encodeCdnPath(filename)}`;
}

function buildProxyUrl(filename) {
    return `${CDN_PROXY_BASE_PATH}/${encodeCdnPath(filename)}`;
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
    const cdnSrc = buildCdnUrl(filename);
    const src = buildProxyUrl(filename);

    return {
        id,
        title,
        artist,
        src,
        cdnSrc,
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

app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

function selectForwardHeaders(request) {
    const forwardList = [
        'range',
        'if-none-match',
        'if-modified-since',
        'user-agent',
        'accept',
        'accept-encoding'
    ];

    return forwardList.reduce((headers, header) => {
        const value = request.headers[header];
        if (value) {
            headers[header] = value;
        }
        return headers;
    }, {});
}

function proxyAudioAsset(req, res, assetPath) {
    if (!assetPath || assetPath.includes('..')) {
        res.status(400).json({ error: 'invalid audio asset path' });
        return;
    }

    const targetUrl = new URL(`${CDN_BASE_URL}/${assetPath}`);
    const outboundHeaders = selectForwardHeaders(req);
    outboundHeaders.host = targetUrl.host;

    if (CDN_TOKEN) {
        outboundHeaders.token = CDN_TOKEN;
    }

    const proxyRequest = https.request(
        {
            protocol: targetUrl.protocol,
            hostname: targetUrl.hostname,
            port: targetUrl.port || 443,
            method: req.method,
            path: `${targetUrl.pathname}${targetUrl.search}`,
            headers: outboundHeaders
        },
        (proxyResponse) => {
            const { statusCode = 502, headers } = proxyResponse;
            res.status(statusCode);

            Object.entries(headers).forEach(([key, value]) => {
                if (value === undefined) {
                    return;
                }

                if (key.toLowerCase() === 'transfer-encoding') {
                    return;
                }

                res.setHeader(key, value);
            });

            res.setHeader('access-control-allow-origin', '*');
            res.setHeader('access-control-expose-headers', 'Accept-Ranges, Content-Length, Content-Range');

            if (req.method === 'HEAD') {
                res.end();
                return;
            }

            proxyResponse.pipe(res);
        }
    );

    proxyRequest.on('error', (error) => {
        // eslint-disable-next-line no-console
        console.error('audio proxy error', error);
        if (!res.headersSent) {
            res.status(502).json({ error: 'failed to retrieve audio asset' });
        } else {
            res.end();
        }
    });

    req.on('aborted', () => {
        proxyRequest.destroy();
    });

    if (req.readable && req.method !== 'HEAD') {
        req.pipe(proxyRequest);
    } else {
        proxyRequest.end();
    }
}

const proxyRoutePattern = new RegExp(`^${CDN_PROXY_BASE_PATH.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/(.+)`);

app.get(proxyRoutePattern, (req, res) => {
    proxyAudioAsset(req, res, req.params[0]);
});

app.head(proxyRoutePattern, (req, res) => {
    proxyAudioAsset(req, res, req.params[0]);
});

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
