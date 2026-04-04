export interface CulturalTip {
  id: string;
  title: string;
  description: string;
  category: string;
  language: string;
}

export interface ResortFAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface ResortExperience {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  icon: string;
}

export interface AccessibilityCue {
  id: string;
  scene: string;
  description: string;
  obstacles: string[];
}

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  originalText: string;
  translatedText?: string;
  language: string;
  culturalTip?: string;
  timestamp: Date;
}

export const culturalTips: CulturalTip[] = [
  {
    id: "1",
    title: "Ethiopian Greeting",
    description: "Greet with a gentle handshake and slight bow. It's common to ask about family before business. Say 'Selam' (ሰላም) for hello.",
    category: "Greetings",
    language: "en",
  },
  {
    id: "2",
    title: "Coffee Ceremony",
    description: "The Ethiopian coffee ceremony is a sacred tradition. It's polite to drink at least three cups — Abol, Tona, and Baraka. Each has spiritual meaning.",
    category: "Dining",
    language: "en",
  },
  {
    id: "3",
    title: "Eating with Hands",
    description: "Eating injera with your right hand is traditional. 'Gursha' — feeding someone by hand — is a gesture of love and respect.",
    category: "Dining",
    language: "en",
  },
  {
    id: "4",
    title: "Removing Shoes",
    description: "Remove shoes when entering a traditional Ethiopian home or place of worship. This shows respect for the space.",
    category: "Etiquette",
    language: "en",
  },
  {
    id: "5",
    title: "Time in Ethiopia",
    description: "Ethiopia uses a unique 12-hour clock starting at dawn (6 AM = 12 o'clock). Ask 'Ethiopian time or European time?' to avoid confusion.",
    category: "Culture",
    language: "en",
  },
  {
    id: "6",
    title: "Tipping Etiquette",
    description: "Tipping 10-15% is appreciated at restaurants. At Kuriftu, gratuity for spa and activity staff is welcomed but not required.",
    category: "Etiquette",
    language: "en",
  },
];

export const resortFAQs: ResortFAQ[] = [
  {
    id: "1",
    question: "What are the check-in and check-out times?",
    answer: "Check-in is at 2:00 PM and check-out is at 11:00 AM. Early check-in and late check-out can be arranged upon request.",
    category: "General",
  },
  {
    id: "2",
    question: "Is Wi-Fi available at the resort?",
    answer: "Yes, complimentary Wi-Fi is available in all rooms and common areas. The password is provided at check-in.",
    category: "Amenities",
  },
  {
    id: "3",
    question: "What dining options are available?",
    answer: "Kuriftu offers traditional Ethiopian cuisine, international dishes, and a lakeside bar. Room service is available from 7 AM to 10 PM.",
    category: "Dining",
  },
  {
    id: "4",
    question: "Are there spa services?",
    answer: "Yes, our spa offers traditional Ethiopian massage, aromatherapy, facials, and wellness treatments. Booking in advance is recommended.",
    category: "Spa",
  },
  {
    id: "5",
    question: "What activities are available?",
    answer: "Guests can enjoy boat rides, cultural tours, bird watching, swimming, spa treatments, and traditional coffee ceremonies.",
    category: "Activities",
  },
  {
    id: "6",
    question: "Is airport transfer available?",
    answer: "Yes, Kuriftu arranges private airport transfers from Addis Ababa Bole International Airport. Please book at least 24 hours in advance.",
    category: "Transport",
  },
];

export const resortExperiences: ResortExperience[] = [
  {
    id: "1",
    title: "Traditional Coffee Ceremony",
    description: "Experience the sacred Ethiopian coffee ceremony with freshly roasted beans, incense, and traditional hospitality.",
    category: "Culture",
    duration: "45 min",
    icon: "☕",
  },
  {
    id: "2",
    title: "Lake Tana Boat Tour",
    description: "Cruise the serene waters of Lake Tana and visit ancient island monasteries with breathtaking views.",
    category: "Adventure",
    duration: "3 hrs",
    icon: "🚤",
  },
  {
    id: "3",
    title: "Ethiopian Cooking Class",
    description: "Learn to prepare injera, doro wot, and other classic Ethiopian dishes with our master chef.",
    category: "Culture",
    duration: "2 hrs",
    icon: "🍳",
  },
  {
    id: "4",
    title: "Spa & Wellness Retreat",
    description: "Relax with traditional Ethiopian massages using local oils and natural ingredients from the highlands.",
    category: "Wellness",
    duration: "90 min",
    icon: "🧖",
  },
  {
    id: "5",
    title: "Bird Watching Safari",
    description: "Discover over 300 bird species in the Ethiopian Rift Valley with an expert naturalist guide.",
    category: "Nature",
    duration: "2 hrs",
    icon: "🦜",
  },
  {
    id: "6",
    title: "Sunset Meditation",
    description: "End your day with guided meditation overlooking the lake as the Ethiopian sun sets over the highlands.",
    category: "Wellness",
    duration: "30 min",
    icon: "🌅",
  },
];

export const accessibilityCues: AccessibilityCue[] = [
  {
    id: "1",
    scene: "Lobby Entrance",
    description: "Spacious open lobby with marble flooring. Reception desk is 15 meters ahead.",
    obstacles: ["Two steps at main entrance — ramp available on the right side"],
  },
  {
    id: "2",
    scene: "Restaurant Area",
    description: "Indoor dining area with traditional Ethiopian seating and standard tables available.",
    obstacles: ["Low mesob tables in the traditional section — standard height tables near windows"],
  },
  {
    id: "3",
    scene: "Pool Area",
    description: "Outdoor pool with surrounding lounge chairs and umbrellas. Bar service nearby.",
    obstacles: ["Wet surfaces around pool edges", "Steps into shallow end — no pool lift available"],
  },
  {
    id: "4",
    scene: "Garden Pathway",
    description: "Landscaped garden with gravel paths leading to lakeside viewpoints.",
    obstacles: ["Uneven gravel surface", "Low-hanging branches near the mango trees"],
  },
];
