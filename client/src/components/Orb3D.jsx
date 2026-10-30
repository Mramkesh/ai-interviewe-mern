import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sparkles } from '@react-three/drei';
import { useMedia } from '../lib/hooks';

const MODE_COLOR = { idle: '#6c63ff', speaking: '#38bdf8', listening: '#22c55e', thinking: '#a78bfa' };

function Core({ mode = 'idle', detail = 14, scale = 1 }) {
  const mesh = useRef(), mat = useRef(), ring1 = useRef(), ring2 = useRef(), group = useRef();
  const modeRef = useRef(mode);
  modeRef.current = mode;
  useFrame((s, d) => {
    const t = s.clock.elapsedTime, m = modeRef.current;
    mesh.current.rotation.y += d * (m === 'thinking' ? 1.1 : 0.25);
    mesh.current.rotation.x = Math.sin(t * 0.3) * 0.2;
    ring1.current.rotation.z += d * 0.4; ring2.current.rotation.x += d * 0.3;
    // speaking => awaaz ke saath pulse; listening => halka breathing
    const pulse = m === 'speaking' ? 1 + Math.abs(Math.sin(t * 9)) * 0.1 + Math.sin(t * 3.7) * 0.04 : m === 'listening' ? 1 + Math.sin(t * 2) * 0.03 : 1;
    mesh.current.scale.setScalar(pulse * scale);
    mat.current.distort += ((m === 'speaking' ? 0.55 : m === 'thinking' ? 0.5 : 0.36) - mat.current.distort) * 0.08;
    mat.current.color.lerp({ isColor: true, ...hex(MODE_COLOR[m]) }, 0.06);
    group.current.rotation.y += (s.pointer.x * 0.5 - group.current.rotation.y) * 0.05;
    group.current.rotation.x += (-s.pointer.y * 0.3 - group.current.rotation.x) * 0.05;
  });
  return (
    <group ref={group}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={1}>
        <mesh ref={mesh}>
          <icosahedronGeometry args={[1.25, detail]} />
          <MeshDistortMaterial ref={mat} color="#7c6cff" emissive="#4f46e5" emissiveIntensity={0.9} roughness={0.18} metalness={0.35} distort={0.36} speed={2.4} />
        </mesh>
      </Float>
      <mesh ref={ring1} rotation={[1.2, 0, 0]}><torusGeometry args={[1.95 * scale, 0.012, 8, 120]} /><meshBasicMaterial color="#a78bfa" transparent opacity={0.6} /></mesh>
      <mesh ref={ring2} rotation={[0.3, 0.6, 0]}><torusGeometry args={[2.3 * scale, 0.01, 8, 120]} /><meshBasicMaterial color="#38bdf8" transparent opacity={0.45} /></mesh>
    </group>
  );
}

function hex(h) {
  const n = parseInt(h.slice(1), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

function Scene({ mode, sparkles, detail, scale }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[4, 3, 4]} intensity={60} color="#a78bfa" />
      <pointLight position={[-4, -2, 3]} intensity={45} color="#38bdf8" />
      <pointLight position={[0, -4, -2]} intensity={25} color="#ec4899" />
      <Core mode={mode} detail={detail} scale={scale} />
      <Sparkles count={sparkles} scale={7} size={3} speed={0.4} color="#a78bfa" opacity={0.8} />
    </>
  );
}

// Landing page hero ka bada 3D scene
export function HeroScene() {
  const mobile = useMedia('(max-width: 820px)');
  return (
    <Canvas dpr={[1, mobile ? 1.25 : 1.75]} camera={{ position: [0, 0, 5.4], fov: 45 }} gl={{ alpha: true, antialias: !mobile, powerPreference: 'high-performance' }}>
      <Scene mode="idle" sparkles={mobile ? 30 : 70} detail={mobile ? 10 : 18} scale={1} />
    </Canvas>
  );
}

// Interview room ka AI interviewer (mode: idle | speaking | listening | thinking)
export function InterviewerOrb({ mode = 'idle', compact = false }) {
  const mobile = useMedia('(max-width: 820px)');
  const dpr = useMemo(() => [1, mobile ? 1.25 : 1.5], [mobile]);
  return (
    <Canvas dpr={dpr} camera={{ position: [0, 0, compact ? 6 : 5.2], fov: 45 }} gl={{ alpha: true, antialias: !mobile }}>
      <Scene mode={mode} sparkles={mobile ? 18 : 40} detail={mobile ? 8 : 14} scale={compact ? 0.9 : 1} />
    </Canvas>
  );
}
