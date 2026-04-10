import { getProfile } from '../client/profile-api.js'
import { printJson } from '../output/json.js'
import { formatKeyValue, formatList, formatSection, printText } from '../output/text.js'

export async function handleProfileCommand(args: string[]) {
  const [subcommand, ...rest] = args
  const jsonMode = rest.includes('--json')

  if (subcommand !== 'get') {
    throw new Error('不支持的 profile 子命令，可用：get')
  }

  const profile = await getProfile()

  if (jsonMode) {
    printJson(profile)
    return
  }

  printText(
    formatSection('Profile', [
      formatKeyValue('displayName', profile.displayName),
      formatKeyValue('headline', profile.headline),
      formatKeyValue('summary', profile.summary),
      formatKeyValue('location', profile.location),
      formatKeyValue('website', profile.website),
      formatList('skills', profile.skills),
      formatKeyValue('updatedAt', profile.updatedAt),
    ])
  )
}
