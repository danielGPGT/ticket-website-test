-- Create storage bucket for images
-- Note: This migration requires Supabase Storage extension to be enabled
-- The bucket will be created via Supabase Dashboard or API, but we document it here

-- Storage bucket setup should be done via:
-- 1. Supabase Dashboard: Storage > New Bucket > Name: "images" > Public: true
-- 2. Or via API: POST /storage/v1/bucket with body: { name: "images", public: true }

-- Storage policies for public read access
-- These policies allow anyone to read images from the bucket

-- Policy: Allow public read access to images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('images', 'images', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE 
SET public = true, 
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- Policy: Allow public to read files from images bucket
CREATE POLICY IF NOT EXISTS "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- Policy: Allow authenticated users to upload to images bucket
CREATE POLICY IF NOT EXISTS "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'images' AND
  auth.role() = 'authenticated'
);

-- Policy: Allow authenticated users to update images
CREATE POLICY IF NOT EXISTS "Authenticated users can update images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'images' AND
  auth.role() = 'authenticated'
);

-- Policy: Allow authenticated users to delete images
CREATE POLICY IF NOT EXISTS "Authenticated users can delete images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'images' AND
  auth.role() = 'authenticated'
);

-- Note: For production, you may want to restrict upload/update/delete to specific roles
-- For example, only allow service_role or specific admin roles

