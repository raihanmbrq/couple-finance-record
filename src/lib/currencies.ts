export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  locale: string;
}

// Comprehensive list of world currencies (ISO 4217).
// `locale` is used by Intl.NumberFormat so amounts format naturally for each currency.
export const CURRENCIES: CurrencyInfo[] = [
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩', locale: 'id-ID' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', locale: 'en-US' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', locale: 'de-DE' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', locale: 'en-GB' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', locale: 'ja-JP' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', locale: 'zh-CN' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰', locale: 'zh-HK' },
  { code: 'TWD', name: 'New Taiwan Dollar', symbol: 'NT$', flag: '🇹🇼', locale: 'zh-TW' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷', locale: 'ko-KR' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', locale: 'en-SG' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾', locale: 'ms-MY' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭', locale: 'th-TH' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳', locale: 'vi-VN' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭', locale: 'fil-PH' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', locale: 'en-IN' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', flag: '🇵🇰', locale: 'en-PK' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', flag: '🇧🇩', locale: 'bn-BD' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs', flag: '🇱🇰', locale: 'en-LK' },
  { code: 'MMK', name: 'Myanmar Kyat', symbol: 'K', flag: '🇲🇲', locale: 'my-MM' },
  { code: 'KHR', name: 'Cambodian Riel', symbol: '៛', flag: '🇰🇭', locale: 'km-KH' },
  { code: 'LAK', name: 'Lao Kip', symbol: '₭', flag: '🇱🇦', locale: 'lo-LA' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', locale: 'en-AU' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿', locale: 'en-NZ' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦', locale: 'en-CA' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭', locale: 'de-CH' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪', locale: 'sv-SE' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴', locale: 'nb-NO' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰', locale: 'da-DK' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', flag: '🇵🇱', locale: 'pl-PL' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', flag: '🇨🇿', locale: 'cs-CZ' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', flag: '🇭🇺', locale: 'hu-HU' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷', locale: 'tr-TR' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺', locale: 'ru-RU' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', flag: '🇺🇦', locale: 'uk-UA' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦', locale: 'ar-SA' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪', locale: 'ar-AE' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق', flag: '🇶🇦', locale: 'ar-QA' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', flag: '🇰🇼', locale: 'ar-KW' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب', flag: '🇧🇭', locale: 'ar-BH' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع.', flag: '🇴🇲', locale: 'ar-OM' },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.ا', flag: '🇯🇴', locale: 'ar-JO' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', flag: '🇪🇬', locale: 'ar-EG' },
  { code: 'ILS', name: 'Israeli New Shekel', symbol: '₪', flag: '🇮🇱', locale: 'he-IL' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦', locale: 'en-ZA' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬', locale: 'en-NG' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪', locale: 'en-KE' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽', locale: 'es-MX' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷', locale: 'pt-BR' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', flag: '🇦🇷', locale: 'es-AR' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', flag: '🇨🇱', locale: 'es-CL' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', flag: '🇨🇴', locale: 'es-CO' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', flag: '🇵🇪', locale: 'es-PE' },
];

const DEFAULT_CURRENCY: CurrencyInfo = CURRENCIES[0]; // IDR

export function getCurrencyInfo(code?: string | null): CurrencyInfo {
  const found = CURRENCIES.find((c) => c.code === code);
  return found ?? DEFAULT_CURRENCY;
}

export function getCurrencySymbol(code?: string | null): string {
  return getCurrencyInfo(code).symbol;
}

export function getCurrencyLocale(code?: string | null): string {
  return getCurrencyInfo(code).locale;
}