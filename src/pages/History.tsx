import Layout from "@/components/Layout";
import { useApp } from "@/contexts/AppContext";
import { MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function History() {
  const { conversation, clearConversation } = useApp();

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-primary" />
            <h1 className="font-display text-2xl font-semibold text-foreground">Session History</h1>
          </div>
          {conversation.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearConversation} className="text-muted-foreground">
              <Trash2 className="w-4 h-4 mr-1" /> Clear
            </Button>
          )}
        </div>

        {conversation.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No conversations yet. Start by speaking to Sheba.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {conversation.map((msg) => (
              <div key={msg.id} className="card-luxury">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${msg.role === "user" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}>
                    {msg.role === "user" ? "You" : "Sheba"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-foreground">{msg.originalText}</p>
                {msg.translatedText && <p className="text-sm text-muted-foreground italic mt-1">{msg.translatedText}</p>}
                {msg.culturalTip && <p className="text-xs text-accent mt-1">{msg.culturalTip}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
