-- Private bucket for AI chat attachments (PDF / images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ai-uploads',
  'ai-uploads',
  false,
  10485760, -- 10 MB
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
)
ON CONFLICT (id) DO UPDATE
  SET file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types,
      public = false;

-- Owner-scoped policies: files live under "<user_id>/..."
CREATE POLICY "ai_uploads_select_own"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'ai-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "ai_uploads_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'ai-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_paid_user = true)
  );

CREATE POLICY "ai_uploads_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'ai-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);