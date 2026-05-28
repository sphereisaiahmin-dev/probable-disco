const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const app = require('../server');

test('vercel config routes traffic through the Express function entrypoint', () => {
    const vercelConfigPath = path.join(__dirname, '..', 'vercel.json');
    const apiEntrypointPath = path.join(__dirname, '..', 'api', 'index.js');

    assert.ok(fs.existsSync(apiEntrypointPath), 'expected api/index.js entrypoint for Vercel');

    const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    assert.equal(vercelConfig.buildCommand, 'npm run build');
    assert.deepEqual(vercelConfig.rewrites, [
        {
            source: '/api/:path*',
            destination: '/api'
        },
        {
            source: '/:path((?!css/|js/|lightmode/|assets/|screenshot\\.png|favicon\\.ico).*)',
            destination: '/api'
        }
    ]);

    const apiEntrypoint = require('../api');
    assert.equal(apiEntrypoint, app);
    assert.equal(apiEntrypoint.default, app);
});
