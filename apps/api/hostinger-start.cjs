const { execFileSync } = require('node:child_process');

function run(script) {
  execFileSync('npm', ['run', script], {
    cwd: __dirname,
    env: process.env,
    stdio: 'inherit',
  });
}

run('prisma:deploy');
run('db:seed');
require('./dist/main.js');
