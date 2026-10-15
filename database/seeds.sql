-- ============================================================================
-- Cloud Student Registration System - Seed Data
-- Location: database/seeds.sql
-- 
-- PLAIN PASSWORDS:
-- All users share the password: Password123!
-- Verified Bcrypt Hash: $2b$10$NVqvQYG.9khWdkvyACYeFO0w8LknFWZ5w7Y.AOT/gCssB1rS0dtie
-- ============================================================================

-- Clean up existing data
DELETE FROM registrations;
DELETE FROM events;
DELETE FROM users;

-- ----------------------------------------------------------------------------
-- 1. Insert Users: 1 Admin, 2 Organizers, 10 Students
-- ----------------------------------------------------------------------------

-- Admin
INSERT INTO users (id, name, email, password_hash, role, status) VALUES
('a0000000-0000-0000-0000-000000000001', 'System Administrator', 'admin@elabs.edu', '$2b$10$NVqvQYG.9khWdkvyACYeFO0w8LknFWZ5w7Y.AOT/gCssB1rS0dtie', 'ADMIN', 'ACTIVE');

-- 2 Organizers
INSERT INTO users (id, name, email, password_hash, role, status) VALUES
('b0000000-0000-0000-0000-000000000001', 'Prof. Sarah Jenkins (Cloud Lead)', 'sarah.organizer@elabs.edu', '$2b$10$NVqvQYG.9khWdkvyACYeFO0w8LknFWZ5w7Y.AOT/gCssB1rS0dtie', 'ORGANIZER', 'ACTIVE'),
('b0000000-0000-0000-0000-000000000002', 'Dr. Rajesh Verma (Coding Society)', 'rajesh.organizer@elabs.edu', '$2b$10$NVqvQYG.9khWdkvyACYeFO0w8LknFWZ5w7Y.AOT/gCssB1rS0dtie', 'ORGANIZER', 'ACTIVE');

-- 10 Students
INSERT INTO users (id, name, email, password_hash, role, status) VALUES
('c0000000-0000-0000-0000-000000000001', 'Aarav Sharma', 'aarav.sharma@elabs.edu', '$2b$10$NVqvQYG.9khWdkvyACYeFO0w8LknFWZ5w7Y.AOT/gCssB1rS0dtie', 'STUDENT', 'ACTIVE'),
('c0000000-0000-0000-0000-000000000002', 'Priya Patel', 'priya.patel@elabs.edu', '$2b$10$NVqvQYG.9khWdkvyACYeFO0w8LknFWZ5w7Y.AOT/gCssB1rS0dtie', 'STUDENT', 'ACTIVE'),
('c0000000-0000-0000-0000-000000000003', 'Rohan Gupta', 'rohan.gupta@elabs.edu', '$2b$10$NVqvQYG.9khWdkvyACYeFO0w8LknFWZ5w7Y.AOT/gCssB1rS0dtie', 'STUDENT', 'ACTIVE'),
('c0000000-0000-0000-0000-000000000004', 'Ananya Iyer', 'ananya.iyer@elabs.edu', '$2b$10$NVqvQYG.9khWdkvyACYeFO0w8LknFWZ5w7Y.AOT/gCssB1rS0dtie', 'STUDENT', 'ACTIVE'),
('c0000000-0000-0000-0000-000000000005', 'Vikram Malhotra', 'vikram.malhotra@elabs.edu', '$2b$10$NVqvQYG.9khWdkvyACYeFO0w8LknFWZ5w7Y.AOT/gCssB1rS0dtie', 'STUDENT', 'ACTIVE'),
('c0000000-0000-0000-0000-000000000006', 'Sneha Reddy', 'sneha.reddy@elabs.edu', '$2b$10$NVqvQYG.9khWdkvyACYeFO0w8LknFWZ5w7Y.AOT/gCssB1rS0dtie', 'STUDENT', 'ACTIVE'),
('c0000000-0000-0000-0000-000000000007', 'Kabir Das', 'kabir.das@elabs.edu', '$2b$10$NVqvQYG.9khWdkvyACYeFO0w8LknFWZ5w7Y.AOT/gCssB1rS0dtie', 'STUDENT', 'ACTIVE'),
('c0000000-0000-0000-0000-000000000008', 'Ishita Sen', 'ishita.sen@elabs.edu', '$2b$10$NVqvQYG.9khWdkvyACYeFO0w8LknFWZ5w7Y.AOT/gCssB1rS0dtie', 'STUDENT', 'ACTIVE'),
('c0000000-0000-0000-0000-000000000009', 'Aditya Joshi', 'aditya.joshi@elabs.edu', '$2b$10$NVqvQYG.9khWdkvyACYeFO0w8LknFWZ5w7Y.AOT/gCssB1rS0dtie', 'STUDENT', 'ACTIVE'),
('c0000000-0000-0000-0000-000000000010', 'Neha Singhania', 'neha.singhania@elabs.edu', '$2b$10$NVqvQYG.9khWdkvyACYeFO0w8LknFWZ5w7Y.AOT/gCssB1rS0dtie', 'STUDENT', 'ACTIVE');

