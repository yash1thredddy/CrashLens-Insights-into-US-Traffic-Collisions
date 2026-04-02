# CRA to Vite Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate CrashLens frontend from Create React App to Vite to eliminate all 26 npm vulnerabilities from `react-scripts`, fix security issues (hardcoded/committed API tokens), and modernize the build toolchain.

**Architecture:** Replace react-scripts with Vite + @vitejs/plugin-react. Move entry HTML to project root (Vite convention). Replace `process.env.REACT_APP_*` with `import.meta.env.VITE_*`. Remove hardcoded Mapbox token from source code and use env vars exclusively. Set up Vite proxy to replace the stale CRA proxy config.

**Tech Stack:** Vite 6, @vitejs/plugin-react, Vitest, React 18, existing deps unchanged

---

## File Structure

### Files to Create
- `frontend/vite.config.js` — Vite configuration with React plugin, proxy, and env prefix
- `frontend/index.html` — Entry HTML (moved from public/, adapted for Vite)
- `frontend/.env.example` — Template env file (safe to commit, no real values)

### Files to Modify
- `frontend/package.json` — Swap deps and scripts
- `frontend/.env` — Rename env vars from REACT_APP_ to VITE_ prefix, fix port
- `frontend/.gitignore` — Add `.env` to prevent secret commits
- `frontend/src/index.js` → rename to `frontend/src/main.jsx` — Entry point
- `frontend/src/constants/index.js` — Remove hardcoded Mapbox token, use env var
- `frontend/src/components/map/MapContainer.jsx:79` — Replace env var access
- `frontend/src/components/map/TopAccidentsChart.jsx:70` — Replace env var access
- `frontend/src/components/map/StateMapContainer.jsx:153` — Replace env var access
- `frontend/src/components/map/CityAnalysis.jsx:48,95` — Replace env var access (2 locations)
- `frontend/src/components/map/CountyTimeChart.jsx:180` — Replace env var access
- `frontend/src/services/api.js:4` — Remove hardcoded localhost URL, use relative path

### Files to Delete
- `frontend/public/index.html` — Replaced by root-level index.html

---

### Task 1: Remove CRA dependencies and install Vite

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: Remove react-scripts and CRA-specific deps**

```bash
cd frontend && npm uninstall react-scripts @testing-library/jest-dom @testing-library/react @testing-library/user-event web-vitals
```

- [ ] **Step 2: Install Vite and related deps**

```bash
cd frontend && npm install --save-dev vite @vitejs/plugin-react vitest jsdom
```

- [ ] **Step 3: Update package.json scripts and remove proxy**

In `frontend/package.json`, replace the `scripts` block and remove the `proxy` and `eslintConfig` fields. The final package.json should have:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest"
  }
}
```

Remove these fields entirely:
- `"proxy": "http://localhost:5000"`
- `"eslintConfig": { ... }`
- `"browserslist": { ... }`

- [ ] **Step 4: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "chore: swap react-scripts for vite, vitest, and @vitejs/plugin-react"
```

---

### Task 2: Create Vite configuration

**Files:**
- Create: `frontend/vite.config.js`

- [ ] **Step 1: Create vite.config.js**

