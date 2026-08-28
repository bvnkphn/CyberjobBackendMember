// Hostinger's runtime image only exposes Node.js. Package-manager commands belong
// to the build/deploy phase and are not available after the application starts.
// Migrations and seed data are deployed separately; runtime should only boot API.
require('./dist/main.js');
