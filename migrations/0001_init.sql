-- SEOKaroAI initial schema (MySQL 8 / MariaDB 10.4+). utf8mb4 everywhere.

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(120) NOT NULL DEFAULT '',
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'user',
  email_verified_at DATETIME(3) NULL,
  plan VARCHAR(20) NOT NULL DEFAULT 'free',
  billing_cycle VARCHAR(10) NULL,
  plan_status VARCHAR(20) NOT NULL DEFAULT 'active',
  plan_renews_at DATETIME(3) NULL,
  paddle_customer_id VARCHAR(64) NULL,
  paddle_subscription_id VARCHAR(64) NULL,
  suspended_at DATETIME(3) NULL,
  email_weekly TINYINT(1) NOT NULL DEFAULT 1,
  email_alerts TINYINT(1) NOT NULL DEFAULT 1,
  email_runs TINYINT(1) NOT NULL DEFAULT 1,
  last_digest_at DATETIME(3) NULL,
  last_login_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_users_email (email),
  KEY ix_users_paddle_sub (paddle_subscription_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sessions (
  id CHAR(64) PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  ip VARCHAR(64) NULL,
  user_agent VARCHAR(255) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY ix_sessions_user (user_id),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE auth_tokens (
  id CHAR(64) PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  kind VARCHAR(16) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  used_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY ix_tokens_user (user_id, kind),
  CONSTRAINT fk_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE projects (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  url VARCHAR(500) NOT NULL,
  domain VARCHAR(255) NOT NULL,
  country VARCHAR(80) NOT NULL DEFAULT 'United States',
  language VARCHAR(40) NOT NULL DEFAULT 'English',
  competitors TEXT NULL,
  auto_audit VARCHAR(10) NOT NULL DEFAULT 'monthly',
  rank_frequency VARCHAR(10) NOT NULL DEFAULT 'weekly',
  last_score INT NULL,
  last_audit_at DATETIME(3) NULL,
  next_audit_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY ix_projects_user (user_id),
  KEY ix_projects_next_audit (next_audit_at),
  CONSTRAINT fk_projects_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE runs (
  id VARCHAR(100) PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  project_id BIGINT UNSIGNED NULL,
  kind VARCHAR(10) NOT NULL,
  trigger_type VARCHAR(10) NOT NULL DEFAULT 'manual',
  status VARCHAR(12) NOT NULL DEFAULT 'queued',
  title VARCHAR(300) NOT NULL DEFAULT '',
  input TEXT NOT NULL,
  summary MEDIUMTEXT NULL,
  score INT NULL,
  cost_usd DECIMAL(10,4) NULL,
  turns INT NULL,
  error TEXT NULL,
  worker VARCHAR(64) NULL,
  heartbeat_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  started_at DATETIME(3) NULL,
  finished_at DATETIME(3) NULL,
  KEY ix_runs_status (status, created_at),
  KEY ix_runs_user (user_id, created_at),
  KEY ix_runs_project (project_id, created_at),
  CONSTRAINT fk_runs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_runs_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE keywords (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  project_id BIGINT UNSIGNED NOT NULL,
  keyword VARCHAR(200) NOT NULL,
  target_url VARCHAR(500) NULL,
  position INT NULL,
  previous_position INT NULL,
  best_position INT NULL,
  ranking_url VARCHAR(500) NULL,
  last_checked_at DATETIME(3) NULL,
  next_check_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_keywords_project_kw (project_id, keyword),
  KEY ix_keywords_next (next_check_at),
  CONSTRAINT fk_keywords_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_keywords_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE rank_checks (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  keyword_id BIGINT UNSIGNED NOT NULL,
  position INT NULL,
  url VARCHAR(500) NULL,
  top_results MEDIUMTEXT NULL,
  source VARCHAR(20) NOT NULL,
  cost_usd DECIMAL(10,5) NULL,
  checked_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY ix_rank_checks_kw (keyword_id, checked_at),
  CONSTRAINT fk_rank_checks_kw FOREIGN KEY (keyword_id) REFERENCES keywords(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE posts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(160) NOT NULL,
  title VARCHAR(200) NOT NULL,
  excerpt VARCHAR(400) NOT NULL DEFAULT '',
  content MEDIUMTEXT NOT NULL,
  cover_image VARCHAR(500) NULL,
  meta_title VARCHAR(200) NULL,
  meta_description VARCHAR(300) NULL,
  focus_keyword VARCHAR(120) NULL,
  tags VARCHAR(300) NULL,
  author_name VARCHAR(120) NOT NULL DEFAULT 'SEOKaroAI Team',
  status VARCHAR(12) NOT NULL DEFAULT 'draft',
  published_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_posts_slug (slug),
  KEY ix_posts_published (status, published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE billing_events (
  id VARCHAR(64) PRIMARY KEY,
  event_type VARCHAR(64) NOT NULL,
  occurred_at DATETIME(3) NULL,
  payload MEDIUMTEXT NOT NULL,
  processed_at DATETIME(3) NULL,
  error TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE email_log (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  to_email VARCHAR(255) NOT NULL,
  kind VARCHAR(32) NOT NULL,
  subject VARCHAR(300) NOT NULL,
  status VARCHAR(12) NOT NULL,
  error TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY ix_email_log_user (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE contact_messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(160) NULL,
  message TEXT NOT NULL,
  handled_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE admin_log (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id BIGINT UNSIGNED NOT NULL,
  action VARCHAR(64) NOT NULL,
  target VARCHAR(200) NOT NULL DEFAULT '',
  detail TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE app_kv (
  k VARCHAR(64) PRIMARY KEY,
  v TEXT NOT NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
