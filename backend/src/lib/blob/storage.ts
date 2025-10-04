import {
  BlobServiceClient,
  type ContainerClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} from "@azure/storage-blob";
// import { v4 as uuidv4 } from "uuid";
// import type { FileItem } from "@/lib/types";
// import { getDb } from "../db";
// import { NextResponse } from "next/server";
// import { devLog } from "../../lib/utils/dev-log";

export class BlobStorageService {
  private containerClient: ContainerClient;
  private userFolder: string;
  private initPromise: Promise<void> | null = null;
  private userEmail: string;

  constructor(userEmail: string) {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    this.userEmail = userEmail;
    if (!connectionString) {
      throw new Error("Azure storage environment variables are not configured");
    }

    // Optional prefix for all user containers
    const prefix = process.env.AZURE_STORAGE_CONTAINER_NAME;

    // Sanitize the user email for use as a container name
    const sanitizedEmail = userEmail.toLowerCase().replace(/[@_.]/g, "-");

    const containerName = prefix
      ? `${prefix}-${sanitizedEmail}`
      : sanitizedEmail;

    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    this.containerClient = blobServiceClient.getContainerClient(containerName);

    // Generate user folder from email: user@domain.com -> user_domain_com
    this.userFolder = userEmail.replace(/@/g, "_").replace(/\./g, "_");
    devLog(
      `🔧 Blob service initialized for container: ${containerName}, user folder: ${this.userFolder}`
    );
  }

  /**
   * Generate a temporary SAS URL for a blob so it can be accessed directly in
   * the browser. Falls back to the regular blob URL if account credentials are
   * not available.
   */
  private getBlobSasUrl(blobName: string, expiresInMinutes = 15): string {
    const accountName = process.env.AZURE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_ACCOUNT_KEY;

    if (!accountName || !accountKey) {
      // If credentials are missing, return the unsigned URL which may fail
      return this.containerClient.getBlobClient(blobName).url;
    }

    const credential = new StorageSharedKeyCredential(accountName, accountKey);

    const sas = generateBlobSASQueryParameters(
      {
        containerName: this.containerClient.containerName,
        blobName,
        expiresOn: new Date(Date.now() + expiresInMinutes * 60 * 1000),
        permissions: BlobSASPermissions.parse("r"),
      },
      credential
    ).toString();

    return `${this.containerClient.getBlobClient(blobName).url}?${sas}`;
  }

  // Create a share link
  public async getShareLink(
    fileId: string,
    expiryDays?: number
  ): Promise<string> {
    const { v4: uuidv4 } = require("uuid");
    const shareId = uuidv4();

    const days =
      expiryDays ??
      parseInt(process.env.BLOB_SAS_DEFAULT_EXPIRY_DAYS || "7", 10);
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);

    const db = getDb();

    // Save share link to DB using file UUID
    await db.query(
      `INSERT INTO share_links (id, share_id, file_id, created_by, access_type, requires_auth, expiry, created_at)
       VALUES (?, ?, ?, ?, 'view', TRUE, ?, NOW())`,
      [crypto.randomUUID(), shareId, fileId, this.userEmail, expiry]
    );

