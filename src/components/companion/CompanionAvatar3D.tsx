import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Float } from "@react-three/drei";
import Character3D from "@/components/3d/Character3D";
import type { CharacterType } from "@/stores/useCompanionStore";

interface CompanionAvatar3DProps {
  character: CharacterType;
  isSpeaking: boolean;
  mood: "idle" | "happy" | "exercise" | "sleep";
  speechText?: string;
}

function Pedestal() {
  return (
    <group position={[0, -0.05, 0]}>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.85, 0.95, 0.12, 32]} />
        <meshStandardMaterial color="#8B6914" roughness={0.7} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.7, 0.78, 0.1, 32]} />
        <meshStandardMaterial color="#A67C00" roughness={0.65} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} receiveShadow>
        <circleGeometry args={[1.2, 32]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Scene({ character, isSpeaking, mood }: CompanionAvatar3DProps) {
  return (
    <>
      <ambientLight intensity={0.55} />
      <spotLight position={[3, 5, 4]} angle={0.35} penumbra={0.8} intensity={1.2} castShadow />
      <spotLight position={[-3, 4, 2]} angle={0.4} penumbra={1} intensity={0.5} color="#aaccff" />
      <Environment preset="city" />
      <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.15}>
        <Character3D 
          character={character} 
          mood={mood} 
          isSpeaking={isSpeaking} 
          lookTarget={{ x: 0, y: 0 }} 
          audioLevel={isSpeaking ? 0.5 : 0} 
        />
      </Float>
      <Pedestal />
      <ContactShadows position={[0, 0, 0]} opacity={0.45} scale={2.5} blur={2.5} far={1.2} />
    </>
  );
}

const CompanionAvatar3D = ({ character, isSpeaking, mood, speechText }: CompanionAvatar3DProps) => {
  return (
    <div className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden bg-gradient-to-b from-slate-900/80 via-slate-800/60 to-slate-900/90">
      <Canvas shadows camera={{ position: [0, 1.2, 3.2], fov: 42 }} gl={{ antialias: true, alpha: true }}>
        <Suspense fallback={null}>
          <Scene character={character} isSpeaking={isSpeaking} mood={mood} />
        </Suspense>
      </Canvas>

      {speechText && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[88%] z-10 pointer-events-none">
          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md text-slate-800 dark:text-slate-100 px-4 py-3 rounded-2xl shadow-xl border border-white/20 text-sm font-medium text-center animate-in fade-in zoom-in-95 duration-300">
            {speechText}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-slate-800 rotate-45 border-r border-b border-white/20" />
          </div>
        </div>
      )}

      {isSpeaking && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-1 bg-primary rounded-full animate-pulse"
              style={{ height: 8 + (i % 3) * 6, animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CompanionAvatar3D;