-- ----------------------------------------------------------------------------
-- 2. Insert 8 Realistic Events (Mix of categories, DRAFT, PUBLISHED, Capacity 1)
-- ----------------------------------------------------------------------------

-- Event 1: Workshop (PUBLISHED)
INSERT INTO events (id, title, description, category, start_at, end_at, location, capacity, registration_deadline, status, organizer_id) VALUES
(
    'e0000000-0000-0000-0000-000000000001',
    'Hands-on AWS Serverless Microservices',
    'Learn how to build production-grade serverless APIs using AWS Lambda, API Gateway, DynamoDB, and CloudWatch logs.',
    'Workshop',
    NOW() + INTERVAL '7 days',
    NOW() + INTERVAL '7 days 4 hours',
    'Auditorium Campus 6',
    60,
    NOW() + INTERVAL '5 days',
    'PUBLISHED',
    'b0000000-0000-0000-0000-000000000001'
);

-- Event 2: Hackathon (PUBLISHED)
INSERT INTO events (id, title, description, category, start_at, end_at, location, capacity, registration_deadline, status, organizer_id) VALUES
(
    'e0000000-0000-0000-0000-000000000002',
    'AI & Cloud Innovation Hackathon 2026',
    '36-hour sprint solving healthcare, sustainability, and fintech challenges with cloud computing and modern generative AI models.',
    'Hackathon',
    NOW() + INTERVAL '14 days',
    NOW() + INTERVAL '16 days',
    'Tech Park Innovation Hub',
    100,
    NOW() + INTERVAL '10 days',
    'PUBLISHED',
    'b0000000-0000-0000-0000-000000000002'
);

-- Event 3: Seminar - CAPACITY 1 (Special seat competition test event) (PUBLISHED)
INSERT INTO events (id, title, description, category, start_at, end_at, location, capacity, registration_deadline, status, organizer_id) VALUES
(
    'e0000000-0000-0000-0000-000000000003',
    'Exclusive CTO Roundtable & Mentorship',
    'Exclusive 1-on-1 career strategy session with industry CTO. Strictly limited to 1 student for direct mentorship.',
    'Seminar',
    NOW() + INTERVAL '4 days',
    NOW() + INTERVAL '4 days 2 hours',
    'Executive Boardroom Campus 1',
    1, -- EXACT CAPACITY 1 AS REQUESTED
    NOW() + INTERVAL '3 days',
    'PUBLISHED',
    'b0000000-0000-0000-0000-000000000001'
);

