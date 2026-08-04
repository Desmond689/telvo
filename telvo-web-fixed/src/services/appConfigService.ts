// src/services/appConfigService.ts
//
// Backs the admin "App Management" page. Reads/writes a single document,
// app_config/latest_app, that both this website (Download page) and,
// eventually, the Flutter app's in-app update check can read. Write access
// is restricted to admins by firestore.rules - see the `app_config` match
// block there.
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase';
import type { AppConfig } from '@/types';

const APP_CONFIG_DOC_ID = 'latest_app';

export async function getAppConfig(): Promise<AppConfig | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.APP_CONFIG, APP_CONFIG_DOC_ID));
  if (!snap.exists()) return null;
  return snap.data() as AppConfig;
}

export interface PublishAppUpdateInput {
  version: string;
  versionCode: number;
  apkUrl: string;
  apkSizeBytes?: number;
  releaseNotes: string;
}

export async function publishAppUpdate(input: PublishAppUpdateInput): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.APP_CONFIG, APP_CONFIG_DOC_ID), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}
