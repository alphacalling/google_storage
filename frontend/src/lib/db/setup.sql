-- users details
 CREATE TABLE users (
   id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

   -- Identity from Microsoft
   msal_id VARCHAR(255) NOT NULL UNIQUE,
   email VARCHAR(255) NOT NULL,

   -- Profile
   full_name VARCHAR(255) NULL,
   avatar_url VARCHAR(500) NULL,

   -- Role / Access
   role ENUM('user','admin') DEFAULT 'user',
   is_active BOOLEAN DEFAULT TRUE,

   -- Usage tracking
   storage_quota BIGINT UNSIGNED DEFAULT 10737418240, -- default 10GB
   storage_used BIGINT UNSIGNED DEFAULT 0,

   -- Timestamps
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   last_login_at DATETIME NULL
);


-- Files table - core table for tracking all files
CREATE TABLE IF NOT EXISTS files (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('file', 'folder') NOT NULL,
    mime_type VARCHAR(100),
    size BIGINT,
    parent_id VARCHAR(36),
    owner_email VARCHAR(255) NOT NULL,
    storage_provider ENUM('blob', 'onedrive') NOT NULL,
    storage_path VARCHAR(512) NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (parent_id) REFERENCES files(id),
    INDEX idx_owner_files (owner_email, is_deleted),
    INDEX idx_parent (parent_id, is_deleted)
);

-- File versions for tracking changes
CREATE TABLE IF NOT EXISTS file_versions (
    id VARCHAR(36) PRIMARY KEY,
    file_id VARCHAR(36) NOT NULL,
    version_number INT NOT NULL,
    size BIGINT NOT NULL,
    storage_path VARCHAR(512) NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files(id),
    UNIQUE KEY uk_file_version (file_id, version_number)
);

-- Tags system
CREATE TABLE IF NOT EXISTS tags (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    owner_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_owner_tag (owner_email, name)
);

-- File tags mapping
CREATE TABLE IF NOT EXISTS file_tags (
    file_id VARCHAR(36) NOT NULL,
    tag_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (file_id, tag_id),
    FOREIGN KEY (file_id) REFERENCES files(id),
    FOREIGN KEY (tag_id) REFERENCES tags(id)
);

-- Enhanced share links table
CREATE TABLE IF NOT EXISTS share_links (
    id VARCHAR(36) PRIMARY KEY,
    share_id VARCHAR(36) UNIQUE NOT NULL,
    file_id VARCHAR(255) NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    access_type ENUM('view', 'edit') NOT NULL DEFAULT 'view',
    requires_auth BOOLEAN DEFAULT TRUE,
    expiry TIMESTAMP NOT NULL,
    password_hash VARCHAR(255) NULL,
    access_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP NULL,
    FOREIGN KEY (file_id) REFERENCES files(id),
    INDEX idx_share_id (share_id),
    INDEX idx_file_shares (file_id)
);

-- Activity logging
CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    file_id VARCHAR(36) NOT NULL,
    action_type ENUM(
        'upload', 'download', 'rename', 'move', 
        'delete', 'restore', 'share', 'tag_add', 
        'tag_remove', 'permission_change'
    ) NOT NULL,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files(id),
    INDEX idx_user_activity (user_email, created_at),
    INDEX idx_file_activity (file_id, action_type)
);
