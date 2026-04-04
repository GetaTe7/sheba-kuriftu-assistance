import Layout from "@/components/Layout";
import { useApp } from "@/contexts/AppContext";
import { Eye, AlertTriangle, ToggleLeft, ToggleRight } from "lucide-react";

export default function Accessibility() {
  const { accessibilityMode, toggleAccessibility, accessibilityCues } = useApp();

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Eye className="w-6 h-6 text-primary" />
            <h1 className="font-display text-2xl font-semibold text-foreground">Accessibility</h1>
          </div>
          <button onClick={toggleAccessibility} className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            {accessibilityMode ? (
              <ToggleRight className="w-8 h-8 text-primary" />
            ) : (
              <ToggleLeft className="w-8 h-8 text-muted-foreground" />
            )}
          </button>
        </div>

        {accessibilityMode ? (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              Scene descriptions and obstacle hints are active. Sheba will provide accessibility cues during voice interactions.
            </p>
            <div className="space-y-4">
              {accessibilityCues.map((cue, i) => (
                <div key={cue.id} className="card-luxury animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">{cue.scene}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{cue.description}</p>
                  {cue.obstacles.length > 0 && (
                    <div className="space-y-2">
                      {cue.obstacles.map((ob, j) => (
                        <div key={j} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                          <span className="text-foreground">{ob}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Enable accessibility mode for scene descriptions and obstacle hints.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
