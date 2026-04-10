import cors from 'cors'
import express, { type NextFunction, type Request, type Response } from 'express'
import { port, profileApiOrigin, resolveAccessKey, snapshotDir } from './config.js'
import {
  ensureSnapshotsReadable,
  readContextSnapshot,
  readManifest,
  readProfileSnapshot,
  readProjectsSnapshot,
} from './snapshots.js'

const app = express()
const resolvedAccessKey = resolveAccessKey()

app.use(
  cors({
    origin: profileApiOrigin,
  })
)

function getBearerToken(request: Request) {
  const authorization = request.header('authorization') ?? ''
  const [scheme, token] = authorization.split(/\s+/, 2)
  return scheme?.toLowerCase() === 'bearer' ? (token ?? '') : ''
}

function requireAccessKey(request: Request, response: Response, next: NextFunction) {
  const token = getBearerToken(request)

  if (!token || token !== resolvedAccessKey) {
    response.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'access key invalid',
      },
    })
    return
  }

  next()
}

function buildMeta(requestId: string) {
  return {
    requestId,
    generatedAt: new Date().toISOString(),
  }
}

app.get('/health', async (_request, response) => {
  try {
    await ensureSnapshotsReadable()
    response.json({
      status: 'ok',
      snapshotDir,
    })
  } catch (error) {
    response.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'unknown error',
    })
  }
})

app.get('/v1/auth/verify', requireAccessKey, async (_request, response) => {
  const manifest = await readManifest()
  response.json({
    success: true,
    data: {
      valid: true,
      snapshotVersion: manifest.snapshotVersion,
    },
    meta: buildMeta('auth-verify'),
  })
})

app.get('/v1/profile', requireAccessKey, async (_request, response) => {
  const profile = await readProfileSnapshot()
  response.json({
    success: true,
    data: profile,
    meta: buildMeta('profile'),
  })
})

app.get('/v1/projects', requireAccessKey, async (_request, response) => {
  const projects = await readProjectsSnapshot()
  response.json({
    success: true,
    data: projects,
    meta: buildMeta('projects'),
  })
})

app.get('/v1/projects/:id', requireAccessKey, async (request, response) => {
  const projects = await readProjectsSnapshot()
  const project = projects.find(
    (item) => item.id === request.params.id || item.slug === request.params.id
  )

  if (!project) {
    response.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'project not found',
      },
    })
    return
  }

  response.json({
    success: true,
    data: project,
    meta: buildMeta('project'),
  })
})

app.get('/v1/context', requireAccessKey, async (_request, response) => {
  const context = await readContextSnapshot()
  response.json({
    success: true,
    data: context,
    meta: buildMeta('context'),
  })
})

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  response.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'unknown error',
    },
  })
})

app.listen(port, () => {
  console.log(`protome-profile-api listening on http://localhost:${port}`)
})
