import { useState } from "react";
import { motion } from "framer-motion";
import { Utensils, Camera, CheckCircle2, Trash2, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MealEntry {
  id: string;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  status: string;
  advice?: string;
  imageUrl?: string;
  time: string;
}

interface CompanionDietPanelProps {
  onSpeak: (text: string) => void;
  onMealAdded?: (calories: number) => void;
}

function parseFoodAnalysis(text: string): Partial<MealEntry> {
  const calMatch = text.match(/(\d{2,4})\s*(?:kkal|kcal|kaloriya|calories?)/i);
  const jsonMatch = text.match(/\{[\s\S]*?\}/);
  if (jsonMatch) {
    try {
      const j = JSON.parse(jsonMatch[0]);
      return {
        name: j.name || j.food || j.taom || "Taom",
        calories: Number(j.calories || j.kaloriya || j.kcal) || 0,
        protein: j.protein,
        carbs: j.carbs || j.carbs_g,
        fat: j.fat || j.fat_g,
        status: j.status || j.holat || "Tahlil qilindi",
        advice: j.advice || j.tavsiya,
      };
    } catch { /* fall through */ }
  }
  const nameMatch = text.match(/(?:taom|nomi|name)[:\s]+([^\n.]+)/i);
  return {
    name: nameMatch?.[1]?.trim() || "Taom",
    calories: calMatch ? parseInt(calMatch[1], 10) : 250,
    status: text.toLowerCase().includes("sog'lom") ? "Sog'lom" : "O'rtacha",
    advice: text.slice(0, 200),
  };
}

const STORAGE_MEALS = "medi_companion_meals_v1";

const CompanionDietPanel = ({ onSpeak, onMealAdded }: CompanionDietPanelProps) => {
  const [foodImage, setFoodImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<MealEntry | null>(null);
  const [meals, setMeals] = useState<MealEntry[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_MEALS);
      const d = raw ? JSON.parse(raw) : [];
      const today = new Date().toDateString();
      return d.filter((m: MealEntry) => new Date(m.time).toDateString() === today);
    } catch { return []; }
  });

  const totalCalories = meals.reduce((s, m) => s + m.calories, 0);
  const dailyGoal = 2000;

  const saveMeals = (list: MealEntry[]) => {
    setMeals(list);
    try {
      const raw = localStorage.getItem(STORAGE_MEALS);
      const all: MealEntry[] = raw ? JSON.parse(raw) : [];
      const today = new Date().toDateString();
      const other = all.filter((m) => new Date(m.time).toDateString() !== today);
      localStorage.setItem(STORAGE_MEALS, JSON.stringify([...other, ...list]));
    } catch { /* ignore */ }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setFoodImage(dataUrl);
      setAnalyzing(true);
      setResult(null);
      onSpeak("Taomni diqqat bilan ko'rib chiqyapman. Bir oz kuting...");

      try {
        const { data, error } = await supabase.functions.invoke("ai-chat", {
          body: {
            userMessage: `Bu ovqat rasmini tahlil qil. Faqat quyidagi JSON formatda javob ber, boshqa matn qo'shma:
{"name":"taom nomi","calories":300,"protein":15,"carbs":40,"fat":10,"status":"Sog'lom yoki Og'ir","advice":"qisqa tavsiya o'zbek tilida"}`,
            attachmentUrl: dataUrl,
            attachmentType: "image",
            messages: [],
          },
        });

        if (error) throw error;
        const parsed = parseFoodAnalysis(data?.response || "");
        const entry: MealEntry = {
          id: crypto.randomUUID(),
          name: parsed.name || "Taom",
          calories: parsed.calories || 250,
          protein: parsed.protein,
          carbs: parsed.carbs,
          fat: parsed.fat,
          status: parsed.status || "Tahlil qilindi",
          advice: parsed.advice,
          imageUrl: dataUrl,
          time: new Date().toISOString(),
        };
        setResult(entry);
        const next = [...meals, entry];
        saveMeals(next);
        onMealAdded?.(entry.calories);
        onSpeak(`${entry.name} — taxminan ${entry.calories} kaloriya. ${entry.status === "Sog'lom" ? "Juda yaxshi tanlov!" : "Ehtiyot bo'ling, biroz ko'proq harakat qiling."}`);
        toast.success("Ovqat tahlil qilindi!");
      } catch {
        toast.error("AI tahlil vaqtincha ishlamadi. Qayta urinib ko'ring.");
        onSpeak("Kechirasiz, hozir tahlil qila olmadim. Birozdan keyin qayta urinib ko'ring.");
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearToday = () => {
    saveMeals([]);
    setResult(null);
    setFoodImage(null);
    toast("Bugungi ratsion tozalandi");
  };

  return (
    <motion.div
      key="diet"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-card space-y-6"
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
            <Utensils size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Kunlik Ratsion AI</h3>
            <p className="text-sm text-muted-foreground">Rasmga oling — kaloriya avtomatik hisoblanadi</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-secondary">
          <Flame size={18} className="text-orange-500" />
          <span className="font-bold">{totalCalories}</span>
          <span className="text-muted-foreground text-sm">/ {dailyGoal} kkal</span>
        </div>
      </div>

      <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500"
          style={{ width: `${Math.min(100, (totalCalories / dailyGoal) * 100)}%` }}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        <label className="flex-1 border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer min-h-[200px] relative overflow-hidden group">
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleUpload} />
          {foodImage ? (
            <>
              <img src={foodImage} alt="Food" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
              <div className="z-10 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2">
                <Camera size={16} /> Boshqa rasm
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-4">
                <Camera size={32} />
              </div>
              <p className="font-semibold text-foreground">Ovqat rasmini yuklang yoki rasmga oling</p>
              <p className="text-xs text-muted-foreground mt-2">AI kaloriya, protein va tavsiyani hisoblaydi</p>
            </>
          )}
        </label>

        <div className="flex-1 flex flex-col">
          {analyzing ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-secondary/50 rounded-3xl">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="font-medium animate-pulse">AI tahlil qilmoqda...</p>
            </div>
          ) : result ? (
            <div className="flex-1 p-6 bg-secondary/30 rounded-3xl border border-border space-y-3">
              <div className="flex items-center gap-2 text-medical-green font-semibold">
                <CheckCircle2 size={20} /> Tahlil yakunlandi
              </div>
              <h4 className="text-2xl font-bold">{result.calories} <span className="text-lg text-muted-foreground font-normal">kkal</span></h4>
              <p className="font-medium">{result.name}</p>
              {(result.protein || result.carbs || result.fat) && (
                <div className="flex gap-3 text-xs text-muted-foreground">
                  {result.protein != null && <span>Oqsil: {result.protein}g</span>}
                  {result.carbs != null && <span>Ugl: {result.carbs}g</span>}
                  {result.fat != null && <span>Yog': {result.fat}g</span>}
                </div>
              )}
              <div className={`px-4 py-2 rounded-xl text-sm font-semibold inline-flex w-max ${
                result.status.includes("Sog") ? "bg-medical-green-light text-medical-green" : "bg-orange-500/15 text-orange-600"
              }`}>
                {result.status}
              </div>
              {result.advice && <p className="text-sm text-muted-foreground">{result.advice}</p>}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-secondary/50 rounded-3xl border border-dashed text-center">
              <Utensils size={32} className="text-muted-foreground mb-3 opacity-50" />
              <p className="text-muted-foreground text-sm">Natija uchun ovqat rasmini yuklang</p>
            </div>
          )}
        </div>
      </div>

      {meals.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm">Bugungi ovqatlar ({meals.length})</h4>
            <button onClick={clearToday} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
              <Trash2 size={12} /> Tozalash
            </button>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {meals.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl text-sm">
                <span className="font-medium truncate flex-1">{m.name}</span>
                <span className="text-orange-500 font-bold shrink-0 ml-2">{m.calories} kkal</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CompanionDietPanel;
