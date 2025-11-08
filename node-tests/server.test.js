const test = require('node:test');
const assert = require('node:assert/strict');
const { execFile } = require('node:child_process');
const request = require('supertest');

const app = require('../server');

const CDN_HOST = 'https://stjaudio.b-cdn.net/audio/';

async function fetchTracks() {
    const response = await request(app).get('/api/tracks');
    assert.equal(response.status, 200);
    assert.ok(response.body);
    const tracks = Array.isArray(response.body.tracks) ? response.body.tracks : [];
    return tracks;
}

async function curlHead(url) {
    return new Promise((resolve, reject) => {
        const args = ['-I', '--max-time', '10', url];
        execFile('curl', args, { timeout: 15000 }, (error, stdout, stderr) => {
            if (error) {
                const enriched = new Error(`curl head request failed: ${error.message}`);
                enriched.stdout = stdout;
                enriched.stderr = stderr;
                reject(enriched);
                return;
            }
            resolve(stdout);
        });
    });
}

test('GET /api/tracks returns CDN-backed metadata', async () => {
    const tracks = await fetchTracks();
    assert.ok(tracks.length > 0, 'expected at least one track');

    const first = tracks[0];
    assert.match(first.id, /^stj\s/);
    assert.equal(first.title, '21questions 149bpm BEAT @thx4cmn (L+T+J)');
    assert.equal(first.artist, 'saintjustus');
    assert.ok(first.src.startsWith(CDN_HOST));
});

test('CDN audio asset responds to HEAD requests', { timeout: 15000 }, async () => {
    const tracks = await fetchTracks();
    assert.ok(tracks.length > 0, 'expected at least one track to validate');

    const stdout = await curlHead(tracks[0].src);
    assert.match(stdout, /HTTP\/1\.1\s+20[0-9]/, 'expected a successful HTTP status');
});
