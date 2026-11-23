'use strict';
// Build don gian: copy src/ -> dist/ va ghi build-info.json
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src');
const DIST = path.join(__dirname, 'dist');

fs.mkdirSync(DIST, { recursive: true });
fs.cpSync(SRC, DIST, { recursive: true, force: true });
fs.writeFileSync(
  path.join(DIST, 'build-info.json'),
  JSON.stringify({ builtAt: new Date().toISOString() }, null, 2)
);

const files = fs.readdirSync(DIST);
console.log('Build xong -> dist/: ' + files.join(', '));
