import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { HeartPulse, Clock, Utensils, Dumbbell } from "lucide-react";
import CompanionAvatar3D from "@/components/companion/CompanionAvatar3D";
import CompanionAlarmPanel from "@/components/companion/CompanionAlarmPanel";
import CompanionDietPanel from "@/components/companion/CompanionDietPanel";
import CompanionFitnessPanel from "@/components/companion/CompanionFitnessPanel";
import { useCompanionSpeech, type CharacterType } from "@/components/companion/useCompanionSpeech";
import { useHealthSchedule } from "@/components/companion/useHealthSchedule";
type TabType = "alarm" | "diet" | "fitness";

const CHAR_STORAGE = "medi_companion_character_v1";

const HealthCompanion = () => {
  const [character, setCharacter] = useState<CharacterType>(() => {
    try {
      const s = localStorage.getItem(CHAR_STORAGE);
      if (s === "boy" || s === "girl") return s;
    } catch { /* ignore */ }
    return "boy";
  });
  const [activeTab, setActiveTab] = useState<TabType>("alarm");

  const { speechText, isSpeaking, mood, setMood, speak } = useCompanionSpeech(character);

  const onReminder = useCallback(
    (msg: string) => speak(msg, "happy"),
    [speak]
  );

  const { schedule, update, toggleActive } = useHealthSchedule(onReminder);

  const selectCharacter = (c: CharacterType) => {
    setCharacter(c);
    localStorage.setItem(CHAR_STORAGE, c);
  };

  useEffect(() => {
    if (character === "boy") {
      speak("Salom! Men sizning sog'lom hayot hamrohingizman. Bugun birga zo'r kun o'tkazamiz!");
    } else {
      speak("Assalomu alaykum! Men sizning rejimingizni nazorat qilib, sog'lom turmush tarziga yordam beraman.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character]);

  const handleToggleSchedule = () => {
    const active = toggleActive();
    speak(
      active
        ? "Ajoyib! Endi men sizga uxlash, uyg'onish va ovqatlanish vaqtida eslataman."
        : "Rejim nazorati o'chirildi. Xohlasangiz qayta yoqishingiz mumkin.",
      active ? "happy" : "idle"
    );
    if (active) setMood("happy");
  };

  const tabIntro: Record<TabType, string> = {
    alarm: "Vaqtida uxlash va ovqatlanish — sog'likning asosi!",
    diet: "Nima yeyayotganingizni bilish — eng muhim qadam.",
    fitness: "Harakatda barakat! Keling, birga mashq qilamiz!",
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
          <HeartPulse className="text-primary" /> Sog&apos;liq Hamrohi
        </h2>
        <p className="text-muted-foreground mt-1">
          3D hamrohingiz bilan sog&apos;lom turmush tarzi — uyqu, ovqatlanish va badantarbiyani birga nazorat qiling
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* 3D Character */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-3xl p-4 shadow-card flex flex-col relative overflow-hidden min-h-[480px]">
            <CompanionAvatar3D
              character={character}
              isSpeaking={isSpeaking}
              mood={mood}
              speechText={speechText}
            />

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-md p-1.5 rounded-full border border-border shadow-sm flex gap-1 z-10">
              <button
                onClick={() => selectCharacter("boy")}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  character === "boy" ? "bg-blue-500 text-white shadow-md" : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                O&apos;g&apos;il bola
              </button>
              <button
                onClick={() => selectCharacter("girl")}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  character === "girl" ? "bg-pink-500 text-white shadow-md" : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                Qiz bola
              </button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex bg-secondary p-1 rounded-2xl">
            {([
              { id: "alarm" as const, icon: Clock, label: "Rejim" },
              { id: "diet" as const, icon: Utensils, label: "Ratsion" },
              { id: "fitness" as const, icon: Dumbbell, label: "Mashq" },
            ]).map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveTab(id);
                  speak(tabIntro[id], id === "fitness" ? "exercise" : "idle");
                  if (id === "fitness") setMood("exercise");
                  else if (id === "alarm") setMood("sleep");
                  else setMood("idle");
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={18} /> {label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "alarm" && (
              <CompanionAlarmPanel
                schedule={schedule}
                onUpdate={update}
                onToggle={handleToggleSchedule}
              />
            )}
            {activeTab === "diet" && (
              <CompanionDietPanel
                onSpeak={(text) => speak(text, "happy")}
              />
            )}
            {activeTab === "fitness" && (
              <CompanionFitnessPanel
                onSpeak={(text) => speak(text, "exercise")}
                onExerciseStart={() => setMood("exercise")}
                onExerciseEnd={() => setMood("idle")}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default HealthCompanion;
