/**
 * Capacitor config stub for Stickman Fighter iOS (C2 prep).
 * Copy to repo-root `capacitor.config.ts` when bootstrapping — do not commit secrets.
 *
 * Bundle ID: com.brennyz.stickmanfighter
 *
 * TWO OPTIONS — uncomment / keep only one `server` vs `webDir` strategy:
 *   A) Hosted URL  — load live PWA (debug / internal)
 *   B) Local www   — bundled WebView (preferred for App Store / 4.2)
 */

import type { CapacitorConfig } from '@capacitor/cli';

const appId = 'com.brennyz.stickmanfighter';
const appName = 'Stickman Fighter';

/** Option A — Hosted URL (server load) */
const hostedConfig: CapacitorConfig = {
  appId,
  appName,
  // webDir still required by CLI; use a minimal placeholder folder
  webDir: 'native/ios/www',
  server: {
    url: 'https://brennyz.github.io/stickman-fighter/',
    cleartext: false,
    // Allow navigation within the Pages origin only
    allowNavigation: ['brennyz.github.io'],
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'Stickman Fighter',
  },
};

/** Option B — Local www copy (bundled) — preferred for App Store */
const wwwConfig: CapacitorConfig = {
  appId,
  appName,
  webDir: 'native/ios/www',
  // no server.url → WKWebView loads file:// / capacitor local assets
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'Stickman Fighter',
  },
};

// Default export: www (store-oriented). Switch to hostedConfig for remote debug.
const config: CapacitorConfig = wwwConfig;

export default config;

// Named exports so docs / tooling can reference both shapes
export { hostedConfig, wwwConfig, appId, appName };
