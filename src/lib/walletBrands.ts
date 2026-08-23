// Registry of wallet brand icons (image files in /public/icons/wallets).
// The stored wallet.icon value is the brand key below.

export const WALLET_BRAND_MAP: Record<string, string> = {
  mandiri: '/icons/wallets/330px-Livin_by_Mandiri.svg.webp',
  bca: '/icons/wallets/330px-Bank_Central_Asia.svg.webp',
  bni: '/icons/wallets/330px-Bank_Negara_Indonesia_logo_(2004).svg.webp',
  btn: '/icons/wallets/330px-BTN_2024.svg.webp',
  bri: '/icons/wallets/330px-BANK_BRI_logo_(vertical).svg.webp',
  jago: '/icons/wallets/330px-Bank_Jago_2026.svg.webp',
  gopay: '/icons/wallets/330px-Gopay_logo_(2019).svg.webp',
  ovo: '/icons/wallets/330px-Logo_ovo_purple.svg.webp',
  dana: '/icons/wallets/330px-Logo_dana_blue.svg.webp',
  shopeepay: '/icons/wallets/330px-Shopee.svg.webp',
};

// Ordered list of brand keys for the icon picker grid.
export const WALLET_BRAND_KEYS: string[] = [
  'mandiri',
  'bca',
  'bni',
  'btn',
  'bri',
  'jago',
  'gopay',
  'ovo',
  'dana',
  'shopeepay',
];

// Display labels for brand keys.
export const WALLET_BRAND_LABELS: Record<string, string> = {
  mandiri: 'Mandiri/Livin',
  bca: 'BCA',
  bni: 'BNI',
  btn: 'BTN',
  bri: 'BRI',
  jago: 'Bank Jago',
  gopay: 'GoPay',
  ovo: 'OVO',
  dana: 'DANA',
  shopeepay: 'ShopeePay',
};
