# CRA to Vite Migration + Security Audit

## Goal

Eliminate all 26 npm vulnerabilities caused by `react-scripts@5.0.1` by migrating the frontend build toolchain from Create React App to Vite. Simultaneously audit for security issues (leaked secrets, env configuration).

## Scope

- **In scope:** Build tool swap, env var migration, proxy config, entry point restructure, security audit, test runner replacement
- **Out of scope:** Component refactoring, dependency upgrades unrelated to CRA, feature changes

## Architecture Changes

### Build Toolchain

| Aspect | CRA (current) | Vite (target) |
|--------|---------------|---------------|
| Dev server | webpack-dev-server | Vite (ESBuild) |
| Production build | webpack 5 | Rollup (via Vite) |
| Test runner | Jest 27 (via react-scripts) | Vitest |
| HMR | Webpack HMR | Vite HMR (near-instant) |
| Config | Hidden (react-scripts) | Explicit vite.config.js |

### Entry Point Restructure

- `public/index.html` → `index.html` (project root)
- `src/index.js` → `src/main.jsx`
- Add `<script type="module" src="/src/main.jsx">` to index.html
- Replace `%PUBLIC_URL%` with `/`

### Environment Variables

| Current | New | Notes |
|---------|-----|-------|
| `REACT_APP_MAPBOX_TOKEN` | `VITE_MAPBOX_TOKEN` | Prefix change |
| `REACT_APP_API_URL` | Removed | Proxy handles routing |
| `process.env.REACT_APP_*` | `import.meta.env.VITE_*` | 6 files affected |

### Proxy Configuration

```js
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true
    }
  }
}
```

All API calls change from `${process.env.REACT_APP_API_URL}/api/...` to `/api/...`.

### Affected Files (env var replacement)

1. `src/components/map/TopAccidentsChart.jsx`
2. `src/components/map/StateMapContainer.jsx`
3. `src/components/map/CityAnalysis.jsx` (2 occurrences)
4. `src/components/map/MapContainer.jsx`
5. `src/components/map/CountyTimeChart.jsx`

### Security Audit Checklist

- [ ] `.env` is in `.gitignore`
- [ ] No secrets committed in git history
- [ ] No hardcoded API keys or credentials in source files
- [ ] Mapbox token only exposed via env var (accepted: frontend tokens are public by nature)
- [ ] Proxy config does not expose unintended routes
- [ ] No sensitive data in `public/` assets

### Package Changes

**Remove:** `react-scripts`, `@testing-library/*`, `web-vitals`
**Add:** `vite`, `@vitejs/plugin-react`, `vitest`, `jsdom`

### Scripts

```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest"
}
```

## Success Criteria

1. `npm audit` shows 0 vulnerabilities (or only low-severity transitive ones)
2. `npm run dev` starts dev server with working proxy
3. `npm run build` produces production bundle
4. All existing functionality works (map renders, API calls succeed)
5. No secrets leaked in source or git history
