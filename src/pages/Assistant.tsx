import { useState, useRef, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import {
  Mic,
  MicOff,
  ArrowLeftRight,
  Volume2,
  VolumeX,
  Loader2,
  Keyboard,
  WifiOff,
} from "lucide-react";
import { shebaChat, saveConversationMessage, translateText } from "@/services/api";
import { speak, stopSpeaking, isTTSAvailable } from "@/services/tts";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { Input } from "@/components/ui/input";
import Layout from "@/components/Layout";
import type { ConversationMessage } from "@/data/seedData";
import { toast } from "sonner";

const langLabels: Record<string, string> = {
  en: "English",
  am: "አማርኛ",
  om: "Oromoo",
};

const ALL_LANGS = ["en", "am", "om"];

export default function Assistant() {
  const {
    language,
    targetLanguage,
    setTargetLanguage,
    resortProperty,
    conversation,
    addMessage,
    isRecording,
    setRecording,
    isProcessing,
    setProcessing,
    accessibilityMode,
  } = useApp();

  const [statusText, setStatusText] = useState("Tap the mic or type below");
  const [textInput, setTextInput] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(crypto.randomUUID());

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  // ─── Core message processor ───────────────────────────────────────────────
  const processMessage = async (text: string) => {
    setProcessing(true);
    setStatusText("Thinking…");

    const userMsg: ConversationMessage = {
      id: Date.now().toString(),
      role: "user",
      originalText: text,
      language,
      timestamp: new Date(),
    };
    addMessage(userMsg);

    // Persist to Supabase (non-blocking)
    saveConversationMessage({
      session_id: sessionId.current,
      role: "user",
      original_text: text,
      language,
      resort_property: resortProperty,
    }).catch(console.error);

    try {
      const result = await shebaChat({
        text,
        sourceLanguage: language,
        targetLanguage,
        accessibilityMode,
        resortProperty,
      });

      const culturalTip = result.culturalTip
        ? `💡 ${result.culturalTip}`
        : undefined;

      // Since we instructed Vertex AI to stop translating, result.translation is null.
      // We explicitly call the dedicated Google Cloud Translation API if the target language
      // is different from the spoken language.
      let finalTranslation: string | null = null;
      if (targetLanguage !== language && result.response) {
        try {
           finalTranslation = await translateText(result.response, targetLanguage);
        } catch (err) {
           console.error("Dedicated Translation API failed", err);
        }
      }

      const assistantMsg: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        originalText: result.response,
        translatedText: finalTranslation ?? undefined,
        language: targetLanguage,
        culturalTip,
        timestamp: new Date(),
      };
      addMessage(assistantMsg);

      saveConversationMessage({
        session_id: sessionId.current,
        role: "assistant",
        original_text: result.response,
        translated_text: finalTranslation,
        language: targetLanguage,
        cultural_tip: result.culturalTip,
        resort_property: resortProperty,
      }).catch(console.error);

      // Speak the response
      const textToSpeak = finalTranslation ?? result.response;
      const speakLang = finalTranslation ? targetLanguage : language;
      if (isTTSAvailable()) {
        setIsSpeaking(true);
        setStatusText("Speaking…");
        try {
          await speak(textToSpeak, speakLang);
        } finally {
          setIsSpeaking(false);
        }
      }

      setStatusText("Tap the mic or type below");
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast.error(msg);
      setStatusText("Something went wrong. Try again.");
    } finally {
      setProcessing(false);
    }
  };

  // ─── Speech recognition ───────────────────────────────────────────────────
  const { startListening, stopListening, isListening, isSupported, interimTranscript } =
    useSpeechRecognition({
      language,
      onResult: async (transcript) => {
        setRecording(false);
        setStatusText(`Heard: "${transcript}"`);
        await processMessage(transcript);
      },
      onError: (msg) => {
        setRecording(false);
        setStatusText("Tap the mic or type below");
        toast.error(msg);
      },
    });

  // ─── Mic button handler ───────────────────────────────────────────────────
  const handleMicPress = () => {
    if (isProcessing || isSpeaking) return;

    if (isListening) {
      stopListening();
      setRecording(false);
      setStatusText("Tap the mic or type below");
    } else {
      if (!isSupported) {
        toast.error(
          "Your browser doesn't support voice input. Use the keyboard instead.",
          { duration: 4000 }
        );
        setShowTextInput(true);
        return;
      }
      stopSpeaking();
      setIsSpeaking(false);
      setRecording(true);
      setStatusText("Listening… tap again to stop");
      startListening();
    }
  };

  // ─── Text input handler ───────────────────────────────────────────────────
  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isProcessing) return;
    const text = textInput.trim();
    setTextInput("");
    await processMessage(text);
  };

  // ─── Language cycle ───────────────────────────────────────────────────────
  const cycleTargetLanguage = () => {
    const candidates = ALL_LANGS.filter((l) => l !== language);
    const idx = candidates.indexOf(targetLanguage);
    setTargetLanguage(candidates[(idx + 1) % candidates.length]);
  };

  // ─── Stop speaking ────────────────────────────────────────────────────────
  const handleStopSpeaking = () => {
    stopSpeaking();
    setIsSpeaking(false);
    setStatusText("Tap the mic or type below");
  };

  // ─── Derived state ────────────────────────────────────────────────────────
  const busy = isProcessing || isSpeaking;
  const showInterim = isListening && interimTranscript;

  return (
    <Layout>
      <div className="flex flex-col h-full max-w-lg mx-auto px-4 pt-4">

        {/* Language bar */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="text-sm font-medium text-foreground bg-muted px-3 py-1.5 rounded-full">
            {langLabels[language]}
          </span>
          <button
            onClick={cycleTargetLanguage}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            title="Switch target language"
          >
            <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="text-sm font-medium text-foreground bg-muted px-3 py-1.5 rounded-full">
            {langLabels[targetLanguage]}
          </span>
        </div>

        {/* Conversation thread */}
        <div className="flex-1 space-y-4 overflow-y-auto pb-4 min-h-0">
          {conversation.length === 0 && (
            <div className="text-center py-16 animate-fade-in-up">
              <p className="font-display text-2xl text-foreground mb-2">
                Welcome to Sheba
              </p>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                Your AI cultural companion. Tap the mic or type a message to
                get started.
              </p>
            </div>
          )}

          {conversation.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "card-luxury"
                }`}
              >
                <p className="text-sm">{msg.originalText}</p>
                {msg.translatedText && (
                  <p className="text-sm mt-2 pt-2 border-t border-border/30 opacity-80 italic">
                    {msg.translatedText}
                  </p>
                )}
                {msg.culturalTip && (
                  <div className="mt-2 pt-2 border-t border-border/30">
                    <p className="text-xs opacity-70">{msg.culturalTip}</p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Live interim transcript bubble */}
          {showInterim && (
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-primary/40 text-primary-foreground border border-primary/50">
                <p className="text-sm italic opacity-80">{interimTranscript}…</p>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="py-4">
          <p className="text-sm text-muted-foreground text-center mb-3">
            {statusText}
          </p>

          <div className="flex items-center justify-center gap-4">
            {/* Keyboard toggle */}
            <button
              onClick={() => setShowTextInput((v) => !v)}
              className="p-3 rounded-full bg-muted hover:bg-muted/80 transition-colors"
              title="Type instead"
            >
              <Keyboard className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Main mic button */}
            <button
              id="mic-button"
              onClick={handleMicPress}
              disabled={busy}
              className={`mic-button w-20 h-20 ${
                isListening ? "recording" : ""
              } ${busy ? "opacity-50 cursor-not-allowed" : ""}`}
              title={isListening ? "Tap to stop" : "Tap to speak"}
            >
              {busy && !isListening ? (
                <Loader2 className="w-8 h-8 text-foreground animate-spin" />
              ) : isListening ? (
                <MicOff className="w-8 h-8 text-foreground" />
              ) : (
                <Mic className="w-8 h-8 text-foreground" />
              )}
            </button>

            {/* Stop speaking / unsupported indicator */}
            <button
              onClick={
                isSpeaking
                  ? handleStopSpeaking
                  : !isSupported
                  ? () => toast.info("Voice input not supported — use the keyboard.")
                  : undefined
              }
              className="p-3 rounded-full bg-muted hover:bg-muted/80 transition-colors relative"
              title={isSpeaking ? "Stop speaking" : !isSupported ? "Voice not supported" : ""}
            >
              {isSpeaking ? (
                <VolumeX className="w-5 h-5 text-primary animate-pulse" />
              ) : !isSupported ? (
                <WifiOff className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Volume2 className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
          </div>

          {/* Text input */}
          {showTextInput && (
            <form onSubmit={handleTextSubmit} className="mt-4 flex gap-2">
              <Input
                id="text-input"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type your message…"
                disabled={isProcessing}
                className="flex-1"
                autoFocus
              />
              <button
                id="send-button"
                type="submit"
                disabled={isProcessing || !textInput.trim()}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
              >
                Send
              </button>
            </form>
          )}

          {/* Status indicators */}
          {accessibilityMode && (
            <p className="text-xs text-accent mt-3 flex items-center justify-center gap-1">
              <Volume2 className="w-3 h-3" /> Accessibility mode active
            </p>
          )}

          {!isSupported && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Voice input requires Chrome or Edge. Use the keyboard icon above.
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
}
