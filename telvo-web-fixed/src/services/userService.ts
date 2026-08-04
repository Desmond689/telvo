// src/services/userService.ts
// Real Firestore reads/writes against the shared `users` collection.
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as fbLimit,
  startAfter,
  updateDoc,
  arrayUnion,
  arrayRemove,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase';
import type { TelvoUser } from '@/types';

const PROFESSIONAL_USER_TYPES = ['professional', 'Professional', 'both', 'Both'] as const;
const BUSINESS_USER_TYPES = ['business', 'Business'] as const;

function normalizeUserType(userType?: string) {
  return userType ? userType.toLowerCase() : undefined;
}

export interface SearchFilters {
  category?: string;
  city?: string;
  verifiedOnly?: boolean;
  minRating?: number;
  userType?: 'professional' | 'business';
}

export async function getUserById(id: string): Promise<TelvoUser | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.USERS, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as TelvoUser) : null;
}

export async function searchProfessionalsOrBusinesses(
  filters: SearchFilters,
  pageSize = 12,
  cursor?: QueryDocumentSnapshot
) {
  const userType = normalizeUserType(filters.userType) || 'professional';
  const constraints = [];

  if (userType === 'professional') {
    constraints.push(where('userType', 'in', PROFESSIONAL_USER_TYPES));
  } else if (userType === 'business') {
    constraints.push(where('userType', 'in', BUSINESS_USER_TYPES));
  } else {
    constraints.push(where('userType', '==', userType));
  }

  if (filters.category) constraints.push(where('category', '==', filters.category));
  if (filters.city) constraints.push(where('city', '==', filters.city));
  if (filters.verifiedOnly) constraints.push(where('isVerified', '==', true));

  let q = query(collection(db, COLLECTIONS.USERS), ...constraints, orderBy('rating', 'desc'), fbLimit(pageSize));
  if (cursor) {
    q = query(collection(db, COLLECTIONS.USERS), ...constraints, orderBy('rating', 'desc'), startAfter(cursor), fbLimit(pageSize));
  }
  const snap = await getDocs(q);
  const results = snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as TelvoUser))
    .filter((r) => r.isSuspended !== true);
  const filtered = filters.minRating ? results.filter((r) => (r.rating || 0) >= filters.minRating!) : results;
  return { results: filtered, lastDoc: snap.docs[snap.docs.length - 1] ?? null, hasMore: snap.docs.length === pageSize };
}

export async function getFeaturedProfessionals(count = 6): Promise<TelvoUser[]> {
  const q = query(
    collection(db, COLLECTIONS.USERS),
    where('userType', 'in', PROFESSIONAL_USER_TYPES),
    orderBy('rating', 'desc'),
    fbLimit(count)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as TelvoUser))
    .filter((u) => u.isSuspended !== true);
}

export async function toggleFavorite(currentUserId: string, targetId: string, isFavorited: boolean) {
  const ref = doc(db, COLLECTIONS.USERS, currentUserId);
  await updateDoc(ref, { favorites: isFavorited ? arrayRemove(targetId) : arrayUnion(targetId) });
}
