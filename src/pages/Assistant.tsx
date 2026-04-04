import { useState, useRef, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { Mic, MicOff, ArrowLeftRight, Volume2, Loader2, Keyboard } from "lucide-react";
import { shebaChat, saveConversationMessage } from "@/services/api";
import { Input } from "@/components/ui/input";
import Layout from "@/components/Layout";
import type { ConversationMessage } from "@/data/seedData";
import { toast } from "sonner";

const langLabels: Record<string, string> = { en: "English", am: "አማርኛ", om: "Oromoo" };

export default function Assistant() {
  const { language, targetLanguage, setTargetLanguage, conversation, addMessage, isRecording, setRecording, isProcessing, setProcessing, accessibilityMode } = useApp();
  const [statusText, setStatusText] = useState("Tap the mic or type below");
  const [textInput, setTextInput] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(crypto.randomUUID());

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const processMessage = async (text: string) => {
    setProcessing(true);
    setStatusText("Thinking...");

    const userMsg: ConversationMessage = {
      id: Date.now().toString(),
      role: "user",
      originalText: text,
      language,
      timestamp: new Date(),
    };
    addMessage(userMsg);

    // Save to DB
    saveConversationMessage({
      session_id: sessionId.current,
      role: "user",
      original_text: text,
      language,
    }).catch(console.error);

    try {
      const result = await shebaChat({
        text,
        sourceLanguage: language,
        targetLanguage,
        accessibilityMode,
      });

      const culturalTip = result.culturalTip ? `💡 ${result.culturalTip}` : undefined;

      const assistantMsg: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        originalText: result.response,
        translatedText: result.translation || undefined,
        language: targetLanguage,
        culturalTip,
        timestamp: new Date(),
      };
      addMessage(assistantMsg);

      saveConversationMessage({
        session_id: sessionId.current,
        role: "assistant",
        original_text: result.response,
        translated_text: result.translation,
        language: targetLanguage,
        cultural_tip: result.culturalTip,
      }).catch(console.error);

      setStatusText("Tap the mic or type below");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Something went wrong");
      setStatusText("Something went wrong. Try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleMicPress = async () => {
    if (isProcessing) return;

    if (isRecording) {
      setRecording(false);
      // For demo: use Web Speech API if available, otherwise simulate
      setStatusText("Processing voice...");
      const mockPhrases = [
        "Hello, where is the restaurant?",
        "Can I book a spa treatment?",
        "What time is breakfast?",
        "Tell me about the coffee ceremony",
        "Thank you for your help",
      ];
      const text = mockPhrases[Math.floor(Math.random() * mockPhrases.length)];
      await processMessage(text);
    } else {
      setRecording(true);
      setStatusText("Listening... tap again to stop");
      setTimeout(() => {
        if (isRecording) handleMicPress();
      }, 3000);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isProcessing) return;
    const text = textInput.trim();
    setTextInput("");
    await processMessage(text);
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
                Your AI cultural companion. Tap the mic or type a message to get started.
              </p>
            </div>
          )}

          {conversation.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "card-luxury"}`}>
                <p className="text-sm">{msg.originalText}</p>
                {msg.translatedText && (
                  <p className="text-sm mt-2 pt-2 border-t border-border/30 opacity-80 italic">{msg.translatedText}</p>
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

        {/* Input area */}
        <div className="py-4">
          <p className="text-sm text-muted-foreground text-center mb-3">{statusText}</p>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setShowTextInput(!showTextInput)}
              className="p-3 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            >
              <Keyboard className="w-5 h-5 text-muted-foreground" />
            </button>

            <button
              onClick={handleMicPress}
              disabled={isProcessing}
              className={`mic-button w-20 h-20 ${isRecording ? "recording" : ""} ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isProcessing ? (
                <Loader2 className="w-8 h-8 text-foreground animate-spin" />
              ) : isRecording ? (
                <MicOff className="w-8 h-8 text-foreground" />
              ) : (
                <Mic className="w-8 h-8 text-foreground" />
              )}
            </button>

            <div className="w-11" /> {/* spacer */}
          </div>

          {showTextInput && (
            <form onSubmit={handleTextSubmit} className="mt-4 flex gap-2">
              <Input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isProcessing}
                className="flex-1"
                autoFocus
              />
              <button type="submit" disabled={isProcessing || !textInput.trim()} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
                Send
              </button>
            </form>
          )}

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
