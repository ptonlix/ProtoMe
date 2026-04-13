import cors from 'cors'
import express from 'express'
import multer from 'multer'
import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import {
  adminOrigin,
  maxUploadSize,
  port,
  publicRoot,
  resolveAdminKey,
  workspaceRoot,
} from './config.js'
import {
  createPost,
  createContent,
  deleteContent,
  getContentType,
  imageDirFromPost,
  imageDirFromContent,
  listCategories,
  listContent,
  listContentTypes,
  listPosts,
  normalizeAdminPath,
  normalizeSlug,
  readContent,
  readPost,
  updatePost,
  updateContent,
  validateStoredContent,
  validateStoredPost,
} from './content.js'
import { publishState } from './publish-state.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxUploadSize },
})

const allowedMimeTypes = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
])

const resolvedAdminKey = resolveAdminKey()
const app = express()
app.use(cors({ origin: adminOrigin }))
app.use(express.json({ limit: '2mb' }))

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${Math.round((bytes / (1024 * 1024)) * 10) / 10}MB`
  }

  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)}KB`
  }

  return `${bytes}B`
}

function toPublicAssetUrl(outputPath: string) {
  const relativePath = path.relative(publicRoot, outputPath).replace(/\\/g, '/')
  if (!relativePath || relativePath.startsWith('..')) {
    throw new Error('资源公开路径生成失败')
  }
  return `/${relativePath}`
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const key = req.header('x-admin-key')
  if (!key || key !== resolvedAdminKey) {
    res.status(401).json({ error: '后台密钥无效' })
    return
  }
  next()
}

function getAdminPath(req: express.Request) {
  const raw = String(req.query.path || '')
  if (!raw) {
    throw new Error('缺少文章路径 path')
  }
  return normalizeAdminPath(raw)
}

function getContentTypeKey(req: express.Request) {
  const raw = String(req.query.type || '').trim()
  if (!raw) {
    throw new Error('缺少内容类型 type')
  }

  return getContentType(raw).type.key
}

function getOptionalContentPath(req: express.Request) {
  const raw = typeof req.query.path === 'string' ? req.query.path : ''
  return raw ? normalizeAdminPath(raw, '内容路径') : undefined
}

function triggerPublishTask(targetPath: string | null) {
  if (publishState.status === 'running') {
    throw new Error('当前已有发布任务在执行')
  }

  publishState.status = 'running'
  publishState.message = '正在执行校验、构建与重启'
  publishState.currentPath = targetPath
  publishState.startedAt = new Date().toISOString()
  publishState.finishedAt = null

  const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
  const child = spawn(pnpmCommand, ['exec', 'node', './scripts/publish.mjs'], {
    cwd: workspaceRoot,
    env: {
      ...process.env,
      PROTOME_PUBLISH_PATH: targetPath || 'all',
    },
    stdio: 'pipe',
  })

  let stderr = ''
  let stdout = ''
  child.stdout.on('data', (chunk) => {
    const text = chunk.toString()
    stdout += text
    process.stdout.write(`[publish] ${text}`)
  })

  child.stderr.on('data', (chunk) => {
    const text = chunk.toString()
    stderr += text
    process.stderr.write(`[publish] ${text}`)
  })

  child.on('exit', (code) => {
    publishState.finishedAt = new Date().toISOString()
    if (code === 0) {
      publishState.status = 'success'
      publishState.message = '发布完成'
      return
    }

    publishState.status = 'failed'
    publishState.message = stderr.trim() || stdout.trim() || '发布失败'
  })

  return publishState
}

function safeFileName(originalName: string) {
  const extension = path.extname(originalName).toLowerCase()
  const baseName = path.basename(originalName, extension)
  const normalizedBase = normalizeSlug(baseName) || 'image'
  return `${normalizedBase}${extension}`
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/admin', requireAdmin)

app.get('/api/admin/content/types', (_req, res) => {
  res.json({ types: listContentTypes() })
})

app.get('/api/admin/content', async (req, res) => {
  try {
    const type = getContentTypeKey(req)
    const rawKeyword = typeof req.query.keyword === 'string' ? req.query.keyword : undefined
    const rawStatus = typeof req.query.status === 'string' ? req.query.status : undefined
    const rawGroup = typeof req.query.group === 'string' ? req.query.group : undefined
    const rawPage = typeof req.query.page === 'string' ? Number.parseInt(req.query.page, 10) : 1
    const rawPageSize =
      typeof req.query.pageSize === 'string' ? Number.parseInt(req.query.pageSize, 10) : 12

    const result = await listContent({
      type,
      keyword: rawKeyword,
      status: rawStatus,
      group: rawGroup,
      page: Number.isNaN(rawPage) ? 1 : rawPage,
      pageSize: Number.isNaN(rawPageSize) ? 12 : rawPageSize,
    })

    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : '内容列表读取失败' })
  }
})

app.get('/api/admin/content/item', async (req, res) => {
  try {
    const type = getContentTypeKey(req)
    const entry = getContentType(type)
    const item = await readContent(
      type,
      entry.type.mode === 'singleton' ? undefined : getOptionalContentPath(req)
    )
    res.json({ item })
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : '内容读取失败' })
  }
})

app.post('/api/admin/content', async (req, res) => {
  try {
    const type = getContentTypeKey(req)
    const item = await createContent(type, req.body)
    res.status(201).json({ item })
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '内容创建失败' })
  }
})

app.put('/api/admin/content/item', async (req, res) => {
  try {
    const type = getContentTypeKey(req)
    const entry = getContentType(type)
    const item = await updateContent(
      type,
      entry.type.mode === 'singleton' ? undefined : getOptionalContentPath(req),
      req.body
    )
    res.json({ item })
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '内容更新失败' })
  }
})

