import { Router } from "express";
import { BlobStorageService } from "../lib/blob/storage";
import { handleBlobError } from "../lib/blob/error";
import { extractUserEmailFromAuthHeader } from "../lib/auth/token";
import { devLog } from "../lib/utils/dev-log";

const router = Router();

router.get("/download", async (req, res) => {
  try {
    const pathParam = req.query.path as string | undefined;
    const authHeader = req.headers["authorization"] as string | undefined;

    if (!pathParam) {
      return res.status(400).json({ error: "Path parameter required" });
    }

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userEmail = extractUserEmailFromAuthHeader(authHeader);
    const blobService = new BlobStorageService(userEmail);
    await blobService.init();

    devLog(`📥 Downloading file from path: ${pathParam}`);

    const { buffer, contentType, fileName } = await blobService.downloadFile(pathParam);

    res.setHeader("Content-Type", contentType || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (error: any) {
    handleBlobError(error, "Failed to download file from blob storage", res);
  }
});

export default router;
