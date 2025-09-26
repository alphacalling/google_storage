import { Router } from "express";
import { BlobStorageService } from "../lib/blob/storage";
import { handleBlobError } from "../lib/blob/error";
import { extractUserEmailFromAuthHeader } from "../lib/auth/token";
import { devLog } from "../lib/utils/dev-log";

const router = Router();

// PATCH /blob/rename
router.patch("/rename", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"] as string | undefined;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { fileId, newName } = req.body;
    if (!fileId || !newName) {
      return res.status(400).json({ error: "File ID and new name required" });
    }

    const userEmail = extractUserEmailFromAuthHeader(authHeader);
    const blobService = new BlobStorageService(userEmail);
    await blobService.init();

    devLog(`✏️ Renaming blob: ${fileId} to ${newName}`);

    const renamedFile = await blobService.renameBlob(fileId, newName);

    res.json({ file: renamedFile });
  } catch (error: any) {
    handleBlobError(error, "Failed to rename blob", res);
  }
});

export default router;
