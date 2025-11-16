const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../server');
const packageJson = require('../package.json');

const assetVersion = process.env.ASSET_VERSION || process.env.GIT_COMMIT || packageJson.version || 'dev';

function versionedAsset(pathname) {
    const normalised = pathname.startsWith('/') ? pathname : `/${pathname}`;
    return `${normalised}?v=${assetVersion}`;
}

test('serves the shared layout for static routes', async () => {
    const response = await request(app).get('/work').expect(200).expect('Content-Type', /html/);
    assert.match(response.text, /data-page-root/);
    assert.ok(response.text.includes(versionedAsset('/css/site.css')));
    assert.ok(response.text.includes('class="art-page art-page--work"'));
    assert.ok(response.text.includes('data-window-layer="work"'));
});

test('returns fragment payloads for shell requests', async () => {
    const response = await request(app)
        .get('/music')
        .set('X-Requested-With', 'saintjustus-shell')
        .expect(200)
        .expect('Content-Type', /json/);

    assert.ok(response.body.page);
    assert.equal(response.body.page.id, 'music');
    assert.match(response.body.page.content, /data-page-fragment/);
    assert.deepEqual(response.body.page.modules, [versionedAsset('/js/art-windows.js')]);
});

test('art route exposes per-page modules', async () => {
    const response = await request(app)
        .get('/art')
        .set('X-Requested-With', 'saintjustus-shell')
        .expect(200)
        .expect('Content-Type', /json/);

    assert.ok(Array.isArray(response.body.page.modules));
    assert.equal(response.body.page.modules.length, 1);
    assert.equal(response.body.page.modules[0], versionedAsset('/js/art-windows.js'));
});
