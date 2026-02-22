-- Seed data for Samkraft platform (PostgreSQL / Supabase)

-- Insert basic skills
INSERT INTO skills (id, name, category, translated_names) VALUES
  (gen_random_uuid(), 'Gardening', 'Environmental', '{"sv": "Trädgårdsarbete", "en": "Gardening"}'),
  (gen_random_uuid(), 'Event Planning', 'Social', '{"sv": "Evenemangsplanering", "en": "Event Planning"}'),
  (gen_random_uuid(), 'Teaching', 'Education', '{"sv": "Undervisning", "en": "Teaching"}'),
  (gen_random_uuid(), 'Communication', 'Social', '{"sv": "Kommunikation", "en": "Communication"}'),
  (gen_random_uuid(), 'Team Coordination', 'Social', '{"sv": "Teamkoordinering", "en": "Team Coordination"}'),
  (gen_random_uuid(), 'Swedish Language', 'Languages', '{"sv": "Svenska språket", "en": "Swedish Language"}'),
  (gen_random_uuid(), 'English Language', 'Languages', '{"sv": "Engelska språket", "en": "English Language"}'),
  (gen_random_uuid(), 'Project Management', 'Professional', '{"sv": "Projektledning", "en": "Project Management"}'),
  (gen_random_uuid(), 'Web Development', 'Technology', '{"sv": "Webbutveckling", "en": "Web Development"}'),
  (gen_random_uuid(), 'Graphic Design', 'Creative', '{"sv": "Grafisk design", "en": "Graphic Design"}')
ON CONFLICT (name) DO NOTHING;

-- Insert municipalities (Flen & Katrineholm med omgivande orter)
INSERT INTO municipalities (id, name, budget_allocated, active) VALUES
  (gen_random_uuid(), 'Flens kommun',         200000.00, true),
  (gen_random_uuid(), 'Katrineholms kommun',   200000.00, true),
  (gen_random_uuid(), 'Malmköping',            0.00, true),
  (gen_random_uuid(), 'Hälleforsnäs',          0.00, true),
  (gen_random_uuid(), 'Sparreholm',            0.00, true),
  (gen_random_uuid(), 'Bettna',                0.00, true),
  (gen_random_uuid(), 'Mellösa',               0.00, true),
  (gen_random_uuid(), 'Vadsbro',               0.00, true),
  (gen_random_uuid(), 'Björkvik',              0.00, true),
  (gen_random_uuid(), 'Valla',                 0.00, true),
  (gen_random_uuid(), 'Forssjö',               0.00, true),
  (gen_random_uuid(), 'Bie',                   0.00, true),
  (gen_random_uuid(), 'Strångsjö',             0.00, true)
ON CONFLICT (name) DO NOTHING;
