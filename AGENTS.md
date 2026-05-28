# saintjustus.xyz build notes

## Project intent
- This repository hosts the saintjustus.xyz portfolio. The aesthetic is intentionally minimalist: dark backgrounds, white Share Tech Mono typography, and generous negative space layered on top of the interactive Cables canvas (`js/patch.js`).
- Every public-facing page must preserve the background canvas experience and keep copy lowercase unless a proper noun requires otherwise.

## Implementation guidelines
- Reuse the shared stylesheet in `css/site.css` when adding pages or components. Extend it with CSS variables rather than hard-coding new colours or fonts.
- Keep layout containers transparent or translucent to allow the canvas to remain visible. Prefer flex/grid utilities over introducing large UI frameworks.
- Navigation should remain lightweight. If you add interactive elements, ensure they respect the pointer-event pattern used on the landing page so the canvas can still receive input where appropriate.
- JavaScript additions should live in new modules; avoid modifying `js/patch.js` unless you are updating the Cables export.
- Maintain semantic HTML and accessible labelling for sections, navigation, and interactive controls.

## Future roadmap considerations
- Architect upcoming features (radio player, animated windows, multiple WebGL scenes, contextual weather/time data) as modular components so they can be toggled per page.
- The audio player will need a dedicated UI layer that can dock without obscuring the canvas; plan for reusable controls.
- For future 3D or shader work, prefer encapsulating scenes in isolated modules that share lifecycle hooks with the existing canvas setup.

## Documentation and assets
- Update this file when expanding the design system or introducing new build steps.
- Store screenshots or media previews in dedicated directories (e.g., `media/`) to keep the root tidy.

## Vercel deployment notes
- Production traffic is served directly by the Express app in `server.js`, with Vercel using that file as the application entrypoint.
- Vercel does not serve assets from `express.static()` paths outside `public/**`, so every browser-facing asset must be generated into `public/` before deploy.
- `npm run build` (implemented in `build-assets.js`) recreates `public/` and copies the required runtime assets:
  - `css/**` -> `public/css/**`
  - `js/**` -> `public/js/**`
  - `lightmode/**` -> `public/lightmode/**`
  - `moth/assets/**` -> `public/assets/**`
  - `lightmode/screenshot.png` -> `public/screenshot.png`
- Keep browser asset URLs rooted at `/css`, `/js`, `/lightmode`, `/assets`, and `/screenshot.png` so local development and Vercel match.
- When testing locally, run `npm run build` before starting the server so the generated `public/` directory matches the deployed shape.
- Background Cables patches now pause when the tab is hidden and only spin up the light-mode patch when that theme is active. Keep any future background scene work compatible with that lifecycle so we avoid wasting cycles on offscreen rendering.

## Playwright simulation note
- When running Playwright or any browser-container based interaction tests, temporarily expose the dev server on `0.0.0.0` (e.g. `HOST=0.0.0.0 PORT=4173 node server.js`) so the external automation context can reach it.
- Remember to restore the host/IP to the default loopback binding once you are done to avoid accidental exposure.

## Modular art window scenes
- All art scenes live in `js/art/scenes/` and must export a factory (e.g. `export function createMyScene()`) that returns an object with `mount({ canvas, container })`, `resize(width, height)`, and `unmount()` so `js/art/art-windows.js` can manage lifecycle events.
- Register new scene factories in `js/art/scene-registry.js` and point any floating window entry at that `sceneId` via `js/art/windows-config.js`.
- Whether you are building raw GLSL, Three.js, or another WebGL pipeline, keep rendering isolated to the provided canvas element, react to `resize` calls, and tear down event listeners/timers in `unmount()`.
- If a scene needs assets or compiled shaders, load them inside `mount()` and resolve the promise only after the scene is interactive so the window shows errors gracefully when something fails.
- Do not rely on global singletons from other scenes; every scene should encapsulate its own renderer so multiple windows can cycle through different modules without reloading the page.
