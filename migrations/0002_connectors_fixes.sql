-- Site connectors (WordPress, Shopify, GitHub, local folder) and AI-proposed fixes.

CREATE TABLE connectors (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  project_id BIGINT UNSIGNED NOT NULL,
  kind VARCHAR(12) NOT NULL,
  name VARCHAR(120) NOT NULL,
  config TEXT NOT NULL,
  secret TEXT NULL,
  status VARCHAR(12) NOT NULL DEFAULT 'untested',
  last_error TEXT NULL,
  last_tested_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY ix_connectors_project (project_id),
  CONSTRAINT fk_connectors_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_connectors_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE fix_changes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  run_id VARCHAR(100) NOT NULL,
  connector_id BIGINT UNSIGNED NULL,
  resource_type VARCHAR(20) NOT NULL,
  resource_id VARCHAR(300) NOT NULL,
  resource_label VARCHAR(300) NOT NULL DEFAULT '',
  field VARCHAR(60) NOT NULL,
  old_value MEDIUMTEXT NULL,
  new_value MEDIUMTEXT NULL,
  reason TEXT NULL,
  severity VARCHAR(12) NOT NULL DEFAULT 'Medium',
  status VARCHAR(12) NOT NULL DEFAULT 'proposed',
  error TEXT NULL,
  applied_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY ix_fix_changes_run (run_id),
  CONSTRAINT fk_fix_changes_run FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE,
  CONSTRAINT fk_fix_changes_connector FOREIGN KEY (connector_id) REFERENCES connectors(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
