-- Drop existing tables (in correct order to handle foreign key constraints)
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS employers CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS stripe_orders CASCADE;
DROP TABLE IF EXISTS stripe_subscriptions CASCADE;
DROP TABLE IF EXISTS stripe_customers CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS stripe_subscription_status CASCADE;
DROP TYPE IF EXISTS stripe_order_status CASCADE;
DROP TYPE IF EXISTS job_category CASCADE;

-- Create custom types
CREATE TYPE stripe_subscription_status AS ENUM (
  'not_started',
  'incomplete',
  'incomplete_expired',
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'paused'
);

CREATE TYPE stripe_order_status AS ENUM (
  'pending',
  'completed',
  'canceled'
);

CREATE TYPE job_category AS ENUM (
  'AI Research',
  'Machine Learning Engineering',
  'Data Science',
  'Computer Vision',
  'Natural Language Processing',
  'Robotics',
  'Deep Learning',
  'MLOps',
  'AI Product Management',
  'AI Ethics & Safety'
);

-- Create employers table
CREATE TABLE employers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  company_name text NOT NULL,
  company_website text,
  contact_person text NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create jobs table with all necessary fields
CREATE TABLE jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  company_name text NOT NULL,
  company_website text,
  location text NOT NULL,
  salary_min integer,
  salary_max integer,
  salary_currency text DEFAULT 'AUD',
  job_type text NOT NULL DEFAULT 'full_time',
  is_remote boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  is_filled boolean DEFAULT false,
  contact_email text,
  contact_phone text,
  apply_url text,
  requirements jsonb DEFAULT '[]'::jsonb,
  benefits jsonb DEFAULT '[]'::jsonb,
  tags jsonb DEFAULT '[]'::jsonb,
  categories jsonb DEFAULT '[]'::jsonb,
  applications_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 days')
);

-- Create payments table
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  stripe_payment_intent_id text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Create stripe_customers table
CREATE TABLE stripe_customers (
  id bigserial PRIMARY KEY,
  user_id uuid UNIQUE NOT NULL,
  customer_id text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Create stripe_subscriptions table
CREATE TABLE stripe_subscriptions (
  id bigserial PRIMARY KEY,
  customer_id text UNIQUE NOT NULL,
  subscription_id text,
  price_id text,
  current_period_start bigint,
  current_period_end bigint,
  cancel_at_period_end boolean DEFAULT false,
  payment_method_brand text,
  payment_method_last4 text,
  status stripe_subscription_status NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Create stripe_orders table
CREATE TABLE stripe_orders (
  id bigserial PRIMARY KEY,
  checkout_session_id text NOT NULL,
  payment_intent_id text NOT NULL,
  customer_id text NOT NULL,
  amount_subtotal bigint NOT NULL,
  amount_total bigint NOT NULL,
  currency text NOT NULL,
  payment_status text NOT NULL,
  status stripe_order_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Create admin_users table
CREATE TABLE admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  is_super_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_jobs_employer_id ON jobs(employer_id);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX idx_jobs_expires_at ON jobs(expires_at);
CREATE INDEX idx_jobs_is_featured ON jobs(is_featured);
CREATE INDEX idx_jobs_is_filled ON jobs(is_filled);
CREATE INDEX idx_jobs_job_type ON jobs(job_type);
CREATE INDEX idx_jobs_location ON jobs(location);
CREATE INDEX idx_jobs_active ON jobs(is_filled, expires_at) WHERE NOT is_filled;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_employers_updated_at 
  BEFORE UPDATE ON employers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at 
  BEFORE UPDATE ON jobs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE employers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for employers
CREATE POLICY "employers_manage_own" ON employers
  FOR ALL TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "employers_service_role" ON employers
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for jobs
CREATE POLICY "jobs_public_read" ON jobs
  FOR SELECT TO anon, authenticated
  USING (NOT is_filled AND expires_at > now());

CREATE POLICY "jobs_employer_manage" ON jobs
  FOR ALL TO authenticated
  USING (employer_id = auth.uid())
  WITH CHECK (employer_id = auth.uid());

CREATE POLICY "jobs_admin_manage" ON jobs
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM admin_users WHERE user_id = auth.uid()))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "jobs_service_role" ON jobs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for payments
CREATE POLICY "payments_employer_manage" ON payments
  FOR ALL TO authenticated
  USING (employer_id = auth.uid())
  WITH CHECK (employer_id = auth.uid());

CREATE POLICY "payments_service_role" ON payments
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for stripe_customers
CREATE POLICY "stripe_customers_own" ON stripe_customers
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "stripe_customers_service_role" ON stripe_customers
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for stripe_subscriptions
CREATE POLICY "stripe_subscriptions_own" ON stripe_subscriptions
  FOR SELECT TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id FROM stripe_customers 
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    ) AND deleted_at IS NULL
  );

CREATE POLICY "stripe_subscriptions_service" ON stripe_subscriptions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for stripe_orders
CREATE POLICY "stripe_orders_own" ON stripe_orders
  FOR SELECT TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id FROM stripe_customers 
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    ) AND deleted_at IS NULL
  );

CREATE POLICY "stripe_orders_service" ON stripe_orders
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for admin_users
CREATE POLICY "admin_users_own" ON admin_users
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "admin_users_service" ON admin_users
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Create view for user subscriptions
CREATE VIEW stripe_user_subscriptions AS
SELECT 
  sc.customer_id,
  ss.subscription_id,
  ss.status as subscription_status,
  ss.price_id,
  ss.current_period_start,
  ss.current_period_end,
  ss.cancel_at_period_end,
  ss.payment_method_brand,
  ss.payment_method_last4
FROM stripe_customers sc
LEFT JOIN stripe_subscriptions ss ON sc.customer_id = ss.customer_id
WHERE sc.deleted_at IS NULL AND (ss.deleted_at IS NULL OR ss.deleted_at IS NULL);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Insert some sample data (optional)
-- You can uncomment this if you want some test data
/*
INSERT INTO employers (id, email, company_name, contact_person) VALUES
('d54432f2-215a-4052-bab8-7f90099147c3', 'test@example.com', 'Test Company', 'Test User');

INSERT INTO jobs (employer_id, title, description, company_name, location, job_type, salary_min, salary_max) VALUES
('d54432f2-215a-4052-bab8-7f90099147c3', 'Senior AI Engineer', 'We are looking for a Senior AI Engineer...', 'Test Company', 'San Francisco, CA', 'full_time', 120000, 180000);
*/