const { cpSync, mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

// Hostinger นำเฉพาะ output directory (dist) ไปเปิดใช้งาน จึงต้องฝัง
// local workspace package ไว้ใต้ dist เพื่อให้ require('@cyberjob/shared') หาเจอ
const target = join('dist', 'node_modules', '@cyberjob', 'shared');
mkdirSync(target, { recursive: true });
cpSync(join('shared', 'dist'), join(target, 'dist'), { recursive: true });
writeFileSync(
  join(target, 'package.json'),
  JSON.stringify(
    {
      name: '@cyberjob/shared',
      version: '0.1.0',
      private: true,
      main: 'dist/index.js',
    },
    null,
    2,
  ),
);
