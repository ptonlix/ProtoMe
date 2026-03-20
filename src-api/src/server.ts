import cors from 'cors'
import express from 'express'
import multer from 'multer'
import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { adminOrigin, maxUploadSize, port, resolveAdminKey, workspaceRoot } from './config.js'
import {
  createPost,
  imageDirFromPost,
  listPosts,
  normalizeAdminPath,
  normalizeSlug,
  readPost,
  updatePost,
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

app.get('/api/admin/posts', async (_req, res) => {
  try {
    const posts = await listPosts()
    res.json({ posts })
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : '文章列表读取失败' })
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

    const relativePath = path
      .relative(path.join(workspaceRoot, 'public'), outputPath)
      .replace(/\\/g, '/')

    res.status(201).json({
      asset: {
        src: `/${relativePath}`,
        alt: post.title,
        markdown: `![${post.title}](/${relativePath})`,
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

app.post('/api/admin/post/publish', async (req, res) => {
  try {
    const adminPath = getAdminPath(req)
    await validateStoredPost(adminPath)

    if (publishState.status === 'running') {
      res.status(409).json({ error: '当前已有发布任务在执行' })
      return
    }

    publishState.status = 'running'
    publishState.message = '正在执行校验、构建与重启'
    publishState.currentPath = adminPath
    publishState.startedAt = new Date().toISOString()
    publishState.finishedAt = null

    const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
    const child = spawn(pnpmCommand, ['exec', 'node', './scripts/publish.mjs'], {
      cwd: workspaceRoot,
      env: {
        ...process.env,
        PROTOME_PUBLISH_PATH: adminPath,
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

    res.status(202).json({
      publish: publishState,
    })
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '发布触发失败' })
  }
})

app.listen(port, () => {
  console.log(`ProtoMe Admin API 已启动: http://localhost:${port}`)
})
