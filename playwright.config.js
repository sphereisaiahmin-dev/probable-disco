const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
    testDir: "./e2e/mobile",
    timeout: 30000,
    expect: {
        timeout: 10000
    },
    fullyParallel: false,
    workers: 1,
    reporter: "line",
    use: {
        baseURL: "http://127.0.0.1:4173",
        browserName: "chromium",
        hasTouch: true,
        isMobile: true,
        viewport: { width: 390, height: 844 },
        reducedMotion: "reduce",
        trace: "retain-on-failure"
    },
    webServer: {
        command: "node server.js",
        url: "http://127.0.0.1:4173/work",
        reuseExistingServer: true,
        timeout: 30000,
        env: {
            HOST: "0.0.0.0",
            PORT: "4173"
        }
    }
});
