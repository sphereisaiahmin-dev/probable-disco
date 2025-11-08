const fs = require('node:fs');
const path = require('node:path');

const serverConfig = (() => {
    try {
        // eslint-disable-next-line import/no-dynamic-require, global-require
        return require('./config.json');
    } catch (error) {
        return {};
    }
})();

const DEFAULT_CDN_BASE_URL = 'https://stjaudio.b-cdn.net/audio';
const CDN_AUDIO_BASE_URL = String(
    process.env.CDN_AUDIO_BASE_URL || serverConfig.cdnAudioBaseUrl || DEFAULT_CDN_BASE_URL
).replace(/\/+$/, '');

const TRACK_MANIFEST_PATH = process.env.TRACK_MANIFEST_PATH || path.join(__dirname, 'tracks.json');
const LOCAL_AUDIO_DIRECTORY = process.env.LOCAL_AUDIO_DIRECTORY || path.join(__dirname, '..', 'audio');
const AUDIO_EXTENSION_PATTERN = /\.(mp3|wav|flac|ogg|aac|m4a|opus|webm)$/i;

let trackCache = [];

function normaliseFilename(filename) {
    if (typeof filename !== 'string') {
        return '';
    }

    const replaced = filename.replace(/\\+/g, '/').trim();
    if (!replaced) {
        return '';
    }

    const normalised = path.posix.normalize(replaced);
    if (!normalised || normalised === '.' || normalised === '..') {
        return '';
    }

    if (normalised.startsWith('../')) {
        return '';
    }

    return normalised.replace(/^\.\//, '');
}

function isAudioFile(filename) {
    if (!filename) {
        return false;
    }

    const baseName = path.posix.basename(filename);
    return AUDIO_EXTENSION_PATTERN.test(baseName);
}

function normaliseEntry(entry) {
    if (!entry) {
        return null;
    }

    if (typeof entry === 'string') {
        const filename = normaliseFilename(entry);
        return isAudioFile(filename) ? { filename } : null;
    }

    if (typeof entry === 'object') {
        const candidate = { ...entry };
        if (typeof candidate.filename !== 'string') {
            return null;
        }
        const filename = normaliseFilename(candidate.filename);
        if (!isAudioFile(filename)) {
            return null;
        }
        candidate.filename = filename;
        return candidate;
    }

    return null;
}

function readManifest(manifestPath) {
    try {
        if (!fs.existsSync(manifestPath)) {
            return [];
        }

        const raw = fs.readFileSync(manifestPath, 'utf8');
        if (!raw.trim()) {
            return [];
        }

        const parsed = JSON.parse(raw);
        const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed.tracks) ? parsed.tracks : [];
        return list
            .map(normaliseEntry)
            .filter(Boolean)
            .sort((a, b) => a.filename.localeCompare(b.filename, 'en'));
    } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('track catalog: failed to read track manifest', error);
        return [];
    }
}

function scanLocalDirectory(directory, relativeRoot = '') {
    try {
        const entries = fs.readdirSync(directory, { withFileTypes: true });

        const files = [];
        entries.forEach((entry) => {
            const relativePath = relativeRoot ? `${relativeRoot}/${entry.name}` : entry.name;

            if (entry.isDirectory()) {
                files.push(...scanLocalDirectory(path.join(directory, entry.name), relativePath));
                return;
            }

            if (!entry.isFile()) {
                return;
            }

            const normalised = normaliseEntry(relativePath);
            if (normalised) {
                files.push(normalised);
            }
        });

        return files.sort((a, b) => a.filename.localeCompare(b.filename, 'en'));
    } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('track catalog: failed to scan local audio directory', error);
        return [];
    }
}

function refresh() {
    const manifestTracks = readManifest(TRACK_MANIFEST_PATH);
    if (manifestTracks.length) {
        trackCache = manifestTracks;
        return trackCache;
    }

    const localTracks = scanLocalDirectory(LOCAL_AUDIO_DIRECTORY);
    trackCache = localTracks;
    if (!localTracks.length) {
        // eslint-disable-next-line no-console
        console.warn('track catalog: no tracks available after refresh');
    }
    return trackCache;
}

function initialize() {
    refresh();
    return trackCache;
}

function getTrackCatalog() {
    return trackCache.map((track) => ({ ...track }));
}

function getAudioBaseUrl() {
    return CDN_AUDIO_BASE_URL;
}

module.exports = {
    initialize,
    refresh,
    getTrackCatalog,
    getAudioBaseUrl
};
