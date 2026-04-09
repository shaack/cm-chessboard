import {defineConfig, devices} from "@playwright/test"

const PORT = 4173
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
    testDir: "./e2e/specs",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 2 : undefined,
    reporter: process.env.CI ? [["github"], ["html", {open: "never"}]] : "list",
    use: {
        baseURL: BASE_URL,
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
        video: "retain-on-failure"
    },
    projects: [
        {
            name: "chromium",
            use: {...devices["Desktop Chrome"]}
        }
    ],
    webServer: {
        command: "node e2e/server.mjs",
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
        env: {
            PORT: String(PORT)
        }
    }
})
