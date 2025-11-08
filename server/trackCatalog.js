const https = require('node:https');
const { URL } = require('node:url');
const path = require('node:path');
const fs = require('node:fs/promises');

const serverConfig = (() => {
    try {
        // eslint-disable-next-line import/no-dynamic-require, global-require
        return require('./config.json');
    } catch (error) {
        return {};
    }
})();

const CDN_AUDIO_BASE_URL = process.env.CDN_AUDIO_BASE_URL || 'https://stjaudio.b-cdn.net/audio';
const CDN_TOKEN = process.env.CDN_TOKEN || serverConfig.cdnToken || null;
const REFRESH_INTERVAL_MS = 5 * 24 * 60 * 60 * 1000; // 5 days
const AUDIO_EXTENSIONS = /\.(mp3|wav|flac|ogg|aac|m4a|opus|webm)$/i;
const LOCAL_AUDIO_DIRECTORY = path.join(__dirname, '..', 'audio');

let catalog = [];
let lastUpdated = 0;
let refreshTimer = null;
let refreshPromise = null;

function normaliseFilename(filename) {
    return filename.replace(/\\+/g, '/').replace(/^\//, '').trim();
}

function isAudioFile(filename) {
    return AUDIO_EXTENSIONS.test(filename);
}

function uniqueSorted(list) {
    return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b, 'en'));
}

function parseJsonListing(payload) {
    const filenames = [];

    const visit = (value) => {
        if (!value) {
            return;
        }

        if (Array.isArray(value)) {
            value.forEach(visit);
            return;
        }

        if (typeof value === 'string') {
            const normalised = normaliseFilename(value);
            const candidate = path.basename(normalised);
            if (isAudioFile(candidate)) {
                filenames.push(candidate);
            }
            return;
        }

        if (typeof value === 'object') {
            const candidateKeys = ['ObjectName', 'objectName', 'Key', 'key', 'Name', 'name', 'Filename', 'filename', 'Path', 'path'];
            candidateKeys.forEach((key) => {
                if (value[key]) {
                    visit(value[key]);
                }
            });
        }
    };

    visit(payload);

    return uniqueSorted(filenames);
}

function parseHtmlListing(payload) {
    const filenames = [];
    const anchorPattern = /<a[^>]+href\s*=\s*"([^"]+)"[^>]*>/gi;
    let match = anchorPattern.exec(payload);

    while (match) {
        const href = match[1];
        if (href) {
            const decoded = normaliseFilename(decodeURIComponent(href));
            const candidate = path.basename(decoded);
            if (!decoded.endsWith('/') && isAudioFile(candidate)) {
                filenames.push(candidate);
            }
        }
        match = anchorPattern.exec(payload);
    }

    return uniqueSorted(filenames);
}

function parseCatalogBody(body) {
    if (!body) {
        return [];
    }

    const trimmed = body.trim();
    if (!trimmed) {
        return [];
    }

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
            const parsed = JSON.parse(trimmed);
            const filenames = parseJsonListing(parsed);
            if (filenames.length) {
                return filenames;
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.warn('track catalog: failed to parse JSON directory listing', error);
        }
    }

    return parseHtmlListing(body);
}

function requestDirectoryListing() {
    const targetUrl = new URL(`${CDN_AUDIO_BASE_URL.replace(/\/?$/, '/')}`);

    return new Promise((resolve, reject) => {
        const request = https.request(
            {
                protocol: targetUrl.protocol,
                hostname: targetUrl.hostname,
                port: targetUrl.port || 443,
                method: 'GET',
                path: `${targetUrl.pathname}${targetUrl.search}` || '/',
                headers: {
                    accept: 'application/json, text/html;q=0.9, */*;q=0.8',
                    ...(CDN_TOKEN ? { token: CDN_TOKEN } : {})
                }
            },
            (response) => {
                const { statusCode = 500 } = response;
                if (statusCode < 200 || statusCode >= 300) {
                    response.resume();
                    reject(new Error(`unexpected status code ${statusCode}`));
                    return;
                }

                const chunks = [];
                response.on('data', (chunk) => chunks.push(chunk));
                response.on('end', () => {
                    resolve(Buffer.concat(chunks).toString('utf8'));
                });
            }
        );

        request.on('error', reject);
        request.end();
    });
}

async function readLocalAudioDirectory() {
    try {
        const entries = await fs.readdir(LOCAL_AUDIO_DIRECTORY, { withFileTypes: true });
        return uniqueSorted(
            entries
                .filter((entry) => entry.isFile() && isAudioFile(entry.name))
                .map((entry) => entry.name)
        );
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
        return [];
    }
}

async function loadCatalogFromSources() {
    try {
        const body = await requestDirectoryListing();
        const filenames = parseCatalogBody(body);
        if (filenames.length) {
            return filenames;
        }
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('track catalog: failed to load from CDN', error);
    }

    try {
        const fallback = await readLocalAudioDirectory();
        if (fallback.length) {
            return fallback;
        }
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('track catalog: failed to load from local audio directory', error);
    }

    return [];
}

function scheduleNextRefresh(delay = REFRESH_INTERVAL_MS) {
    if (refreshTimer) {
        clearTimeout(refreshTimer);
    }

    refreshTimer = setTimeout(() => {
        refreshCatalog().catch((error) => {
            // eslint-disable-next-line no-console
            console.error('track catalog: scheduled refresh failed', error);
        });
    }, delay);

    if (typeof refreshTimer.unref === 'function') {
        refreshTimer.unref();
    }
}

async function refreshCatalog() {
    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = (async () => {
        const filenames = await loadCatalogFromSources();
        if (filenames.length) {
            catalog = filenames;
            lastUpdated = Date.now();
        }
        scheduleNextRefresh();
        return catalog;
    })()
        .catch((error) => {
            scheduleNextRefresh();
            throw error;
        })
        .finally(() => {
            refreshPromise = null;
        });

    return refreshPromise;
}

function getTrackCatalog() {
    return catalog.slice();
}

function getLastUpdated() {
    return lastUpdated;
}

function initialize() {
    return refreshCatalog().catch((error) => {
        // eslint-disable-next-line no-console
        console.error('track catalog: initial refresh failed', error);
        return catalog;
    });
}

module.exports = {
    initialize,
    refreshCatalog,
    getTrackCatalog,
    getLastUpdated,
    getAudioBaseUrl: () => CDN_AUDIO_BASE_URL
};
