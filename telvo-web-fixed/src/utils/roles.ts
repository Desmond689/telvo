import type { UserType } from '@/types';

export function dashboardHomeFor(userType: UserType): string {
  switch (userType) {
    case 'customer':
      return '/dashboard/customer';
    case 'professional':
      return '/dashboard/professional';
    case 'business':
      return '/dashboard/business';
    case 'admin':
      return '/dashboard/admin';
    default:
      return '/';
  }
}
