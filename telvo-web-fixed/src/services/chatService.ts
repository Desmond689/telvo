// src/services/chatService.ts
import {
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase';
import type { ChatMessage, ChatThread } from '@/types';

export function chatIdFor(userA: string, userB: string): string {
  return [userA, userB].sort().join('_');
}

export async function ensureChatThread(userA: string, userB: string, jobId?: string): Promise<string> {
  const [user1Id, user2Id] = [userA, userB].sort();
  const existingQuery1 = query(
    collection(db, COLLECTIONS.CHATS),
    where('user1Id', '==', user1Id),
    where('user2Id', '==', user2Id)
  );
  const snap1 = await getDocs(existingQuery1);
  if (!snap1.empty) {
    const existing = snap1.docs[0];
    if (jobId) {
      await updateDoc(existing.ref, { jobId });
    }
    return existing.id;
  }

  const existingQuery2 = query(
    collection(db, COLLECTIONS.CHATS),
    where('user1Id', '==', user2Id),
    where('user2Id', '==', user1Id)
  );
  const snap2 = await getDocs(existingQuery2);
  if (!snap2.empty) {
    const existing = snap2.docs[0];
    if (jobId) {
      await updateDoc(existing.ref, { jobId });
    }
    return existing.id;
  }

  const fallbackQuery = query(
    collection(db, COLLECTIONS.CHATS),
    where('participantIds', 'array-contains', userA)
  );
  const fallbackSnap = await getDocs(fallbackQuery);
  const fallbackMatch = fallbackSnap.docs.find((doc) => {
    const ids: string[] = doc.data().participantIds || [];
    return ids.includes(userA) && ids.includes(userB);
  });
  if (fallbackMatch) {
    if (jobId) {
      await updateDoc(fallbackMatch.ref, { jobId });
    }
    return fallbackMatch.id;
  }

  const chatId = chatIdFor(userA, userB);
  await setDoc(
    doc(db, COLLECTIONS.CHATS, chatId),
    {
      id: chatId,
      participantIds: [userA, userB],
      user1Id,
      user2Id,
      jobId: jobId ?? null,
      lastMessage: null,
      lastMessageAt: serverTimestamp(),
      lastMessageTime: serverTimestamp(),
      updatedAt: serverTimestamp(),
      unreadCount: { [userA]: 0, [userB]: 0 },
      isActive: true,
    },
    { merge: true }
  );
  return chatId;
}

export function listenToThreads(userId: string, cb: (threads: ChatThread[]) => void): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.CHATS),
    where('participantIds', 'array-contains', userId),
    orderBy('lastMessageTime', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatThread))),
    (error) => {
      console.error('[TELVO] listenToThreads error', error);
      cb([]);
    }
  );
}

export function listenToMessages(chatId: string, cb: (messages: ChatMessage[]) => void): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.CHATS, chatId, 'messages'),
    orderBy('timestamp', 'asc')
  );
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage))),
    (error) => {
      console.error('[TELVO] listenToMessages error', error);
      cb([]);
    }
  );
}

export async function sendMessage(chatId: string, senderId: string, receiverId: string, message: string, type: 'text' | 'image' = 'text', mediaUrl?: string) {
  await addDoc(collection(db, COLLECTIONS.CHATS, chatId, 'messages'), {
    chatId,
    senderId,
    receiverId,
    message,
    type,
    mediaUrl: mediaUrl ?? null,
    timestamp: serverTimestamp(),
    read: false,
    isDelivered: true,
    isSeen: false,
  });
  await updateDoc(doc(db, COLLECTIONS.CHATS, chatId), {
    lastMessage: message,
    lastMessageTime: serverTimestamp(),
    lastMessageAt: serverTimestamp(),
    [`unreadCount.${receiverId}`]: increment(1),
  });
}

export async function markThreadAsRead(chatId: string, userId: string) {
  const q = query(
    collection(db, COLLECTIONS.CHATS, chatId, 'messages'),
    where('receiverId', '==', userId),
    where('read', '==', false)
  );
  const snap = await getDocs(q);
  if (snap.empty) {
    return;
  }
  const batch = writeBatch(db);
  snap.docs.forEach((docRef) => batch.update(docRef.ref, { read: true, isSeen: true }));
  await batch.commit();
  await updateDoc(doc(db, COLLECTIONS.CHATS, chatId), { [`unreadCount.${userId}`]: 0 });
}
