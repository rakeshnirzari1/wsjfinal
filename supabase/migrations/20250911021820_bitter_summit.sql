/*
  # Add company logo support and click tracking

  1. Schema Changes
    - Add `company_logo` column to `employers` table
    - Add `views_count` column to `jobs` table (rename from applications_count)
    - Create storage bucket for company logos

  2. Storage
    - Create `company-logos` storage bucket
    - Set up RLS policies for logo uploads

  3. Functions
    - Create function to increment job views
*/

-- Add company_logo column to employers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employers' AND column_name = 'company_logo'
  ) THEN
    ALTER TABLE employers ADD COLUMN company_logo text;
  END IF;
END $$;

-- Rename applications_count to views_count for better clarity
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'applications_count'
  ) THEN
    ALTER TABLE jobs RENAME COLUMN applications_count TO views_count;
  END IF;
END $$;

-- Ensure views_count has proper default
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'views_count'
  ) THEN
    ALTER TABLE jobs ADD COLUMN views_count integer DEFAULT 0;
  END IF;
END $$;

-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for company logos storage
CREATE POLICY "Authenticated users can upload company logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-logos');

CREATE POLICY "Anyone can view company logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'company-logos');

CREATE POLICY "Users can update their own company logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own company logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to increment job views
CREATE OR REPLACE FUNCTION increment_job_views(job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE jobs 
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = job_id;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION increment_job_views(uuid) TO anon, authenticated;