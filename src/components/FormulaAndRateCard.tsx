import React, { useRef, useState } from 'react';
import { RotateCcw, Upload, Download } from 'lucide-react';
import {
  CostModelResult,
  CurrencyCode,
  PricingConfig,
} from '../types/costModel';
import { formatCurrencyExact, formatUnitRate } from '../utils/currency';
import { exportRateCardAsJson } from '../utils/exportUtils';
import { HelpIconButton, InfoModalContent } from './InfoModal';

interface FormulaAndRateCardProps {
  pricing: PricingConfig;
  result: CostModelResult;
  currency: CurrencyCode;
  usdToInrRate: number;
  onUpdatePricing: (updater: (prev: PricingConfig) => PricingConfig) => void;
  onResetPricing: () => void;
  onImportJson: (rawJson: string) => { ok: boolean; message: string };
  onOpenInfo: (info: InfoModalContent) => void;
}

export const FormulaAndRateCard: React.FC<FormulaAndRateCardProps> = ({
  pricing,
  result,
  currency,
  usdToInrRate,
  onUpdatePricing,
  onResetPricing,
  onImportJson,
  onOpenInfo,
}) => {
  const [subTab, setSubTab] = useState<'formulas' | 'ratecard'>('formulas');
  const [importStatus, setImportStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleComponentRateChange = (
    componentId: string,
    field: 'baseFixedUsd' | 'unitRateUsd' | 'appliesHaDr',
    value: number | boolean
  ) => {
    onUpdatePricing((prev) => ({
      ...prev,
      components: prev.components.map((c) =>
        c.id === componentId ? { ...c, [field]: value } : c
      ),
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const res = onImportJson(reader.result);
        setImportStatus(res);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header matching the left-end '!' trigger */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-slate-900 text-white font-mono font-bold text-sm shrink-0">
            !
          </span>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-display font-semibold text-slate-900">
              Audit Formulas & Editable Rate Card
            </h2>
            <HelpIconButton
              label="Formulas & Rate Card"
              onClick={() =>
                onOpenInfo({
                  title: 'Deterministic Audit Formulas & Rate Card',
                  category: 'Model Transparency',
                  description:
                    'Inspect every substituted mathematical equation driving the current TCO output, or customize unit prices, fixed bases, engineering hourly rates, and topology multipliers directly in the pricing rate card.',
                  guidance:
                    'Use Export Rate Card or Import JSON to persist and share custom enterprise rate cards across teams.',
                })
              }
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg mr-2">
            <button
              type="button"
              onClick={() => setSubTab('formulas')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                subTab === 'formulas'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Formula Inspector
            </button>
            <button
              type="button"
              onClick={() => setSubTab('ratecard')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                subTab === 'ratecard'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rate Card Editor
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON</span>
          </button>
          <button
            type="button"
            onClick={() => exportRateCardAsJson(pricing)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Rate Card</span>
          </button>
          <button
            type="button"
            onClick={onResetPricing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {importStatus && (
        <div
          className={`px-4 py-3 rounded-xl border text-xs font-medium flex items-center justify-between ${
            importStatus.ok
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{importStatus.message}</span>
          <button
            type="button"
            onClick={() => setImportStatus(null)}
            className="underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {subTab === 'formulas' ? (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-display font-semibold text-slate-900 mb-3">
              Deterministic Calculation Equations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-slate-500 mb-1">1. Gross Monthly Infra Cost</div>
                <div className="text-slate-900 font-medium">
                  C_gross,i = BaseFixed_i + (Usage_i × UnitRate_i × VolDisc_i × HA_DR × Env)
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-slate-500 mb-1">2. Legacy Offset Credit</div>
                <div className="text-slate-900 font-medium">
                  L_i = min(C_gross,i, C_gross,i × ReusePercentage_i × EfficiencyFactor_i)
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-slate-500 mb-1">3. Net Monthly Infra Cost</div>
                <div className="text-slate-900 font-medium">
                  C_net,i = max(0, C_gross,i − L_i)
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-slate-500 mb-1">4. Total Cost of Ownership (TCO)</div>
                <div className="text-slate-900 font-medium">
                  TCO = CapEx_one_time + (Σ C_net,i × Months)
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70">
              <h3 className="text-sm font-display font-semibold text-slate-900">
                One-Time Implementation CapEx Audit ({formatCurrencyExact(result.capex.totalCapexUsd, currency, usdToInrRate)})
              </h3>
            </div>
            <div className="divide-y divide-slate-200 text-xs">
              <div className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-slate-900">OOTB Connectors Setup</span>
                  <div className="font-mono text-slate-500 mt-0.5">{result.capex.ootbFormula}</div>
                </div>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {formatCurrencyExact(result.capex.ootbConnectorsCapexUsd, currency, usdToInrRate)}
                </span>
              </div>
              <div className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-slate-900">Bespoke Connectors Engineering</span>
                  <div className="font-mono text-slate-500 mt-0.5">{result.capex.bespokeFormula}</div>
                </div>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {formatCurrencyExact(result.capex.bespokeConnectorsCapexUsd, currency, usdToInrRate)}
                </span>
              </div>
              <div className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-slate-900">Legacy Extraction / Strangler Glue</span>
                  <div className="font-mono text-slate-500 mt-0.5">{result.capex.legacyExtractionFormula}</div>
                </div>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {formatCurrencyExact(result.capex.legacyExtractionCapexUsd, currency, usdToInrRate)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <h3 className="text-sm font-display font-semibold text-slate-900">
                Component-by-Component Formula Substitution Log
              </h3>
              <span className="text-xs font-mono text-slate-500">
                1 USD = {usdToInrRate.toFixed(2)} INR
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="py-2.5 px-4 font-semibold">Layer / Component</th>
                    <th className="py-2.5 px-4 font-semibold">Live Formula Substitution (USD Base)</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Gross ({currency})</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Credit ({currency})</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Net / mo ({currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {result.layers.flatMap((layer) =>
                    layer.components.map((comp) => (
                      <tr key={comp.componentId} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-4 align-top">
                          <div className="font-semibold text-slate-900">{comp.name}</div>
                          <div className="text-[11px] text-slate-500">
                            0{layer.layerNumber}. {layer.shortTitle}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600 align-top max-w-md">
                          {comp.substitutedFormula}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700 align-top whitespace-nowrap">
                          {formatCurrencyExact(comp.grossMonthlyUsd, currency, usdToInrRate)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-emerald-700 align-top whitespace-nowrap">
                          {comp.legacyOffsetMonthlyUsd > 0
                            ? `−${formatCurrencyExact(comp.legacyOffsetMonthlyUsd, currency, usdToInrRate)}`
                            : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 align-top whitespace-nowrap">
                          {formatCurrencyExact(comp.netMonthlyUsd, currency, usdToInrRate)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-display font-semibold text-slate-900 mb-4">
              Global Engineering & Topology Multipliers (USD Base Rate Card)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 mb-1">
                  Blended Engineering Rate (USD/hr)
                </label>
                <input
                  type="number"
                  min={10}
                  step={5}
                  value={pricing.engineeringHourlyRateUsd}
                  onChange={(e) =>
                    onUpdatePricing((prev) => ({
                      ...prev,
                      engineeringHourlyRateUsd: Math.max(0, parseFloat(e.target.value) || 0),
                    }))
                  }
                  className="w-full font-mono tabular-nums font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                />
                <div className="text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
                  Active: {formatCurrencyExact(pricing.engineeringHourlyRateUsd, currency, usdToInrRate)}/hr
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">
                  Migration Base Cost / System (USD)
                </label>
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={pricing.migrationBaseCostPerSystemUsd}
                  onChange={(e) =>
                    onUpdatePricing((prev) => ({
                      ...prev,
                      migrationBaseCostPerSystemUsd: Math.max(0, parseFloat(e.target.value) || 0),
                    }))
                  }
                  className="w-full font-mono tabular-nums font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                />
                <div className="text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
                  Active: {formatCurrencyExact(pricing.migrationBaseCostPerSystemUsd, currency, usdToInrRate)}
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">
                  Multi-AZ HA Multiplier
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  step={0.05}
                  value={pricing.haDrMultipliers.multi_az.multiplier}
                  onChange={(e) =>
                    onUpdatePricing((prev) => ({
                      ...prev,
                      haDrMultipliers: {
                        ...prev.haDrMultipliers,
                        multi_az: {
                          ...prev.haDrMultipliers.multi_az,
                          multiplier: Math.max(1, parseFloat(e.target.value) || 1),
                        },
                      },
                    }))
                  }
                  className="w-full font-mono tabular-nums font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">
                  Full CDC/Outbox Sync Factor
                </label>
                <input
                  type="number"
                  min={0.5}
                  max={5}
                  step={0.05}
                  value={pricing.dataSyncComplexityFactors.full_cdc_outbox.factor}
                  onChange={(e) =>
                    onUpdatePricing((prev) => ({
                      ...prev,
                      dataSyncComplexityFactors: {
                        ...prev.dataSyncComplexityFactors,
                        full_cdc_outbox: {
                          ...prev.dataSyncComplexityFactors.full_cdc_outbox,
                          factor: Math.max(0.1, parseFloat(e.target.value) || 1),
                        },
                      },
                    }))
                  }
                  className="w-full font-mono tabular-nums font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <h3 className="text-sm font-display font-semibold text-slate-900">
                Component Unit Pricing Rate Card
              </h3>
              <span className="text-xs text-slate-500">
                USD base inputs · live {currency} readout
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="py-2.5 px-4 font-semibold">Component</th>
                    <th className="py-2.5 px-4 font-semibold">Usage Unit</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Base Fixed (USD)</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Unit Rate (USD)</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Unit Rate ({currency})</th>
                    <th className="py-2.5 px-4 font-semibold text-center">HA/DR Scales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {pricing.components.map((comp) => {
                    const layer = pricing.layers.find((l) => l.id === comp.layerId);
                    return (
                      <tr key={comp.id} className="hover:bg-slate-50/60">
                        <td className="py-2 px-4">
                          <div className="font-medium text-slate-900">{comp.name}</div>
                          <div className="text-[11px] text-slate-500">
                            0{layer?.number}. {layer?.shortTitle}
                          </div>
                        </td>
                        <td className="py-2 px-4 text-slate-600">{comp.unitLabel}</td>
                        <td className="py-2 px-4 text-right">
                          <input
                            type="number"
                            min={0}
                            step={10}
                            value={comp.baseFixedUsd}
                            onChange={(e) =>
                              handleComponentRateChange(
                                comp.id,
                                'baseFixedUsd',
                                Math.max(0, parseFloat(e.target.value) || 0)
                              )
                            }
                            aria-label={`${comp.name} base fixed USD`}
                            className="w-24 text-right font-mono tabular-nums bg-slate-50 border border-slate-200 rounded px-2 py-1"
                          />
                        </td>
                        <td className="py-2 px-4 text-right">
                          <input
                            type="number"
                            min={0}
                            step={0.05}
                            value={comp.unitRateUsd}
                            onChange={(e) =>
                              handleComponentRateChange(
                                comp.id,
                                'unitRateUsd',
                                Math.max(0, parseFloat(e.target.value) || 0)
                              )
                            }
                            aria-label={`${comp.name} unit rate USD`}
                            className="w-24 text-right font-mono tabular-nums bg-slate-50 border border-slate-200 rounded px-2 py-1"
                          />
                        </td>
                        <td className="py-2 px-4 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                          {formatUnitRate(comp.unitRateUsd, currency, usdToInrRate)}
                        </td>
                        <td className="py-2 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={comp.appliesHaDr}
                            onChange={(e) =>
                              handleComponentRateChange(
                                comp.id,
                                'appliesHaDr',
                                e.target.checked
                              )
                            }
                            aria-label={`${comp.name} applies HA/DR`}
                            className="h-4 w-4 accent-blue-700 rounded cursor-pointer"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
