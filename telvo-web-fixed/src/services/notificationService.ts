// src/services/notificationService.ts
import { collection, doc, onSnapshot, orderBy, query, updateDoc, where, limit, type Unsubscribe } from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase';
import type { AppNotification } from '@/types';

export function listenToNotifications(userId: string, cb: (items: AppNotification[]) => void, max = 50): Unsubscribe {
  const q = query(collection(db, COLLECTIONS.NOTIFICATIONS), where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(max));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification))));
}

export async function markNotificationRead(id: string) {
  await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, id), { isRead: true });
}
