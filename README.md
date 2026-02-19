# Smart Bookmarks 🔖

A full-stack bookmark manager with **Google OAuth**, **real-time sync**, and a premium dark UI — built with Next.js 14, Supabase, and Tailwind CSS.

# URL

https://smart-bookmark-app-iota-liard.vercel.app/

## Features

- 🔐 **Google OAuth** — one-click sign-in via Supabase Auth
- 📌 **Add & delete bookmarks** — title + URL, stored privately per user
- ⚡ **Real-time updates** — Supabase Realtime pushes changes instantly across tabs
- 🔒 **Row-Level Security** — users can only access their own data
- 🌙 **Dark glassmorphism UI** — premium design with smooth animations
- 🚀 **Vercel-ready** — deploy in minutes

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 |
| Backend/DB | Supabase (Postgres + Auth + Realtime) |
| Deployment | Vercel |

---

## Setup

### 1. Supabase Project

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of [`supabase-schema.sql`](./supabase-schema.sql)
3. Go to **Authentication → Providers → Google** and enable Google OAuth
   - You'll need a Google Cloud OAuth 2.0 Client ID & Secret ([guide](https://supabase.com/docs/guides/auth/social-login/auth-google))
4. Go to **Authentication → URL Configuration** and add:
   - Site URL: `http://localhost:3000` (for local) or your Vercel URL
   - Redirect URL: `http://localhost:3000/auth/callback`

### 2. Environment Variables

Copy `.env.local` and fill in your values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Find these in **Supabase → Project Settings → API**.

### 3. Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel

1. Push this repo to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Add the two environment variables in Vercel's project settings
4. After deployment, add your Vercel URL to Supabase's allowed redirect URLs

---

## Problems & Solutions

### Challenge 1: Cross-tab Realtime Sync Failed
**The Issue:**
Supabase Realtime status showed `SUBSCRIBED`, but events weren't triggering updates in other tabs.
- **Attempt 1 (RLS Filter):** Tried filtering `user_id=eq.UUID` in the subscription. Failed because `postgres_changes` filters require `REPLICA IDENTITY FULL` on the table to see column values in `DELETE` events.
- **Attempt 2 (Global Subscription):** Removed the filter to listen to all events. Still failed intermittently due to `supabse_realtime` publication config issues on the server side.

**The Solution (Multi-Layer Strategy):**
1. **Broadcast Channel (Primary Fallback):** Implemented a client-side "shout" mechanism. When a user adds/deletes a bookmark, the client sends a `broadcast` event to other tabs. This bypasses the database log entirely and is instant.
2. **Database Realtime (Secondary):** Kept the Postgres change listener as a backupsource of truth.

### Challenge 2: Instant Feedback (Optimistic UI)
**The Issue:**
Waiting for the round-trip to Supabase made the UI feel sluggish.
**The Solution:**
Implemented **Optimistic UI**. Bookmarks are added/removed from the local state *immediately* before the network request starts. If the request fails, the change is rolled back and an error is shown.

### Challenge 3: Google OAuth `redirect_uri_mismatch`
**The Issue:**
Google returned a 400 error during sign-in.
**The Solution:**
Registered the **Supabase Callback URL** (`https://<project-ref>.supabase.co/auth/v1/callback`) in Google Cloud Console, *not* the localhost URL.

### Challenge 4: OAuth redirect URL misconfiguration
**The Issue:**
I was redirecting it to localhost.
**The Solution:**
Registered the **site URL** with vercel url in supabase url configuration.


---

## Project Structure

```
src/
├── app/
│   ├── auth/callback/route.ts   # OAuth callback handler
│   ├── dashboard/page.tsx       # Protected dashboard (server component)
│   ├── login/page.tsx           # Login page with Google sign-in
│   ├── layout.tsx               # Root layout with Inter font
│   ├── globals.css              # Global styles
│   └── page.tsx                 # Root redirect
├── components/
│   ├── BookmarkManager.tsx      # Main client component (realtime + CRUD)
│   └── BookmarkCard.tsx         # Individual bookmark card
├── lib/supabase/
│   ├── client.ts                # Browser Supabase client
│   ├── server.ts                # Server Supabase client
│   └── middleware.ts            # Session refresh middleware helper
└── middleware.ts                # Next.js middleware entry point
```
