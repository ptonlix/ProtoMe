import { spawn } from 'node:child_process'
import path from 'node:path'

const workspaceRoot = path.resolve(import.meta.dirname, '..')
const nextBinary = path.join(workspaceRoot, 'src', 'node_modules', '.bin', 'next')
const profileApiEntry = path.join(workspaceRoot, 'src-profile-api', 'dist', 'server.js')

const services = [
  spawn(nextBinary, ['start'], {
    cwd: path.join(workspaceRoot, 'src'),
    env: process.env,
    stdio: 'inherit',
  }),
  spawn(process.execPath, [profileApiEntry], {
    cwd: workspaceRoot,
    env: process.env,
    stdio: 'inherit',
  }),
]

let shuttingDown = false

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return
  }

  shuttingDown = true

  services.forEach((service) => {
    if (!service.killed) {
      service.kill('SIGTERM')
    }
  })

  setTimeout(() => process.exit(exitCode), 1000).unref()
}

services.forEach((service) => {
  service.on('error', (error) => {
    console.error(error)
    shutdown(1)
  })

  service.on('exit', (code) => {
    if (!shuttingDown && code && code !== 0) {
      shutdown(code)
      return
    }

    if (!shuttingDown) {
      shutdown(0)
    }
  })
})

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
