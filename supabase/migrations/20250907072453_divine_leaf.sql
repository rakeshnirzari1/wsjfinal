-- Complete cleanup and superadmin setup SQL
-- Run this in your Supabase SQL Editor

-- 1. Clean up all existing data
DELETE FROM payments;
DELETE FROM jobs;
DELETE FROM employers;
DELETE FROM admin_users;
DELETE FROM stripe_orders;
DELETE FROM stripe_subscriptions;
DELETE FROM stripe_customers;

-- 2. Clean up Supabase Auth users (this removes cached authentication)
-- Note: This requires service_role permissions
DELETE FROM auth.users;

-- 3. Reset identity sequences (optional, for clean IDs)
ALTER SEQUENCE IF EXISTS stripe_customers_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS stripe_subscriptions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS stripe_orders_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS admin_users_id_seq RESTART WITH 1;

-- 4. Create the superadmin user in auth.users
-- This creates the user account that can be used to login
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'rvpnrp@gmail.com',
  crypt('nirzari1', gen_salt('bf')),
  NOW(),
  NOW(),
  '',
  NOW(),
  '',
  NULL,
  '',
  '',
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Super Admin"}',
  false,
  NOW(),
  NOW(),
  NULL,
  NULL,
  '',
  '',
  NULL,
  '',
  0,
  NULL,
  '',
  NULL
);

-- 5. Get the user ID for the superadmin (we'll need this for the next steps)
-- Create employer record for the superadmin
INSERT INTO employers (
  id,
  email,
  company_name,
  contact_person,
  phone,
  created_at,
  updated_at
) 
SELECT 
  id,
  'rvpnrp@gmail.com',
  'AI Jobs Admin',
  'Super Admin',
  NULL,
  NOW(),
  NOW()
FROM auth.users 
WHERE email = 'rvpnrp@gmail.com';

-- 6. Create admin_users record to make this user a superadmin
INSERT INTO admin_users (
  user_id,
  email,
  is_super_admin,
  created_at,
  updated_at
)
SELECT 
  id,
  'rvpnrp@gmail.com',
  true,
  NOW(),
  NOW()
FROM auth.users 
WHERE email = 'rvpnrp@gmail.com';

-- 7. Verify the setup
SELECT 
  u.id,
  u.email,
  u.created_at as user_created,
  e.company_name,
  a.is_super_admin
FROM auth.users u
LEFT JOIN employers e ON u.id = e.id
LEFT JOIN admin_users a ON u.id = a.user_id
WHERE u.email = 'rvpnrp@gmail.com';

-- 8. Optional: Add some sample data for testing
-- Uncomment the lines below if you want some test data

/*
-- Sample employer
INSERT INTO employers (id, email, company_name, contact_person, created_at, updated_at)
VALUES (gen_random_uuid(), 'test@company.com', 'Test Company', 'Test User', NOW(), NOW());

-- Sample job (replace employer_id with actual ID from above)
INSERT INTO jobs (
  employer_id,
  title,
  description,
  company_name,
  location,
  salary_min,
  salary_max,
  salary_currency,
  job_type,
  is_featured,
  contact_email,
  requirements,
  benefits,
  tags,
  categories,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM employers WHERE email = 'test@company.com'),
  'Senior AI Engineer',
  'We are looking for a Senior AI Engineer to join our team.',
  'Test Company',
  'San Francisco, CA',
  120000,
  180000,
  'USD',
  'full_time',
  false,
  'jobs@company.com',
  ARRAY['5+ years experience', 'Python expertise', 'Machine Learning knowledge'],
  ARRAY['Health insurance', 'Remote work', 'Stock options'],
  ARRAY['AI', 'Python', 'Machine Learning'],
  ARRAY['AI Research', 'Machine Learning Engineering'],
  NOW(),
  NOW()
);
*/

-- Success message
SELECT 'Database cleaned and superadmin account created successfully!' as status;