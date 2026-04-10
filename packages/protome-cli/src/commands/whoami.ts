import { getProfile, verifyAuth } from '../client/profile-api.js'
import { readClientConfig } from '../config/client-config.js'
import { printJson } from '../output/json.js'
import { formatKeyValue, formatList, formatSection, maskSecret, printText } from '../output/text.js'

type WhoamiPayload = {
  endpoint: string
  accessKeyConfigured: boolean
  accessKeyMasked: string
  auth: {
    valid: boolean
    snapshotVersion: string
  }
  profile: {
    displayName: string
    headline: string
    location: string | null
    website: string | null
    skills: string[]
    updatedAt: string
  }
}

export async function handleWhoamiCommand(args: string[]) {
  const jsonMode = args.includes('--json')
  const [config, auth, profile] = await Promise.all([
    readClientConfig(),
    verifyAuth(),
    getProfile(),
  ])

  const result: WhoamiPayload = {
    endpoint: config.endpoint,
    accessKeyConfigured: Boolean(config.accessKey),
    accessKeyMasked: maskSecret(config.accessKey),
    auth: {
      valid: auth.valid,
      snapshotVersion: auth.snapshotVersion,
    },
    profile: {
      displayName: profile.displayName,
      headline: profile.headline,
      location: profile.location,
      website: profile.website,
      skills: profile.skills,
      updatedAt: profile.updatedAt,
    },
  }

  if (jsonMode) {
    printJson(result)
    return
  }

  printText([
    ...formatSection('身份信息', [
      formatKeyValue('displayName', result.profile.displayName),
      formatKeyValue('headline', result.profile.headline),
      formatKeyValue('location', result.profile.location),
      formatKeyValue('website', result.profile.website),
      formatList('skills', result.profile.skills),
      formatKeyValue('updatedAt', result.profile.updatedAt),
    ]),
    '',
    ...formatSection('连接信息', [
      formatKeyValue('endpoint', result.endpoint),
      formatKeyValue('accessKey', result.accessKeyMasked),
      formatKeyValue('authenticated', result.auth.valid),
      formatKeyValue('snapshotVersion', result.auth.snapshotVersion),
    ]),
  ])
}
