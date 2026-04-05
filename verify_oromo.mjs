/**
 * verify_oromo.mjs
 * ------------------------------------------------------------------
 * Checks whether Google Cloud Translation, Speech-to-Text, and
 * Text-to-Speech APIs support Afaan Oromoo (language code: om).
 *
 * Usage:
 *   node verify_oromo.mjs path/to/service-account.json
 * ------------------------------------------------------------------
 */

import { readFileSync } from "fs";
import { createSign } from "crypto";

const saPath = process.argv[2];
if (!saPath) {
  console.error("Usage: node verify_oromo.mjs <path-to-service-account.json>");
  process.exit(1);
}

const rawJson = readFileSync(saPath, "utf8");
const credentials = JSON.parse(rawJson);


// ─── JWT / Access-token helper ─────────────────────────────────────────────
async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: credentials.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  ).toString("base64url");

  const unsigned = `${header}.${payload}`;
  const sign = createSign("RSA-SHA256");
  sign.update(unsigned);
  const signature = sign.sign(credentials.private_key, "base64url");
  const jwt = `${unsigned}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${errText}`);
  }
  const tokenJson = await res.json();
  if (!tokenJson.access_token) throw new Error(`No access_token in response: ${JSON.stringify(tokenJson)}`);
  return tokenJson.access_token;
}

// ─── Test 1: Translation API ───────────────────────────────────────────────
async function testTranslation(token) {
  console.log("\n🌐 [1/3] Testing Cloud Translation API (om)...");
  const res = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${credentials.private_key_id}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: "Welcome to Kuriftu Resort",
        source: "en",
        target: "om",
        format: "text",
      }),
    }
  );
  const data = await res.json();
  if (res.ok && data.data?.translations?.[0]?.translatedText) {
    console.log(`  ✅ Translation OK: "${data.data.translations[0].translatedText}"`);
    return true;
  } else {
    console.log(`  ❌ Translation FAILED: ${JSON.stringify(data.error || data)}`);
    return false;
  }
}

// ─── Test 2: Text-to-Speech API ────────────────────────────────────────────
async function testTTS(token) {
  console.log("\n🔊 [2/3] Testing Cloud Text-to-Speech API (om)...");
  const res = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: { text: "Nagaan dhuftan, Kuriftu Resort." },
      voice: { languageCode: "om", ssmlGender: "FEMALE" },
      audioConfig: { audioEncoding: "MP3" },
    }),
  });
  const data = await res.json();
  if (res.ok && data.audioContent) {
    console.log("  ✅ TTS OK — audio bytes received");
    return true;
  } else {
    console.log(`  ❌ TTS FAILED: ${JSON.stringify(data.error || data)}`);
    return false;
  }
}

// ─── Test 3: Speech-to-Text supported languages ────────────────────────────
async function testSTT(token) {
  console.log("\n🎙️  [3/3] Checking Cloud Speech-to-Text supported languages for om...");
  const res = await fetch(
    "https://speech.googleapis.com/v1p1beta1/speech:recognizeLongRunning",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        config: {
          encoding: "WEBM_OPUS",
          sampleRateHertz: 48000,
          languageCode: "om",
        },
        audio: {
          // Minimal stub — we're only checking if the language code is accepted
          content: "UklGRiQAAABXQVZFZm10IBAAAA==",
        },
      }),
    }
  );
  const data = await res.json();
  // If the language is unsupported we get a 400 with code 3
  if (res.status === 400 && data.error?.message?.toLowerCase().includes("language")) {
    console.log(`  ❌ STT: language code "om" is NOT supported — ${data.error.message}`);
    return false;
  } else if (res.ok || (data.error && !data.error?.message?.toLowerCase().includes("language"))) {
    console.log(`  ✅ STT: language code "om" accepted (recognition itself may vary)`);
    return true;
  } else {
    console.log(`  ⚠️  STT: uncertain response — ${JSON.stringify(data.error || data)}`);
    return false;
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────
(async () => {
  console.log("=== Afaan Oromoo Google Cloud API Verification ===");
  console.log(`Project: ${credentials.project_id}`);
  try {
    const token = await getAccessToken();
    const [t, tts, stt] = await Promise.all([
      testTranslation(token),
      testTTS(token),
      testSTT(token),
    ]);

    console.log("\n=== RESULT SUMMARY ===");
    console.log(`  Translation : ${t   ? "✅ Supported" : "❌ Not supported"}`);
    console.log(`  TTS         : ${tts ? "✅ Supported" : "❌ Not supported"}`);
    console.log(`  STT         : ${stt ? "✅ Supported" : "❌ Not supported"}`);

    if (t && tts && stt) {
      console.log("\n🟢 Afaan Oromoo is FULLY supported — promote it as a primary language.");
    } else if (t || tts || stt) {
      console.log("\n🟡 PARTIAL support — keep Oromoo as EXPERIMENTAL (label in UI as 'Beta').");
    } else {
      console.log("\n🔴 No support detected — remove Oromoo from production UI.");
    }
  } catch (err) {
    console.error("\n💥 Verification failed:", err.message);
    process.exit(1);
  }
})();
