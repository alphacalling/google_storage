import { Router } from "express";
import { devLog } from "../lib/utils/dev-log";

const router = Router();

router.get("/config", (req, res) => {
  const origin = req.headers.origin || `${req.protocol}://${req.get("host")}`;

  const clientId = process.env.AZURE_AD_CLIENT_ID;
  const tenantId = process.env.AZURE_AD_TENANT_ID;

  if (!clientId || !tenantId) {
    console.error("❌ Missing required Azure AD environment variables:", {
      hasClientId: !!clientId,
      hasTenantId: !!tenantId,
    });

    return res.status(500).json({
      error: "Authentication not configured",
      message:
        "Azure AD environment variables are not set. Please configure AZURE_AD_CLIENT_ID and AZURE_AD_TENANT_ID.",
      configured: false,
    });
  }

  const config = {
    clientId,
    tenantId,
    redirectUri: origin,
    postLogoutRedirectUri: origin,
    configured: true,
    debug: {
      origin,
      hasClientId: !!clientId,
      hasTenantId: !!tenantId,
      hasStorageConnection: !!process.env.AZURE_STORAGE_CONNECTION_STRING,
      hasContainerPrefix: !!process.env.AZURE_STORAGE_CONTAINER_NAME,
      hasAccountName: !!process.env.AZURE_ACCOUNT_NAME,
      hasAccountKey: !!process.env.AZURE_ACCOUNT_KEY,
    },
  };

  devLog("📤 Sending config:", { ...config, debug: config.debug });

  res.json(config);
});

export default router;
