// src/types/index.ts
//
// These types mirror backend/src/models/*.js field-for-field so the web
// client reads/writes documents in the exact shape the Node backend and
// Flutter app already expect. If you add a field here, add it there too.

export type UserType = 'customer' | 'professional' | 'business' | 'admin';
export type UserMode = 'customer' | 'professional' | 'business';

export interface AvailabilitySchedule {
  [day: string]: { start: string; end: string; available: boolean } | undefined;
}

export interface TelvoUser {
  id: string;
  phoneNumber?: string;
  email?: string;
  fullName: string;
  profilePhoto?: string;
  city?: string;
  neighborhood?: string;
  language?: 'en' | 'fr';
  userType: UserType;
  mode?: UserMode;
  isVerified: boolean;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  isIdVerified: boolean;
  isSelfieVerified: boolean;
  trustedContacts: string[];
  createdAt: any;
  lastActive: any;
  isOnline: boolean;
  fcmToken?: string;

  // Professional-specific fields
  category?: string;
  skills?: string[];
  yearsOfExperience?: number;
  description?: string;
  serviceAreas?: string[];
  portfolioPhotos?: string[];
  certificates?: string[];
  availabilitySchedule?: AvailabilitySchedule;
  emergencyServices?: boolean;
  rating: number;
  jobsCompleted: number;
  responseRate: number;
  responseTime: number;

  // Business-specific fields
  businessName?: string;
  businessDescription?: string;
  businessLogo?: string;
  businessCategory?: string;
  openingHours?: AvailabilitySchedule;
  website?: string;
  employeeIds?: string[];

  favorites: string[];
  blockedUsers: string[];
  isSuspended?: boolean;
  isBanned?: boolean;
  isDeleted?: boolean;
  deletedAt?: any;
  notificationPrefs?: { jobs: boolean; messages: boolean; marketing: boolean };
}

export type JobUrgency = 'flexible' | 'normal' | 'urgent' | 'emergency';

export type JobStatus =
  | 'posted' // Request Created
  | 'quoted' // Quote Received
  | 'accepted' // Quote Accepted
  | 'scheduled' // Job Scheduled
  | 'on_the_way' // Professional On The Way
  | 'in_progress' // Work Started
  | 'completed' // Work Completed
  | 'confirmed' // Customer Confirmed
  | 'paid' // Payment Completed
  | 'reviewed' // Review Submitted
  | 'cancelled'
  | 'disputed';

export interface Quote {
  id: string;
  professionalId: string;
  price: number;
  materialsCost?: number;
  laborCost?: number;
  estimatedDuration: string;
  message: string;
  createdAt: any;
  status: 'pending' | 'accepted' | 'declined';
}

export interface Job {
  id: string;
  customerId: string;
  professionalId?: string;
  businessId?: string;
  category: string;
  serviceType: string;
  title?: string;
  description: string;
  photos: string[];
  voiceNote?: string;
  budget?: number;
  urgency: JobUrgency;
  status: JobStatus;
  address: string;
  latitude?: number;
  longitude?: number;
  createdAt: any;
  scheduledDate?: any;
  completedDate?: any;
  quotes: Quote[];
  acceptedQuoteId?: string;
  paymentMethod?: 'cash' | 'mtn_momo' | 'orange_money';
  isPaid: boolean;
  finalPrice?: number;
  review?: string;
  isEmergency: boolean;
  isRecurring: boolean;
  recurringFrequency?: string;
  disputeReason?: string;
  disputedBy?: string;
  disputedAt?: any;
  previousStatus?: JobStatus;
  resolutionNote?: string;
  resolvedAt?: any;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  message: string;
  type: 'text' | 'image' | 'system';
  mediaUrl?: string;
  timestamp: any;
  isRead: boolean;
  isDelivered: boolean;
  isSeen: boolean;
}

export interface ChatThread {
  id: string;
  participantIds: string[];
  user1Id?: string;
  user2Id?: string;
  jobId?: string;
  lastMessage?: string;
  lastMessageAt?: any;
  lastMessageTime?: any;
  unreadCount?: Record<string, number>;
}

export interface Review {
  id: string;
  jobId: string;
  reviewerId: string;
  reviewedId: string;
  rating: number;
  comment: string;
  photos: string[];
  videos: string[];
  ratings: Record<string, number>;
  isAnonymous: boolean;
  isHidden?: boolean;
  hiddenReason?: string;
  createdAt: any;
  updatedAt: any;
  isResponse: boolean;
  responseText?: string;
  responseAt?: any;
}

export type PaymentMethod = 'cash' | 'mtn_momo' | 'orange_money';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  jobId: string;
  customerId: string;
  professionalId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  reference?: string;
  platformFee?: number;
  professionalEarnings?: number;
  metadata?: Record<string, unknown>;
  createdAt: any;
  completedAt?: any;
  refundedAt?: any;
  refundReason?: string;
}

export type NotificationType =
  | 'new_request'
  | 'new_quote'
  | 'quote_accepted'
  | 'quote_rejected'
  | 'new_message'
  | 'job_status'
  | 'payment'
  | 'review'
  | 'verification'
  | 'system';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, unknown>;
  actionUrl?: string;
  isRead: boolean;
  isSent: boolean;
  createdAt: any;
  sentAt?: any;
}

export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'closed';
export type DisputeReason = 'job_quality' | 'payment' | 'no_show' | 'miscommunication' | 'other';

export interface Dispute {
  id: string;
  jobId: string;
  raisedById: string;
  againstId: string;
  reason: DisputeReason;
  description: string;
  status: DisputeStatus;
  evidence: string[];
  resolution?: string;
  createdAt: any;
  resolvedAt?: any;
}

export interface ServiceCategory {
  id: string;
  name: { en: string; fr: string };
  slug: string;
  icon: string;
  description?: { en: string; fr: string };
  isActive: boolean;
  sortOrder: number;
}

export type DonationStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Donation {
  id: string;
  donorName: string;
  donorEmail?: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  message?: string;
  isAnonymous: boolean;
  status: DonationStatus;
  transactionId?: string;
  createdAt: any;
}

// ---- App Management (admin-controlled APK release info) ----
// Firestore: app_config/latest_app - written only by admins, read publicly
// so the Download page and (in future) the mobile app's in-app update
// check can both consume it without a code deploy.
export interface AppConfig {
  version: string;
  versionCode: number;
  apkUrl: string;
  apkSizeBytes?: number;
  releaseNotes: string;
  updatedAt: any;
}

// ---- Support / Donate settings (admin-controlled) ----
// Firestore: settings/support - written only by admins, read publicly so
// the Support/Donate page never has a hardcoded phone number in source.
export interface SupportSettings {
  ownerName: string;
  momoNumber: string;
  provider: 'MTN' | 'Orange';
  message: string;
  updatedAt: any;
}

export interface PlatformSettings {
  commissionRate: number; // 0.10 = 10%
  updatedAt: any;
}

export const CAMEROON_CITIES = [
  'Yaoundé',
  'Douala',
  'Buea',
  'Limbe',
  'Bamenda',
  'Bafoussam',
  'Kribi',
  'Garoua',
] as const;

export const JOB_STATUS_ORDER: JobStatus[] = [
  'posted',
  'quoted',
  'accepted',
  'scheduled',
  'on_the_way',
  'in_progress',
  'completed',
  'confirmed',
  'paid',
  'reviewed',
];
