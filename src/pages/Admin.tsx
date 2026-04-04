import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Settings, Plus, Trash2, BookOpen, HelpCircle, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetchCulturalTips, fetchFaqs, fetchAccessibilityCues, addCulturalTip, deleteCulturalTip, addFaq, deleteFaq } from "@/services/api";
import { toast } from "sonner";

type Tab = "tips" | "faqs" | "cues";

interface Tip { id: string; title: string; description: string; category: string; }
interface Faq { id: string; question: string; answer: string; category: string; }
interface Cue { id: string; scene: string; description: string; obstacles: string[]; }

export default function Admin() {
  const [tab, setTab] = useState<Tab>("tips");
  const [tips, setTips] = useState<Tip[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [cues, setCues] = useState<Cue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([fetchCulturalTips(), fetchFaqs(), fetchAccessibilityCues()])
      .then(([t, f, c]) => { setTips(t); setFaqs(f); setCues(c); })
      .finally(() => setLoading(false));
  }, []);

  const handleAddTip = async () => {
    if (!newTitle || !newDesc) return;
    setSaving(true);
    try {
      const tip = await addCulturalTip({ title: newTitle, description: newDesc, category: newCategory || "General" });
      setTips([...tips, tip]);
      resetForm();
      toast.success("Cultural tip added");
    } catch { toast.error("Failed to add tip"); }
    finally { setSaving(false); }
  };

  const handleAddFaq = async () => {
    if (!newTitle || !newDesc) return;
    setSaving(true);
    try {
      const faq = await addFaq({ question: newTitle, answer: newDesc, category: newCategory || "General" });
      setFaqs([...faqs, faq]);
      resetForm();
      toast.success("FAQ added");
    } catch { toast.error("Failed to add FAQ"); }
    finally { setSaving(false); }
  };

  const handleDeleteTip = async (id: string) => {
    try { await deleteCulturalTip(id); setTips(tips.filter(t => t.id !== id)); toast.success("Deleted"); }
    catch { toast.error("Failed to delete"); }
  };

  const handleDeleteFaq = async (id: string) => {
    try { await deleteFaq(id); setFaqs(faqs.filter(f => f.id !== id)); toast.success("Deleted"); }
    catch { toast.error("Failed to delete"); }
  };

  const resetForm = () => { setNewTitle(""); setNewDesc(""); setNewCategory(""); setShowForm(false); };

  const tabs = [
    { key: "tips" as Tab, label: "Cultural Tips", icon: BookOpen, count: tips.length },
    { key: "faqs" as Tab, label: "FAQs", icon: HelpCircle, count: faqs.length },
    { key: "cues" as Tab, label: "Accessibility", icon: Eye, count: cues.length },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6 text-primary" />
          <h1 className="font-display text-2xl font-semibold text-foreground">Admin Dashboard</h1>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => { setTab(t.key); setShowForm(false); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${tab === t.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <t.icon className="w-4 h-4" /> {t.label} ({t.count})
            </button>
          ))}
        </div>

        {tab !== "cues" && (
          <Button onClick={() => setShowForm(!showForm)} variant="outline" className="mb-4 w-full">
            <Plus className="w-4 h-4 mr-2" /> Add {tab === "tips" ? "Cultural Tip" : "FAQ"}
          </Button>
        )}

        {showForm && (
          <div className="card-luxury mb-4 space-y-3">
            <Input placeholder={tab === "tips" ? "Tip title" : "Question"} value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            <Textarea placeholder={tab === "tips" ? "Tip description" : "Answer"} value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
            <Input placeholder="Category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
            <div className="flex gap-2">
              <Button onClick={tab === "tips" ? handleAddTip : handleAddFaq} className="flex-1" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save
              </Button>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {tab === "tips" && tips.map((tip) => (
            <div key={tip.id} className="card-luxury flex items-start justify-between">
              <div className="flex-1 mr-3">
                <p className="font-medium text-sm text-foreground">{tip.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{tip.description}</p>
                <span className="badge-cultural mt-2">{tip.category}</span>
              </div>
              <button onClick={() => handleDeleteTip(tip.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {tab === "faqs" && faqs.map((faq) => (
            <div key={faq.id} className="card-luxury flex items-start justify-between">
              <div className="flex-1 mr-3">
                <p className="font-medium text-sm text-foreground">{faq.question}</p>
                <p className="text-xs text-muted-foreground mt-1">{faq.answer}</p>
                <span className="badge-cultural mt-2">{faq.category}</span>
              </div>
              <button onClick={() => handleDeleteFaq(faq.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {tab === "cues" && cues.map((cue) => (
            <div key={cue.id} className="card-luxury">
              <p className="font-medium text-sm text-foreground">{cue.scene}</p>
              <p className="text-xs text-muted-foreground mt-1">{cue.description}</p>
              <div className="mt-2 space-y-1">
                {cue.obstacles.map((ob, i) => (
                  <p key={i} className="text-xs text-accent">⚠ {ob}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
