"use client";
import { devLog } from "@/lib/utils/dev-log";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoreVertical,
  Download,
  Edit,
  Trash2,
  Tag,
  Share,
  Folder,
  FileEdit,
  Eye,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TagsDialog } from "./tags-dialog";
import { OfficeModal } from "./office-modal";
import { PreviewModal } from "./preview-modal";
import {
  formatFileSize,
  formatDate,
  getFileIcon,
  getFileIconColor,
  canPreview,
  isOfficeFile,
} from "@/lib/utils/file-utils";
import { ONEDRIVE_SERVICE_URL, BLOB_SERVICE_URL } from "@/lib/service-config";
import type { FileItem } from "@/lib/types";
import { RenameDialog } from "./rename-dialog";
import { useAuth } from "./auth-provider";
import { useToast } from "./ui/use-toast";

interface FileListProps {
  files: FileItem[];
  source: "onedrive" | "blob";
  currentPath?: string;
  onRefresh?: () => void;
}

export function FileList({
  files,
  source,
  currentPath = "",
  onRefresh,
}: FileListProps) {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false);
  const [officeModalOpen, setOfficeModalOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const { getAccessToken } = useAuth();
  const { toast } = useToast();

  const handleRowClick = (file: FileItem) => {
    if (file.type === "folder") {
      // Navigate to the folder. Avoid manual encoding so the router can
      // correctly encode segments without double escaping.
      const newPath = currentPath ? `${currentPath}/${file.name}` : file.name;

      devLog(`📁 Navigating to folder: ${file.name}`);
      devLog(`🛤️ Current path: "${currentPath}"`);
      devLog(`🛤️ New path: "${newPath}"`);

      router.push(`/blob/${newPath}`);
    } else if (canPreview(file.name)) {
      setSelectedFile(file);
      setPreviewModalOpen(true);
    } else if (isOfficeFile(file.name)) {
      setSelectedFile(file);
      setOfficeModalOpen(true);
    } else if (file.webUrl) {
      window.open(file.webUrl, "_blank");
    }
  };

  // const handleAction = async (
  //   action: string,
  //   file: FileItem,
  //   e?: React.MouseEvent
  // ) => {
  //   if (e) e.stopPropagation();
  //   setSelectedFile(file);

  //   try {
  //     const token = await getAccessToken(source === "blob");

  //     // Select correct service URL
  //     const baseUrl =
  //       source === "onedrive" ? ONEDRIVE_SERVICE_URL : BLOB_SERVICE_URL;

  //     switch (action) {
  //       case "download": {
  //         const url =
  //           source === "onedrive"
  //             ? `${baseUrl}/download?fileId=${encodeURIComponent(file.id)}`
  //             : `${baseUrl}/download?path=${encodeURIComponent(file.path)}`;

  //         const res = await fetch(url, {
  //           method: "GET",
  //           headers: { Authorization: `Bearer ${token}` },
  //         });

  //         if (!res.ok) throw new Error("Download failed");
  //         const blob = await res.blob();

  //         const a = document.createElement("a");
  //         a.href = window.URL.createObjectURL(blob);
  //         a.download = file.name;
  //         a.click();
  //         window.URL.revokeObjectURL(a.href);

  //         toast({
  //           title: "Download started",
  //           description: `${file.name} downloaded`,
  //         });
  //         break;
  //       }

  //       case "delete": {
  //         if (!confirm(`Are you sure you want to delete "${file.name}"?`)) return;

  //         const res = await fetch(`${baseUrl}/delete`, {
  //           method: "DELETE",
  //           headers: {
  //             Authorization: `Bearer ${token}`,
  //             "Content-Type": "application/json",
  //           },
  //           body: JSON.stringify({ fileId: file.id, type: file.type }),
  //         });

  //         console.log(
  //           "Delete baseUrl:",
  //           baseUrl,
  //           "fileId:",
  //           file.id,
  //           "type:",
  //           file.type
  //         );

  //         if (!res.ok) throw new Error("Delete failed");

  //         toast({
  //           title: "Deleted",
  //           description: `${file.name} has been moved to recycle bin`,
  //         });

  //         onRefresh?.(); // ✅ moved here
  //         break;
  //       }

  //       case "permanent-delete": {
  //         if (
  //           !confirm(
  //             `⚠️ Permanently delete "${file.name}"? This cannot be undone.`
  //           )
  //         )
  //           return;

  //         const res = await fetch(`${baseUrl}/permanent-delete`, {
  //           method: "DELETE",
  //           headers: {
  //             Authorization: `Bearer ${token}`,
  //             "Content-Type": "application/json",
  //           },
  //           body: JSON.stringify({ fileId: file.id }),
  //         });

  //         if (!res.ok) throw new Error("Permanent delete failed");

  //         toast({
  //           title: "Deleted permanently",
  //           description: `${file.name} has been permanently deleted`,
  //         });
  //         onRefresh?.();
  //         break;
  //       }
  //     }
  //   } catch (err) {
  //     console.error(err);
  //     toast({
  //       title: "Error",
  //       description: `Failed to perform action: ${action}`,
  //       variant: "destructive",
  //     });
  //   }
  // };

  const handleAction = (
    action: string,
    file: FileItem,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    setSelectedFile(file);

    switch (action) {
      case "preview":
        setPreviewModalOpen(true);
        break;
      case "tags":
        setTagsDialogOpen(true);
        break;
      case "edit":
        setOfficeModalOpen(true);
        break;
      case "rename":
        setRenameDialogOpen(true);
        break;
      case "download":
        devLog("Download:", file.name);
        break;
      case "share":
        devLog("Share:", file.name);
        break;
      case "delete":
        devLog("Delete:", file.name);
        break;
      case "permanent-delete":
        devLog("permanent-delete:", file.name);
        break;
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Modified</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => {
              const IconComponent = getFileIcon(file);
              const color = getFileIconColor(file);

              return (
                <TableRow
                  key={file.id}
                  className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 ${
                    file.type === "folder" ? "cursor-pointer" : ""
                  }`}
                  onClick={() => handleRowClick(file)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {file.type === "folder" ? (
                        <Folder className={`w-5 h-5 flex-shrink-0 ${color}`} />
                      ) : (
                        <IconComponent
                          className={`w-5 h-5 flex-shrink-0 ${color}`}
                        />
                      )}
                      <span className="font-medium text-gray-900 dark:text-white truncate">
                        {file.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-500 dark:text-gray-400">
                    {formatDate(file.lastModified)}
                  </TableCell>
                  <TableCell className="text-gray-500 dark:text-gray-400">
                    {file.type === "file" ? formatFileSize(file.size) : "—"}
                  </TableCell>
                  <TableCell>
                    {file.tags && file.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {file.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {file.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{file.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {file.type === "file" && (
                          <>
                            <DropdownMenuItem
                              onClick={(e) => handleAction("preview", file, e)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => handleAction("download", file, e)}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            {(file.name.endsWith(".docx") ||
                              file.name.endsWith(".txt") ||
                              file.name.endsWith(".xlsx") ||
                              file.name.endsWith(".pptx")) && (
                              <DropdownMenuItem
                                onClick={(e) => handleAction("edit", file, e)}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit in Office
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={(e) => handleAction("share", file, e)}
                        >
                          <Share className="w-4 h-4 mr-2" />
                          Share
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={(e) => handleAction("rename", file, e)}
                        >
                          <FileEdit className="w-4 h-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => handleAction("tags", file, e)}
                        >
                          <Tag className="w-4 h-4 mr-2" />
                          Manage Tags
                        </DropdownMenuItem>
                        {/* <DropdownMenuSeparator /> */}
                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={(e) => handleAction("delete", file, e)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={(e) =>
                            handleAction("permanent-delete", file, e)
                          }
                          className="text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete permanently
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {selectedFile && (
        <>
          <TagsDialog
            open={tagsDialogOpen}
            onOpenChange={setTagsDialogOpen}
            file={selectedFile}
            source={source}
          />

          <OfficeModal
            open={officeModalOpen}
            onOpenChange={setOfficeModalOpen}
            file={selectedFile}
            source={source}
          />

          <RenameDialog
            open={renameDialogOpen}
            onOpenChange={setRenameDialogOpen}
            file={selectedFile}
            source={source}
            currentPath={currentPath}
            onSuccess={() => onRefresh?.()}
          />
          <PreviewModal
            open={previewModalOpen}
            onOpenChange={setPreviewModalOpen}
            file={selectedFile}
            source={source}
          />
        </>
      )}
    </>
  );
}
