import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { SceneMode, CompanionMood } from "@/stores/useCompanionStore";

/* ------------------------------------------------------------------ */
/*  Contextual 3D background environments that render behind the      */
/*  companion character based on the current scene mode                */
/* ------------------------------------------------------------------ */

interface SceneManagerProps {
  sceneMode: SceneMode;
  mood: CompanionMood;
}

/* floating particle used across all scenes */
function FloatingParticle({
  position,
  color,
  speed,
  size,
}: {
  position: [number, number, number];
  color: string;
  speed: number;
  size: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(t * speed) * 0.3;
      ref.current.position.x = position[0] + Math.cos(t * speed * 0.7) * 0.15;
      ref.current.rotation.z = t * speed * 0.5;
    }
  });
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[size, 8, 8]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.4}
        transparent
        opacity={0.7}
        roughness={0.3}
      />
    </mesh>
  );
}

/* sleep z-z-z bubbles */
function SleepParticles() {
  const positions = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        pos: [0.6 + i * 0.2, 1.2 + i * 0.3, -0.5] as [number, number, number],
        size: 0.03 + i * 0.015,
        speed: 0.5 + i * 0.1,
      })),
    []
  );
  return (
    <group>
      {positions.map((p, i) => (
        <FloatingParticle key={i} position={p.pos} color="#8b9dc3" speed={p.speed} size={p.size} />
      ))}
    </group>
  );
}

/* sparkle / heart particles */
function HappyParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        pos: [
          (Math.random() - 0.5) * 2.5,
          0.5 + Math.random() * 2,
          -0.5 - Math.random() * 0.5,
        ] as [number, number, number],
        color: ["#ff6b9d", "#ffd93d", "#6bcbff", "#c56bff"][i % 4],
        speed: 0.8 + Math.random() * 0.8,
        size: 0.025 + Math.random() * 0.025,
      })),
    []
  );
  return (
    <group>
      {particles.map((p, i) => (
        <FloatingParticle key={i} position={p.pos} color={p.color} speed={p.speed} size={p.size} />
      ))}
    </group>
  );
}

/* exercise / energy particles */
function ExerciseParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        pos: [
          (Math.random() - 0.5) * 2,
          0.3 + Math.random() * 1.5,
          -0.3,
        ] as [number, number, number],
        color: ["#ff4444", "#ff8844", "#ffcc00"][i % 3],
        speed: 1.5 + Math.random(),
        size: 0.02 + Math.random() * 0.02,
      })),
    []
  );
  return (
    <group>
      {particles.map((p, i) => (
        <FloatingParticle key={i} position={p.pos} color={p.color} speed={p.speed} size={p.size} />
      ))}
    </group>
  );
}

/* bedroom scene — back wall, window with moon, bed */
function BedroomScene() {
  return (
    <group position={[0, 0, -1.5]}>
      {/* back wall */}
      <mesh position={[0, 1.2, 0]}>
        <planeGeometry args={[4, 3]} />
        <meshStandardMaterial color="#1a1a3e" roughness={0.9} />
      </mesh>
      {/* window glow */}
      <mesh position={[1.0, 1.8, 0.01]}>
        <planeGeometry args={[0.6, 0.8]} />
        <meshStandardMaterial
          color="#1e3a5f"
          emissive="#2a4a7f"
          emissiveIntensity={0.6}
          roughness={0.4}
        />
      </mesh>
      {/* moon */}
      <mesh position={[1.1, 2.0, 0.02]}>
        <circleGeometry args={[0.12, 16]} />
        <meshStandardMaterial
          color="#ffeaa7"
          emissive="#ffeaa7"
          emissiveIntensity={1.2}
          roughness={0.1}
        />
      </mesh>
      {/* stars */}
      {[
        [0.8, 2.1],
        [1.3, 1.7],
        [0.7, 1.6],
        [1.2, 2.15],
      ].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.02]}>
          <circleGeometry args={[0.015, 6]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={1}
          />
        </mesh>
      ))}
      {/* bed silhouette */}
      <mesh position={[-0.6, 0.25, 0.3]}>
        <boxGeometry args={[1.2, 0.15, 0.6]} />
        <meshStandardMaterial color="#4a3728" roughness={0.85} />
      </mesh>
      {/* pillow */}
      <mesh position={[-1.0, 0.35, 0.3]}>
        <boxGeometry args={[0.3, 0.1, 0.4]} />
        <meshStandardMaterial color="#d4e6f1" roughness={0.7} />
      </mesh>
      {/* ambient blue light */}
      <pointLight position={[1, 2, 0.5]} intensity={0.5} color="#4a90d9" />
      <SleepParticles />
    </group>
  );
}

