const fs = require('node:fs');
const path = require('node:path');

const assets = ['css', 'js', 'lightmode'];
const missing = assets.filter((dir) => !fs.existsSync(path.join(__dirname, dir)));

if (missing.length > 0) {
    console.warn(`warning: missing asset folders: ${missing.join(', ')}`);
}

console.log('serverless build placeholder complete');
