import { supabase } from "@/integrations/supabase/client";
import type { ConversationMessage } from "@/data/seedData";

export async function fetchCulturalTips(property?: string) {
  const query = supabase.from("cultural_tips").select("*").order("created_at");
  // Temporarily disable property filtering until remote DB is migrated
  // if (property && property !== "general") {
  //   query = query.or(`resort_property.eq.general,resort_property.eq.${property}`);
  // }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchFaqs(property?: string) {
  const query = supabase.from("resort_faqs").select("*").order("created_at");
  // if (property && property !== "general") {
  //   query = query.or(`resort_property.eq.general,resort_property.eq.${property}`);
  // }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchExperiences(property?: string) {
  const query = supabase.from("resort_experiences").select("*").order("created_at");
  // if (property && property !== "general") {
  //   query = query.or(`resort_property.eq.general,resort_property.eq.${property}`);
  // }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchAccessibilityCues(property?: string) {
  const query = supabase.from("accessibility_cues").select("*").order("created_at");
  // if (property && property !== "general") {
  //   query = query.or(`resort_property.eq.general,resort_property.eq.${property}`);
  // }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function addCulturalTip(tip: { title: string; description: string; category: string; language?: string; resort_property?: string }) {
  const { data, error } = await supabase.from("cultural_tips").insert(tip).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCulturalTip(id: string) {
  const { error } = await supabase.from("cultural_tips").delete().eq("id", id);
  if (error) throw error;
}

export async function addFaq(faq: { question: string; answer: string; category: string; resort_property?: string }) {
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
  resort_property?: string;
}) {
  const { error } = await supabase.from("conversations").insert(msg);
  if (error) throw error;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function edgeFunctionHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
  };
}

export async function transcribeAudio(audioBase64: string, languageCode: string): Promise<string> {
  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/speech-to-text`,
    {
      method: "POST",
      headers: edgeFunctionHeaders(),
      body: JSON.stringify({
        audioBase64,
        languageCode,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "STT Request failed" }));
    throw new Error(err.error || "STT request failed");
  }

  const data = await res.json();
  return data.transcript;
}

export async function synthesizeSpeech(text: string, languageCode: string, voiceName?: string): Promise<ArrayBuffer> {
  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/text-to-speech`,
    {
      method: "POST",
      headers: edgeFunctionHeaders(),
      body: JSON.stringify({
        text,
        languageCode,
        voiceName
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`TTS request failed: ${errText}`);
  }

  return await res.arrayBuffer();
}

export async function translateText(text: string, target: string): Promise<string> {
  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/translate`,
    {
      method: "POST",
      headers: edgeFunctionHeaders(),
      body: JSON.stringify({
        text,
        target,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Translate Request failed" }));
    throw new Error(err.error || "Translate request failed");
  }

  const data = await res.json();
  return data.translation;
}

export async function shebaChat(params: {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  accessibilityMode: boolean;
  resortProperty?: string;
  imageBase64?: string | null;
}): Promise<{ response: string; translation: string | null; culturalTip: string | null }> {
  // Fetch context data for the AI — filter by property ('general' rows are always included)
  const property = params.resortProperty || "bishoftu";

  // Use sequential fetches with explicit types to bypass Supabase's deep generic type chains
  const tipsQuery = supabase.from("cultural_tips").select("title, description");
  // if (property !== "general") tipsQuery = tipsQuery.or(`resort_property.eq.general,resort_property.eq.${property}`);
  const tipsRes = await (tipsQuery.limit(10));
  const filteredTips = (tipsRes.data || []) as Array<{ title: string; description: string }>;

  const faqsQuery = supabase.from("resort_faqs").select("question, answer");
  // if (property !== "general") faqsQuery = faqsQuery.or(`resort_property.eq.general,resort_property.eq.${property}`);
  const faqsRes = await (faqsQuery.limit(10));
  const filteredFaqs = (faqsRes.data || []) as Array<{ question: string; answer: string }>;

  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/sheba-chat`,
    {
      method: "POST",
      headers: edgeFunctionHeaders(),
      body: JSON.stringify({
        ...params,
        resortProperty: property,
        culturalTips: filteredTips,
        faqs: filteredFaqs,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "AI request failed");
  }

  return res.json();
}
