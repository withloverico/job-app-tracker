# Job Application Tracker

A glassmorphism-styled job application tracker with AI-powered job posting extraction, Google OAuth, and a frosted glass UI. Paste a job URL and let Claude parse the title, company, salary, equity, and resume-ready skills automatically.

**Live:** [jobtracker.withloverico.me](https://jobtracker.withloverico.me)

## Features

- **AI Job Parsing** — Paste a URL, Claude extracts company, title, location, salary, equity, skills, and summary
- **JSON-LD Extraction** — Pulls structured `JobPosting` schema data from pages before falling back to plain text
- **Resume-Ready Skills** — Required and nice-to-have skills are output as concrete tools/technologies for your resume, with inferred bonus skills
- **Glassmorphism Design** — Frosted glass UI with layered blur, gradient reflections, and depth
- **Google OAuth** — Supabase Auth with one-click sign-in
- **Card + Table Views** — Toggle between visual cards and data table
- **Flip Card Modals** — Click a card to flip-reveal full details with 3D CSS animation
- **Status Tracking** — 8 stages (Bookmarked, Applied, Phone Screen, Interview, Final Round, Offer, Rejected, Withdrawn) with full status change history and notes
- **Custom UI Components** — All dropdowns and date pickers are portal-based with frost styling (no native browser UI)
- **Duplicate Detection** — Warns if you add the same role twice (URL or company+title match)
- **Keyboard Shortcut** — `Cmd+K` / `Ctrl+K` opens the Add Job modal
- **PWA** — Installable on mobile and desktop

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React, TypeScript, Vite, Tailwind CSS v4 |
| Backend | Vercel Serverless Functions |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Google OAuth) |
| AI | Claude API (Anthropic) |
| Font | Inter Tight |

## Glassmorphism Design System

The UI is built on a custom frosted glass system with four tiers. Each uses `backdrop-filter` for blur/saturation, layered white opacity, and `::before`/`::after` pseudo-elements for diagonal gradient reflections (desktop only, disabled on mobile for GPU performance).

### Frost Classes

```css
/* Base frost — 70% white, 24px blur */
.frost {
  background: rgba(255, 255, 255, 0.70);
  backdrop-filter: blur(24px) saturate(130%) brightness(1.1);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 1),
    0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Strong — 93% white, 32px blur — cards, header, modals */
.frost-strong {
  background: rgba(255, 255, 255, 0.93);
  backdrop-filter: blur(32px) saturate(140%) brightness(1.1);
}

/* Light — 55% white, 16px blur — status pills, subtle elements */
.frost-light {
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(16px) saturate(120%) brightness(1.05);
}

/* Input — 65% white, focus state with amber ring */
.frost-input {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(16px) saturate(120%) brightness(1.1);
}
.frost-input:focus {
  background: rgba(255, 255, 255, 0.85);
  border-color: rgba(194, 117, 58, 0.7);
  box-shadow: 0 0 0 3px rgba(194, 117, 58, 0.3);
}
```

### Gradient Reflections (Desktop)

Each frost element gets two pseudo-element overlays for a realistic glass look:

```css
/* Top-left highlight */
.frost::before {
  background: linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 50%);
  opacity: 0.8;
}

/* Bottom-right subtle reflection */
.frost::after {
  background: linear-gradient(315deg, rgba(255,255,255,0.3) 0%, transparent 50%);
  opacity: 0.6;
}
```

These are disabled on mobile (`< 640px`) to reduce GPU load.

### Mobile Optimizations

- Blur reduced from 24px to 12px on mobile
- Pseudo-element reflections disabled below 640px
- Cards always show action buttons (no hover dependency)
- Status pills and controls bars are horizontally scrollable
- Add Job modal goes full-screen on mobile

## AI Job Parsing Pipeline

When a user pastes a job URL, the `POST /api/parse-job` endpoint:

1. **Fetches the page HTML** with a browser-like User-Agent
2. **Extracts JSON-LD** — Searches for `<script type="application/ld+json">` blocks with `@type: "JobPosting"`. Most job boards (Greenhouse, Lever, Ashby, LinkedIn) embed structured data for SEO, which contains the full job description even when the visible page is JS-rendered
3. **Strips HTML to plain text** — Removes scripts, styles, and tags as a fallback content source
4. **Combines both** — Sends structured data + page text to Claude, labeled separately so the model can pull from whichever has more detail
5. **Claude extracts fields** — Company, title, location, remote status, salary (with K/M conversion), equity, resume-ready skills (with 3-5 inferred bonus skills), dates, and a summary
6. **Returns parsed JSON** — The frontend auto-fills the Add Job form

### Salary Parsing

The prompt instructs Claude to:
- Scan the **entire page** for compensation (sidebars, footers, banners — not just labeled sections)
- Convert shorthand: `$140K` to `140000`, `$1.2M` to `1200000`
- Extract equity ranges like `0.2% - 0.8%` or RSU details

