const path = require('node:path');
const fs = require('node:fs');

function resolveViewsDirectory() {
    const candidateDirectories = [
        path.join(__dirname, 'views'),
        path.join(__dirname, 'server', 'views'),
        path.join(__dirname, '..', 'server', 'views'),
        path.join(process.cwd(), 'server', 'views')
    ];

    return candidateDirectories.find((candidatePath) => fs.existsSync(candidatePath));
}

const VIEWS_DIR = resolveViewsDirectory();

if (!VIEWS_DIR) {
    throw new Error('Unable to locate views directory');
}

const PAGES_DIR = path.join(VIEWS_DIR, 'pages');

const pageRegistry = [
    {
        id: 'home',
        route: '/',
        template: 'home',
        title: 'saintjustus.xyz',
        description: 'The portfolio of saintjustus — technology, art, and music.',
        modules: []
    },
    {
        id: 'work',
        route: '/work',
        template: 'work',
        title: 'work — saintjustus.xyz',
        description: 'Technology and research projects by saintjustus.',
        modules: ['/js/art-windows.js']
    },
    {
        id: 'art',
        route: '/art',
        template: 'art',
        title: 'art — saintjustus.xyz',
        description: 'Modular floating windows showcasing generative works by saintjustus.',
        modules: ['/js/art-windows.js']
    },
    {
        id: 'music',
        route: '/music',
        template: 'music',
        title: 'music — saintjustus.xyz',
        description: 'Audio releases, mixes, and the saintjustus radio experience.',
        modules: ['/js/art-windows.js']
    }
];

const templateCache = new Map();

function normaliseRoute(route) {
    if (!route) {
        return '/';
    }

    if (route.length > 1 && route.endsWith('/')) {
        return route.slice(0, -1);
    }

    return route;
}

function loadTemplate(templateName) {
    if (templateCache.has(templateName)) {
        return templateCache.get(templateName);
    }

    const templatePath = path.join(PAGES_DIR, `${templateName}.html`);
    const contents = fs.readFileSync(templatePath, 'utf8');
    templateCache.set(templateName, contents);
    return contents;
}

function getPageByRoute(route) {
    const normalised = normaliseRoute(route);
    return pageRegistry.find((entry) => normaliseRoute(entry.route) === normalised) || null;
}

function getPageById(pageId) {
    return pageRegistry.find((entry) => entry.id === pageId) || null;
}

function getPageContent(pageId) {
    const page = getPageById(pageId);
    if (!page) {
        return null;
    }

    return {
        ...page,
        content: loadTemplate(page.template)
    };
}

module.exports = {
    getPageByRoute,
    getPageById,
    getPageContent,
    pageRegistry
};
