import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { calculateCostModel } from '../engine/costEngine';
import {
  CurrencyCode,
  PricingConfig,
  ScenarioConfig,
} from '../types/costModel';
import { formatCurrencyCompact, formatCurrencyExact } from '../utils/currency';
import { HelpIconButton, InfoModalContent } from './InfoModal';

interface ScenarioComparisonProps {
  activeScenario: ScenarioConfig;
  presets: ScenarioConfig[];
  customSnapshots: ScenarioConfig[];
  pricing: PricingConfig;
  currency: CurrencyCode;
  usdToInrRate: number;
  onLoadScenario: (scenario: ScenarioConfig) => void;
  onSaveSnapshot: (name: string) => void;
  onDeleteSnapshot: (id: string) => void;
  onOpenInfo: (info: InfoModalContent) => void;
}

export const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({
  activeScenario,
  presets,
  customSnapshots,
  pricing,
  currency,
  usdToInrRate,
  onLoadScenario,
  onSaveSnapshot,
  onDeleteSnapshot,
  onOpenInfo,
}) => {
  const [snapshotName, setSnapshotName] = useState('');

  const allScenarios = useMemo(() => {
    const working: ScenarioConfig = {
      ...activeScenario,
      id: '__active_working__',
      name: `Current Working Model (${activeScenario.name})`,
    };
    return [working, ...presets, ...customSnapshots];
  }, [activeScenario, presets, customSnapshots]);

  const evaluated = useMemo(
    () =>
      allScenarios.map((sc) => ({
        scenario: sc,
        result: calculateCostModel(sc, pricing),
        isWorking: sc.id === '__active_working__',
        isPreset: presets.some((p) => p.id === sc.id),
      })),
    [allScenarios, pricing, presets]
  );

  const handleSaveSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = snapshotName.trim() || `Custom Snapshot ${customSnapshots.length + 1}`;
    onSaveSnapshot(trimmed);
    setSnapshotName('');
  };

  const maxBarValueUsd = Math.max(
    1,
    ...evaluated.map((item) =>
      Math.max(
        item.result.totalNetTcoUsd,
        item.result.totalLegacySavingsOverHorizonUsd
      )
    )
  );

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-display font-semibold text-slate-900">
            Scenario Presets & Side-by-Side Comparison
          </h2>
          <HelpIconButton
            label="Scenario Comparison"
            onClick={() =>
              onOpenInfo({
                title: 'Scenario Presets & Side-by-Side Comparison',
                category: 'Architecture Evaluation',
                description:
                  'Compare your live working configuration alongside the 3 canonical enterprise architecture presets (Greenfield Cloud-Native, Brownfield Monolith Strangler, and Hybrid On-Prem + Cloud RAG) as well as any custom snapshots you save. Every scenario is evaluated deterministically against your active pricing rate card.',
              })
            }
          />
        </div>

        <form onSubmit={handleSaveSnapshot} className="flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={snapshotName}
            onChange={(e) => setSnapshotName(e.target.value)}
            placeholder="Snapshot name..."
            className="w-48 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
            aria-label="Custom snapshot name"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Snapshot Current Model</span>
          </button>
        </form>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h3 className="text-sm font-display font-semibold text-slate-900">
            Horizon TCO vs. CapEx & Legacy Savings
          </h3>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-slate-900 inline-block" />
              CapEx
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-blue-700 inline-block" />
              Net OpEx
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-600 inline-block" />
              Legacy Saved
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {evaluated.map(({ scenario, result, isWorking }) => {
            const capexPct = (result.capex.totalCapexUsd / maxBarValueUsd) * 100;
            const opexPct = (result.totalNetOpexOverHorizonUsd / maxBarValueUsd) * 100;
            const savedPct = (result.totalLegacySavingsOverHorizonUsd / maxBarValueUsd) * 100;

            return (
              <div key={scenario.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs gap-4">
                  <span className={`font-medium truncate ${isWorking ? 'text-blue-700 font-semibold' : 'text-slate-800'}`}>
                    {scenario.name} ({result.horizonMonths}m)
                  </span>
                  <div className="flex items-center gap-3 font-mono tabular-nums shrink-0">
                    <span className="text-slate-900 font-semibold">
                      TCO {formatCurrencyCompact(result.totalNetTcoUsd, currency, usdToInrRate)}
                    </span>
                    <span className="text-emerald-700">
                      Saved {formatCurrencyCompact(result.totalLegacySavingsOverHorizonUsd, currency, usdToInrRate)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="w-full h-3 bg-slate-100 rounded-sm overflow-hidden flex">
                    <div
                      className="h-full bg-slate-900 transition-all duration-200"
                      style={{ width: `${Math.max(capexPct, 0.5)}%` }}
                      title={`CapEx: ${formatCurrencyExact(result.capex.totalCapexUsd, currency, usdToInrRate)}`}
                    />
                    <div
                      className="h-full bg-blue-700 transition-all duration-200"
                      style={{ width: `${Math.max(opexPct, 0.5)}%` }}
                      title={`Net OpEx: ${formatCurrencyExact(result.totalNetOpexOverHorizonUsd, currency, usdToInrRate)}`}
                    />
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 transition-all duration-200"
                      style={{ width: `${savedPct}%` }}
                      title={`Legacy Savings: ${formatCurrencyExact(result.totalLegacySavingsOverHorizonUsd, currency, usdToInrRate)}`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="py-3 px-4 text-xs font-semibold text-slate-700 min-w-[200px]">
                  Metric / Architectural Layer
                </th>
                {evaluated.map(({ scenario, isWorking, isPreset }) => (
                  <th
                    key={scenario.id}
                    className={`py-3 px-4 text-right text-xs font-semibold min-w-[180px] ${
                      isWorking ? 'text-blue-800 bg-blue-50/40' : 'text-slate-900'
                    }`}
                  >
                    <div className="truncate">{scenario.name}</div>
                    <div className="mt-1.5 flex items-center justify-end gap-2 font-normal">
                      {!isWorking && (
                        <button
                          type="button"
                          onClick={() => onLoadScenario(scenario)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 rounded"
                        >
                          <Check className="w-3 h-3" />
                          Load
                        </button>
                      )}
                      {!isWorking && !isPreset && (
                        <button
                          type="button"
                          onClick={() => onDeleteSnapshot(scenario.id)}
                          className="p-1 text-slate-400 hover:text-red-700 rounded"
                          aria-label={`Delete ${scenario.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              <tr>
                <td className="py-2.5 px-4 text-slate-600">HA / DR Topology</td>
                {evaluated.map(({ scenario, isWorking }) => (
                  <td
                    key={scenario.id}
                    className={`py-2.5 px-4 text-right font-mono tabular-nums text-slate-800 ${
                      isWorking ? 'bg-blue-50/20' : ''
                    }`}
                  >
                    {pricing.haDrMultipliers[scenario.haDrTier].label}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-slate-600">Horizon & Legacy Systems</td>
                {evaluated.map(({ scenario, isWorking }) => (
                  <td
                    key={scenario.id}
                    className={`py-2.5 px-4 text-right font-mono tabular-nums text-slate-800 ${
                      isWorking ? 'bg-blue-50/20' : ''
                    }`}
                  >
                    {scenario.horizonMonths} mo · {scenario.legacySystemsCount} systems
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-medium text-slate-900">One-Time Implementation CapEx</td>
                {evaluated.map(({ scenario, result, isWorking }) => (
                  <td
                    key={scenario.id}
                    className={`py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 ${
                      isWorking ? 'bg-blue-50/20' : ''
                    }`}
                  >
                    {formatCurrencyExact(result.capex.totalCapexUsd, currency, usdToInrRate)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-slate-600">Gross Monthly Infra OpEx</td>
                {evaluated.map(({ scenario, result, isWorking }) => (
                  <td
                    key={scenario.id}
                    className={`py-2.5 px-4 text-right font-mono tabular-nums text-slate-600 ${
                      isWorking ? 'bg-blue-50/20' : ''
                    }`}
                  >
                    {formatCurrencyExact(result.totalGrossMonthlyOpexUsd, currency, usdToInrRate)}/mo
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-emerald-700 font-medium">Legacy Stack Offset Credit</td>
                {evaluated.map(({ scenario, result, isWorking }) => (
                  <td
                    key={scenario.id}
                    className={`py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-emerald-700 ${
                      isWorking ? 'bg-blue-50/20' : ''
                    }`}
                  >
                    −{formatCurrencyExact(result.totalLegacyOffsetMonthlyUsd, currency, usdToInrRate)}/mo
                  </td>
                ))}
              </tr>
              <tr className="bg-slate-50/70">
                <td className="py-2.5 px-4 font-semibold text-slate-900">Net Monthly Infra OpEx</td>
                {evaluated.map(({ scenario, result, isWorking }) => (
                  <td
                    key={scenario.id}
                    className={`py-2.5 px-4 text-right font-mono tabular-nums font-bold text-slate-900 ${
                      isWorking ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    {formatCurrencyExact(result.totalNetMonthlyOpexUsd, currency, usdToInrRate)}/mo
                  </td>
                ))}
              </tr>

              {pricing.layers.map((layerDef) => (
                <tr key={layerDef.id}>
                  <td className="py-2 px-4 text-slate-600">
                    0{layerDef.number}. {layerDef.shortTitle} (Net/mo)
                  </td>
                  {evaluated.map(({ scenario, result, isWorking }) => {
                    const l = result.layers.find((x) => x.layerId === layerDef.id);
                    return (
                      <td
                        key={scenario.id}
                        className={`py-2 px-4 text-right font-mono tabular-nums text-slate-800 ${
                          isWorking ? 'bg-blue-50/20' : ''
                        }`}
                      >
                        {formatCurrencyExact(l?.netMonthlyUsd ?? 0, currency, usdToInrRate)}
                      </td>
                    );
                  })}
                </tr>
              ))}

              <tr className="bg-slate-900 text-white">
                <td className="py-3 px-4 font-display font-semibold">
                  Total Net TCO (CapEx + Horizon OpEx)
                </td>
                {evaluated.map(({ scenario, result }) => (
                  <td
                    key={scenario.id}
                    className="py-3 px-4 text-right font-mono tabular-nums font-bold"
                  >
                    {formatCurrencyCompact(result.totalNetTcoUsd, currency, usdToInrRate)}
                    <div className="text-[10px] font-normal text-slate-300">
                      {formatCurrencyExact(result.totalNetTcoUsd, currency, usdToInrRate)}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
