import gramCoin from "@/assets/coins/gram.png";
import usdtCoin from "@/assets/coins/usdt.png";

type Props = { size?: number; className?: string };

export function GramIcon({ size = 20, className = "" }: Props) {
  return (
    <img
      src={gramCoin}
      alt="GRAM coin"
      width={size}
      height={size}
      loading="lazy"
      className={`shrink-0 object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function UsdtIcon({ size = 20, className = "" }: Props) {
  return (
    <img
      src={usdtCoin}
      alt="USDT coin"
      width={size}
      height={size}
      loading="lazy"
      className={`shrink-0 object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function CoinIcon({ id, size = 20, className = "" }: Props & { id: string }) {
  return id === "usdt" ? (
    <UsdtIcon size={size} className={className} />
  ) : (
    <GramIcon size={size} className={className} />
  );
}
