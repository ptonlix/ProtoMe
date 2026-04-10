export type CliErrorCode =
  | 'CONFIG_MISSING_KEY'
  | 'CONFIG_INVALID_SERVER'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'INVALID_REQUEST'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR'

export class CliError extends Error {
  code: CliErrorCode
  status?: number
  details?: string

  constructor(
    code: CliErrorCode,
    message: string,
    options?: { status?: number; details?: string }
  ) {
    super(message)
    this.name = 'CliError'
    this.code = code
    this.status = options?.status
    this.details = options?.details
  }
}

export function toCliError(error: unknown) {
  if (error instanceof CliError) {
    return error
  }

  if (error instanceof Error) {
    return new CliError('UNKNOWN_ERROR', error.message)
  }

  return new CliError('UNKNOWN_ERROR', '未知错误')
}

export function formatCliError(error: CliError) {
  const lines = [`错误: ${error.message}`]

  switch (error.code) {
    case 'CONFIG_MISSING_KEY':
      lines.push('建议: 先执行 `pm key set <key>`')
      break
    case 'CONFIG_INVALID_SERVER':
      lines.push('建议: 先执行 `pm endpoint set <url>` 设置正确的云端地址')
      break
    case 'UNAUTHORIZED':
      lines.push('建议: 检查 accessKey 是否正确，或重新执行 `pm key set <key>`')
      break
    case 'NOT_FOUND':
      lines.push('建议: 检查资源标识是否正确')
      break
    case 'NETWORK_ERROR':
      lines.push('建议: 检查 profile API 是否已启动，以及 endpoint 是否可访问')
      break
    case 'SERVER_ERROR':
      lines.push('建议: 检查服务端日志与快照文件是否有效')
      break
    default:
      break
  }

  if (error.details) {
    lines.push(`详情: ${error.details}`)
  }

  return lines
}