    devLog(
      `📤 Created share link: shareId=${shareId}, fileId=${fileId}, expiry=${expiry.toISOString()}`
    );

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return `${baseUrl}/share/${shareId}`;
  }

  //***end

  async init(): Promise<void> {
    if (!this.initPromise) {
      // Create container without public access (default is private)
      this.initPromise = this.containerClient
        .createIfNotExists()
        .then(() => {});
    }
    await this.initPromise;
  }

  private getUserPath(path = ""): string {
    // If path already includes user folder, use as-is
    if (path.startsWith(this.userFolder)) {
      return path;
    }
    return path ? `${this.userFolder}/${path}` : this.userFolder;
  }

  async listBlobsByHierarchy(prefix = ""): Promise<FileItem[]> {
    try {
      devLog(`📂 Listing blobs with prefix: "${prefix}"`);

      const actualPrefix = prefix || `${this.userFolder}/`;
      const files: FileItem[] = [];
      const folders = new Set<string>();

      // List blobs by hierarchy to get folder structure
      for await (const item of this.containerClient.listBlobsByHierarchy("/", {
        prefix: actualPrefix,
      })) {
        // devLog(`📄 Processing item:`, item);

        if (item.kind === "prefix") {
          // This is a folder
          const folderName = item.name
            .replace(actualPrefix, "")
            .replace("/", "");
          if (folderName && !folders.has(folderName)) {
            folders.add(folderName);
            files.push({
              id: item.name,
              name: folderName,
              type: "folder",
              size: 0,
              lastModified: new Date(),
              path: actualPrefix.replace(`${this.userFolder}/`, ""),
            });
          }
        } else {
          // This is a file
          const blob = item;

          // Skip if marked as deleted
          if (blob.metadata?.deleted === "true") continue;

          const relativePath = blob.name.replace(`${this.userFolder}/`, "");
          const pathParts = relativePath.split("/");
          const fileName = pathParts[pathParts.length - 1];

          // Only include files in the current directory level
          const expectedDepth = actualPrefix
            .replace(`${this.userFolder}/`, "")
            .split("/")
            .filter(Boolean).length;
          if (pathParts.length === expectedDepth + 1) {
            files.push({
              id: blob.name,
              name: fileName,
              type: "file",
              size: blob.properties.contentLength || 0,
              lastModified: blob.properties.lastModified || new Date(),
              path: pathParts.slice(0, -1).join("/"),
              tags: blob.metadata?.tags ? blob.metadata.tags.split(",") : [],
              downloadUrl: this.getBlobSasUrl(blob.name),
            });
          }
        }
      }

      devLog(`✅ Retrieved ${files.length} items from blob storage`);
      return files;
    } catch (error) {
      console.error("Error listing blob files:", error);
      throw error;
    }
  }

  // async uploadFile(file: File, path = ""): Promise<FileItem> {
  //   try {
  //     const blobName = this.getUserPath(
  //       path ? `${path}/${file.name}` : file.name
  //     );
  //     devLog(`📤 Uploading to blob name: ${blobName}`);

  //     const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

  //     // Convert File to ArrayBuffer for upload
  //     const arrayBuffer = await file.arrayBuffer();

  //     await blockBlobClient.uploadData(arrayBuffer, {
  //       blobHTTPHeaders: {
  //         blobContentType: file.type || "application/octet-stream",
  //       },
  //       metadata: {
  //         originalName: file.name,
  //         uploadDate: new Date().toISOString(),
  //         userFolder: this.userFolder,
  //       },
  //     });

  //     devLog(`✅ Successfully uploaded: ${file.name}`);

  //     return {
  //       id: blobName,
  //       name: file.name,
  //       type: "file",
  //       size: file.size,
  //       lastModified: new Date(),
  //       path: path,
  //       downloadUrl: this.getBlobSasUrl(blobName),
  //     };
  //   } catch (error) {
  //     console.error("Error uploading blob file:", error);
  //     throw error;
  //   }
  // }

  async uploadFile(file: File, path = ""): Promise<FileItem> {
    try {
      const blobName = this.getUserPath(
        path ? `${path}/${file.name}` : file.name
      );
      devLog(`📤 Uploading to blob name: ${blobName}`);

      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

      // Convert File to ArrayBuffer for upload
      const arrayBuffer = await file.arrayBuffer();

      // Upload to Azure Blob Storage
      await blockBlobClient.uploadData(arrayBuffer, {
        blobHTTPHeaders: {
          blobContentType: file.type || "application/octet-stream",
        },
        metadata: {
          originalName: file.name,
          uploadDate: new Date().toISOString(),
          userFolder: this.userFolder,
        },
      });

      devLog(`✅ Successfully uploaded: ${file.name}`);

      // Generate download SAS URL
      const downloadUrl = this.getBlobSasUrl(blobName);

      // === Insert file metadata into the database ===
      const db = getDb();
      const parentId = path ? this.getUserPath(path) : null; // optional parent folder
      await db.query(
        `INSERT INTO files
       (id, name, type, mime_type, size, parent_id, owner_email, storage_provider, storage_path, created_at, modified_at)
       VALUES (?, ?, 'file', ?, ?, ?, ?, 'blob', ?, NOW(), NOW())`,
        [
          blobName,
          file.name,
          file.type,
          file.size,
          parentId,
          this.userEmail,
          blobName,
        ]
      );

      return {
        id: blobName,
        name: file.name,
        type: "file",
        size: file.size,
        lastModified: new Date(),
        path,
        downloadUrl,
      };
    } catch (error) {
      console.error("Error uploading blob file:", error);
      throw error;
    }
  }

  async downloadFile(
    path: string
  ): Promise<{ buffer: Buffer; contentType: string; fileName: string }> {
    try {
      const blobName = this.getUserPath(path);
      devLog(`📥 Downloading blob: ${blobName}`);

      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

      const downloadResponse = await blockBlobClient.download();
      const buffer = await this.streamToBuffer(
        downloadResponse.readableStreamBody!
      );

      const fileName = path.split("/").pop() || "download";
      const contentType =
        downloadResponse.contentType || "application/octet-stream";

      return { buffer, contentType, fileName };
    } catch (error) {
      console.error("Error downloading blob file:", error);
      throw error;
    }
  }

  private async streamToBuffer(
    readableStream: NodeJS.ReadableStream
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      readableStream.on("data", (data) => {
        chunks.push(data instanceof Buffer ? data : Buffer.from(data));
      });
      readableStream.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on("error", reject);
    });
  }

  async createFolder(path: string): Promise<FileItem> {
    try {
      // Ensure path ends with /
      const folderPath = path.endsWith("/") ? path : `${path}/`;
      const blobName = this.getUserPath(folderPath + ".folder");

      devLog(`📁 Creating folder marker blob: ${blobName}`);

      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

      // Create a 0-byte blob to represent the folder
      await blockBlobClient.upload("", 0, {
        metadata: {
          isFolder: "true",
          createdDate: new Date().toISOString(),
          userFolder: this.userFolder,
        },
      });

      const folderName = path.split("/").filter(Boolean).pop() || "New Folder";

      return {
        id: blobName,
        name: folderName,
        type: "folder",
        size: 0,
        lastModified: new Date(),
        path: path.split("/").slice(0, -1).join("/"),
      };
    } catch (error) {
      console.error("Error creating blob folder:", error);
      throw error;
    }
  }

  async softDeleteBlob(path: string): Promise<void> {
    try {
      const blobName = this.getUserPath(path);
      devLog(`🗑️ Soft deleting blob: ${blobName}`);

      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

      // Get existing metadata
      const properties = await blockBlobClient.getProperties();

      // Soft delete by marking with metadata
      await blockBlobClient.setMetadata({
        ...properties.metadata,
        deleted: "true",
        deletedDate: new Date().toISOString(),
        originalPath: path,
      });

      devLog(`✅ Soft deleted: ${blobName}`);
    } catch (error) {
      console.error("Error soft deleting blob:", error);
      throw error;
    }
  }

  async restoreBlob(path: string): Promise<FileItem> {
    try {
      const blobName = this.getUserPath(path);
      devLog(`♻️ Restoring blob: ${blobName}`);

      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      const properties = await blockBlobClient.getProperties();

      // Remove deletion metadata
      const metadata = { ...properties.metadata };
      delete metadata.deleted;
      delete metadata.deletedDate;
      delete metadata.originalPath;

      await blockBlobClient.setMetadata(metadata);

      devLog(`✅ Restored: ${blobName}`);

      return {
        id: blobName,
        name: path.split("/").pop() || "Restored File",
        type: "file",
        size: properties.contentLength || 0,
        lastModified: properties.lastModified || new Date(),
        path: path.split("/").slice(0, -1).join("/"),
      };
    } catch (error) {
      console.error("Error restoring blob:", error);
      throw error;
    }
  }

  async updateBlobTags(path: string, tags: string[]): Promise<void> {
    try {
      const blobName = this.getUserPath(path);
      devLog(`🏷️ Updating tags for blob: ${blobName}`, tags);

      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      const properties = await blockBlobClient.getProperties();

      await blockBlobClient.setMetadata({
        ...properties.metadata,
        tags: tags.join(","),
        tagsUpdated: new Date().toISOString(),
      });

      devLog(`✅ Updated tags for: ${blobName}`);
    } catch (error) {
      console.error("Error updating blob tags:", error);
      throw error;
    }
  }

  async getRecycleBin(): Promise<FileItem[]> {
    try {
      devLog(`🗑️ Getting recycle bin for user: ${this.userFolder}`);

      const files: FileItem[] = [];

      for await (const blob of this.containerClient.listBlobsFlat({
        prefix: this.userFolder,
        includeMetadata: true,
      })) {
        // Only include deleted files
        if (blob.metadata?.deleted === "true") {
          const relativePath = blob.name.replace(`${this.userFolder}/`, "");
          const pathParts = relativePath.split("/");
          const fileName = pathParts[pathParts.length - 1];

          files.push({
            id: blob.name,
            name: fileName,
            type: "file",
            size: blob.properties.contentLength || 0,
            lastModified: blob.properties.lastModified || new Date(),
            deletedDate: blob.metadata.deletedDate
              ? new Date(blob.metadata.deletedDate)
              : new Date(),
            originalPath:
              blob.metadata.originalPath || pathParts.slice(0, -1).join("/"),
            path: pathParts.slice(0, -1).join("/"),
            downloadUrl: this.getBlobSasUrl(blob.name),
          });
        }
      }

      devLog(`✅ Found ${files.length} deleted items`);
      return files;
    } catch (error) {
      console.error("Error getting blob recycle bin:", error);
      throw error;
    }
  }

  async getQuota(): Promise<{ used: number }> {
    try {
      let totalSize = 0;

      for await (const blob of this.containerClient.listBlobsFlat({
        prefix: this.userFolder,
      })) {
        if (blob.metadata?.deleted !== "true") {
          totalSize += blob.properties.contentLength || 0;
        }
      }

      return { used: totalSize };
    } catch (error) {
      console.error("Error getting blob quota:", error);
      throw error;
    }
  }

  async searchFiles(query: string): Promise<FileItem[]> {
    try {
      const files: FileItem[] = [];

      for await (const blob of this.containerClient.listBlobsFlat({
        prefix: this.userFolder,
        includeMetadata: true,
      })) {
        // Skip deleted files
        if (blob.metadata?.deleted === "true") continue;

        const relativePath = blob.name.replace(`${this.userFolder}/`, "");
        const fileName = relativePath.split("/").pop() || "";

        // Simple search by filename
        if (fileName.toLowerCase().includes(query.toLowerCase())) {
          const pathParts = relativePath.split("/");
          files.push({
            id: blob.name,
            name: fileName,
            type: "file",
            size: blob.properties.contentLength || 0,
            lastModified: blob.properties.lastModified || new Date(),
            path: pathParts.slice(0, -1).join("/"),
            tags: blob.metadata?.tags ? blob.metadata.tags.split(",") : [],
            downloadUrl: this.getBlobSasUrl(blob.name),
          });
        }
      }

      return files;
    } catch (error) {
      console.error("Error searching blob files:", error);
      throw error;
    }
  }

  // Legacy methods for backward compatibility
  async listFiles(path = ""): Promise<FileItem[]> {
    const prefix = path
      ? `${this.userFolder}/${path.replace(/\/+$/, "")}/`
      : `${this.userFolder}/`;
    return this.listBlobsByHierarchy(prefix);
  }

  async deleteFile(blobName: string): Promise<void> {
    return this.softDeleteBlob(blobName);
  }

  async permanentDelete(blobName: string): Promise<void> {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.delete();
    } catch (error) {
      console.error("Error permanently deleting blob file:", error);
      throw error;
    }
  }

  async restoreFile(fileId: string): Promise<void> {
    const path = fileId.replace(`${this.userFolder}/`, "");
    await this.restoreBlob(path);
  }

  async updateTags(blobName: string, tags: string[]): Promise<void> {
    const path = blobName.replace(`${this.userFolder}/`, "");
    return this.updateBlobTags(path, tags);
  }

  private getFolderPathFromId(id: string): string {
    if (!id || id === "root") return "";
    const withoutPrefix = id.replace(`${this.userFolder}/`, "");
    return withoutPrefix.replace(/\.folder$/, "").replace(/\/$/, "");
  }

  async copyBlob(blobId: string, newParentId: string): Promise<FileItem> {
    try {
      const destPath = this.getFolderPathFromId(newParentId);
      const fileName = blobId.split("/").pop() || "";
      const newBlobName = this.getUserPath(
        destPath ? `${destPath}/${fileName}` : fileName
      );

      devLog(`📄 Copying blob from ${blobId} to ${newBlobName}`);

      const sourceClient = this.containerClient.getBlockBlobClient(blobId);
      const destClient = this.containerClient.getBlockBlobClient(newBlobName);

      const download = await sourceClient.download();
      const buffer = await this.streamToBuffer(download.readableStreamBody!);
      const properties = await sourceClient.getProperties();

      await destClient.uploadData(buffer, {
        blobHTTPHeaders: {
          blobContentType: properties.contentType || "application/octet-stream",
        },
        metadata: { ...properties.metadata },
      });

      return {
        id: newBlobName,
        name: fileName,
        type: blobId.includes(".folder") ? "folder" : "file",
        size: properties.contentLength || 0,
        lastModified: new Date(),
        path: destPath,
        downloadUrl: this.getBlobSasUrl(newBlobName),
      };
    } catch (error) {
      console.error("Error copying blob:", error);
      throw error;
    }
  }

  async moveBlob(blobId: string, newParentId: string): Promise<FileItem> {
    const copied = await this.copyBlob(blobId, newParentId);
    await this.deleteFile(blobId);
    return copied;
  }

  async renameBlob(oldBlobName: string, newName: string): Promise<FileItem> {
    try {
      devLog(`✏️ Renaming blob from ${oldBlobName} to ${newName}`);

      const oldBlockBlobClient =
        this.containerClient.getBlockBlobClient(oldBlobName);

      // Get the directory path from the old blob name
      const pathParts = oldBlobName.split("/");
      pathParts[pathParts.length - 1] = newName; // Replace filename with new name
      const newBlobName = pathParts.join("/");

      const newBlockBlobClient =
        this.containerClient.getBlockBlobClient(newBlobName);

      // Download the old blob
      const downloadResponse = await oldBlockBlobClient.download();
      const buffer = await this.streamToBuffer(
        downloadResponse.readableStreamBody!
      );

      // Get old blob properties and metadata
      const properties = await oldBlockBlobClient.getProperties();

      // Upload to new location with same content and metadata
      await newBlockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: {
          blobContentType: properties.contentType || "application/octet-stream",
        },
        metadata: {
          ...properties.metadata,
          originalName: newName,
          renamedDate: new Date().toISOString(),
        },
      });

      // Delete the old blob
      await oldBlockBlobClient.delete();

      devLog(`✅ Successfully renamed blob to: ${newBlobName}`);

      return {
        id: newBlobName,
        name: newName,
        type: oldBlobName.includes(".folder") ? "folder" : "file",
        size: properties.contentLength || 0,
        lastModified: new Date(),
        path: pathParts.slice(1, -1).join("/"), // Remove user folder and filename
        downloadUrl: this.getBlobSasUrl(newBlobName),
      };
    } catch (error) {
      console.error("Error renaming blob:", error);
      throw error;
    }
  }

  async deleteFolder(folderPath: string): Promise<void> {
    // Ensure folderPath ends with a slash
    const prefix = folderPath.endsWith("/") ? folderPath : folderPath + "/";
    // Use listBlobsFlat to get all blobs under the prefix, recursively
    for await (const blob of this.containerClient.listBlobsFlat({ prefix })) {
      await this.deleteFile(blob.name);
    }
  }

  //*** new

  public async getSharedFileSasUrl(
    fileId: string,
    expiryDays: number
  ): Promise<string> {
    const expiresInMinutes = expiryDays * 24 * 60;
    return this.getBlobSasUrl(fileId, expiresInMinutes);
  }
}
