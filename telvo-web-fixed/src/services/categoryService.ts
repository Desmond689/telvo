// src/services/categoryService.ts
import { addDoc, collection, doc, getDocs, orderBy, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase';
import type { ServiceCategory } from '@/types';

// Fallback categories shown if /categories hasn't been seeded yet in
// Firestore, so the site never renders empty. Real data always wins.
export const DEFAULT_CATEGORIES: ServiceCategory[] = [
  { id: 'plumbing', slug: 'plumbing', name: { en: 'Plumbing', fr: 'Plomberie' }, icon: 'Wrench', isActive: true, sortOrder: 1 },
  { id: 'electrical', slug: 'electrical', name: { en: 'Electrical', fr: 'Électricité' }, icon: 'Zap', isActive: true, sortOrder: 2 },
  { id: 'mechanics', slug: 'mechanics', name: { en: 'Mechanics', fr: 'Mécanique' }, icon: 'Car', isActive: true, sortOrder: 3 },
  { id: 'cleaning', slug: 'cleaning', name: { en: 'Cleaning', fr: 'Nettoyage' }, icon: 'Sparkles', isActive: true, sortOrder: 4 },
  { id: 'painting', slug: 'painting', name: { en: 'Painting', fr: 'Peinture' }, icon: 'Paintbrush', isActive: true, sortOrder: 5 },
  { id: 'construction', slug: 'construction', name: { en: 'Construction', fr: 'Construction' }, icon: 'HardHat', isActive: true, sortOrder: 6 },
  { id: 'carpentry', slug: 'carpentry', name: { en: 'Carpentry', fr: 'Menuiserie' }, icon: 'Hammer', isActive: true, sortOrder: 7 },
  { id: 'electronics', slug: 'electronics', name: { en: 'Electronics Repair', fr: 'Réparation électronique' }, icon: 'Smartphone', isActive: true, sortOrder: 8 },
  { id: 'ac_refrigeration', slug: 'ac-refrigeration', name: { en: 'AC & Refrigeration', fr: 'Climatisation & Froid' }, icon: 'Snowflake', isActive: true, sortOrder: 9 },
  { id: 'moving', slug: 'moving', name: { en: 'Moving', fr: 'Déménagement' }, icon: 'Truck', isActive: true, sortOrder: 10 },
  { id: 'beauty', slug: 'beauty', name: { en: 'Beauty', fr: 'Beauté' }, icon: 'Sparkle', isActive: true, sortOrder: 11 },
  { id: 'tech', slug: 'tech-services', name: { en: 'Tech Services', fr: 'Services Tech' }, icon: 'Laptop', isActive: true, sortOrder: 12 },
  { id: 'other', slug: 'other', name: { en: 'Other', fr: 'Autre' }, icon: 'MoreHorizontal', isActive: true, sortOrder: 13 },
];

export async function getCategories(): Promise<ServiceCategory[]> {
  try {
    const q = query(collection(db, COLLECTIONS.CATEGORIES), where('isActive', '==', true), orderBy('sortOrder', 'asc'));
    const snap = await getDocs(q);
    if (snap.empty) return DEFAULT_CATEGORIES;
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceCategory));
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

// ---- Admin management (see admin/Categories.tsx) ----
// Seeds real Firestore docs from DEFAULT_CATEGORIES the first time an admin
// opens the page against an empty /categories collection, so editing never
// starts from a blank slate.
export async function getAllCategoriesAdmin(): Promise<ServiceCategory[]> {
  const q = query(collection(db, COLLECTIONS.CATEGORIES), orderBy('sortOrder', 'asc'));
  let snap = await getDocs(q);
  if (snap.empty) {
    await seedDefaultCategories();
    snap = await getDocs(q);
  }
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceCategory));
}

export async function seedDefaultCategories(): Promise<void> {
  await Promise.all(
    DEFAULT_CATEGORIES.map((c) => setDoc(doc(db, COLLECTIONS.CATEGORIES, c.id), c, { merge: true }))
  );
}

export interface NewCategoryInput {
  name: { en: string; fr: string };
  slug: string;
  icon: string;
  sortOrder: number;
}

export async function createCategory(input: NewCategoryInput): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.CATEGORIES), { ...input, isActive: true });
  return ref.id;
}

export async function updateCategory(id: string, fields: Partial<ServiceCategory>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.CATEGORIES, id), fields as any);
}

export async function setCategoryActive(id: string, isActive: boolean): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.CATEGORIES, id), { isActive });
}
