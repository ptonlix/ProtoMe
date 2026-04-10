import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'

const workspaceRoot = path.resolve(import.meta.dirname, '..')
const dataRoot = path.join(workspaceRoot, 'data')
const snapshotDir = path.join(workspaceRoot, 'deploy', 'snapshots')
const profileFile = path.join(dataRoot, 'profile', 'default.mdx')
const projectsRoot = path.join(dataRoot, 'projects')
const blogRoot = path.join(dataRoot, 'blog')
const worklogsRoot = path.join(dataRoot, 'worklogs')
const blogStyleFile = path.join(dataRoot, 'system', 'blog-style.mdx')
const worklogFocusFile = path.join(dataRoot, 'system', 'worklog-focus.mdx')

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeNullableString(value) {
  const normalized = normalizeString(value)
  return normalized || null
}

function normalizeStringArray(value) {
  return Array.isArray(value) ? value.map((item) => normalizeString(item)).filter(Boolean) : []
}

async function exists(targetPath) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

async function readMdxFile(filePath) {
  const raw = await fs.readFile(filePath, 'utf8')
  return matter(raw)
}

async function walkMdxFiles(rootDir) {
  if (!(await exists(rootDir))) {
    return []
  }

  const results = []
  const queue = [rootDir]

  while (queue.length > 0) {
    const current = queue.shift()
    const entries = await fs.readdir(current, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        queue.push(fullPath)
        continue
      }

      if (entry.isFile() && entry.name.endsWith('.mdx')) {
        results.push(fullPath)
      }
    }
  }

  return results.sort()
}

function getProjectSlug(filePath) {
  const relativePath = path.relative(projectsRoot, filePath).replace(/\\/g, '/')
  return relativePath.replace(/\/index\.mdx$/, '').replace(/\.mdx$/, '')
}

function getWorklogId(filePath) {
  const relativePath = path.relative(worklogsRoot, filePath).replace(/\\/g, '/')
  return relativePath.replace(/\.mdx$/, '')
}

function getBlogId(filePath) {
  const relativePath = path.relative(blogRoot, filePath).replace(/\\/g, '/')
  return relativePath.replace(/\.mdx$/, '')
}

function toRecentItems(trackedIds, analyzedIds) {
  const analyzedSet = new Set(analyzedIds)
  return trackedIds.filter((item) => analyzedSet.has(item)).slice(-10)
}

function computePendingItems(trackedIds, analyzedIds) {
  const analyzedSet = new Set(analyzedIds)
  return trackedIds.filter((item) => !analyzedSet.has(item))
}

async function buildProfileSnapshot() {
  const { data, content } = await readMdxFile(profileFile)
  return {
    displayName: normalizeString(data.name),
    headline: normalizeString(data.headline),
    summary: normalizeString(data.highlights?.join(' / ')) || normalizeString(content.split('\n').find(Boolean)),
    location: normalizeNullableString(data.location),
    website: normalizeNullableString(data.website),
    socialLinks: {
      twitter: normalizeNullableString(data.twitter),
      linkedin: normalizeNullableString(data.linkedin),
      github: normalizeNullableString(data.github),
    },
    skills: normalizeStringArray(data.skills),
    updatedAt: normalizeString(data.updatedAt) || new Date().toISOString(),
  }
}

async function buildProjectsSnapshot() {
  const files = await walkMdxFiles(projectsRoot)
  const projects = []

  for (const filePath of files) {
    const { data } = await readMdxFile(filePath)
    projects.push({
      id: normalizeString(data.id) || getProjectSlug(filePath),
      name: normalizeString(data.title) || normalizeString(data.id) || getProjectSlug(filePath),
      slug: normalizeString(data.pathSlug) || getProjectSlug(filePath),
      summary: normalizeNullableString(data.summary),
      role: normalizeNullableString(data.role),
      status: normalizeString(data.status) || 'active',
      repo: normalizeNullableString(data.repo),
      demo: normalizeNullableString(data.demo),
      stack: normalizeStringArray(data.stack),
      updatedAt: normalizeString(data.updatedAt) || new Date().toISOString(),
    })
  }

  return projects
}

