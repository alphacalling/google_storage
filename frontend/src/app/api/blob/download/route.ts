import { devLog } from '@/lib/utils/dev-log'
import { type NextRequest, NextResponse } from "next/server"
import { BlobStorageService } from "@/lib/blob/storage"
import { handleBlobError } from "@/lib/blob/error"
import { extractUserEmailFromAuthHeader } from "@/lib/auth/token"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get("path")
    const authHeader = request.headers.get("authorization")

    if (!path) {
      return NextResponse.json({ error: "Path parameter required" }, { status: 400 })
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userEmail = extractUserEmailFromAuthHeader(authHeader)
    const blobService = new BlobStorageService(userEmail)
    await blobService.init()

    devLog(`📥 Downloading file from path: ${path}`)

    const { buffer, contentType, fileName } = await blobService.downloadFile(path)

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    return handleBlobError(error, "Failed to download file from blob storage")
  }
}
