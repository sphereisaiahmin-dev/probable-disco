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
