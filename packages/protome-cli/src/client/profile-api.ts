import { readClientConfig } from '../config/client-config.js'
import { CliError } from '../errors.js'
import type {
  AuthVerifyPayload,
  ContextPayload,
  ProfilePayload,
  ProjectPayload,
} from '../types/profile-api.js'

type ApiSuccess<T> = {
  success: true
  data: T
  meta: {
    requestId: string
    generatedAt: string
  }
}

type ApiFailure = {
  success: false
  error: {
    code: string
    message: string
  }
}

type ApiResponse<T> = ApiSuccess<T> | ApiFailure

async function requestProfileApi<T>(pathname: string) {
  const config = await readClientConfig()

  if (!config.accessKey) {
    throw new CliError('CONFIG_MISSING_KEY', '未配置 accessKey')
  }

  let requestUrl: URL
  try {
    requestUrl = new URL(pathname, config.endpoint)
  } catch {
    throw new CliError('CONFIG_INVALID_SERVER', `无效的 endpoint: ${config.endpoint}`)
  }

  let response: Response
  try {
    response = await fetch(requestUrl, {
      headers: {
        Authorization: `Bearer ${config.accessKey}`,
      },
    })
  } catch (error) {
    throw new CliError('NETWORK_ERROR', '无法连接到 ProtoMe profile API', {
      details: error instanceof Error ? error.message : undefined,
    })
  }

  let payload: ApiResponse<T> | undefined
  try {
    payload = (await response.json()) as ApiResponse<T>
  } catch {
    throw new CliError('SERVER_ERROR', '服务端返回了无法解析的响应', {
      status: response.status,
    })
  }

  if (!response.ok || !payload.success) {
    const code = payload.success ? undefined : payload.error.code
    const message = payload.success ? response.statusText : payload.error.message

    if (response.status === 401 || code === 'UNAUTHORIZED') {
      throw new CliError('UNAUTHORIZED', message || 'access key invalid', {
        status: response.status,
      })
    }

    if (response.status === 404 || code === 'NOT_FOUND') {
      throw new CliError('NOT_FOUND', message || 'resource not found', { status: response.status })
    }

    if (response.status >= 400 && response.status < 500) {
      throw new CliError('INVALID_REQUEST', message || 'invalid request', {
        status: response.status,
      })
    }

    throw new CliError('SERVER_ERROR', message || '请求失败', {
      status: response.status,
      details: code,
    })
  }

  return payload.data
}

export async function verifyAuth() {
  return requestProfileApi<AuthVerifyPayload>('/v1/auth/verify')
}

export async function getProfile() {
  return requestProfileApi<ProfilePayload>('/v1/profile')
}

export async function listProjects() {
  return requestProfileApi<ProjectPayload[]>('/v1/projects')
}

export async function getProject(id: string) {
  return requestProfileApi<ProjectPayload>(`/v1/projects/${encodeURIComponent(id)}`)
}

export async function getContext() {
  return requestProfileApi<ContextPayload>('/v1/context')
}
