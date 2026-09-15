import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface DecorativeCanvasProps {
  accentColor?: string;
  isUrgent?: boolean;
}

export const DecorativeCanvas: React.FC<DecorativeCanvasProps> = ({
  accentColor = '#0d9488',
  isUrgent = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    // Check reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const prefersReducedMotion = mediaQuery.matches;

    // Check WebGL availability
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let particlesMesh: THREE.Points | null = null;
    let animationFrameId: number;

    try {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
      camera.position.z = 7;

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      // Create subtle connected node geometry (sacred healthcare geometry)
      const particleCount = 75;
      const positions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount * 3; i += 3) {
        // Torus / sphere distribution
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = 2.4 + Math.random() * 0.8;
        positions[i] = r * Math.sin(phi) * Math.cos(theta);
        positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i + 2] = r * Math.cos(phi);
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const colorHex = isUrgent ? 0xe11d48 : 0x0d9488;
      const material = new THREE.PointsMaterial({
        color: colorHex,
        size: 0.08,
        transparent: true,
        opacity: 0.75,
      });

      particlesMesh = new THREE.Points(geometry, material);
      scene.add(particlesMesh);

      // Inner wireframe sphere
      const sphereGeo = new THREE.IcosahedronGeometry(2.0, 2);
      const sphereMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        wireframe: true,
        transparent: true,
        opacity: 0.12,
      });
      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      scene.add(sphereMesh);

      // Animation loop
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        if (!prefersReducedMotion && particlesMesh && sphereMesh) {
          particlesMesh.rotation.y += 0.002;
          particlesMesh.rotation.x += 0.001;
          sphereMesh.rotation.y -= 0.0015;
        }
        if (renderer && scene && camera) {
          renderer.render(scene, camera);
        }
      };
      animate();

      // Resize observer
      const handleResize = () => {
        if (!container || !renderer || !camera) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
      };

      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);

      return () => {
        cancelAnimationFrame(animationFrameId);
        resizeObserver.disconnect();
        if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
          renderer.dispose();
        }
        geometry.dispose();
        material.dispose();
        sphereGeo.dispose();
        sphereMat.dispose();
      };
    } catch (e) {
      // WebGL failure fallback
      setWebglSupported(false);
      return;
    }
  }, [isUrgent, accentColor]);

  if (!webglSupported) {
    // Graceful 2D fallback: subtle radial gradient circle
    return (
      <div
        className="w-full h-full flex items-center justify-center pointer-events-none"
        aria-hidden="true"
      >
        <div
          className={`w-36 h-36 rounded-full border border-teal-200/50 bg-radial from-teal-100/30 to-transparent ${
            isUrgent ? 'border-rose-200 bg-rose-50/40' : ''
          }`}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[140px] pointer-events-none overflow-hidden"
      aria-hidden="true"
    />
  );
};