### Skills Output

Skills are output as concrete, resume-ready tool/technology names — things you'd put in a "Skills" section:
- `"React.js"` not `"React"`
- `"REST APIs"` not `"API Design"`
- Never soft skills or abstract phrases

Nice-to-have skills also include 3-5 **inferred** tools not in the JD that would strengthen the application based on the role's tech stack.

### Fallback

If the URL can't be fetched (CORS, auth walls, etc.), the user sees a text area to paste the job description manually. The same Claude pipeline processes the pasted text.

## Project Structure

```
api/
  _lib/auth.ts                # JWT verification + Supabase service client
  applications/
    index.ts                   # GET (list) / POST (create)
    [id]/
      index.ts                 # PATCH / DELETE single application
      status-history.ts        # GET / POST status change history
  parse-job.ts                 # AI job posting parser (Claude API)

src/
  components/
    AddJobModal.tsx            # Create/edit application form
    ConfirmDialog.tsx          # Generic confirmation dialog
    CustomSelect.tsx           # Portal-based dropdown (replaces native <select>)
    DatePicker.tsx             # Portal-based calendar picker (replaces native date input)
    Header.tsx                 # Fixed header with user avatar
    SkillInput.tsx             # Tag-style skill input
    StatusBadge.tsx            # Display-only status pill
    StatusDropdown.tsx         # Interactive status picker (portal-based)
    StatusChangeNotePopup.tsx  # Note popup after status change
    StatusSelect.tsx           # Status dropdown for forms (wraps CustomSelect)
    StatusTimeline.tsx         # Vertical timeline of status changes
  hooks/
    useApplications.ts         # CRUD + status change hook
    useAuth.tsx                # Auth context provider
  lib/
    api.ts                     # Client-side API functions
    duplicates.ts              # Duplicate detection logic
    supabase.ts                # Supabase client init
  pages/
    Dashboard.tsx              # Main page (card/table views, filters, sort)
    JobDetail.tsx              # Single application detail page
    LoginPage.tsx              # Landing page with feature sections
  types/
    index.ts                   # TypeScript types, status constants, colors
```

## Database Schema

### `applications`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | References auth.users |
| created_at | timestamptz | Auto-set |
| job_url | text | Original posting URL |
| company_name | text | Required |
| job_title | text | Required |
| location | text | |
| is_remote | boolean | |
| salary_min | integer | Stored as full number |
| salary_max | integer | Stored as full number |
| salary_currency | text | e.g. "USD" |
| salary_type | text | "annual" or "hourly" |
| equity | text | e.g. "0.2% - 0.8%" |
| required_skills | text[] | Array of skill strings |
| nice_to_have_skills | text[] | Array of skill strings |
| application_deadline | date | |
| job_summary | text | |
| status | text | One of 8 statuses |
| notes | text | |
| date_applied | date | |
| follow_up_date | date | |
| date_posted | date | |

### `status_history`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| application_id | uuid | Foreign key |
| user_id | uuid | References auth.users |
| old_status | text | Previous status |
| new_status | text | New status |
| note | text | Optional note |
| created_at | timestamptz | Auto-set |

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL in the **SQL Editor**:

```sql
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
  salary_type text,
  equity text,
  required_skills text[] DEFAULT '{}',
  nice_to_have_skills text[] DEFAULT '{}',
  application_deadline date,
  job_summary text,
  status text DEFAULT 'Bookmarked',
  notes text,
  date_applied date,
  follow_up_date date,
  date_posted date
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own applications"
  ON applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own applications"
  ON applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own applications"
  ON applications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own applications"
  ON applications FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
  old_status text NOT NULL,
  new_status text NOT NULL,
  note text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own status history"
  ON status_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own status history"
  ON status_history FOR INSERT WITH CHECK (auth.uid() = user_id);
```

3. Copy your **Project URL**, **Anon Key**, and **Service Role Key** from Settings > API

### 2. Google OAuth

1. In Supabase: **Authentication > Providers > Google** — enable and copy the callback URL
2. In [Google Cloud Console](https://console.cloud.google.com): create OAuth 2.0 credentials, add the Supabase callback URL as an authorized redirect URI
3. Paste the Google Client ID and Secret back into Supabase
4. In **Authentication > URL Configuration**, add your deployed URL and `http://localhost:5173`

### 3. Environment Variables

Create `.env.local`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 4. Run

```bash
npm install
npm run dev
```

### 5. Deploy

Push to GitHub, import in [Vercel](https://vercel.com), add env vars, deploy. Add your Vercel URL to Supabase's redirect URLs.

## Commands

```bash
npm run dev          # Dev server (localhost:5173)
npm run build        # Production build
npx tsc --noEmit     # Type check
```
