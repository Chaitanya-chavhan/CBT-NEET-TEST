-- Create Whitelist Table
CREATE TABLE public.allowed_emails (
  email text PRIMARY KEY
);

-- RLS for allowed_emails (only admins can manage, but let's keep it simple for now)
ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;
-- For now, no public access to allowed_emails except maybe service_role.

-- Function to check allowed email on sign up
CREATE OR REPLACE FUNCTION public.check_allowed_email()
RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.allowed_emails WHERE email = NEW.email) THEN
    RAISE EXCEPTION 'Email % is not authorized to register.', NEW.email;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger before insert on auth.users
DROP TRIGGER IF EXISTS check_allowed_email_trigger ON auth.users;
CREATE TRIGGER check_allowed_email_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.check_allowed_email();

-- Create test-assets storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('test-assets', 'test-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Set up basic access policies for storage
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'test-assets');

CREATE POLICY "Authenticated users can upload" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'test-assets');

CREATE POLICY "Authenticated users can delete" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'test-assets');
