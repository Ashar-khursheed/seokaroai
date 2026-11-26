-- Paid Add-ons (sold separately from core plans) and Reddit/Quora Outreach tracker.

CREATE TABLE user_addons (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  addon_code VARCHAR(40) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  paddle_subscription_id VARCHAR(64) NULL,
  renews_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_user_addon (user_id, addon_code),
  CONSTRAINT fk_user_addons_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE outreach_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  project_id BIGINT UNSIGNED NOT NULL,
  platform VARCHAR(16) NOT NULL,
  title VARCHAR(300) NOT NULL,
  url VARCHAR(700) NOT NULL,
  community VARCHAR(140) NOT NULL DEFAULT '',
  snippet TEXT NULL,
  draft_reply MEDIUMTEXT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'found',
  posted_url VARCHAR(700) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY ix_outreach_project (project_id, status),
  KEY ix_outreach_user (user_id, created_at),
  CONSTRAINT fk_outreach_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_outreach_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
