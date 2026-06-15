import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Dumbbell, HeartPulse, Play, Square, Camera, Trophy } from "lucide-react";
import { Pose, POSE_CONNECTIONS } from "@mediapipe/pose";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Exercise {
  id: string;
  name: string;
  time: string;
  cals: string;
  icon: React.ReactNode;
  type: "squat" | "jumping" | "arms";
  targetReps: number;
}

const EXERCISES: Exercise[] = [
  { id: "squat", name: "O'tirish (Squat)", time: "3 min", cals: "~80 kkal", icon: <Dumbbell size={20} />, type: "squat", targetReps: 10 },
  { id: "jump", name: "Sakrash mashqi", time: "2 min", cals: "~60 kkal", icon: <Activity size={20} />, type: "jumping", targetReps: 15 },
  { id: "arms", name: "Qo'llar ko'tarish", time: "2 min", cals: "~40 kkal", icon: <HeartPulse size={20} />, type: "arms", targetReps: 12 },
];

interface CompanionFitnessPanelProps {
  onSpeak: (text: string) => void;
  onExerciseStart: () => void;
  onExerciseEnd: () => void;
}

function angle(a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }): number {
  const rad = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let deg = (rad * 180) / Math.PI;
  if (deg < 0) deg += 360;
  return deg > 180 ? 360 - deg : deg;
}

