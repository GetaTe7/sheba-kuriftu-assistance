import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getGoogleAccessToken(credentials: Record<string, string>): Promise<string> {
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

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, languageCode, voiceName } = await req.json();

    if (!text) {
      throw new Error("Missing text in request body.");
    }

    const serviceAccountStr = Deno.env.get("GOOGLE_SERVICE_ACCOUNT");
    if (!serviceAccountStr) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT is not configured in Edge Function secrets.");
    }

    const credentials = JSON.parse(serviceAccountStr);
    const accessToken = await getGoogleAccessToken(credentials);

    const lang = languageCode || "en-US";
    // Pick a good default voice per language
    const defaultVoice: Record<string, string> = {
      "en-US": "en-US-Neural2-F",
      "am-ET": "am-ET-Standard-A",
      "om-ET": "om-ET-Standard-A",
    };
    const voice = voiceName || defaultVoice[lang] || "en-US-Neural2-F";

    console.log(`Synthesizing speech for: ${lang} with voice: ${voice}`);

    // Call Google Cloud TTS REST API directly (avoids npm SDK hanging in Deno)
    const ttsRes = await fetch(
      "https://texttospeech.googleapis.com/v1/text:synthesize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: lang,
            name: voice,
          },
          audioConfig: {
            audioEncoding: "MP3",
          },
        }),
      }
    );

    if (!ttsRes.ok) {
      const errBody = await ttsRes.text();
      throw new Error(`Google TTS API error (${ttsRes.status}): ${errBody}`);
    }

    const ttsData = await ttsRes.json();
    // The API returns base64-encoded audio
    const audioBase64 = ttsData.audioContent;
    const audioBytes = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));

    return new Response(audioBytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error: any) {
    console.error("text-to-speech error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error during TTS" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
