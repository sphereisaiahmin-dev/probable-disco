const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const request = require('supertest');

const FIXTURE_AUDIO_DIR = path.join(__dirname, 'fixtures', 'audio-library');
async function withFixtureCatalog(run) {
    const originalEnv = process.env.LOCAL_AUDIO_DIRECTORY;
    const catalogPath = require.resolve('../server/trackCatalog');
    const serverPath = require.resolve('../server');

    delete require.cache[catalogPath];
    delete require.cache[serverPath];

    process.env.LOCAL_AUDIO_DIRECTORY = FIXTURE_AUDIO_DIR;

    const trackCatalog = require('../server/trackCatalog');
    try {
        await run({ trackCatalog });
    } finally {
        if (originalEnv === undefined) {
            delete process.env.LOCAL_AUDIO_DIRECTORY;
        } else {
            process.env.LOCAL_AUDIO_DIRECTORY = originalEnv;
        }

        delete require.cache[catalogPath];
        delete require.cache[serverPath];
        const restoredCatalog = require('../server/trackCatalog');
        restoredCatalog.initialize();
    }
}

test('track catalog indexes nested audio directories and preserves relative paths', async () => {
    await withFixtureCatalog(async ({ trackCatalog }) => {
        const tracks = trackCatalog.refresh();
        assert.equal(tracks.length, 3);

        const filenames = tracks.map((track) => track.filename).sort();
        assert.deepEqual(filenames, [
            '21questions 149bpm_BEAT @thx4cmn (L+T+J).mp3',
            'mixes/galactic drift.mp3',
            'singles/sunrise-routine.wav'
        ]);

        const app = require('../server');
        const response = await request(app).get('/api/tracks');
        assert.equal(response.status, 200);
        assert.ok(Array.isArray(response.body.tracks));
        const apiTracks = response.body.tracks;
        assert.equal(apiTracks.length, 3);

        const nestedEntry = apiTracks.find((track) => track.filename === 'mixes/galactic drift.mp3');
        assert.ok(nestedEntry, 'expected API response to include nested directory track');
        assert.ok(nestedEntry.src.includes('/mixes/galactic%20drift.mp3'));
        assert.ok(nestedEntry.cdnSrc.includes('/mixes/galactic%20drift.mp3'));
    });
});