/* kitchen / dining scene */
function KitchenScene() {
  return (
    <group position={[0, 0, -1.5]}>
      {/* back wall */}
      <mesh position={[0, 1.2, 0]}>
        <planeGeometry args={[4, 3]} />
        <meshStandardMaterial color="#fdf0d5" roughness={0.9} />
      </mesh>
      {/* table */}
      <mesh position={[0, 0.3, 0.5]}>
        <boxGeometry args={[1.5, 0.06, 0.8]} />
        <meshStandardMaterial color="#8B6914" roughness={0.7} />
      </mesh>
      {/* table leg */}
      <mesh position={[-0.5, 0.0, 0.5]}>
        <boxGeometry args={[0.05, 0.6, 0.05]} />
        <meshStandardMaterial color="#6B4914" roughness={0.8} />
      </mesh>
      <mesh position={[0.5, 0.0, 0.5]}>
        <boxGeometry args={[0.05, 0.6, 0.05]} />
        <meshStandardMaterial color="#6B4914" roughness={0.8} />
      </mesh>
      {/* plate */}
      <mesh position={[0, 0.35, 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.15, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      {/* warm overhead light */}
      <pointLight position={[0, 2.5, 0.5]} intensity={1.2} color="#ffb347" />
      <HappyParticles />
    </group>
  );
}

/* gym / workout scene */
function GymScene() {
  return (
    <group position={[0, 0, -1.5]}>
      {/* back wall */}
      <mesh position={[0, 1.2, 0]}>
        <planeGeometry args={[4, 3]} />
        <meshStandardMaterial color="#2d2d44" roughness={0.9} />
      </mesh>
      {/* dumbbell left */}
      <group position={[-1.0, 0.15, 0.5]}>
        <mesh>
          <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
          <meshStandardMaterial color="#888" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.08, 8]} />
          <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.18, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.08, 8]} />
          <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
      {/* dumbbell right */}
      <group position={[1.0, 0.15, 0.5]}>
        <mesh>
          <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
          <meshStandardMaterial color="#888" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.08, 8]} />
          <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.18, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.08, 8]} />
          <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
      {/* energy light */}
      <pointLight position={[0, 2.5, 0.5]} intensity={1.5} color="#ff6b6b" />
      <ExerciseParticles />
    </group>
  );
}

/* welcome scene */
function WelcomeScene() {
  return (
    <group position={[0, 0, -1.5]}>
      <HappyParticles />
    </group>
  );
}

function SceneManager({ sceneMode, mood }: SceneManagerProps) {
  return (
    <group>
      {sceneMode === "bedroom" && <BedroomScene />}
      {sceneMode === "kitchen" && <KitchenScene />}
      {sceneMode === "gym" && <GymScene />}
      {sceneMode === "welcome" && <WelcomeScene />}
      {sceneMode === "none" && mood === "happy" && <HappyParticles />}
      {sceneMode === "none" && mood === "sleep" && <SleepParticles />}
      {sceneMode === "none" && mood === "exercise" && <ExerciseParticles />}
    </group>
  );
}

export default SceneManager;
