import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import { slug as githubSlug } from 'github-slugger'
import { z } from 'zod'
import { blogRoot, dataRoot, imagesRoot, postsImageRoot } from './config.js'

const privacySchema = z.enum(['public', 'private', 'restricted']).default('public')
const projectStatusSchema = z.enum(['idea', 'active', 'paused', 'completed', 'archived'])

const blogInputSchema = z.object({
  title: z.string().trim().min(1, '标题不能为空'),
  category: z.string().trim().min(1, '分类目录不能为空'),
  date: z.string().trim().min(1, '发布日期不能为空'),
  summary: z.string().trim().min(1, '摘要不能为空'),
  tags: z.array(z.string().trim().min(1)).default([]),
  authors: z.array(z.string().trim().min(1)).default(['default']),
  images: z.array(z.string().trim().min(1)).default([]),
  draft: z.boolean().default(true),
  layout: z.string().trim().min(1).default('PostLayout'),
  bibliography: z.string().trim().optional(),
  canonicalUrl: z.string().trim().optional(),
  slug: z.string().trim().min(1).optional(),
  body: z.string().default(''),
})

const profileInputSchema = z.object({
  name: z.string().trim().min(1, '姓名不能为空'),
  avatar: z.string().trim().optional(),
  headline: z.string().trim().min(1, '标题不能为空'),
  updatedAt: z.string().trim().min(1, '更新时间不能为空'),
  company: z.string().trim().optional(),
  email: z.string().trim().optional(),
  location: z.string().trim().optional(),
  website: z.string().trim().optional(),
  twitter: z.string().trim().optional(),
  linkedin: z.string().trim().optional(),
  github: z.string().trim().optional(),
  skills: z.array(z.string().trim().min(1)).default([]),
  highlights: z.array(z.string().trim().min(1)).default([]),
  privacy: privacySchema,
  body: z.string().default(''),
})

const aboutInputSchema = z.object({
  title: z.string().trim().min(1, '标题不能为空'),
  summary: z.string().trim().optional(),
  updatedAt: z.string().trim().min(1, '更新时间不能为空'),
  privacy: privacySchema,
  body: z.string().default(''),
})

const projectInputSchema = z.object({
  pathSlug: z.string().trim().min(1).optional(),
  id: z.string().trim().min(1, '项目 ID 不能为空'),
  title: z.string().trim().min(1, '标题不能为空'),
  status: projectStatusSchema,
  startedAt: z.string().trim().min(1, '开始时间不能为空'),
  updatedAt: z.string().trim().min(1, '更新时间不能为空'),
  summary: z.string().trim().optional(),
  stack: z.array(z.string().trim().min(1)).default([]),
  repo: z.string().trim().optional(),
  demo: z.string().trim().optional(),
  role: z.string().trim().optional(),
  highlights: z.array(z.string().trim().min(1)).default([]),
  tags: z.array(z.string().trim().min(1)).default([]),
  privacy: privacySchema,
  body: z.string().default(''),
})

const authorInputSchema = z.object({
  pathSlug: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1, '作者名称不能为空'),
  avatar: z.string().trim().optional(),
  occupation: z.string().trim().optional(),
  company: z.string().trim().optional(),
  email: z.string().trim().optional(),
  twitter: z.string().trim().optional(),
  bluesky: z.string().trim().optional(),
  linkedin: z.string().trim().optional(),
  github: z.string().trim().optional(),
  layout: z.string().trim().optional(),
  body: z.string().default(''),
})

const worklogInputSchema = z.object({
  slug: z.string().trim().min(1).optional(),
  date: z.string().trim().min(1, '日期不能为空'),
  title: z.string().trim().min(1, '标题不能为空'),
  summary: z.string().trim().min(1, '摘要不能为空'),
  updatedAt: z.string().trim().min(1, '更新时间不能为空'),
  projects: z.array(z.string().trim().min(1)).default([]),
  tags: z.array(z.string().trim().min(1)).default([]),
  focus: z.array(z.string().trim().min(1)).default([]),
  nextActions: z.array(z.string().trim().min(1)).default([]),
  aiGenerated: z.boolean().default(false),
  privacy: privacySchema,
  body: z.string().default(''),
})

export type ContentTypeKey = 'blog' | 'profile' | 'project' | 'authors' | 'worklog' | 'about'
export type ContentMode = 'singleton' | 'collection'
export type StatusTone = 'neutral' | 'amber' | 'green' | 'blue'

export type AdminContentType = {
  key: ContentTypeKey
  label: string
  description: string
  mode: ContentMode
  supportsAssets: boolean
  statusFilterLabel?: string
  statusOptions: Array<{ value: string; label: string }>
  groupFilterLabel?: string
}

export type AdminContentRecord = {
  type: ContentTypeKey
  adminPath: string
  filePath: string
  title: string
  summary: string
  body: string
  frontmatter: Record<string, unknown>
  lastmod?: string
  updatedAt?: string
  displayStatus: {
    value: string
    label: string
    tone: StatusTone
  }
  group?: {
    value: string
    label: string
  }
}

export type DeleteContentResult = {
  type: ContentTypeKey
  adminPath: string
  filePath: string
  assetDir: string | null
  requiresPublish: boolean
}

type ListContentOptions = {
  type: ContentTypeKey
  keyword?: string
  status?: string
  group?: string
  page?: number
  pageSize?: number
}