app.delete('/api/admin/content/item', async (req, res) => {
  try {
    const type = getContentTypeKey(req)
    const entry = getContentType(type)
    if (entry.type.mode === 'singleton') {
      throw new Error('单例内容不支持删除')
    }

    const result = await deleteContent(type, getOptionalContentPath(req))
    res.json({ result })
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '内容删除失败' })
  }
})

app.post('/api/admin/content/item/assets', upload.single('file'), async (req, res) => {
  try {
    const type = getContentTypeKey(req)
    if (!req.file) {
      throw new Error('未上传文件')
    }
    if (!allowedMimeTypes.has(req.file.mimetype)) {
      throw new Error('仅支持 png、jpg、webp、gif、svg、avif 图片')
    }

    const entry = getContentType(type)
    if (!entry.type.supportsAssets) {
      throw new Error('当前内容类型不支持资源上传')
    }

    const content = await validateStoredContent(
      type,
      entry.type.mode === 'singleton' ? undefined : getOptionalContentPath(req)
    )
    const uploadDir = imageDirFromContent(type, content)
    await fs.mkdir(uploadDir, { recursive: true })

    const fileName = safeFileName(req.file.originalname)
    const outputPath = path.join(uploadDir, fileName)
    await fs.writeFile(outputPath, req.file.buffer)

    const publicSrc = toPublicAssetUrl(outputPath)

    res.status(201).json({
      asset: {
        src: publicSrc,
        alt: content.title,
        markdown: `![${content.title}](${publicSrc})`,
        size: req.file.size,
        mimeType: req.file.mimetype,
      },
    })
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '资源上传失败' })
  }
})

app.get('/api/admin/posts', async (req, res) => {
  try {
    const rawCategory = typeof req.query.category === 'string' ? req.query.category : undefined
    const rawKeyword = typeof req.query.keyword === 'string' ? req.query.keyword : undefined
    const rawStatus =
      req.query.status === 'draft' || req.query.status === 'published'
        ? req.query.status
        : undefined
    const rawPage = typeof req.query.page === 'string' ? Number.parseInt(req.query.page, 10) : 1
    const rawPageSize =
      typeof req.query.pageSize === 'string' ? Number.parseInt(req.query.pageSize, 10) : 12
    const result = await listPosts({
      category: rawCategory,
      keyword: rawKeyword,
      status: rawStatus,
      page: Number.isNaN(rawPage) ? 1 : rawPage,
      pageSize: Number.isNaN(rawPageSize) ? 12 : rawPageSize,
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : '文章列表读取失败' })
  }
})

app.get('/api/admin/categories', async (_req, res) => {
  try {
    const categories = await listCategories()
    res.json({ categories })
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : '分类目录读取失败' })
  }
})

app.get('/api/admin/post', async (req, res) => {
  try {
    const post = await readPost(getAdminPath(req))
    res.json({ post })
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : '文章读取失败' })
  }
})

app.post('/api/admin/posts', async (req, res) => {
  try {
    const post = await createPost(req.body)
    res.status(201).json({ post })
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '文章创建失败' })
  }
})

app.put('/api/admin/post', async (req, res) => {
  try {
    const post = await updatePost(getAdminPath(req), req.body)
    res.json({ post })
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '文章更新失败' })
  }
})

app.post('/api/admin/post/assets', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error('未上传文件')
    }
    if (!allowedMimeTypes.has(req.file.mimetype)) {
      throw new Error('仅支持 png、jpg、webp、gif、svg、avif 图片')
    }

    const post = await validateStoredPost(getAdminPath(req))
    const uploadDir = imageDirFromPost({
      date: post.date,
      slug: post.adminPath.split('/').at(-1) || 'post',
    })
    await fs.mkdir(uploadDir, { recursive: true })

    const fileName = safeFileName(req.file.originalname)
    const outputPath = path.join(uploadDir, fileName)
    await fs.writeFile(outputPath, req.file.buffer)

    const publicSrc = toPublicAssetUrl(outputPath)

    res.status(201).json({
      asset: {
        src: publicSrc,
        alt: post.title,
        markdown: `![${post.title}](${publicSrc})`,
        size: req.file.size,
        mimeType: req.file.mimetype,
      },
    })
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '图片上传失败' })
  }
})

app.get('/api/admin/publish-status', (_req, res) => {
  res.json({ publish: publishState })
})

app.post('/api/admin/publish', (_req, res) => {
  try {
    const publish = triggerPublishTask(null)
    res.status(202).json({ publish })
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '统一发布触发失败' })
  }
})

app.post('/api/admin/post/publish', async (req, res) => {
  try {
    const adminPath = getAdminPath(req)
    await validateStoredPost(adminPath)
    const publish = triggerPublishTask(adminPath)
    res.status(202).json({ publish })
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '发布触发失败' })
  }
})

app.post('/api/admin/content/item/publish', async (req, res) => {
  try {
    const type = getContentTypeKey(req)
    const entry = getContentType(type)
    const adminPath =
      entry.type.mode === 'singleton'
        ? entry.defaultAdminPath || 'default'
        : getOptionalContentPath(req)

    await validateStoredContent(type, adminPath)
    const publish = triggerPublishTask(adminPath || `${type}:default`)
    res.status(202).json({ publish })
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '发布触发失败' })
  }
})

app.listen(port, () => {
  console.log(`ProtoMe Admin API 已启动: http://localhost:${port}`)
})

app.use(
  (error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({
          error: `上传图片过大，当前最大支持 ${formatBytes(maxUploadSize)}，请压缩后重试`,
        })
        return
      }

      res.status(400).json({ error: `上传失败：${error.message}` })
      return
    }

    console.error(error)
    res.status(500).json({
      error: error instanceof Error ? error.message : '后台服务发生未知错误',
    })
  }
)
