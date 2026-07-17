import { Suspense, useCallback, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Float } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import { useCompanionStore } from "@/stores/useCompanionStore";
import { useCompanionDrag } from "@/hooks/useCompanionDrag";
import { useCompanionAI } from "@/hooks/useCompanionAI";
import Character3D from "@/components/3d/Character3D";
import SceneManager from "@/components/scenes/SceneManager";
import CompanionChatBubble from "./CompanionChatBubble";
import CompanionMiniPanel from "./CompanionMiniPanel";

/* ------------------------------------------------------------------ */
/*  Global overlay that renders the 3D companion on top of everything */
/*  Persists across route changes because it lives in App.tsx          */
/* ------------------------------------------------------------------ */

function CompanionScene() {
  const { character, mood, isSpeaking, audioLevel, sceneMode, mousePosition } =
    useCompanionStore();

  return (
    <>
      <ambientLight intensity={0.6} />
      <spotLight
        position={[3, 5, 4]}
        angle={0.35}
        penumbra={0.8}
        intensity={1.2}
        castShadow
      />
      <spotLight
        position={[-3, 4, 2]}
        angle={0.4}
        penumbra={1}
        intensity={0.5}
        color="#aaccff"
      />
      <Environment preset="city" />

      <SceneManager sceneMode={sceneMode} mood={mood} />

      <Float speed={1.5} rotationIntensity={0.06} floatIntensity={0.12}>
        <Character3D
          character={character}
          mood={mood}
          isSpeaking={isSpeaking}
          lookTarget={mousePosition}
          audioLevel={audioLevel}
        />
      </Float>

      <ContactShadows
        position={[0, -0.15, 0]}
        opacity={0.45}
        scale={2.5}
        blur={2.5}
        far={1.2}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Minimised mode — just a pulsing avatar circle                      */
/* ------------------------------------------------------------------ */
function MinimisedButton({
  onClick,
  character,
}: {
  onClick: () => void;
  character: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-xl flex items-center justify-center text-white text-xl font-bold hover:scale-110 active:scale-95 transition-transform ring-2 ring-primary/30 ring-offset-2 ring-offset-background"
    >
      {character === "boy" ? "👦" : "👧"}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Overlay                                                       */
/* ------------------------------------------------------------------ */
const CompanionOverlay = () => {
  const {
    visible,
    mode,
    setMode,
    character,
    speechText,
    isSpeaking,
    isListening,
    setMousePosition,
  } = useCompanionStore();

  const { position, isDragging, dragHandlers } = useCompanionDrag();
  const { speakText, startListening, stopListening } = useCompanionAI();

  /* track mouse for IK */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePosition({ x, y });
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [setMousePosition]);

  if (!visible) return null;

  const isOnLeft = position.x < window.innerWidth / 2;

  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-none"
      style={{ isolation: "isolate" }}
    >
      <AnimatePresence mode="wait">
        {mode === "minimized" ? (
          <motion.div
            key="minimized"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="pointer-events-auto"
            style={{
              position: "absolute",
              left: position.x,
              top: position.y,
            }}
          >
            <MinimisedButton
              onClick={() => setMode("floating")}
              character={character}
            />
          </motion.div>
        ) : (
          <motion.div
            key="floating"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              x: isDragging ? 0 : 0,
            }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: isDragging ? 999 : 300,
              damping: isDragging ? 50 : 25,
            }}
            style={{
              position: "absolute",
              left: position.x,
              top: position.y,
              width: 180,
            }}
            className="flex flex-col items-center"
          >
            {/* speech bubble */}
            <CompanionChatBubble
              text={speechText}
              isSpeaking={isSpeaking}
              isListening={isListening}
              side={isOnLeft ? "left" : "right"}
            />

            {/* 3D canvas — draggable */}
            <div
              {...dragHandlers}
              className="pointer-events-auto rounded-2xl overflow-hidden shadow-2xl border border-white/10 dark:border-slate-700/30"
              style={{
                width: 180,
                height: 220,
                cursor: isDragging ? "grabbing" : "grab",
                background:
                  "linear-gradient(180deg, rgba(30,30,60,0.85) 0%, rgba(20,20,50,0.95) 100%)",
              }}
            >
              <Canvas
                shadows
                camera={{ position: [0, 0.8, 3], fov: 38 }}
                gl={{ antialias: true, alpha: true }}
                style={{ background: "transparent" }}
              >
                <Suspense fallback={null}>
                  <CompanionScene />
                </Suspense>
              </Canvas>
            </div>

            {/* mini panel */}
            <div className="mt-2 w-full">
              <CompanionMiniPanel
                onStartListening={startListening}
                onStopListening={stopListening}
                onSpeak={speakText}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompanionOverlay;
