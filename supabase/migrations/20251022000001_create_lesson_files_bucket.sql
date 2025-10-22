-- Create a storage bucket for lesson files
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-files', 'lesson-files', true);

-- Set up RLS policy for the lesson files bucket
CREATE POLICY "Anyone can view lesson files" ON storage.objects
FOR SELECT USING (bucket_id = 'lesson-files');

CREATE POLICY "Authenticated users can upload lesson files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'lesson-files' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update lesson files" ON storage.objects
FOR UPDATE USING (bucket_id = 'lesson-files' AND auth.role() = 'authenticated');