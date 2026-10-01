"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";

const INTERACTIVE =
  'a, button, [role="button"], [data-cursor="link"], summary, label, select, input[type="button"], input[type="submit"], input[type="checkbox"], input[type="radio"]';
const TEXT_INPUT =
  'input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea';

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });
    const dotX = gsap.quickTo(dot, "x", { duration: 0.1, ease: "power3.out" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.1, ease: "power3.out" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.4, ease: "power3.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.4, ease: "power3.out" });

    let tracking = false;
    let mouseListenersAttached = false;

    const handleMove = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const isTextInput = Boolean(target?.closest(TEXT_INPUT));

      if (!tracking) {
        tracking = true;
        gsap.set([dot, ring], { x: event.clientX, y: event.clientY });
        document.body.setAttribute("data-cursor-ready", "true");
      }

      if (isTextInput) {
        setVisible(false);
      } else {
        setVisible(true);
      }

      dotX(event.clientX);
      dotY(event.clientY);
      ringX(event.clientX);
      ringY(event.clientY);
    };

    const handleOver = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const isTextInput = Boolean(target?.closest(TEXT_INPUT));
      if (isTextInput) {
        setVisible(false);
        setHovering(false);
      } else {
        setVisible(true);
        setHovering(Boolean(target?.closest(INTERACTIVE)));
      }
    };

    const handleLeave = () => setVisible(false);
    const handleDown = () => gsap.to(ring, { scale: 0.75, duration: 0.2, ease: "power3.out" });
    const handleUp = () => gsap.to(ring, { scale: 1, duration: 0.35, ease: "power3.out" });

    function attachMouseTracking() {
      if (mouseListenersAttached) return;
      mouseListenersAttached = true;
      window.addEventListener("mousemove", handleMove, { passive: true });
      document.addEventListener("mouseover", handleOver);
      document.documentElement.addEventListener("mouseleave", handleLeave);
      window.addEventListener("mousedown", handleDown);
      window.addEventListener("mouseup", handleUp);
    }

    function detachMouseTracking() {
      if (!mouseListenersAttached) return;
      mouseListenersAttached = false;
      tracking = false;
      window.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseover", handleOver);
      document.documentElement.removeEventListener("mouseleave", handleLeave);
      window.removeEventListener("mousedown", handleDown);
      window.removeEventListener("mouseup", handleUp);
      document.body.removeAttribute("data-cursor-ready");
      setVisible(false);
      gsap.killTweensOf([dot, ring]);
    }

    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (media.matches) attachMouseTracking();

    // Some hybrid devices and mobile webviews misreport pointer capabilities, or dispatch a
    // synthetic mousemove after a tap for click-compatibility. A real touch event is the more
    // trustworthy signal, so it always wins: once one fires, the cursor is disabled for good
    // (rather than just for that turn), since a device that can touch shouldn't show a mouse
    // cursor even if it also has a trackpad.
    const handleTouch = () => {
      detachMouseTracking();
      window.removeEventListener("touchstart", handleTouch);
      media.removeEventListener?.("change", handleMediaChange);
    };
    window.addEventListener("touchstart", handleTouch, { passive: true, capture: true });

    // Devices that can switch input (e.g. a touchscreen laptop) react live to capability changes.
    function handleMediaChange(event: MediaQueryListEvent) {
      if (event.matches) attachMouseTracking();
      else detachMouseTracking();
    }
    media.addEventListener?.("change", handleMediaChange);

    return () => {
      detachMouseTracking();
      window.removeEventListener("touchstart", handleTouch, { capture: true } as EventListenerOptions);
      media.removeEventListener?.("change", handleMediaChange);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-[9999] mix-blend-difference transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{ viewTransitionName: "lattice-cursor" } as React.CSSProperties}
    >
      <div
        ref={dotRef}
        className={`absolute left-0 top-0 h-2 w-2 rounded-full bg-white transition-opacity duration-200 ${
          hovering ? "opacity-0" : "opacity-100"
        }`}
      />
      <div
        ref={ringRef}
        className={`absolute left-0 top-0 rounded-full border border-white transition-[width,height,background-color] duration-300 ease-power4 ${
          hovering ? "h-14 w-14 bg-white" : "h-9 w-9 bg-transparent"
        }`}
      />
    </div>
  );
}
