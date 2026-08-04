// src/services/settingsService.ts
//
// Backs the admin Settings > Support section and the public Support/Donate
// page. Reads/writes a single document, settings/support, so the MoMo
// number shown to donors is never hardcoded in source - change it once in
// the admin panel and both this page and any future in-app support screen
// pick it up automatically. Write access is admin-only, see firestore.rules.
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase';
import type { SupportSettings, PlatformSettings } from '@/types';

const SUPPORT_SETTINGS_DOC_ID = 'support';
const PLATFORM_SETTINGS_DOC_ID = 'platform';

export const DEFAULT_COMMISSION_RATE = 0.10;

const DEFAULT_SUPPORT_SETTINGS: SupportSettings = {
  ownerName: '',
  momoNumber: '',
  provider: 'MTN',
  message: 'Help us keep TELVO growing.',
  updatedAt: null,
};

export async function getSupportSettings(): Promise<SupportSettings | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.SETTINGS, SUPPORT_SETTINGS_DOC_ID));
  if (!snap.exists()) return null;
  return { ...DEFAULT_SUPPORT_SETTINGS, ...(snap.data() as SupportSettings) };
}

export interface SaveSupportSettingsInput {
  ownerName: string;
  momoNumber: string;
  provider: 'MTN' | 'Orange';
  message: string;
}

export async function saveSupportSettings(input: SaveSupportSettingsInput): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.SETTINGS, SUPPORT_SETTINGS_DOC_ID), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

// Commission percentage taken on every completed job. Was hardcoded at 10%
// in the Earnings page - now a real Firestore setting an admin can change,
// with 10% as the fallback if it's never been set.
export async function getPlatformSettings(): Promise<PlatformSettings> {
  const snap = await getDoc(doc(db, COLLECTIONS.SETTINGS, PLATFORM_SETTINGS_DOC_ID));
  if (!snap.exists()) return { commissionRate: DEFAULT_COMMISSION_RATE, updatedAt: null };
  return snap.data() as PlatformSettings;
}

export async function savePlatformSettings(commissionRate: number): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.SETTINGS, PLATFORM_SETTINGS_DOC_ID), {
    commissionRate,
    updatedAt: serverTimestamp(),
  });
}
