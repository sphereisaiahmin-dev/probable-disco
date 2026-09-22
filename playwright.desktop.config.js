const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './e2e/desktop',
    timeout: 60000,
    expect: { timeout: 10000 },
    fullyParallel: false,
    workers: 1,
    reporter: 'line',
    use: {
        baseURL: 'http://127.0.0.1:4173',
        browserName: 'chromium',
        viewport: { width: 1280, height: 900 },
        reducedMotion: 'no-preference'
    },
    webServer: {
        command: 'node server.js',
        url: 'http://127.0.0.1:4173/art',
        reuseExistingServer: true,
        timeout: 30000,
        env: { HOST: '0.0.0.0', PORT: '4173' }
    }
});
