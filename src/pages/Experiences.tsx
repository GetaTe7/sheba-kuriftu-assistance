import { useEffect, useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { useApp } from "@/contexts/AppContext";
import { fetchExperiences, shebaChat } from "@/services/api";
import { resortExperiences as seedExperiences } from "@/data/seedData";
import { Compass, Clock, ChevronRight, X, Loader2, Volume2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { speak, isTTSAvailable } from "@/services/tts";
import { toast } from "sonner";

interface Experience {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  icon: string;
}

const categoryColors: Record<string, { pill: string; bg: string; border: string }> = {
  Culture:   { pill: "bg-primary/10 text-primary",        bg: "bg-primary/5",    border: "border-primary/20"   },
  Adventure: { pill: "bg-orange-500/10 text-orange-500",  bg: "bg-orange-50",    border: "border-orange-200"   },
  Wellness:  { pill: "bg-amber-500/10 text-amber-600",    bg: "bg-amber-50",     border: "border-amber-200"    },
  Nature:    { pill: "bg-green-600/10 text-green-600",    bg: "bg-green-50",     border: "border-green-200"    },
};
const defaultColors = { pill: "bg-muted text-muted-foreground", bg: "bg-muted/30", border: "border-border" };

export default function Experiences() {
  const { language, targetLanguage, resortProperty } = useApp();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  // Modal state
  const [selected, setSelected] = useState<Experience | null>(null);
  const [enquiryLoading, setEnquiryLoading] = useState(false);
  const [enquiryText, setEnquiryText] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);

  // Fetch from Supabase, fall back to seed data
  useEffect(() => {
    setLoading(true);
    fetchExperiences()
      .then((data) => {
        if (!data || data.length === 0) setExperiences(seedExperiences);
        else setExperiences(data);
        setLoading(false);
      })
      .catch(() => {
        setExperiences(seedExperiences);
        setLoading(false);
      });
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(experiences.map((e) => e.category)));
    return ["All", ...cats];
  }, [experiences]);

  const filtered = useMemo(() => {
    if (activeCategory === "All") return experiences;
    return experiences.filter((e) => e.category === activeCategory);
  }, [experiences, activeCategory]);

  const openModal = (exp: Experience) => {
    setSelected(exp);
    setEnquiryText(null);
  };

  const closeModal = () => {
    setSelected(null);
    setEnquiryText(null);
  };

  const askSheba = async () => {
    if (!selected) return;
    setEnquiryLoading(true);
    try {
      const result = await shebaChat({
        text: `Tell me more about the "${selected.title}" experience at Kuriftu. How do I book it, what should I wear or bring, and what is the highlight I shouldn't miss? Keep it to 3 sentences.`,
        sourceLanguage: language,
        targetLanguage,
        accessibilityMode: false,
        resortProperty,
      });
      const reply = result.translation ?? result.response;
      setEnquiryText(reply);
      if (isTTSAvailable()) {
        setSpeaking(true);
        await speak(reply, language);
        setSpeaking(false);
      }
    } catch {
      toast.error("Sheba couldn't respond right now. Please try again.");
    } finally {
      setEnquiryLoading(false);
    }
  };

  const colors = selected ? (categoryColors[selected.category] ?? defaultColors) : defaultColors;

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Compass className="w-6 h-6 text-primary" />
          <h1 className="font-display text-2xl font-semibold text-foreground">Kuriftu Experiences</h1>
        </div>
        <p className="text-muted-foreground text-sm mb-5">
          Discover unique experiences that celebrate Ethiopian culture and lakeside beauty.
        </p>

        {/* Category filter tabs */}
        {!loading && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Experience cards */}
        <div className="grid gap-4">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-2xl" />
              ))
            : filtered.map((exp, i) => {
                const c = categoryColors[exp.category] ?? defaultColors;
                return (
                  <button
                    key={exp.id}
                    onClick={() => openModal(exp)}
                    className={`card-luxury w-full text-left animate-fade-in-up border ${c.border} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}
                    style={{ animationDelay: `${i * 0.07}s` }}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center text-2xl shrink-0`}>
                        {exp.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-display text-base font-semibold text-foreground leading-snug">
                            {exp.title}
                          </h3>
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{exp.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{exp.duration}</span>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.pill}`}>
                            {exp.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
        </div>

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <Compass className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground text-sm">No experiences in this category.</p>
          </div>
        )}
      </div>

      {/* Detail / Enquiry Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-lg bg-card rounded-b-3xl shadow-2xl animate-fade-in-up flex flex-col max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top drag handle */}
            <div className="pt-4 pb-2 px-6">
              <div className="w-10 h-1 bg-border rounded-full mx-auto" />
            </div>

            {/* Scrollable inner content */}
            <div className="px-6 pb-6 flex flex-col gap-4">

            {/* Icon + title */}
            <div className="flex items-start gap-4 mb-4">
              <div className={`w-14 h-14 rounded-2xl ${colors.bg} border ${colors.border} flex items-center justify-center text-3xl shrink-0`}>
                {selected.icon}
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-foreground leading-tight">{selected.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.pill}`}>
                    {selected.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" /> {selected.duration}
                  </span>
                </div>
              </div>
              <button onClick={closeModal} className="ml-auto p-1.5 rounded-full hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-5">{selected.description}</p>

            {/* Sheba AI response */}
            {enquiryText && (
              <div className={`${colors.bg} border ${colors.border} rounded-xl p-4 mb-4 space-y-2`}>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="text-primary-foreground text-[9px] font-bold">S</span>
                  </div>
                  <span className="text-xs font-semibold text-primary">Sheba says</span>
                  {speaking && <Volume2 className="w-3 h-3 text-primary animate-pulse ml-auto" />}
                </div>
                <p className="text-sm text-foreground leading-relaxed">{enquiryText}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1 text-xs h-7 -ml-1"
                  onClick={() => speak(enquiryText, language)}
                  disabled={speaking}
                >
                  <Volume2 className="w-3 h-3" /> Read Again
                </Button>
              </div>
            )}

            {/* Action button */}
            <Button
              className="w-full h-12 gap-2"
              onClick={askSheba}
              disabled={enquiryLoading}
            >
              {enquiryLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Asking Sheba…
                </>
              ) : (
                <>
                  <div className="w-4 h-4 rounded-full bg-primary-foreground/30 flex items-center justify-center text-[8px] font-bold">S</div>
                  {enquiryText ? "Ask Again" : "Ask Sheba About This"}
                </>
              )}
            </Button>
            </div>{/* end scrollable inner content */}
          </div>
        </div>
      )}
    </Layout>
  );
}
