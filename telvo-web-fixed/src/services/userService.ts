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
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase';
import type { TelvoUser } from '@/types';

const PROFESSIONAL_USER_TYPES = ['professional', 'Professional', 'both', 'Both'] as const;
const BUSINESS_USER_TYPES = ['business', 'Business'] as const;
const WORKER_USER_TYPES = [...PROFESSIONAL_USER_TYPES, ...BUSINESS_USER_TYPES] as const;
const WORKER_MODES = ['professional', 'business'] as const;

function normalizeUserType(userType?: string) {
  return userType?.trim().toLowerCase();
}

function createBaseConstraints(filters: SearchFilters) {
  const constraints: QueryConstraint[] = [];
  if (filters.category) constraints.push(where('category', '==', filters.category));
  if (filters.city) constraints.push(where('city', '==', filters.city));
  if (filters.verifiedOnly) constraints.push(where('isVerified', '==', true));
  return constraints;
}

function createUserTypeConstraints(userType: string) {
  if (userType === 'professional') {
    return [
      [where('userType', 'in', PROFESSIONAL_USER_TYPES)],
      [where('mode', '==', 'professional')],
    ] as QueryConstraint[][];
  }
  if (userType === 'business') {
    return [
      [where('userType', 'in', BUSINESS_USER_TYPES)],
      [where('mode', '==', 'business')],
    ] as QueryConstraint[][];
  }
  if (userType === 'all') {
    return [
      [where('userType', 'in', WORKER_USER_TYPES)],
      [where('mode', 'in', WORKER_MODES)],
    ] as QueryConstraint[][];
  }
  return [[where('userType', '==', userType)]] as QueryConstraint[][];
}

export interface SearchFilters {
  category?: string;
  city?: string;
  verifiedOnly?: boolean;
  minRating?: number;
  userType?: 'professional' | 'business' | 'all';
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
  const baseConstraints = createBaseConstraints(filters);
  const userTypeQueries = createUserTypeConstraints(userType);

  const docs = new Map<string, TelvoUser>();
  for (const typeConstraints of userTypeQueries) {
    const constraints = [...typeConstraints, ...baseConstraints];
    let q = query(collection(db, COLLECTIONS.USERS), ...constraints, orderBy('rating', 'desc'), fbLimit(pageSize));
    if (cursor && userType !== 'all') {
      q = query(collection(db, COLLECTIONS.USERS), ...constraints, orderBy('rating', 'desc'), startAfter(cursor), fbLimit(pageSize));
    }
    const snap = await getDocs(q);
    for (const docSnap of snap.docs) {
      const user = { id: docSnap.id, ...docSnap.data() } as TelvoUser;
      docs.set(user.id, user);
    }
  }

  const results = Array.from(docs.values())
    .filter((r) => r.isSuspended !== true)
    .filter((r) => (filters.minRating ? (r.rating || 0) >= filters.minRating : true))
    .sort((a, b) => (b.rating || 0) - (a.rating || 0));

  return {
    results,
    lastDoc: null,
    hasMore: results.length >= pageSize,
  };
}

async function fetchFeaturedUsersByType(userType: 'professional' | 'business' | 'all', count = 6): Promise<TelvoUser[]> {
  const userTypeQueries = createUserTypeConstraints(userType);
  const docs = new Map<string, TelvoUser>();

  for (const typeConstraints of userTypeQueries) {
    const q = query(
      collection(db, COLLECTIONS.USERS),
      ...typeConstraints,
      orderBy('rating', 'desc'),
      fbLimit(count)
    );
    const snap = await getDocs(q);
    for (const docSnap of snap.docs) {
      const user = { id: docSnap.id, ...docSnap.data() } as TelvoUser;
      docs.set(user.id, user);
    }
  }

  return Array.from(docs.values())
    .filter((u) => u.isSuspended !== true)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, count);
}

export async function getFeaturedProfessionals(count = 6): Promise<TelvoUser[]> {
  return fetchFeaturedUsersByType('professional', count);
}

export async function getFeaturedWorkers(count = 6): Promise<TelvoUser[]> {
  return fetchFeaturedUsersByType('all', count);
}

export async function toggleFavorite(currentUserId: string, targetId: string, isFavorited: boolean) {
  const ref = doc(db, COLLECTIONS.USERS, currentUserId);
  await updateDoc(ref, { favorites: isFavorited ? arrayRemove(targetId) : arrayUnion(targetId) });
}
