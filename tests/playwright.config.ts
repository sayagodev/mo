import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  timeout: 15000,
  use: {
    baseURL: 'http://localhost:4174',
    testIdAttribute: 'data-test',
  },
  webServer: {
    command: 'python3 -m http.server 4174 --directory ..',
    url: 'http://localhost:4174',
    reuseExistingServer: true,
  },
});
