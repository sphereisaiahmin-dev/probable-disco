// Kept outside test/ so Node's built-in test runner does not load Playwright specs.
const { test, expect } = require("@playwright/test");

const phoneViewports = [
    { width: 320, height: 568 },
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 800, height: 360 },
    { width: 844, height: 390 }
];

async function isolateExternalMedia(page) {
    await page.route("**/*", async (route) => {
        const url = new URL(route.request().url());
        if (url.hostname === "127.0.0.1" || url.hostname === "localhost") {
            await route.continue();
            return;
        }

        if (route.request().resourceType() === "document") {
            await route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>embed</title>" });
            return;
        }

        await route.abort("failed");
    });
}

async function waitForWindows(page) {
    await expect(page.locator(".art-window").first()).toHaveClass(/is-visible/);
}

async function dispatchTouchDrag(page, from, to) {
    const session = await page.context().newCDPSession(page);
    const point = (x, y) => [{ x, y, radiusX: 2, radiusY: 2, force: 1, id: 1 }];
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: point(from.x, from.y) });
    await page.waitForTimeout(16);
    const steps = 6;
    for (let index = 1; index <= steps; index += 1) {
        const progress = index / steps;
        await session.send("Input.dispatchTouchEvent", {
            type: "touchMove",
            touchPoints: point(
                from.x + (to.x - from.x) * progress,
                from.y + (to.y - from.y) * progress
            )
        });
        await page.waitForTimeout(16);
    }
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await session.detach();
}

test.beforeEach(async ({ page }) => {
    await isolateExternalMedia(page);
});

test("compact window pages stay inside portrait and landscape viewports", async ({ page }) => {
    test.setTimeout(120000);
    for (const viewport of phoneViewports) {
        await page.setViewportSize(viewport);
        for (const pathname of ["/work", "/art", "/music"]) {
            await page.goto(pathname);
            await waitForWindows(page);
            const layout = await page.evaluate(() => ({
                compact: document.documentElement.classList.contains("is-compact-window-layout"),
                overflow: document.documentElement.scrollWidth > window.innerWidth,
                windows: [...document.querySelectorAll(".art-window")].map((element) => {
                    const rect = element.getBoundingClientRect();
                    return { left: rect.left, right: rect.right, width: rect.width };
                })
            }));
            expect(layout.compact).toBe(true);
            expect(layout.overflow).toBe(false);
            for (const rect of layout.windows) {
                expect(rect.left).toBeGreaterThanOrEqual(-1);
                expect(rect.right).toBeLessThanOrEqual(viewport.width + 1);
                expect(rect.width).toBeLessThanOrEqual(viewport.width + 1);
            }

            await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
            const bottomClearance = await page.evaluate(() => {
                const windows = [...document.querySelectorAll(".art-window:not([hidden])")];
                const lastWindow = windows.at(-1)?.getBoundingClientRect();
                const audioPlayer = document.querySelector(".audio-player")?.getBoundingClientRect();
                return lastWindow && audioPlayer ? audioPlayer.top - lastWindow.bottom : null;
            });
            expect(bottomClearance).not.toBeNull();
            expect(bottomClearance).toBeGreaterThanOrEqual(-1);
        }
    }
});

test("rapid carousel presses are queued and failed media cannot freeze navigation", async ({ page }) => {
    await page.goto("/work");
    await waitForWindows(page);
    const windowElement = page.locator('[data-window-id="work:blare-db"]');
    const nextButton = windowElement.locator(".art-window__footer-button--media-next");

    for (let index = 0; index < 5; index += 1) {
        await nextButton.click();
    }

    await expect(windowElement).not.toHaveAttribute("aria-busy", "true", { timeout: 12000 });
    await expect(windowElement.locator(".art-window__media-title")).toHaveText("bodyrave outdoor");
    await expect(windowElement.locator(".art-window__media-status")).toContainText("6 of 8");
    await expect(windowElement.locator(".art-window__media--unavailable.is-media-active")).toHaveCount(1);
});

