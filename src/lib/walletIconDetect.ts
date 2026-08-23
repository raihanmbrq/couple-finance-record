// Auto-detect wallet brand icon from the wallet name via keyword matching.
// Returns a brand key from WALLET_BRAND_MAP, or null when nothing matches.

const KEYWORD_TABLE: Record<string, string[]> = {
  mandiri: ['mandiri', 'livin', 'bmri'],
  bca: ['bca', 'blu'],
  bni: ['bni', 'negara indonesia'],
  btn: ['btn'],
  bri: ['bri', 'bank rakyat'],
  jago: ['jago'],
  gopay: ['gopay', 'gojek'],
  ovo: ['ovo'],
  dana: ['dana'],
  shopeepay: ['shopeepay', 'shopee'],
};

export function getAutoWalletIcon(name: string): string | null {
  const normalized = name.toLowerCase();
  for (const [brand, keywords] of Object.entries(KEYWORD_TABLE)) {
    if (keywords.some((kw) => normalized.includes(kw))) {
      return brand;
    }
  }
  return null;
}

// Save-time "easter egg": only when the wallet name matches a brand AND the
// selected wallet type is the matching system type, force the brand icon.
const BANK_BRANDS = new Set(['mandiri', 'bca', 'bni', 'btn', 'bri', 'jago']);
const EWALLET_BRANDS = new Set(['gopay', 'ovo', 'dana', 'shopeepay']);

export function getSaveTimeWalletIcon(name: string, typeId: string): string | null {
  const brand = getAutoWalletIcon(name);
  if (!brand) return null;
  const normalizedType = typeId.toLowerCase();
  if (BANK_BRANDS.has(brand) && normalizedType === 'bank') return brand;
  if (EWALLET_BRANDS.has(brand) && normalizedType === 'ewallet') return brand;
  return null;
}
