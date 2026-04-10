import { verifyAuth } from '../client/profile-api.js'
import { printJson } from '../output/json.js'
import { formatKeyValue, formatSection, printText } from '../output/text.js'

export async function handleAuthCommand(args: string[]) {
  const [subcommand, ...rest] = args
  const jsonMode = rest.includes('--json')

  if (subcommand !== 'verify') {
    throw new Error('不支持的 auth 子命令，可用：verify')
  }

  const result = await verifyAuth()

  if (jsonMode) {
    printJson(result)
    return
  }

  printText(
    formatSection('认证状态', [
      formatKeyValue('valid', result.valid),
      formatKeyValue('snapshotVersion', result.snapshotVersion),
    ])
  )
}
