# TELVO Web — Modernity, UX, Accessibility & Security updates

This pass focuses on **modern feel**, **user experience**, **accessibility (a11y)**, and **security hardening**. Backend/Firestore rule fixes from the previous pass remain intact.

## Modernity

- Stronger focus rings and consistent interactive states on buttons, inputs, and links
- Backdrop-blur sticky header, smoother card interactions (`.card-interactive` utility)
- Safe-area padding for notched phones (`safe-top` / `safe-bottom`)
- `prefers-reduced-motion` respected globally (animations/transitions disabled when requested)
- Slightly refined Tailwind tokens (soft shadow, font stack)
- Login and nav polish for a cleaner, more contemporary feel

## User experience

- Skip-to-content links on public + dashboard layouts
- Mobile menus close on Escape; drawers prevent body scroll while open
- Modal: focus trap, restore focus on close, Escape to dismiss, proper `role="dialog"`
- Toast component (`src/components/ui/Toast.tsx`) for non-blocking success/error feedback
- Login form: proper `autoComplete`, `inputMode`, trimmed email, clearer error region
- Loading buttons announce “Loading” to assistive tech (`aria-busy` + screen-reader text)

## Accessibility

- **Skip links** → jump to `#main-content` / `#dashboard-main`
- Form controls (`Input`, `Select`, `Textarea`):
  - Stable `useId()` ids
  - `aria-invalid`, `aria-describedby` wired to error/hint
  - Errors use `role="alert"`
  - Required fields marked with visible `*` + `aria-hidden` on the star
- Buttons: `type="button"` default, `aria-busy` / `aria-disabled` when loading
- Modal: `aria-modal`, `aria-labelledby`, focus trap, return focus
- Navbar & dashboard: `aria-expanded`, `aria-controls`, `aria-label` on icon buttons
- Visible `:focus-visible` styles (never remove keyboard focus without replacement)
- Decorative icons marked `aria-hidden="true"`

## Security

### HTTP security headers (`vercel.json`)

Deployed automatically on Vercel:

| Header | Purpose |
|--------|---------|
| `Content-Security-Policy` | Restrict scripts, styles, images, connections (Firebase/Google allowed) |
| `Strict-Transport-Security` | Force HTTPS (2 years, includeSubDomains, preload) |
| `X-Frame-Options: DENY` | Block clickjacking |
| `X-Content-Type-Options: nosniff` | Prevent MIME sniffing |
| `Referrer-Policy` | Limit referrer leakage |
| `Permissions-Policy` | Disable camera/mic; geolocation only self |

Long-lived cache on `/assets/*` for performance.

### Still enforced by design (unchanged, important)

- Real authorization lives in **Firestore rules** + backend — client `ProtectedRoute` is UX only
- No secrets in the client bundle beyond public Firebase config
- Soft-delete + re-auth for account deletion (previous pass)

## How to use the new Toast

```tsx
import { useState } from 'react';
import { Toast } from '@/components/ui/Toast';

const [toast, setToast] = useState<{ open: boolean; message: string; tone?: 'success' | 'error' | 'info' }>({
  open: false,
  message: '',
});

// after a successful action:
setToast({ open: true, message: 'Job posted successfully', tone: 'success' });

// in JSX:
<Toast
  open={toast.open}
  message={toast.message}
  tone={toast.tone}
  onClose={() => setToast((t) => ({ ...t, open: false }))}
/>
```

## Deploy

```bash
cd telvo-web-fixed
npm install
npm run build
# Vercel (headers come from vercel.json)
vercel --prod

# If you still need the previous backend fixes:
firebase deploy --only firestore:rules,firestore:indexes
gsutil cors set firebase-backend-fixes/storage.cors.json gs://telvo-452fd.appspot.com
```

## What was deliberately not changed in this pass

- Map / “near me” search
- Live MoMo / Orange Money charging
- Full dark mode
- New npm packages (stayed within existing React + Tailwind + Lucide stack)

Tell me the next priority (maps, payments, SEO profiles, referral program, etc.) and we can go after it.
