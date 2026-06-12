import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Configuration Capacitor pour The Call.
 *
 * IMPORTANT — Architecture choisie :
 * L'application Capacitor charge directement l'app déployée sur Lovable.
 * Cela permet à TanStack Start (SSR + createServerFn + AI Gateway) de
 * fonctionner exactement comme sur le web, sans devoir empaqueter de backend
 * dans l'APK. Le webview Android sert d'enveloppe native autour de l'URL.
 *
 * Pour basculer entre prod et preview, change `server.url` ci-dessous.
 * Pour tester en local sur ton réseau, remplace par l'IP de ton PC + port Vite,
 * ex: "http://192.168.1.20:8080".
 */
const config: CapacitorConfig = {
  appId: "app.lovable.thecall",
  appName: "The Call",
  // webDir n'est pas réellement utilisé puisqu'on charge `server.url`,
  // mais Capacitor exige un dossier existant. On pointe sur `public`.
  webDir: "public",
  server: {
    // URL publiée du projet — toutes les requêtes (pages, server functions,
    // AI Gateway, assets) partent d'ici, donc createServerFn fonctionne.
    url: "https://thecall01.lovable.app",
    cleartext: false,
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
