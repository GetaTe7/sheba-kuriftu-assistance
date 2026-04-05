import { useState, useRef, useCallback, useEffect } from "react";
import { transcribeAudio } from "@/services/api";

/**
 * Maps our app language codes to BCP-47 tags for Google STT.
 */
const langToSTT: Record<string, string> = {
  en: "en-US",
  am: "am-ET",
  om: "om-ET",
};

export type SpeechStatus =
  | "idle"
  | "listening"
  | "processing"
  | "done"
  | "error"
  | "unsupported";

interface UseSpeechRecognitionOptions {
  language?: string;               // App language code: 'en' | 'am' | 'om'
  onResult: (transcript: string) => void;
  onError?: (msg: string) => void;
}

interface UseSpeechRecognitionReturn {
  status: SpeechStatus;
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  interimTranscript: string; // Left here for API compatibility, though we don't stream interim with MediaRecorder MVP
}

/**
 * Hook to capture microphone audio using MediaRecorder and transcribe it via Edge Function
 */
export function useSpeechRecognition({
  language = "en",
  onResult,
  onError,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn {
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  // We keep interimTranscript for interface compatibility, but we just show "Recording..."
  const [interimTranscript, setInterimTranscript] = useState("");

  const isSupported = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const convertBlobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        // Data URL format is "data:audio/webm;base64,....."
        // We only want the base64 part
        const result = reader.result as string;
        const base64Content = result.split(',')[1];
        resolve(base64Content);
      };
      reader.readAsDataURL(blob);
    });
  };

  const startListening = useCallback(async () => {
    if (!isSupported) {
      setStatus("unsupported");
      onError?.("Microphone recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream); // Often audio/webm by default

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Clean up tracks to turn off the microphone light
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setStatus("processing");
        setInterimTranscript("Processing audio securely via Google Cloud...");

        try {
          const base64Audio = await convertBlobToBase64(audioBlob);
          const langCode = langToSTT[language] || "en-US";
          const transcript = await transcribeAudio(base64Audio, langCode);

          setInterimTranscript("");
          
          if (transcript?.trim()) {
            setStatus("done");
            onResult(transcript.trim());
          } else {
            throw new Error("No speech could be recognized.");
          }
        } catch (error: any) {
          console.error("Transcription error:", error);
          setStatus("error");
          setInterimTranscript("");
          onError?.(error.message || "Failed to transcribe audio.");
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setStatus("listening");
      setInterimTranscript("Recording...");
    } catch (error: any) {
      setStatus("error");
      console.error("Microphone access error:", error);
      onError?.("Microphone access denied. Please allow permissions.");
    }
  }, [isSupported, language, onResult, onError]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    } else {
      setStatus("idle");
      setInterimTranscript("");
    }
  }, []);

  return {
    status,
    isListening: status === "listening",
    isSupported,
    startListening,
    stopListening,
    interimTranscript,
  };
}
