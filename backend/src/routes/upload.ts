import { Router } from "express";
import { BlobStorageService } from "../lib/blob/storage";
import { handleBlobError } from "../lib/blob/error";
import { extractUserEmailFromAuthHeader } from "../lib/auth/token";
import { devLog } from "../lib/utils/dev-log";
import { parseMultipart } from "../utils/utils";

const router = Router();

router.post("/upload", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"] as string | undefined;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userEmail = extractUserEmailFromAuthHeader(authHeader);
    const blobService = new BlobStorageService(userEmail);
    await blobService.init();

    // Parse multipart/form-data
    const { fields, file } = await parseMultipart(req);
    const uploadPath = fields["path"] || "";

    if (!file) {
      return res.status(400).json({ error: "No file provided" });
    }

    devLog(`📤 Uploading file: ${file.name} to path: ${uploadPath}`);

    const uploadedFile = await blobService.uploadFile(file, uploadPath);

    res.json({ file: uploadedFile });
  } catch (error: any) {
    handleBlobError(error, "Failed to upload file to blob storage", res);
  }
});

export default router;
