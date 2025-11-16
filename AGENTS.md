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

## Netlify deployment notes
- Production traffic is served by the Netlify Functions wrapper in `netlify/functions/site.js`. It mounts the Express app from
  `server.js` through `serverless-http`, so any route or middleware changes must continue to export the app instance from
  `server.js` without side effects.
- `netlify.toml` orchestrates everything:
  - `npm run build` (implemented in `serverless-build.js`) prepares the static bundle that the serverless handler reads.
  - `publish = "."` keeps the repo root as the artifact so relative asset paths remain valid.
  - All requests (`/*` and `/api/*`) are proxied to `/.netlify/functions/site`, so avoid hardcoding absolute URLs—always use
    Express routes so the function can answer.
  - `functions.included_files` lists directories that must ship with each deploy (e.g., `css`, `js`, `server`). If you add new
    runtime assets, update this array or Netlify will omit them.
- Keep `express` listed in `external_node_modules`; the serverless bundle relies on Netlify injecting that dependency instead of
  bundling it, which keeps cold starts down.
- When testing locally, `npm run dev` mirrors Netlify’s proxy behaviour: it runs `server.js` with `HOST=0.0.0.0` and exposes the
  same `/api` rewrites defined in `netlify.toml`. Use this command before deploying to verify that middleware, static asset
  paths, and redirects behave identically to production.

## Playwright simulation note
- When running Playwright or any browser-container based interaction tests, temporarily expose the dev server on `0.0.0.0` (e.g. `HOST=0.0.0.0 PORT=4173 node server.js`) so the external automation context can reach it.
- Remember to restore the host/IP to the default loopback binding once you are done to avoid accidental exposure.

## Modular art window scenes
- All art scenes live in `js/art/scenes/` and must export a factory (e.g. `export function createMyScene()`) that returns an object with `mount({ canvas, container })`, `resize(width, height)`, and `unmount()` so `js/art/art-windows.js` can manage lifecycle events.
- Register new scene factories in `js/art/scene-registry.js` and point any floating window entry at that `sceneId` via `js/art/windows-config.js`.
- Whether you are building raw GLSL, Three.js, or another WebGL pipeline, keep rendering isolated to the provided canvas element, react to `resize` calls, and tear down event listeners/timers in `unmount()`.
- If a scene needs assets or compiled shaders, load them inside `mount()` and resolve the promise only after the scene is interactive so the window shows errors gracefully when something fails.
- Do not rely on global singletons from other scenes; every scene should encapsulate its own renderer so multiple windows can cycle through different modules without reloading the page.
