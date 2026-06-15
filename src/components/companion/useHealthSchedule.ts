import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export interface HealthSchedule {
  sleepTime: string;
  wakeTime: string;
  breakfastTime: string;
  lunchTime: string;
  dinnerTime: string;
  active: boolean;
}

const STORAGE_KEY = "medi_health_schedule_v1";

const DEFAULT: HealthSchedule = {
  sleepTime: "22:30",
  wakeTime: "06:00",
  breakfastTime: "08:00",
  lunchTime: "13:00",
  dinnerTime: "19:00",
  active: false,
};

function loadSchedule(): HealthSchedule {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT };
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function formatTimeLabel(key: string): string {
  const labels: Record<string, string> = {
    sleep: "Uxlash vaqti",
    wake: "Uyg'onish vaqti",
    breakfast: "Nonushta",
    lunch: "Tushlik",
    dinner: "Kechki ovqat",
  };
  return labels[key] || key;
}

export const useHealthSchedule = (onReminder?: (message: string, type: string) => void) => {
  const [schedule, setSchedule] = useState<HealthSchedule>(loadSchedule);
  const firedRef = useRef<Set<string>>(new Set());

  const persist = useCallback((next: HealthSchedule) => {
    setSchedule(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const update = useCallback(
    (patch: Partial<HealthSchedule>) => {
      persist({ ...schedule, ...patch });
    },
    [schedule, persist]
  );

  const toggleActive = useCallback(() => {
    const next = { ...schedule, active: !schedule.active };
    persist(next);
    firedRef.current.clear();
    if (next.active) {
      toast.success("Rejim nazorati yoqildi! Hamroh sizni vaqtida eslatadi.");
    } else {
      toast("Rejim nazorati o'chirildi.");
    }
    return next.active;
  }, [schedule, persist]);

  useEffect(() => {
    if (!schedule.active) return;

    const check = () => {
      const now = nowMinutes();
      const today = new Date().toDateString();
      const slots: { key: string; time: string; msg: string }[] = [
        { key: "wake", time: schedule.wakeTime, msg: "Ertalab salom! Uyg'onish vaqti keldi. Keling, kunni faol boshlaymiz!" },
        { key: "breakfast", time: schedule.breakfastTime, msg: "Nonushta vaqti! Sog'lom ovqatlanish kuningizni yaxshi boshlang." },
        { key: "lunch", time: schedule.lunchTime, msg: "Tushlik vaqti! Ovqatlanish vaqtingiz keldi." },
        { key: "dinner", time: schedule.dinnerTime, msg: "Kechki ovqat vaqti! Yengil va foydali taom tanlang." },
        { key: "sleep", time: schedule.sleepTime, msg: "Uxlash vaqti yaqin! Telefonni qo'ying va dam oling." },
      ];

      for (const slot of slots) {
        const id = `${today}-${slot.key}-${slot.time}`;
        if (firedRef.current.has(id)) continue;
        if (Math.abs(now - timeToMinutes(slot.time)) <= 0) {
          firedRef.current.add(id);
          toast.info(formatTimeLabel(slot.key), { description: slot.msg, duration: 8000 });
          if (Notification.permission === "granted") {
            new Notification("Sog'lom Hamroh — " + formatTimeLabel(slot.key), { body: slot.msg });
          }
          onReminder?.(slot.msg, slot.key);
        }
      }
    };

    const id = setInterval(check, 30_000);
    check();
    return () => clearInterval(id);
  }, [schedule, onReminder]);

  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  return { schedule, update, toggleActive };
};
