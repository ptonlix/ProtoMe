import path from 'node:path'

export type ContentWorkspacePaths = {
  workspaceRoot: string
  contentWorkspaceRoot: string | null
  dataRoot: string
  blogRoot: string
  publicRoot: string
  imagesRoot: string
  postsImageRoot: string
}

export function resolveContentWorkspacePaths(workspaceRoot: string): ContentWorkspacePaths {
  const configuredRoot = process.env.PROTOME_CONTENT_WORKSPACE?.trim()
  const contentWorkspaceRoot = configuredRoot ? path.resolve(workspaceRoot, configuredRoot) : null
  const dataRoot = contentWorkspaceRoot
    ? path.join(contentWorkspaceRoot, 'data')
    : path.join(workspaceRoot, 'data')
  const publicRoot = contentWorkspaceRoot
    ? path.join(contentWorkspaceRoot, 'public')
    : path.join(workspaceRoot, 'public')

  return {
    workspaceRoot,
    contentWorkspaceRoot,
    dataRoot,
    blogRoot: path.join(dataRoot, 'blog'),
    publicRoot,
    imagesRoot: path.join(publicRoot, 'static', 'images'),
    postsImageRoot: path.join(publicRoot, 'static', 'images', 'posts'),
  }
}