test("touch swipes navigate in phone landscape while vertical drags scroll", async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 360 });
    await page.goto("/work");
    await waitForWindows(page);

    const carousel = page.locator('[data-window-id="work:blare-db"]');
    const viewport = carousel.locator(".art-window__viewport");
    const rect = await viewport.boundingBox();
    expect(rect).not.toBeNull();
    await dispatchTouchDrag(
        page,
        { x: rect.x + rect.width * 0.75, y: rect.y + rect.height * 0.5 },
        { x: rect.x + rect.width * 0.2, y: rect.y + rect.height * 0.5 }
    );
    await expect(carousel.locator(".art-window__media-title")).toHaveText("bodyrave");

    const embedPreview = page.locator('[data-window-id="work:thx4cmn-com"] .art-window__embed-activator');
    await embedPreview.scrollIntoViewIfNeeded();
    const embedRect = await embedPreview.boundingBox();
    const beforeScroll = await page.evaluate(() => window.scrollY);
    await dispatchTouchDrag(
        page,
        { x: embedRect.x + embedRect.width / 2, y: embedRect.y + embedRect.height * 0.75 },
        { x: embedRect.x + embedRect.width / 2, y: embedRect.y + embedRect.height * 0.2 }
    );
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(beforeScroll);
    await expect(page.locator('[data-window-id="work:thx4cmn-com"]')).not.toHaveClass(/is-active/);
});

test("vertical touch drags can start on window chrome, controls, and the canvas", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/work");
    await waitForWindows(page);

    const selectors = [
        '[data-window-id="work:blare-db"] .art-window__header',
        '[data-window-id="work:blare-db"] .art-window__footer',
        '[data-window-id="work:blare-db"] .art-window__footer-button--media-next'
    ];

    for (const selector of selectors) {
        await page.evaluate(() => window.scrollTo(0, 0));
        const target = page.locator(selector);
        const rect = await target.boundingBox();
        await dispatchTouchDrag(
            page,
            { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
            { x: rect.x + rect.width / 2, y: Math.max(4, rect.y - 150) }
        );
        await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    }

    await page.evaluate(() => window.scrollTo(0, 0));
    await dispatchTouchDrag(page, { x: 4, y: 620 }, { x: 4, y: 260 });
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
});

test("collapsed embeds open before becoming interactive", async ({ page }) => {
    await page.goto("/music");
    await waitForWindows(page);
    const radio = page.locator('[data-window-id="music:lowlight-radio"]');
    const iframe = radio.locator(".art-window__iframe");
    const activator = radio.locator(".art-window__embed-activator");

    await expect(iframe).toHaveAttribute("aria-hidden", "true");
    await expect(activator).toBeVisible();
    await activator.click();
    await expect(radio).toHaveClass(/is-active/);
    await expect(radio.locator(".art-window__control--fullscreen")).toHaveAttribute("aria-pressed", "true");
    await expect(activator).toBeHidden();
    await expect(iframe).not.toHaveAttribute("aria-hidden", "true");
});

test("expanded landscape media rotates as a whole only in portrait", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/work");
    await waitForWindows(page);

    const marketing = page.locator('[data-window-id="work:design-marketing"]');
    const next = marketing.locator(".art-window__footer-button--media-next");
    await next.click();
    await expect(marketing.locator(".art-window__media-title")).toHaveText("bibistar");
    await marketing.locator(".art-window__control--fullscreen").click();
    await expect(marketing).toHaveClass(/is-active/);
    await expect(marketing).not.toHaveClass(/is-sideways/);

    await next.click();
    await expect(marketing.locator(".art-window__media-title")).toHaveText("whocares");
    await expect(marketing).toHaveClass(/is-sideways/);
    await expect
        .poll(async () => {
            const rect = await marketing.boundingBox();
            return rect ? { left: Math.round(rect.x), right: Math.round(rect.x + rect.width) } : null;
        })
        .toEqual({ left: 12, right: 378 });

    await page.setViewportSize({ width: 844, height: 390 });
    await expect(marketing).not.toHaveClass(/is-sideways/);
    const landscapeRect = await marketing.boundingBox();
    expect(landscapeRect.x).toBeGreaterThanOrEqual(0);
    expect(landscapeRect.x + landscapeRect.width).toBeLessThanOrEqual(845);
});

