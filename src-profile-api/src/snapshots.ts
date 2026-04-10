import fs from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'
import { snapshotDir } from './config.js'

export type ProfileSnapshot = {
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

export type ProjectSnapshot = {
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

export type BlogContextSnapshot = {
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

export type WorklogContextSnapshot = {
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

export type ContextSnapshot = {
  profile: ProfileSnapshot
  projects: ProjectSnapshot[]
  blogContext: BlogContextSnapshot
  worklogContext: WorklogContextSnapshot
  meta: {
    schemaVersion: string
    generatedAt: string
    snapshotVersion: string
    source: string
  }
}

const nullableStringSchema = z.string().trim().nullable()
const stringArraySchema = z.array(z.string().trim())

const socialLinksSchema = z.object({
  twitter: nullableStringSchema,
  linkedin: nullableStringSchema,
  github: nullableStringSchema,
})

const profileSnapshotSchema = z.object({
  displayName: z.string().trim().min(1),
  headline: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  location: nullableStringSchema,
  website: nullableStringSchema,
  socialLinks: socialLinksSchema,
  skills: stringArraySchema,
  updatedAt: z.string().trim().min(1),
})

const projectSnapshotSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  summary: nullableStringSchema,
  role: nullableStringSchema,
  status: z.string().trim().min(1),
  repo: nullableStringSchema,
  demo: nullableStringSchema,
  stack: stringArraySchema,
  updatedAt: z.string().trim().min(1),
})

const blogContextSnapshotSchema = z.object({
  summary: z.string().trim().min(1),
  tone: nullableStringSchema,
  structurePatterns: stringArraySchema,
  doRules: stringArraySchema,
  dontRules: stringArraySchema,
  trackedPostIds: stringArraySchema,
  analyzedPostIds: stringArraySchema,
  pendingPostIds: stringArraySchema,
  recentlyAnalyzedPosts: stringArraySchema,
  pendingPostAnalyses: stringArraySchema,
  lastAnalyzedAt: nullableStringSchema,
  updatedAt: z.string().trim().min(1),
})

const worklogContextSnapshotSchema = z.object({
  currentFocus: z.string().trim().min(1),
  activeThemes: stringArraySchema,
  currentMilestones: stringArraySchema,
  trackedWorklogIds: stringArraySchema,
  analyzedWorklogIds: stringArraySchema,
  pendingWorklogIds: stringArraySchema,
  recentlyAnalyzedWorklogs: stringArraySchema,
  pendingWorklogAnalyses: stringArraySchema,
  lastAnalyzedAt: nullableStringSchema,
  updatedAt: z.string().trim().min(1),
})

const contextMetaSchema = z.object({
  schemaVersion: z.string().trim().min(1),
  generatedAt: z.string().trim().min(1),
  snapshotVersion: z.string().trim().min(1),
  source: z.string().trim().min(1),
})

const contextSnapshotSchema = z.object({
  profile: profileSnapshotSchema,
  projects: z.array(projectSnapshotSchema),
  blogContext: blogContextSnapshotSchema,
  worklogContext: worklogContextSnapshotSchema,
  meta: contextMetaSchema,
})

const snapshotManifestSchema = z.object({
  schemaVersion: z.string().trim().min(1),
  snapshotVersion: z.string().trim().min(1),
  generatedAt: z.string().trim().min(1),
  files: z.object({
    profile: z.string().trim().min(1),
    projects: z.string().trim().min(1),
    context: z.string().trim().min(1),
  }),
})

type SnapshotManifest = z.infer<typeof snapshotManifestSchema>

type SchemaParser<T> = {
  parse: (input: unknown) => T
}

async function readJsonFile<T>(filename: string, schema: SchemaParser<T>) {
  const filePath = path.join(snapshotDir, filename)
  const raw = await fs.readFile(filePath, 'utf8')
  const parsed = JSON.parse(raw) as unknown
  return schema.parse(parsed)
}

export async function readManifest() {
  return readJsonFile('manifest.json', snapshotManifestSchema)
}

export async function readProfileSnapshot() {
  return readJsonFile('profile.json', profileSnapshotSchema)
}

export async function readProjectsSnapshot() {
  return readJsonFile('projects.json', z.array(projectSnapshotSchema))
}

export async function readContextSnapshot() {
  return readJsonFile('context.json', contextSnapshotSchema)
}

export async function ensureSnapshotsReadable() {
  await Promise.all([
    readManifest(),
    readProfileSnapshot(),
    readProjectsSnapshot(),
    readContextSnapshot(),
  ])
}
