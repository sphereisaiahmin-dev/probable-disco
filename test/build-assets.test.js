const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { buildPublicAssets, publicDir } = require('../build-assets');

test('build script creates the Vercel public asset tree', () => {
    const testOutputDir = path.join(publicDir, '..', 'public-test-build');
    const result = buildPublicAssets(testOutputDir);

    assert.equal(result.publicDir, testOutputDir);

    const expectedPaths = [
        path.join(testOutputDir, 'css', 'site.css'),
        path.join(testOutputDir, 'js', 'patch.js'),
        path.join(testOutputDir, 'lightmode', 'js', 'ops.js'),
        path.join(testOutputDir, 'assets', 'lib_images_dot.png'),
        path.join(testOutputDir, 'screenshot.png')
    ];

    expectedPaths.forEach((expectedPath) => {
        assert.ok(fs.existsSync(expectedPath), `expected generated asset: ${expectedPath}`);
    });

    fs.rmSync(testOutputDir, { recursive: true, force: true });
});
