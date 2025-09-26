import { Router } from "express";
import { BlobStorageService } from "../lib/blob/storage";
import { handleBlobError } from "../lib/blob/error";
import { extractUserEmailFromAuthHeader } from "../lib/auth/token";
import { devLog } from "../lib/utils/dev-log";

const router = Router();

// Copy a blob to a new folder
router.post("/copy", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"] as string | undefined;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { fileId, newParentId } = req.body;
    if (!fileId || !newParentId) {
      return res
        .status(400)
        .json({ error: "File ID and new parent ID required" });
    }

    const userEmail = extractUserEmailFromAuthHeader(authHeader);
    const blobService = new BlobStorageService(userEmail);
    await blobService.init();

    devLog(`📄 Copying blob ${fileId} to ${newParentId}`);
    const file = await blobService.copyBlob(fileId, newParentId);

    res.json({ file });
  } catch (error) {
    handleBlobError(error, "Failed to copy blob", res);
  }
});

export default router;
