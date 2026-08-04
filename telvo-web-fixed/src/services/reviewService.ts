// src/services/reviewService.ts
import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase';
import type { Review } from '@/types';

export async function getReviewsForUser(userId: string): Promise<Review[]> {
  const q = query(collection(db, COLLECTIONS.REVIEWS), where('reviewedId', '==', userId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  // Hidden reviews are moderated out of every public-facing view (profile
  // pages) but stay in Firestore so admin can still see/restore them.
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review)).filter((r) => !r.isHidden);
}

export async function hasReviewedJob(jobId: string, reviewerId: string): Promise<boolean> {
  const q = query(collection(db, COLLECTIONS.REVIEWS), where('jobId', '==', jobId), where('reviewerId', '==', reviewerId));
  const snap = await getDocs(q);
  return !snap.empty;
}

export async function submitReview(input: {
  jobId: string;
  reviewerId: string;
  reviewedId: string;
  rating: number;
  comment: string;
  photos?: string[];
}) {
  if (await hasReviewedJob(input.jobId, input.reviewerId)) {
    throw new Error('You have already reviewed this job.');
  }
  await addDoc(collection(db, COLLECTIONS.REVIEWS), {
    ...input,
    photos: input.photos ?? [],
    videos: [],
    ratings: {},
    isAnonymous: false,
    isResponse: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// ---- Admin moderation ----
export async function getAllReviewsAdmin(): Promise<Review[]> {
  const snap = await getDocs(query(collection(db, COLLECTIONS.REVIEWS), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
}

export async function setReviewHidden(reviewId: string, isHidden: boolean, reason?: string): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.REVIEWS, reviewId), {
    isHidden,
    hiddenReason: isHidden ? (reason ?? 'Flagged by admin') : '',
    updatedAt: serverTimestamp(),
  });
}
