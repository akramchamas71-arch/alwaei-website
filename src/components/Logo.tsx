type LogoProps = {
  className?: string;
  variant?: "dark" | "light";
};

// Original wordmark logo for "الوعي" (Al-Wa'i): a stylised radiating-eye
// glyph — an abstract emblem of awareness/insight — beside the site name.
export default function Logo({ className = "", variant = "dark" }: LogoProps) {
  const ink = variant === "dark" ? "#7c1620" : "#f2e6c9";
  const textColor = variant === "dark" ? "#14100e" : "#ffffff";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width="42"
        height="42"
        viewBox="0 0 42 42"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="21" cy="21" r="20" stroke={ink} strokeWidth="1.5" />
        <path
          d="M4 21C9 12 15 8 21 8C27 8 33 12 38 21C33 30 27 34 21 34C15 34 9 30 4 21Z"
          stroke={ink}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="21" cy="21" r="6.5" fill={ink} />
        <circle cx="23.2" cy="18.8" r="1.6" fill={variant === "dark" ? "#f8f6f2" : "#14100e"} />
      </svg>
      <span
        className="font-heading font-extrabold text-2xl tracking-tight"
        style={{ color: textColor }}
      >
        الوعي
      </span>
    </div>
  );
}
