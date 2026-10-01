"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { ensureGsapRegistered, gsap, ScrollTrigger } from "@/lib/gsap";
import LatticeMark from "./LatticeMark";

type ThemeName = "dark" | "light";

const PALETTE: Record<
  ThemeName,
  {
    disc: number;
    exposure: number;
    environment: number;
    glass: number;
    dome: number;
  }
> = {
  dark: { disc: 0xdcdee6, exposure: 1, environment: 1.1, glass: 1.4, dome: 0x565c69 },
  light: { disc: 0x17181c, exposure: 1.05, environment: 1.25, glass: 1, dome: 0xdde1e8 },
};

const LOGO_EXTENT = 2.15;

function discProfile(radius: number, halfHeight: number, corner: number) {
  const steps = 10;
  const arc = (cx: number, cy: number, from: number, to: number) =>
    Array.from({ length: steps + 1 }, (_, i) => {
      const angle = from + ((to - from) * i) / steps;
      return new THREE.Vector2(cx + Math.cos(angle) * corner, cy + Math.sin(angle) * corner);
    });

  return [
    new THREE.Vector2(0, -halfHeight),
    ...arc(radius - corner, -halfHeight + corner, -Math.PI / 2, 0),
    ...arc(radius - corner, halfHeight - corner, 0, Math.PI / 2),
    new THREE.Vector2(0, halfHeight),
  ];
}

/**
 * A studio dome with a handful of bright soft-boxes. Glass reflects this, so the torus picks up
 * crisp highlight streaks over a soft gradient. The dome tone follows the page theme so the
 * glass stays luminous on light backgrounds and doesn't collapse to black on dark ones.
 */
function createGlassStudio(dome: number) {
  const studio = new THREE.Scene();

  studio.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(40, 48, 24),
      new THREE.MeshBasicMaterial({ color: dome, side: THREE.BackSide })
    )
  );

  const softbox = (
    width: number,
    height: number,
    position: [number, number, number],
    intensity: number,
    tint = 0xffffff
  ) => {
    const color = new THREE.Color(tint).multiplyScalar(intensity);
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, toneMapped: false })
    );
    panel.position.set(...position);
    panel.lookAt(0, 0, 0);
    studio.add(panel);
  };

  softbox(20, 4, [0, 15, 8], 9);
  softbox(4, 20, [-17, 0, 7], 6);
  softbox(4, 20, [17, 2, 7], 6);
  softbox(14, 3, [0, -15, 10], 3);
  softbox(7, 7, [11, 11, -11], 7);
  softbox(3, 14, [-9, 0, -15], 5, 0xffc59a);
  softbox(3, 14, [9, 0, -15], 5, 0x9cc0ff);

  return studio;
}

function readCanvasColor(target: THREE.Color) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--canvas").trim();
  const [r, g, b] = raw.split(/\s+/).map(Number);
  target.setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
}

type LatticeLogo3DProps = {
  className?: string;
};

