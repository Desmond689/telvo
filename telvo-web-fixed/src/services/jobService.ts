// src/services/jobService.ts
// All job/quote reads and writes go against the shared `jobs` collection,
// matching backend/src/models/Job.js exactly. Status transitions here are
// mirrored by (and ultimately authorized by) the Node backend + firestore.rules.
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  arrayUnion,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase';
import type { Job, JobStatus, JobUrgency, Quote } from '@/types';

export interface NewJobInput {
  customerId: string;
  category: string;
  serviceType: string;
  title: string;
  description: string;
  address: string;
  latitude?: number;
  longitude?: number;
  budget?: number;
  urgency: JobUrgency;
  scheduledDate?: Date | null;
  photos: string[];
  professionalId?: string;
  businessId?: string;
}

export async function createJobRequest(input: NewJobInput): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.JOBS), {
    customerId: input.customerId,
    category: input.category,
    serviceType: input.serviceType,
    title: input.title,
    description: input.description,
    address: input.address,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    budget: input.budget ?? null,
    urgency: input.urgency,
    scheduledDate: input.scheduledDate ?? null,
    photos: input.photos,
    professionalId: input.professionalId ?? null,
    businessId: input.businessId ?? null,
    status: 'posted' as JobStatus,
    quotes: [],
    isPaid: false,
    isEmergency: input.urgency === 'emergency',
    isRecurring: false,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export function listenToCustomerJobs(customerId: string, cb: (jobs: Job[]) => void): Unsubscribe {
  const q = query(collection(db, COLLECTIONS.JOBS), where('customerId', '==', customerId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Job))));
}

export function listenToOpenRequestsForCategory(category: string, city: string | undefined, cb: (jobs: Job[]) => void): Unsubscribe {
  const constraints = [where('category', '==', category), where('status', '==', 'posted')];
  const q = query(collection(db, COLLECTIONS.JOBS), ...constraints, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    let jobs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Job));
    if (city) jobs = jobs.filter((j) => j.address?.toLowerCase().includes(city.toLowerCase()));
    cb(jobs);
  });
}

export function listenToProfessionalJobs(professionalId: string, cb: (jobs: Job[]) => void): Unsubscribe {
  const q = query(collection(db, COLLECTIONS.JOBS), where('professionalId', '==', professionalId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Job))));
}

export async function getJob(jobId: string): Promise<Job | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.JOBS, jobId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Job) : null;
}

export function listenToJob(jobId: string, cb: (job: Job | null) => void): Unsubscribe {
  return onSnapshot(doc(db, COLLECTIONS.JOBS, jobId), (snap) => {
    cb(snap.exists() ? ({ id: snap.id, ...snap.data() } as Job) : null);
  });
}

export async function submitQuote(jobId: string, quote: Omit<Quote, 'id' | 'createdAt' | 'status'>) {
  const newQuote: Quote = {
    ...quote,
    id: crypto.randomUUID(),
    createdAt: new Date(),
    status: 'pending',
  };
  await updateDoc(doc(db, COLLECTIONS.JOBS, jobId), {
    quotes: arrayUnion(newQuote),
    status: 'quoted',
  });
}

export async function acceptQuote(jobId: string, quote: Quote) {
  await updateDoc(doc(db, COLLECTIONS.JOBS, jobId), {
    status: 'accepted',
    acceptedQuoteId: quote.id,
    professionalId: quote.professionalId,
    finalPrice: quote.price,
  });
}

export async function updateJobStatus(jobId: string, status: JobStatus) {
  const extra: Record<string, unknown> = { status };
  if (status === 'completed') extra.completedDate = serverTimestamp();
  await updateDoc(doc(db, COLLECTIONS.JOBS, jobId), extra);
}

export async function getAllJobsAdmin(): Promise<Job[]> {
  const snap = await getDocs(query(collection(db, COLLECTIONS.JOBS), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Job));
}

// Either the customer or the assigned professional can flag a job as
// disputed - it routes to an admin queue instead of silently stalling.
// The pre-dispute status is kept in `previousStatus` so admin can reopen
// the job in the right place if the dispute turns out to be a mistake.
export async function raiseDispute(jobId: string, userId: string, reason: string, previousStatus: JobStatus) {
  await updateDoc(doc(db, COLLECTIONS.JOBS, jobId), {
    status: 'disputed' as JobStatus,
    disputeReason: reason,
    disputedBy: userId,
    disputedAt: serverTimestamp(),
    previousStatus,
  });
}

export function listenToDisputedJobs(cb: (jobs: Job[]) => void): Unsubscribe {
  const q = query(collection(db, COLLECTIONS.JOBS), where('status', '==', 'disputed'), orderBy('disputedAt', 'desc'));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Job))));
}

// Admin-only (enforced by firestore.rules): resolves a dispute by writing a
// resolution note and moving the job to whatever status the admin decides
// (back to its previous status, completed, or cancelled).
export async function resolveDispute(jobId: string, resolutionNote: string, newStatus: JobStatus) {
  await updateDoc(doc(db, COLLECTIONS.JOBS, jobId), {
    status: newStatus,
    resolutionNote,
    resolvedAt: serverTimestamp(),
  });
}
