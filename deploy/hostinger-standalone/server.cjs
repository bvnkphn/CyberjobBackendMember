// Hostinger runs this file after the build step (supports both root and dist/).
const path = require('path');
const fs = require('fs');
const Module = require('module');

// Intercept @cyberjob/shared to ensure it resolves regardless of npm link/nest monorepo structure
const origRequire = Module.prototype.require;
Module.prototype.require = function(request) {
  if (request === '@cyberjob/shared') {
    const candidatePaths = [
      path.join(__dirname, 'node_modules', '@cyberjob', 'shared', 'dist', 'index.js'),
      path.join(__dirname, 'dist', 'node_modules', '@cyberjob', 'shared', 'dist', 'index.js'),
      path.join(__dirname, 'shared', 'dist', 'index.js'),
      path.join(__dirname, '..', 'shared', 'dist', 'index.js')
    ];
    for (const c of candidatePaths) {
      if (fs.existsSync(c)) {
        return origRequire.call(this, c);
      }
    }
  }
  return origRequire.apply(this, arguments);
};

const candidates = [
  path.join(__dirname, 'dist', 'main.js'),
  path.join(__dirname, 'main.js'),
  path.resolve('./dist/main.js')
];

let target = null;
for (const c of candidates) {
  if (fs.existsSync(c)) {
    target = c;
    break;
  }
}

if (!target) {
  console.error('[Hostinger Entry] Cannot find main.js in:', candidates);
  process.exit(1);
}

console.log('[Hostinger Entry] Starting CyberJob Backend from:', target);
require(target);


