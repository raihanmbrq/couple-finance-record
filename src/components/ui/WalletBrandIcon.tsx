import { WALLET_BRAND_MAP } from '@/lib/walletBrands';

interface WalletBrandIconProps {
  brand: string;
  className?: string;
}

export function WalletBrandIcon({ brand, className }: WalletBrandIconProps) {
  const src = WALLET_BRAND_MAP[brand];
  if (!src) return null;
  return <img src={src} alt={brand} draggable={false} className={className} />;
}
