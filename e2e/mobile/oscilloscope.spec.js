const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

test('moth is live on load, has no parameter panel, exports png, and restores webgl', async ({ page }) => {
    test.setTimeout(60000);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
    });

    await page.goto('/art');
    const windowElement = page.locator('[data-window-id="art:moth"]');
    await expect(windowElement).toBeVisible();
    await expect(windowElement.locator('canvas')).toBeVisible();
    await expect(windowElement.locator('.oscilloscope-status')).not.toContainText('failed');
    await expect(windowElement.locator('.art-window__scene-play-button')).toHaveCount(0);
    await expect(windowElement.locator('.art-window__footer-button--pause')).toHaveCount(0);
    await expect(windowElement.getByLabel('response', { exact: true })).toHaveCount(0);
    await expect(windowElement.getByLabel('waveform depth', { exact: true })).toHaveCount(0);
    await expect(windowElement.getByLabel('rotation', { exact: true })).toHaveCount(0);
    await expect(windowElement.getByLabel('trail', { exact: true })).toHaveCount(0);
    await expect(windowElement.getByLabel('glow', { exact: true })).toHaveCount(0);
    await expect(windowElement.locator('.oscilloscope-controls')).toHaveCount(0);
    await expect(windowElement.locator('.art-window__title')).toContainText('moth');
    await expect(windowElement.locator('.art-window__tag')).toHaveText(['audioreactive', 'wireframe']);

    const analysisShape = await page.evaluate(() => {
        const analysis = window.__saintjustusAudioController?.analysis;
        return {
            ready: window.__saintjustusAudioController?.ready,
            fftSize: analysis?.fftSize,
            frequencyBinCount: analysis?.frequencyBinCount,
            hasRead: typeof analysis?.read === 'function',
            hasSubscribe: typeof analysis?.subscribe === 'function'
        };
    });
    expect(analysisShape).toEqual({
        ready: true,
        fftSize: 4096,
        frequencyBinCount: 2048,
        hasRead: true,
        hasSubscribe: true
    });

    const player = page.getByRole('region', { name: 'saintjustus audio player' });
    await player.getByRole('button', { name: 'play' }).click();
    await expect.poll(
        () => page.evaluate(() => window.__saintjustusAudioController.analysis.available),
        { timeout: 10000 }
    ).toBe(true);
    await expect.poll(
        () => page.evaluate(() => {
            const analysis = window.__saintjustusAudioController.analysis;
            const snapshot = analysis.read({
                waveform: new Float32Array(analysis.fftSize),
                spectrum: new Float32Array(analysis.frequencyBinCount),
                lowBand: new Float32Array(analysis.fftSize),
                highBand: new Float32Array(analysis.fftSize)
            });
            return Math.max(snapshot.lowEnvelope, snapshot.highEnvelope - 0.2);
        }),
        { timeout: 10000 }
    ).toBeGreaterThan(0.001);

    const downloadPromise = page.waitForEvent('download');
    await windowElement.locator('.moth-export').click({ force: true });
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('saint-audio.png');
    const validationDirectory = path.join(process.cwd(), 'media', 'validation');
    fs.mkdirSync(validationDirectory, { recursive: true });
    await download.saveAs(path.join(validationDirectory, 'saint-audio.png'));

    const contextResult = await page.evaluate(() => {
        const canvas = document.querySelector('[data-window-id="art:moth"] canvas');
        const context = canvas?.getContext('webgl2');
        const extension = context?.getExtension('WEBGL_lose_context');
        if (!extension) return false;
        extension.loseContext();
        setTimeout(() => extension.restoreContext(), 100);
        return true;
    });
    if (contextResult) {
        await expect(windowElement.locator('.oscilloscope-status')).toContainText(/restored|medium|low|high/, {
            timeout: 5000
        });
    }
    expect(errors).toEqual([]);
});

test('moth analysis uses the native web audio fallback when Tone is unavailable', async ({ page }) => {
    test.setTimeout(60000);
    await page.route('https://cdnjs.cloudflare.com/ajax/libs/tone/**', (route) => route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: ''
    }));

    await page.goto('/art');
    await expect.poll(() => page.evaluate(() => typeof window.Tone)).toBe('undefined');
    const windowElement = page.locator('[data-window-id="art:moth"]');
    const player = page.getByRole('region', { name: 'saintjustus audio player' });
    await player.getByRole('button', { name: 'play' }).click();

    await expect.poll(
        () => page.evaluate(() => window.__saintjustusAudioController.analysis.available),
        { timeout: 10000 }
    ).toBe(true);
    await expect.poll(
        () => page.evaluate(() => {
            const analysis = window.__saintjustusAudioController.analysis;
            const waveform = new Float32Array(analysis.fftSize);
            const snapshot = analysis.read({ waveform });
            let peak = 0;
            for (const sample of waveform) peak = Math.max(peak, Math.abs(sample));
            return Math.max(peak, snapshot.lowEnvelope, snapshot.highEnvelope - 0.2);
        }),
        { timeout: 10000 }
    ).toBeGreaterThan(0.001);
});
