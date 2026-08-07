"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import React, { useRef, Suspense } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";

interface DotGlobeHeroProps extends React.HTMLAttributes<HTMLDivElement> {
  rotationSpeed?: number;
  globeRadius?: number;
  className?: string;
  children?: React.ReactNode;
}

const Globe: React.FC<{
  rotationSpeed: number;
  radius: number;
}> = ({ rotationSpeed, radius }) => {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += rotationSpeed;
      groupRef.current.rotation.x += rotationSpeed * 0.3;
      groupRef.current.rotation.z += rotationSpeed * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        {/* Reduced from 64,64 → 32,32: 75% fewer vertices, imperceptible at 0.2 wireframe opacity */}
        <sphereGeometry args={[radius, 32, 32]} />
        <meshBasicMaterial
          color="#8b8ba8"
          transparent
          opacity={0.2}
          wireframe
        />
      </mesh>
    </group>
  );
};

const DotGlobeHero = React.forwardRef<
  HTMLDivElement,
  DotGlobeHeroProps
>(({
  rotationSpeed = 0.005,
  globeRadius = 1,
  className,
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative w-full h-[100svh] min-h-[100svh] overflow-hidden flex items-center justify-center",
        className
      )}
      style={{
        background: 'var(--bg-primary)',
      }}
      {...props}
    >
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full text-center px-4 pt-[var(--navbar-height,56px)] pb-6">
        {children}
      </div>

      {/* Globe canvas — wrapped in Suspense so the hero text renders immediately */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
        <Suspense fallback={null}>
          <Canvas style={{ width: '100%', height: '100%' }}>
            <PerspectiveCamera makeDefault position={[0, 0, 3.5]} fov={75} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <Globe rotationSpeed={rotationSpeed} radius={globeRadius} />
          </Canvas>
        </Suspense>
      </div>
    </div>
  );
});

DotGlobeHero.displayName = "DotGlobeHero";

export { DotGlobeHero, type DotGlobeHeroProps };
