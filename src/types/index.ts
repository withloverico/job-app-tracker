export type Status =
  | 'Bookmarked'
  | 'Applied'
  | 'Phone Screen'
  | 'Interview'
  | 'Final Round'
  | 'Offer'
  | 'Rejected'
  | 'Withdrawn'

export interface Application {
  id: string
  user_id: string
  created_at: string
  job_url: string | null
  company_name: string
  job_title: string
  location: string | null
  is_remote: boolean
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
  salary_type: string | null
  required_skills: string[]
  nice_to_have_skills: string[]
  application_deadline: string | null
  job_summary: string | null
  status: Status
  notes: string | null
  date_applied: string | null
  follow_up_date: string | null
  date_posted: string | null
}

export interface ParsedJob {
  company_name: string | null
  job_title: string | null
  location: string | null
  is_remote: boolean | null
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
  salary_type: string | null
  required_skills: string[] | null
  nice_to_have_skills: string[] | null
  application_deadline: string | null
  job_summary: string | null
  date_posted: string | null
}

export interface StatusHistoryEntry {
  id: string
  application_id: string
  user_id: string
  old_status: Status
  new_status: Status
  note: string | null
  created_at: string
}

export const STATUSES: Status[] = [
  'Bookmarked',
  'Applied',
  'Phone Screen',
  'Interview',
  'Final Round',
  'Offer',
  'Rejected',
  'Withdrawn',
]

export const STATUS_COLORS: Record<Status, string> = {
  Bookmarked: 'bg-stone-500/15 text-stone-700 border-stone-400/30',
  Applied: 'bg-sky-500/15 text-sky-700 border-sky-400/30',
  'Phone Screen': 'bg-amber-500/15 text-amber-700 border-amber-400/30',
  Interview: 'bg-violet-500/15 text-violet-700 border-violet-400/30',
  'Final Round': 'bg-orange-500/15 text-orange-700 border-orange-400/30',
  Offer: 'bg-emerald-500/15 text-emerald-700 border-emerald-400/30',
  Rejected: 'bg-red-500/15 text-red-700 border-red-400/30',
  Withdrawn: 'bg-slate-500/15 text-slate-600 border-slate-400/30',
}

export const STATUS_DOT_COLORS: Record<Status, string> = {
  Bookmarked: 'bg-stone-500',
  Applied: 'bg-sky-500',
  'Phone Screen': 'bg-amber-500',
  Interview: 'bg-violet-500',
  'Final Round': 'bg-orange-500',
  Offer: 'bg-emerald-500',
  Rejected: 'bg-red-500',
  Withdrawn: 'bg-slate-500',
}
