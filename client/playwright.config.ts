import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
  },
  webServer: [
    {
      command: 'cd .. && npm run dev',
      url: 'http://localhost:3000/health',
      reuseExistingServer: true,
      timeout: 10000,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 10000,
    },
  ],
})
