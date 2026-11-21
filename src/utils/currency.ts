import { CurrencyCode } from '../types/costModel';

/**
 * Converts a base USD amount deterministically to the selected currency.
 */
export function convertFromUsd(amountUsd: number, currency: CurrencyCode, usdToInrRate: number): number {
  if (!Number.isFinite(amountUsd)) return 0;
  if (currency === 'USD') return amountUsd;
  const safeRate = Number.isFinite(usdToInrRate) && usdToInrRate > 0 ? usdToInrRate : 92.7;
  return amountUsd * safeRate;
}

/**
 * Formats a USD base amount in exact full precision (e.g. $1,24,500 or ₹1,15,41,150).
 */
export function formatCurrencyExact(
  amountUsd: number,
  currency: CurrencyCode,
  usdToInrRate: number,
  maximumFractionDigits = 0
): string {
  const converted = convertFromUsd(amountUsd, currency, usdToInrRate);
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(converted);
}

/**
 * Formats a USD base amount using compact Indian (Lakhs / Crores) or US (K / M) notation.
 */
export function formatCurrencyCompact(
  amountUsd: number,
  currency: CurrencyCode,
  usdToInrRate: number
): string {
  const converted = convertFromUsd(amountUsd, currency, usdToInrRate);
  const abs = Math.abs(converted);
  const sign = converted < 0 ? '-' : '';

  if (currency === 'INR') {
    if (abs >= 1_00_00_000) {
      return `${sign}₹${(abs / 1_00_00_000).toFixed(2)} Cr`;
    }
    if (abs >= 1_00_000) {
      return `${sign}₹${(abs / 1_00_000).toFixed(2)} L`;
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(converted);
  }

  // USD compact formatting ($, K, M)
  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 10_000) {
    return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(converted);
}

/**
 * Formats unit rate (often has decimals like $1.25 or ₹115.88).
 */
export function formatUnitRate(
  amountUsd: number,
  currency: CurrencyCode,
  usdToInrRate: number
): string {
  const converted = convertFromUsd(amountUsd, currency, usdToInrRate);
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(converted);
}
