import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  WORKSPACE_DIRS,
  loadWorkspaceEnv,
  resolveWorkspaceDir,
} from './lib/content-workspace.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const exampleFiles = {
  'data/profile/default.mdx': `---
name: 示例用户
headline: 个人品牌系统设计者 ｜ 示例构建者
updatedAt: 2026-04-12T00:00:00.000Z
skills:
  - 品牌系统
  - 产品策略
  - Agent 工作流
highlights:
  - 请将这里替换为你的真实私有资料。
privacy: private
---

在这里填写你的个人资料内容。
`,
  'data/about/default.mdx': `---
title: 关于你的私有内容工作区
updatedAt: 2026-04-12T00:00:00.000Z
privacy: private
---

在这里填写你的 About 内容。
`,
  'data/blog/example/getting-started-with-your-workspace.mdx': `---
title: 开始搭建你的 ProtoMe 私有工作区
date: 2026-04-12T00:00:00.000Z
tags:
  - example
  - workspace
summary: 这是一篇初始化时生成的示例文章，用来演示 Blog 内容结构。
authors:
  - default
layout: PostLayout
draft: false
---

你可以把这篇文章替换成自己的第一篇博客。

建议从这些主题开始：

- 你的个人平台定位
- 你的方法论与专业边界
- 你的代表项目与阶段性成果
`,
  'data/system/blog-style.mdx': `---
summary: 记录你的博客风格、结构偏好与待分析文章。
analyzedPostIds: []
structurePatterns: []
doRules: []
dontRules: []
updatedAt: 2026-04-12T00:00:00.000Z
---

在这里沉淀你的写作方法论。
`,
  'data/system/worklog-focus.mdx': `---
currentFocus: 记录你的阶段目标与工作重点。
activeThemes: []
currentMilestones: []
analyzedWorklogIds: []
updatedAt: 2026-04-12T00:00:00.000Z
---

在这里记录近期工作焦点。
`,
}

function parseArgs(argv) {
  const args = [...argv]
  const flags = {
    dir: undefined,
    withExamples: false,
    writeEnv: false,
    force: false,
    help: false,
  }

  while (args.length > 0) {
    const arg = args.shift()
    if (!arg) {
      continue
    }

    if (arg === '--dir') {
      const value = args.shift()
      if (!value) {
        throw new Error('缺少 --dir 的目录参数')
      }
      flags.dir = value
      continue
    }

    if (arg === '--with-examples') {
      flags.withExamples = true
      continue
    }

    if (arg === '--write-env') {
      flags.writeEnv = true
      continue
    }

    if (arg === '--force') {
      flags.force = true
      continue
    }

    if (arg === '--help' || arg === '-h') {
      flags.help = true
      continue
    }

    throw new Error(`不支持的参数：${arg}`)
  }

  return flags
}

async function ensureDir(targetPath) {
  await fs.mkdir(targetPath, { recursive: true })
}

async function writeExampleFile(workspaceDir, relativePath, content, force) {
  const fullPath = path.join(workspaceDir, relativePath)
  await ensureDir(path.dirname(fullPath))

  try {
    if (!force) {
      await fs.access(fullPath)
      return { path: relativePath, created: false }
    }
  } catch {}

  await fs.writeFile(fullPath, content, 'utf8')
  return { path: relativePath, created: true }
}

function upsertEnvValue(source, key, value) {
  const line = `${key}=${value}`
  const pattern = new RegExp(`^${key}=.*$`, 'm')

  if (!source.trim()) {
    return `${line}\n`
  }

  if (pattern.test(source)) {
    return source.replace(pattern, line).replace(/\n?$/, '\n')
  }

  return `${source.replace(/\s*$/, '')}\n${line}\n`
}

async function writeEnvLocal(workspaceDir) {
  const envLocalPath = path.join(repoRoot, '.env.local')
  let source = ''

  try {
    source = await fs.readFile(envLocalPath, 'utf8')
  } catch (error) {
    if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') {
      throw error
    }
  }

  const nextSource = upsertEnvValue(source, 'PROTOME_CONTENT_WORKSPACE', workspaceDir)
  await fs.writeFile(envLocalPath, nextSource, 'utf8')
}

function printHelp() {
  process.stdout.write(`ProtoMe Workspace Tools

用法：
  pnpm protome init-workspace [--dir <path>] [--with-examples] [--write-env] [--force]

参数：
  --dir <path>         指定私有内容工作区目录
  --with-examples      生成最小示例内容文件
  --write-env          将 PROTOME_CONTENT_WORKSPACE 写入 .env.local
  --force              允许覆盖示例文件
`)
}

async function initWorkspace(args) {
  const workspaceDir = resolveWorkspaceDir(args.dir, repoRoot)

  await ensureDir(workspaceDir)
  await Promise.all(WORKSPACE_DIRS.map((relativeDir) => ensureDir(path.join(workspaceDir, relativeDir))))

  const results = []
  if (args.withExamples) {
    for (const [relativePath, content] of Object.entries(exampleFiles)) {
      results.push(await writeExampleFile(workspaceDir, relativePath, content, args.force))
    }
  }

  if (args.writeEnv) {
    await writeEnvLocal(workspaceDir)
  }

  const createdExampleCount = results.filter((item) => item.created).length
  const createdDirCount = WORKSPACE_DIRS.length + 1

  process.stdout.write(`私有内容工作区已初始化
workspace: ${workspaceDir}
directories: ${createdDirCount}
examples: ${createdExampleCount}
writeEnv: ${args.writeEnv ? 'yes' : 'no'}

建议下一步：
  pnpm dev
  pnpm dev:api
  pnpm build:snapshots
`)
}

async function main() {
  loadWorkspaceEnv(repoRoot)

  const [, , command, ...argv] = process.argv
  if (!command || command === '--help' || command === '-h') {
    printHelp()
    return
  }

  const args = parseArgs(argv)

  if (args.help) {
    printHelp()
    return
  }

  if (command !== 'init-workspace') {
    throw new Error(`不支持的子命令：${command}`)
  }

  await initWorkspace(args)
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'ProtoMe 命令执行失败'}\n`)
  process.exit(1)
})
