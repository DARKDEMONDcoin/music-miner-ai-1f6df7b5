type Props = { size?: number; className?: string };

export function GramIcon({ size = 20, className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 56 56"
      width={size}
      height={size}
      role="img"
      aria-label="GRAM coin"
      className={`shrink-0 ${className}`}
    >
      <circle cx="28" cy="28" r="28" fill="#0098EA" />
      <path
        d="M37.6 15.6H18.4c-3.5 0-5.8 3.8-4 6.9l11.8 20.5c.8 1.4 2.8 1.4 3.6 0l11.8-20.5c1.8-3.1-.5-6.9-4-6.9Zm-11.4 21-2.6-5-6.2-11.1c-.4-.7.1-1.6 1-1.6h7.8v17.7Zm12.2-16.1-6.2 11.1-2.6 5V18.9h7.8c.9 0 1.4.9 1 1.6Z"
        fill="#fff"
      />
    </svg>
  );
}

export function UsdtIcon({ size = 20, className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 56 56"
      width={size}
      height={size}
      role="img"
      aria-label="USDT coin"
      className={`shrink-0 ${className}`}
    >
      <circle cx="28" cy="28" r="28" fill="#26A17B" />
      <path
        d="M31.3 25.4v-3.6h8.2v-5.5H16.5v5.5h8.2v3.6c-6.7.3-11.7 1.6-11.7 3.2s5 2.9 11.7 3.2v11.5h6.6V31.8c6.7-.3 11.7-1.6 11.7-3.2s-5-2.9-11.7-3.2Zm0 5.3c-.2 0-1.2.1-3.3.1-1.7 0-2.9 0-3.3-.1-6.4-.3-11.2-1.4-11.2-2.7s4.8-2.4 11.2-2.7v4.3c.4 0 1.7.1 3.4.1 2 0 3.1-.1 3.2-.1v-4.3c6.4.3 11.2 1.4 11.2 2.7s-4.8 2.4-11.2 2.7Z"
        fill="#fff"
      />
    </svg>
  );
}

export function CoinIcon({ id, size = 20, className = "" }: Props & { id: string }) {
  return id === "usdt" ? (
    <UsdtIcon size={size} className={className} />
  ) : (
    <GramIcon size={size} className={className} />
  );
}
