// craco.config.js
const path = require("path");
require("dotenv").config();

// Check if we're in development/preview mode (not production build)
// Craco sets NODE_ENV=development for start, NODE_ENV=production for build
const isDevServer = process.env.NODE_ENV !== "production";
const isProduction = process.env.NODE_ENV === "production";

// Environment variable overrides
const config = {
  enableHealthCheck: process.env.ENABLE_HEALTH_CHECK === "true",
  enableVisualEdits: isDevServer, // Only enable during dev server
};

// Conditionally load visual edits modules only in dev mode
let setupDevServer;
let babelMetadataPlugin;

if (config.enableVisualEdits) {
  setupDevServer = require("./plugins/visual-edits/dev-server-setup");
  babelMetadataPlugin = require("./plugins/visual-edits/babel-metadata-plugin");
}

// Conditionally load health check modules only if enabled
let WebpackHealthPlugin;
let setupHealthEndpoints;
let healthPluginInstance;

if (config.enableHealthCheck) {
  WebpackHealthPlugin = require("./plugins/health-check/webpack-health-plugin");
  setupHealthEndpoints = require("./plugins/health-check/health-endpoints");
  healthPluginInstance = new WebpackHealthPlugin();
}

// Build babel plugins array
const babelPlugins = [];

// Add visual edits metadata plugin in dev mode
if (config.enableVisualEdits && babelMetadataPlugin) {
  babelPlugins.push(babelMetadataPlugin);
}

// Remove console.log statements in production (keep console.error and console.warn)
if (isProduction) {
  babelPlugins.push([
    "transform-remove-console",
    { exclude: ["error", "warn"] }
  ]);
}

const webpackConfig = {
  eslint: {
    configure: {
      extends: ["plugin:react-hooks/recommended"],
      rules: {
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
      },
    },
  },
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {

      // Add ignored patterns to reduce watched directories
        webpackConfig.watchOptions = {
          ...webpackConfig.watchOptions,
          ignored: [
            '**/node_modules/**',
            '**/.git/**',
            '**/build/**',
            '**/dist/**',
            '**/coverage/**',
            '**/public/**',
        ],
      };

      // Disable error overlay for third-party errors (PostHog, analytics)
      // This only affects development mode
      if (webpackConfig.devServer) {
        webpackConfig.devServer.client = {
          ...webpackConfig.devServer.client,
          overlay: {
            errors: true,
            warnings: false,
            runtimeErrors: (error) => {
              // Suppress PostHog/analytics errors
              if (
                error?.message?.includes('PerformanceServerTiming') ||
                error?.message?.includes('DataCloneError') ||
                error?.message?.includes('posthog') ||
                error?.stack?.includes('posthog')
              ) {
                return false;
              }
              return true;
            },
          },
        };
      }

      // Add health check plugin to webpack if enabled
      if (config.enableHealthCheck && healthPluginInstance) {
        webpackConfig.plugins.push(healthPluginInstance);
      }
      return webpackConfig;
    },
  },
  // Add babel plugins if any
  ...(babelPlugins.length > 0 && {
    babel: {
      plugins: babelPlugins,
    },
  }),
};

webpackConfig.devServer = (devServerConfig) => {
  // Suppress PostHog/analytics runtime errors from the overlay
  devServerConfig.client = {
    ...devServerConfig.client,
    overlay: {
      errors: true,
      warnings: false,
      runtimeErrors: (error) => {
        // Suppress PostHog/analytics errors that aren't from our code
        const errorString = (error?.message || '') + (error?.stack || '');
        if (
          errorString.includes('PerformanceServerTiming') ||
          errorString.includes('DataCloneError') ||
          errorString.includes('posthog') ||
          errorString.includes('emergentagent')
        ) {
          return false;
        }
        return true;
      },
    },
  };

  // Apply visual edits dev server setup only if enabled
  if (config.enableVisualEdits && setupDevServer) {
    devServerConfig = setupDevServer(devServerConfig);
  }

  // Add health check endpoints if enabled
  if (config.enableHealthCheck && setupHealthEndpoints && healthPluginInstance) {
    const originalSetupMiddlewares = devServerConfig.setupMiddlewares;

    devServerConfig.setupMiddlewares = (middlewares, devServer) => {
      // Call original setup if exists
      if (originalSetupMiddlewares) {
        middlewares = originalSetupMiddlewares(middlewares, devServer);
      }

      // Setup health endpoints
      setupHealthEndpoints(devServer, healthPluginInstance);

      return middlewares;
    };
  }

  return devServerConfig;
};

module.exports = webpackConfig;
