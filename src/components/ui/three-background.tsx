
"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ThreeBackground = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0A0A1A, 0.001);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 25;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setClearColor(0x0A0A1A, 1);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Icosahedron
    const geometry = new THREE.IcosahedronGeometry(12, 2);
    const material = new THREE.MeshBasicMaterial({
      color: 0x8A2BE2, // primary color
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });
    const mainMesh = new THREE.Mesh(geometry, material);
    scene.add(mainMesh);

    // Particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1500;
    const posArray = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 100;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.04,
      color: 0x00FFFF, // secondary color
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Mouse interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    const onDocumentMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX - windowHalfX);
      mouseY = (event.clientY - windowHalfY);
    };
    document.addEventListener('mousemove', onDocumentMouseMove);

    // Scroll interaction
    let scrollY = 0;
    const onScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener('scroll', onScroll);

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Twinkling stars
      particlesMaterial.opacity = Math.abs(Math.sin(elapsedTime * 0.5));
      
      targetX = mouseX * 0.001;
      targetY = mouseY * 0.001;

      mainMesh.rotation.y += 0.001;
      mainMesh.rotation.x += 0.0005;
      mainMesh.rotation.y += 0.05 * (targetX - mainMesh.rotation.y);
      mainMesh.rotation.x += 0.05 * (targetY - mainMesh.rotation.x);

      particlesMesh.rotation.y = -elapsedTime * 0.03;
      particlesMesh.rotation.x = elapsedTime * 0.01;
      
      particlesMesh.position.y = scrollY * 0.01;
      mainMesh.position.y = scrollY * 0.005;

      renderer.render(scene, camera);
    };
    animate();

    // Responsive resize
    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onWindowResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('mousemove', onDocumentMouseMove);
      window.removeEventListener('scroll', onScroll);
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1}} />;
};

export default ThreeBackground;
