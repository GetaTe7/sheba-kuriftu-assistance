
-- Create cultural_tips table
CREATE TABLE public.cultural_tips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create resort_faqs table
CREATE TABLE public.resort_faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create resort_experiences table
CREATE TABLE public.resort_experiences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  duration TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '✨',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create accessibility_cues table
CREATE TABLE public.accessibility_cues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scene TEXT NOT NULL,
  description TEXT NOT NULL,
  obstacles TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversations table for session history
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  original_text TEXT NOT NULL,
  translated_text TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  cultural_tip TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.cultural_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resort_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resort_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessibility_cues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Public read access for guest-facing content
CREATE POLICY "Anyone can read cultural tips" ON public.cultural_tips FOR SELECT USING (true);
CREATE POLICY "Anyone can read FAQs" ON public.resort_faqs FOR SELECT USING (true);
CREATE POLICY "Anyone can read experiences" ON public.resort_experiences FOR SELECT USING (true);
CREATE POLICY "Anyone can read accessibility cues" ON public.accessibility_cues FOR SELECT USING (true);

-- Conversations: anyone can read/write (no auth required for MVP demo)
CREATE POLICY "Anyone can read conversations" ON public.conversations FOR SELECT USING (true);
CREATE POLICY "Anyone can insert conversations" ON public.conversations FOR INSERT WITH CHECK (true);

-- Admin write access (open for MVP demo, lock down with auth later)
CREATE POLICY "Anyone can insert cultural tips" ON public.cultural_tips FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update cultural tips" ON public.cultural_tips FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete cultural tips" ON public.cultural_tips FOR DELETE USING (true);

CREATE POLICY "Anyone can insert FAQs" ON public.resort_faqs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update FAQs" ON public.resort_faqs FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete FAQs" ON public.resort_faqs FOR DELETE USING (true);

CREATE POLICY "Anyone can insert experiences" ON public.resort_experiences FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update experiences" ON public.resort_experiences FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete experiences" ON public.resort_experiences FOR DELETE USING (true);

CREATE POLICY "Anyone can insert accessibility cues" ON public.accessibility_cues FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update accessibility cues" ON public.accessibility_cues FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete accessibility cues" ON public.accessibility_cues FOR DELETE USING (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_cultural_tips_updated_at BEFORE UPDATE ON public.cultural_tips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_resort_faqs_updated_at BEFORE UPDATE ON public.resort_faqs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_resort_experiences_updated_at BEFORE UPDATE ON public.resort_experiences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_accessibility_cues_updated_at BEFORE UPDATE ON public.accessibility_cues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for conversation session lookups
CREATE INDEX idx_conversations_session_id ON public.conversations (session_id);
