-- Add file_path column to lessons table and remove content column
ALTER TABLE lessons ADD COLUMN file_path TEXT;

-- Drop the content column since we'll store files instead
ALTER TABLE lessons DROP COLUMN content;