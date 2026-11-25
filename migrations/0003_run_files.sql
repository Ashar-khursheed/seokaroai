-- Persist run report files (JSON, markdown, HTML, PDF, screenshots, activity log) in MySQL
-- so reports survive container restarts, redeploys, and ephemeral disks.

CREATE TABLE run_files (
  run_id VARCHAR(100) NOT NULL,
  path VARCHAR(255) NOT NULL,
  content LONGBLOB NOT NULL,
  size INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (run_id, path),
  CONSTRAINT fk_run_files_run FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
