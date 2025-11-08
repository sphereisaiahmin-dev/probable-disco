const serverConfig = (() => {
    try {
        // eslint-disable-next-line import/no-dynamic-require, global-require
        return require('./config.json');
    } catch (error) {
        return {};
    }
})();

const DEFAULT_CDN_BASE_URL = 'https://stjaudio.b-cdn.net';
const AUDIO_EXTENSION_PATTERN = /\.(mp3|wav|flac|ogg|aac|m4a|opus|webm)$/i;

const DEFAULT_TRACK_URLS = [
    'https://stjaudio.b-cdn.net/50yards_BEAT%20%40THX4CMN%20(T%2BL).mp3',
    'https://stjaudio.b-cdn.net/8mile%20138bpm_BEAT%20%40thx4cmn%20(L%2BT).mp3',
    'https://stjaudio.b-cdn.net/swv4cmn%2063bpm_BEAT%20%40thx4cmn%20(L%2BTV).mp3',
    'https://stjaudio.b-cdn.net/thecombo_BEAT%20104bpm%20(U%2BL).mp3',
    'https://stjaudio.b-cdn.net/toasty%20155bpm_BEAT%20%40thx4cmn%20(L%2BT%2BU).mp3',
    'https://stjaudio.b-cdn.net/uthought%2092bpm_BEAT%20%40thx4cmn%20(L%2BU).mp3'
];

let trackCache = [];

function resolveConfiguredTrackUrls() {
    if (Array.isArray(serverConfig.cdnTrackUrls) && serverConfig.cdnTrackUrls.length > 0) {
        return serverConfig.cdnTrackUrls;
    }

    return DEFAULT_TRACK_URLS;
}

function normaliseTrackUrl(entry) {
    if (!entry) {
        return null;
    }

    const candidate = typeof entry === 'string' ? { url: entry } : { ...entry };
    if (typeof candidate.url !== 'string' || !candidate.url.trim()) {
        return null;
    }

    let parsedUrl;
    try {
        parsedUrl = new URL(candidate.url);
    } catch (error) {
        return null;
    }

    const normalisedUrl = parsedUrl.toString();
    const pathname = parsedUrl.pathname.replace(/^\/+/u, '');
    const filename = decodeURIComponent(pathname.split('/').pop() || '');

    if (!filename || !AUDIO_EXTENSION_PATTERN.test(filename)) {
        return null;
    }

    return {
        id: candidate.id,
        title: candidate.title,
        artist: candidate.artist,
        url: normalisedUrl,
        path: pathname,
        filename
    };
}

function refresh() {
    const sourceUrls = resolveConfiguredTrackUrls();
    trackCache = sourceUrls
        .map(normaliseTrackUrl)
        .filter(Boolean)
        .sort((a, b) => a.filename.localeCompare(b.filename, 'en'));

    if (!trackCache.length) {
        // eslint-disable-next-line no-console
        console.warn('track catalog: no CDN tracks configured after refresh');
    }

    return trackCache.map((track) => ({ ...track }));
}

function initialize() {
    refresh();
    return getTrackCatalog();
}

function getTrackCatalog() {
    return trackCache.map((track) => ({ ...track }));
}

function getAudioBaseUrl() {
    if (trackCache.length > 0) {
        try {
            return new URL(trackCache[0].url).origin;
        } catch (error) {
            return DEFAULT_CDN_BASE_URL;
        }
    }

    return DEFAULT_CDN_BASE_URL;
}

module.exports = {
    initialize,
    refresh,
    getTrackCatalog,
    getAudioBaseUrl
};
