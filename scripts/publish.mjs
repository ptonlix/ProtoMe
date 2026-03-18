import { execSync } from 'node:child_process'

function run(command) {
  execSync(command, {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: process.env,
  })
}

function main() {
  console.log(`开始发布文章: ${process.env.PROTOME_PUBLISH_PATH || 'unknown'}`)
  run('pnpm --filter protome-web validate:content')
  run('pnpm --filter protome-web build')

  if (process.env.PROTOME_PUBLISH_RESTART_CMD) {
    run(process.env.PROTOME_PUBLISH_RESTART_CMD)
  } else {
    console.log('未配置 PROTOME_PUBLISH_RESTART_CMD，跳过服务重启')
  }
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : '发布失败')
  process.exit(1)
}