-- Event 4: Workshop (PUBLISHED)
INSERT INTO events (id, title, description, category, start_at, end_at, location, capacity, registration_deadline, status, organizer_id) VALUES
(
    'e0000000-0000-0000-0000-000000000004',
    'Docker & Kubernetes Containerization Bootcamp',
    'From Dockerfiles to multi-node Kubernetes clusters with Helm charts and zero-downtime rolling updates.',
    'Workshop',
    NOW() + INTERVAL '9 days',
    NOW() + INTERVAL '9 days 6 hours',
    'Computer Science Lab 4',
    40,
    NOW() + INTERVAL '7 days',
    'PUBLISHED',
    'b0000000-0000-0000-0000-000000000002'
);

-- Event 5: Seminar (PUBLISHED)
INSERT INTO events (id, title, description, category, start_at, end_at, location, capacity, registration_deadline, status, organizer_id) VALUES
(
    'e0000000-0000-0000-0000-000000000005',
    'Cybersecurity & Zero Trust Architecture',
    'Analysis of modern threats, penetration testing fundamentals, and zero-trust perimeter defense in cloud enterprise environments.',
    'Seminar',
    NOW() + INTERVAL '12 days',
    NOW() + INTERVAL '12 days 3 hours',
    'Virtual Stream / Seminar Hall 2',
    150,
    NOW() + INTERVAL '11 days',
    'PUBLISHED',
    'b0000000-0000-0000-0000-000000000001'
);

-- Event 6: Webinar (PUBLISHED)
INSERT INTO events (id, title, description, category, start_at, end_at, location, capacity, registration_deadline, status, organizer_id) VALUES
(
    'e0000000-0000-0000-0000-000000000006',
    'Full-Stack System Design: From Monolith to Distributed',
    'Scalability patterns, load balancing, message queues (Kafka/RabbitMQ), and database sharding under heavy read-write loads.',
    'Webinar',
    NOW() + INTERVAL '18 days',
    NOW() + INTERVAL '18 days 2 hours',
    'Zoom Live Stream',
    300,
    NOW() + INTERVAL '17 days',
    'PUBLISHED',
    'b0000000-0000-0000-0000-000000000002'
);

-- Event 7: Workshop (DRAFT)
INSERT INTO events (id, title, description, category, start_at, end_at, location, capacity, registration_deadline, status, organizer_id) VALUES
(
    'e0000000-0000-0000-0000-000000000007',
    'NextGen Blockchain & Smart Contract Development (Upcoming)',
    'Writing, testing, and deploying EVM smart contracts with Foundry and Solidity. Currently awaiting syllabus approval.',
    'Workshop',
    NOW() + INTERVAL '25 days',
    NOW() + INTERVAL '25 days 5 hours',
    'Campus 3 Lab 1',
    35,
    NOW() + INTERVAL '22 days',
    'DRAFT',
    'b0000000-0000-0000-0000-000000000001'
);

-- Event 8: Hackathon (DRAFT)
INSERT INTO events (id, title, description, category, start_at, end_at, location, capacity, registration_deadline, status, organizer_id) VALUES
(
    'e0000000-0000-0000-0000-000000000008',
    'Spring Game Dev Jam 2026 (Internal Review)',
    '48-hour game design and programming competition using Godot and Unity engines. Draft rules and sponsor guidelines.',
    'Hackathon',
    NOW() + INTERVAL '30 days',
    NOW() + INTERVAL '32 days',
    'Multimedia Lab Campus 6',
    50,
    NOW() + INTERVAL '28 days',
    'DRAFT',
    'b0000000-0000-0000-0000-000000000002'
);

-- ----------------------------------------------------------------------------
-- 3. Sample Initial Bookings
-- ----------------------------------------------------------------------------
INSERT INTO registrations (id, student_id, event_id, status, created_at) VALUES
('f0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'ACTIVE', NOW() - INTERVAL '1 day'),
('f0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'ACTIVE', NOW() - INTERVAL '12 hours'),
('f0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000002', 'ACTIVE', NOW() - INTERVAL '5 hours');
