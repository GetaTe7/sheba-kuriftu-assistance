/**
 * Text-to-Speech service using Google Cloud Text-to-Speech APIs via Edge Functions.
 */
import { synthesizeSpeech } from "@/services/api";

// Current active audio instance so we can cancel it
let currentAudio: HTMLAudioElement | null = null;
let currentObjectUrl: string | null = null;

// Map our app language codes to Google TTS voice configurations
// Using Wavenet/Neural2/Standard options based on what's available
const langToVoiceParams: Record<string, { languageCode: string; voiceName: string }> = {
  en: { languageCode: "en-US", voiceName: "en-US-Standard-A" },
  am: { languageCode: "am-ET", voiceName: "am-ET-Standard-A" }, // Needs verify: fallback logic if Amharic TTS doesn't exist
  om: { languageCode: "en-US", voiceName: "en-US-Standard-C" }, // Oromo might fall back to English voices
};

/**
 * Returns true if TTS is dynamically supported - typically yes if the browser supports fetch/Audio
 */
export function isTTSAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.Audio !== "undefined";
}

/**
 * Stop any currently playing speech and clear memory.
 */
export function stopSpeaking(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
}

/**
 * Speak text aloud by downloading the MP3 from Google Cloud via Edge Function.
 * @param text    The text to read aloud.
 * @param langCode  Our app language code: 'en' | 'am' | 'om'
 */
export async function speak(text: string, langCode: string = "en"): Promise<void> {
  if (!isTTSAvailable()) {
    console.warn("Audio playback not supported in this browser.");
    return;
  }

  // Cancel any current speech before starting new
  stopSpeaking();

  const voiceParams = langToVoiceParams[langCode] || langToVoiceParams["en"];

  try {
    // 1. Fetch MP3 array buffer from the backend proxy
    const arrayBuffer = await synthesizeSpeech(text, voiceParams.languageCode, voiceParams.voiceName);

    // 2. Convert to object URL
    const audioBlob = new Blob([arrayBuffer], { type: "audio/mpeg" });
    const audioUrl = URL.createObjectURL(audioBlob);
    
    currentObjectUrl = audioUrl;

    // 3. Play the audio
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      currentAudio = audio;

      audio.onended = () => {
        stopSpeaking();
        resolve();
      };

      audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        stopSpeaking();
        reject(new Error("Audio playback failed"));
      };

      // Handle Safari/Mobile auto-play policies gently
      audio.play().catch(async (e) => {
        if (e.name === 'NotAllowedError') {
            console.warn("Auto-play prevented by browser policy.");
            resolve(); // Fail gracefully rather than hard crash
        } else {
            reject(e);
        }
      });
    });
  } catch (error) {
    console.error("Failed to speak text:", error);
    throw error;
  }
}
