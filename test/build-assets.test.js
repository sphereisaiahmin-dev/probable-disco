const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { buildPublicAssets, publicDir } = require('../build-assets');

test('build script creates the Vercel public asset tree', () => {
    const result = buildPublicAssets();

    assert.equal(result.publicDir, publicDir);

    const expectedPaths = [
        path.join(publicDir, 'css', 'site.css'),
        path.join(publicDir, 'js', 'patch.js'),
        path.join(publicDir, 'lightmode', 'js', 'ops.js'),
        path.join(publicDir, 'assets', 'lib_images_dot.png'),
        path.join(publicDir, 'screenshot.png')
    ];

    expectedPaths.forEach((expectedPath) => {
        assert.ok(fs.existsSync(expectedPath), `expected generated asset: ${expectedPath}`);
    });
});
