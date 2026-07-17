import { create } from "zustand";

export type CharacterType = "boy" | "girl";
export type CompanionMood = "idle" | "happy" | "exercise" | "sleep" | "eating" | "talking";
export type CompanionMode = "minimized" | "floating" | "expanded" | "scene";
export type SceneMode = "none" | "bedroom" | "kitchen" | "gym" | "welcome";

interface CompanionPosition {
  x: number;
  y: number;
}

interface CompanionState {
  // Character
  character: CharacterType;
  setCharacter: (c: CharacterType) => void;

  // Mood / animation
  mood: CompanionMood;
  setMood: (m: CompanionMood) => void;

  // Display mode
  mode: CompanionMode;
  setMode: (m: CompanionMode) => void;

  // Visibility
  visible: boolean;
  setVisible: (v: boolean) => void;

  // Position on screen
  position: CompanionPosition;
  setPosition: (p: CompanionPosition) => void;

  // Speech
  isSpeaking: boolean;
  isListening: boolean;
  speechText: string;
  audioLevel: number;
  speak: (text: string, mood?: CompanionMood) => void;
  stopSpeaking: () => void;
  setListening: (v: boolean) => void;
  setAudioLevel: (v: number) => void;
  setSpeechText: (t: string) => void;

  // Scene
  sceneMode: SceneMode;
  setSceneMode: (s: SceneMode) => void;

  // Panel
  panelOpen: boolean;
  setPanelOpen: (v: boolean) => void;

  // Mouse tracking
  mousePosition: { x: number; y: number };
  setMousePosition: (p: { x: number; y: number }) => void;
}

const CHAR_STORAGE = "medi_companion_character_v1";
const POS_STORAGE = "medi_companion_position_v1";

function loadCharacter(): CharacterType {
  try {
    const s = localStorage.getItem(CHAR_STORAGE);
    if (s === "boy" || s === "girl") return s;
  } catch { /* ignore */ }
  return "boy";
}

function loadPosition(): CompanionPosition {
  try {
    const raw = localStorage.getItem(POS_STORAGE);
    if (raw) {
      const p = JSON.parse(raw);
      if (typeof p.x === "number" && typeof p.y === "number") return p;
    }
  } catch { /* ignore */ }
  return { x: window.innerWidth - 200, y: window.innerHeight - 350 };
}

export const useCompanionStore = create<CompanionState>((set) => ({
  character: loadCharacter(),
  setCharacter: (c) => {
    localStorage.setItem(CHAR_STORAGE, c);
    set({ character: c });
  },

  mood: "idle",
  setMood: (mood) => set({ mood }),

  mode: "floating",
  setMode: (mode) => set({ mode }),

  visible: true,
  setVisible: (visible) => set({ visible }),

  position: loadPosition(),
  setPosition: (position) => {
    localStorage.setItem(POS_STORAGE, JSON.stringify(position));
    set({ position });
  },

  isSpeaking: false,
  isListening: false,
  speechText: "",
  audioLevel: 0,
  speak: (text, mood) =>
    set({
      speechText: text,
      isSpeaking: true,
      ...(mood ? { mood } : {}),
    }),
  stopSpeaking: () => set({ isSpeaking: false }),
  setSpeechText: (speechText) => set({ speechText }),
  setListening: (isListening) => set({ isListening }),
  setAudioLevel: (audioLevel) => set({ audioLevel }),

  sceneMode: "none",
  setSceneMode: (sceneMode) => set({ sceneMode }),

  panelOpen: false,
  setPanelOpen: (panelOpen) => set({ panelOpen }),

  mousePosition: { x: 0, y: 0 },
  setMousePosition: (mousePosition) => set({ mousePosition }),
}));
