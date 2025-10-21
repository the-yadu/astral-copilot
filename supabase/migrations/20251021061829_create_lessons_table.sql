/*
  # Create lessons table

  ## Summary
  This migration creates the core infrastructure for the Digital Lessons application.
  It sets up a lessons table to store AI-generated educational content with proper
  security policies.

  ## New Tables
  
  ### `lessons`
  - `id` (uuid, primary key) - Unique identifier for each lesson
  - `title` (text) - The title/topic of the lesson extracted from the outline
  - `outline` (text) - The original lesson outline provided by the user
  - `status` (text) - Current generation status: 'generating' or 'generated'
  - `content` (text, nullable) - The generated TypeScript code for the lesson
  - `error` (text, nullable) - Any error message if generation fails
  - `created_at` (timestamptz) - Timestamp when the lesson was requested
  - `updated_at` (timestamptz) - Timestamp when the lesson was last updated

  ## Security
  - Enable RLS on `lessons` table
  - Add policy for public read access (no auth requirement per spec)
  - Add policy for public insert access (no auth requirement per spec)
  - Add policy for public update access to allow status updates

  ## Important Notes
  1. No authentication is required as per challenge requirements
  2. Status field tracks 'generating' and 'generated' states
  3. Content stores the generated TypeScript code
*/

CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  outline text NOT NULL,
  status text NOT NULL DEFAULT 'generating',
  content text,
  error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read lessons"
  ON lessons
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create lessons"
  ON lessons
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update lessons"
  ON lessons
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_lessons_created_at ON lessons(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(status);