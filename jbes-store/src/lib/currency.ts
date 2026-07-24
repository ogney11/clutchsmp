export const supportedCurrencies = ["USD", "EUR", "PLN", "GBP"] as const;

export type StoreCurrency = (typeof supportedCurrencies)[number];

export type CurrencyOption = {
  code: StoreCurrency;
  label: string;
  symbol: string;
  rateFromUsd: number;
  minorUnit: number;
};

export const defaultStoreCurrency: StoreCurrency = "USD";

export const currencyOptions: CurrencyOption[] = [
  { code: "USD", label: "US Dollar", symbol: "$", rateFromUsd: 1, minorUnit: 2 },
  { code: "EUR", label: "Euro", symbol: "€", rateFromUsd: 0.92, minorUnit: 2 },
  { code: "PLN", label: "Polish Zloty", symbol: "zł", rateFromUsd: 4, minorUnit: 2 },
  { code: "GBP", label: "British Pound", symbol: "£", rateFromUsd: 0.78, minorUnit: 2 },
];

const currencyMap = new Map(currencyOptions.map((option) => [option.code, option]));
const rateOverrides = parseRateOverrides(process.env.NEXT_PUBLIC_STORE_CURRENCY_RATES_JSON);

export function normalizeStoreCurrency(value: unknown): StoreCurrency {
  if (typeof value !== "string") return defaultStoreCurrency;

  const normalized = value.trim().toUpperCase();
  return isStoreCurrency(normalized) ? normalized : defaultStoreCurrency;
}

export function isStoreCurrency(value: string): value is StoreCurrency {
  return supportedCurrencies.includes(value as StoreCurrency);
}

export function getCurrencyOption(currency: StoreCurrency) {
  return currencyMap.get(currency) ?? currencyMap.get(defaultStoreCurrency)!;
}

export function convertUsdToCurrency(amountUsd: number, currency: StoreCurrency) {
  const option = getCurrencyOption(currency);
  const rate = rateOverrides[currency] ?? option.rateFromUsd;
  const factor = 10 ** option.minorUnit;

  return Math.round(amountUsd * rate * factor) / factor;
}

export function getStripeUnitAmountFromUsd(amountUsd: number, currency: StoreCurrency) {
  const option = getCurrencyOption(currency);
  return Math.round(convertUsdToCurrency(amountUsd, currency) * 10 ** option.minorUnit);
}

export function formatStorePrice(amountUsd: number, currency: StoreCurrency) {
  return formatCurrencyAmount(convertUsdToCurrency(amountUsd, currency), currency);
}

export function formatCurrencyAmount(amount: number, currency: StoreCurrency) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  }).format(amount);
}

function parseRateOverrides(raw?: string) {
  if (!raw) return {} as Partial<Record<StoreCurrency, number>>;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {} as Partial<Record<StoreCurrency, number>>;
    }

    const overrides: Partial<Record<StoreCurrency, number>> = {};

    for (const [currency, rate] of Object.entries(parsed)) {
      const normalizedCurrency = currency.toUpperCase();
      if (
        isStoreCurrency(normalizedCurrency) &&
        typeof rate === "number" &&
        Number.isFinite(rate) &&
        rate > 0
      ) {
        overrides[normalizedCurrency] = rate;
      }
    }

    return overrides;
  } catch {
    return {} as Partial<Record<StoreCurrency, number>>;
  }
}
