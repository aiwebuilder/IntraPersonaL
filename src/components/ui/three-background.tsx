"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ThreeBackground = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    // Add dark fog for depth fading
    scene.fog = new THREE.FogExp2(0x050505, 0.002);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    // Move camera back slightly to see more floating elements
    camera.position.z = 25;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // Transparent background to blend with CSS
    container.appendChild(renderer.domElement);

    // --- Lights ---
    // Ambient light for base visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    // Cyan Light (Left)
    const pointLight1 = new THREE.PointLight(0x00ffff, 2, 50);
    pointLight1.position.set(-10, 10, 10);
    scene.add(pointLight1);

    // Purple/Magenta Light (Right)
    const pointLight2 = new THREE.PointLight(0xff00ff, 2, 50);
    pointLight2.position.set(10, -10, 10);
    scene.add(pointLight2);

    // --- Objects Group ---
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. Central Core (Torus Knot) - The "Brain" or "Core"
    const geometryCore = new THREE.TorusKnotGeometry(6, 1.5, 150, 20);
    const materialCore = new THREE.MeshStandardMaterial({ 
      color: 0x2a2a2a, 
      emissive: 0x000000,
      roughness: 0.1,
      metalness: 0.8,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    const coreMesh = new THREE.Mesh(geometryCore, materialCore);
    mainGroup.add(coreMesh);

    // 2. Floating Satellites (Debris/Data chunks)
    const satellites: { mesh: THREE.Mesh; speed: number; orbitRadius: number; orbitSpeed: number; angle: number }[] = [];
    const satGeometry = new THREE.OctahedronGeometry(1, 0);
    const satMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true, transparent: true, opacity: 0.4 });

    for (let i = 0; i < 15; i++) {
        const mesh = new THREE.Mesh(satGeometry, satMaterial);
        
        // Random placement
        const radius = 15 + Math.random() * 20;
        const angle = Math.random() * Math.PI * 2;
        const yOffset = (Math.random() - 0.5) * 20;

        mesh.position.set(
            Math.cos(angle) * radius,
            yOffset,
            Math.sin(angle) * radius
        );
        
        // Random scale variation
        const scale = 0.5 + Math.random();
        mesh.scale.set(scale, scale, scale);

        mainGroup.add(mesh);
        
        satellites.push({
            mesh,
            speed: (Math.random() - 0.5) * 0.02,
            orbitRadius: radius,
            orbitSpeed: (Math.random() * 0.005) + 0.002,
            angle: angle
        });
    }

    // 3. Background Particles (Stars/Data Dust)
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 2000;
    const posArray = new Float32Array(particlesCount * 3);
    
    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 100;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.05,
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // --- Interaction State ---
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    const onDocumentMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX - windowHalfX) * 0.0005;
      mouseY = (event.clientY - windowHalfY) * 0.0005;
    };
    
    // Use window listener for broader capture
    window.addEventListener('mousemove', onDocumentMouseMove);

    // --- Animation Loop ---
    const clock = new THREE.Clock();

    const animate = () => {
      requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // 1. Mouse Parallax (Smooth Damping)
      targetX = mouseX * 2;
      targetY = mouseY * 2;
      
      // Lerp rotation for smoothness
      mainGroup.rotation.y += 0.03 * (targetX - mainGroup.rotation.y);
      mainGroup.rotation.x += 0.03 * (targetY - mainGroup.rotation.x);

      // 2. Core Animation
      coreMesh.rotation.y = elapsedTime * 0.1;
      coreMesh.rotation.z = elapsedTime * 0.05;
      // Gentle floating (sine wave)
      coreMesh.position.y = Math.sin(elapsedTime * 0.5) * 0.5;

      // 3. Satellites Animation (Orbiting)
      satellites.forEach((sat) => {
          sat.angle += sat.orbitSpeed;
          
          // Update position based on orbit
          sat.mesh.position.x = Math.cos(sat.angle) * sat.orbitRadius;
          sat.mesh.position.z = Math.sin(sat.angle) * sat.orbitRadius;
          
          // Self rotation
          sat.mesh.rotation.x += sat.speed;
          sat.mesh.rotation.y += sat.speed;
          
          // Gentle float
          sat.mesh.position.y += Math.sin(elapsedTime * 2 + sat.angle) * 0.02;
      });

      // 4. Particles (Slow drift)
      particlesMesh.rotation.y = -elapsedTime * 0.02;
      particlesMesh.rotation.x = mouseX * 0.1; // Subtle tilt with mouse

      renderer.render(scene, camera);
    };

    animate();

    // --- Resize Handler ---
    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onWindowResize);

    // --- Cleanup ---
    return () => {
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('mousemove', onDocumentMouseMove);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      // Dispose resources
      geometryCore.dispose();
      materialCore.dispose();
      satGeometry.dispose();
      satMaterial.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none"
      style={{ background: 'radial-gradient(circle at center, #1a1a2e 0%, #000000 100%)' }}
    />
  );
};

export default ThreeBackground;
