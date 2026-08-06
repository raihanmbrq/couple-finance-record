import {
  Banknote, Wallet, CreditCard, PiggyBank, Coins, Briefcase,
  ShoppingBag, Landmark, Sparkles, Receipt, ShieldCheck, Vault,
  Smartphone, type LucideIcon,
} from 'lucide-react';

export const WALLET_ICON_MAP: Record<string, LucideIcon> = {
  Banknote, Wallet, CreditCard, PiggyBank, Coins, Briefcase,
  ShoppingBag, Landmark, Sparkles, Receipt, ShieldCheck, Vault, Smartphone,
};

export function walletTypeIcon(iconName?: string | null): LucideIcon {
  return (iconName && WALLET_ICON_MAP[iconName]) || Wallet;
}