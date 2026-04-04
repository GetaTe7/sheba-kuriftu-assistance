import { useState } from "react";
import Layout from "@/components/Layout";
import { useApp } from "@/contexts/AppContext";
import { Settings, Plus, Trash2, BookOpen, HelpCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CulturalTip, ResortFAQ } from "@/data/seedData";

type Tab = "tips" | "faqs" | "cues";

export default function Admin() {
  const { culturalTips, faqs, accessibilityCues, setCulturalTips, setFaqs } = useApp();
  const [tab, setTab] = useState<Tab>("tips");
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const handleAddTip = () => {
    if (!newTitle || !newDesc) return;
    const tip: CulturalTip = { id: Date.now().toString(), title: newTitle, description: newDesc, category: newCategory || "General", language: "en" };
    setCulturalTips([...culturalTips, tip]);
    resetForm();
  };

  const handleAddFaq = () => {
    if (!newTitle || !newDesc) return;
    const faq: ResortFAQ = { id: Date.now().toString(), question: newTitle, answer: newDesc, category: newCategory || "General" };
    setFaqs([...faqs, faq]);
    resetForm();
  };

  const resetForm = () => {
    setNewTitle("");
    setNewDesc("");
    setNewCategory("");
    setShowForm(false);
  };

  const deleteTip = (id: string) => setCulturalTips(culturalTips.filter((t) => t.id !== id));
  const deleteFaq = (id: string) => setFaqs(faqs.filter((f) => f.id !== id));

  const tabs = [
    { key: "tips" as Tab, label: "Cultural Tips", icon: BookOpen, count: culturalTips.length },
    { key: "faqs" as Tab, label: "FAQs", icon: HelpCircle, count: faqs.length },
    { key: "cues" as Tab, label: "Accessibility", icon: Eye, count: accessibilityCues.length },
  ];

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6 text-primary" />
          <h1 className="font-display text-2xl font-semibold text-foreground">Admin Dashboard</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setShowForm(false); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                tab === t.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label} ({t.count})
            </button>
          ))}
        </div>

        {/* Add button */}
        {tab !== "cues" && (
          <Button onClick={() => setShowForm(!showForm)} variant="outline" className="mb-4 w-full">
            <Plus className="w-4 h-4 mr-2" /> Add {tab === "tips" ? "Cultural Tip" : "FAQ"}
          </Button>
        )}

        {/* Add form */}
        {showForm && (
          <div className="card-luxury mb-4 space-y-3">
            <Input placeholder={tab === "tips" ? "Tip title" : "Question"} value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            <Textarea placeholder={tab === "tips" ? "Tip description" : "Answer"} value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
            <Input placeholder="Category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
            <div className="flex gap-2">
              <Button onClick={tab === "tips" ? handleAddTip : handleAddFaq} className="flex-1">Save</Button>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Content list */}
        <div className="space-y-3">
          {tab === "tips" && culturalTips.map((tip) => (
            <div key={tip.id} className="card-luxury flex items-start justify-between">
              <div className="flex-1 mr-3">
                <p className="font-medium text-sm text-foreground">{tip.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{tip.description}</p>
                <span className="badge-cultural mt-2">{tip.category}</span>
              </div>
              <button onClick={() => deleteTip(tip.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
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
              <button onClick={() => deleteFaq(faq.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {tab === "cues" && accessibilityCues.map((cue) => (
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
