import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import { loadWorkspaceEnv, resolveContentWorkspacePaths } from './lib/content-workspace.mjs'

const workspaceRoot = process.cwd()
loadWorkspaceEnv(workspaceRoot)
const { blogRoot } = resolveContentWorkspacePaths(workspaceRoot)

async function walk(dir, acc = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await walk(fullPath, acc)
      continue
    }
    if (entry.isFile() && entry.name.endsWith('.mdx')) {
      acc.push(fullPath)
    }
  }
  return acc
}

function ensure(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function validatePost(source, filePath) {
  const parsed = matter(source)
  const { data, content } = parsed
  ensure(typeof data.title === 'string' && data.title.trim(), `${filePath}: title 缺失`)
  ensure(data.date && !Number.isNaN(new Date(data.date).getTime()), `${filePath}: date 不合法`)
  ensure(typeof data.summary === 'string' && data.summary.trim(), `${filePath}: summary 缺失`)
  ensure(data.tags === undefined || Array.isArray(data.tags), `${filePath}: tags 必须是数组`)
  ensure(data.authors === undefined || Array.isArray(data.authors), `${filePath}: authors 必须是数组`)
  ensure(data.images === undefined || Array.isArray(data.images), `${filePath}: images 必须是数组`)
  ensure(
    data.layout === undefined || (typeof data.layout === 'string' && data.layout.trim()),
    `${filePath}: layout 不合法`
  )
  ensure(typeof content === 'string' && content.trim(), `${filePath}: 正文不能为空`)
}

async function main() {
  try {
    await fs.access(blogRoot)
  } catch {
    console.log(`未发现博客目录，跳过校验: ${path.relative(workspaceRoot, blogRoot)}`)
    return
  }

  const files = await walk(blogRoot)
  for (const file of files) {
    const source = await fs.readFile(file, 'utf8')
    validatePost(source, path.relative(workspaceRoot, file))
  }
  console.log(`内容校验通过，共检查 ${files.length} 篇文章`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : '内容校验失败')
  process.exit(1)
})
