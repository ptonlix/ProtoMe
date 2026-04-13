import fs from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
import { resolveContentWorkspacePaths } from '../../../../lib/content-workspace'

export const runtime = 'nodejs'

const contentTypeMap: Record<string, string> = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
}

function getContentType(filePath: string) {
  return contentTypeMap[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream'
}

function isSubPath(targetPath: string, parentPath: string) {
  const relative = path.relative(parentPath, targetPath)
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative)
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ assetPath: string[] }> }
) {
  const { assetPath } = await context.params
  if (!assetPath || assetPath.length === 0) {
    return NextResponse.json({ error: '缺少图片路径' }, { status: 400 })
  }

  const projectRoot = path.resolve(process.cwd(), '..')
  const { publicAssetRoot } = resolveContentWorkspacePaths(projectRoot)
  const imagesRoot = path.join(publicAssetRoot, 'static', 'images')
  const targetPath = path.resolve(imagesRoot, ...assetPath)

  if (targetPath === imagesRoot || !isSubPath(targetPath, imagesRoot)) {
    return NextResponse.json({ error: '非法图片路径' }, { status: 400 })
  }

  try {
    const fileBuffer = await fs.readFile(targetPath)
    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': getContentType(targetPath),
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return NextResponse.json({ error: '图片不存在' }, { status: 404 })
    }

    return NextResponse.json({ error: '读取图片失败' }, { status: 500 })
  }
}
