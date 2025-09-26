"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ImageIcon,
  MoreVertical,
  Download,
  Trash2,
  Tag,
  Share,
  Folder,
  ExternalLink,
  FolderOpen,
  Info,
  FileEdit,
  Link,
  Plus,
  Copy as CopyIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";
import { ONEDRIVE_SERVICE_URL, BLOB_SERVICE_URL } from "@/lib/service-config";

const TagsDialog = dynamic(() =>
  import("./tags-dialog").then((m) => m.TagsDialog)
);
const OfficeModal = dynamic(() =>
  import("./office-modal").then((m) => m.OfficeModal)
);
const PreviewModal = dynamic(() =>
  import("./preview-modal").then((m) => m.PreviewModal)
);
const ShareDialog = dynamic(() =>
  import("./share-dialog").then((m) => m.ShareDialog)
);
const RenameDialog = dynamic(() =>
  import("./rename-dialog").then((m) => m.RenameDialog)
);
const MoveDialog = dynamic(() =>
  import("./move-dialog").then((m) => m.MoveDialog)
);
const CopyDialog = dynamic(() =>
  import("./copy-dialog").then((m) => m.CopyDialog)
);
const DetailsDialog = dynamic(() =>
  import("./details-dialog").then((m) => m.DetailsDialog)
);
const CreateFolderDialog = dynamic(() =>
  import("./create-folder-dialog").then((m) => m.CreateFolderDialog)
);
import {
  formatFileSize,
  formatDate,
  getFileIcon,
  getFileIconColor,
  isOfficeFile,
  canPreview,
} from "@/lib/utils/file-utils";
import { useAuth } from "./auth-provider";
import { useToast } from "@/hooks/use-toast";
import type { FileItem } from "@/lib/types";

interface FileCardProps {
  file: FileItem;
  source: "onedrive" | "blob";
  currentPath?: string;
  onRefresh?: () => void;
}

