import { clearAccessKey, readClientConfig, writeClientConfig } from '../config/client-config.js'
import { formatKeyValue, formatSection, maskSecret, printText } from '../output/text.js'

export async function handleKeyCommand(args: string[]) {
  const [subcommand, value] = args

  if (subcommand === 'set') {
    if (!value) {
      throw new Error('请提供 accessKey，例如 `pm key set <key>`')
    }

    await writeClientConfig({ accessKey: value })
    printText(formatSection('Key', ['accessKey 已保存']))
    return
  }

  if (subcommand === 'show') {
    const config = await readClientConfig()
    printText(formatSection('Key', [formatKeyValue('accessKey', maskSecret(config.accessKey))]))
    return
  }

  if (subcommand === 'clear') {
    await clearAccessKey()
    printText(formatSection('Key', ['accessKey 已清除']))
    return
  }

  throw new Error('不支持的 key 子命令，可用：set/show/clear')
}
