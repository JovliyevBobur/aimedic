import { useCallback, useRef, useState } from "react";

export type CharacterType = "boy" | "girl";

const VOICES: Record<CharacterType, { pitch: number; rate: number }> = {
  boy: { pitch: 1.15, rate: 1.05 },
  girl: { pitch: 1.35, rate: 1.0 },
};

export const useCompanionSpeech = (character: CharacterType) => {
  const [speechText, setSpeechText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mood, setMood] = useState<"idle" | "happy" | "exercise" | "sleep">("idle");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string, nextMood: typeof mood = "idle") => {
      setSpeechText(text);
      setMood(nextMood);
      stopSpeaking();

      if (typeof window === "undefined" || !window.speechSynthesis) return;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "uz-UZ";
      utterance.pitch = VOICES[character].pitch;
      utterance.rate = VOICES[character].rate;

      const voices = window.speechSynthesis.getVoices();
      const uzVoice = voices.find((v) => v.lang.startsWith("uz") || v.lang.startsWith("tr") || v.lang.startsWith("ru"));
      if (uzVoice) utterance.voice = uzVoice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        setTimeout(() => setSpeechText(""), 2500);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setTimeout(() => setSpeechText(""), 4000);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [character, stopSpeaking]
  );

  return { speechText, isSpeaking, mood, setMood, speak, stopSpeaking };
};