test("desktop to phone resize clears floating overflow and keeps touch controls reachable", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, hasTouch: true });
    const page = await context.newPage();
    await isolateExternalMedia(page);
    await page.goto("/work");
    await waitForWindows(page);
    await page.setViewportSize({ width: 390, height: 844 });

    await expect
        .poll(() =>
            page.locator("html").evaluate((element) =>
                element.classList.contains("is-compact-window-layout")
            )
        )
        .toBe(true);

    const result = await page.evaluate(() => ({
        compact: document.documentElement.classList.contains("is-compact-window-layout"),
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        controls: [...document.querySelectorAll(".art-window__control, .art-window__footer-button")]
            .filter((element) => !element.hidden)
            .map((element) => {
                const rect = element.getBoundingClientRect();
                return { width: rect.width, height: rect.height, right: rect.right };
            })
    }));

    expect(result.compact).toBe(true);
    expect(result.overflow).toBe(false);
    for (const control of result.controls) {
        expect(control.width).toBeGreaterThanOrEqual(43);
        expect(control.height).toBeGreaterThanOrEqual(43);
        expect(control.right).toBeLessThanOrEqual(391);
    }
    await context.close();
});

test("desktop mouse drag, resize, fullscreen keyboard navigation, and escape remain intact", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, hasTouch: false });
    const page = await context.newPage();
    await isolateExternalMedia(page);
    await page.goto("/work");
    await waitForWindows(page);

    const designLive = page.locator('[data-window-id="work:blare-db"]');
    expect(await page.locator("html").evaluate((element) => element.classList.contains("is-compact-window-layout"))).toBe(false);
    await designLive.dispatchEvent("pointerdown", { pointerType: "mouse", pointerId: 99, isPrimary: true });

    const originalPosition = await designLive.evaluate((element) => ({
        left: Number.parseFloat(element.style.left),
        top: Number.parseFloat(element.style.top)
    }));
    const header = await designLive.locator(".art-window__header").boundingBox();
    await page.mouse.move(header.x + 80, header.y + 20);
    await page.mouse.down();
    await page.mouse.move(header.x + 160, header.y + 80, { steps: 6 });
    await page.mouse.up();
    const dragged = await designLive.boundingBox();
    const draggedPosition = await designLive.evaluate((element) => ({
        left: Number.parseFloat(element.style.left),
        top: Number.parseFloat(element.style.top)
    }));
    expect(
        Math.abs(draggedPosition.left - originalPosition.left) +
            Math.abs(draggedPosition.top - originalPosition.top)
    ).toBeGreaterThan(10);

    const resize = await designLive.locator(".art-window__resize-handle").boundingBox();
    await page.mouse.move(resize.x + resize.width / 2, resize.y + resize.height / 2);
    await page.mouse.down();
    await page.mouse.move(resize.x + 35, resize.y + 25, { steps: 4 });
    await page.mouse.up();
    const resized = await designLive.boundingBox();
    expect(resized.width).toBeGreaterThan(dragged.width);

    await designLive.locator(".art-window__control--fullscreen").dispatchEvent("click");
    await expect(designLive).toHaveClass(/is-active/);
    await page.keyboard.press("ArrowRight");
    await expect(designLive.locator(".art-window__media-title")).toHaveText("bodyrave");
    await page.keyboard.press("Escape");
    await expect(designLive).not.toHaveClass(/is-active/);
    await context.close();
});
