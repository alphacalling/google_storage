import { devLog } from '@/lib/utils/dev-log'
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Get the current origin from the request
  const origin = request.nextUrl.origin

  // Check if required environment variables are available
  const clientId = process.env.VITE_AZURE_AD_CLIENT_ID
  const tenantId = process.env.VITE_AZURE_AD_TENANT_ID

  if (!clientId || !tenantId) {
    console.error("❌ Missing required Azure AD environment variables:", {
      hasClientId: !!clientId,
      hasTenantId: !!tenantId,
    })

    return NextResponse.json(
      {
        error: "Authentication not configured",
        message:
          "Azure AD environment variables are not set. Please configure AZURE_AD_CLIENT_ID and AZURE_AD_TENANT_ID.",
        configured: false,
      },
      { status: 500 },
    )
  }

  const config = {
    clientId,
    tenantId,
    redirectUri: origin,
    postLogoutRedirectUri: origin,
    configured: true,
    // Debug info
    debug: {
      origin,
      hasClientId: !!clientId,
      hasTenantId: !!tenantId,
      hasStorageConnection: !!process.env.AZURE_STORAGE_CONNECTION_STRING,
      hasContainerPrefix: !!process.env.AZURE_STORAGE_CONTAINER_NAME,
      hasAccountName: !!process.env.AZURE_ACCOUNT_NAME,
      hasAccountKey: !!process.env.AZURE_ACCOUNT_KEY,
    },
  }

  devLog("📤 Sending config:", {
    ...config,
    debug: config.debug,
  })

  return NextResponse.json(config)
}
