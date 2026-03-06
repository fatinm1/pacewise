"use client";

interface CornerBracketsProps {
  className?: string;
}

/**
 * Industrial corner bracket accents (CSS-only) for featured cards.
 */
export function CornerBrackets({ className = "" }: CornerBracketsProps) {
  return (
    <>
      {/* Top-left */}
      <span
        className={`absolute left-3 top-3 h-4 w-4 border-l-2 border-t-2 border-white/20 ${className}`}
        aria-hidden
      />
      {/* Top-right */}
      <span
        className={`absolute right-3 top-3 h-4 w-4 border-r-2 border-t-2 border-white/20 ${className}`}
        aria-hidden
      />
      {/* Bottom-left */}
      <span
        className={`absolute bottom-3 left-3 h-4 w-4 border-b-2 border-l-2 border-white/20 ${className}`}
        aria-hidden
      />
      {/* Bottom-right */}
      <span
        className={`absolute bottom-3 right-3 h-4 w-4 border-b-2 border-r-2 border-white/20 ${className}`}
        aria-hidden
      />
    </>
  );
}
