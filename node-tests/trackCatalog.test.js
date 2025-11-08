const test = require('node:test');
const assert = require('node:assert/strict');

const trackCatalog = require('../server/trackCatalog');

const EXPECTED_FILENAMES = [
    '50yards_BEAT @THX4CMN (T+L).mp3',
    '8mile 138bpm_BEAT @thx4cmn (L+T).mp3',
    'swv4cmn 63bpm_BEAT @thx4cmn (L+TV).mp3',
    'thecombo_BEAT 104bpm (U+L).mp3',
    'toasty 155bpm_BEAT @thx4cmn (L+T+U).mp3',
    'uthought 92bpm_BEAT @thx4cmn (L+U).mp3'
];

const CDN_ORIGIN = 'https://stjaudio.b-cdn.net';

test('track catalog exposes absolute CDN URLs with decoded filenames', () => {
    trackCatalog.initialize();
    const tracks = trackCatalog.getTrackCatalog();
    assert.equal(tracks.length, EXPECTED_FILENAMES.length);

    const filenames = tracks.map((track) => track.filename);
    assert.deepEqual(filenames, EXPECTED_FILENAMES);

    tracks.forEach((track) => {
        assert.ok(track.url.startsWith(`${CDN_ORIGIN}/`), 'expected CDN origin in URL');
        assert.ok(track.path, 'expected track to expose CDN path');
        assert.equal(
            decodeURIComponent(track.path.split('/').pop()),
            track.filename,
            'expected path to match decoded filename'
        );
    });
});

test('audio base URL resolves to CDN origin', () => {
    assert.equal(trackCatalog.getAudioBaseUrl(), CDN_ORIGIN);
});
