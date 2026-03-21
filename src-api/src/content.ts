import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import { slug as githubSlug } from 'github-slugger'
import { z } from 'zod'
import { blogRoot, postsImageRoot } from './config.js'

const frontmatterSchema = z.object({
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

export type PostInput = z.infer<typeof frontmatterSchema>

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

export function normalizeAdminPath(adminPath: string) {
  const cleaned = adminPath
    .split('/')
    .map((segment) => {
      try {
        return decodeURIComponent(segment)
      } catch {
        throw new Error('文章路径包含非法编码')
      }
    })
    .join('/')
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '')
  assertSafePathSegment(cleaned, '文章路径')
  return cleaned
}

export function filePathFromAdminPath(adminPath: string) {
  const normalizedPath = normalizeAdminPath(adminPath)
  return path.join(blogRoot, `${normalizedPath}.mdx`)
}

export function categoryFromAdminPath(adminPath: string) {
  const normalizedPath = normalizeAdminPath(adminPath)
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

function cleanArray(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean)
}

function normalizeDateString(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error('日期格式不合法')
  }
  return date.toISOString()
}

function toPostRecord(adminPath: string, source: string): PostRecord {
  const parsed = matter(source)
  const data = frontmatterSchema.parse({
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

  return {
    adminPath,
    category: categoryFromAdminPath(adminPath),
    filePath: `${adminPath}.mdx`,
    title: data.title,
    date: normalizeDateString(data.date),
    summary: data.summary,
    tags: cleanArray(data.tags),
    authors: cleanArray(data.authors),
    images: cleanArray(data.images),
    draft: data.draft,
    layout: data.layout,
    bibliography: data.bibliography,
    canonicalUrl: data.canonicalUrl,
    body: data.body,
    lastmod: parsed.data.lastmod ? String(parsed.data.lastmod) : undefined,
  }
}

async function walkBlogFiles(currentDir: string, acc: string[] = []) {
  const entries = await fs.readdir(currentDir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name)
    if (entry.isDirectory()) {
      await walkBlogFiles(fullPath, acc)
      continue
    }
    if (entry.isFile() && entry.name.endsWith('.mdx')) {
      acc.push(fullPath)
    }
  }
  return acc
}

export async function listPosts() {
  const files = await walkBlogFiles(blogRoot)
  const records = await Promise.all(
    files.map(async (fullPath) => {
      const source = await fs.readFile(fullPath, 'utf8')
      const relativePath = path.relative(blogRoot, fullPath).replace(/\\/g, '/')
      const adminPath = relativePath.replace(/\.mdx$/, '')
      return toPostRecord(adminPath, source)
    })
  )

  return records.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })
}

export async function listCategories() {
  const entries = await fs.readdir(blogRoot, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right, 'zh-CN'))
}

export async function readPost(adminPath: string) {
  const filePath = filePathFromAdminPath(adminPath)
  const source = await fs.readFile(filePath, 'utf8')
  return toPostRecord(normalizeAdminPath(adminPath), source)
}

export function validatePostInput(input: unknown) {
  const parsed = frontmatterSchema.parse(input)
  const normalizedSlug = normalizeSlug(parsed.slug || parsed.title)
  if (!normalizedSlug) {
    throw new Error('Slug 生成失败')
  }

  return {
    ...parsed,
    category: normalizeAdminPath(parsed.category),
    slug: normalizedSlug,
    tags: cleanArray(parsed.tags),
    authors: cleanArray(parsed.authors.length > 0 ? parsed.authors : ['default']),
    images: cleanArray(parsed.images),
    date: normalizeDateString(parsed.date),
    body: parsed.body.trimStart(),
  }
}

function stringifyPost(input: ReturnType<typeof validatePostInput>) {
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

  return matter.stringify(`${input.body.trim()}\n`, frontmatter)
}

export async function createPost(input: unknown) {
  const validated = validatePostInput(input)
  const adminPath = `${validated.category}/${validated.slug}`
  const filePath = filePathFromAdminPath(adminPath)

  await fs.mkdir(path.dirname(filePath), { recursive: true })

  try {
    await fs.access(filePath)
    throw new Error('文章已存在，请更换 slug')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  }

  await fs.writeFile(filePath, stringifyPost(validated), 'utf8')
  return readPost(adminPath)
}

export async function updatePost(adminPath: string, input: unknown) {
  const normalizedPath = normalizeAdminPath(adminPath)
  const filePath = filePathFromAdminPath(normalizedPath)
  const validated = validatePostInput(input)
  await fs.access(filePath)
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, stringifyPost(validated), 'utf8')
  return readPost(normalizedPath)
}

export async function validateStoredPost(adminPath: string) {
  const post = await readPost(adminPath)
  validatePostInput(post)
  return post
}
