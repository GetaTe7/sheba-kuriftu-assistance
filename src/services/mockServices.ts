import { culturalTips, resortFAQs } from "@/data/seedData";
import type { ConversationMessage } from "@/data/seedData";

const mockTranslations: Record<string, Record<string, string>> = {
  en: {
    "hello": "Hello! Welcome to Kuriftu.",
    "thank you": "Thank you!",
    "where is the restaurant": "The restaurant is located by the lakeside, just a 2-minute walk from the lobby.",
    "what time is breakfast": "Breakfast is served from 7:00 AM to 10:00 AM at the main restaurant.",
    "can i book a spa": "Of course! Our spa is open from 9 AM to 8 PM. I can help you book a session.",
  },
  am: {
    "hello": "ሰላም! ወደ ኩሪፍቱ እንኳን ደህና መጡ።",
    "thank you": "አመሰግናለሁ!",
    "where is the restaurant": "ምግብ ቤቱ ከሐይቁ ዳርቻ ላይ ይገኛል፣ ከሎቢው 2 ደቂቃ የእግር ጉዞ ነው።",
    "what time is breakfast": "ቁርስ ከጠዋቱ 7:00 እስከ 10:00 ባለው ሰዓት ይቀርባል።",
    "can i book a spa": "በእርግጥ! ስፓ ከጠዋቱ 9 እስከ ምሽት 8 ድረስ ክፍት ነው።",
  },
  om: {
    "hello": "Akkam! Kuriftuu baga nagaan dhuftan.",
    "thank you": "Galatoomaa!",
    "where is the restaurant": "Manni nyaataa qarqara haroo irra jira, lobbiidhaa daqiiqaa 2 miilaan.",
    "what time is breakfast": "Cireen ganama sa'a 7:00 hanga 10:00tti dhiyaata.",
    "can i book a spa": "Ni dandeessa! Spa keenya sa'a 9 hanga 8 galgalaatti banaa dha.",
  },
};

export async function mockTranslate(text: string, from: string, to: string): Promise<string> {
  await new Promise((r) => setTimeout(r, 800));
  const key = text.toLowerCase().trim();
  return mockTranslations[to]?.[key] || `[${to.toUpperCase()}] ${text}`;
}

export async function mockRespond(text: string, language: string): Promise<{
  response: string;
  culturalTip?: string;
}> {
  await new Promise((r) => setTimeout(r, 600));

  const lower = text.toLowerCase();
  let response = "I'd be happy to help you with that. Let me connect you with our front desk for more details.";
  let tipId: string | undefined;

  if (lower.includes("hello") || lower.includes("hi") || lower.includes("greet")) {
    response = "Welcome to Kuriftu Resort! It's wonderful to have you here. How can I make your stay exceptional?";
    tipId = "1";
  } else if (lower.includes("coffee")) {
    response = "Our traditional coffee ceremony is one of Kuriftu's signature experiences. Would you like me to arrange one for you?";
    tipId = "2";
  } else if (lower.includes("eat") || lower.includes("food") || lower.includes("restaurant") || lower.includes("dinner") || lower.includes("lunch")) {
    response = "Our restaurant serves both traditional Ethiopian and international cuisine. The lakeside terrace is especially lovely in the evening.";
    tipId = "3";
  } else if (lower.includes("spa") || lower.includes("massage")) {
    response = "Our spa offers traditional Ethiopian wellness treatments using local oils and herbs. I recommend the highland aromatherapy massage.";
  } else if (lower.includes("time") || lower.includes("clock")) {
    response = "Happy to help with timing! Just remember, Ethiopia has its own time system starting from dawn.";
    tipId = "5";
  } else if (lower.includes("tip") || lower.includes("pay")) {
    response = "Payments can be charged to your room. Our front desk can assist with currency exchange as well.";
    tipId = "6";
  }

  const tip = tipId ? culturalTips.find((t) => t.id === tipId) : undefined;

  return {
    response,
    culturalTip: tip ? `💡 ${tip.title}: ${tip.description}` : undefined,
  };
}

export async function mockTranscribe(_audioBlob: Blob): Promise<string> {
  await new Promise((r) => setTimeout(r, 1200));
  const mockPhrases = [
    "Hello, where is the restaurant?",
    "Can I book a spa treatment?",
    "What time is breakfast?",
    "Tell me about the coffee ceremony",
    "Thank you for your help",
  ];
  return mockPhrases[Math.floor(Math.random() * mockPhrases.length)];
}

export async function mockTextToSpeech(_text: string, _lang: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 500));
  // In production, this would play audio via ElevenLabs or similar
}
