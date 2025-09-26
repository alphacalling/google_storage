import { Router } from "express";
import { BlobStorageService } from "../lib/blob/storage";
import { handleBlobError } from "../lib/blob/error";
import { extractUserEmailFromAuthHeader } from "../lib/auth/token";
import { devLog } from "../lib/utils/dev-log";

const router = Router();

// Restore deleted blob
router.post("/restore", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"] as string | undefined;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { fileId } = req.body;
    if (!fileId) return res.status(400).json({ error: "File ID required" });

    const userEmail = extractUserEmailFromAuthHeader(authHeader);
    const blobService = new BlobStorageService(userEmail);
    await blobService.init();

    devLog(`♻️ Restoring blob: ${fileId}`);

    const path = fileId.split("/").slice(1).join("/");
    const restoredFile = await blobService.restoreBlob(path);

    res.json({ success: true, file: restoredFile, source: "blob" });
  } catch (error) {
    handleBlobError(error, "Failed to restore blob", res);
  }
});

export default router;
