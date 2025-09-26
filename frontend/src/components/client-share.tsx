"use client";

import { useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useAuth } from "@/components/auth-provider";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SharedFilePreview } from "@/components/shared-file-preview";

interface ClientShareProps {
  shareId: string;
}

export default function ClientShare({ shareId }: ClientShareProps) {
  const { isAuthenticated, login, getAccessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileData, setFileData] = useState<{
    fileId: string;
    sasUrl: string;
    expiry: string;
  } | null>(null);

  useEffect(() => {
    const fetchShareData = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        const token = await getAccessToken(true);
        const response = await fetch(`/api/blob/share/${shareId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "This share link has expired or does not exist."
              : response.status === 401
              ? "Please sign in to access this file"
              : "Failed to load shared file."
          );
        }
        const data = await response.json();
        setFileData(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load shared file."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchShareData();
  }, [shareId, isAuthenticated, getAccessToken]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <Button onClick={() => login()} size="lg" className="gap-2">
          <LogIn className="w-5 h-5" />
          Sign in to view shared file
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-gray-600 mb-6">{error}</p>
          {error.includes("sign in") && (
            <Button onClick={() => login()} size="lg" className="gap-2">
              <LogIn className="w-5 h-5" />
              Sign in
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!fileData) {
    return null;
  }

  return (
    <SharedFilePreview
      file={{
        id: fileData.fileId,
        name: fileData.fileId.split("/").pop() || "",
        type: "file",
        size: 0,
        lastModified: new Date(),
        path: fileData.fileId,
        downloadUrl: fileData.sasUrl,
      }}
    />
  );
}
