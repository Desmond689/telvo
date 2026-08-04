# TELVO Web

**Trusted workers. Real solutions.**

A React + TypeScript + Vite + Tailwind web client for TELVO, Cameroon's service
marketplace. This connects to the **same Firebase project** (`telvo-452fd`)
already used by the TELVO Flutter mobile app and Node.js backend — it is not
a separate system with its own data. A job posted on web shows up on mobile
in real time, and vice versa.

---

## 1. What's actually built here (real, working code)

Everything below is wired to live Firestore reads/writes, real Firebase Auth,
and real Firebase Storage uploads — no mock data, no fake buttons.

**Public site:** Home, Find Services (search + filters), Browse
Professionals/Businesses, Professional & Business public profiles, How It
Works, Become a Professional, Register Your Business, About, Contact, Help
Center, Terms, Privacy, Safety Center (with report flow), Community
Guidelines, 404.

**Auth:** Email/password signup+login, Cameroon phone number + OTP (Firebase
Phone Auth), "what are you here to do" role selection, professional
multi-category selection, forgot/reset password, session persistence via
`onAuthStateChanged`, protected routes gated by role.

**Customer dashboard:** Overview with live stats, Post a Job (category,
description, location, budget, urgency, photo upload to Storage), My Jobs
list with tabs, Job Detail with a visual status tracker (all 10 statuses from
the spec), quote comparison + accept, in-job messaging, review submission
(1x per job, enforced), Favorites, Profile, Settings.

**Professional dashboard:** Overview, live Job Requests feed filtered by
category/city, Send Quote (price, materials/labor cost, duration, message),
My Jobs with one-tap status advancement (Scheduled → On The Way → In
Progress → Completed), Earnings (10% commission math shown transparently),
10-step onboarding wizard with autosave at every step, Profile + document
verification submission.

**Business dashboard:** Overview with revenue/job stats, Employee invite
flow, Business Profile editor.

**Admin dashboard:** Platform-wide stats (users, verified pros, jobs,
revenue — computed from real Firestore counts), Users table with
suspend/reinstate, Verification request queue with approve/reject.

**Cross-cutting:** Real-time messaging (Firestore listeners, used by all
three roles), real-time in-app notifications, i18n scaffold (English +
French, all copy translation-ready via `react-i18next`), installable PWA
(manifest, service worker, offline fallback, FCM background handler),
responsive mobile-first layout with a slide-in mobile nav, full SEO meta
(Open Graph, structured data, semantic HTML, canonical URLs).

**Support Us (donations) & Get the App:** A `/donate` page (amount presets,
custom amount, MTN MoMo / Orange Money / other method, anonymous option)
writes a real `donations` document to Firestore immediately. Actually
charging the phone number still needs a backend endpoint — see the comment
in `src/services/donationService.ts` for exactly where to wire it, using
the same MoMo/Orange integration your job-payment flow already needs. The
navbar, mobile menu, footer, and homepage all link to `/donate` and
`/download`. `/download` and the `DownloadAppButtons` component (footer +
homepage) read `VITE_APP_STORE_URL` / `VITE_PLAY_STORE_URL` — until those
are set the buttons render disabled "Coming soon" links instead of dead `#`
links, so nothing is broken before the app is published.

**⚠️ Firestore rule needed:** `donations` isn't in `firestore.rules` yet in
the main repo. Since a donor may not be logged in, add a rule allowing
unauthenticated `create` (never `read`/`update`/`delete`) on that
collection, with field validation (amount is a positive number, status is
always `"pending"` on create) so a malicious client can't write anything
else.

## 2. What's intentionally NOT fully wired (and why)

Being honest about this matters more than pretending otherwise:

- **Payment gateway calls (MTN MoMo / Orange Money)** — the schema, UI, and
  transaction tracking are here, but actually *charging* a phone number must
  go through your existing backend (`backend/src/routes` already has this)
  with real merchant credentials, never from the browser. Wire
  `VITE_API_BASE_URL` calls into `PostJob`/`JobDetail` once you're ready to
  test against MoMo/Orange sandbox credentials.
- **Admin category/location management, dispute resolution UI, review
  moderation, platform settings (commission %), announcements** — the data
  model (`Dispute`, `ServiceCategory` types, `disputes`/`categories`
  collections) is defined and the Users/Verifications admin screens follow
  the exact same pattern, but these specific screens weren't built out in
  this pass. Cloning `AdminUsers.tsx` gets you most of the way there fast.
