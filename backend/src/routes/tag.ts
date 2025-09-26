import { Router } from "express";
import { BlobStorageService } from "../lib/blob/storage";
import { handleBlobError } from "../lib/blob/error";
import { extractUserEmailFromAuthHeader } from "../lib/auth/token";
import { devLog } from "../lib/utils/dev-log";

const router = Router();

router.patch("/tags", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"] as string | undefined;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { fileId, tags } = req.body;
    if (!fileId) {
      return res.status(400).json({ error: "File ID required" });
    }

    const userEmail = extractUserEmailFromAuthHeader(authHeader);
    const blobService = new BlobStorageService(userEmail);
    await blobService.init();

    devLog(`🏷️ Updating tags for blob: ${fileId}`, tags);

    await blobService.updateTags(fileId, tags || []);

    res.json({ success: true });
  } catch (error: any) {
    handleBlobError(error, "Failed to update blob tags", res);
  }
});

export default router;
