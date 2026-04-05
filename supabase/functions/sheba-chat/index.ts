import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Property display names for the system prompt
const propertyNames: Record<string, string> = {
  bishoftu: "Kuriftu Bishoftu (Lake Bishoftu)",
  entoto: "Kuriftu Entoto Wellness Retreat",
  bahirdar: "Kuriftu Bahir Dar (Lake Tana)",
  adama: "Kuriftu Adama",
  general: "Kuriftu Resort",
};

// Context-key detection: maps incoming text to a cultural scenario key.
function detectContextKey(text: string): string | null {
  const t = text.toLowerCase();
  if (/coffee|buna|ቡና/.test(t)) return "coffee";
  if (/greet|hello|selam|ሰላም|akkam/.test(t)) return "greeting";
  if (/spa|massage|wellness|relax/.test(t)) return "spa";
  if (/check.?in|check.?out|room|suite/.test(t)) return "checkin";
  if (/restaurant|eat|food|dinner|lunch|breakfast|injera|wat|wot/.test(t)) return "dining";
  if (/tour|boat|lake|monastery|safari|bird/.test(t)) return "tour";
  if (/family|child|children|kid/.test(t)) return "family";
  if (/tip|tipping|pay|payment/.test(t)) return "payment";
  if (/time|clock|hour|schedule/.test(t)) return "time";
  if (/water|pool|swim/.test(t)) return "leisure";
  return null;
}

const langNames: Record<string, string> = { en: "English", am: "Amharic", om: "Afaan Oromo" };

/**
 * Obtain a Google OAuth2 access token using a service account JSON.
 */
async function getAccessToken(credentials: Record<string, string>): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encode = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const unsigned = `${encode(header)}.${encode(payload)}`;

  // Import the private key
  const keyData = credentials.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\n/g, "");

  const binaryKey = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsigned)
  );

  const signedJwt = `${unsigned}.${btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")}`;

  // Exchange JWT for access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${signedJwt}`,
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`Failed to get Google access token: ${errText}`);
  }

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      text,
      sourceLanguage,
      targetLanguage,
      accessibilityMode,
      resortProperty,
      imageBase64,
      culturalTips,
      faqs,
    } = await req.json();

    const serviceAccountStr = Deno.env.get("GOOGLE_SERVICE_ACCOUNT");
    if (!serviceAccountStr) throw new Error("GOOGLE_SERVICE_ACCOUNT is not configured");
    const credentials = JSON.parse(serviceAccountStr);

    const projectId = credentials.project_id;
    const location = Deno.env.get("VERTEX_AI_LOCATION") || "us-central1";
    const model = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";

    // ── Build curated context blocks ──────────────────────────────────────────
    const faqContext = (faqs || [])
      .map((f: { question: string; answer: string }) => `Q: ${f.question}\nA: ${f.answer}`)
      .join("\n\n");

    const contextKey = detectContextKey(text);
    const allTips: { title: string; description: string; contextKey?: string }[] = culturalTips || [];
    const relevantTips = contextKey
      ? allTips.filter((t) => !t.contextKey || t.contextKey === contextKey)
      : allTips.slice(0, 5);

    const tipsContext = relevantTips.map((t) => `• ${t.title}: ${t.description}`).join("\n");

    const srcLang = langNames[sourceLanguage] || "English";
    const tgtLang = langNames[targetLanguage] || "Amharic";
    const propertyDisplay = propertyNames[resortProperty] || "Kuriftu Resort";

    const systemPrompt = `You are Sheba, the warm and knowledgeable AI companion at ${propertyDisplay} in Ethiopia.
${propertyDisplay === "Kuriftu Bishoftu (Lake Bishoftu)" ? "This property sits on the shores of the stunning crater lake, Lake Bishoftu." : ""}

YOUR PERSONALITY:
- Speak like a gracious Ethiopian host — warm, respectful, quietly proud of this culture
- Never sound robotic or generic; always feel like a real conversation
- Keep every reply to 2-3 sentences maximum (guests are busy)

LANGUAGE RULES:
- The guest is speaking ${srcLang}. Respond in ${srcLang}.
- Format your response EXACTLY as valid JSON (no markdown code blocks):
  { "response": "reply in ${srcLang}", "culturalTip": "one short relevant tip, or null" }

CULTURAL TIP RULES:
- Only include a culturalTip when the topic matches the cultural context below
- Detected context: ${contextKey ?? "none — omit the culturalTip (set to null)"}
- Keep the tip to one sentence. Never lecture.

CONTENT RULES:
- Use only the FAQ and cultural content provided. Never invent resort details.
- If unsure, say you will connect the guest with the front desk.
${accessibilityMode
  ? "- ACCESSIBILITY MODE: The guest may have a visual impairment. If an image is provided, describe only what is directly observable. Focus on obstacles, hazards, steps, and navigation landmarks. Be precise and brief."
  : ""}

KURIFTU RESORT FAQ:
${faqContext || "No FAQ data provided."}

RELEVANT CULTURAL CONTEXT:
${tipsContext || "No cultural tips matched this topic."}`;

    // ── Build Vertex AI request parts ─────────────────────────────────────────
    // Multimodal: include image inline if provided
    const contentParts: Record<string, unknown>[] = [{ text: `${systemPrompt}\n\nUser Input: ${text}` }];

    if (imageBase64) {
      // Detect MIME type from data URL prefix if available (fallback to jpeg)
      let mimeType = "image/jpeg";
      if (imageBase64.startsWith("/9j/")) mimeType = "image/jpeg";
      else if (imageBase64.startsWith("iVBOR")) mimeType = "image/png";

      contentParts.push({
        inline_data: {
          mime_type: mimeType,
          data: imageBase64,
        },
      });
    }

    // ── Call Google AI Studio (Generative Language) API ────────────────────────
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const apiRes = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: contentParts,
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 512,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!apiRes.ok) {
      const errBody = await apiRes.text();
      throw new Error(`Google API error (${apiRes.status}): ${errBody}`);
    }

    const vertexData = await apiRes.json();
    const rawContent: string =
      vertexData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // ── Parse JSON response ───────────────────────────────────────────────────
    let result: { response: string; translation: string | null; culturalTip: string | null };
    try {
      const cleaned = rawContent.replace(/```json|```/g, "").trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      if (parsed) {
        result = { response: parsed.response, translation: null, culturalTip: parsed.culturalTip };
      } else {
        result = { response: rawContent, translation: null, culturalTip: null };
      }
    } catch {
      result = { response: rawContent, translation: null, culturalTip: null };
    }

    // Safety: null out culturalTip when no context key detected
    if (!contextKey) result.culturalTip = null;

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sheba-chat error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unexpected error",
        response:
          "I'm having a little trouble right now. Please ask the front desk — they will be happy to help you.",
        translation: null,
        culturalTip: null,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
