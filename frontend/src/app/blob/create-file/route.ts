import { type NextRequest, NextResponse } from 'next/server'
import { BlobStorageService } from '@/lib/blob/storage'
import { handleBlobError } from '@/lib/blob/error'
import { extractUserEmailFromAuthHeader } from '@/lib/auth/token'
import { getMimeTypeFromExtension } from '@/lib/utils/file-utils'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, path = '' } = await request.json()
    if (!name) {
      return NextResponse.json({ error: 'File name required' }, { status: 400 })
    }

    const userEmail = extractUserEmailFromAuthHeader(authHeader)
    const storage = new BlobStorageService(userEmail)
    await storage.init()
    const mime = getMimeTypeFromExtension(name)
    const file = new File([''], name, { type: mime })
    const created = await storage.uploadFile(file, path)
    return NextResponse.json({ file: created })
  } catch (error) {
    return handleBlobError(error, 'Failed to create file in blob storage')
  }
}
