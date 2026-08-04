/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_SENDER_ID: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID: string;
  readonly VITE_FIREBASE_VAPID_KEY: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_APP_STORE_URL: string;
  readonly VITE_PLAY_STORE_URL: string;
  readonly VITE_USE_FIREBASE_EMULATORS: string;
  readonly VITE_APP_ENV: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
