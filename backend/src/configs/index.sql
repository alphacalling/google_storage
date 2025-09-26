-- users details
CREATE TABLE IF NOT EXISTS users (
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
     id BIGINT AUTO_INCREMENT PRIMARY KEY,
     file_id VARCHAR(512) NOT NULL UNIQUE,
     name VARCHAR(255) NOT NULL,
     type ENUM('file', 'folder') NOT NULL,
     size BIGINT,
     tags varchar(255),
     owner_email VARCHAR(255),
     storage_provider ENUM('blob', 'onedrive') NOT NULL,
     storage_path VARCHAR(512) NOT NULL,
     temp_deleted BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 	INDEX idx_owner_files (owner_email, temp_deleted)
 );

-- Enhanced share links table
CREATE TABLE IF NOT EXISTS share_links (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    file_id VARCHAR(512) NOT NULL,
    share_id VARCHAR(255) UNIQUE NOT NULL,
    sas_url VARCHAR(2000) NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    access_type ENUM('view', 'edit') NOT NULL DEFAULT 'view',
    expiry TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	-- FOREIGN KEY (file_id) REFERENCES files(file_id),
    INDEX idx_share_id (share_id)
);


CREATE TABLE IF NOT EXISTS file_renames (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    file_id VARCHAR(512) NOT NULL,
    old_name VARCHAR(255) NOT NULL,
    new_name VARCHAR(255) NOT NULL,
    renamed_by VARCHAR(255) NOT NULL,
    renamed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    storage_path VARCHAR(512),
    type ENUM('file', 'folder') NOT NULL
);


CREATE TABLE IF NOT EXISTS deleted_files (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    file_id VARCHAR(512) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('file','folder') NOT NULL,
    size BIGINT DEFAULT 0,
    path VARCHAR(512) NOT NULL,
    deleted_by VARCHAR(255) NOT NULL,
    deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE file_tags (
    file_id VARCHAR(512) NOT NULL,
    tags VARCHAR(255) NOT NULL,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (file_id, tags),
    FOREIGN KEY (file_id) REFERENCES files(file_id)
);


-- Activity logging
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    -- Who performed the action
    user_email VARCHAR(255) NOT NULL,

    -- File/folder affected
    file_id   VARCHAR(255) NOT NULL,

    -- What action was performed
    action_type ENUM(
        'upload','download','rename','move',
        'delete','restore','share','tags','copy'
    ) NOT NULL,

    -- Optional descriptive fields for old/new values
    before_value TEXT NULL,
    after_value  TEXT NULL,

    -- Optional extra context if needed
    notes TEXT NULL,

    -- Timestamp of the action
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (file_id) REFERENCES files(file_id)
        ON DELETE CASCADE,

    INDEX idx_user_activity (user_email, created_at),
    INDEX idx_file_activity (file_id, action_type)
);