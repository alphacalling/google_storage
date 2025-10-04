import { devLog } from '@/lib/utils/dev-log'
import { type NextRequest, NextResponse } from "next/server"
import { BlobStorageService } from "@/lib/blob/storage"
import { handleBlobError } from "@/lib/blob/error"
import { extractUserEmailFromAuthHeader } from "@/lib/auth/token"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { fileId, newParentId } = await request.json()
    if (!fileId || !newParentId) {
      return NextResponse.json({ error: "File ID and parent ID required" }, { status: 400 })
    }

    const userEmail = extractUserEmailFromAuthHeader(authHeader)
    const blobService = new BlobStorageService(userEmail)
    await blobService.init()

    devLog(`🚚 Moving blob ${fileId} to ${newParentId}`)
    const file = await blobService.moveBlob(fileId, newParentId)
    return NextResponse.json({ file })
  } catch (error) {
    return handleBlobError(error, "Failed to move blob")
  }
}
