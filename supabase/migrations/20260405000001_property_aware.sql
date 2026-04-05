-- Add resort_property column to all relevant tables.
-- Default 'bishoftu' (current active property) for existing rows, 'general' is the wildcard.

ALTER TABLE public.cultural_tips
  ADD COLUMN IF NOT EXISTS resort_property TEXT NOT NULL DEFAULT 'general';

ALTER TABLE public.resort_faqs
  ADD COLUMN IF NOT EXISTS resort_property TEXT NOT NULL DEFAULT 'general';

ALTER TABLE public.resort_experiences
  ADD COLUMN IF NOT EXISTS resort_property TEXT NOT NULL DEFAULT 'general';

ALTER TABLE public.accessibility_cues
  ADD COLUMN IF NOT EXISTS resort_property TEXT NOT NULL DEFAULT 'general';

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS resort_property TEXT NOT NULL DEFAULT 'bishoftu';

-- Index for fast property-filtered queries
CREATE INDEX IF NOT EXISTS idx_cultural_tips_property     ON public.cultural_tips     (resort_property);
CREATE INDEX IF NOT EXISTS idx_resort_faqs_property       ON public.resort_faqs       (resort_property);
CREATE INDEX IF NOT EXISTS idx_resort_experiences_property ON public.resort_experiences (resort_property);
CREATE INDEX IF NOT EXISTS idx_accessibility_cues_property ON public.accessibility_cues (resort_property);
CREATE INDEX IF NOT EXISTS idx_conversations_property      ON public.conversations      (resort_property);