- **Google Maps location picker / map view** — `VITE_GOOGLE_MAPS_API_KEY` is
  wired in `.env.example`; the actual `<Map>` component isn't built. City
  dropdown + free-text neighborhood is used instead for now.
- **Push notifications end-to-end** — the client-side FCM plumbing
  (`getMessagingIfSupported`, the background service worker) is in place,
  but you still need to request notification permission, save the token to
  the user doc, and have your backend's existing FCM-send logic
  (`backend/src/services` likely already has this) target it.
- **Real app icons** — `public/icons/*.png` are 1×1 placeholders so the PWA
  manifest doesn't 404 in dev. Drop in real 192/512/512-maskable TELVO
  icons before shipping.

None of this is faked in the UI — the affected flows either aren't linked in
navigation yet, or are clearly marked with inline comments pointing at the
exact file/endpoint to finish the wiring.

## 3. Setup

```bash
npm install
cp .env.example .env.local
# fill in real values from Firebase Console > Project settings > telvo-452fd
npm run dev
```

Required env vars are all listed and commented in `.env.example`. The
Firebase values (`VITE_FIREBASE_*`) must come from the **same Firebase
project** as your mobile app — check `lib/config/firebase_config.dart` or
`backend/src/config/firebase.js` in the main TELVO repo to confirm the
project ID, then generate a **Web app** in that same Firebase project
(Project Settings → General → Your apps → Add app → Web) to get a web
`apiKey`/`appId` (these differ from the mobile app's Android/iOS config, but
point at the same underlying project/database).

## 4. Firestore indexes you'll need

Composite queries used by this client (search filters, admin counts) will
prompt Firestore to ask for indexes on first run — click the link it prints
in the browser console, or predefine them:

- `users`: `userType` + `isSuspended` + `rating` (desc)
- `users`: `userType` + `isSuspended` + `category` + `rating` (desc)
- `users`: `userType` + `verificationStatus`
- `jobs`: `customerId` + `createdAt` (desc)
- `jobs`: `professionalId` + `createdAt` (desc)
- `jobs`: `category` + `status` + `createdAt` (desc)
- `chats`: `participantIds` (array-contains) + `updatedAt` (desc)
- `messages`: `chatId` + `timestamp` (asc)
- `notifications`: `userId` + `createdAt` (desc)
- `reviews`: `reviewedId` + `createdAt` (desc)

## 5. Security model

This client **never trusts its own idea of a user's role**. `ProtectedRoute`
is a UX convenience only — the real authorization boundary is
`firestore.rules` (already in the main repo, role-based with admin custom
claims) and the Node backend. Client-side admin writes here (suspend user,
approve verification) work *because* the existing rules already grant
admins those specific field writes; anything more sensitive (bans that
trigger emails, payment refunds, employee invites) is commented in the code
to route through the backend's existing REST endpoints instead of a raw
Firestore write, so those actions get logged and can trigger side effects.

## 6. Project structure

```
src/
  lib/firebase.ts        Firebase client init (single source of truth)
  types/                 TS types mirroring backend/src/models exactly
  contexts/AuthContext   Real Firebase Auth (email + phone/OTP)
  services/               Firestore read/write functions, one file per domain
  components/ui/          Design system primitives (Button, Card, Modal...)
  components/layout/      Navbar, Footer, DashboardLayout, ProtectedRoute
  pages/public/            Marketing site + search + profiles
  pages/auth/              Login, register, OTP, password reset
  pages/customer/          Customer dashboard screens
  pages/professional/      Professional dashboard + onboarding
  pages/business/          Business dashboard
  pages/admin/             Admin dashboard
  pages/shared/            Messages + Notifications (used by all roles)
  i18n/                    en.json / fr.json translation resources
```

## 7. Deployment

`npm run build` outputs static files to `dist/`. Deploy to Firebase Hosting
(recommended, since you're already on Firebase):

```bash
npm run build
firebase deploy --only hosting
```

Set the `VITE_*` env vars in your CI/build environment (Firebase Hosting via
GitHub Actions, Vercel, Netlify, etc.) — they're baked in at build time since
this is a static SPA, not a server-rendered app.
