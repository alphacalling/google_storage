"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "./loading-spinner";
import { cn } from "@/lib/utils";
import type { FileItem } from "@/lib/types";

interface SharedFilePreviewProps {
  file: FileItem;
}

export function SharedFilePreview({ file }: SharedFilePreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);

  const isImage = file.name.match(/\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i);
  const isPdf = file.name.match(/\.pdf$/i);
  const isText = file.name.match(/\.(txt|md|json|xml|csv)$/i);
  const isVideo = file.name.match(/\.(mp4|avi|mov|wmv|flv|webm)$/i);
  const isAudio = file.name.match(/\.(mp3|wav|flac|aac|ogg)$/i);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, [file]);

  useEffect(() => {
    if (isText && file.downloadUrl) {
      fetch(file.downloadUrl)
        .then((r) => r.text())
        .then(setTextContent)
        .catch(() => setError("Failed to load file"));
    }
  }, [isText, file.downloadUrl]);

  const handleDownload = () => {
    if (file.downloadUrl) {
      window.open(file.downloadUrl, "_blank");
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-white">
      {/* Minimal header */}
      <div className="flex items-center justify-end p-4 border-b">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Download
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <div
            className={cn(
              "flex h-full",
              isPdf
                ? "items-start justify-start"
                : "items-center justify-center p-4"
            )}
          >
            {isImage ? (
              <Image
                src={
                  file.downloadUrl ||
                  `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(
                    file.name
                  )}`
                }
                alt={file.name}
                width={600}
                height={400}
                className="max-w-full max-h-full object-contain"
                onError={() => setError("Failed to load image")}
                unoptimized
              />
            ) : isPdf ? (
              <div className="w-full h-full">
                <iframe
                  src={file.downloadUrl}
                  className="w-full h-full border-0"
                  title={`Preview of ${file.name}`}
                />
              </div>
            ) : isText ? (
              <div className="w-full max-w-4xl bg-white rounded-lg p-6 shadow-sm">
                <pre className="whitespace-pre-wrap text-sm text-gray-900 font-mono">
                  {textContent || "Loading text content..."}
                </pre>
              </div>
            ) : isVideo ? (
              <video
                src={file.downloadUrl}
                controls
                className="max-w-full max-h-full"
              />
            ) : isAudio ? (
              <audio src={file.downloadUrl} controls className="w-full" />
            ) : (
              <div className="text-center">
                <Button onClick={handleDownload} className="gap-2">
                  <Download className="w-4 h-4" />
                  Download to view
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
