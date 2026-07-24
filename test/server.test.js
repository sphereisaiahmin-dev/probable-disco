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

test('home renders about dialog and external github control', async () => {
    const response = await request(app).get('/').expect(200).expect('Content-Type', /html/);

    assert.match(response.text, /data-about-open/);
    assert.match(response.text, /data-about-dialog/);
    assert.match(response.text, /site-header__group--left/);
    assert.match(response.text, /site-header__group--right/);
    assert.match(response.text, /href="https:\/\/github\.com\/saintjustus"/);
    assert.match(response.text, /target="_blank"/);
    assert.match(response.text, /rel="noopener noreferrer"/);
    assert.match(response.text, /aria-label="github profile for saintjustus"/);
    assert.match(response.text, /multidisciplinary artist and creative technologist/);
    assert.match(response.text, /Manager of Production Systems/);
    assert.match(response.text, /about-dialog__accent--red">technology<\/span>/);
    assert.match(response.text, /about-dialog__accent--green">design<\/span>/);
    assert.match(response.text, /about-dialog__accent--blue">media\.<\/span>/);
    assert.equal((response.text.match(/about-dialog__accent--gradient/g) || []).length, 2);
    assert.doesNotMatch(response.text, /multidisciplinary creative technologist whose practice spans/);
    assert.doesNotMatch(response.text, /\(\(|\)\)|\[technology\]|\{design\}|\(media\.\)/);
    assert.ok(response.text.includes(versionedAsset('/js/about-dialog.js')));

    const githubPosition = response.text.indexOf('aria-label="github profile for saintjustus"');
    const aboutPosition = response.text.indexOf('data-about-open');
    const brandPosition = response.text.indexOf('class="site-brand"');
    const themePosition = response.text.indexOf('data-theme-toggle');
    assert.ok(githubPosition < aboutPosition && aboutPosition < brandPosition && brandPosition < themePosition);
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