const CompanionFitnessPanel = ({ onSpeak, onExerciseStart, onExerciseEnd }: CompanionFitnessPanelProps) => {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseRef = useRef<Pose | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const repStateRef = useRef<"up" | "down">("up");
  const repsRef = useRef(0);
  const startTimeRef = useRef<number>(0);

  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [reps, setReps] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [phase, setPhase] = useState<string>("Tayyor");

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    poseRef.current?.close();
    poseRef.current = null;
    setCameraReady(false);
  }, []);

  const saveSession = useCallback(async (exercise: Exercise, completedReps: number, durationSec: number) => {
    if (!user) return;
    const accuracy = Math.min(100, Math.round((completedReps / exercise.targetReps) * 100));
    await supabase.from("rehab_sessions").insert({
      user_id: user.id,
      exercise_name: exercise.name,
      completed_reps: completedReps,
      total_reps: exercise.targetReps,
      duration_seconds: durationSec,
      accuracy_score: accuracy,
      feedback_log: { source: "companion_pose", type: exercise.type },
    });
  }, [user]);

  const finishExercise = useCallback(async () => {
    const ex = activeExercise;
    const count = repsRef.current;
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    stopCamera();
    setActiveExercise(null);
    onExerciseEnd();
    if (ex) {
      await saveSession(ex, count, duration);
      toast.success(`${ex.name} yakunlandi! ${count} takror.`);
      onSpeak(count >= ex.targetReps
        ? `Ajoyib! ${count} ta mashqni muvaffaqiyatli bajardingiz! Siz haqiqiy chempionsiz!`
        : `${count} ta mashq bajarildi. Yaxshi boshlang'ich! Ertaga yana davom etamiz.`);
    }
    setReps(0);
    repsRef.current = 0;
    setPhase("Tayyor");
  }, [activeExercise, stopCamera, onExerciseEnd, onSpeak, saveSession]);

  const startExercise = useCallback(async (exercise: Exercise) => {
    stopCamera();
    setActiveExercise(exercise);
    setReps(0);
    repsRef.current = 0;
    repStateRef.current = "up";
    startTimeRef.current = Date.now();
    onExerciseStart();
    onSpeak(`Keling, ${exercise.name} mashqini boshlaymiz! Maqsad — ${exercise.targetReps} marta. Men sizni kuzataman!`);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const pose = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });
      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults((results) => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        if (results.poseLandmarks) {
          drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: "#00d4aa", lineWidth: 2 });
          drawLandmarks(ctx, results.poseLandmarks, { color: "#ff0066", lineWidth: 1, radius: 3 });

          const lm = results.poseLandmarks;
          const ex = exercise;

          if (ex.type === "squat" && lm[23] && lm[25] && lm[27] && lm[24] && lm[26] && lm[28]) {
            const leftKnee = angle(lm[23], lm[25], lm[27]);
            const rightKnee = angle(lm[24], lm[26], lm[28]);
            const knee = (leftKnee + rightKnee) / 2;
            if (knee < 100 && repStateRef.current === "up") {
              repStateRef.current = "down";
              setPhase("Pastga...");
            } else if (knee > 155 && repStateRef.current === "down") {
              repStateRef.current = "up";
              repsRef.current += 1;
              setReps(repsRef.current);
              setPhase(`${repsRef.current} takror!`);
              if (repsRef.current >= ex.targetReps) {
                setTimeout(() => finishExercise(), 800);
              }
            }
          }

          if (ex.type === "arms" && lm[11] && lm[13] && lm[15] && lm[12] && lm[14] && lm[16]) {
            const leftArm = angle(lm[11], lm[13], lm[15]);
            const rightArm = angle(lm[12], lm[14], lm[16]);
            const arm = (leftArm + rightArm) / 2;
            if (arm > 150 && repStateRef.current === "down") {
              repStateRef.current = "up";
              repsRef.current += 1;
              setReps(repsRef.current);
              setPhase(`${repsRef.current} takror!`);
            } else if (arm < 60 && repStateRef.current === "up") {
              repStateRef.current = "down";
              setPhase("Qo'llarni ko'taring...");
            }
          }

          if (ex.type === "jumping" && lm[23] && lm[25] && lm[27]) {
            const hipY = (lm[23].y + lm[24].y) / 2;
            if (hipY < 0.42 && repStateRef.current === "up") {
              repStateRef.current = "down";
              repsRef.current += 1;
              setReps(repsRef.current);
              setPhase(`${repsRef.current} sakrash!`);
              if (repsRef.current >= ex.targetReps) {
                setTimeout(() => finishExercise(), 800);
              }
            } else if (hipY > 0.52) {
              repStateRef.current = "up";
            }
          }
        }
        ctx.restore();
      });

      poseRef.current = pose;

      const loop = async () => {
        if (!poseRef.current || !videoRef.current || videoRef.current.paused) return;
        await poseRef.current.send({ image: videoRef.current });
        requestAnimationFrame(loop);
      };
      loop();
      setCameraReady(true);
    } catch {
      toast.error("Kameraga ruxsat bering yoki qurilmangizni tekshiring.");
      onSpeak("Kamerani yoqa olmadim. Iltimos, brauzer sozlamalaridan kamera ruxsatini bering.");
      setActiveExercise(null);
      onExerciseEnd();
    }
  }, [stopCamera, onExerciseStart, onExerciseEnd, onSpeak, finishExercise]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  return (
    <motion.div
      key="fitness"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-card"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-medical-blue-light text-medical-blue flex items-center justify-center">
          <Activity size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">Badantarbiya AI</h3>
          <p className="text-sm text-muted-foreground">Kamera orqali mashqlarni kuzatadi va sanaydi</p>
        </div>
      </div>

      {activeExercise ? (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-[320px]">
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" playsInline muted />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white">
                <Camera className="animate-pulse mr-2" /> Kamera ochilmoqda...
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary rounded-2xl">
            <div>
              <p className="font-bold text-lg">{activeExercise.name}</p>
              <p className="text-sm text-muted-foreground">{phase}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-display font-bold text-primary">{reps}</p>
              <p className="text-xs text-muted-foreground">/ {activeExercise.targetReps}</p>
            </div>
          </div>

          <button
            onClick={finishExercise}
            className="w-full py-3 rounded-2xl bg-destructive text-destructive-foreground font-bold flex items-center justify-center gap-2"
          >
            <Square size={18} /> To'xtatish
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {EXERCISES.map((ex) => (
              <div key={ex.id} className="flex items-center justify-between p-4 bg-secondary rounded-2xl border border-border/50 hover:border-primary/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                    {ex.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">{ex.name}</h4>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>{ex.time}</span>
                      <span>{ex.cals}</span>
                      <span className="text-primary">{ex.targetReps} takror</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => startExercise(ex)}
                  className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                >
                  <Play size={20} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-gradient-to-br from-primary/10 to-transparent p-4 rounded-2xl border border-primary/20 flex gap-4 items-center">
            <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
              <Trophy size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm">MediaPipe AI kuzatuvi</p>
              <p className="text-xs text-muted-foreground mt-0.5">Harakatlaringizni real vaqtda tahlil qiladi va takror sanaydi.</p>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default CompanionFitnessPanel;
