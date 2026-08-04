// src/services/donationService.ts
//
// Writes a donation record to Firestore immediately (so it shows up in an
// admin/finance view right away), then the backend picks it up to actually
// initiate the MTN MoMo / Orange Money charge or record a cash/bank
// transfer reference. Exactly like job payments, no payment secret ever
// touches the browser - see backend/src/routes for the existing MoMo/Orange
// integration to point this at (POST /donations/:id/charge, not built yet
// here - documented as the next wiring step).
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase';
import type { Donation, PaymentMethod } from '@/types';

export interface NewDonationInput {
  donorName: string;
  donorEmail?: string;
  amount: number;
  method: PaymentMethod;
  message?: string;
  isAnonymous: boolean;
}

export async function createDonation(input: NewDonationInput): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.DONATIONS), {
    donorName: input.isAnonymous ? 'Anonymous' : input.donorName,
    donorEmail: input.donorEmail ?? null,
    amount: input.amount,
    currency: 'XAF',
    method: input.method,
    message: input.message ?? null,
    isAnonymous: input.isAnonymous,
    status: 'pending' as const,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}
