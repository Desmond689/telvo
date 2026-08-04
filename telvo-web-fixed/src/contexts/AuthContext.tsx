// src/contexts/AuthContext.tsx
//
// Real Firebase Authentication - no mock/demo users. Supports:
//  - Email + password
//  - Cameroon phone number + OTP (Firebase Phone Auth, invisible reCAPTCHA)
//  - Live Firestore listener on /users/{uid} so role, verification status,
//    and profile fields update in real time everywhere in the app.

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  type ConfirmationResult,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, deleteField, serverTimestamp } from 'firebase/firestore';
import { auth, db, COLLECTIONS } from '@/lib/firebase';
import type { TelvoUser, UserType } from '@/types';

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  profile: TelvoUser | null;
  loading: boolean;
  error: string | null;
  signUpWithEmail: (email: string, password: string, fullName: string, userType: UserType) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  startPhoneSignIn: (phoneNumber: string, recaptchaContainerId: string) => Promise<ConfirmationResult>;
  confirmPhoneOtp: (confirmation: ConfirmationResult, otp: string, fullName?: string, userType?: UserType) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (fields: Record<string, unknown>) => Promise<void>;
  deleteAccount: (password?: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Cameroon phone numbers: +237 6XXXXXXXX (9 digits after country code)
export function normalizeCameroonPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('237')) return `+${digits}`;
  if (digits.startsWith('6') && digits.length === 9) return `+237${digits}`;
  return `+${digits}`;
}

function normalizeUserType(userType?: string): UserType | undefined {
  if (!userType) return undefined;
  return userType.toLowerCase() as UserType;
}

async function ensureUserDoc(uid: string, data: Partial<TelvoUser>) {
  const normalizedUserType = normalizeUserType(data.userType as string | undefined);
  const normalizedMode = normalizeUserType(data.mode as string | undefined) ?? normalizedUserType;
  const ref = doc(db, COLLECTIONS.USERS, uid);
  await setDoc(
    ref,
    {
      id: uid,
      isVerified: false,
      isPhoneVerified: false,
      isEmailVerified: false,
      isIdVerified: false,
      isSelfieVerified: false,
      trustedContacts: [],
      isOnline: true,
      rating: 0,
      jobsCompleted: 0,
      responseRate: 0,
      responseTime: 0,
      favorites: [],
      blockedUsers: [],
      isSuspended: false,
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      ...data,
      userType: normalizedUserType,
      mode: normalizedMode,
    },
    { merge: true }
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<TelvoUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        setProfile(null);
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    const ref = doc(db, COLLECTIONS.USERS, firebaseUser.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setProfile(snap.exists() ? ({ id: snap.id, ...snap.data() } as TelvoUser) : null);
        setLoading(false);
      },
      (err) => {
        console.error('[TELVO] Failed to load user profile:', err);
        setError('We could not load your profile. Please refresh the page.');
        setLoading(false);
      }
    );
    return unsub;
  }, [firebaseUser]);

  const clearError = useCallback(() => setError(null), []);

  const signUpWithEmail = useCallback(async (email: string, password: string, fullName: string, userType: UserType) => {
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await ensureUserDoc(cred.user.uid, {
        email,
        fullName,
        userType: userType.toLowerCase() as UserType,
        mode: userType === 'admin' ? undefined : (userType.toLowerCase() as UserType),
      });
    } catch (e: any) {
      setError(mapAuthError(e?.code));
      throw e;
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      setError(mapAuthError(e?.code));
      throw e;
    }
  }, []);

  const startPhoneSignIn = useCallback(async (phoneNumber: string, recaptchaContainerId: string) => {
    setError(null);
    try {
      const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, { size: 'invisible' });
      const formatted = normalizeCameroonPhone(phoneNumber);
      return await signInWithPhoneNumber(auth, formatted, verifier);
    } catch (e: any) {
      setError(mapAuthError(e?.code));
      throw e;
    }
  }, []);

  const confirmPhoneOtp = useCallback(
    async (confirmation: ConfirmationResult, otp: string, fullName?: string, userType?: UserType) => {
      setError(null);
      try {
        const cred = await confirmation.confirm(otp);
        const resolvedType = (userType ?? 'customer').toLowerCase() as UserType;
        await ensureUserDoc(cred.user.uid, {
          phoneNumber: cred.user.phoneNumber ?? undefined,
          isPhoneVerified: true,
          ...(fullName ? { fullName } : {}),
          userType: resolvedType,
          mode: resolvedType === 'admin' ? undefined : resolvedType,
        });
      } catch (e: any) {
        setError(mapAuthError(e?.code));
        throw e;
      }
    },
    []
  );

  const resetPassword = useCallback(async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (e: any) {
      setError(mapAuthError(e?.code));
      throw e;
    }
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  // Generic profile field updater used by every "edit profile" / "settings"
  // screen (customer, professional, business) so they all write through the
  // same path instead of duplicating updateDoc calls everywhere.
  const updateProfile = useCallback(
    async (fields: Record<string, unknown>) => {
      if (!firebaseUser) throw new Error('Not signed in.');
      const normalizedFields = { ...fields };
      if (fields.userType && typeof fields.userType === 'string') {
        normalizedFields.userType = fields.userType.toLowerCase();
      }
      if (fields.mode && typeof fields.mode === 'string') {
        normalizedFields.mode = fields.mode.toLowerCase();
      }
      await updateDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), normalizedFields as any);
    },
    [firebaseUser]
  );

  // Deletes the signed-in user's account for good.
  // 1. Re-authenticates (Firebase requires a "recent login" to delete an
  //    account; password is required for email/password accounts, phone
  //    accounts rely on the existing session being recent enough).
  // 2. Soft-deletes the Firestore profile first (so job/review/message
  //    history keeps a valid, anonymized author instead of a dangling
  //    reference), then hard-deletes the Firebase Auth user.
  const deleteAccount = useCallback(
    async (password?: string) => {
      if (!firebaseUser) throw new Error('Not signed in.');
      setError(null);
      try {
        if (password && firebaseUser.email) {
          const credential = EmailAuthProvider.credential(firebaseUser.email, password);
          await reauthenticateWithCredential(firebaseUser, credential);
        }

        await updateDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
          isDeleted: true,
          isSuspended: true,
          fullName: 'Deleted user',
          profilePhoto: deleteField(),
          description: deleteField(),
          favorites: [],
          deletedAt: serverTimestamp(),
        });

        await deleteUser(firebaseUser);
      } catch (e: any) {
        if (e?.code === 'auth/requires-recent-login') {
          setError('For your security, please re-enter your password to delete your account.');
        } else {
          setError(mapAuthError(e?.code));
        }
        throw e;
      }
    },
    [firebaseUser]
  );

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        loading,
        error,
        signUpWithEmail,
        signInWithEmail,
        startPhoneSignIn,
        confirmPhoneOtp,
        resetPassword,
        signOut,
        updateProfile,
        deleteAccount,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

function mapAuthError(code?: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account already exists with this email.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Your password should be at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/invalid-phone-number':
      return 'Please enter a valid Cameroon phone number.';
    case 'auth/invalid-verification-code':
      return 'That code is incorrect. Please check and try again.';
    case 'auth/code-expired':
      return 'That code has expired. Please request a new one.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