export function FileCard({
  file,
  source,
  currentPath = "",
  onRefresh,
}: FileCardProps) {
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const { toast } = useToast();
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false);
  const [officeModalOpen, setOfficeModalOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCardClick = () => {
    if (file.type === "folder") {
      // Navigate to the folder. We let Next.js handle URL encoding so we
      // don't double encode the path which previously resulted in malformed
      // URLs when drilling into nested folders.
      const newPath = currentPath ? `${currentPath}/${file.name}` : file.name;
      router.push(`/blob/${newPath}`);
    } else if (canPreview(file.name)) {
      setPreviewModalOpen(true);
    } else if (isOfficeFile(file.name)) {
      setOfficeModalOpen(true);
    } else if (file.webUrl) {
      window.open(file.webUrl, "_blank");
    }
  };

  const handleMenuAction = async (action: string, e: React.MouseEvent) => {
    e.stopPropagation();

    switch (action) {
      case "open":
        if (file.type === "folder") {
          handleCardClick();
        } else if (canPreview(file.name)) {
          setPreviewModalOpen(true);
        } else if (isOfficeFile(file.name)) {
          setOfficeModalOpen(true);
        } else if (file.webUrl) {
          window.open(file.webUrl, "_blank");
        }
        break;

      case "download":
        if (file.downloadUrl) {
          const link = document.createElement("a");
          link.href = file.downloadUrl;
          link.download = file.name;
          link.target = "_blank";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast({
            title: "Download started",
            description: `Downloading ${file.name}`,
          });
        }
        break;

      case "share":
        setShareDialogOpen(true);
        break;

      case "copy-link":
        await handleCopyLink();
        break;

      case "rename":
        setRenameDialogOpen(true);
        break;

      case "copy":
        setCopyDialogOpen(true);
        break;

      case "move":
        setMoveDialogOpen(true);
        break;

      case "create-folder":
        setCreateFolderDialogOpen(true);
        break;

      case "details":
        setDetailsDialogOpen(true);
        break;

      case "delete":
        await handleDelete();
        break;

      case "permanent-delete":
        handlePermanentDelete();
        break;

      case "tags":
        setTagsDialogOpen(true);
        break;

      case "edit":
        // setOfficeModalOpen();
        break;
    }
  };

  // handle copy link
  const handleCopyLink = async () => {
    toast({
      title: "Not available",
      description: "Link sharing is not supported.",
      variant: "destructive",
    });
  };

  // handle soft delete
  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${file.name}"?`)) return;

    try {
      setLoading(true);
      const token = await getAccessToken(source === "blob");

      const endpoint =
        source === "onedrive"
          ? `${ONEDRIVE_SERVICE_URL}/delete`
          : `${BLOB_SERVICE_URL}/delete`;
      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileId: file.id, type: file.type }),
      });

      if (!response.ok) throw new Error("Failed to delete");

      toast({
        title: "Deleted",
        description: `${file.name} has been moved to recycle bin`,
      });

      onRefresh?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // handle permanent  delete
  const handlePermanentDelete = async () => {
    if (
      !confirm(`⚠️ Permanently delete "${file.name}"? This cannot be undone.`)
    )
      return;
    try {
      setLoading(true);
      const token = await getAccessToken(source === "blob");

      const endpoint =
        source === "onedrive"
          ? `${ONEDRIVE_SERVICE_URL}/permanent-delete`
          : `${BLOB_SERVICE_URL}/permanent-delete`;
      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileId: file.id, type: file.type }),
      });

      if (!response.ok) throw new Error("Failed to delete");

      toast({
        title: "Deleted permanently",
        description: `${file.name} has been permanently deleted`,
      });

      onRefresh?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const IconComponent = getFileIcon(file);
  const color = getFileIconColor(file);

  return (
    <>
      <Card
        className={`file-card group cursor-pointer ${
          file.type === "folder"
            ? "hover:bg-blue-50 dark:hover:bg-blue-900/20"
            : ""
        }`}
        onClick={handleCardClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-shrink-0">
              {file.type === "folder" ? (
                <Folder className={`w-8 h-8 ${color}`} />
              ) : IconComponent === ImageIcon ? (
                <ImageIcon className={`w-8 h-8 ${color}`} />
              ) : (
                <IconComponent className={`w-8 h-8 ${color}`} />
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                  disabled={loading}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {/* Open */}
                <DropdownMenuItem onClick={(e) => handleMenuAction("open", e)}>
                  {file.type === "folder" ? (
                    <FolderOpen className="w-4 h-4 mr-2" />
                  ) : (
                    <ExternalLink className="w-4 h-4 mr-2" />
                  )}
                  Open
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Share */}
                {source === "onedrive" && (
                  <DropdownMenuItem
                    onClick={(e) => handleMenuAction("share", e)}
                  >
                    <Share className="w-4 h-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                )}

                {/* Copy link */}
                {source === "onedrive" && (
                  <DropdownMenuItem
                    onClick={(e) => handleMenuAction("copy-link", e)}
                  >
                    <Link className="w-4 h-4 mr-2" />
                    Copy link
                  </DropdownMenuItem>
                )}

                {/* <DropdownMenuSeparator /> */}

                {/* Download - files only */}
                {file.type === "file" && (
                  <DropdownMenuItem
                    onClick={(e) => handleMenuAction("download", e)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                )}

                {/* Rename */}
                <DropdownMenuItem
                  onClick={(e) => handleMenuAction("rename", e)}
                >
                  <FileEdit className="w-4 h-4 mr-2" />
                  Rename
                </DropdownMenuItem>

                {/* Copy */}
                <DropdownMenuItem onClick={(e) => handleMenuAction("copy", e)}>
                  <CopyIcon className="w-4 h-4 mr-2" />
                  Copy to
                </DropdownMenuItem>

                {/* Move */}
                <DropdownMenuItem onClick={(e) => handleMenuAction("move", e)}>
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Move to
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Create folder - folders only */}
                {file.type === "folder" && (
                  <DropdownMenuItem
                    onClick={(e) => handleMenuAction("create-folder", e)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New folder
                  </DropdownMenuItem>
                )}

                {/* Details */}
                <DropdownMenuItem
                  onClick={(e) => handleMenuAction("details", e)}
                >
                  <Info className="w-4 h-4 mr-2" />
                  Details
                </DropdownMenuItem>

                {/* Share */}
                <DropdownMenuItem onClick={(e) => handleMenuAction("share", e)}>
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </DropdownMenuItem>

                {/* Tags */}
                <DropdownMenuItem onClick={(e) => handleMenuAction("tags", e)}>
                  <Tag className="w-4 h-4 mr-2" />
                  Manage tags
                </DropdownMenuItem>

                {/* Copy link */}
                {source === "onedrive" && (
                  <DropdownMenuItem
                    onClick={(e) => handleMenuAction("copy-link", e)}
                  >
                    <Link className="w-4 h-4 mr-2" />
                    Copy link
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                {/* Delete */}
                <DropdownMenuItem
                  onClick={(e) => handleMenuAction("delete", e)}
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>

                {/* Permanent Delete */}
                <DropdownMenuItem
                  onClick={(e) => handleMenuAction("permanent-delete", e)}
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete permanently
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2">
            <h3
              className="font-medium text-sm text-gray-900 dark:text-white truncate"
              title={file.name}
            >
              {file.name}
            </h3>

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{formatDate(file.lastModified)}</span>
              {file.type === "file" && <span>{formatFileSize(file.size)}</span>}
              {file.type === "folder" && <span>Folder</span>}
            </div>

            {file.tags && file.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {file.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {file.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{file.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Working Dialogs */}
      <TagsDialog
        open={tagsDialogOpen}
        onOpenChange={setTagsDialogOpen}
        file={file}
        source={source}
        onSuccess={onRefresh}
      />
      <OfficeModal
        open={officeModalOpen}
        onOpenChange={setOfficeModalOpen}
        file={file}
        source={source}
      />
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        file={file}
        source={source}
      />
      <RenameDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        file={file}
        source={source}
        currentPath={currentPath}
        onSuccess={onRefresh}
      />
      <MoveDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        file={file}
        source={source}
        onSuccess={onRefresh}
      />
      <CopyDialog
        open={copyDialogOpen}
        onOpenChange={setCopyDialogOpen}
        file={file}
        source={source}
        onSuccess={onRefresh}
      />
      <DetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        file={file}
        source={source}
      />
      <CreateFolderDialog
        open={createFolderDialogOpen}
        onOpenChange={setCreateFolderDialogOpen}
        parentPath={currentPath}
        onSuccess={onRefresh}
      />
      <PreviewModal
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        file={file}
        source={source}
      />
    </>
  );
}
