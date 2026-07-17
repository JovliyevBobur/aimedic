import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CharacterType, CompanionMood } from "@/stores/useCompanionStore";

/* ------------------------------------------------------------------ */
/*  Procedural "Pixar chibi" character built from Three.js primitives */
/*  Big head, small body, round proportions — stylised & appealing    */
/* ------------------------------------------------------------------ */

interface Character3DProps {
  character: CharacterType;
  mood: CompanionMood;
  isSpeaking: boolean;
  lookTarget: { x: number; y: number };
  audioLevel: number;
}

/* colour palettes per character */
const PALETTES = {
  boy: {
    skin: "#f5d0b5",
    hair: "#3d2b1f",
    shirt: "#4a90d9",
    shirtDark: "#3570b5",
    pants: "#2c3e50",
    shoes: "#1a1a2e",
    eye: "#2c3e50",
    cheek: "#ffb5a0",
    mouth: "#e74c6f",
  },
  girl: {
    skin: "#f8d4c4",
    hair: "#8B4513",
    shirt: "#e84393",
    shirtDark: "#c0316e",
    pants: "#6c5ce7",
    shoes: "#2d2d44",
    eye: "#6c5ce7",
    cheek: "#ffaabb",
    mouth: "#ff6b81",
  },
} as const;

function Character3D({
  character,
  mood,
  isSpeaking,
  lookTarget,
  audioLevel,
}: Character3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const headGroupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Group>(null);
  const rightEyeRef = useRef<THREE.Group>(null);

  const pal = PALETTES[character];

  /* materials – memoised so they don't recreate each frame */
  const mats = useMemo(
    () => ({
      skin: new THREE.MeshStandardMaterial({
        color: pal.skin,
        roughness: 0.55,
        metalness: 0.0,
      }),
      hair: new THREE.MeshStandardMaterial({
        color: pal.hair,
        roughness: 0.8,
      }),
      shirt: new THREE.MeshStandardMaterial({
        color: pal.shirt,
        roughness: 0.5,
      }),
      shirtDark: new THREE.MeshStandardMaterial({
        color: pal.shirtDark,
        roughness: 0.5,
      }),
      pants: new THREE.MeshStandardMaterial({
        color: pal.pants,
        roughness: 0.6,
      }),
      shoes: new THREE.MeshStandardMaterial({
        color: pal.shoes,
        roughness: 0.7,
      }),
      eye: new THREE.MeshStandardMaterial({
        color: pal.eye,
        roughness: 0.3,
      }),
      eyeWhite: new THREE.MeshStandardMaterial({
        color: "#ffffff",
        roughness: 0.3,
      }),
      cheek: new THREE.MeshStandardMaterial({
        color: pal.cheek,
        roughness: 0.6,
        transparent: true,
        opacity: 0.5,
      }),
      mouth: new THREE.MeshStandardMaterial({
        color: pal.mouth,
        roughness: 0.4,
      }),
      eyeShine: new THREE.MeshStandardMaterial({
        color: "#ffffff",
        emissive: "#ffffff",
        emissiveIntensity: 0.8,
        roughness: 0.1,
      }),
    }),
    [pal]
  );

  /* ------------- per-frame animation ------------- */
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const g = groupRef.current;
    if (!g) return;

    /* breathing */
    const breathe = 1 + Math.sin(t * 2) * 0.01;
    g.scale.set(breathe, breathe, breathe);

    /* mood-specific body animations */
    if (mood === "exercise") {
      g.position.y = Math.abs(Math.sin(t * 6)) * 0.1;
      g.rotation.y = Math.sin(t * 3) * 0.12;
    } else if (mood === "sleep") {
      g.rotation.z = Math.sin(t * 0.5) * 0.04;
      g.position.y = Math.sin(t * 0.8) * 0.015;
    } else if (mood === "happy") {
      g.position.y = Math.abs(Math.sin(t * 4)) * 0.05;
      g.rotation.y = Math.sin(t * 2) * 0.1;
    } else {
      g.rotation.y = Math.sin(t * 0.6) * 0.08;
      g.position.y = Math.sin(t * 1.2) * 0.02;
    }

    /* head look-at (IK) */
    if (headGroupRef.current) {
      const targetX = lookTarget.x * 0.3;
      const targetY = lookTarget.y * 0.15;
      const head = headGroupRef.current;
      head.rotation.y += (targetX - head.rotation.y) * 0.05;
      head.rotation.x += (-targetY - head.rotation.x) * 0.05;

      if (isSpeaking) {
        head.rotation.x += Math.sin(t * 10) * 0.03;
        head.rotation.z = Math.sin(t * 7) * 0.02;
      }
    }

    /* arms */
    const armSwingBase = isSpeaking
      ? Math.sin(t * 5) * 0.5
      : mood === "exercise"
        ? Math.sin(t * 4) * 1.0
        : Math.sin(t * 1.5) * 0.15;

    if (leftArmRef.current) leftArmRef.current.rotation.x = armSwingBase;
    if (rightArmRef.current) rightArmRef.current.rotation.x = -armSwingBase;

    /* legs */
    const legSwing =
      mood === "exercise"
        ? Math.sin(t * 6) * 0.4
        : mood === "sleep"
          ? 0
          : Math.sin(t * 1.2) * 0.05;
    if (leftLegRef.current) leftLegRef.current.rotation.x = legSwing;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -legSwing;

    /* mouth — lip-sync via audio level */
    if (mouthRef.current) {
      const mouthScale = isSpeaking
        ? 0.6 + audioLevel * 1.5 + Math.sin(t * 14) * 0.15
        : 0.4 + Math.sin(t * 1.5) * 0.05;
      mouthRef.current.scale.y = Math.max(0.2, Math.min(1.6, mouthScale));
    }

    /* eye look */
    const eyeOffsetX = lookTarget.x * 0.015;
    const eyeOffsetY = lookTarget.y * 0.01;
    if (leftEyeRef.current) {
      leftEyeRef.current.position.x = -0.15 + eyeOffsetX;
      leftEyeRef.current.position.y = 0.08 + eyeOffsetY;
    }
    if (rightEyeRef.current) {
      rightEyeRef.current.position.x = 0.15 + eyeOffsetX;
      rightEyeRef.current.position.y = 0.08 + eyeOffsetY;
    }
  });

  return (
    <group ref={groupRef}>
      {/* ---- BODY (torso) ---- */}
      <mesh position={[0, 0.55, 0]} material={mats.shirt} castShadow>
        <capsuleGeometry args={[0.28, 0.35, 8, 16]} />
      </mesh>

      {/* collar / shirt detail */}
      <mesh position={[0, 0.78, 0.12]} material={mats.shirtDark}>
        <sphereGeometry args={[0.12, 12, 8]} />
      </mesh>

      {/* ---- HEAD GROUP ---- */}
      <group ref={headGroupRef} position={[0, 1.15, 0]}>
        {/* head sphere — big and round (chibi proportions) */}
        <mesh material={mats.skin} castShadow>
          <sphereGeometry args={[0.38, 24, 24]} />
        </mesh>

        {/* hair */}
        <mesh position={[0, 0.15, -0.02]} material={mats.hair}>
          <sphereGeometry args={[0.4, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        </mesh>
        {/* fringe / bangs */}
        <mesh position={[0, 0.2, 0.2]} material={mats.hair}>
          <boxGeometry args={[0.55, 0.12, 0.2]} />
        </mesh>
        {character === "girl" && (
          <>
            {/* pigtails for girl */}
            <mesh position={[-0.38, 0.08, -0.05]} material={mats.hair}>
              <sphereGeometry args={[0.14, 12, 12]} />
            </mesh>
            <mesh position={[0.38, 0.08, -0.05]} material={mats.hair}>
              <sphereGeometry args={[0.14, 12, 12]} />
            </mesh>
            {/* hair ribbon */}
            <mesh position={[-0.35, 0.2, -0.02]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color="#ff6b9d" roughness={0.4} />
            </mesh>
            <mesh position={[0.35, 0.2, -0.02]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color="#ff6b9d" roughness={0.4} />
            </mesh>
          </>
        )}

        {/* ---- EYES ---- */}
        {/* left eye white */}
        <mesh position={[-0.15, 0.08, 0.32]} material={mats.eyeWhite}>
          <sphereGeometry args={[0.09, 16, 16]} />
        </mesh>
        {/* left eye pupil group */}
        <group ref={leftEyeRef} position={[-0.15, 0.08, 0.38]}>
          <mesh material={mats.eye}>
            <sphereGeometry args={[0.055, 12, 12]} />
          </mesh>
          {/* eye shine */}
          <mesh position={[0.02, 0.025, 0.03]} material={mats.eyeShine}>
            <sphereGeometry args={[0.018, 8, 8]} />
          </mesh>
        </group>

        {/* right eye white */}
        <mesh position={[0.15, 0.08, 0.32]} material={mats.eyeWhite}>
          <sphereGeometry args={[0.09, 16, 16]} />
        </mesh>
        {/* right eye pupil group */}
        <group ref={rightEyeRef} position={[0.15, 0.08, 0.38]}>
          <mesh material={mats.eye}>
            <sphereGeometry args={[0.055, 12, 12]} />
          </mesh>
          <mesh position={[0.02, 0.025, 0.03]} material={mats.eyeShine}>
            <sphereGeometry args={[0.018, 8, 8]} />
          </mesh>
        </group>

        {/* ---- CHEEKS ---- */}
        <mesh position={[-0.22, -0.04, 0.3]} material={mats.cheek}>
          <sphereGeometry args={[0.06, 12, 12]} />
        </mesh>
        <mesh position={[0.22, -0.04, 0.3]} material={mats.cheek}>
          <sphereGeometry args={[0.06, 12, 12]} />
        </mesh>

        {/* nose */}
        <mesh position={[0, -0.02, 0.38]} material={mats.skin}>
          <sphereGeometry args={[0.035, 10, 10]} />
        </mesh>

        {/* ---- MOUTH ---- */}
        <mesh ref={mouthRef} position={[0, -0.13, 0.34]} material={mats.mouth}>
          <sphereGeometry args={[0.05, 12, 8]} />
        </mesh>

        {/* ears */}
        <mesh position={[-0.36, 0.0, 0.05]} material={mats.skin}>
          <sphereGeometry args={[0.07, 10, 10]} />
        </mesh>
        <mesh position={[0.36, 0.0, 0.05]} material={mats.skin}>
          <sphereGeometry args={[0.07, 10, 10]} />
        </mesh>
      </group>

      {/* ---- ARMS ---- */}
      {/* left arm */}
      <group ref={leftArmRef} position={[-0.38, 0.68, 0]}>
        <mesh position={[0, -0.2, 0]} material={mats.shirt} castShadow>
          <capsuleGeometry args={[0.08, 0.22, 6, 12]} />
        </mesh>
        {/* hand */}
        <mesh position={[0, -0.42, 0]} material={mats.skin}>
          <sphereGeometry args={[0.07, 10, 10]} />
        </mesh>
      </group>
      {/* right arm */}
      <group ref={rightArmRef} position={[0.38, 0.68, 0]}>
        <mesh position={[0, -0.2, 0]} material={mats.shirt} castShadow>
          <capsuleGeometry args={[0.08, 0.22, 6, 12]} />
        </mesh>
        <mesh position={[0, -0.42, 0]} material={mats.skin}>
          <sphereGeometry args={[0.07, 10, 10]} />
        </mesh>
      </group>

      {/* ---- LEGS ---- */}
      {/* left leg */}
      <group ref={leftLegRef} position={[-0.14, 0.2, 0]}>
        <mesh position={[0, -0.12, 0]} material={mats.pants} castShadow>
          <capsuleGeometry args={[0.1, 0.2, 6, 12]} />
        </mesh>
        {/* shoe */}
        <mesh position={[0, -0.32, 0.04]} material={mats.shoes}>
          <boxGeometry args={[0.14, 0.08, 0.2]} />
        </mesh>
      </group>
      {/* right leg */}
      <group ref={rightLegRef} position={[0.14, 0.2, 0]}>
        <mesh position={[0, -0.12, 0]} material={mats.pants} castShadow>
          <capsuleGeometry args={[0.1, 0.2, 6, 12]} />
        </mesh>
        <mesh position={[0, -0.32, 0.04]} material={mats.shoes}>
          <boxGeometry args={[0.14, 0.08, 0.2]} />
        </mesh>
      </group>
    </group>
  );
}

export default Character3D;
