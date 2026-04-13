import fs from 'node:fs'
import path from 'node:path'

export const WORKSPACE_DIRS = [
  'data/about',
  'data/authors',
  'data/blog',
  'data/profile',
  'data/projects',
  'data/system',
  'data/worklogs',
  'public/static/images',
]

function parseEnvFile(source) {
  const entries = source.split(/\r?\n/)
  for (const entry of entries) {
    const line = entry.trim()
    if (!line || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')
    if (separatorIndex <= 0) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim()

    if (!key || process.env[key] !== undefined) {
      continue
    }

    process.env[key] = value
  }
}

export function loadWorkspaceEnv(workspaceRoot) {
  const rootEnvPath = path.join(workspaceRoot, '.env')
  const rootEnvLocalPath = path.join(workspaceRoot, '.env.local')

  if (fs.existsSync(rootEnvPath)) {
    parseEnvFile(fs.readFileSync(rootEnvPath, 'utf8'))
  }

  if (fs.existsSync(rootEnvLocalPath)) {
    const localEntries = fs.readFileSync(rootEnvLocalPath, 'utf8').split(/\r?\n/)
    for (const entry of localEntries) {
      const line = entry.trim()
      if (!line || line.startsWith('#')) {
        continue
      }

      const separatorIndex = line.indexOf('=')
      if (separatorIndex <= 0) {
        continue
      }

      const key = line.slice(0, separatorIndex).trim()
      const value = line.slice(separatorIndex + 1).trim()
      if (!key) {
        continue
      }
      process.env[key] = value
    }
  }
}

export function getContentWorkspaceRoot(workspaceRoot) {
  const configuredRoot = process.env.PROTOME_CONTENT_WORKSPACE?.trim()
  if (!configuredRoot) {
    return null
  }

  return path.resolve(workspaceRoot, configuredRoot)
}

export function resolveContentWorkspacePaths(workspaceRoot) {
  const contentWorkspaceRoot = getContentWorkspaceRoot(workspaceRoot)
  const contentRoot = contentWorkspaceRoot
    ? path.join(contentWorkspaceRoot, 'data')
    : path.join(workspaceRoot, 'data')
  const publicAssetRoot = contentWorkspaceRoot
    ? path.join(contentWorkspaceRoot, 'public')
    : path.join(workspaceRoot, 'public')

  return {
    workspaceRoot,
    contentWorkspaceRoot,
    contentRoot,
    publicAssetRoot,
    blogRoot: path.join(contentRoot, 'blog'),
    profileRoot: path.join(contentRoot, 'profile'),
    projectsRoot: path.join(contentRoot, 'projects'),
    worklogsRoot: path.join(contentRoot, 'worklogs'),
    systemRoot: path.join(contentRoot, 'system'),
    imagesRoot: path.join(publicAssetRoot, 'static', 'images'),
    postsImageRoot: path.join(publicAssetRoot, 'static', 'images', 'posts'),
    snapshotRoot: path.join(workspaceRoot, 'deploy', 'snapshots'),
  }
}

export function resolveWorkspaceDir(targetDir, cwd) {
  const normalizedTarget = targetDir?.trim()
  if (normalizedTarget) {
    return path.resolve(cwd, normalizedTarget)
  }

  const configuredRoot = process.env.PROTOME_CONTENT_WORKSPACE?.trim()
  if (configuredRoot) {
    return path.resolve(cwd, configuredRoot)
  }

  return path.resolve(cwd, '.protome-workspace')
}
