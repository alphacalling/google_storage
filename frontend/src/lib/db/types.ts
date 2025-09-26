import { RowDataPacket } from "mysql2";

export interface DBFile extends RowDataPacket {
  id: string;
  name: string;
  type: "file" | "folder";
  mime_type: string | null;
  size: number | null;
  parent_id: string | null;
  owner_email: string;
  storage_provider: "blob" | "onedrive";
  storage_path: string;
  is_deleted: boolean;
  created_at: Date;
  modified_at: Date;
  deleted_at: Date | null;
}

export interface FileVersion extends RowDataPacket {
  id: string;
  file_id: string;
  version_number: number;
  size: number;
  storage_path: string;
  created_by: string;
  created_at: Date;
}

export interface Tag extends RowDataPacket {
  id: string;
  name: string;
  owner_email: string;
  created_at: Date;
}

export interface ShareLink extends RowDataPacket {
  id: string;
  share_id: string;
  file_id: string;
  created_by: string;
  access_type: "view" | "edit";
  requires_auth: boolean;
  expiry: Date;
  password_hash: string | null;
  access_count: number;
  created_at: Date;
  last_accessed_at: Date | null;
}

export interface ActivityLog extends RowDataPacket {
  id: number;
  user_email: string;
  file_id: string;
  action_type:
    | "upload"
    | "download"
    | "rename"
    | "move"
    | "delete"
    | "restore"
    | "share"
    | "tag_add"
    | "tag_remove"
    | "permission_change";
  details: Record<string, any>;
  created_at: Date;
}
