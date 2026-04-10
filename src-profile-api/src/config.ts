import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'

export const workspaceRoot = path.resolve(import.meta.dirname, '../..')
const rootEnvPath = path.join(workspaceRoot, '.env')
const rootEnvLocalPath = path.join(workspaceRoot, '.env.local')

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath })
}

if (fs.existsSync(rootEnvLocalPath)) {
  dotenv.config({ path: rootEnvLocalPath, override: true })
}

export const isProduction = process.env.NODE_ENV === 'production'
export const port = Number(process.env.PROTOME_PROFILE_API_PORT ?? 4200)
export const profileApiOrigin = process.env.PROFILE_API_ORIGIN ?? 'http://localhost:3000'
export const snapshotDir = path.resolve(
  workspaceRoot,
  process.env.PROFILE_API_SNAPSHOT_DIR ?? 'deploy/snapshots'
)
export const profileApiAccessKey = process.env.PROTOME_PROFILE_API_ACCESS_KEY ?? ''
export const defaultDevAccessKey = 'protome-profile-local-dev-key'

export function resolveAccessKey() {
  if (profileApiAccessKey) {
    return profileApiAccessKey
  }

  if (!isProduction) {
    return defaultDevAccessKey
  }

  throw new Error('生产环境必须配置 PROTOME_PROFILE_API_ACCESS_KEY')
}
