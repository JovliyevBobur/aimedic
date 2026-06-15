import { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Float } from "@react-three/drei";
import * as THREE from "three";
import type { CharacterType } from "./useCompanionSpeech";

interface CharacterMeshProps {
  character: CharacterType;
  isSpeaking: boolean;
  mood: "idle" | "happy" | "exercise" | "sleep";
}

function CharacterMesh({ character, isSpeaking, mood }: CharacterMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Group>(null);

  const texture = useMemo(() => {
    const tex = new THREE.TextureLoader().load("/companion/characters.png");
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.repeat.set(0.5, 1);
    tex.offset.set(character === "boy" ? 0 : 0.5, 0);
    return tex;
  }, [character]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const g = groupRef.current;
    if (!g) return;

    const breathe = 1 + Math.sin(t * 2) * 0.012;
    g.scale.set(1, breathe, 1);

    if (mood === "exercise") {
      g.position.y = Math.abs(Math.sin(t * 6)) * 0.08;
      g.rotation.y = Math.sin(t * 3) * 0.15;
    } else if (mood === "sleep") {
      g.rotation.z = Math.sin(t * 0.5) * 0.02;
      g.position.y = Math.sin(t) * 0.01;
    } else {
      g.rotation.y = Math.sin(t * 0.6) * 0.08;
      g.position.y = Math.sin(t * 1.2) * 0.02;
    }

    if (headRef.current) {
      headRef.current.rotation.x = isSpeaking ? Math.sin(t * 12) * 0.04 : Math.sin(t * 0.8) * 0.02;
      headRef.current.rotation.z = isSpeaking ? Math.sin(t * 8) * 0.03 : 0;
    }

    const armSwing = isSpeaking ? Math.sin(t * 5) * 0.5 : mood === "exercise" ? Math.sin(t * 4) * 1.2 : Math.sin(t * 1.5) * 0.15;
    if (leftArmRef.current) leftArmRef.current.rotation.x = armSwing;
    if (rightArmRef.current) rightArmRef.current.rotation.x = -armSwing;
  });

  const skinColor = character === "boy" ? "#f5d0b5" : "#f8d4c4";

  return (
    <group ref={groupRef} position={[0, 0.1, 0]}>
      {/* Body — textured character */}
      <mesh position={[0, 0.85, 0]}>
        <planeGeometry args={[1.35, 2.2, 32, 32]} />
        <meshStandardMaterial map={texture} transparent alphaTest={0.05} side={THREE.DoubleSide} roughness={0.6} />
      </mesh>

      {/* Head group for subtle nod */}
      <group ref={headRef} position={[0, 1.65, 0.05]}>
        {isSpeaking && (
          <mesh position={[0, -0.05, 0.06]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial color="#ff6b8a" emissive="#ff3366" emissiveIntensity={isSpeaking ? 0.8 : 0} transparent opacity={0.7} />
          </mesh>
        )}
      </group>

      {/* Animated arms */}
      <mesh ref={leftArmRef} position={[-0.72, 1.1, 0.08]} rotation={[0, 0, 0.3]}>
        <capsuleGeometry args={[0.07, 0.45, 8, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.5} />
      </mesh>
      <mesh ref={rightArmRef} position={[0.72, 1.1, 0.08]} rotation={[0, 0, -0.3]}>
        <capsuleGeometry args={[0.07, 0.45, 8, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.5} />
      </mesh>
    </group>
  );
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

function Scene({ character, isSpeaking, mood }: CharacterMeshProps) {
  return (
    <>
      <ambientLight intensity={0.55} />
      <spotLight position={[3, 5, 4]} angle={0.35} penumbra={0.8} intensity={1.2} castShadow />
      <spotLight position={[-3, 4, 2]} angle={0.4} penumbra={1} intensity={0.5} color="#aaccff" />
      <Environment preset="city" />
      <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.15}>
        <CharacterMesh character={character} isSpeaking={isSpeaking} mood={mood} />
      </Float>
      <Pedestal />
      <ContactShadows position={[0, 0, 0]} opacity={0.45} scale={2.5} blur={2.5} far={1.2} />
    </>
  );
}

interface CompanionAvatar3DProps {
  character: CharacterType;
  isSpeaking: boolean;
  mood: "idle" | "happy" | "exercise" | "sleep";
  speechText?: string;
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
