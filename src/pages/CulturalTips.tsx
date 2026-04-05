import { useEffect, useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { BookOpen } from "lucide-react";
import { fetchCulturalTips } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/contexts/AppContext";

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
  const { culturalTips: contextTips } = useApp();
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  useEffect(() => {
    setLoading(true);
    fetchCulturalTips()
      .then((data) => {
        if (!data || data.length === 0) {
          setTips(contextTips);
        } else {
          setTips(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed fetching cultural tips:", err);
        setTips(contextTips);
        setLoading(false);
      });
  }, [contextTips]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(tips.map(t => t.category)));
    return ["All", ...cats.sort()];
  }, [tips]);

  const filteredTips = useMemo(() => {
    if (activeCategory === "All") return tips;
    return tips.filter(t => t.category === activeCategory);
  }, [tips, activeCategory]);

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-6 h-6 text-primary" />
          <h1 className="font-display text-2xl font-semibold text-foreground">Cultural Guide</h1>
        </div>
        <p className="text-muted-foreground text-sm mb-4">
          Understand Ethiopian traditions and make the most of your Kuriftu experience.
        </p>

        {/* Category Filters */}
        {!loading && categories.length > 1 && (
          <div className="flex overflow-x-auto pb-2 mb-6 gap-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === category
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-8">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))
          ) : filteredTips.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No cultural tips found.
            </div>
          ) : activeCategory === "All" ? (
            categories.filter(c => c !== "All").map(category => {
              const categoryTips = tips.filter(t => t.category === category);
              if (categoryTips.length === 0) return null;
              return (
                <div key={category} className="space-y-4">
                  <h2 className="font-display text-xl font-medium text-foreground pb-1 border-b border-border/50">
                    {category}
                  </h2>
                  <div className="grid gap-4">
                    {categoryTips.map((tip, i) => (
                      <TipCard key={tip.id} tip={tip} index={i} />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="grid gap-4">
              {filteredTips.map((tip, i) => (
                <TipCard key={tip.id} tip={tip} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function TipCard({ tip, index }: { tip: Tip; index: number }) {
  return (
    <div className="card-luxury animate-fade-in-up" style={{ animationDelay: `${(index % 5) * 0.1}s` }}>
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-display text-lg font-semibold text-foreground">{tip.title}</h3>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${categoryColors[tip.category] || "bg-muted text-muted-foreground"}`}>
          {tip.category}
        </span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{tip.description}</p>
    </div>
  );
}