async function buildBlogContextSnapshot() {
  const trackedPostIds = (await walkMdxFiles(blogRoot)).map(getBlogId)
  const { data, content } = await readMdxFile(blogStyleFile)
  const analyzedPostIds = normalizeStringArray(data.analyzedPostIds)
  const pendingPostIds = computePendingItems(trackedPostIds, analyzedPostIds)

  return {
    summary: normalizeString(data.summary) || normalizeString(content.split('\n').find(Boolean)),
    tone: normalizeNullableString(data.tone),
    structurePatterns: normalizeStringArray(data.structurePatterns),
    doRules: normalizeStringArray(data.doRules),
    dontRules: normalizeStringArray(data.dontRules),
    trackedPostIds,
    analyzedPostIds,
    pendingPostIds,
    recentlyAnalyzedPosts: toRecentItems(trackedPostIds, analyzedPostIds),
    pendingPostAnalyses: pendingPostIds,
    lastAnalyzedAt: normalizeNullableString(data.lastAnalyzedAt),
    updatedAt: normalizeString(data.updatedAt) || new Date().toISOString(),
  }
}

async function buildWorklogContextSnapshot() {
  const trackedWorklogIds = (await walkMdxFiles(worklogsRoot)).map(getWorklogId)
  const { data, content } = await readMdxFile(worklogFocusFile)
  const analyzedWorklogIds = normalizeStringArray(data.analyzedWorklogIds)
  const pendingWorklogIds = computePendingItems(trackedWorklogIds, analyzedWorklogIds)

  return {
    currentFocus: normalizeString(data.currentFocus) || normalizeString(content.split('\n').find(Boolean)),
    activeThemes: normalizeStringArray(data.activeThemes),
    currentMilestones: normalizeStringArray(data.currentMilestones),
    trackedWorklogIds,
    analyzedWorklogIds,
    pendingWorklogIds,
    recentlyAnalyzedWorklogs: toRecentItems(trackedWorklogIds, analyzedWorklogIds),
    pendingWorklogAnalyses: pendingWorklogIds,
    lastAnalyzedAt: normalizeNullableString(data.lastAnalyzedAt),
    updatedAt: normalizeString(data.updatedAt) || new Date().toISOString(),
  }
}

async function main() {
  await fs.mkdir(snapshotDir, { recursive: true })

  const [profile, projects, blogContext, worklogContext] = await Promise.all([
    buildProfileSnapshot(),
    buildProjectsSnapshot(),
    buildBlogContextSnapshot(),
    buildWorklogContextSnapshot(),
  ])

  const generatedAt = new Date().toISOString()
  const snapshotVersion = generatedAt.replace(/[-:TZ.]/g, '').slice(0, 14)
  const context = {
    profile,
    projects,
    blogContext,
    worklogContext,
    meta: {
      schemaVersion: '1.0.0',
      generatedAt,
      snapshotVersion,
      source: 'protome-local-workspace',
    },
  }

  const manifest = {
    schemaVersion: '1.0.0',
    snapshotVersion,
    generatedAt,
    files: {
      profile: 'profile.json',
      projects: 'projects.json',
      context: 'context.json',
    },
  }

  await Promise.all([
    fs.writeFile(path.join(snapshotDir, 'profile.json'), `${JSON.stringify(profile, null, 2)}\n`, 'utf8'),
    fs.writeFile(path.join(snapshotDir, 'projects.json'), `${JSON.stringify(projects, null, 2)}\n`, 'utf8'),
    fs.writeFile(path.join(snapshotDir, 'context.json'), `${JSON.stringify(context, null, 2)}\n`, 'utf8'),
    fs.writeFile(path.join(snapshotDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8'),
  ])

  console.log(`snapshots written to ${snapshotDir}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
