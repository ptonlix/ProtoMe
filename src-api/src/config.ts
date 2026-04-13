import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'
import { resolveContentWorkspacePaths } from './content-workspace.js'

export const workspaceRoot = path.resolve(import.meta.dirname, '../..')
const rootEnvPath = path.join(workspaceRoot, '.env')
const rootEnvLocalPath = path.join(workspaceRoot, '.env.local')

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath })
}

if (fs.existsSync(rootEnvLocalPath)) {
  dotenv.config({ path: rootEnvLocalPath, override: true })
}

const contentWorkspacePaths = resolveContentWorkspacePaths(workspaceRoot)
export const contentWorkspaceRoot = contentWorkspacePaths.contentWorkspaceRoot
export const dataRoot = contentWorkspacePaths.dataRoot
export const blogRoot = contentWorkspacePaths.blogRoot
export const publicRoot = contentWorkspacePaths.publicRoot
export const imagesRoot = contentWorkspacePaths.imagesRoot
export const postsImageRoot = contentWorkspacePaths.postsImageRoot
export const isProduction = process.env.NODE_ENV === 'production'
export const defaultDevAdminKey = 'protome-local-dev-key'
export const adminOrigin = process.env.ADMIN_APP_ORIGIN ?? 'http://localhost:3000'
export const adminKey = process.env.PROTOME_ADMIN_KEY ?? ''
export const port = Number(process.env.PROTOME_ADMIN_API_PORT ?? 4100)
export const maxUploadSize = Number(process.env.PROTOME_ADMIN_MAX_UPLOAD_BYTES ?? 20 * 1024 * 1024)

export function resolveAdminKey() {
  if (adminKey) {
    return adminKey
  }

  if (!isProduction) {
    return defaultDevAdminKey
  }

  throw new Error('生产环境必须配置 PROTOME_ADMIN_KEY')
}
