import { type NextRequest, NextResponse } from "next/server"
import { BlobStorageService } from "@/lib/blob/storage"
import { handleBlobError } from "@/lib/blob/error"
import { extractUserEmailFromAuthHeader } from "@/lib/auth/token"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get("path") || ""
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Extract user email from token
    const userEmail = extractUserEmailFromAuthHeader(authHeader)

    // Create blob service with user email (will create dev_devd_org folder)
    const blobService = new BlobStorageService(userEmail)
    await blobService.init()

    const files = await blobService.listFiles(path)

    return NextResponse.json({ files })
  } catch (error) {
    return handleBlobError(error, "Failed to fetch blob files")
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Extract user email from token
    const userEmail = extractUserEmailFromAuthHeader(authHeader)

    // Create blob service with user email (will create dev_devd_org folder)
    const blobService = new BlobStorageService(userEmail)
    await blobService.init()

    const formData = await request.formData()
    const file = formData.get("file") as File
    const path = (formData.get("path") as string) || ""

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const uploadedFile = await blobService.uploadFile(file, path)

    return NextResponse.json({ file: uploadedFile })
  } catch (error) {
    return handleBlobError(error, "Failed to upload file to blob storage")
  }
}
