"use client";
import { devLog } from "@/lib/utils/dev-log";

import { useState } from "react";
import { Copy, Mail, Link, Settings, Globe, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ONEDRIVE_SERVICE_URL, BLOB_SERVICE_URL } from "@/lib/service-config";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Share } from "lucide-react"; // Import Share component
import type { FileItem } from "@/lib/types";
import { useAuth } from "./auth-provider";
import { useToast } from "./ui/use-toast";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileItem;
  source: "onedrive" | "blob";
}

export function ShareDialog({
  open,
  onOpenChange,
  file,
  source,
}: ShareDialogProps) {
  const [shareLink, setShareLink] = useState("");
  const [linkPermission, setLinkPermission] = useState("view");
  const [requireSignIn, setRequireSignIn] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(false);

  const { getAccessToken } = useAuth();
  const { toast } = useToast();

  const generateShareLink = async () => {
    try {
      setLoading(true);
      const token = await getAccessToken(source === "blob");
      const endpoint =
        source === "onedrive"
          ? `${ONEDRIVE_SERVICE_URL}/create-link`
          : `${BLOB_SERVICE_URL}/share`;

      // Build request body
      const body: Record<string, any> =
        source === "onedrive"
          ? {
              fileId: file.id,
              type: linkPermission,
              scope: requireSignIn ? "organization" : "anonymous",
            }
          : {
              fileId: file.id,
              expiryDays: 7,
            };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      console.log("response....", response);

      if (!response.ok) throw new Error("Failed to create share link");
      const data = await response.json();
      console.log("data....", data);

      toast({
        title: "Share",
        description: `${file.name} link has been copied`,
      });
      // Parse the link depending on service
      const link =
        source === "onedrive"
          ? data.link?.link?.webUrl || data.link?.webUrl || ""
          : data.url || "";

      setShareLink(link);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to Share File",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      devLog("Link copied to clipboard");
    }
  };

  const sendEmail = () => {
    if (shareLink && emailInput) {
      window.location.href = `mailto:${emailInput}?subject=Shared file&body=${encodeURIComponent(
        shareLink
      )}`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share className="w-5 h-5" />
            Share "{file.name}"
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link">Share link</TabsTrigger>
            <TabsTrigger value="people">Share with people</TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Link permissions</Label>
                <Select
                  value={linkPermission}
                  onValueChange={setLinkPermission}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        <span>Anyone with the link can view</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="edit">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        <span>Anyone with the link can edit</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="restricted">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        <span>Specific people</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Require sign-in</Label>
                  <p className="text-xs text-gray-500 mt-1">
                    People must sign in to access this file
                  </p>
                </div>
                <Switch
                  checked={requireSignIn}
                  onCheckedChange={setRequireSignIn}
                />
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={shareLink}
                    placeholder="Click 'Get link' to generate a share link"
                    readOnly
                    className="flex-1"
                  />
                  <Button onClick={generateShareLink} variant="outline">
                    <Link className="w-4 h-4 mr-2" />
                    Get link
                  </Button>
                </div>

                {shareLink && (
                  <Button onClick={copyLink} className="w-full">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy link
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="people" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Invite people</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter email addresses"
                    className="flex-1"
                  />
                  <Select defaultValue="edit">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">Can view</SelectItem>
                      <SelectItem value="edit">Can edit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={sendEmail} className="mt-2 w-full">
                  <Mail className="w-4 h-4 mr-2" />
                  Send invitation
                </Button>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">
                  People with access
                </Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>YU</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">You</p>
                        <p className="text-xs text-gray-500">Owner</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
