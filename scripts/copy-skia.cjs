const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
fs.mkdirSync(path.join(root, 'public'), { recursive: true });
fs.copyFileSync(require.resolve('canvaskit-wasm/bin/full/canvaskit.wasm'), path.join(root, 'public/canvaskit.wasm'));
