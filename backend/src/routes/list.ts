import { Router } from "express";
import { BlobStorageService } from "../lib/blob/storage";
import { handleBlobError } from "../lib/blob/error";
import { extractUserEmailFromAuthHeader } from "../lib/auth/token";
import { devLog } from "../lib/utils/dev-log";

const router = Router();

// GET /blob?prefix=some/path
router.get("/", async (req, res) => {
  try {
    const prefix = (req.query.prefix as string) || "";
    const authHeader = req.headers["authorization"] as string | undefined;

    devLog(`🔍 Blob list API called with prefix: "${prefix}"`);

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userEmail = extractUserEmailFromAuthHeader(authHeader);
    devLog(`👤 User email: ${userEmail}`);

    const blobService = new BlobStorageService(userEmail);
    await blobService.init();

    devLog(`📂 Using prefix: "${prefix}"`);
    const files = await blobService.listBlobsByHierarchy(prefix);

    devLog(`✅ Retrieved ${files.length} items from blob storage`);
    res.json({ files });
  } catch (error: any) {
    handleBlobError(error, "Failed to fetch blob files", res);
  }
});

export default router;
