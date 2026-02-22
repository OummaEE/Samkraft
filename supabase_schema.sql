-- Samkraft Database Schema for Supabase (PostgreSQL)
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/YOUR_PROJECT/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table with tier-based verification
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  profile_photo_url TEXT,
  tier TEXT DEFAULT 'basic' CHECK(tier IN ('basic', 'verified', 'validated', 'personnummer')),
  impact_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW(),
  languages JSONB DEFAULT '[]'::JSONB,
  location_municipality TEXT,
  bio TEXT,
  profile_visibility TEXT DEFAULT 'public' CHECK(profile_visibility IN ('public', 'members', 'private')),
  deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_users_tier ON users(tier);
CREATE INDEX idx_users_municipality ON users(location_municipality);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mentor_id UUID REFERENCES users(id),
  municipality_id UUID,
  title TEXT NOT NULL,
  description_short TEXT,
  description_long TEXT,
  category_primary TEXT,
  category_secondary TEXT,
  location_type TEXT CHECK(location_type IN ('physical', 'hybrid', 'digital')),
  location_municipality TEXT,
  location_address TEXT,
  start_date DATE,
  end_date DATE,
  weekly_commitment TEXT,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'under_review', 'approved', 'active', 'pending_closure', 'completed', 'archived')),
  visibility TEXT DEFAULT 'public' CHECK(visibility IN ('public', 'municipality_only', 'private')),
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_municipality ON projects(location_municipality);
CREATE INDEX idx_projects_category ON projects(category_primary);
CREATE INDEX idx_projects_creator ON projects(creator_id);
CREATE INDEX idx_projects_mentor ON projects(mentor_id);

-- Project roles/positions
CREATE TABLE IF NOT EXISTS project_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  skills_required JSONB DEFAULT '[]'::JSONB,
  skills_desired JSONB DEFAULT '[]'::JSONB,
  positions_available INTEGER,
  positions_filled INTEGER DEFAULT 0,
  responsibilities TEXT
);

CREATE INDEX idx_project_roles_project ON project_roles(project_id);

-- Project participants (applications and memberships)
CREATE TABLE IF NOT EXISTS project_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES project_roles(id),
  status TEXT CHECK(status IN ('applied', 'accepted', 'active', 'completed', 'withdrawn')),
  application_text TEXT,
  hours_logged DECIMAL(10,2) DEFAULT 0,
  rating_by_creator INTEGER CHECK (rating_by_creator BETWEEN 1 AND 5),
  rating_by_participant INTEGER CHECK (rating_by_participant BETWEEN 1 AND 5),
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_participants_user ON project_participants(user_id);
CREATE INDEX idx_participants_project ON project_participants(project_id);
CREATE INDEX idx_participants_status ON project_participants(status);

-- Skills taxonomy
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  category TEXT,
  translated_names JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_skills_name ON skills(name);

-- User skills with validation
CREATE TABLE IF NOT EXISTS user_skills (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency TEXT CHECK(proficiency IN ('beginner', 'intermediate', 'advanced')),
  validated_by_mentor_id UUID REFERENCES users(id),
  validated_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, skill_id)
);

CREATE INDEX idx_user_skills_user ON user_skills(user_id);
CREATE INDEX idx_user_skills_skill ON user_skills(skill_id);

-- Certificates
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES users(id),
  certificate_hash TEXT UNIQUE NOT NULL,
  skills_validated JSONB DEFAULT '[]'::JSONB,
  hours_contributed DECIMAL(10,2),
  outcome_description TEXT,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  pdf_url TEXT
);

CREATE INDEX idx_certificates_user ON certificates(user_id);
CREATE INDEX idx_certificates_hash ON certificates(certificate_hash);
CREATE INDEX idx_certificates_project ON certificates(project_id);

