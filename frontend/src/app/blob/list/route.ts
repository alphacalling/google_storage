import { devLog } from '@/lib/utils/dev-log'
import { type NextRequest, NextResponse } from "next/server"
import { BlobStorageService } from "@/lib/blob/storage"
import { handleBlobError } from "@/lib/blob/error"
import { extractUserEmailFromAuthHeader } from "@/lib/auth/token"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const prefix = searchParams.get("prefix") || ""
    const authHeader = request.headers.get("authorization")

    devLog(`🔍 Blob list API called with prefix: "${prefix}"`)

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Extract user email from token
    const userEmail = extractUserEmailFromAuthHeader(authHeader)
    devLog(`👤 User email: ${userEmail}`)

    // Create blob service for this user
    const blobService = new BlobStorageService(userEmail)
    await blobService.init()

    // Prefix is now relative to the user's container
    devLog(`📂 Using prefix: "${prefix}"`)

    const files = await blobService.listBlobsByHierarchy(prefix)

    devLog(`✅ Retrieved ${files.length} items from blob storage`)
    return NextResponse.json({ files })
  } catch (error) {
    return handleBlobError(error, "Failed to fetch blob files")
  }
}
