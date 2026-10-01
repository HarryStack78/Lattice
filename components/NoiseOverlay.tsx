export default function NoiseOverlay() {
  return (
    <svg
      aria-hidden="true"
      className="noise-overlay"
      xmlns="http://www.w3.org/2000/svg"
    >
      <filter id="lattice-noise">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves="2"
          stitchTiles="stitch"
          result="noise"
        />
        <feColorMatrix in="noise" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#lattice-noise)" />
    </svg>
  );
}
