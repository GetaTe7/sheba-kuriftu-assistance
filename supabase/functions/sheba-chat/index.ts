import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, sourceLanguage, targetLanguage, accessibilityMode, culturalTips, faqs } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build context from FAQs and cultural tips
    const faqContext = (faqs || []).map((f: { question: string; answer: string }) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");
    const tipsContext = (culturalTips || []).map((t: { title: string; description: string }) => `${t.title}: ${t.description}`).join("\n");

    const langNames: Record<string, string> = { en: "English", am: "Amharic", om: "Afaan Oromo" };

    const systemPrompt = `You are Sheba, a warm and professional AI cultural companion for Kuriftu Resort in Ethiopia. 
You help guests with translations, cultural understanding, and resort information.
Your tone is friendly, warm, and respectful — like a knowledgeable Ethiopian host.

RULES:
- Keep responses brief (2-3 sentences max)
- If the guest speaks in ${langNames[sourceLanguage] || "English"}, respond in ${langNames[sourceLanguage] || "English"} AND provide a translation in ${langNames[targetLanguage] || "Amharic"}
- Format your response as JSON: {"response": "your answer", "translation": "translated answer", "culturalTip": "optional short cultural note if relevant, or null"}
- Only include a cultural tip if directly relevant to what the guest asked
- Use Kuriftu resort information when answering resort-related questions
- Do not make up resort details not in the provided FAQ
${accessibilityMode ? "- The guest has accessibility mode enabled. If relevant, mention any accessibility notes about the location or activity." : ""}

KURIFTU RESORT FAQ:
${faqContext}

ETHIOPIAN CULTURAL CONTEXT:
${tipsContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Try to parse JSON response from AI
    let result;
    try {
      // Extract JSON from possible markdown code block
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { response: content, translation: null, culturalTip: null };
    } catch {
      result = { response: content, translation: null, culturalTip: null };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sheba-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
