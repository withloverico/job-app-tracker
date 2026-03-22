import type { Application } from '../types'

const SUFFIXES = /\b(inc\.?|llc\.?|ltd\.?|co\.?|corp\.?|corporation|company|group|holdings)\b/gi

function normalize(str: string): string {
  return str.toLowerCase().trim().replace(SUFFIXES, '').trim()
}

export interface DuplicateMatch {
  application: Application
  matchType: 'url' | 'fuzzy'
}

export function findDuplicate(
  applications: Application[],
  jobUrl: string | null,
  companyName: string | null,
  jobTitle: string | null
): DuplicateMatch | null {
  if (jobUrl) {
    const urlMatch = applications.find(
      (a) => a.job_url && a.job_url.trim().toLowerCase() === jobUrl.trim().toLowerCase()
    )
    if (urlMatch) return { application: urlMatch, matchType: 'url' }
  }

  if (companyName && jobTitle) {
    const normCompany = normalize(companyName)
    const normTitle = normalize(jobTitle)
    const fuzzyMatch = applications.find(
      (a) =>
        normalize(a.company_name) === normCompany &&
        normalize(a.job_title) === normTitle
    )
    if (fuzzyMatch) return { application: fuzzyMatch, matchType: 'fuzzy' }
  }

  return null
}
