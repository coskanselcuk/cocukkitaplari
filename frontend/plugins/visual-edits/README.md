# Visual Edits Plugin

⚠️ **DEVELOPMENT ONLY** - This plugin is NOT included in production builds.

## Purpose

This plugin enables visual editing capabilities during development, allowing 
real-time component editing through the Emergent platform.

## How It's Excluded from Production

1. **Conditional Loading** (`craco.config.js`):
   - Only loaded when `NODE_ENV !== 'production'`
   - `enableVisualEdits: isDevServer`

2. **Build Process**:
   - `yarn build` sets `NODE_ENV=production`
   - Plugin code is never bundled into production output

## Files

- `dev-server-setup.js` - Webpack dev server middleware
- `babel-metadata-plugin.js` - Babel plugin for component metadata

## Security Notes

- CORS rules only allow localhost in development mode
- Password-protected via Supervisor configuration
- All production checks bypass this plugin entirely
