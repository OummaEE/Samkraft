-- Initial database schema for Samkraft platform
-- Users table with tier-based verification system

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  profile_photo_url TEXT,
  tier TEXT DEFAULT 'basic' CHECK(tier IN ('basic', 'verified', 'validated', 'personnummer')),
  impact_score INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  last_active TEXT DEFAULT (datetime('now')),
  languages TEXT, -- JSON array: ['sv', 'en', 'ar']
  location_municipality TEXT,
  bio TEXT,
  profile_visibility TEXT DEFAULT 'public' CHECK(profile_visibility IN ('public', 'members', 'private')),
  deleted_at TEXT NULL
);

CREATE INDEX idx_users_tier ON users(tier);
CREATE INDEX idx_users_municipality ON users(location_municipality);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL,
  mentor_id TEXT,
  municipality_id TEXT,
  title TEXT NOT NULL,
  description_short TEXT,
  description_long TEXT,
  category_primary TEXT,
  category_secondary TEXT,
  location_type TEXT CHECK(location_type IN ('physical', 'hybrid', 'digital')),
  location_municipality TEXT,
  location_address TEXT,
  start_date TEXT,
  end_date TEXT,
  weekly_commitment TEXT,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'under_review', 'approved', 'active', 'pending_closure', 'completed', 'archived')),
  visibility TEXT DEFAULT 'public' CHECK(visibility IN ('public', 'municipality_only', 'private')),
  featured INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (creator_id) REFERENCES users(id),
  FOREIGN KEY (mentor_id) REFERENCES users(id)
);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_municipality ON projects(location_municipality);
CREATE INDEX idx_projects_category ON projects(category_primary);
CREATE INDEX idx_projects_creator ON projects(creator_id);
CREATE INDEX idx_projects_mentor ON projects(mentor_id);

-- Project roles/positions
CREATE TABLE IF NOT EXISTS project_roles (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  skills_required TEXT, -- JSON array
  skills_desired TEXT, -- JSON array
  positions_available INTEGER,
  positions_filled INTEGER DEFAULT 0,
  responsibilities TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_project_roles_project ON project_roles(project_id);

-- Project participants (applications and memberships)
CREATE TABLE IF NOT EXISTS project_participants (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role_id TEXT,
  status TEXT CHECK(status IN ('applied', 'accepted', 'active', 'completed', 'withdrawn')),
  application_text TEXT,
  hours_logged REAL DEFAULT 0,
  rating_by_creator INTEGER CHECK (rating_by_creator BETWEEN 1 AND 5),
  rating_by_participant INTEGER CHECK (rating_by_participant BETWEEN 1 AND 5),
  applied_at TEXT DEFAULT (datetime('now')),
  accepted_at TEXT,
  completed_at TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (role_id) REFERENCES project_roles(id)
);

CREATE INDEX idx_participants_user ON project_participants(user_id);
CREATE INDEX idx_participants_project ON project_participants(project_id);
CREATE INDEX idx_participants_status ON project_participants(status);

-- Skills taxonomy
CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  category TEXT,
  translated_names TEXT -- JSON object: {'sv': 'trädgårdsarbete', 'en': 'gardening'}
);

CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_skills_name ON skills(name);

-- User skills with validation
CREATE TABLE IF NOT EXISTS user_skills (
  user_id TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  proficiency TEXT CHECK(proficiency IN ('beginner', 'intermediate', 'advanced')),
  validated_by_mentor_id TEXT,
  validated_at TEXT,
  PRIMARY KEY (user_id, skill_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id),
  FOREIGN KEY (validated_by_mentor_id) REFERENCES users(id)
);

CREATE INDEX idx_user_skills_user ON user_skills(user_id);
CREATE INDEX idx_user_skills_skill ON user_skills(skill_id);

-- Certificates
CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  mentor_id TEXT NOT NULL,
  certificate_hash TEXT UNIQUE NOT NULL,
  skills_validated TEXT, -- JSON array
  hours_contributed REAL,
  outcome_description TEXT,
  issued_at TEXT DEFAULT (datetime('now')),
  revoked_at TEXT,
  pdf_url TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (mentor_id) REFERENCES users(id)
);

CREATE INDEX idx_certificates_user ON certificates(user_id);
CREATE INDEX idx_certificates_hash ON certificates(certificate_hash);
CREATE INDEX idx_certificates_project ON certificates(project_id);

-- Recommendations
CREATE TABLE IF NOT EXISTS recommendations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  auto_generated_text TEXT,
  custom_text TEXT,
  status TEXT CHECK(status IN ('requested', 'draft', 'completed')),
  requested_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (author_id) REFERENCES users(id),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE INDEX idx_recommendations_user ON recommendations(user_id);
CREATE INDEX idx_recommendations_author ON recommendations(author_id);
CREATE INDEX idx_recommendations_status ON recommendations(status);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  project_id TEXT,
  subject TEXT,
  body TEXT,
  read_at TEXT,
  sent_at TEXT DEFAULT (datetime('now')),
  flagged INTEGER DEFAULT 0,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (recipient_id) REFERENCES users(id),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_read ON messages(read_at);

-- Municipalities
CREATE TABLE IF NOT EXISTS municipalities (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  rep_user_id TEXT,
  budget_allocated REAL,
  budget_spent REAL DEFAULT 0,
  active INTEGER DEFAULT 1,
  joined_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (rep_user_id) REFERENCES users(id)
);

CREATE INDEX idx_municipalities_name ON municipalities(name);

-- Activity log for impact tracking
CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  activity_data TEXT, -- JSON
  points_awarded INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_activity_log_user ON activity_log(user_id);
CREATE INDEX idx_activity_log_type ON activity_log(activity_type);
CREATE INDEX idx_activity_log_created ON activity_log(created_at);