export type ListContentResult = {
  items: AdminContentRecord[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  availableGroups: string[]
}

export type PostInput = z.infer<typeof blogInputSchema>

export type PostRecord = {
  adminPath: string
  category: string
  filePath: string
  title: string
  date: string
  summary: string
  tags: string[]
  authors: string[]
  images: string[]
  draft: boolean
  layout: string
  bibliography?: string
  canonicalUrl?: string
  body: string
  lastmod?: string
}

function assertSafePathSegment(value: string, fieldName: string) {
  if (!value || value.includes('..') || value.startsWith('/') || value.startsWith('\\')) {
    throw new Error(`${fieldName} 不合法`)
  }
}

export function normalizeSlug(input: string) {
  return input
    .split('/')
    .map((segment) => githubSlug(segment))
    .filter(Boolean)
    .join('/')
}

export function normalizeAdminPath(adminPath: string, label = '内容路径') {
  const cleaned = adminPath
    .split('/')
    .map((segment) => {
      try {
        return decodeURIComponent(segment)
      } catch {
        throw new Error(`${label}包含非法编码`)
      }
    })
    .join('/')
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '')

  assertSafePathSegment(cleaned, label)
  return cleaned
}

function cleanArray(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean)
}

function normalizeOptionalString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeDateString(value: string, fieldName = '日期') {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName}格式不合法`)
  }
  return date.toISOString()
}

function formatPrivacyLabel(value: string) {
  return value === 'private' ? '私有' : value === 'restricted' ? '受限' : '公开'
}

function formatProjectStatusLabel(value: string) {
  switch (value) {
    case 'idea':
      return '想法'
    case 'active':
      return '进行中'
    case 'paused':
      return '暂停'
    case 'completed':
      return '已完成'
    case 'archived':
      return '已归档'
    default:
      return value
  }
}

function privacyTone(value: string): StatusTone {
  return value === 'public' ? 'green' : value === 'restricted' ? 'amber' : 'neutral'
}

function projectStatusTone(value: string): StatusTone {
  return value === 'active'
    ? 'blue'
    : value === 'completed'
      ? 'green'
      : value === 'paused'
        ? 'amber'
        : 'neutral'
}

function parseMatter(source: string) {
  return matter(source)
}

type ContentRegistryEntry = {
  type: AdminContentType
  rootDir: string
  defaultAdminPath?: string
  parse: (adminPath: string, source: string) => AdminContentRecord
  resolveCreatePath: (input: unknown) => string
  validateInput: (input: unknown, currentAdminPath?: string) => Record<string, unknown>
  stringify: (input: Record<string, unknown>) => string
  filePathFromAdminPath: (adminPath: string) => string
  adminPathFromFilePath: (fullPath: string) => string
  sortTimestamp: (record: AdminContentRecord) => number
}

function blogFilePathFromAdminPath(adminPath: string) {
  const normalizedPath = normalizeAdminPath(adminPath, '文章路径')
  return path.join(blogRoot, `${normalizedPath}.mdx`)
}

export function categoryFromAdminPath(adminPath: string) {
  const normalizedPath = normalizeAdminPath(adminPath, '文章路径')
  return normalizedPath.split('/').slice(0, -1).join('/') || 'default'
}

export function imageDirFromPost(input: { date: string; slug: string }) {
  const date = new Date(input.date)
  if (Number.isNaN(date.getTime())) {
    throw new Error('图片目录生成失败，发布日期不合法')
  }
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return path.join(postsImageRoot, year, month, normalizeSlug(input.slug))
}

function imageDirFromSingleton(dirName: 'profile' | 'about') {
  return path.join(imagesRoot, dirName)
}

function imageDirFromProject(adminPath: string) {
  return path.join(imagesRoot, 'projects', normalizeSlug(adminPath))
}

function imageDirFromAuthor(adminPath: string) {
  return path.join(imagesRoot, 'authors', normalizeSlug(adminPath))
}

function imageDirFromWorklog(input: { date: string; slug: string }) {
  const date = new Date(input.date)
  if (Number.isNaN(date.getTime())) {
    throw new Error('日志资源目录生成失败，日期不合法')
  }
  const year = String(date.getUTCFullYear())
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  return path.join(imagesRoot, 'worklogs', year, month, normalizeSlug(input.slug))
}

function toBlogRecord(adminPath: string, source: string): AdminContentRecord {
  const parsed = parseMatter(source)
  const data = blogInputSchema.parse({
    title: parsed.data.title,
    category: categoryFromAdminPath(adminPath),
    date: parsed.data.date ? String(parsed.data.date) : '',
    summary: parsed.data.summary ?? '',
    tags: Array.isArray(parsed.data.tags) ? parsed.data.tags : [],
    authors: Array.isArray(parsed.data.authors) ? parsed.data.authors : ['default'],
    images: Array.isArray(parsed.data.images) ? parsed.data.images : [],
    draft: Boolean(parsed.data.draft),
    layout: parsed.data.layout ?? 'PostLayout',
    bibliography: parsed.data.bibliography,
    canonicalUrl: parsed.data.canonicalUrl,
    body: parsed.content.trimStart(),
  })

  const date = normalizeDateString(data.date, '发布日期')
  return {
    type: 'blog',
    adminPath,
    filePath: `${adminPath}.mdx`,
    title: data.title,
    summary: data.summary,
    body: data.body,
    frontmatter: {
      title: data.title,
      category: categoryFromAdminPath(adminPath),
      date,
      summary: data.summary,
      tags: cleanArray(data.tags),
      authors: cleanArray(data.authors),
      images: cleanArray(data.images),
      draft: data.draft,
      layout: data.layout,
      bibliography: data.bibliography,
      canonicalUrl: data.canonicalUrl,
      slug: adminPath.split('/').at(-1) || '',
    },
    lastmod: parsed.data.lastmod ? String(parsed.data.lastmod) : undefined,
    updatedAt: date,
    displayStatus: {
      value: data.draft ? 'draft' : 'published',
      label: data.draft ? '草稿' : '已发布',
      tone: data.draft ? 'amber' : 'green',
    },
    group: {
      value: categoryFromAdminPath(adminPath),
      label: categoryFromAdminPath(adminPath),
    },
  }
}

function validateBlogInput(input: unknown) {
  const parsed = blogInputSchema.parse(input)
  const normalizedSlug = normalizeSlug(parsed.slug || parsed.title)
  if (!normalizedSlug) {
    throw new Error('Slug 生成失败')
  }

  return {
    title: parsed.title,
    category: normalizeAdminPath(parsed.category, '分类目录'),
    date: normalizeDateString(parsed.date, '发布日期'),
    summary: parsed.summary,
    tags: cleanArray(parsed.tags),
    authors: cleanArray(parsed.authors.length > 0 ? parsed.authors : ['default']),
    images: cleanArray(parsed.images),
    draft: parsed.draft,
    layout: parsed.layout,
    bibliography: normalizeOptionalString(parsed.bibliography) || undefined,
    canonicalUrl: normalizeOptionalString(parsed.canonicalUrl) || undefined,
    slug: normalizedSlug,
    body: parsed.body.trimStart(),
  }
}

function omitUndefinedFields(record: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined))
}

function stringifyBlog(input: Record<string, unknown>) {
  const frontmatter: Record<string, unknown> = {
    title: input.title,
    date: input.date,
    tags: input.tags,
    lastmod: new Date().toISOString(),
    draft: input.draft,
    summary: input.summary,
    images: input.images,
    authors: input.authors,
    layout: input.layout,
  }

  if (input.bibliography) {
    frontmatter.bibliography = input.bibliography
  }
  if (input.canonicalUrl) {
    frontmatter.canonicalUrl = input.canonicalUrl
  }

  return matter.stringify(`${String(input.body ?? '').trim()}\n`, omitUndefinedFields(frontmatter))
}

function singletonFilePath(dirName: string) {
  return path.join(dataRoot, dirName, 'default.mdx')
}

function listFilePath(dirName: string, adminPath: string) {
  return path.join(dataRoot, dirName, `${normalizeAdminPath(adminPath)}.mdx`)
}

function projectFilePath(adminPath: string) {
  return path.join(dataRoot, 'projects', normalizeAdminPath(adminPath), 'index.mdx')
}

function parseProfileRecord(adminPath: string, source: string): AdminContentRecord {
  const parsed = parseMatter(source)
  const data = profileInputSchema.parse({
    name: parsed.data.name,
    avatar: parsed.data.avatar,
    headline: parsed.data.headline,
    updatedAt: parsed.data.updatedAt ? String(parsed.data.updatedAt) : '',
    company: parsed.data.company,
    email: parsed.data.email,
    location: parsed.data.location,
    website: parsed.data.website,
    twitter: parsed.data.twitter,
    linkedin: parsed.data.linkedin,
    github: parsed.data.github,
    skills: Array.isArray(parsed.data.skills) ? parsed.data.skills : [],
    highlights: Array.isArray(parsed.data.highlights) ? parsed.data.highlights : [],
    privacy: parsed.data.privacy ?? 'public',
    body: parsed.content.trimStart(),
  })
  const updatedAt = normalizeDateString(data.updatedAt, '更新时间')

  return {
    type: 'profile',
    adminPath,
    filePath: `${adminPath}.mdx`,
    title: data.name,
    summary: data.headline,
    body: data.body,
    frontmatter: {
      name: data.name,
      avatar: data.avatar || '',
      headline: data.headline,
      updatedAt,
      company: data.company || '',
      email: data.email || '',
      location: data.location || '',
      website: data.website || '',
      twitter: data.twitter || '',
      linkedin: data.linkedin || '',
      github: data.github || '',
      skills: cleanArray(data.skills),
      highlights: cleanArray(data.highlights),
      privacy: data.privacy,
    },
    updatedAt,
    displayStatus: {
      value: data.privacy,
      label: formatPrivacyLabel(data.privacy),
      tone: privacyTone(data.privacy),
    },
  }
}

function validateProfileInput(input: unknown) {
  const parsed = profileInputSchema.parse(input)
  return {
    name: parsed.name,
    avatar: normalizeOptionalString(parsed.avatar) || undefined,
    headline: parsed.headline,
    updatedAt: normalizeDateString(parsed.updatedAt, '更新时间'),
    company: normalizeOptionalString(parsed.company) || undefined,
    email: normalizeOptionalString(parsed.email) || undefined,
    location: normalizeOptionalString(parsed.location) || undefined,
    website: normalizeOptionalString(parsed.website) || undefined,
    twitter: normalizeOptionalString(parsed.twitter) || undefined,
    linkedin: normalizeOptionalString(parsed.linkedin) || undefined,
    github: normalizeOptionalString(parsed.github) || undefined,
    skills: cleanArray(parsed.skills),
    highlights: cleanArray(parsed.highlights),
    privacy: parsed.privacy,
    body: parsed.body.trimStart(),
  }
}

function stringifyProfile(input: Record<string, unknown>) {
  return matter.stringify(
    `${String(input.body ?? '').trim()}\n`,
    omitUndefinedFields({
      name: input.name,
      avatar: input.avatar,
      headline: input.headline,
      updatedAt: input.updatedAt,
      company: input.company,
      email: input.email,
      location: input.location,
      website: input.website,
      twitter: input.twitter,
      linkedin: input.linkedin,
      github: input.github,
      skills: input.skills,
      highlights: input.highlights,
      privacy: input.privacy,
    })
  )
}

function parseAboutRecord(adminPath: string, source: string): AdminContentRecord {
  const parsed = parseMatter(source)
  const data = aboutInputSchema.parse({
    title: parsed.data.title,
    summary: parsed.data.summary ?? '',
    updatedAt: parsed.data.updatedAt ? String(parsed.data.updatedAt) : '',
    privacy: parsed.data.privacy ?? 'public',
    body: parsed.content.trimStart(),
  })
  const updatedAt = normalizeDateString(data.updatedAt, '更新时间')

  return {
    type: 'about',
    adminPath,
    filePath: `${adminPath}.mdx`,
    title: data.title,
    summary: data.summary || '',
    body: data.body,
    frontmatter: {
      title: data.title,
      summary: data.summary || '',
      updatedAt,
      privacy: data.privacy,
    },
    updatedAt,
    displayStatus: {
      value: data.privacy,
      label: formatPrivacyLabel(data.privacy),
      tone: privacyTone(data.privacy),
    },
  }
}

function validateAboutInput(input: unknown) {
  const parsed = aboutInputSchema.parse(input)
  return {
    title: parsed.title,
    summary: normalizeOptionalString(parsed.summary) || undefined,
    updatedAt: normalizeDateString(parsed.updatedAt, '更新时间'),
    privacy: parsed.privacy,
    body: parsed.body.trimStart(),
  }
}

function stringifyAbout(input: Record<string, unknown>) {
  return matter.stringify(
    `${String(input.body ?? '').trim()}\n`,
    omitUndefinedFields({
      title: input.title,
      summary: input.summary,
      updatedAt: input.updatedAt,
      privacy: input.privacy,
    })
  )
}

function parseProjectRecord(adminPath: string, source: string): AdminContentRecord {
  const parsed = parseMatter(source)
  const data = projectInputSchema.parse({
    id: parsed.data.id,
    title: parsed.data.title,
    status: parsed.data.status,
    startedAt: parsed.data.startedAt ? String(parsed.data.startedAt) : '',
    updatedAt: parsed.data.updatedAt ? String(parsed.data.updatedAt) : '',
    summary: parsed.data.summary,
    stack: Array.isArray(parsed.data.stack) ? parsed.data.stack : [],
    repo: parsed.data.repo,
    demo: parsed.data.demo,
    role: parsed.data.role,
    highlights: Array.isArray(parsed.data.highlights) ? parsed.data.highlights : [],
    tags: Array.isArray(parsed.data.tags) ? parsed.data.tags : [],
    privacy: parsed.data.privacy ?? 'public',
    body: parsed.content.trimStart(),
  })

  const updatedAt = normalizeDateString(data.updatedAt, '更新时间')
  return {
    type: 'project',
    adminPath,
    filePath: `${adminPath}/index.mdx`,
    title: data.title,
    summary: data.summary || formatProjectStatusLabel(data.status),
    body: data.body,
    frontmatter: {
      pathSlug: adminPath,
      id: data.id,
      title: data.title,
      status: data.status,
      startedAt: normalizeDateString(data.startedAt, '开始时间'),
      updatedAt,
      summary: data.summary || '',
      stack: cleanArray(data.stack),
      repo: data.repo || '',
      demo: data.demo || '',
      role: data.role || '',
      highlights: cleanArray(data.highlights),
      tags: cleanArray(data.tags),
      privacy: data.privacy,
    },
    updatedAt,
    displayStatus: {
      value: data.status,
      label: formatProjectStatusLabel(data.status),
      tone: projectStatusTone(data.status),
    },
    group: {
      value: data.privacy,
      label: formatPrivacyLabel(data.privacy),
    },
  }
}

function validateProjectInput(input: unknown, currentAdminPath?: string) {
  const parsed = projectInputSchema.parse(input)
  const resolvedPath = normalizeSlug(
    parsed.pathSlug || currentAdminPath || parsed.id || parsed.title
  )
  if (!resolvedPath) {
    throw new Error('项目路径生成失败')
  }

  return {
    pathSlug: resolvedPath,
    id: parsed.id,
    title: parsed.title,
    status: parsed.status,
    startedAt: normalizeDateString(parsed.startedAt, '开始时间'),
    updatedAt: normalizeDateString(parsed.updatedAt, '更新时间'),
    summary: normalizeOptionalString(parsed.summary) || undefined,
    stack: cleanArray(parsed.stack),
    repo: normalizeOptionalString(parsed.repo) || undefined,
    demo: normalizeOptionalString(parsed.demo) || undefined,
    role: normalizeOptionalString(parsed.role) || undefined,
    highlights: cleanArray(parsed.highlights),
    tags: cleanArray(parsed.tags),
    privacy: parsed.privacy,
    body: parsed.body.trimStart(),
  }
}

function stringifyProject(input: Record<string, unknown>) {
  return matter.stringify(
    `${String(input.body ?? '').trim()}\n`,
    omitUndefinedFields({
      id: input.id,
      title: input.title,
      status: input.status,
      startedAt: input.startedAt,
      updatedAt: input.updatedAt,
      summary: input.summary,
      stack: input.stack,
      repo: input.repo,
      demo: input.demo,
      role: input.role,
      highlights: input.highlights,
      tags: input.tags,
      privacy: input.privacy,
    })
  )
}

function parseAuthorRecord(adminPath: string, source: string): AdminContentRecord {
  const parsed = parseMatter(source)
  const data = authorInputSchema.parse({
    name: parsed.data.name,
    avatar: parsed.data.avatar,
    occupation: parsed.data.occupation,
    company: parsed.data.company,
    email: parsed.data.email,
    twitter: parsed.data.twitter,
    bluesky: parsed.data.bluesky,
    linkedin: parsed.data.linkedin,
    github: parsed.data.github,
    layout: parsed.data.layout,
    body: parsed.content.trimStart(),
  })

  return {
    type: 'authors',
    adminPath,
    filePath: `${adminPath}.mdx`,
    title: data.name,
    summary: data.occupation || data.company || '',
    body: data.body,
    frontmatter: {
      pathSlug: adminPath,
      name: data.name,
      avatar: data.avatar || '',
      occupation: data.occupation || '',
      company: data.company || '',
      email: data.email || '',
      twitter: data.twitter || '',
      bluesky: data.bluesky || '',
      linkedin: data.linkedin || '',
      github: data.github || '',
      layout: data.layout || '',
    },
    displayStatus: {
      value: 'published',
      label: '已发布',
      tone: 'green',
    },
  }
}

function validateAuthorInput(input: unknown, currentAdminPath?: string) {
  const parsed = authorInputSchema.parse(input)
  const resolvedPath = normalizeSlug(parsed.pathSlug || currentAdminPath || parsed.name)
  if (!resolvedPath) {
    throw new Error('作者路径生成失败')
  }

  return {
    pathSlug: resolvedPath,
    name: parsed.name,
    avatar: normalizeOptionalString(parsed.avatar) || undefined,
    occupation: normalizeOptionalString(parsed.occupation) || undefined,
    company: normalizeOptionalString(parsed.company) || undefined,
    email: normalizeOptionalString(parsed.email) || undefined,
    twitter: normalizeOptionalString(parsed.twitter) || undefined,
    bluesky: normalizeOptionalString(parsed.bluesky) || undefined,
    linkedin: normalizeOptionalString(parsed.linkedin) || undefined,
    github: normalizeOptionalString(parsed.github) || undefined,
    layout: normalizeOptionalString(parsed.layout) || undefined,
    body: parsed.body.trimStart(),
  }
}

function stringifyAuthor(input: Record<string, unknown>) {
  return matter.stringify(
    `${String(input.body ?? '').trim()}\n`,
    omitUndefinedFields({
      name: input.name,
      avatar: input.avatar,
      occupation: input.occupation,
      company: input.company,
      email: input.email,
      twitter: input.twitter,
      bluesky: input.bluesky,
      linkedin: input.linkedin,
      github: input.github,
      layout: input.layout,
    })
  )
}

function parseWorklogRecord(adminPath: string, source: string): AdminContentRecord {
  const parsed = parseMatter(source)
  const data = worklogInputSchema.parse({
    date: parsed.data.date ? String(parsed.data.date) : '',
    title: parsed.data.title,
    summary: parsed.data.summary,
    updatedAt: parsed.data.updatedAt ? String(parsed.data.updatedAt) : '',
    projects: Array.isArray(parsed.data.projects) ? parsed.data.projects : [],
    tags: Array.isArray(parsed.data.tags) ? parsed.data.tags : [],
    focus: Array.isArray(parsed.data.focus) ? parsed.data.focus : [],
    nextActions: Array.isArray(parsed.data.nextActions) ? parsed.data.nextActions : [],
    aiGenerated: Boolean(parsed.data.aiGenerated),
    privacy: parsed.data.privacy ?? 'public',
    body: parsed.content.trimStart(),
  })

  const date = normalizeDateString(data.date, '日志日期')
  const updatedAt = normalizeDateString(data.updatedAt, '更新时间')
  return {
    type: 'worklog',
    adminPath,
    filePath: `${adminPath}.mdx`,
    title: data.title,
    summary: data.summary,
    body: data.body,
    frontmatter: {
      slug: adminPath.split('/').at(-1) || '',
      date,
      title: data.title,
      summary: data.summary,
      updatedAt,
      projects: cleanArray(data.projects),
      tags: cleanArray(data.tags),
      focus: cleanArray(data.focus),
      nextActions: cleanArray(data.nextActions),
      aiGenerated: data.aiGenerated,
      privacy: data.privacy,
    },
    updatedAt,
    displayStatus: {
      value: data.privacy,
      label: formatPrivacyLabel(data.privacy),
      tone: privacyTone(data.privacy),
    },
    group: {
      value: adminPath.split('/').slice(0, 2).join('/'),
      label: adminPath.split('/').slice(0, 2).join('/'),
    },
  }
}

function validateWorklogInput(input: unknown, currentAdminPath?: string) {
  const parsed = worklogInputSchema.parse(input)
  const normalizedDate = normalizeDateString(parsed.date, '日志日期')
  const date = new Date(normalizedDate)
  const year = String(date.getUTCFullYear())
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const defaultSlug = normalizedDate.slice(0, 10)
  const resolvedSlug = normalizeSlug(
    parsed.slug || currentAdminPath?.split('/').at(-1) || defaultSlug
  )
  if (!resolvedSlug) {
    throw new Error('日志路径生成失败')
  }

  return {
    slug: resolvedSlug,
    date: normalizedDate,
    title: parsed.title,
    summary: parsed.summary,
    updatedAt: normalizeDateString(parsed.updatedAt, '更新时间'),
    projects: cleanArray(parsed.projects),
    tags: cleanArray(parsed.tags),
    focus: cleanArray(parsed.focus),
    nextActions: cleanArray(parsed.nextActions),
    aiGenerated: parsed.aiGenerated,
    privacy: parsed.privacy,
    body: parsed.body.trimStart(),
    pathSlug: `${year}/${month}/${resolvedSlug}`,
  }
}

function stringifyWorklog(input: Record<string, unknown>) {
  return matter.stringify(
    `${String(input.body ?? '').trim()}\n`,
    omitUndefinedFields({
      date: input.date,
      title: input.title,
      summary: input.summary,
      updatedAt: input.updatedAt,
      projects: input.projects,
      tags: input.tags,
      focus: input.focus,
      nextActions: input.nextActions,
      aiGenerated: input.aiGenerated,
      privacy: input.privacy,
    })
  )
}

const contentRegistry: Record<ContentTypeKey, ContentRegistryEntry> = {
  blog: {
    type: {
      key: 'blog',
      label: '文章',
      description: '管理 Blog 文章、草稿与摘要',
      mode: 'collection',
      supportsAssets: true,
      statusFilterLabel: '内容状态',
      statusOptions: [
        { value: '', label: '全部状态' },
        { value: 'draft', label: '仅草稿' },
        { value: 'published', label: '仅已发布' },
      ],
      groupFilterLabel: '分类目录',
    },
    rootDir: blogRoot,
    parse: toBlogRecord,
    resolveCreatePath: (input) => {
      const validated = validateBlogInput(input)
      return `${validated.category}/${validated.slug}`
    },
    validateInput: (input) => validateBlogInput(input),
    stringify: stringifyBlog,
    filePathFromAdminPath: blogFilePathFromAdminPath,
    adminPathFromFilePath: (fullPath) =>
      path
        .relative(blogRoot, fullPath)
        .replace(/\\/g, '/')
        .replace(/\.mdx$/, ''),
    sortTimestamp: (record) =>
      new Date(String(record.frontmatter.date || record.updatedAt || '')).getTime(),
  },
  profile: {
    type: {
      key: 'profile',
      label: 'Profile',
      description: '管理个人档案和长期身份信息',
      mode: 'singleton',
      supportsAssets: true,
      statusFilterLabel: '可见性',
      statusOptions: [
        { value: '', label: '全部状态' },
        { value: 'public', label: '公开' },
        { value: 'private', label: '私有' },
        { value: 'restricted', label: '受限' },
      ],
    },
    rootDir: path.join(dataRoot, 'profile'),
    defaultAdminPath: 'default',
    parse: parseProfileRecord,
    resolveCreatePath: () => 'default',
    validateInput: (input) => validateProfileInput(input),
    stringify: stringifyProfile,
    filePathFromAdminPath: () => singletonFilePath('profile'),
    adminPathFromFilePath: () => 'default',
    sortTimestamp: (record) => new Date(String(record.updatedAt || '')).getTime(),
  },
  about: {
    type: {
      key: 'about',
      label: 'About',
      description: '管理项目说明和关于页面内容',
      mode: 'singleton',
      supportsAssets: true,
      statusFilterLabel: '可见性',
      statusOptions: [
        { value: '', label: '全部状态' },
        { value: 'public', label: '公开' },
        { value: 'private', label: '私有' },
        { value: 'restricted', label: '受限' },
      ],
    },
    rootDir: path.join(dataRoot, 'about'),
    defaultAdminPath: 'default',
    parse: parseAboutRecord,
    resolveCreatePath: () => 'default',
    validateInput: (input) => validateAboutInput(input),
    stringify: stringifyAbout,
    filePathFromAdminPath: () => singletonFilePath('about'),
    adminPathFromFilePath: () => 'default',
    sortTimestamp: (record) => new Date(String(record.updatedAt || '')).getTime(),
  },
  project: {
    type: {
      key: 'project',
      label: 'Projects',
      description: '管理项目档案、状态和阶段成果',
      mode: 'collection',
      supportsAssets: true,
      statusFilterLabel: '项目状态',
      statusOptions: [
        { value: '', label: '全部状态' },
        { value: 'idea', label: '想法' },
        { value: 'active', label: '进行中' },
        { value: 'paused', label: '暂停' },
        { value: 'completed', label: '已完成' },
        { value: 'archived', label: '已归档' },
      ],
      groupFilterLabel: '可见性',
    },
    rootDir: path.join(dataRoot, 'projects'),
    parse: parseProjectRecord,
    resolveCreatePath: (input) => validateProjectInput(input).pathSlug as string,
    validateInput: (input, currentAdminPath) => validateProjectInput(input, currentAdminPath),
    stringify: stringifyProject,
    filePathFromAdminPath: projectFilePath,
    adminPathFromFilePath: (fullPath) =>
      path
        .relative(path.join(dataRoot, 'projects'), fullPath)
        .replace(/\\/g, '/')
        .replace(/\/index\.mdx$/, ''),
    sortTimestamp: (record) => new Date(String(record.updatedAt || '')).getTime(),
  },
  authors: {
    type: {
      key: 'authors',
      label: 'Authors',
      description: '管理博客作者资料和默认作者内容',
      mode: 'collection',
      supportsAssets: true,
      statusOptions: [{ value: '', label: '全部状态' }],
    },
    rootDir: path.join(dataRoot, 'authors'),
    parse: parseAuthorRecord,
    resolveCreatePath: (input) => validateAuthorInput(input).pathSlug as string,
    validateInput: (input, currentAdminPath) => validateAuthorInput(input, currentAdminPath),
    stringify: stringifyAuthor,
    filePathFromAdminPath: (adminPath) => listFilePath('authors', adminPath),
    adminPathFromFilePath: (fullPath) =>
      path
        .relative(path.join(dataRoot, 'authors'), fullPath)
        .replace(/\\/g, '/')
        .replace(/\.mdx$/, ''),
    sortTimestamp: (record) => new Date(String(record.updatedAt || 0)).getTime(),
  },
  worklog: {
    type: {
      key: 'worklog',
      label: 'Worklogs',
      description: '管理工作日志、阶段重点和下一步行动',
      mode: 'collection',
      supportsAssets: true,
      statusFilterLabel: '可见性',
      statusOptions: [
        { value: '', label: '全部状态' },
        { value: 'public', label: '公开' },
        { value: 'private', label: '私有' },
        { value: 'restricted', label: '受限' },
      ],
      groupFilterLabel: '年月',
    },
    rootDir: path.join(dataRoot, 'worklogs'),
    parse: parseWorklogRecord,
    resolveCreatePath: (input) => validateWorklogInput(input).pathSlug as string,
    validateInput: (input, currentAdminPath) => validateWorklogInput(input, currentAdminPath),
    stringify: stringifyWorklog,
    filePathFromAdminPath: (adminPath) => listFilePath('worklogs', adminPath),
    adminPathFromFilePath: (fullPath) =>
      path
        .relative(path.join(dataRoot, 'worklogs'), fullPath)
        .replace(/\\/g, '/')
        .replace(/\.mdx$/, ''),
    sortTimestamp: (record) =>
      new Date(String(record.frontmatter.date || record.updatedAt || '')).getTime(),
  },
}

export function listContentTypes(): AdminContentType[] {
  return Object.values(contentRegistry)
    .map((entry) => entry.type)
    .sort((left, right) => left.label.localeCompare(right.label, 'zh-CN'))
}

export function getContentType(type: string): ContentRegistryEntry {
  if (!(type in contentRegistry)) {
    throw new Error('不支持的内容类型')
  }

  return contentRegistry[type as ContentTypeKey]
}

async function walkContentFiles(currentDir: string, acc: string[] = []) {
  let entries: Array<{ isDirectory: () => boolean; isFile: () => boolean; name: string }> = []
  try {
    entries = await fs.readdir(currentDir, { withFileTypes: true })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return acc
    }
    throw error
  }

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name)
    if (entry.isDirectory()) {
      await walkContentFiles(fullPath, acc)
      continue
    }

    if (entry.isFile() && entry.name.endsWith('.mdx')) {
      acc.push(fullPath)
    }
  }

  return acc
}

export async function listContent(options: ListContentOptions): Promise<ListContentResult> {
  const entry = getContentType(options.type)
  const page = Math.max(1, options.page || 1)
  const pageSize = Math.min(100, Math.max(1, options.pageSize || 12))
  const normalizedKeyword = options.keyword?.trim().toLocaleLowerCase('zh-CN') || ''
  const normalizedStatus = options.status?.trim() || ''
  const normalizedGroup = options.group?.trim() || ''

  const files =
    entry.type.mode === 'singleton'
      ? [entry.filePathFromAdminPath(entry.defaultAdminPath || 'default')]
      : await walkContentFiles(entry.rootDir)

  const existingFiles: string[] = []
  for (const fullPath of files) {
    try {
      await fs.access(fullPath)
      existingFiles.push(fullPath)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error
      }
    }
  }

  const records = await Promise.all(
    existingFiles.map(async (fullPath) => {
      const source = await fs.readFile(fullPath, 'utf8')
      const adminPath = entry.adminPathFromFilePath(fullPath)
      return entry.parse(adminPath, source)
    })
  )

  const sortedRecords = records.sort(
    (left, right) => entry.sortTimestamp(right) - entry.sortTimestamp(left)
  )
  const keywordFiltered = normalizedKeyword
    ? sortedRecords.filter((record) => {
        const searchText = [
          record.title,
          record.summary,
          record.adminPath,
          ...Object.values(record.frontmatter).flatMap((value) =>
            Array.isArray(value) ? value.map(String) : [String(value ?? '')]
          ),
        ]
          .join(' ')
          .toLocaleLowerCase('zh-CN')
        return searchText.includes(normalizedKeyword)
      })
    : sortedRecords

  const statusFiltered = normalizedStatus
    ? keywordFiltered.filter((record) => record.displayStatus.value === normalizedStatus)
    : keywordFiltered
  const groupFiltered = normalizedGroup
    ? statusFiltered.filter((record) => record.group?.value === normalizedGroup)
    : statusFiltered

  const total = groupFiltered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * pageSize
  const availableGroups = [
    ...new Set(sortedRecords.map((record) => record.group?.value).filter(Boolean)),
  ] as string[]

  return {
    items: groupFiltered.slice(startIndex, startIndex + pageSize),
    total,
    page: currentPage,
    pageSize,
    totalPages,
    availableGroups,
  }
}

export async function readContent(type: ContentTypeKey, adminPath?: string) {
  const entry = getContentType(type)
  const resolvedAdminPath =
    entry.type.mode === 'singleton'
      ? entry.defaultAdminPath || 'default'
      : normalizeAdminPath(adminPath || '', `${entry.type.label} 路径`)

  const filePath = entry.filePathFromAdminPath(resolvedAdminPath)
  const source = await fs.readFile(filePath, 'utf8')
  return entry.parse(resolvedAdminPath, source)
}

export async function createContent(type: ContentTypeKey, input: unknown) {
  const entry = getContentType(type)
  if (entry.type.mode === 'singleton') {
    const filePath = entry.filePathFromAdminPath(entry.defaultAdminPath || 'default')
    try {
      await fs.access(filePath)
      throw new Error(`${entry.type.label} 为单例内容，请直接编辑现有条目`)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error
      }
    }
  }

  const validated = entry.validateInput(input)
  const resolvedAdminPath =
    entry.type.mode === 'singleton'
      ? entry.defaultAdminPath || 'default'
      : String(validated.pathSlug || entry.resolveCreatePath(input))
  const filePath = entry.filePathFromAdminPath(resolvedAdminPath)

  await fs.mkdir(path.dirname(filePath), { recursive: true })

  try {
    await fs.access(filePath)
    throw new Error(`${entry.type.label} 已存在，请更换路径标识`)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  }

  await fs.writeFile(filePath, entry.stringify(validated), 'utf8')
  return readContent(type, resolvedAdminPath)
}

export async function updateContent(
  type: ContentTypeKey,
  adminPath: string | undefined,
  input: unknown
) {
  const entry = getContentType(type)
  const resolvedAdminPath =
    entry.type.mode === 'singleton'
      ? entry.defaultAdminPath || 'default'
      : normalizeAdminPath(adminPath || '', `${entry.type.label} 路径`)
  const filePath = entry.filePathFromAdminPath(resolvedAdminPath)
  const validated = entry.validateInput(input, resolvedAdminPath)
  await fs.access(filePath)
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, entry.stringify(validated), 'utf8')
  return readContent(type, resolvedAdminPath)
}

async function removeIfExists(targetPath: string) {
  try {
    await fs.access(targetPath)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false
    }
    throw error
  }

  await fs.rm(targetPath, { recursive: true, force: true })
  return true
}

async function cleanupEmptyDirectories(startDir: string, stopDir: string) {
  let currentDir = path.resolve(startDir)
  const normalizedStopDir = path.resolve(stopDir)

  while (currentDir.startsWith(`${normalizedStopDir}${path.sep}`)) {
    try {
      const entries = await fs.readdir(currentDir)
      if (entries.length > 0) {
        return
      }
      await fs.rmdir(currentDir)
    } catch (error) {
      const errorCode = (error as NodeJS.ErrnoException).code
      if (errorCode === 'ENOENT' || errorCode === 'ENOTEMPTY') {
        return
      }
      throw error
    }

    currentDir = path.dirname(currentDir)
  }
}

export async function deleteContent(
  type: ContentTypeKey,
  adminPath: string | undefined
): Promise<DeleteContentResult> {
  const entry = getContentType(type)
  if (entry.type.mode === 'singleton') {
    throw new Error(`${entry.type.label} 为单例内容，不支持删除`)
  }

  const resolvedAdminPath = normalizeAdminPath(adminPath || '', `${entry.type.label} 路径`)
  const content = await readContent(type, resolvedAdminPath)
  const filePath = entry.filePathFromAdminPath(resolvedAdminPath)
  const assetDir = imageDirFromContent(type, content)

  await fs.access(filePath)
  await fs.unlink(filePath)
  await cleanupEmptyDirectories(path.dirname(filePath), entry.rootDir)

  const removedAssetDir = (await removeIfExists(assetDir)) ? assetDir : null
  if (removedAssetDir) {
    await cleanupEmptyDirectories(
      path.dirname(removedAssetDir),
      type === 'blog' ? postsImageRoot : imagesRoot
    )
  }

  return {
    type,
    adminPath: resolvedAdminPath,
    filePath,
    assetDir: removedAssetDir,
    requiresPublish: true,
  }
}

export async function validateStoredContent(type: ContentTypeKey, adminPath?: string) {
  const content = await readContent(type, adminPath)
  getContentType(type).validateInput(content.frontmatter, content.adminPath)
  return content
}

export function imageDirFromContent(type: ContentTypeKey, content: AdminContentRecord) {
  switch (type) {
    case 'blog':
      return imageDirFromPost({
        date: String(content.frontmatter.date || content.updatedAt || ''),
        slug: content.adminPath.split('/').at(-1) || 'post',
      })
    case 'profile':
      return imageDirFromSingleton('profile')
    case 'about':
      return imageDirFromSingleton('about')
    case 'project':
      return imageDirFromProject(content.adminPath)
    case 'authors':
      return imageDirFromAuthor(content.adminPath)
    case 'worklog':
      return imageDirFromWorklog({
        date: String(content.frontmatter.date || content.updatedAt || ''),
        slug: content.adminPath.split('/').at(-1) || 'worklog',
      })
    default:
      throw new Error('当前内容类型不支持资源上传')
  }
}

export async function listCategories() {
  const result = await listContent({ type: 'blog', page: 1, pageSize: 200 })
  return result.availableGroups.sort((left, right) => left.localeCompare(right, 'zh-CN'))
}

export async function listPosts(options: {
  category?: string
  keyword?: string
  status?: 'draft' | 'published'
  page?: number
  pageSize?: number
}) {
  const result = await listContent({
    type: 'blog',
    group: options.category,
    keyword: options.keyword,
    status: options.status,
    page: options.page,
    pageSize: options.pageSize,
  })

  return {
    items: result.items.map(toLegacyPostRecord),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
  }
}

function toLegacyPostRecord(record: AdminContentRecord): PostRecord {
  return {
    adminPath: record.adminPath,
    category: String(record.frontmatter.category || categoryFromAdminPath(record.adminPath)),
    filePath: record.filePath,
    title: record.title,
    date: String(record.frontmatter.date || record.updatedAt || ''),
    summary: record.summary,
    tags: Array.isArray(record.frontmatter.tags) ? (record.frontmatter.tags as string[]) : [],
    authors: Array.isArray(record.frontmatter.authors)
      ? (record.frontmatter.authors as string[])
      : [],
    images: Array.isArray(record.frontmatter.images) ? (record.frontmatter.images as string[]) : [],
    draft: Boolean(record.frontmatter.draft),
    layout: String(record.frontmatter.layout || 'PostLayout'),
    bibliography: record.frontmatter.bibliography
      ? String(record.frontmatter.bibliography)
      : undefined,
    canonicalUrl: record.frontmatter.canonicalUrl
      ? String(record.frontmatter.canonicalUrl)
      : undefined,
    body: record.body,
    lastmod: record.lastmod,
  }
}

export async function readPost(adminPath: string) {
  const record = await readContent('blog', adminPath)
  return toLegacyPostRecord(record)
}

export function validatePostInput(input: unknown) {
  return validateBlogInput(input)
}

export async function createPost(input: unknown) {
  const record = await createContent('blog', input)
  return toLegacyPostRecord(record)
}

export async function updatePost(adminPath: string, input: unknown) {
  const record = await updateContent('blog', adminPath, input)
  return toLegacyPostRecord(record)
}

export async function validateStoredPost(adminPath: string) {
  const record = await validateStoredContent('blog', adminPath)
  return toLegacyPostRecord(record)
}
