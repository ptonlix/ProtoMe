import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

export type CliClientConfig = {
  endpoint: string
  accessKey: string
}

const defaultConfig: CliClientConfig = {
  endpoint: 'http://127.0.0.1:4200',
  accessKey: '',
}

function getConfigDir() {
  return path.join(os.homedir(), '.protome')
}

export function getConfigPath() {
  return path.join(getConfigDir(), 'config.json')
}

export async function readClientConfig() {
  try {
    const raw = await fs.readFile(getConfigPath(), 'utf8')
    const parsed = JSON.parse(raw) as Partial<CliClientConfig>
    return {
      endpoint: parsed.endpoint || defaultConfig.endpoint,
      accessKey: parsed.accessKey || defaultConfig.accessKey,
    }
  } catch {
    return { ...defaultConfig }
  }
}

export async function writeClientConfig(config: Partial<CliClientConfig>) {
  const current = await readClientConfig()
  const nextConfig: CliClientConfig = {
    ...current,
    ...config,
  }

  await fs.mkdir(getConfigDir(), { recursive: true })
  await fs.writeFile(getConfigPath(), `${JSON.stringify(nextConfig, null, 2)}\n`, 'utf8')
  return nextConfig
}

export async function clearAccessKey() {
  const current = await readClientConfig()
  return writeClientConfig({
    ...current,
    accessKey: '',
  })
}