Create `frontend/vite.config.js`:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'build',
  },
});
```

Note: `outDir: 'build'` preserves the CRA convention so existing deployment scripts still work.

- [ ] **Step 2: Commit**

```bash
git add frontend/vite.config.js
git commit -m "feat: add vite.config.js with react plugin and api proxy"
```

---

### Task 3: Restructure entry point (HTML + JS)

**Files:**
- Create: `frontend/index.html`
- Rename: `frontend/src/index.js` → `frontend/src/main.jsx`
- Delete: `frontend/public/index.html`

- [ ] **Step 1: Create new root index.html**

Create `frontend/index.html` (note: project root, NOT in public/):

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta
      name="description"
      content="US Accidents Analysis and Visualization"
    />
    <link rel="apple-touch-icon" href="/logo192.png" />
    <link rel="manifest" href="/manifest.json" />
    
    <!-- Mapbox GL CSS -->
    <link href='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css' rel='stylesheet' />
    
    <!-- Material UI Fonts -->
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
    />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/icon?family=Material+Icons"
    />

    <!-- Custom styles -->
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: 'Roboto', sans-serif;
        overflow: hidden;
      }

      #root {
        height: 100vh;
        width: 100vw;
      }

      .mapboxgl-map {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
      }

      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      ::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 4px;
      }

      ::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 4px;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.4);
      }

      .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      }

      .noselect {
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
    </style>

    <title>US Accidents Analysis</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

Key differences from CRA version: `%PUBLIC_URL%` replaced with `/`, and `<script type="module" src="/src/main.jsx">` added before `</body>`.

- [ ] **Step 2: Rename src/index.js to src/main.jsx**

```bash
cd frontend && git mv src/index.js src/main.jsx
```

The file contents stay exactly the same — no code changes needed. Vite finds the entry via the `<script>` tag in index.html.

- [ ] **Step 3: Delete old public/index.html**

```bash
cd frontend && git rm public/index.html
```

The remaining files in `public/` (favicon.ico, logo192.png, logo512.png, manifest.json, robots.txt) stay — Vite serves them as static assets from `public/` automatically.

- [ ] **Step 4: Commit**

```bash
git add frontend/index.html frontend/src/main.jsx
git commit -m "feat: restructure entry point for vite (root index.html, main.jsx)"
```

---

### Task 4: Security fixes — env vars and hardcoded secrets

**Files:**
- Modify: `frontend/.env`
- Modify: `frontend/.gitignore`
- Modify: `frontend/src/constants/index.js`
- Modify: `frontend/src/services/api.js`
- Create: `frontend/.env.example`

- [ ] **Step 1: Fix .gitignore to include .env**

In `frontend/.gitignore`, add `.env` to the `# misc` section. The section should read:

```
# misc
.DS_Store
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

- [ ] **Step 2: Update .env with Vite prefix and correct port**

Replace `frontend/.env` contents with:

```
VITE_MAPBOX_TOKEN=pk.eyJ1IjoieWFzaDF0aDI2IiwiYSI6ImNtM2ZtcGh4aTBydm4yaXBxYmdheWZ2dDMifQ.lJeCVwpFdD4gFtfqutyLGw
```

Note: `REACT_APP_API_URL` is removed entirely — the Vite proxy handles API routing.

- [ ] **Step 3: Create .env.example (safe to commit)**

Create `frontend/.env.example`:

```
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

- [ ] **Step 4: Remove hardcoded Mapbox token from constants/index.js**

In `frontend/src/constants/index.js`, replace line 2:

```js
// Old:
export const MAPBOX_TOKEN = 'pk.eyJ1IjoieWFzaDF0aDI2IiwiYSI6ImNtM2ZtcGh4aTBydm4yaXBxYmdheWZ2dDMifQ.lJeCVwpFdD4gFtfqutyLGw';

// New:
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
```

- [ ] **Step 5: Fix hardcoded API URL in services/api.js**

In `frontend/src/services/api.js`, replace line 4:

```js
// Old:
const BASE_URL = 'http://localhost:5001/api';

// New:
const BASE_URL = '/api';
```

- [ ] **Step 6: Commit**

```bash
git add frontend/.gitignore frontend/.env.example frontend/src/constants/index.js frontend/src/services/api.js
git commit -m "fix: remove hardcoded secrets, use env vars and proxy for API"
```

Note: Do NOT `git add frontend/.env` — it's now gitignored.

---

### Task 5: Migrate all process.env references to import.meta.env

**Files:**
- Modify: `frontend/src/components/map/MapContainer.jsx:79`
- Modify: `frontend/src/components/map/TopAccidentsChart.jsx:70`
- Modify: `frontend/src/components/map/StateMapContainer.jsx:153`
- Modify: `frontend/src/components/map/CityAnalysis.jsx:48,95`
- Modify: `frontend/src/components/map/CountyTimeChart.jsx:180`

All six occurrences follow the same pattern — the `${process.env.REACT_APP_API_URL}` prefix is removed entirely because the Vite proxy routes `/api/*` to the backend.

- [ ] **Step 1: Fix MapContainer.jsx**

In `frontend/src/components/map/MapContainer.jsx` line 79, change:

```js
// Old:
url: `${process.env.REACT_APP_API_URL}/api/spatial/map-data?${params}`,

// New:
url: `/api/spatial/map-data?${params}`,
```

- [ ] **Step 2: Fix TopAccidentsChart.jsx**

In `frontend/src/components/map/TopAccidentsChart.jsx` line 70, change:

