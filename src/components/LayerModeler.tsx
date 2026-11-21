import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import {
  CostModelResult,
  CurrencyCode,
  DataSyncMode,
  HaDrTier,
  LayerId,
  PricingConfig,
  ScenarioConfig,
} from '../types/costModel';
import { formatCurrencyCompact, formatCurrencyExact, formatUnitRate } from '../utils/currency';
import { HelpIconButton, InfoModalContent } from './InfoModal';

interface LayerModelerProps {
  scenario: ScenarioConfig;
  pricing: PricingConfig;
  result: CostModelResult;
  presets: ScenarioConfig[];
  currency: CurrencyCode;
  usdToInrRate: number;
  selectedLayerId: LayerId | 'all';
  selectedComponentId: string | null;
  onSelectLayer: (layerId: LayerId | 'all') => void;
  onSelectComponent: (layerId: LayerId, componentId: string | null) => void;
  onApplyPreset: (presetId: string) => void;
  onUpdateScenario: (updater: (prev: ScenarioConfig) => ScenarioConfig) => void;
  onOpenConnectorBuilder: () => void;
  onOpenInfo: (info: InfoModalContent) => void;
}

export const LayerModeler: React.FC<LayerModelerProps> = ({
  scenario,
  pricing,
  result,
  presets,
  currency,
  usdToInrRate,
  selectedLayerId,
  selectedComponentId,
  onSelectLayer,
  onSelectComponent,
  onApplyPreset,
  onUpdateScenario,
  onOpenConnectorBuilder,
  onOpenInfo,
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    if (!selectedComponentId) return;
    const el = document.getElementById(`component-row-${selectedComponentId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedComponentId]);

  const handleUsageChange = (componentId: string, value: number) => {
    const safeVal = Number.isFinite(value) ? Math.max(0, value) : 0;
    onUpdateScenario((prev) => ({
      ...prev,
      componentUsages: {
        ...prev.componentUsages,
        [componentId]: safeVal,
      },
    }));
  };

  const handleToggleChange = (
    toggleId: string,
    patch: Partial<{ enabled: boolean; reusePercentage: number; efficiencyFactor: number }>
  ) => {
    onUpdateScenario((prev) => {
      const def = pricing.legacyToggles.find((t) => t.id === toggleId);
      const current = prev.legacyToggles[toggleId] ?? {
        enabled: false,
        reusePercentage: def?.defaultReusePercentage ?? 50,
        efficiencyFactor: def?.defaultEfficiencyFactor ?? 0.85,
      };
      return {
        ...prev,
        legacyToggles: {
          ...prev.legacyToggles,
          [toggleId]: {
            ...current,
            ...patch,
          },
        },
      };
    });
  };

  const visibleLayers = result.layers.filter((l) =>
    selectedLayerId === 'all' ? true : l.layerId === selectedLayerId
  );

  const normalizedQuery = filterQuery.trim().toLowerCase();

  return (
    <div className="space-y-6">
      {/* Global Architecture & Horizon Parameter Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-display font-semibold text-slate-900">
              Architecture Baseline & Global Multipliers
            </h2>
            <HelpIconButton
              label="Active Scenario & Global Multipliers"
              onClick={() =>
                onOpenInfo({
                  title: scenario.name,
                  category: 'Active Baseline Scenario',
                  description: scenario.description,
                  details: [
                    { label: 'TCO Horizon', value: `${scenario.horizonMonths} months` },
                    {
                      label: 'HA / DR Topology',
                      value: pricing.haDrMultipliers[scenario.haDrTier].label,
                    },
                    { label: 'Non-Prod Multiplier', value: `${scenario.nonProdMultiplier.toFixed(2)}x` },
                    { label: 'Legacy Systems Decoupled', value: String(scenario.legacySystemsCount) },
                  ],
                })
              }
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 mr-1">Preset:</span>
            {presets.map((preset) => {
              const isSelected = scenario.id === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onApplyPreset(preset.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {preset.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* TCO Horizon */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-1">
                <label htmlFor="horizon-months" className="font-medium text-slate-700">
                  TCO Horizon
                </label>
                <HelpIconButton
                  label="TCO Horizon"
                  onClick={() =>
                    onOpenInfo({
                      title: 'TCO Planning Horizon',
                      category: 'Global Parameter',
                      description:
                        'Number of operating months over which recurring Net Monthly Infra OpEx is summed and added to upfront Implementation CapEx.',
                      formula: 'TCO = CapEx + (Net_Monthly_OpEx × Months)',
                    })
                  }
                />
              </div>
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {scenario.horizonMonths} mo
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {[12, 24, 36, 60].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() =>
                    onUpdateScenario((prev) => ({ ...prev, horizonMonths: m }))
                  }
                  className={`flex-1 py-1.5 text-xs font-mono tabular-nums rounded border transition-colors ${
                    scenario.horizonMonths === m
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>

          {/* HA / DR Topology */}
          <div>
            <div className="flex items-center gap-1 mb-1.5">
              <label htmlFor="ha-dr-select" className="text-xs font-medium text-slate-700">
                HA / DR Topology
              </label>
              <HelpIconButton
                label="HA / DR Topology"
                onClick={() =>
                  onOpenInfo({
                    title: 'High Availability & Disaster Recovery Tier',
                    category: 'Global Parameter',
                    description:
                      pricing.haDrMultipliers[scenario.haDrTier].description,
                    details: Object.values(pricing.haDrMultipliers).map((item) => ({
                      label: item.label,
                      value: `${item.multiplier.toFixed(2)}x variable scaling`,
                    })),
                  })
                }
              />
            </div>
            <select
              id="ha-dr-select"
              value={scenario.haDrTier}
              onChange={(e) =>
                onUpdateScenario((prev) => ({
                  ...prev,
                  haDrTier: e.target.value as HaDrTier,
                }))
              }
              className="w-full text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-blue-600"
            >
              {Object.entries(pricing.haDrMultipliers).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.label}
                </option>
              ))}
            </select>
          </div>

          {/* Environment Multiplier */}
          <div>
            <div className="flex items-center gap-1 mb-1.5">
              <label htmlFor="env-mult-select" className="text-xs font-medium text-slate-700">
                Non-Prod Environments
              </label>
              <HelpIconButton
                label="Non-Prod Environments"
                onClick={() =>
                  onOpenInfo({
                    title: 'Non-Production Environment Multiplier',
                    category: 'Global Parameter',
                    description:
                      'Accounts for staging, QA, and development infrastructure footprint on HA-scaled runtime, gateway, and data components. Token APIs and object archives are excluded from environment duplication.',
                  })
                }
              />
            </div>
            <select
              id="env-mult-select"
              value={scenario.nonProdMultiplier}
              onChange={(e) =>
                onUpdateScenario((prev) => ({
                  ...prev,
                  nonProdMultiplier: parseFloat(e.target.value) || 1.0,
                }))
              }
              className="w-full text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-blue-600"
            >
              <option value={1.0}>Prod Only (1.00x)</option>
              <option value={1.25}>Prod + Staging (1.25x)</option>
              <option value={1.4}>Prod + Staging + Dev/QA (1.40x)</option>
              <option value={1.6}>Full Multi-Env Mirror (1.60x)</option>
            </select>
          </div>

          {/* Legacy Systems Extracted */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-1">
                <label htmlFor="legacy-sys-count" className="font-medium text-slate-700">
                  Legacy Systems
                </label>
                <HelpIconButton
                  label="Legacy Systems Decoupled"
                  onClick={() =>
                    onOpenInfo({
                      title: 'Legacy Systems Decoupled (Strangler Glue)',
                      category: 'CapEx Parameter',
                      description:
                        'Number of legacy monoliths, ERPs, or core databases being strangled or synchronized into the new AI platform. Directly drives one-time extraction & data sync glue CapEx.',
                      formula:
                        'Extraction CapEx = LegacySystemsCount × DataSyncComplexityFactor × MigrationBaseCost',
                    })
                  }
                />
              </div>
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {scenario.legacySystemsCount}
              </span>
            </div>
            <input
              id="legacy-sys-count"
              type="range"
              min={0}
              max={20}
              step={1}
              value={scenario.legacySystemsCount}
              onChange={(e) =>
                onUpdateScenario((prev) => ({
                  ...prev,
                  legacySystemsCount: parseInt(e.target.value, 10) || 0,
                }))
              }
              className="w-full mt-1"
            />
          </div>

          {/* Monolith Data Sync Mode */}
          <div>
            <div className="flex items-center gap-1 mb-1.5">
              <label htmlFor="sync-mode-select" className="text-xs font-medium text-slate-700">
                Data Sync Mode
              </label>
              <HelpIconButton
                label="Monolith Data Sync Mode"
                onClick={() =>
                  onOpenInfo({
                    title: 'Monolith-to-Microservice Data Sync Mode',
                    category: 'CapEx & Strangler Pattern',
                    description:
                      pricing.dataSyncComplexityFactors[scenario.dataSyncMode].description,
                    details: Object.values(pricing.dataSyncComplexityFactors).map((item) => ({
                      label: item.label,
                      value: `${item.factor.toFixed(2)}x migration factor`,
                    })),
                  })
                }
              />
            </div>
            <select
              id="sync-mode-select"
              value={scenario.dataSyncMode}
              onChange={(e) =>
                onUpdateScenario((prev) => ({
                  ...prev,
                  dataSyncMode: e.target.value as DataSyncMode,
                }))
              }
              className="w-full text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-blue-600"
            >
              {Object.entries(pricing.dataSyncComplexityFactors).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Split: Left Layer Rail + Right Layer Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Navigation Rail */}
        <aside className="lg:col-span-3 lg:sticky lg:top-20 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800">Architectural Layers</span>
            <button
              type="button"
              onClick={() => {
                onSelectLayer('all');
                onSelectComponent('layer1_edge', null);
              }}
              className={`text-xs font-medium px-2 py-0.5 rounded transition-colors ${
                selectedLayerId === 'all'
                  ? 'bg-blue-700 text-white'
                  : 'text-blue-700 hover:bg-blue-50'
              }`}
            >
              All 6
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {result.layers.map((layer) => {
              const isSelected = selectedLayerId === layer.layerId;
              const activeLegacyCount = pricing.legacyToggles.filter(
                (t) => t.layerId === layer.layerId && scenario.legacyToggles[t.id]?.enabled
              ).length;

              return (
                <button
                  key={layer.layerId}
                  type="button"
                  onClick={() => onSelectLayer(layer.layerId)}
                  className={`w-full text-left px-4 py-3 transition-colors ${
                    isSelected ? 'bg-blue-50/80' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-semibold ${
                        isSelected ? 'text-blue-800' : 'text-slate-800'
                      }`}
                    >
                      0{layer.layerNumber}. {layer.shortTitle}
                    </span>
                    <span className="text-xs font-mono tabular-nums font-semibold text-slate-900">
                      {formatCurrencyCompact(layer.netMonthlyUsd, currency, usdToInrRate)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      {layer.components.length} items
                      {activeLegacyCount > 0 ? ` · ${activeLegacyCount} reused` : ''}
                    </span>
                    {layer.legacyOffsetMonthlyUsd > 0 && (
                      <span className="font-mono tabular-nums text-emerald-700">
                        −{formatCurrencyCompact(layer.legacyOffsetMonthlyUsd, currency, usdToInrRate)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-3 border-t border-slate-200 bg-slate-50/70">
            <input
              type="search"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter components..."
              className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-600"
              aria-label="Filter infrastructure components"
            />
          </div>
        </aside>

        {/* Right Layer Panels */}
        <div className="lg:col-span-9 space-y-6">
          {visibleLayers.map((layer) => {
            const layerDef = pricing.layers.find((l) => l.id === layer.layerId)!;
            const layerToggles = pricing.legacyToggles.filter((t) => t.layerId === layer.layerId);
            const filteredComponents = layer.components.filter((comp) => {
              if (!normalizedQuery) return true;
              const def = pricing.components.find((c) => c.id === comp.componentId);
              return (
                comp.name.toLowerCase().includes(normalizedQuery) ||
                (def?.description.toLowerCase().includes(normalizedQuery) ?? false)
              );
            });

            if (normalizedQuery && filteredComponents.length === 0) {
              return null;
            }

            return (
              <section
                key={layer.layerId}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden"
              >
                {/* Clean Layer Header with ? Icon */}
                <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-display font-semibold text-slate-900">
                      {layerDef.title}
                    </h3>
                    <HelpIconButton
                      label={layerDef.title}
                      onClick={() =>
                        onOpenInfo({
                          title: layerDef.title,
                          category: `Architectural Layer 0${layerDef.number}`,
                          description: layerDef.subtitle,
                          details: [
                            {
                              label: 'Gross Monthly OpEx',
                              value: formatCurrencyExact(layer.grossMonthlyUsd, currency, usdToInrRate),
                            },
                            {
                              label: 'Legacy Stack Credit',
                              value: `−${formatCurrencyExact(layer.legacyOffsetMonthlyUsd, currency, usdToInrRate)}`,
                            },
                            {
                              label: 'Net Monthly OpEx',
                              value: formatCurrencyExact(layer.netMonthlyUsd, currency, usdToInrRate),
                            },
                          ],
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center gap-4 shrink-0 font-mono tabular-nums">
                    <div className="text-right">
                      <div className="text-[11px] text-slate-500">Legacy Credit</div>
                      <div className="text-xs font-semibold text-emerald-700">
                        −{formatCurrencyExact(layer.legacyOffsetMonthlyUsd, currency, usdToInrRate)}/mo
                      </div>
                    </div>
                    <div className="text-right pl-4 border-l border-slate-200">
                      <div className="text-[11px] text-slate-500">Layer Net OpEx</div>
                      <div className="text-sm font-bold text-slate-900">
                        {formatCurrencyExact(layer.netMonthlyUsd, currency, usdToInrRate)}/mo
                      </div>
                    </div>
                  </div>
                </div>

                {/* Component Sizing Rows */}
                <div className="divide-y divide-slate-200">
                  {filteredComponents.map((comp) => {
                    const compDef = pricing.components.find((c) => c.id === comp.componentId)!;
                    const isFocused = selectedComponentId === comp.componentId;

                    return (
                      <div
                        id={`component-row-${comp.componentId}`}
                        key={comp.componentId}
                        onClick={() => onSelectComponent(layer.layerId, comp.componentId)}
                        className={`px-6 py-3.5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center transition-colors ${
                          isFocused ? 'bg-blue-50/70' : 'hover:bg-slate-50/40'
                        }`}
                      >
                        {/* Component Title + ? Info Modal Button */}
                        <div className="md:col-span-5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-slate-900">
                              {comp.name}
                            </span>
                            <HelpIconButton
                              label={comp.name}
                              onClick={() =>
                                onOpenInfo({
                                  title: comp.name,
                                  category: `0${layer.layerNumber}. ${layer.shortTitle}`,
                                  description: compDef.description,
                                  details: [
                                    {
                                      label: 'Base Fixed',
                                      value: formatUnitRate(comp.baseFixedUsd, currency, usdToInrRate),
                                    },
                                    {
                                      label: 'Unit Rate',
                                      value: `${formatUnitRate(comp.unitRateUsd, currency, usdToInrRate)} per ${comp.unitLabel}`,
                                    },
                                    {
                                      label: 'Volume Discount Tier',
                                      value: comp.volumeDiscountTierLabel,
                                    },
                                    {
                                      label: 'Applied Scaling',
                                      value: `HA ${comp.haDrMultiplierApplied.toFixed(2)}x · Env ${comp.nonProdMultiplierApplied.toFixed(2)}x`,
                                    },
                                    {
                                      label: 'Applied Legacy Toggles',
                                      value:
                                        comp.appliedLegacyToggleNames.length > 0
                                          ? comp.appliedLegacyToggleNames.join(', ')
                                          : 'None',
                                    },
                                  ],
                                  formula: comp.substitutedFormula,
                                })
                              }
                            />
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 font-mono tabular-nums">
                            <span>Base {formatUnitRate(comp.baseFixedUsd, currency, usdToInrRate)}</span>
                            <span aria-hidden="true">·</span>
                            <span>{formatUnitRate(comp.unitRateUsd, currency, usdToInrRate)} / unit</span>
                            {comp.volumeDiscountMultiplier < 1 && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-blue-700 font-medium">
                                  {comp.volumeDiscountTierLabel}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Interactive Usage Controls */}
                        <div className="md:col-span-4">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-slate-600">{comp.unitLabel}</span>
                            <input
                              type="number"
                              min={0}
                              step={compDef.stepUsageUnits}
                              value={comp.usageUnits}
                              onChange={(e) =>
                                handleUsageChange(
                                  comp.componentId,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              aria-label={`${comp.name} usage in ${comp.unitLabel}`}
                              className="w-24 text-right font-mono tabular-nums text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-blue-600"
                            />
                          </div>
                          <input
                            type="range"
                            min={compDef.minUsageUnits}
                            max={compDef.maxUsageUnits}
                            step={compDef.stepUsageUnits}
                            value={Math.min(compDef.maxUsageUnits, comp.usageUnits)}
                            onChange={(e) =>
                              handleUsageChange(
                                comp.componentId,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            aria-label={`${comp.name} slider`}
                            className="w-full"
                          />
                        </div>

                        {/* Cost Output */}
                        <div className="md:col-span-3 text-left md:text-right font-mono tabular-nums">
                          <div className="text-sm font-semibold text-slate-900">
                            {formatCurrencyExact(comp.netMonthlyUsd, currency, usdToInrRate)}/mo
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Gross {formatCurrencyExact(comp.grossMonthlyUsd, currency, usdToInrRate)}
                          </div>
                          {comp.legacyOffsetMonthlyUsd > 0 && (
                            <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                              −{formatCurrencyExact(comp.legacyOffsetMonthlyUsd, currency, usdToInrRate)} Saved ({Math.round(comp.effectiveReuseRatio * 100)}%)
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Layer 3 Connector OpEx Roll-up */}
                  {layer.layerId === 'layer3_integration' && (
                    <div className="px-6 py-4 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">
                          Connector Licenses & Bespoke Maintenance ({result.connectorResults.reduce((a, b) => a + b.quantity, 0)} adapters)
                        </span>
                        <HelpIconButton
                          label="Connector Recurring OpEx"
                          onClick={() =>
                            onOpenInfo({
                              title: 'Connector Recurring Licenses & Maintenance',
                              category: '03. Integration & EAI',
                              description:
                                'Monthly SaaS adapter license fees for OOTB connectors plus ongoing monthly maintenance engineering hours for Bespoke protocol adapters.',
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-sm font-mono tabular-nums font-semibold text-slate-900">
                          {formatCurrencyExact(layer.connectorOpexMonthlyUsd, currency, usdToInrRate)}/mo
                        </span>
                        <button
                          type="button"
                          onClick={onOpenConnectorBuilder}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 rounded-lg transition-colors whitespace-nowrap"
                        >
                          <span>Configure Connectors</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Existing Legacy Stack Toggles for this Layer */}
                {layerToggles.length > 0 && (
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                    <div className="flex items-center gap-1.5 mb-3">
                      <span className="text-xs font-semibold text-slate-800">
                        Existing Legacy Stack & Reuse Controls
                      </span>
                      <HelpIconButton
                        label="Existing Legacy Stack Controls"
                        onClick={() =>
                          onOpenInfo({
                            title: 'Existing Legacy Stack & Reuse Controls',
                            category: `0${layer.layerNumber}. ${layer.shortTitle}`,
                            description:
                              'Toggle existing enterprise infrastructure you already own to deterministically calculate monthly cost credits. Adjust Reuse % and Integration Efficiency Factor to reflect real-world capacity headroom and integration overhead.',
                            formula: 'L_i = C_gross,i × ReusePercentage_i × EfficiencyFactor_i',
                          })
                        }
                      />
                    </div>
                    <div className="divide-y divide-slate-200 bg-white border border-slate-200 rounded-lg">
                      {layerToggles.map((tDef) => {
                        const state = scenario.legacyToggles[tDef.id] ?? {
                          enabled: false,
                          reusePercentage: tDef.defaultReusePercentage,
                          efficiencyFactor: tDef.defaultEfficiencyFactor,
                        };
                        const targetNames = tDef.targetComponentIds
                          .map((cid) => pricing.components.find((c) => c.id === cid)?.name ?? cid)
                          .join(' · ');

                        return (
                          <div key={tDef.id} className="p-3.5">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <label
                                  htmlFor={`toggle-${tDef.id}`}
                                  className="text-xs font-semibold text-slate-900 cursor-pointer truncate"
                                >
                                  {tDef.name}
                                </label>
                                <HelpIconButton
                                  label={tDef.name}
                                  onClick={() =>
                                    onOpenInfo({
                                      title: tDef.name,
                                      category: 'Legacy Stack Reuse Toggle',
                                      description: tDef.description,
                                      details: [
                                        { label: 'Target Components Offset', value: targetNames },
                                        { label: 'Default Reuse %', value: `${tDef.defaultReusePercentage}%` },
                                        {
                                          label: 'Default Efficiency Factor',
                                          value: `${tDef.defaultEfficiencyFactor.toFixed(2)}x`,
                                        },
                                      ],
                                    })
                                  }
                                />
                              </div>

                              <button
                                id={`toggle-${tDef.id}`}
                                type="button"
                                role="switch"
                                aria-checked={state.enabled}
                                onClick={() =>
                                  handleToggleChange(tDef.id, { enabled: !state.enabled })
                                }
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 ${
                                  state.enabled ? 'bg-blue-700' : 'bg-slate-300'
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                                    state.enabled ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </div>

                            {state.enabled && (
                              <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <div className="flex items-center justify-between text-[11px] mb-1">
                                    <span className="font-medium text-slate-600">
                                      Capacity / Scope Reuse %
                                    </span>
                                    <span className="font-mono tabular-nums font-semibold text-slate-900">
                                      {state.reusePercentage}%
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min={5}
                                    max={100}
                                    step={5}
                                    value={state.reusePercentage}
                                    onChange={(e) =>
                                      handleToggleChange(tDef.id, {
                                        reusePercentage: parseInt(e.target.value, 10),
                                      })
                                    }
                                    className="w-full"
                                    aria-label={`${tDef.name} reuse percentage`}
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center justify-between text-[11px] mb-1">
                                    <span className="font-medium text-slate-600">
                                      Integration Efficiency Factor
                                    </span>
                                    <span className="font-mono tabular-nums font-semibold text-slate-900">
                                      {state.efficiencyFactor.toFixed(2)}x
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min={0.2}
                                    max={1.0}
                                    step={0.05}
                                    value={state.efficiencyFactor}
                                    onChange={(e) =>
                                      handleToggleChange(tDef.id, {
                                        efficiencyFactor: parseFloat(e.target.value),
                                      })
                                    }
                                    className="w-full"
                                    aria-label={`${tDef.name} integration efficiency factor`}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};
