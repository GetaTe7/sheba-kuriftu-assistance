import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import AdminAuth from "@/components/AdminAuth";
import {
  Settings, Plus, Trash2, BookOpen, HelpCircle,
  Eye, Loader2, LogOut, AlertTriangle, RefreshCw, Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchCulturalTips, fetchFaqs, fetchAccessibilityCues,
  addCulturalTip, deleteCulturalTip, addFaq, deleteFaq,
} from "@/services/api";
import { culturalTips as seedTips, resortFAQs as seedFaqs, accessibilityCues as seedCues } from "@/data/seedData";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

type Tab = "tips" | "faqs" | "cues";

interface Tip  { id: string; title: string; description: string; category: string; }
interface Faq  { id: string; question: string; answer: string; category: string; }
interface Cue  { id: string; scene: string; description: string; obstacles: string[]; }

const PROPERTIES = [
  { value: "general",  label: "General (All Properties)" },
  { value: "bishoftu", label: "Kuriftu Bishoftu" },
  { value: "entoto",   label: "Kuriftu Entoto" },
  { value: "bahirdar", label: "Kuriftu Bahir Dar" },
  { value: "adama",    label: "Kuriftu Adama" },
];

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [tab, setTab] = useState<Tab>("tips");
  const [tips, setTips] = useState<Tip[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [cues, setCues] = useState<Cue[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  // Add-form state
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle]             = useState("");
  const [newDesc, setNewDesc]               = useState("");
  const [newCategory, setNewCategory]       = useState("");
  const [newProperty, setNewProperty]       = useState("general");
  const [saving, setSaving]                 = useState(false);

  // Auth check on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthenticated(!!session);
      if (session) loadData();
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, session) => {
      setAuthenticated(!!session);
      if (session) { setLoading(true); loadData(); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadData = () => {
    setLoading(true);
    Promise.all([fetchCulturalTips(), fetchFaqs(), fetchAccessibilityCues()])
      .then(([t, f, c]) => {
        const hasTips = t && t.length > 0;
        const hasFaqs = f && f.length > 0;
        const hasCues = c && c.length > 0;

        setTips(hasTips ? t : seedTips);
        setFaqs(hasFaqs ? f : seedFaqs);
        setCues(hasCues ? c as Cue[] : seedCues);
        setUsingFallback(!hasTips && !hasFaqs && !hasCues);
      })
      .catch(() => {
        setTips(seedTips);
        setFaqs(seedFaqs);
        setCues(seedCues);
        setUsingFallback(true);
      })
      .finally(() => setLoading(false));
  };

  const resetForm = () => {
    setNewTitle(""); setNewDesc(""); setNewCategory(""); setNewProperty("general");
    setShowForm(false);
  };

  const handleAddTip = async () => {
    if (!newTitle.trim() || !newDesc.trim()) {
      toast.error("Please fill in the title and description.");
      return;
    }
    setSaving(true);
    try {
      const tip = await addCulturalTip({
        title: newTitle, description: newDesc,
        category: newCategory || "General", resort_property: newProperty,
      });
      setTips((prev) => [...prev, tip]);
      resetForm();
      toast.success("Cultural tip added successfully.");
    } catch {
      toast.error("Failed to save tip. Check your Supabase connection.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddFaq = async () => {
    if (!newTitle.trim() || !newDesc.trim()) {
      toast.error("Please fill in the question and answer.");
      return;
    }
    setSaving(true);
    try {
      const faq = await addFaq({
        question: newTitle, answer: newDesc,
        category: newCategory || "General", resort_property: newProperty,
      });
      setFaqs((prev) => [...prev, faq]);
      resetForm();
      toast.success("FAQ added successfully.");
    } catch {
      toast.error("Failed to save FAQ. Check your Supabase connection.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTip = async (id: string) => {
    try {
      await deleteCulturalTip(id);
      setTips((prev) => prev.filter((t) => t.id !== id));
      toast.success("Tip deleted.");
    } catch {
      toast.error("Failed to delete tip.");
    }
  };

  const handleDeleteFaq = async (id: string) => {
    try {
      await deleteFaq(id);
      setFaqs((prev) => prev.filter((f) => f.id !== id));
      toast.success("FAQ deleted.");
    } catch {
      toast.error("Failed to delete FAQ.");
    }
  };

  const adminTabs = [
    { key: "tips" as Tab, label: "Cultural Tips", icon: BookOpen, count: tips.length },
    { key: "faqs" as Tab, label: "FAQs",          icon: HelpCircle, count: faqs.length },
    { key: "cues" as Tab, label: "Accessibility", icon: Eye,        count: cues.length },
  ];

  // ── Not authenticated ────────────────────────────────────────────────────
  if (!authenticated) {
    return <AdminAuth onAuthenticated={() => {}} />;
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-10 w-52 rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-primary" />
            <h1 className="font-display text-2xl font-semibold text-foreground">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
            <Button
              variant="ghost" size="sm"
              onClick={() => supabase.auth.signOut()}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </div>

        {/* Fallback warning */}
        {usingFallback && (
          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-5 text-sm text-amber-700">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Showing local seed data — your Supabase database tables may be empty.
              Any items you add here will be saved to the live database.
            </span>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {adminTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setShowForm(false); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border ${
                tab === t.key
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                tab === t.key ? "bg-white/20" : "bg-muted"
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Add button — only for tips and FAQs */}
        {tab !== "cues" && (
          <Button
            onClick={() => setShowForm(!showForm)}
            variant={showForm ? "secondary" : "outline"}
            className="mb-4 w-full gap-2"
          >
            <Plus className="w-4 h-4" />
            Add {tab === "tips" ? "Cultural Tip" : "FAQ"}
          </Button>
        )}

        {/* Add form */}
        {showForm && (
          <div className="card-luxury mb-5 space-y-3 border border-primary/20 animate-fade-in-up">
            <h3 className="font-semibold text-sm text-foreground mb-1">
              New {tab === "tips" ? "Cultural Tip" : "FAQ"}
            </h3>

            <Input
              placeholder={tab === "tips" ? "Tip title (e.g. Ethiopian Greeting)" : "Question (e.g. What time is check-in?)"}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <Textarea
              placeholder={tab === "tips" ? "Describe the custom or tradition…" : "Write a clear, helpful answer…"}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={3}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Category (e.g. Dining)"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <select
                value={newProperty}
                onChange={(e) => setNewProperty(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground"
              >
                {PROPERTIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={tab === "tips" ? handleAddTip : handleAddFaq}
                className="flex-1 gap-2"
                disabled={saving || !newTitle.trim() || !newDesc.trim()}
              >
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                  : <><Save className="w-4 h-4" /> Save</>
                }
              </Button>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Content list */}
        <div className="space-y-3">

          {/* Cultural Tips */}
          {tab === "tips" && tips.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No cultural tips yet. Add your first tip above.
            </div>
          )}
          {tab === "tips" && tips.map((tip) => (
            <div key={tip.id} className="card-luxury flex items-start justify-between gap-3 animate-fade-in-up">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground">{tip.title}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tip.description}</p>
                <span className="inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {tip.category}
                </span>
              </div>
              <button
                onClick={() => handleDeleteTip(tip.id)}
                className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* FAQs */}
          {tab === "faqs" && faqs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No FAQs yet. Add your first FAQ above.
            </div>
          )}
          {tab === "faqs" && faqs.map((faq) => (
            <div key={faq.id} className="card-luxury flex items-start justify-between gap-3 animate-fade-in-up">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground">{faq.question}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{faq.answer}</p>
                <span className="inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                  {faq.category}
                </span>
              </div>
              <button
                onClick={() => handleDeleteFaq(faq.id)}
                className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Accessibility Cues (read-only view) */}
          {tab === "cues" && cues.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No accessibility cues found in the database.
            </div>
          )}
          {tab === "cues" && cues.map((cue) => (
            <div key={cue.id} className="card-luxury animate-fade-in-up">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-4 h-4 text-primary shrink-0" />
                <p className="font-semibold text-sm text-foreground">{cue.scene}</p>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{cue.description}</p>
              {cue.obstacles.length > 0 && (
                <div className="space-y-1">
                  {cue.obstacles.map((ob, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                      <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                      <span>{ob}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

        </div>
      </div>
    </Layout>
  );
}
