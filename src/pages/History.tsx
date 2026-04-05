import { useEffect, useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Trash2, Search, Volume2, User, Bot, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { speak, isTTSAvailable } from "@/services/tts";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface DbMessage {
  id: string;
  role: string;
  original_text: string;
  translated_text: string | null;
  cultural_tip: string | null;
  language: string;
  created_at: string;
  session_id: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function groupByDate(msgs: DbMessage[]): Record<string, DbMessage[]> {
  return msgs.reduce((acc, msg) => {
    const key = formatDate(msg.created_at);
    acc[key] = acc[key] ? [...acc[key], msg] : [msg];
    return acc;
  }, {} as Record<string, DbMessage[]>);
}

export default function History() {
  const { conversation, clearConversation, language } = useApp();
  const [dbMessages, setDbMessages] = useState<DbMessage[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);
  const [search, setSearch] = useState("");
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // Try to fetch persisted conversation history from Supabase
  useEffect(() => {
    supabase
      .from("conversations")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(200)
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setDbMessages(data as DbMessage[]);
        }
        setLoadingDb(false);
      })
      .catch(() => setLoadingDb(false));
  }, []);

  // Merge DB messages (persisted) with in-memory conversation (current session)
  const allMessages = useMemo(() => {
    if (dbMessages.length > 0) return dbMessages;
    // Fall back to in-memory session messages
    return conversation.map((m) => ({
      id: m.id,
      role: m.role,
      original_text: m.originalText,
      translated_text: m.translatedText ?? null,
      cultural_tip: m.culturalTip ?? null,
      language: m.language,
      created_at: m.timestamp.toISOString(),
      session_id: "current-session",
    }));
  }, [dbMessages, conversation]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allMessages;
    const q = search.toLowerCase();
    return allMessages.filter(
      (m) =>
        m.original_text.toLowerCase().includes(q) ||
        (m.translated_text?.toLowerCase().includes(q) ?? false)
    );
  }, [allMessages, search]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);
  const dateGroups = Object.keys(grouped);

  const handleSpeak = async (msg: DbMessage) => {
    if (!isTTSAvailable()) {
      toast.info("Audio not available in this browser.");
      return;
    }
    setSpeakingId(msg.id);
    try {
      const text = msg.translated_text ?? msg.original_text;
      await speak(text, msg.language);
    } finally {
      setSpeakingId(null);
    }
  };

  const handleClearAll = async () => {
    clearConversation(); // clears in-memory
    // Also delete from Supabase if we have persisted records
    if (dbMessages.length > 0) {
      const { error } = await supabase.from("conversations").delete().neq("id", "");
      if (error) toast.error("Could not clear server history.");
      else {
        setDbMessages([]);
        toast.success("Conversation history cleared.");
      }
    }
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-primary" />
            <h1 className="font-display text-2xl font-semibold text-foreground">Session History</h1>
          </div>
          {allMessages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="w-4 h-4 mr-1" /> Clear
            </Button>
          )}
        </div>

        {/* Search bar */}
        {allMessages.length > 0 && (
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search conversations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-9 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        )}

        {/* Loading state */}
        {loadingDb && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loadingDb && allMessages.length === 0 && (
          <div className="text-center py-20 animate-fade-in-up">
            <MessageSquare className="w-14 h-14 text-muted-foreground mx-auto mb-4 opacity-30" />
            <p className="font-display text-lg font-semibold text-foreground mb-2">No conversations yet</p>
            <p className="text-muted-foreground text-sm">
              Start by speaking to Sheba on the Assistant tab. Your conversations will appear here.
            </p>
          </div>
        )}

        {/* No search results */}
        {!loadingDb && allMessages.length > 0 && filtered.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground text-sm">No messages match "{search}"</p>
          </div>
        )}

        {/* Grouped messages */}
        {!loadingDb && dateGroups.map((dateLabel) => (
          <div key={dateLabel} className="mb-6">
            {/* Date divider */}
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {dateLabel}
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="space-y-3">
              {grouped[dateLabel].map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 animate-fade-in-up ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                    msg.role === "user" ? "bg-primary" : "bg-accent/20"
                  }`}>
                    {msg.role === "user"
                      ? <User className="w-3.5 h-3.5 text-primary-foreground" />
                      : <Bot className="w-3.5 h-3.5 text-accent" />
                    }
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-[82%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "card-luxury rounded-tl-sm"
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.original_text}</p>
                    {msg.translated_text && (
                      <p className="text-sm mt-2 pt-2 border-t border-white/20 italic opacity-80">
                        {msg.translated_text}
                      </p>
                    )}
                    {msg.cultural_tip && (
                      <p className="text-xs mt-1 opacity-70">💡 {msg.cultural_tip}</p>
                    )}

                    {/* Footer: time + replay */}
                    <div className={`flex items-center gap-2 mt-2 ${msg.role === "user" ? "justify-start" : "justify-between"}`}>
                      <span className="text-[10px] opacity-50">{formatTime(msg.created_at)}</span>
                      {msg.role === "assistant" && isTTSAvailable() && (
                        <button
                          onClick={() => handleSpeak(msg)}
                          disabled={speakingId === msg.id}
                          className="text-[10px] flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity"
                        >
                          <Volume2 className={`w-3 h-3 ${speakingId === msg.id ? "animate-pulse text-primary" : ""}`} />
                          {speakingId === msg.id ? "Playing…" : "Replay"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
