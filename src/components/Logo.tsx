export const Logo = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 120 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Neural node icon */}
      <circle cx="20" cy="20" r="5" fill="white" />
      <circle cx="8" cy="10" r="3" fill="white" opacity="0.6" />
      <circle cx="8" cy="30" r="3" fill="white" opacity="0.6" />
      <circle cx="32" cy="10" r="3" fill="white" opacity="0.6" />
      <circle cx="32" cy="30" r="3" fill="white" opacity="0.6" />
      <line x1="20" y1="15" x2="8" y2="13" stroke="white" strokeWidth="1" opacity="0.4" />
      <line x1="20" y1="25" x2="8" y2="27" stroke="white" strokeWidth="1" opacity="0.4" />
      <line x1="20" y1="15" x2="32" y2="13" stroke="white" strokeWidth="1" opacity="0.4" />
      <line x1="20" y1="25" x2="32" y2="27" stroke="white" strokeWidth="1" opacity="0.4" />
      {/* ВИКИ text */}
      <text
        x="44"
        y="27"
        fontFamily="serif"
        fontSize="22"
        fontWeight="300"
        fill="white"
        letterSpacing="3"
      >
        ВИКИ
      </text>
      <text
        x="46"
        y="36"
        fontFamily="monospace"
        fontSize="7"
        fill="white"
        opacity="0.45"
        letterSpacing="2"
      >
        AI
      </text>
    </svg>
  );
};
