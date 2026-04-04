import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { BookOpen } from "lucide-react";
import { fetchCulturalTips } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";

interface Tip {
  id: string;
  title: string;
  description: string;
  category: string;
}

const categoryColors: Record<string, string> = {
  Greetings: "bg-primary/10 text-primary",
  Dining: "bg-accent/10 text-accent",
  Etiquette: "bg-terracotta/10 text-terracotta",
  Culture: "bg-gold/10 text-gold",
};

export default function CulturalTips() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCulturalTips().then((data) => { setTips(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-6 h-6 text-primary" />
          <h1 className="font-display text-2xl font-semibold text-foreground">Cultural Guide</h1>
        </div>
        <p className="text-muted-foreground text-sm mb-6">
          Understand Ethiopian traditions and make the most of your Kuriftu experience.
        </p>

        <div className="space-y-4">
          {loading ? Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          )) : tips.map((tip, i) => (
            <div key={tip.id} className="card-luxury animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-display text-lg font-semibold text-foreground">{tip.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${categoryColors[tip.category] || "bg-muted text-muted-foreground"}`}>
                  {tip.category}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{tip.description}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
