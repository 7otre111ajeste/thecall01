import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Configuration Capacitor pour MY STORYLINE.
 *
 * L'app Capacitor charge directement l'URL déployée sur Lovable afin que
 * TanStack Start (SSR + createServerFn + AI Gateway) fonctionne nativement
 * sans empaqueter de backend dans l'APK.
 */
const config: CapacitorConfig = {
  appId: "app.lovable.thecall",
  appName: "MY STORYLINE",
  webDir: "dist/client",
  server: {
    url: "https://thecall01.lovable.app",
    cleartext: false,
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
