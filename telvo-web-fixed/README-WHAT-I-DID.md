# What I actually changed, and what you still need to do

I don't have internet access in this session (no `npm install`, no `firebase deploy`,
no ability to actually run or click through your live site). So I read your real
code end-to-end and fixed what was actually broken. Here's the honest rundown.

## The #1 bug — this is probably why messaging "doesn't work"

Your **security rules didn't match your actual database schema**. Your web app
(and presumably the Flutter app) writes chats/messages like this:

- `chats` collection: field is `participantIds`
- `messages` is its own **top-level** collection with `chatId`, `senderId`, `receiverId`

But `firestore.rules` was written for a *different* shape:
- `chats` expected a field called `participants` (not `participantIds`)
- `messages` was expected as a **subcollection** under each chat (`chats/{id}/messages`)

Firestore rules are strict — if a document doesn't match a rule, it falls through to
the default-deny rule at the bottom of the file. That means every message write from
the real app was **silently rejected by Firestore**, not by a bug in your React code.
Same story for a professional sending a quote before they're assigned to a job — the
old rule required `professionalId == you`, which isn't true yet when you're just
*sending* a quote.

Also missing entirely: a rule for the `donations` collection (falls through to
deny-all too), and the Firestore index for the chat list was sorting on the wrong
field (`updatedAt` instead of `lastMessageAt`), which would throw a "missing index"
error the first time anyone opened Messages.

**Fixed in `firebase-backend-fixes/firestore.rules` and `firestore.indexes.json`.**

## Real-time messaging — you already have it, it just couldn't write

You asked for "websocket for instant messaging." You don't need one — Firestore's
`onSnapshot` listeners (already used in `chatService.ts`) push new messages to every
connected client the moment they're written, same guarantee a websocket gives you,
plus automatic offline queuing and reconnection. Once the rules above are deployed,
messaging is instant on both web and app with zero extra infrastructure.

## Account features (web) — added

- **Delete account** — real flow: type "DELETE" to confirm, re-enter password if
  you signed up with email, then it soft-deletes your profile (so past jobs/reviews
  don't break) and permanently deletes your login. Added to Settings for customer,
  professional, *and* business (professionals and businesses had no Settings page
  or delete option at all before this).
- **Notification preferences** — used to reset on refresh (local state only). Now
  saved to and loaded from your Firestore profile.
- **Language switcher** — was decorative. Now actually calls `i18n.changeLanguage`
  and remembers your choice.
- Profile editing and photo upload were already real and working (Firebase Storage
  upload + Firestore update) — I didn't need to fix those, just confirmed it.

Files: `src/contexts/AuthContext.tsx`, `src/pages/shared/AccountSettings.tsx` (new,
replaces the old customer-only Settings page), `src/components/shared/DeleteAccountModal.tsx`
(new), `src/App.tsx` (routes), `src/types/index.ts`.

## Important: you have two different copies of the web app

`telvo-web.zip` and the `telvo-web/` folder inside `TELVO--main.zip` are **not the
same code** — they've drifted apart (different Settings page, different Navbar,
different AuthContext, etc). I fixed the standalone `telvo-web.zip` copy since it
looked like the newer one. Before you deploy, decide which one is actually live on
Vercel and delete the other so you stop losing fixes by editing the wrong copy.

## What I could NOT do here (needs your machine / your Firebase project)

- Run `npm install` or `npm run build` — no network access in this sandbox.
- Deploy anything — I don't have your Firebase CLI login.
- Touch the Flutter app (`lib/`, `android/`) — that's a second, much larger codebase;
  say the word and I'll go through it the same way in a follow-up.
- Verify against your real Firestore data — I only have the code, not the database.

### Commands to run yourself, in order

```bash
# 1. Deploy the fixed rules/indexes (from the TELVO--main repo root)
firebase deploy --only firestore:rules,firestore:indexes

# 2. Fix Storage CORS so profile photos actually load
gsutil cors set firebase-backend-fixes/storage.cors.json gs://telvo-452fd.appspot.com

# 3. Rebuild and redeploy the web app (you're already in this folder)
npm install
npm run build
vercel --prod   # or however you deploy today
```

## New this pass: features from your spec doc that were missing

Went through your own "Known Gaps" and "Recommended Features" list and built the
ones that fit inside the web app cleanly:

- **Dispute resolution** — customers and professionals both get a "Report a
  problem" button on an active job. It flags the job `disputed` (that status
  already existed in your types, just wasn't wired to anything) and shows up
  in a new **Admin → Disputes** queue, where an admin writes a resolution note
  and reopens / completes / cancels the job. Both parties see the outcome on
  the job page.
- **Review moderation** — new **Admin → Reviews** page to hide or restore
  reviews. Hidden reviews now actually disappear from public profile pages —
  there was no hide mechanism at all before this.
- **Category management** — new **Admin → Categories** page: add a category,
  or show/hide one, without a code deploy. Auto-seeds your current hardcoded
  category list into Firestore the first time you open it, so you're never
  starting from a blank page.
- **Configurable commission** — the 10% platform fee was hardcoded in three
  separate files (professional Earnings, Admin Analytics, Admin Overview).
  It's now one real setting under **Admin → Settings → Platform commission**
  that all three read from live.

## One more real bug found this pass

`firestore.rules` required a review's `customerId` field to match the
signed-in user before allowing the write — but `reviewService.ts` writes
`reviewerId`, not `customerId`. That field never existed on the document, so
**every review submission was being silently rejected**, same failure mode as
the messaging bug from before. Fixed in the rules file included here.

## Updated deploy steps

Same as before — the rules/indexes/CORS files in `firebase-backend-fixes.zip`
now include this review fix too:

```bash
firebase deploy --only firestore:rules,firestore:indexes
gsutil cors set firebase-backend-fixes/storage.cors.json gs://telvo-452fd.appspot.com
cd telvo-web-fixed && npm install && npm run build && vercel --prod   # if unzipped elsewhere, cd into this folder first
```

## Still not started

Map-based location picker / "near me" search, SEO-indexed professional
profile pages, referral program, in-app calling, SMS fallback, live MoMo/
Orange payment charging, and anything on the Flutter app side. Tell me which
one to go after next.

