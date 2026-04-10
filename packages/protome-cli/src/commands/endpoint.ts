import { readClientConfig, writeClientConfig } from '../config/client-config.js'
import { formatKeyValue, formatSection, printText } from '../output/text.js'

export async function handleEndpointCommand(args: string[]) {
  const [subcommand, value] = args

  if (subcommand === 'show') {
    const config = await readClientConfig()
    printText(formatSection('Endpoint', [formatKeyValue('endpoint', config.endpoint)]))
    return
  }

  if (subcommand === 'set') {
    if (!value) {
      throw new Error('请提供 endpoint，例如 `pm endpoint set <url>`')
    }

    await writeClientConfig({ endpoint: value })
    printText(formatSection('Endpoint', [`endpoint 已更新为 ${value}`]))
    return
  }

  throw new Error('不支持的 endpoint 子命令，可用：set/show')
}
