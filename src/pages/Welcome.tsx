import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Globe, ArrowRight } from "lucide-react";

const languages = [
  { code: "en", label: "English", native: "English" },
  { code: "am", label: "Amharic", native: "አማርኛ" },
  { code: "om", label: "Afaan Oromo", native: "Afaan Oromoo" },
];

export default function Welcome() {
  const { setLanguage } = useApp();
  const [selected, setSelected] = useState("en");
  const navigate = useNavigate();

  const handleContinue = () => {
    setLanguage(selected);
    navigate("/assistant");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <div className="text-center mb-12 animate-fade-in-up">
        <div className="w-20 h-20 rounded-full bg-primary mx-auto mb-6 flex items-center justify-center">
          <span className="text-primary-foreground font-display text-3xl font-bold">S</span>
        </div>
        <h1 className="font-display text-4xl font-bold text-foreground mb-2">Sheba</h1>
        <p className="text-muted-foreground text-lg">Your Kuriftu Companion</p>
        <p className="text-muted-foreground text-sm mt-1">Voice-first AI cultural guide</p>
      </div>

      <div className="w-full max-w-sm space-y-3 mb-10">
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <Globe className="w-4 h-4" />
          <span className="text-sm font-medium">Select your language</span>
        </div>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setSelected(lang.code)}
            className={`w-full card-luxury flex items-center justify-between transition-all duration-200 cursor-pointer ${
              selected === lang.code
                ? "ring-2 ring-primary"
                : ""
            }`}
          >
            <div>
              <p className="font-medium text-foreground">{lang.label}</p>
              <p className="text-sm text-muted-foreground">{lang.native}</p>
            </div>
            {selected === lang.code && (
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-primary-foreground" />
              </div>
            )}
          </button>
        ))}
      </div>

      <Button onClick={handleContinue} size="lg" className="w-full max-w-sm gap-2 h-14 text-base rounded-xl">
        Continue <ArrowRight className="w-5 h-5" />
      </Button>
    </div>
  );
}
