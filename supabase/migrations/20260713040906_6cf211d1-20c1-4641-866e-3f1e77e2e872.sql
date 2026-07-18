
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;

CREATE POLICY "Public read question images" ON storage.objects
  FOR SELECT USING (bucket_id = 'question-images');
CREATE POLICY "Admins upload question images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'question-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update question images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'question-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete question images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'question-images' AND public.has_role(auth.uid(), 'admin'));
