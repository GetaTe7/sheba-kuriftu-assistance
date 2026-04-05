-- Drop the old open policies intended for MVP Demo

-- Cultural Tips
DROP POLICY IF EXISTS "Anyone can insert cultural tips" ON public.cultural_tips;
DROP POLICY IF EXISTS "Anyone can update cultural tips" ON public.cultural_tips;
DROP POLICY IF EXISTS "Anyone can delete cultural tips" ON public.cultural_tips;

-- FAQs
DROP POLICY IF EXISTS "Anyone can insert FAQs" ON public.resort_faqs;
DROP POLICY IF EXISTS "Anyone can update FAQs" ON public.resort_faqs;
DROP POLICY IF EXISTS "Anyone can delete FAQs" ON public.resort_faqs;

-- Experiences
DROP POLICY IF EXISTS "Anyone can insert experiences" ON public.resort_experiences;
DROP POLICY IF EXISTS "Anyone can update experiences" ON public.resort_experiences;
DROP POLICY IF EXISTS "Anyone can delete experiences" ON public.resort_experiences;

-- Accessibility Cues
DROP POLICY IF EXISTS "Anyone can insert accessibility cues" ON public.accessibility_cues;
DROP POLICY IF EXISTS "Anyone can update accessibility cues" ON public.accessibility_cues;
DROP POLICY IF EXISTS "Anyone can delete accessibility cues" ON public.accessibility_cues;

-- Create Secure Policies locked to Authenticated Users (Admins)

-- Cultural Tips
CREATE POLICY "Admins can insert cultural tips" ON public.cultural_tips FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update cultural tips" ON public.cultural_tips FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete cultural tips" ON public.cultural_tips FOR DELETE TO authenticated USING (true);

-- FAQs
CREATE POLICY "Admins can insert FAQs" ON public.resort_faqs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update FAQs" ON public.resort_faqs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete FAQs" ON public.resort_faqs FOR DELETE TO authenticated USING (true);

-- Experiences
CREATE POLICY "Admins can insert experiences" ON public.resort_experiences FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update experiences" ON public.resort_experiences FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete experiences" ON public.resort_experiences FOR DELETE TO authenticated USING (true);

-- Accessibility Cues
CREATE POLICY "Admins can insert accessibility cues" ON public.accessibility_cues FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update accessibility cues" ON public.accessibility_cues FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete accessibility cues" ON public.accessibility_cues FOR DELETE TO authenticated USING (true);

-- Note: Read operations (SELECT) and Conversations remain unrestricted per the original design.
