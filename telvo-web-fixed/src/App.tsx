import { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { PublicLayout } from './components/layout/PublicLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { DashboardLayout, type NavItem } from './components/layout/DashboardLayout';
import { PageSpinner } from './components/ui/Spinner';

import { Home } from './pages/public/Home';
import { FindServices } from './pages/public/FindServices';
import { Browse } from './pages/public/Browse';
import { ProfessionalProfile } from './pages/public/ProfessionalProfile';
import { BusinessProfile } from './pages/public/BusinessProfile';
import { HowItWorks } from './pages/public/HowItWorks';
import { BecomeAProfessional } from './pages/public/BecomeAProfessional';
import { RegisterBusiness } from './pages/public/RegisterBusiness';
import { About } from './pages/public/About';
import { Contact } from './pages/public/Contact';
import { HelpCenter } from './pages/public/HelpCenter';
import { Terms } from './pages/public/Terms';
import { Privacy } from './pages/public/Privacy';
import { Safety } from './pages/public/Safety';
import { CommunityGuidelines } from './pages/public/CommunityGuidelines';
import { Donate } from './pages/public/Donate';
import { Download } from './pages/public/Download';
import { NotFound } from './pages/public/NotFound';

import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { PhoneLogin } from './pages/auth/PhoneLogin';
import { ForgotPassword } from './pages/auth/ForgotPassword';

import { CustomerOverview } from './pages/customer/Overview';
import { PostJob } from './pages/customer/PostJob';
import { MyJobs } from './pages/customer/MyJobs';
import { JobDetail } from './pages/customer/JobDetail';
import { Favorites } from './pages/customer/Favorites';
import { CustomerProfile } from './pages/customer/Profile';
import { AccountSettings } from './pages/shared/AccountSettings';

import { ProfessionalOverview } from './pages/professional/Overview';
import { Requests } from './pages/professional/Requests';
import { SendQuote } from './pages/professional/SendQuote';
import { ProfessionalMyJobs } from './pages/professional/MyJobs';
import { Earnings } from './pages/professional/Earnings';
import { Onboarding } from './pages/professional/Onboarding';
import { ProfessionalProfileEdit } from './pages/professional/Profile';

import { BusinessOverview } from './pages/business/Overview';
import { Employees } from './pages/business/Employees';
import { BusinessProfileEdit } from './pages/business/Profile';

import { AdminOverview } from './pages/admin/Overview';
import { AdminUsers } from './pages/admin/Users';
import { AdminVerifications } from './pages/admin/Verifications';
import { AdminAnalytics } from './pages/admin/Analytics';
import { AppManagement } from './pages/admin/AppManagement';
import { AdminSettings } from './pages/admin/Settings';
import { AdminDisputes } from './pages/admin/Disputes';
import { AdminCategories } from './pages/admin/Categories';
import { AdminReviews } from './pages/admin/Reviews';

import { Messages } from './pages/shared/Messages';
import { Notifications } from './pages/shared/Notifications';

import {
  LayoutDashboard, Search, Briefcase, FileText, MessageSquare, CreditCard, Heart, Star, Bell, User, Settings as SettingsIcon,
  Inbox, Wallet, Image, Calendar, ShieldCheck, Users as UsersIcon, Building2, BarChart3,
  Smartphone, Settings as SettingsIcon2, ShieldAlert, Layers, MessageSquareWarning,
} from 'lucide-react';

const customerNav: NavItem[] = [
  { to: '/dashboard/customer', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/find-services', label: 'Find Services', icon: Search },
  { to: '/dashboard/customer/jobs', label: 'My Jobs', icon: Briefcase },
  { to: '/dashboard/customer/post-job', label: 'Post a Job', icon: FileText },
  { to: '/dashboard/customer/messages', label: 'Messages', icon: MessageSquare },
  { to: '/dashboard/customer/favorites', label: 'Favorites', icon: Heart },
  { to: '/dashboard/customer/notifications', label: 'Notifications', icon: Bell },
  { to: '/dashboard/customer/profile', label: 'Profile', icon: User },
  { to: '/dashboard/customer/settings', label: 'Settings', icon: SettingsIcon },
];

const professionalNav: NavItem[] = [
  { to: '/dashboard/professional', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/professional/requests', label: 'Job Requests', icon: Inbox },
  { to: '/dashboard/professional/jobs', label: 'My Jobs', icon: Briefcase },
  { to: '/dashboard/professional/messages', label: 'Messages', icon: MessageSquare },
  { to: '/dashboard/professional/earnings', label: 'Earnings', icon: Wallet },
  { to: '/dashboard/professional/onboarding', label: 'Onboarding', icon: Calendar },
  { to: '/dashboard/professional/profile', label: 'Profile & Verification', icon: ShieldCheck },
  { to: '/dashboard/professional/notifications', label: 'Notifications', icon: Bell },
  { to: '/dashboard/professional/settings', label: 'Settings', icon: SettingsIcon },
];

const businessNav: NavItem[] = [
  { to: '/dashboard/business', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/business/employees', label: 'Employees', icon: UsersIcon },
  { to: '/dashboard/business/messages', label: 'Messages', icon: MessageSquare },
  { to: '/dashboard/business/profile', label: 'Business Profile', icon: Building2 },
  { to: '/dashboard/business/notifications', label: 'Notifications', icon: Bell },
  { to: '/dashboard/business/settings', label: 'Settings', icon: SettingsIcon },
];

const adminNav: NavItem[] = [
  { to: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/admin/users', label: 'Users', icon: UsersIcon },
  { to: '/dashboard/admin/verifications', label: 'Verifications', icon: ShieldCheck },
  { to: '/dashboard/admin/disputes', label: 'Disputes', icon: ShieldAlert },
  { to: '/dashboard/admin/reviews', label: 'Reviews', icon: MessageSquareWarning },
  { to: '/dashboard/admin/categories', label: 'Categories', icon: Layers },
  { to: '/dashboard/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/dashboard/admin/app-management', label: 'App Management', icon: Smartphone },
  { to: '/dashboard/admin/settings', label: 'Settings', icon: SettingsIcon2 },
];

export default function App() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        {/* Public site */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/find-services" element={<FindServices />} />
          <Route path="/professionals" element={<Browse userType="professional" />} />
          <Route path="/businesses" element={<Browse userType="business" />} />
          <Route path="/professional/:id" element={<ProfessionalProfile />} />
          <Route path="/business/:id" element={<BusinessProfile />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/become-a-professional" element={<BecomeAProfessional />} />
          <Route path="/register-business" element={<RegisterBusiness />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/safety" element={<Safety />} />
          <Route path="/community-guidelines" element={<CommunityGuidelines />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/download" element={<Download />} />
        </Route>

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/login/phone" element={<PhoneLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Customer dashboard */}
        <Route element={<ProtectedRoute allow={['customer']} />}>
          <Route path="/dashboard/customer" element={<DashboardLayout navItems={customerNav} roleLabel="Customer" />}>
            <Route index element={<CustomerOverview />} />
            <Route path="post-job" element={<PostJob />} />
            <Route path="jobs" element={<MyJobs />} />
            <Route path="jobs/:id" element={<JobDetail />} />
            <Route path="messages" element={<Messages />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<CustomerProfile />} />
            <Route path="settings" element={<AccountSettings />} />
          </Route>
        </Route>

        {/* Professional dashboard */}
        <Route element={<ProtectedRoute allow={['professional']} />}>
          <Route path="/dashboard/professional" element={<DashboardLayout navItems={professionalNav} roleLabel="Professional" />}>
            <Route index element={<ProfessionalOverview />} />
            <Route path="requests" element={<Requests />} />
            <Route path="requests/:id" element={<SendQuote />} />
            <Route path="jobs" element={<ProfessionalMyJobs />} />
            <Route path="messages" element={<Messages />} />
            <Route path="earnings" element={<Earnings />} />
            <Route path="onboarding" element={<Onboarding />} />
            <Route path="profile" element={<ProfessionalProfileEdit />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<AccountSettings />} />
          </Route>
        </Route>

        {/* Business dashboard */}
        <Route element={<ProtectedRoute allow={['business']} />}>
          <Route path="/dashboard/business" element={<DashboardLayout navItems={businessNav} roleLabel="Business" />}>
            <Route index element={<BusinessOverview />} />
            <Route path="employees" element={<Employees />} />
            <Route path="messages" element={<Messages />} />
            <Route path="profile" element={<BusinessProfileEdit />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<AccountSettings />} />
          </Route>
        </Route>

        {/* Admin dashboard */}
        <Route element={<ProtectedRoute allow={['admin']} />}>
          <Route path="/dashboard/admin" element={<DashboardLayout navItems={adminNav} roleLabel="Administrator" />}>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="verifications" element={<AdminVerifications />} />
            <Route path="disputes" element={<AdminDisputes />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="app-management" element={<AppManagement />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
