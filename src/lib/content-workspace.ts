import fs from 'node:fs'
import path from 'node:path'

function parseEnvFile(source: string, override = false) {
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
    if (!key) {
      continue
    }

    if (!override && process.env[key] !== undefined) {
      continue
    }

    process.env[key] = value
  }
}

export function loadWorkspaceEnv(workspaceRoot: string) {
  const rootEnvPath = path.join(workspaceRoot, '.env')
  const rootEnvLocalPath = path.join(workspaceRoot, '.env.local')

  if (fs.existsSync(rootEnvPath)) {
    parseEnvFile(fs.readFileSync(rootEnvPath, 'utf8'))
  }

  if (fs.existsSync(rootEnvLocalPath)) {
    parseEnvFile(fs.readFileSync(rootEnvLocalPath, 'utf8'), true)
  }
}

export function resolveContentWorkspacePaths(projectRoot: string) {
  loadWorkspaceEnv(projectRoot)

  const configuredRoot = process.env.PROTOME_CONTENT_WORKSPACE?.trim()
  const contentWorkspaceRoot = configuredRoot ? path.resolve(projectRoot, configuredRoot) : null
  const contentRoot = contentWorkspaceRoot
    ? path.join(contentWorkspaceRoot, 'data')
    : path.join(projectRoot, 'data')
  const publicAssetRoot = contentWorkspaceRoot
    ? path.join(contentWorkspaceRoot, 'public')
    : path.join(projectRoot, 'public')

  return {
    projectRoot,
    contentWorkspaceRoot,
    contentRoot,
    publicAssetRoot,
  }
}