export default function LatticeLogo3D({ className = "" }: LatticeLogo3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    ensureGsapRegistered();

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch {
      setFallback(true);
      return;
    }

    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%;";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const background = new THREE.Color();
    readCanvasColor(background);
    scene.background = background;

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = roomTarget.texture;

    const glassTargets = (["light", "dark"] as const).reduce(
      (targets, theme) => {
        const studio = createGlassStudio(PALETTE[theme].dome);
        targets[theme] = pmrem.fromScene(studio, 0.03);
        studio.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            (object.material as THREE.Material).dispose();
          }
        });
        return targets;
      },
      {} as Record<ThemeName, THREE.WebGLRenderTarget>
    );

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(3, 4, 5);
    const rimLight = new THREE.DirectionalLight(0xa9b8ff, 1.2);
    rimLight.position.set(-4, -2, 2);
    scene.add(keyLight, rimLight);

    const torusGeometry = new THREE.TorusGeometry(0.75, 0.25, 96, 256);
    const discGeometry = new THREE.LatheGeometry(discProfile(0.67, 0.04, 0.035), 128);
    discGeometry.rotateX(Math.PI / 2);

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.02,
      transmission: 1,
      thickness: 1.15,
      ior: 1.52,
      dispersion: 1.6,
      clearcoat: 1,
      clearcoatRoughness: 0,
      specularIntensity: 1,
      envMap: glassTargets.light.texture,
      envMapIntensity: PALETTE.light.glass,
      side: THREE.DoubleSide,
    });
    const discMaterial = new THREE.MeshPhysicalMaterial({
      color: PALETTE.light.disc,
      roughness: 0.55,
      metalness: 0,
      clearcoat: 0.25,
      clearcoatRoughness: 0.4,
    });

    const torus = new THREE.Mesh(torusGeometry, glassMaterial);
    torus.position.set(0.07, 0, 0.3);
    const disc = new THREE.Mesh(discGeometry, discMaterial);
    disc.position.set(-0.41, -0.34, -0.1);

    const logo = new THREE.Group();
    logo.add(disc, torus);
    scene.add(logo);

    const pointer = { x: 0, y: 0 };
    const smooth = { x: 0, y: 0 };
    const state = { intro: reducedMotion ? 1 : 0, scroll: 0 };
    let visible = true;

    const pose = (t: number) => {
      const intro = state.intro;
      const scroll = state.scroll;
      logo.rotation.set(
        smooth.y * 0.2 + Math.sin(t * 0.5) * 0.03,
        -0.16 + smooth.x * 0.32 + Math.sin(t * 0.32) * 0.12 + scroll * 1.3 - (1 - intro) * 1.5,
        Math.sin(t * 0.25) * 0.02
      );
      torus.rotation.set(Math.sin(t * 0.6) * 0.1, Math.cos(t * 0.45) * 0.1, 0);
      logo.position.y = Math.sin(t * 0.7) * 0.05 - scroll * 0.35;
      logo.scale.setScalar((0.55 + 0.45 * intro) * (1 - scroll * 0.18));
    };

    const renderNow = (time = 0) => {
      pose(time);
      renderer.render(scene, camera);
    };

    const frame = (time: number) => {
      if (!visible) return;
      smooth.x += (pointer.x - smooth.x) * 0.06;
      smooth.y += (pointer.y - smooth.y) * 0.06;
      renderNow(time);
    };

    // The page flips theme atomically (View Transitions), so the scene follows instantly:
    // there is never a frame where the canvas and the page disagree.
    const syncTheme = () => {
      const theme: ThemeName = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
      const palette = PALETTE[theme];
      readCanvasColor(background);
      discMaterial.color.set(palette.disc);
      glassMaterial.envMap = glassTargets[theme].texture;
      glassMaterial.envMapIntensity = palette.glass;
      renderer.toneMappingExposure = palette.exposure;
      scene.environmentIntensity = palette.environment;
      renderNow(gsap.ticker.time);
    };

    const themeObserver = new MutationObserver(syncTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      if (!width || !height) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      const halfFov = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
      const fit = LOGO_EXTENT * 1.32;
      camera.position.z = Math.max(fit / (2 * halfFov), fit / (camera.aspect * 2 * halfFov));
      camera.updateProjectionMatrix();
      if (reducedMotion) renderNow();
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    syncTheme();
    resize();

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0 }
    );
    intersectionObserver.observe(mount);

    let scrollTrigger: ScrollTrigger | null = null;

    if (!reducedMotion) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      gsap.ticker.add(frame);

      gsap.fromTo(mount, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.2, ease: "power2.out", delay: 0.3 });
      gsap.to(state, { intro: 1, duration: 2.2, ease: "power4.out", delay: 0.35 });

      scrollTrigger = ScrollTrigger.create({
        trigger: mount.closest("section") ?? mount,
        start: "top top",
        end: "bottom top",
        scrub: true,
        onUpdate: (self) => {
          state.scroll = self.progress;
        },
      });
    }

    return () => {
      scrollTrigger?.kill();
      gsap.ticker.remove(frame);
      gsap.killTweensOf([mount, state]);
      window.removeEventListener("pointermove", onPointerMove);
      themeObserver.disconnect();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();

      torusGeometry.dispose();
      discGeometry.dispose();
      glassMaterial.dispose();
      discMaterial.dispose();
      roomTarget.dispose();
      glassTargets.light.dispose();
      glassTargets.dark.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      role="img"
      aria-label="Lattice logo: a glass torus overlapping a solid disc"
      className={`relative ${className}`}
    >
      <div ref={mountRef} className="absolute inset-0" />
      {fallback ? (
        <LatticeMark className="absolute inset-0 m-auto h-3/4 w-3/4 text-ink-primary" />
      ) : null}
    </div>
  );
}
