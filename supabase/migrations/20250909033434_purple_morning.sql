/*
  # Add company_logo column to jobs table

  1. Changes
    - Add `company_logo` column to `jobs` table to store company logo URLs
    - Column is optional (nullable) and stores text URLs

  2. Notes
    - This resolves the PGRST204 error about missing 'company_logo' column
    - Existing jobs will have NULL values for this column initially
*/

-- Add company_logo column to jobs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'company_logo'
  ) THEN
    ALTER TABLE jobs ADD COLUMN company_logo text;
  END IF;
END $$;