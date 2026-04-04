import React, { createContext, useContext, useState, useCallback } from "react";
import type { ConversationMessage, CulturalTip, ResortFAQ, AccessibilityCue } from "@/data/seedData";
import { culturalTips as seedTips, resortFAQs as seedFAQs, accessibilityCues as seedCues } from "@/data/seedData";

interface AppState {
  language: string;
  targetLanguage: string;
  accessibilityMode: boolean;
  conversation: ConversationMessage[];
  culturalTips: CulturalTip[];
  faqs: ResortFAQ[];
  accessibilityCues: AccessibilityCue[];
  isRecording: boolean;
  isProcessing: boolean;
}

interface AppContextType extends AppState {
  setLanguage: (lang: string) => void;
  setTargetLanguage: (lang: string) => void;
  toggleAccessibility: () => void;
  addMessage: (msg: ConversationMessage) => void;
  setRecording: (v: boolean) => void;
  setProcessing: (v: boolean) => void;
  setCulturalTips: (tips: CulturalTip[]) => void;
  setFaqs: (faqs: ResortFAQ[]) => void;
  setAccessibilityCues: (cues: AccessibilityCue[]) => void;
  clearConversation: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    language: "en",
    targetLanguage: "am",
    accessibilityMode: false,
    conversation: [],
    culturalTips: seedTips,
    faqs: seedFAQs,
    accessibilityCues: seedCues,
    isRecording: false,
    isProcessing: false,
  });

  const setLanguage = useCallback((language: string) => setState((s) => ({ ...s, language })), []);
  const setTargetLanguage = useCallback((targetLanguage: string) => setState((s) => ({ ...s, targetLanguage })), []);
  const toggleAccessibility = useCallback(() => setState((s) => ({ ...s, accessibilityMode: !s.accessibilityMode })), []);
  const addMessage = useCallback((msg: ConversationMessage) => setState((s) => ({ ...s, conversation: [...s.conversation, msg] })), []);
  const setRecording = useCallback((isRecording: boolean) => setState((s) => ({ ...s, isRecording })), []);
  const setProcessing = useCallback((isProcessing: boolean) => setState((s) => ({ ...s, isProcessing })), []);
  const setCulturalTips = useCallback((culturalTips: CulturalTip[]) => setState((s) => ({ ...s, culturalTips })), []);
  const setFaqs = useCallback((faqs: ResortFAQ[]) => setState((s) => ({ ...s, faqs })), []);
  const setAccessibilityCues = useCallback((accessibilityCues: AccessibilityCue[]) => setState((s) => ({ ...s, accessibilityCues })), []);
  const clearConversation = useCallback(() => setState((s) => ({ ...s, conversation: [] })), []);

  return (
    <AppContext.Provider value={{ ...state, setLanguage, setTargetLanguage, toggleAccessibility, addMessage, setRecording, setProcessing, setCulturalTips, setFaqs, setAccessibilityCues, clearConversation }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
