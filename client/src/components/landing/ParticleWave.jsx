import { useEffect, useRef } from "react";
import * as THREE from "three";

const COLS = 170;
const ROWS = 48;

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uStage;
  uniform vec2 uMouse;
  attribute float aRandom;
  attribute float aBand;
  varying float vAlpha;
  varying float vBrightness;
  varying float vAmber;

  float weight(float stage, float target) {
    return clamp(1.0 - abs(stage - target), 0.0, 1.0);
  }

  void main() {
    float x = position.x;
    float row = position.y;
    float t = uTime;

    float w0 = weight(uStage, 0.0);
    float w1 = weight(uStage, 1.0);
    float w2 = weight(uStage, 2.0);
    float w3 = weight(uStage, 3.0);
    float w4 = weight(uStage, 4.0);
    float w5 = weight(uStage, 5.0);
    float total = max(0.001, w0 + w1 + w2 + w3 + w4 + w5);

    float base = sin(x * 0.52 + t * 0.32) * 0.72 + sin(x * 0.21 - t * 0.18) * 0.33;
    float heroY = base + row * (1.0 + sin(x * 0.27 + t * 0.13) * 0.10);
    float heroZ = sin(x * 0.38 + row * 1.65 + t * 0.21) * 0.42 + cos(x * 0.17 - t * 0.11) * 0.22;

    float aperture = exp(-x * x * 0.06);
    float sourceY = base * 0.82 + row * 0.92 + sign(row) * aperture * 0.70;
    float sourceZ = sin(x * 0.29 + row * 1.25 + t * 0.16) * 0.32 + aperture * 0.18;

    float lane = floor((row + 1.325) / 2.65 * 6.0);
    lane = clamp(lane, 0.0, 5.0);
    float laneY = (lane - 2.5) * 0.44 + sin(x * 0.45 + lane * 0.9 + t * 0.24) * 0.16;
    float laneZ = cos(x * 0.22 + lane * 0.65 - t * 0.15) * 0.28;

    float fold = sin(x * 0.34 + t * 0.18) * 0.50;
    float incidentY = fold + row * (0.72 + 0.18 * sin(x * 0.16));
    float incidentZ = sin(x * 0.52 + row * 1.8 + t * 0.20) * 0.42;

    float ridge = sin(x * 0.58 + t * 0.32) * 0.52 + sin(x * 0.15 - t * 0.11) * 0.24;
    float graphY = ridge + row * 0.86;
    float graphZ = cos(x * 0.42 + row * 1.4 + t * 0.17) * 0.36;

    float closeY = sin(x * 0.27 + t * 0.16) * 0.30 + row * 1.08;
    float closeZ = sin(x * 0.20 + row + t * 0.10) * 0.22;

    vec3 p = vec3(x, 0.0, 0.0);
    p.y = (heroY*w0 + sourceY*w1 + laneY*w2 + incidentY*w3 + graphY*w4 + closeY*w5) / total;
    p.z = (heroZ*w0 + sourceZ*w1 + laneZ*w2 + incidentZ*w3 + graphZ*w4 + closeZ*w5) / total;

    vec2 pointer = vec2(uMouse.x * 6.6, uMouse.y * 3.2);
    float pointerDistance = distance(p.xy, pointer);
    float pointerField = exp(-pointerDistance * pointerDistance * 0.42);
    p.z += pointerField * 0.38;
    p.y += (p.y - pointer.y) * pointerField * 0.025;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float perspective = 7.4 / max(1.0, -mv.z);
    gl_PointSize = (1.05 + aRandom * 1.55) * perspective;

    float edge = smoothstep(0.0, 0.42, aBand);
    vAlpha = edge * (0.28 + aRandom * 0.62);
    float ridgeBrightness = pow(aBand, 1.6);
    vBrightness = 0.52 + ridgeBrightness * 0.48;
    float pulse = exp(-pow(x - sin(t * 0.42) * 4.8, 2.0) * 0.42) * smoothstep(3.1, 4.0, uStage) * (1.0 - smoothstep(4.25, 5.0, uStage));
    vAmber = pulse * (0.25 + aRandom * 0.75);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying float vAlpha;
  varying float vBrightness;
  varying float vAmber;

  void main() {
    vec2 point = gl_PointCoord - vec2(0.5);
    float distanceFromCenter = length(point);
    if (distanceFromCenter > 0.5) discard;
    float core = 1.0 - smoothstep(0.16, 0.43, distanceFromCenter);
    float glow = 1.0 - smoothstep(0.30, 0.50, distanceFromCenter);
    float alpha = vAlpha * (core * 0.84 + glow * 0.16);
    vec3 cool = mix(vec3(0.48, 0.52, 0.61), vec3(0.93, 0.95, 0.99), vBrightness);
    vec3 amber = vec3(0.92, 0.63, 0.25);
    gl_FragColor = vec4(mix(cool, amber, clamp(vAmber * 0.82, 0.0, 1.0)), alpha);
  }
`;

export default function ParticleWave() {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isPhone = window.matchMedia("(max-width: 640px)").matches;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isPhone ? 1 : 1.5));
    renderer.setClearColor(0x070708, 0);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 50);
    camera.position.z = 8.2;

    const count = COLS * ROWS;
    const positions = new Float32Array(count * 3);
    const randoms = new Float32Array(count);
    const bands = new Float32Array(count);
    let index = 0;
    for (let xIndex = 0; xIndex < COLS; xIndex += 1) {
      const u = xIndex / (COLS - 1);
      const x = (u - 0.5) * 16.2;
      for (let rowIndex = 0; rowIndex < ROWS; rowIndex += 1) {
        const v = rowIndex / (ROWS - 1);
        positions[index * 3] = x + (Math.random() - 0.5) * 0.035;
        positions[index * 3 + 1] = (v - 0.5) * 2.65 + (Math.random() - 0.5) * 0.035;
        randoms[index] = Math.random();
        bands[index] = 1 - Math.abs(v - 0.5) * 2;
        index += 1;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));
    geometry.setAttribute("aBand", new THREE.BufferAttribute(bands, 1));

    const uniforms = {
      uTime: { value: 0 },
      uStage: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
    };
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    scene.add(points);

    const dustCount = isPhone ? 220 : 700;
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i += 1) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 18;
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      dustPositions[i * 3 + 2] = -2 - Math.random() * 4;
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ size: 0.018, color: 0x89919f, transparent: true, opacity: 0.16, depthWrite: false }));
    scene.add(dust);

    const targetMouse = new THREE.Vector2(0, 0);
    const currentMouse = new THREE.Vector2(0, 0);
    let targetStage = 0;
    let currentStage = 0;
    let frame = 0;
    let lastFrame = 0;
    const clock = new THREE.Clock();

    const anchors = [
      ["#landing-hero", 0],
      ["#fleet", 1],
      ["#vehicle", 2],
      ["#incidents", 3],
      ["#compliance", 4],
      ["#landing-footer", 5],
    ];

    const calculateStage = () => {
      const point = window.scrollY + window.innerHeight * 0.52;
      const positionsByStage = anchors.map(([selector, stage]) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return { stage, position: rect.top + window.scrollY + rect.height * 0.5 };
      }).filter(Boolean);
      if (positionsByStage.length < 2) return;
      if (point <= positionsByStage[0].position) { targetStage = 0; return; }
      const last = positionsByStage.at(-1);
      if (point >= last.position) { targetStage = last.stage; return; }
      for (let i = 0; i < positionsByStage.length - 1; i += 1) {
        const current = positionsByStage[i];
        const next = positionsByStage[i + 1];
        if (point >= current.position && point <= next.position) {
          const progress = (point - current.position) / (next.position - current.position);
          const smooth = progress * progress * (3 - 2 * progress);
          targetStage = THREE.MathUtils.lerp(current.stage, next.stage, smooth);
          return;
        }
      }
    };

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      points.scale.setScalar(width > 1400 ? 1.12 : 1);
      calculateStage();
    };
    const pointer = (event) => targetMouse.set((event.clientX / window.innerWidth) * 2 - 1, -((event.clientY / window.innerHeight) * 2 - 1));
    const scroll = () => calculateStage();

    const render = (time = 0) => {
      if (!reducedMotion && time - lastFrame < 30) { frame = requestAnimationFrame(render); return; }
      lastFrame = time;
      currentMouse.lerp(targetMouse, 0.04);
      currentStage += (targetStage - currentStage) * 0.075;
      uniforms.uTime.value = reducedMotion ? 0.8 : clock.getElapsedTime();
      uniforms.uStage.value = currentStage;
      uniforms.uMouse.value.copy(currentMouse);
      dust.rotation.z += 0.00008;
      dust.rotation.y += 0.00005;
      renderer.render(scene, camera);
      if (!reducedMotion) frame = requestAnimationFrame(render);
    };

    window.addEventListener("resize", resize);
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("pointermove", pointer, { passive: true });
    resize();
    render();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("pointermove", pointer);
      geometry.dispose();
      material.dispose();
      dustGeometry.dispose();
      dust.material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div className="landing-particle-wave" ref={hostRef} aria-hidden="true" />;
}
