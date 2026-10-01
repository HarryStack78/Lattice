type LatticeMarkProps = {
  className?: string;
};

export default function LatticeMark({ className = "" }: LatticeMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="20" r="9" fill="currentColor" fillOpacity="0.28" />
      <circle cx="18.5" cy="13.5" r="9" stroke="currentColor" strokeWidth="4.2" />
    </svg>
  );
}
