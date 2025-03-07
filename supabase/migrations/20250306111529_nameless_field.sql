/*
  # Update categories table RLS policies

  1. Changes
    - Add RLS policy for inserting new categories
    - Add RLS policy for reading categories
    - Ensure user_id is set on category creation

  2. Security
    - Enable RLS on categories table
    - Users can only read their own categories or shared categories
    - Users can only create categories for themselves
*/

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policy for reading categories
CREATE POLICY "Users can read their own categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    user_id IS NULL -- Allow reading categories without user_id (shared/default categories)
  );

-- Policy for inserting categories
CREATE POLICY "Users can create their own categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );