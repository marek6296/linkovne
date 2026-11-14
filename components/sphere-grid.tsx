"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./sphere-showcase.module.css";
export type SpherePerson = { id: string; name: string; src: string; look: number };
type Position3D = { x: number; y: number; z: number };
type SphericalPosition = { theta: number; phi: number; radius: number };
const SPHERE_MATH = {
  degreesToRadians: (degrees: number): number => degrees * (Math.PI / 180),
  radiansToDegrees: (radians: number): number => radians * (180 / Math.PI),

  sphericalToCartesian: (radius: number, theta: number, phi: number): Position3D => ({
    x: radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta)
  }),

  calculateDistance: (pos: Position3D, center: Position3D = { x: 0, y: 0, z: 0 }): number => {
    const dx = pos.x - center.x;
    const dy = pos.y - center.y;
    const dz = pos.z - center.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  },

  normalizeAngle: (angle: number): number => {
    while (angle > 180) angle -= 360;
    while (angle < -180) angle += 360;
    return angle;
  }
};


export function SphereGrid({ images, onSelect, paused }: { images: SpherePerson[]; onSelect: (person: SpherePerson) => void; paused: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const [containerSize, setSize] = useState(440);
  const [rotation, setRotation] = useState({ x: 15, y: 15, z: 0 });
  const [hovered, setHovered] = useState<number | null>(null);
  const [focused, setFocused] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const drag = useRef({ active: false, x: 0, y: 0, startX: 0, startY: 0, moved: false });
  const velocity = useRef({ x: 0, y: 0 });
  const actualSphereRadius = containerSize * .4;
  const baseImageSize = containerSize * .21;
  useEffect(() => {
    const element = root.current!;
    const resize = new ResizeObserver(([entry]) => setSize(entry.contentRect.width));
    resize.observe(element);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(element);
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    const page = () => setPageVisible(!document.hidden);
    update(); page(); media.addEventListener("change", update); document.addEventListener("visibilitychange", page);
    return () => { resize.disconnect(); observer.disconnect(); media.removeEventListener("change", update); document.removeEventListener("visibilitychange", page); };
  }, []);
  useEffect(() => {
    if (paused || focused || reduced || !visible || !pageVisible) return;
    let frame = 0, previous = 0;
    const tick = (now: number) => {
      const delta = previous ? Math.min((now - previous) / 16.667, 2) : 1;
      previous = now;
      if (!drag.current.active) {
        velocity.current.x *= Math.pow(.95, delta);
        velocity.current.y *= Math.pow(.95, delta);
        setRotation(r => ({ x: SPHERE_MATH.normalizeAngle(r.x + velocity.current.x * delta), y: SPHERE_MATH.normalizeAngle(r.y + (.18 + velocity.current.y) * delta), z: 0 }));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [paused, focused, reduced, visible, pageVisible]);
  const imagePositions = useMemo(() => {
    const positions: SphericalPosition[] = [];
    const imageCount = images.length;

    // Use Fibonacci sphere distribution for even coverage
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const angleIncrement = 2 * Math.PI / goldenRatio;

    for (let i = 0; i < imageCount; i++) {
      // Fibonacci sphere distribution
      const t = i / imageCount;
      const inclination = Math.acos(1 - 2 * t);
      const azimuth = angleIncrement * i;

      // Convert to degrees and focus on front hemisphere
      let phi = inclination * (180 / Math.PI);
      let theta = (azimuth * (180 / Math.PI)) % 360;

      // Better pole coverage - reach poles but avoid extreme mathematical issues
      const poleBonus = Math.pow(Math.abs(phi - 90) / 90, 0.6) * 35; // Moderate boost toward poles
      if (phi < 90) {
        phi = Math.max(5, phi - poleBonus); // Reach closer to top pole (15° minimum)
      } else {
        phi = Math.min(175, phi + poleBonus); // Reach closer to bottom pole (165° maximum)
      }

      // Map to fuller vertical range - covers poles but avoids extremes
      phi = 15 + (phi / 180) * 150; // Map to 15-165 degrees for pole coverage with stability

      // Add slight randomization to prevent perfect patterns
      const randomOffset = (Math.sin(i * 127.1) * 0.5) * 20;
      theta = (theta + randomOffset) % 360;
      phi = Math.max(0, Math.min(180, phi + (Math.sin(i * 127.1) * 0.5) * 10));

      positions.push({
        theta: theta,
        phi: phi,
        radius: actualSphereRadius
      });
    }

    return positions;

  }, [images.length, actualSphereRadius]);
  const worldPositions = useMemo(() => {
    const positions = imagePositions.map((pos, index) => {
      // Apply rotation using proper 3D rotation matrices
      const thetaRad = SPHERE_MATH.degreesToRadians(pos.theta);
      const phiRad = SPHERE_MATH.degreesToRadians(pos.phi);
      const rotXRad = SPHERE_MATH.degreesToRadians(rotation.x);
      const rotYRad = SPHERE_MATH.degreesToRadians(rotation.y);

      // Initial position on sphere
      let x = pos.radius * Math.sin(phiRad) * Math.cos(thetaRad);
      let y = pos.radius * Math.cos(phiRad);
      let z = pos.radius * Math.sin(phiRad) * Math.sin(thetaRad);

      // Apply Y-axis rotation (horizontal drag)
      const x1 = x * Math.cos(rotYRad) + z * Math.sin(rotYRad);
      const z1 = -x * Math.sin(rotYRad) + z * Math.cos(rotYRad);
      x = x1;
      z = z1;

      // Apply X-axis rotation (vertical drag)
      const y2 = y * Math.cos(rotXRad) - z * Math.sin(rotXRad);
      const z2 = y * Math.sin(rotXRad) + z * Math.cos(rotXRad);
      y = y2;
      z = z2;

      const worldPos: Position3D = { x, y, z };

      // Calculate visibility with smooth fade zones
      const fadeZoneStart = -10;  // Start fading out
      const fadeZoneEnd = -30;    // Completely hidden
      const isVisible = worldPos.z > fadeZoneEnd;

      // Calculate fade opacity based on Z position
      let fadeOpacity = 1;
      if (worldPos.z <= fadeZoneStart) {
        // Linear fade from 1 to 0 as Z goes from fadeZoneStart to fadeZoneEnd
        fadeOpacity = Math.max(0, (worldPos.z - fadeZoneEnd) / (fadeZoneStart - fadeZoneEnd));
      }

      // Check if this image originated from a pole position
      const isPoleImage = pos.phi < 30 || pos.phi > 150; // Images from extreme angles

      // Calculate distance from center for scaling (in 2D screen space)
      const distanceFromCenter = Math.sqrt(worldPos.x * worldPos.x + worldPos.y * worldPos.y);
      const maxDistance = actualSphereRadius;
      const distanceRatio = Math.min(distanceFromCenter / maxDistance, 1);

      // Scale based on distance from center - be more forgiving for pole images
      const distancePenalty = isPoleImage ? 0.4 : 0.7; // Less penalty for pole images
      const centerScale = Math.max(0.3, 1 - distanceRatio * distancePenalty);

      // Also consider Z-depth for additional scaling
      const depthScale = (worldPos.z + actualSphereRadius) / (2 * actualSphereRadius);
      const scale = centerScale * Math.max(0.5, 0.8 + depthScale * 0.3);

      return {
        ...worldPos,
        scale,
        zIndex: Math.round(1000 + worldPos.z),
        isVisible,
        fadeOpacity,
        originalIndex: index
      };
    });

    // Apply collision detection to prevent overlaps
    const adjustedPositions = [...positions];

    for (let i = 0; i < adjustedPositions.length; i++) {
      const pos = adjustedPositions[i];
      if (!pos.isVisible) continue;

      let adjustedScale = pos.scale;
      const imageSize = baseImageSize * adjustedScale;

      // Check for overlaps with other visible images
      for (let j = 0; j < adjustedPositions.length; j++) {
        if (i === j) continue;

        const other = adjustedPositions[j];
        if (!other.isVisible) continue;

        const otherSize = baseImageSize * other.scale;

        // Calculate 2D distance between images on screen
        const dx = pos.x - other.x;
        const dy = pos.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Minimum distance to prevent overlap (with more generous padding)
        const minDistance = (imageSize + otherSize) / 2 + 25;

        if (distance < minDistance && distance > 0) {
          // More aggressive scale reduction to prevent overlap
          const overlap = minDistance - distance;
          const reductionFactor = Math.max(0.4, 1 - (overlap / minDistance) * 0.6);
          adjustedScale = Math.min(adjustedScale, adjustedScale * reductionFactor);
        }
      }

      adjustedPositions[i] = {
        ...pos,
        scale: Math.max(0.25, adjustedScale) // Ensure minimum scale
      };
    }

    return adjustedPositions;

  }, [imagePositions, rotation, actualSphereRadius, baseImageSize]);
  return <div ref={root} className={styles.sphere} aria-label="Explore example creator profiles. Drag to rotate."
    onFocusCapture={() => setFocused(true)}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
    onPointerLeave={() => { if (!drag.current.moved) drag.current.active = false; }}
    onPointerDown={event => {
      if (event.button !== 0) return;
      drag.current = { active: true, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, moved: false };
      velocity.current = { x: 0, y: 0 };
    }}
    onPointerMove={event => {
      const d = drag.current;
      if (!d.active) return;
      const dx = event.clientX - d.x, dy = event.clientY - d.y;
      if (Math.hypot(event.clientX - d.startX, event.clientY - d.startY) > 7) { d.moved = true; event.currentTarget.setPointerCapture(event.pointerId); }
      const clamp = (n: number) => Math.max(-5, Math.min(5, n));
      velocity.current = { x: clamp(-dy * .5), y: clamp(dx * .5) };
      setRotation(r => ({ x: SPHERE_MATH.normalizeAngle(r.x + velocity.current.x), y: SPHERE_MATH.normalizeAngle(r.y + velocity.current.y), z: 0 }));
      d.x = event.clientX; d.y = event.clientY;
    }}
    onPointerUp={() => { drag.current.active = false; }}
    onPointerCancel={() => { drag.current.active = false; velocity.current = {x:0,y:0}; }}
    onLostPointerCapture={() => { drag.current.active = false; }}
  >
    {images.map((person, index) => {
      const p = worldPositions[index];
      if (!p?.isVisible) return null;
      const round = (n: number) => Math.round(n * 100) / 100;
      const size = round(baseImageSize * p.scale);
      return <button key={person.id} type="button" aria-label={`View ${person.name}’s example profile`} className={styles.portrait}
        style={{ width: size, height: size, left: round(containerSize / 2 + p.x), top: round(containerSize / 2 + p.y), opacity: round(p.fadeOpacity), zIndex: p.zIndex, transform: `translate(-50%, -50%) scale(${hovered === index ? 1.2 : 1})` }}
        onMouseEnter={() => setHovered(index)} onMouseLeave={() => setHovered(null)}
        onClick={event => { if (event.detail === 0 || !drag.current.moved) onSelect(person); }}>
        {/* Local demo portraits, not customer endorsements. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={person.src} alt="" draggable={false} />
      </button>;
    })}
  </div>;
}
