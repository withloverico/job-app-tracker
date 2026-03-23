# Job Application Tracker

## Tech Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS v4
- **Backend**: Vercel serverless API routes (`api/`)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Google OAuth), service role key for API routes
- **Styling**: Custom glassmorphism/frosted glass design system (frost, frost-strong, frost-light, frost-input CSS classes in `src/index.css`)
- **Font**: Inter Tight (Google Fonts)
- **Background**: Fixed wallpaper image (`public/bg.png`)

## Project Structure
```
api/
  _lib/auth.ts              # Auth helpers (verifyAuth, getServiceSupabase)
  applications/
    index.ts                 # GET (list) / POST (create) applications
    [id]/
      index.ts               # PATCH / DELETE single application
      status-history.ts      # GET / POST status change history
  parse-job.ts               # AI-powered job posting parser (Claude API)

src/
  components/
    AddJobModal.tsx           # Create/edit application modal (full-screen on mobile)
    ConfirmDialog.tsx         # Generic confirmation dialog
    Header.tsx                # Fixed top header with user avatar + name
    SkillInput.tsx            # Tag-style skill input
    StatusBadge.tsx           # Display-only status pill
    StatusDropdown.tsx        # Interactive status picker (portal-based dropdown)
    StatusChangeNotePopup.tsx # Note popup after status change
    StatusSelect.tsx          # Native select for status (used in forms)
    StatusTimeline.tsx        # Vertical timeline of status changes
  hooks/
    useApplications.ts        # Main data hook (CRUD + changeStatus)
    useAuth.tsx               # Auth context
  lib/
    api.ts                    # Client-side API functions
    duplicates.ts             # Duplicate detection
    supabase.ts               # Supabase client
  pages/
    Dashboard.tsx             # Main page with card/table views
    JobDetail.tsx             # Single application detail page
    Login.tsx                 # Login page
  types/
    index.ts                  # TypeScript types (Application, Status, StatusHistoryEntry, etc.)
```

## Database Tables
- `applications` — main table with all job fields + `date_posted` column
- `status_history` — tracks status changes (id, application_id, user_id, old_status, new_status, note, created_at)

## Design System
- `.frost` — standard glassmorphism (70% white opacity, blur 24px)
- `.frost-strong` — opaque variant (93% white opacity, blur 32px) — used for cards, header, modals
- `.frost-light` — subtle variant (55% white opacity, blur 16px) — used for status pills
- `.frost-input` — input field styling (65% white opacity)
- All frost classes have `::before` and `::after` pseudo-elements for gradient reflections
- Background is fixed (`background-attachment: fixed` in CSS)

## Layout Architecture
- **Header**: `fixed top-0` — always visible
- **Main content**: `flex-1 overflow-y-auto` with `pt-14 pb-16` — only scrollable region
- **Footer**: `fixed bottom-0` — "Built with love by Rico Bolos" pill linking to LinkedIn
- Background stays perfectly still, only content scrolls

## Card Behavior
- Cards have fixed height (`h-52`) with `overflow-hidden` and flex column layout
- Content section is `flex-1 min-h-0 overflow-hidden`
- Footer bar (date pill + action buttons) uses `mt-auto` to stay at bottom
- Date pill: frosted green with "Added: (date)" text
- Action buttons (job link, delete, details): visible on mobile, hover-reveal on desktop (`sm:opacity-0 sm:group-hover:opacity-100`)
- **Click card** → opens flipped modal (flip-in animation) showing skills, summary, notes, status timeline
- **Click Edit** in modal → opens AddJobModal
- **Click backdrop** → flip-out animation closes modal
- StatusDropdown on cards lets users change status inline without flipping

## Mobile Optimizations
- Status pills bar: horizontally scrollable with hidden scrollbar
- Controls bar (search, sort, view toggle): horizontally scrollable
- Add Job button: hidden in scroll bar on mobile, full-width button shown below controls instead
- AddJobModal: full-screen on mobile (no padding/rounded corners)
- Card action buttons always visible on mobile (no hover dependency)

## Current State / Known Issues

### ACTIVE BUG: StatusDropdown portal not rendering
The StatusDropdown uses `createPortal` to render on `document.body` to escape card's `overflow: hidden`, but the dropdown doesn't appear when clicking the status badge. The `setTimeout` fix for the outside-click listener didn't resolve it. This needs debugging — likely a z-index, positioning, or event propagation issue with the portal approach.

### Mock Data
`src/hooks/useApplications.ts` has `MOCK_APPS` array (Vercel, Stripe, Anthropic) and initializes state with it. **Must be removed before deploying** — change `useState<Application[]>(MOCK_APPS)` back to `useState<Application[]>([])`.

### Status History Feature (partially complete)
- API endpoint created (`api/applications/[id]/status-history.ts`)
- Types added (`StatusHistoryEntry` in `src/types/index.ts`)
- Client API functions added (`fetchStatusHistory`, `changeApplicationStatus` in `src/lib/api.ts`)
- `useApplications` hook has `changeStatus` method
- Components created: `StatusDropdown`, `StatusChangeNotePopup`, `StatusTimeline`
- Dashboard integration done (StatusDropdown on cards + modal, StatusTimeline in modal, note popup)
- **Blocked by**: StatusDropdown portal rendering bug

### Flip Animation CSS (`src/index.css`)
- `flipIn` / `flipOut` keyframes for modal entrance/exit
- `fadeIn` / `fadeOut` for backdrop
- `.flip-card-modal` and `.flip-backdrop` classes with `.closing` variant

## Commands
- `npm run dev` — local dev server (http://localhost:5173)
- `npx tsc --noEmit` — type check
- Deployed on Vercel at tracker-steel.vercel.app
