import { supabase } from "@/integrations/supabase/client";
import type { ConversationMessage } from "@/data/seedData";

export async function fetchCulturalTips() {
  const { data, error } = await supabase.from("cultural_tips").select("*").order("created_at");
  if (error) throw error;
  return data;
}

export async function fetchFaqs() {
  const { data, error } = await supabase.from("resort_faqs").select("*").order("created_at");
  if (error) throw error;
  return data;
}

export async function fetchExperiences() {
  const { data, error } = await supabase.from("resort_experiences").select("*").order("created_at");
  if (error) throw error;
  return data;
}

export async function fetchAccessibilityCues() {
  const { data, error } = await supabase.from("accessibility_cues").select("*").order("created_at");
  if (error) throw error;
  return data;
}

export async function addCulturalTip(tip: { title: string; description: string; category: string; language?: string }) {
  const { data, error } = await supabase.from("cultural_tips").insert(tip).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCulturalTip(id: string) {
  const { error } = await supabase.from("cultural_tips").delete().eq("id", id);
  if (error) throw error;
}

export async function addFaq(faq: { question: string; answer: string; category: string }) {
  const { data, error } = await supabase.from("resort_faqs").insert(faq).select().single();
  if (error) throw error;
  return data;
}

export async function deleteFaq(id: string) {
  const { error } = await supabase.from("resort_faqs").delete().eq("id", id);
  if (error) throw error;
}

export async function saveConversationMessage(msg: {
  session_id: string;
  role: string;
  original_text: string;
  translated_text?: string | null;
  language: string;
  cultural_tip?: string | null;
}) {
  const { error } = await supabase.from("conversations").insert(msg);
  if (error) throw error;
}

export async function shebaChat(params: {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  accessibilityMode: boolean;
}): Promise<{ response: string; translation: string | null; culturalTip: string | null }> {
  // Fetch context data for the AI
  const [tips, faqs] = await Promise.all([
    supabase.from("cultural_tips").select("title, description").limit(10),
    supabase.from("resort_faqs").select("question, answer").limit(10),
  ]);

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sheba-chat`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        ...params,
        culturalTips: tips.data || [],
        faqs: faqs.data || [],
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "AI request failed");
  }

  return res.json();
}
