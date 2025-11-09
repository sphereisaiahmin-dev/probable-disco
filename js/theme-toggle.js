const STORAGE_KEY = "saintjustus.theme";
const THEME_LIGHT = "light";
const THEME_DARK = "dark";

function readStoredTheme() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === THEME_LIGHT || stored === THEME_DARK) {
            return stored;
        }
        return null;
    } catch (error) {
        console.warn("theme toggle: failed to read stored theme", error);
        return null;
    }
}

function persistTheme(theme) {
    try {
        localStorage.setItem(STORAGE_KEY, theme);
    } catch (error) {
        console.warn("theme toggle: failed to persist theme", error);
    }
}

function resolveInitialTheme() {
    const stored = readStoredTheme();
    if (stored) {
        return stored;
    }
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
        return THEME_LIGHT;
    }
    return THEME_DARK;
}

function applyTheme(theme, toggle) {
    const isLight = theme === THEME_LIGHT;
    document.body.classList.toggle("theme-light", isLight);
    document.body.classList.toggle("theme-dark", !isLight);
    document.body.dataset.theme = theme;

    if (toggle) {
        toggle.setAttribute("aria-pressed", String(isLight));
        toggle.setAttribute("aria-label", isLight ? "switch to dark mode" : "switch to light mode");
        toggle.innerHTML = `<span aria-hidden="true">${isLight ? "☾" : "☀"}</span>`;
    }
}

function initThemeToggle() {
    const toggle = document.querySelector("[data-theme-toggle]");
    if (!toggle) {
        return;
    }

    let currentTheme = resolveInitialTheme();
    applyTheme(currentTheme, toggle);

    toggle.addEventListener("click", () => {
        currentTheme = currentTheme === THEME_LIGHT ? THEME_DARK : THEME_LIGHT;
        applyTheme(currentTheme, toggle);
        persistTheme(currentTheme);
    });

    if (window.matchMedia) {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
        const handleChange = (event) => {
            if (readStoredTheme()) {
                return;
            }
            currentTheme = event.matches ? THEME_LIGHT : THEME_DARK;
            applyTheme(currentTheme, toggle);
        };
        if (typeof mediaQuery.addEventListener === "function") {
            mediaQuery.addEventListener("change", handleChange);
        } else if (typeof mediaQuery.addListener === "function") {
            mediaQuery.addListener(handleChange);
        }
    }
}

initThemeToggle();
