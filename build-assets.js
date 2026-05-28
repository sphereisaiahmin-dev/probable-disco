const fs = require('node:fs');
const path = require('node:path');

const projectRoot = __dirname;
const publicDir = path.join(projectRoot, 'public');

const copyTargets = [
    { from: path.join(projectRoot, 'css'), to: path.join(publicDir, 'css') },
    { from: path.join(projectRoot, 'js'), to: path.join(publicDir, 'js') },
    { from: path.join(projectRoot, 'lightmode'), to: path.join(publicDir, 'lightmode') },
    { from: path.join(projectRoot, 'moth', 'assets'), to: path.join(publicDir, 'assets') }
];

const directCopies = [
    {
        from: path.join(projectRoot, 'lightmode', 'screenshot.png'),
        to: path.join(publicDir, 'screenshot.png')
    }
];

function resetDirectory(dirPath) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    fs.mkdirSync(dirPath, { recursive: true });
}

function copyDirectory(sourceDir, destinationDir) {
    if (!fs.existsSync(sourceDir)) {
        throw new Error(`Missing source directory: ${path.relative(projectRoot, sourceDir)}`);
    }

    fs.cpSync(sourceDir, destinationDir, { recursive: true });
}

function copyFile(sourceFile, destinationFile) {
    if (!fs.existsSync(sourceFile)) {
        throw new Error(`Missing source file: ${path.relative(projectRoot, sourceFile)}`);
    }

    fs.mkdirSync(path.dirname(destinationFile), { recursive: true });
    fs.copyFileSync(sourceFile, destinationFile);
}

function buildPublicAssets(targetDir = publicDir) {
    resetDirectory(targetDir);

    copyTargets.forEach(({ from, to }) => {
        const relativeTarget = path.relative(publicDir, to);
        copyDirectory(from, path.join(targetDir, relativeTarget));
    });
    directCopies.forEach(({ from, to }) => {
        const relativeTarget = path.relative(publicDir, to);
        copyFile(from, path.join(targetDir, relativeTarget));
    });

    return {
        publicDir: targetDir,
        copiedDirectories: copyTargets.map(({ to }) => path.relative(publicDir, to)),
        copiedFiles: directCopies.map(({ to }) => path.relative(publicDir, to))
    };
}

if (require.main === module) {
    const result = buildPublicAssets();
    console.log(`public assets prepared in ${path.relative(projectRoot, result.publicDir)}`);
}

module.exports = {
    buildPublicAssets,
    publicDir
};
