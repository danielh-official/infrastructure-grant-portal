const { defineConfig } = require('@playwright/test');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

const baseURL = 'http://127.0.0.1:8319';
if (!process.env.PLAYWRIGHT_PORTAL_DB) {
    const directory = mkdtempSync(join(tmpdir(), 'grant-portal-'));
    process.env.PLAYWRIGHT_PORTAL_DB = join(directory, 'test.sqlite');
    process.once('exit', () => rmSync(directory, { recursive: true, force: true }));
}

module.exports = defineConfig({
    testDir: './tests',
    use: { baseURL },
    webServer: {
        command: 'php -S 127.0.0.1:8319 -t public',
        url: baseURL,
        env: { PORTAL_DB: process.env.PLAYWRIGHT_PORTAL_DB },
    },
    reporter: 'list',
});
