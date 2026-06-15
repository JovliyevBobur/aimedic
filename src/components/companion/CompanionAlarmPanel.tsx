import { motion } from "framer-motion";
import { Moon, Sun, Clock, Bell, BellOff, Coffee, UtensilsCrossed } from "lucide-react";
import type { HealthSchedule } from "./useHealthSchedule";

interface CompanionAlarmPanelProps {
  schedule: HealthSchedule;
  onUpdate: (patch: Partial<HealthSchedule>) => void;
  onToggle: () => boolean;
}

const CompanionAlarmPanel = ({ schedule, onUpdate, onToggle }: CompanionAlarmPanelProps) => {
  const fields: { key: keyof HealthSchedule; label: string; icon: React.ReactNode }[] = [
    { key: "wakeTime", label: "Uyg'onish vaqti", icon: <Sun size={16} /> },
    { key: "breakfastTime", label: "Nonushta", icon: <Coffee size={16} /> },
    { key: "lunchTime", label: "Tushlik", icon: <UtensilsCrossed size={16} /> },
    { key: "dinnerTime", label: "Kechki ovqat", icon: <UtensilsCrossed size={16} /> },
    { key: "sleepTime", label: "Uxlash vaqti", icon: <Moon size={16} /> },
  ];

  return (
    <motion.div
      key="alarm"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-card"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
          <Clock size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">Kunlik Rejim Nazorati</h3>
          <p className="text-sm text-muted-foreground">Uxlash, uyg'onish va ovqatlanish vaqtlarini hamroh nazorat qiladi</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {fields.map(({ key, label, icon }) => (
          <div key={key} className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              {icon} {label}
            </label>
            <input
              type="time"
              value={schedule[key] as string}
              onChange={(e) => onUpdate({ [key]: e.target.value })}
              disabled={schedule.active}
              className="w-full text-2xl font-display font-bold bg-secondary/50 border border-border rounded-2xl p-3 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>
        ))}
      </div>

      {schedule.active && (
        <div className="mb-6 p-4 rounded-2xl bg-medical-green-light/30 border border-medical-green/20 text-sm text-medical-green flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-medical-green animate-pulse" />
          Hamroh faol nazoratda — vaqtida eslatmalar yuboriladi
        </div>
      )}

      <button
        onClick={onToggle}
        className={`w-full py-4 rounded-2xl text-lg font-bold transition-all shadow-md active:scale-[0.98] flex justify-center items-center gap-2 ${
          schedule.active
            ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            : "gradient-primary text-white hover:opacity-90"
        }`}
      >
        {schedule.active ? (
          <><BellOff size={20} /> Nazoratni O'chirish</>
        ) : (
          <><Bell size={20} /> Rejim Nazoratini Yoqish</>
        )}
      </button>
    </motion.div>
  );
};

export default CompanionAlarmPanel;
