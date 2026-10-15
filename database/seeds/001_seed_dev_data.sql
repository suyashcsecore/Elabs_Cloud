-- ============================================================================
-- Cloud-Based Student Registration and Event Management System
-- Database Seed Data: 001_seed_dev_data.sql
-- Password for all seed users: Password123!
-- Bcrypt Hash (cost factor 10): $2b$10$wTf2zDkU1f0MqvZqXgqf7uQj32aU3ZtEre6t.6LhR49m6hB0oW9iK
-- ============================================================================

-- Clean up existing data in reverse dependency order
DELETE FROM registrations;
DELETE FROM events;
DELETE FROM users;

-- 1. Insert Base Users (1 Admin, 2 Organizers, 3 Students)
INSERT INTO users (id, name, email, password_hash, role, status) VALUES
('a0000000-0000-0000-0000-000000000001', 'System Administrator', 'admin@elabs.edu', '$2b$10$wTf2zDkU1f0MqvZqXgqf7uQj32aU3ZtEre6t.6LhR49m6hB0oW9iK', 'ADMIN', 'ACTIVE'),
('b0000000-0000-0000-0000-000000000001', 'Cloud Society Lead', 'cloud.organizer@elabs.edu', '$2b$10$wTf2zDkU1f0MqvZqXgqf7uQj32aU3ZtEre6t.6LhR49m6hB0oW9iK', 'ORGANIZER', 'ACTIVE'),
('b0000000-0000-0000-0000-000000000002', 'Coding Club Lead', 'coding.organizer@elabs.edu', '$2b$10$wTf2zDkU1f0MqvZqXgqf7uQj32aU3ZtEre6t.6LhR49m6hB0oW9iK', 'ORGANIZER', 'ACTIVE'),
('c0000000-0000-0000-0000-000000000001', 'Aarav Sharma', 'aarav.student@elabs.edu', '$2b$10$wTf2zDkU1f0MqvZqXgqf7uQj32aU3ZtEre6t.6LhR49m6hB0oW9iK', 'STUDENT', 'ACTIVE'),
('c0000000-0000-0000-0000-000000000002', 'Priya Patel', 'priya.student@elabs.edu', '$2b$10$wTf2zDkU1f0MqvZqXgqf7uQj32aU3ZtEre6t.6LhR49m6hB0oW9iK', 'STUDENT', 'ACTIVE'),
('c0000000-0000-0000-0000-000000000003', 'Rohan Gupta', 'rohan.student@elabs.edu', '$2b$10$wTf2zDkU1f0MqvZqXgqf7uQj32aU3ZtEre6t.6LhR49m6hB0oW9iK', 'STUDENT', 'ACTIVE');

-- 2. Insert Sample Events
INSERT INTO events (id, title, description, category, start_at, end_at, location, capacity, registration_deadline, status, organizer_id) VALUES
(
    'e0000000-0000-0000-0000-000000000001',
    'Hands-on AWS Cloud Architecture Workshop',
    'Deep dive into building fault-tolerant scalable microservices with AWS App Runner, RDS PostgreSQL, and VPC security.',
    'Workshop',
    NOW() + INTERVAL '7 days',
    NOW() + INTERVAL '7 days 4 hours',
    'Auditorium Campus 6 / Virtual Stream',
    50,
    NOW() + INTERVAL '5 days',
    'PUBLISHED',
    'b0000000-0000-0000-0000-000000000001'
),
(
    'e0000000-0000-0000-0000-000000000002',
    'Annual Inter-College Hackathon 2026',
    '36-hour endurance hackathon solving real-world challenges across AI, Cloud, and Cybersecurity with industry mentors.',
    'Hackathon',
    NOW() + INTERVAL '14 days',
    NOW() + INTERVAL '16 days',
    'Tech Park Innovation Hall',
    100,
    NOW() + INTERVAL '10 days',
    'PUBLISHED',
    'b0000000-0000-0000-0000-000000000002'
),
(
    'e0000000-0000-0000-0000-000000000003',
    'DevOps CI/CD Masterclass',
    'Master automated pipelines with GitHub Actions, Docker containers, and zero-downtime blue-green deployments.',
    'Seminar',
    NOW() + INTERVAL '3 days',
    NOW() + INTERVAL '3 days 2 hours',
    'Seminar Hall 2',
    2, -- Small capacity to test seat filling
    NOW() + INTERVAL '2 days',
    'PUBLISHED',
    'b0000000-0000-0000-0000-000000000001'
),
(
    'e0000000-0000-0000-0000-000000000004',
    'Web Security & Ethical Hacking Workshop (Draft)',
    'OWASP Top 10 vulnerabilities, penetration testing tools, and secure coding practices.',
    'Workshop',
    NOW() + INTERVAL '20 days',
    NOW() + INTERVAL '20 days 3 hours',
    'Lab 3',
    30,
    NOW() + INTERVAL '18 days',
    'DRAFT',
    'b0000000-0000-0000-0000-000000000002'
);

-- 3. Insert Initial Active Registrations
INSERT INTO registrations (id, student_id, event_id, status, registered_at) VALUES
('f0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'ACTIVE', NOW() - INTERVAL '1 day'),
('f0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'ACTIVE', NOW() - INTERVAL '12 hours'),
('f0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000003', 'ACTIVE', NOW() - INTERVAL '2 hours');
