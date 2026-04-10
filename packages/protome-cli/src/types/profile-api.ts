export type ProfilePayload = {
  displayName: string
  headline: string
  summary: string
  location: string | null
  website: string | null
  socialLinks: {
    twitter: string | null
    linkedin: string | null
    github: string | null
  }
  skills: string[]
  updatedAt: string
}

export type ProjectPayload = {
  id: string
  name: string
  slug: string
  summary: string | null
  role: string | null
  status: string
  repo: string | null
  demo: string | null
  stack: string[]
  updatedAt: string
}

export type ContextPayload = {
  profile: ProfilePayload
  projects: ProjectPayload[]
  blogContext: {
    summary: string
    tone: string | null
    structurePatterns: string[]
    doRules: string[]
    dontRules: string[]
    trackedPostIds: string[]
    analyzedPostIds: string[]
    pendingPostIds: string[]
    recentlyAnalyzedPosts: string[]
    pendingPostAnalyses: string[]
    lastAnalyzedAt: string | null
    updatedAt: string
  }
  worklogContext: {
    currentFocus: string
    activeThemes: string[]
    currentMilestones: string[]
    trackedWorklogIds: string[]
    analyzedWorklogIds: string[]
    pendingWorklogIds: string[]
    recentlyAnalyzedWorklogs: string[]
    pendingWorklogAnalyses: string[]
    lastAnalyzedAt: string | null
    updatedAt: string
  }
  meta: {
    schemaVersion: string
    generatedAt: string
    snapshotVersion: string
    source: string
  }
}

export type AuthVerifyPayload = {
  valid: boolean
  snapshotVersion: string
}