```js
// Old:
const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/spatial/top-accidents?${params}`);

// New:
const response = await axios.get(`/api/spatial/top-accidents?${params}`);
```

- [ ] **Step 3: Fix StateMapContainer.jsx**

In `frontend/src/components/map/StateMapContainer.jsx` line 153, change:

```js
// Old:
const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/state/details?${params}`);

// New:
const response = await axios.get(`/api/state/details?${params}`);
```

- [ ] **Step 4: Fix CityAnalysis.jsx (two locations)**

In `frontend/src/components/map/CityAnalysis.jsx` line 48, change:

```js
// Old:
const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/analysis/cities?${params}`);

// New:
const response = await axios.get(`/api/analysis/cities?${params}`);
```

In `frontend/src/components/map/CityAnalysis.jsx` line 95, change:

```js
// Old:
const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/analysis/streets?${params}`);

// New:
const response = await axios.get(`/api/analysis/streets?${params}`);
```

- [ ] **Step 5: Fix CountyTimeChart.jsx**

In `frontend/src/components/map/CountyTimeChart.jsx` line 180, change:

```js
// Old:
const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/county/time-analysis?${params}`);

// New:
const response = await axios.get(`/api/county/time-analysis?${params}`);
```

- [ ] **Step 6: Verify no remaining process.env references**

```bash
cd frontend && grep -r "process\.env" src/
```

Expected: No output (zero matches).

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/map/MapContainer.jsx frontend/src/components/map/TopAccidentsChart.jsx frontend/src/components/map/StateMapContainer.jsx frontend/src/components/map/CityAnalysis.jsx frontend/src/components/map/CountyTimeChart.jsx
git commit -m "refactor: replace process.env.REACT_APP_API_URL with relative /api paths"
```

---

### Task 6: Clean install and verify

**Files:** None (verification only)

- [ ] **Step 1: Delete node_modules and lockfile for clean install**

```bash
cd frontend && rm -rf node_modules package-lock.json
```

- [ ] **Step 2: Fresh install**

```bash
cd frontend && npm install
```

- [ ] **Step 3: Run npm audit**

```bash
cd frontend && npm audit
```

Expected: 0 vulnerabilities (or only low-severity informational ones).

- [ ] **Step 4: Verify dev server starts**

```bash
cd frontend && npx vite --host 2>&1 | head -10
```

Expected: Vite dev server starts on port 3000 with no errors.

- [ ] **Step 5: Verify build succeeds**

```bash
cd frontend && npm run build
```

Expected: Build completes, output in `frontend/build/`.

- [ ] **Step 6: Commit lockfile**

```bash
git add frontend/package-lock.json
git commit -m "chore: clean lockfile after vite migration"
```

---

### Task 7: Security audit

**Files:** None (audit only, fixes already applied in Task 4)

- [ ] **Step 1: Verify .env is gitignored**

```bash
cd frontend && git check-ignore .env
```

Expected: `.env` is printed (meaning it's ignored).

- [ ] **Step 2: Check git history for committed secrets**

```bash
git log --all --oneline -- frontend/.env
```

Expected: Shows commit `56edf0d` where `.env` was committed. The Mapbox token is in git history. Note: this is a public-facing frontend token (restricted by domain on Mapbox dashboard), so history rewriting is optional but recommended.

- [ ] **Step 3: Verify no hardcoded secrets remain in source**

```bash
cd frontend && grep -rn "pk\.eyJ" src/
```

Expected: No output (the hardcoded token in constants/index.js was replaced in Task 4).

- [ ] **Step 4: Verify no hardcoded localhost URLs remain**

```bash
cd frontend && grep -rn "localhost" src/
```

Expected: No output.

- [ ] **Step 5: Verify proxy doesn't expose unintended routes**

Check `frontend/vite.config.js` — only `/api` prefix is proxied. All other routes serve frontend assets. This is correct.

- [ ] **Step 6: Document security findings**

Report to user:
1. `.env` was committed in `56edf0d` — Mapbox token is in git history
2. Hardcoded token was in `constants/index.js` — now replaced with env var
3. Hardcoded `localhost:5001` was in `services/api.js` — now uses proxy
4. Recommend: rotate Mapbox token on Mapbox dashboard and restrict to production domains
5. Recommend: if repo is public, consider `git filter-branch` or BFG to scrub history