-- Recommendations
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  auto_generated_text TEXT,
  custom_text TEXT,
  status TEXT CHECK(status IN ('requested', 'draft', 'completed')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_recommendations_user ON recommendations(user_id);
CREATE INDEX idx_recommendations_author ON recommendations(author_id);
CREATE INDEX idx_recommendations_status ON recommendations(status);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  subject TEXT,
  body TEXT,
  read_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  flagged BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_read ON messages(read_at);

-- Municipalities
CREATE TABLE IF NOT EXISTS municipalities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  rep_user_id UUID REFERENCES users(id),
  budget_allocated DECIMAL(12,2),
  budget_spent DECIMAL(12,2) DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_municipalities_name ON municipalities(name);

-- Activity log for impact tracking
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_data JSONB DEFAULT '{}'::JSONB,
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_log_user ON activity_log(user_id);
CREATE INDEX idx_activity_log_type ON activity_log(activity_type);
CREATE INDEX idx_activity_log_created ON activity_log(created_at);

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE municipalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Public read policies (for now - will refine in auth phase)
CREATE POLICY "Public projects are viewable by everyone" 
  ON projects FOR SELECT 
  USING (visibility = 'public' AND status = 'active');

CREATE POLICY "Public user profiles are viewable by everyone" 
  ON users FOR SELECT 
  USING (profile_visibility = 'public' AND deleted_at IS NULL);

CREATE POLICY "Skills are viewable by everyone" 
  ON skills FOR SELECT 
  USING (true);

CREATE POLICY "Municipalities are viewable by everyone" 
  ON municipalities FOR SELECT 
  USING (active = true);

CREATE POLICY "Certificates are viewable for verification" 
  ON certificates FOR SELECT 
  USING (revoked_at IS NULL);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for projects updated_at
CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON projects 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Insert seed data
-- Skills
INSERT INTO skills (id, name, category, translated_names) VALUES 
  (uuid_generate_v4(), 'Gardening', 'Environmental', '{"sv": "Trädgårdsarbete", "en": "Gardening"}'),
  (uuid_generate_v4(), 'Event Planning', 'Social', '{"sv": "Evenemangsplanering", "en": "Event Planning"}'),
  (uuid_generate_v4(), 'Teaching', 'Education', '{"sv": "Undervisning", "en": "Teaching"}'),
  (uuid_generate_v4(), 'Communication', 'Social', '{"sv": "Kommunikation", "en": "Communication"}'),
  (uuid_generate_v4(), 'Team Coordination', 'Social', '{"sv": "Teamkoordinering", "en": "Team Coordination"}'),
  (uuid_generate_v4(), 'Swedish Language', 'Languages', '{"sv": "Svenska språket", "en": "Swedish Language"}'),
  (uuid_generate_v4(), 'English Language', 'Languages', '{"sv": "Engelska språket", "en": "English Language"}'),
  (uuid_generate_v4(), 'Project Management', 'Professional', '{"sv": "Projektledning", "en": "Project Management"}'),
  (uuid_generate_v4(), 'Web Development', 'Technology', '{"sv": "Webbutveckling", "en": "Web Development"}'),
  (uuid_generate_v4(), 'Graphic Design', 'Creative', '{"sv": "Grafisk design", "en": "Graphic Design"}')
ON CONFLICT (name) DO NOTHING;

-- Municipalities
-- Municipalities — Flen och Katrineholm med omgivande orter
INSERT INTO municipalities (id, name, budget_allocated, active) VALUES
  (uuid_generate_v4(), 'Flens kommun',         200000.00, true),
  (uuid_generate_v4(), 'Katrineholms kommun',   200000.00, true),
  (uuid_generate_v4(), 'Malmköping',            0.00, true),
  (uuid_generate_v4(), 'Hällefors',             0.00, true),
  (uuid_generate_v4(), 'Sparreholm',            0.00, true),
  (uuid_generate_v4(), 'Bettna',                0.00, true),
  (uuid_generate_v4(), 'Mellösa',               0.00, true),
  (uuid_generate_v4(), 'Vadsbro',               0.00, true),
  (uuid_generate_v4(), 'Björkvik',              0.00, true),
  (uuid_generate_v4(), 'Valla',                 0.00, true),
  (uuid_generate_v4(), 'Forssjö',               0.00, true),
  (uuid_generate_v4(), 'Bie',                   0.00, true),
  (uuid_generate_v4(), 'Strångsjö',             0.00, true)
ON CONFLICT (name) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Samkraft database schema created successfully!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Configure RLS policies for authenticated users';
  RAISE NOTICE '2. Set up Supabase Auth';
  RAISE NOTICE '3. Update your app environment variables';
END $$;
