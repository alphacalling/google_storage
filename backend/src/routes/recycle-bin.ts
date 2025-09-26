import { Router } from "express";
import { BlobStorageService } from "../lib/blob/storage";
import { handleBlobError } from "../lib/blob/error";
import { extractUserEmailFromAuthHeader } from "../lib/auth/token";

const router = Router();

// GET /blob/recycle-bin
router.get("/recycle-bin", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"] as string | undefined;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userEmail = extractUserEmailFromAuthHeader(authHeader);
    const blobService = new BlobStorageService(userEmail);
    await blobService.init();

    const deletedFiles = await blobService.getRecycleBin();

    res.json(deletedFiles);
  } catch (error: any) {
    handleBlobError(error, "Failed to get blob recycle bin", res);
  }
});

export default router;
