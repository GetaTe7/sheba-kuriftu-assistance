import Layout from "@/components/Layout";
import { resortExperiences } from "@/data/seedData";
import { Compass, Clock } from "lucide-react";

const categoryColors: Record<string, string> = {
  Culture: "bg-primary/10 text-primary",
  Adventure: "bg-accent/10 text-accent",
  Wellness: "bg-gold/10 text-gold",
  Nature: "bg-forest/10 text-forest",
};

export default function Experiences() {
  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Compass className="w-6 h-6 text-primary" />
          <h1 className="font-display text-2xl font-semibold text-foreground">Kuriftu Experiences</h1>
        </div>
        <p className="text-muted-foreground text-sm mb-6">
          Discover unique experiences that celebrate Ethiopian culture and the beauty of Kuriftu Resort.
        </p>

        <div className="grid gap-4">
          {resortExperiences.map((exp, i) => (
            <div key={exp.id} className="card-luxury animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="flex items-start gap-4">
                <span className="text-3xl">{exp.icon}</span>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-display text-lg font-semibold text-foreground">{exp.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${categoryColors[exp.category] || "bg-muted text-muted-foreground"}`}>
                      {exp.category}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{exp.description}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" /> {exp.duration}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
