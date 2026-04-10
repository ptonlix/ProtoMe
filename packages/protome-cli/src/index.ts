#!/usr/bin/env node

import { handleAuthCommand } from './commands/auth.js'
import { handleContextCommand } from './commands/context.js'
import { handleEndpointCommand } from './commands/endpoint.js'
import { handleKeyCommand } from './commands/key.js'
import { handleProfileCommand } from './commands/profile.js'
import { handleProjectCommand } from './commands/project.js'
import { handleWhoamiCommand } from './commands/whoami.js'
import { formatCliError, toCliError } from './errors.js'
import { printText } from './output/text.js'

async function main() {
  const [, , command, ...args] = process.argv

  if (!command || command === '--help' || command === '-h') {
    printText([
      'ProtoMe CLI',
      '可用命令：',
      '  pm key set <key>',
      '  pm key show',
      '  pm key clear',
      '  pm endpoint set <url>',
      '  pm endpoint show',
      '  pm auth verify [--json]',
      '  pm whoami [--json]',
      '  pm profile get [--json]',
      '  pm project list [--json]',
      '  pm project get <id> [--json]',
      '  pm context [--json]',
    ])
    return
  }

  switch (command) {
    case 'key':
      await handleKeyCommand(args)
      return
    case 'endpoint':
      await handleEndpointCommand(args)
      return
    case 'auth':
      await handleAuthCommand(args)
      return
    case 'whoami':
      await handleWhoamiCommand(args)
      return
    case 'profile':
      await handleProfileCommand(args)
      return
    case 'project':
      await handleProjectCommand(args)
      return
    case 'context':
      await handleContextCommand(args)
      return
    default:
      throw new Error(`不支持的命令：${command}`)
  }
}

main().catch((error) => {
  const cliError = toCliError(error)
  process.stderr.write(`${formatCliError(cliError).join('\n')}\n`)
  process.exitCode = 1
})
