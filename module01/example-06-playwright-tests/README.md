# Example 06 — Playwright tests

End-to-end tests for the [TDD Frontend Example](https://erickwendel.github.io/vanilla-js-web-app-example/) app using [@playwright/test](https://playwright.dev/docs/intro) and Chromium only.

## Prerequisites

- [Node.js](https://nodejs.org/) 20 or newer
- npm

## Setup

From this directory:

```bash
npm install
npx playwright install --with-deps chromium
```

`npm ci` works as well if you only need a clean install from the lockfile.

## Run tests

```bash
npm test
```

Tests run against the live GitHub Pages URL configured in `playwright.config.ts` (`baseURL`). No local app server is required.

### Useful commands

```bash
# Run a single spec file
npx playwright test tests/app.spec.ts

# Run with the interactive UI
npx playwright test --ui

# Open the last HTML report (after a run that generated one)
npx playwright show-report
```

## Project layout

- `playwright.config.ts` — base URL, timeouts, Chromium project, HTML reporter
- `tests/` — Playwright spec files
- `.github/workflows/playwright.yml` (repo root) — CI on GitHub Actions (Chromium, uploads HTML report on failure)

## Continuous integration

On push or pull request that touches this example, GitHub Actions installs dependencies, installs Chromium, and runs `npm test` from `module01/example-06-playwright-tests`.
