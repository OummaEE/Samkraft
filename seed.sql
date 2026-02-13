-- Seed data for Samkraft platform

-- Insert basic skills
INSERT OR IGNORE INTO skills (id, name, category, translated_names) VALUES 
  ('skill_001', 'Gardening', 'Environmental', '{"sv": "Trädgårdsarbete", "en": "Gardening"}'),
  ('skill_002', 'Event Planning', 'Social', '{"sv": "Evenemangsplanering", "en": "Event Planning"}'),
  ('skill_003', 'Teaching', 'Education', '{"sv": "Undervisning", "en": "Teaching"}'),
  ('skill_004', 'Communication', 'Social', '{"sv": "Kommunikation", "en": "Communication"}'),
  ('skill_005', 'Team Coordination', 'Social', '{"sv": "Teamkoordinering", "en": "Team Coordination"}'),
  ('skill_006', 'Swedish Language', 'Languages', '{"sv": "Svenska språket", "en": "Swedish Language"}'),
  ('skill_007', 'English Language', 'Languages', '{"sv": "Engelska språket", "en": "English Language"}'),
  ('skill_008', 'Project Management', 'Professional', '{"sv": "Projektledning", "en": "Project Management"}'),
  ('skill_009', 'Web Development', 'Technology', '{"sv": "Webbutveckling", "en": "Web Development"}'),
  ('skill_010', 'Graphic Design', 'Creative', '{"sv": "Grafisk design", "en": "Graphic Design"}');

-- Insert municipalities
INSERT OR IGNORE INTO municipalities (id, name, budget_allocated, active) VALUES 
  ('muni_001', 'Stockholms kommun', 500000.00, 1),
  ('muni_002', 'Göteborgs kommun', 300000.00, 1),
  ('muni_003', 'Malmö kommun', 250000.00, 1);

-- Insert demo users (passwords are bcrypt hashes of 'password123')
INSERT OR IGNORE INTO users (id, email, username, password_hash, first_name, last_name, tier, location_municipality, languages, bio) VALUES 
  ('user_001', 'admin@samkraft.se', 'admin', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIKVWvRE.e', 'Admin', 'User', 'validated', 'Stockholms kommun', '["sv", "en"]', 'Platform administrator'),
  ('user_002', 'mentor@example.com', 'mentor_anna', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIKVWvRE.e', 'Anna', 'Andersson', 'validated', 'Stockholms kommun', '["sv", "en"]', 'Experienced mentor helping newcomers integrate'),
  ('user_003', 'participant@example.com', 'new_participant', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIKVWvRE.e', 'Ahmed', 'K', 'verified', 'Stockholms kommun', '["ar", "en"]', 'Looking forward to contributing to the community');
