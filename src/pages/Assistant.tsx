import { useState, useRef, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { Mic, MicOff, ArrowLeftRight, Volume2, Loader2 } from "lucide-react";
import { mockTranscribe, mockRespond, mockTranslate, mockTextToSpeech } from "@/services/mockServices";
import Layout from "@/components/Layout";
import type { ConversationMessage } from "@/data/seedData";

const langLabels: Record<string, string> = { en: "English", am: "አማርኛ", om: "Oromoo" };

export default function Assistant() {
  const { language, targetLanguage, setTargetLanguage, conversation, addMessage, isRecording, setRecording, isProcessing, setProcessing, accessibilityMode } = useApp();
  const [statusText, setStatusText] = useState("Tap the mic to speak");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const handleMicPress = async () => {
    if (isProcessing) return;

    if (isRecording) {
      setRecording(false);
      setProcessing(true);
      setStatusText("Processing your voice...");

      try {
        // Simulate transcription
        const transcribed = await mockTranscribe(new Blob());
        const userMsg: ConversationMessage = {
          id: Date.now().toString(),
          role: "user",
          originalText: transcribed,
          language,
          timestamp: new Date(),
        };
        addMessage(userMsg);

        setStatusText("Translating & preparing response...");

        // Get response
        const { response, culturalTip } = await mockRespond(transcribed, language);

        // Translate response
        const translated = language !== targetLanguage
          ? await mockTranslate(response, language, targetLanguage)
          : undefined;

        const assistantMsg: ConversationMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          originalText: response,
          translatedText: translated,
          language: targetLanguage,
          culturalTip,
          timestamp: new Date(),
        };
        addMessage(assistantMsg);

        // Speak response
        await mockTextToSpeech(response, targetLanguage);

        setStatusText("Tap the mic to speak");
      } catch {
        setStatusText("Something went wrong. Please try again.");
      } finally {
        setProcessing(false);
      }
    } else {
      setRecording(true);
      setStatusText("Listening...");
      // Auto-stop after 5 seconds for demo
      setTimeout(() => {
        handleMicPress();
      }, 2000);
    }
  };

  const swapLanguages = () => {
    const targets = ["en", "am", "om"].filter((l) => l !== language);
    const idx = targets.indexOf(targetLanguage);
    setTargetLanguage(targets[(idx + 1) % targets.length]);
  };

  return (
    <Layout>
      <div className="flex flex-col h-full max-w-lg mx-auto px-4 pt-4">
        {/* Language bar */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="text-sm font-medium text-foreground bg-muted px-3 py-1.5 rounded-full">
            {langLabels[language]}
          </span>
          <button onClick={swapLanguages} className="p-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="text-sm font-medium text-foreground bg-muted px-3 py-1.5 rounded-full">
            {langLabels[targetLanguage]}
          </span>
        </div>

        {/* Conversation */}
        <div className="flex-1 space-y-4 overflow-y-auto pb-4 min-h-0">
          {conversation.length === 0 && (
            <div className="text-center py-16">
              <p className="font-display text-2xl text-foreground mb-2">Welcome to Sheba</p>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                Your voice-first cultural companion. Tap the mic to ask a question, request a translation, or explore Kuriftu.
              </p>
            </div>
          )}

          {conversation.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
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
          <div ref={bottomRef} />
        </div>

        {/* Mic area */}
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground mb-4">{statusText}</p>

          <button
            onClick={handleMicPress}
            disabled={isProcessing}
            className={`mic-button w-20 h-20 mx-auto ${isRecording ? "recording" : ""} ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isProcessing ? (
              <Loader2 className="w-8 h-8 text-foreground animate-spin" />
            ) : isRecording ? (
              <MicOff className="w-8 h-8 text-foreground" />
            ) : (
              <Mic className="w-8 h-8 text-foreground" />
            )}
          </button>

          {accessibilityMode && (
            <p className="text-xs text-accent mt-3 flex items-center justify-center gap-1">
              <Volume2 className="w-3 h-3" /> Accessibility mode active
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
}
