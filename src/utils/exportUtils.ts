import {
  CostModelResult,
  CurrencyCode,
  PricingConfig,
  ScenarioConfig,
} from '../types/costModel';
import { convertFromUsd } from './currency';

export function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportBundleAsJson(
  scenario: ScenarioConfig,
  pricing: PricingConfig,
  currency: CurrencyCode,
  usdToInrRate: number,
  result: CostModelResult
) {
  const payload = {
    exportedAt: new Date().toISOString(),
    displayCurrency: currency,
    usdToInrRate,
    scenario,
    pricingConfig: pricing,
    calculatedSummary: {
      horizonMonths: result.horizonMonths,
      capexUsd: result.capex.totalCapexUsd,
      grossMonthlyOpexUsd: result.totalGrossMonthlyOpexUsd,
      legacyOffsetMonthlyUsd: result.totalLegacyOffsetMonthlyUsd,
      netMonthlyOpexUsd: result.totalNetMonthlyOpexUsd,
      netTcoUsd: result.totalNetTcoUsd,
    },
  };
  const slug = scenario.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  downloadTextFile(`cost_model_${slug}.json`, JSON.stringify(payload, null, 2), 'application/json');
}

function escapeCsv(val: string | number): string {
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportBreakdownAsCsv(
  result: CostModelResult,
  currency: CurrencyCode,
  usdToInrRate: number
) {
  const rows: string[][] = [
    [
      'Category',
      'Layer',
      'Item',
      'Usage / Qty',
      'Unit Label',
      `Gross Monthly (${currency})`,
      `Legacy Offset Monthly (${currency})`,
      `Net Monthly (${currency})`,
      `One-Time CapEx (${currency})`,
      `${result.horizonMonths}m Net Total (${currency})`,
    ],
  ];

  const conv = (usd: number) => convertFromUsd(usd, currency, usdToInrRate).toFixed(2);

  for (const layer of result.layers) {
    for (const comp of layer.components) {
      rows.push([
        'Infrastructure',
        layer.shortTitle,
        comp.name,
        String(comp.usageUnits),
        comp.unitLabel,
        conv(comp.grossMonthlyUsd),
        conv(comp.legacyOffsetMonthlyUsd),
        conv(comp.netMonthlyUsd),
        '0.00',
        conv(comp.netMonthlyUsd * result.horizonMonths),
      ]);
    }
    if (layer.connectorOpexMonthlyUsd > 0) {
      rows.push([
        'Connectors Recurring',
        layer.shortTitle,
        'OOTB Licenses & Bespoke Maintenance',
        String(result.connectorResults.reduce((a, b) => a + b.quantity, 0)),
        'Active Connectors',
        conv(layer.connectorOpexMonthlyUsd),
        '0.00',
        conv(layer.connectorOpexMonthlyUsd),
        '0.00',
        conv(layer.connectorOpexMonthlyUsd * result.horizonMonths),
      ]);
    }
  }

  for (const conn of result.connectorResults) {
    rows.push([
      `Connector (${conn.type})`,
      'Integration & EAI',
      conn.name,
      String(conn.quantity),
      'Connectors',
      conv(conn.monthlyOpexUsd),
      '0.00',
      conv(conn.monthlyOpexUsd),
      conv(conn.oneTimeCapexUsd),
      conv(conn.oneTimeCapexUsd + conn.monthlyOpexUsd * result.horizonMonths),
    ]);
  }

  rows.push([
    'Migration / Strangler Glue',
    'Integration & EAI',
    'Legacy System Extraction & Sync Glue',
    '1',
    'Program',
    '0.00',
    '0.00',
    '0.00',
    conv(result.capex.legacyExtractionCapexUsd),
    conv(result.capex.legacyExtractionCapexUsd),
  ]);

  rows.push([
    'TOTAL',
    'All Layers',
    result.scenarioName,
    String(result.horizonMonths),
    'Months',
    conv(result.totalGrossMonthlyOpexUsd),
    conv(result.totalLegacyOffsetMonthlyUsd),
    conv(result.totalNetMonthlyOpexUsd),
    conv(result.capex.totalCapexUsd),
    conv(result.totalNetTcoUsd),
  ]);

  const csvContent = rows.map((r) => r.map(escapeCsv).join(',')).join('\n');
  const slug = result.scenarioName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  downloadTextFile(`cost_breakdown_${slug}_${currency}.csv`, csvContent, 'text/csv');
}

export function exportRateCardAsJson(pricing: PricingConfig) {
  downloadTextFile(
    `pricing_rate_card_v${pricing.version}.json`,
    JSON.stringify(pricing, null, 2),
    'application/json'
  );
}
