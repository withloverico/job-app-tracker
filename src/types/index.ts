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
  required_skills: string[]
  nice_to_have_skills: string[]
  application_deadline: string | null
  job_summary: string | null
  status: Status
  notes: string | null
  date_applied: string | null
  follow_up_date: string | null
}

export interface ParsedJob {
  company_name: string | null
  job_title: string | null
  location: string | null
  is_remote: boolean | null
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
  required_skills: string[] | null
  nice_to_have_skills: string[] | null
  application_deadline: string | null
  job_summary: string | null
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
  Bookmarked: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  Applied: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Phone Screen': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  Interview: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Final Round': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  Offer: 'bg-green-500/20 text-green-300 border-green-500/30',
  Rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
  Withdrawn: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
}

export const STATUS_DOT_COLORS: Record<Status, string> = {
  Bookmarked: 'bg-gray-400',
  Applied: 'bg-blue-400',
  'Phone Screen': 'bg-yellow-400',
  Interview: 'bg-purple-400',
  'Final Round': 'bg-orange-400',
  Offer: 'bg-green-400',
  Rejected: 'bg-red-400',
  Withdrawn: 'bg-slate-400',
}
