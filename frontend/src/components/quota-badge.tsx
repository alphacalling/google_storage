"use client"
import { devLog } from "@/lib/utils/dev-log"

import { useState, useEffect } from "react"
import { HardDrive } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "./auth-provider"
import { BLOB_SERVICE_URL } from "@/lib/service-config"

interface QuotaInfo {
  used: number
  total: number
  percentage: number
}

export function QuotaBadge() {
  const [blobQuota, setBlobQuota] = useState<QuotaInfo>({
    used: 0,
    total: 10 * 1024 * 1024 * 1024, // 10 GB in bytes
    percentage: 0,
  })
  const { getAccessToken } = useAuth()

  useEffect(() => {
    fetchQuotaInfo()
  }, [])

  const fetchQuotaInfo = async () => {
    try {
      const token = await getAccessToken(true)
      try {
        const blobResponse = await fetch(`${BLOB_SERVICE_URL}/quota`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (blobResponse.ok) {
          const blobData = await blobResponse.json()
          setBlobQuota({
            used: blobData.used,
            total: 10 * 1024 * 1024 * 1024, // 10 GB
            percentage: (blobData.used / (10 * 1024 * 1024 * 1024)) * 100,
          })
        }
      } catch (blobError) {
        devLog("Blob storage quota not available:", blobError)
      }
    } catch (error) {
      console.error("Failed to fetch quota info:", error)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  return (
    <Card className="w-full">
      <CardContent className="p-3 space-y-3">
        {/* Blob Storage Quota */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Azure Storage</span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatBytes(blobQuota.used)} / {formatBytes(blobQuota.total)}
            </span>
          </div>
          <Progress value={blobQuota.percentage} className="h-1.5" />
        </div>
      </CardContent>
    </Card>
  )
}
