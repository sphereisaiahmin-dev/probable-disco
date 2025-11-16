const fs = require('node:fs');
const path = require('node:path');

const packageJson = require('../package.json');
const { getPageContent } = require('./pageRegistry');

function resolveLayoutTemplatePath() {
    const candidatePaths = [
        path.join(__dirname, 'views', 'layout.html'),
        path.join(__dirname, 'server', 'views', 'layout.html'),
        path.join(__dirname, '..', 'server', 'views', 'layout.html'),
        path.join(process.cwd(), 'server', 'views', 'layout.html')
    ];

    return candidatePaths.find((candidatePath) => fs.existsSync(candidatePath));
}

const layoutTemplatePath = resolveLayoutTemplatePath();

if (!layoutTemplatePath) {
    throw new Error('Unable to locate layout template file');
}

const layoutTemplate = fs.readFileSync(layoutTemplatePath, 'utf8');
const assetVersion = process.env.ASSET_VERSION || process.env.GIT_COMMIT || packageJson.version || 'dev';

function buildAssetUrl(assetPath) {
    if (!assetPath) {
        return '';
    }

    if (/^https?:\/\//.test(assetPath)) {
        return assetPath;
    }

    const normalised = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
    return `${normalised}?v=${assetVersion}`;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeScriptPayload(value) {
    return value.replace(/<\//g, '<\\/');
}

function applyTemplate(template, data) {
    let rendered = template;

    rendered = rendered.replace(/{{{\s*(\w+)\s*}}}/g, (match, key) => {
        const rawKey = `raw:${key}`;
        if (rawKey in data) {
            return data[rawKey];
        }
        if (key in data) {
            return data[key];
        }
        return '';
    });

    rendered = rendered.replace(/{{\s*([\w:-]+)\s*}}/g, (match, key) => {
        if (key in data) {
            return data[key];
        }
        return '';
    });

    return rendered;
}

function buildBootstrapScript(payload) {
    const json = JSON.stringify(payload);
    const escaped = escapeScriptPayload(json);
    return `<script type="application/json" data-page-bootstrap>${escaped}</script>`;
}

function buildPageScripts(modules) {
    if (!Array.isArray(modules) || modules.length === 0) {
        return '';
    }

    return modules
        .map((modulePath) => `<script type="module" src="${modulePath}"></script>`)
        .join('\n    ');
}

function buildPagePayload(pageId) {
    const page = getPageContent(pageId);
    if (!page) {
        return null;
    }

    const modules = (page.modules || []).map(buildAssetUrl);

    return {
        id: page.id,
        route: page.route,
        title: page.title,
        description: page.description,
        content: page.content,
        modules
    };
}

function renderFullDocument(pagePayload) {
    if (!pagePayload) {
        return '';
    }

    const bootstrapScript = buildBootstrapScript(pagePayload);
    const pageScripts = buildPageScripts(pagePayload.modules);

    return applyTemplate(layoutTemplate, {
        title: escapeHtml(pagePayload.title),
        description: escapeHtml(pagePayload.description),
        pageId: escapeHtml(pagePayload.id),
        route: escapeHtml(pagePayload.route),
        cssSite: buildAssetUrl('/css/site.css'),
        jsAudioPlayer: buildAssetUrl('/js/audio-player.js'),
        jsPatch: buildAssetUrl('/js/patch.js'),
        lightOps: buildAssetUrl('/lightmode/js/ops.js'),
        lightCopy: buildAssetUrl('/lightmode/js/cgl_copytexture.js'),
        jsAppShell: buildAssetUrl('/js/app-shell.js'),
        jsThemeToggle: buildAssetUrl('/js/theme-toggle.js'),
        jsBackgroundScenes: buildAssetUrl('/js/background-scenes.js'),
        metaImage: buildAssetUrl('/screenshot.png'),
        'raw:content': pagePayload.content,
        'raw:pageBootstrap': bootstrapScript,
        'raw:pageScripts': pageScripts
    });
}

module.exports = {
    buildAssetUrl,
    buildPagePayload,
    renderFullDocument
};
