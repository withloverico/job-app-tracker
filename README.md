# Job Application Tracker

A personal job application tracker with Google OAuth login, AI-powered job posting extraction, and a dark-mode dashboard. Built with React, Vite, Supabase, and the Claude API.

## Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Open the **SQL Editor** and run the following SQL in one paste:

```sql
-- Create applications table
CREATE TABLE applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  job_url text,
  company_name text NOT NULL,
  job_title text NOT NULL,
  location text,
  is_remote boolean DEFAULT false,
  salary_min integer,
  salary_max integer,
  salary_currency text,
  required_skills text[] DEFAULT '{}',
  nice_to_have_skills text[] DEFAULT '{}',
  application_deadline date,
  job_summary text,
  status text DEFAULT 'Bookmarked',
  notes text,
  date_applied date,
  follow_up_date date
);

-- Enable Row Level Security
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies: only the owning user can access their data
CREATE POLICY "Users can view own applications"
  ON applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications"
  ON applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications"
  ON applications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own applications"
  ON applications FOR DELETE
  USING (auth.uid() = user_id);
```

3. From your Supabase project dashboard, copy:
   - **Project URL** (Settings → API → Project URL)
   - **Anon public key** (Settings → API → `anon` `public`)
   - **Service role key** (Settings → API → `service_role` `secret`) — keep this secret, server-side only

### 2. Set Up Google OAuth

#### In Supabase:
1. Go to **Authentication → Providers → Google**
2. Enable the Google provider
3. Copy the **Callback URL** shown (looks like `https://<project-ref>.supabase.co/auth/v1/callback`)

#### In Google Cloud Console:
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use an existing one)
3. Go to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client IDs**
5. Application type: **Web application**
6. Under **Authorized redirect URIs**, add the Supabase callback URL you copied
7. After creating, copy the **Client ID** and **Client Secret**

#### Back in Supabase:
1. Paste the Google **Client ID** and **Client Secret** into the Google provider settings
2. Save

#### Add Redirect URLs:
1. In Supabase: **Authentication → URL Configuration**
2. Add your deployed URL (e.g. `https://your-app.vercel.app`) to **Redirect URLs**
3. Also add `http://localhost:5173` for local development

### 3. Environment Variables

Create a `.env.local` file in the project root:

```
ANTHROPIC_API_KEY=your_anthropic_api_key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

- `VITE_` prefixed variables are exposed to the client
- `SUPABASE_SERVICE_ROLE_KEY` and `ANTHROPIC_API_KEY` are server-side only (used by Vercel serverless functions)

### 4. Local Development

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

### 5. Deploy to Vercel

#### Option A: Via Vercel Dashboard
1. Push the repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
3. Add all four environment variables in the Vercel project settings
4. Deploy

#### Option B: Via CLI
```bash
npm i -g vercel
vercel deploy
```

Then set env vars in the Vercel dashboard under **Settings → Environment Variables**.

After deploying, add your Vercel URL to Supabase's **Authentication → URL Configuration → Redirect URLs**.

### 6. PWA / Add to Home Screen

The app is configured as an installable PWA:

- **iPhone Safari**: Open the app → tap the Share button → **Add to Home Screen**
- **Android Chrome**: Open the app → tap the install banner or menu → **Install app**

To replace the placeholder icons, swap the files at:
- `public/icons/icon-192x192.png` (192x192)
- `public/icons/icon-512x512.png` (512x512)

## Architecture

```
src/
├── components/       # Reusable UI components
├── hooks/            # Auth and data hooks
├── lib/              # Supabase client, API client, duplicate detection
├── pages/            # Login, Dashboard, JobDetail
└── types/            # TypeScript interfaces

api/
├── _lib/auth.ts      # JWT verification helper
├── parse-job.ts      # POST /api/parse-job (Claude AI extraction)
└── applications/
    ├── index.ts      # GET/POST /api/applications
    └── [id].ts       # PATCH/DELETE /api/applications/:id
```

## Features

- **Google OAuth** via Supabase Auth — single sign-in, session managed client-side
- **AI Auto-Fill** — paste a job URL, Claude extracts company, title, skills, salary, etc.
- **Duplicate Detection** — warns if you've already added the same role (URL or company+title match)
- **Dashboard** — card and table views, search, filter by status, sort
- **Job Detail** — click-to-edit fields, auto-saving notes, status management
- **8 Status Stages** — Bookmarked → Applied → Phone Screen → Interview → Final Round → Offer → Rejected → Withdrawn
- **Dark Mode** — dark navy/slate theme with indigo accents
- **PWA** — installable, works in standalone mode on mobile
- **Keyboard Shortcut** — Cmd+K / Ctrl+K opens the Add Job modal
