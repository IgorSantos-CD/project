/*
  # Add Recurring Transactions Support

  1. New Tables
    - recurring_transactions
      - Stores recurring transaction templates
      - Includes frequency and interval settings
      - Links to regular transactions

  2. Changes
    - Add recurring_transaction_id to transactions table
    - Add status to recurring_transactions

  3. Security
    - Enable RLS on new table
    - Add policies for authenticated users
*/

-- Create recurring_transactions table
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  description text NOT NULL,
  amount decimal(12,2) NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category_id uuid REFERENCES categories(id),
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  interval_count integer NOT NULL DEFAULT 1,
  start_date date NOT NULL,
  end_date date,
  last_generated_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add recurring transaction reference to transactions
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS recurring_transaction_id uuid REFERENCES recurring_transactions(id);

-- Enable RLS
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own recurring transactions"
  ON recurring_transactions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_user_id ON recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_status ON recurring_transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_recurring_id ON transactions(recurring_transaction_id);