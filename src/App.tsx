import React, { useMemo, useState } from 'react';
import {
  DEFAULT_PRICING_CONFIG,
  SCENARIO_PRESETS,
} from './config/pricingConfig';
import { calculateCostModel } from './engine/costEngine';
import {
  CurrencyCode,
  LayerId,
  PricingConfig,
  ScenarioConfig,
} from './types/costModel';
import { AppView, Header } from './components/Header';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { ArchitectureBlueprint } from './components/ArchitectureBlueprint';
import { LayerModeler } from './components/LayerModeler';
import { ConnectorBuilder } from './components/ConnectorBuilder';
import { ScenarioComparison } from './components/ScenarioComparison';
import { FormulaAndRateCard } from './components/FormulaAndRateCard';
import { HelpIconButton, InfoModal, InfoModalContent } from './components/InfoModal';
import {
  exportBreakdownAsCsv,
  exportBundleAsJson,
  exportRateCardAsJson,
} from './utils/exportUtils';

function cloneData<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('modeler');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [pricing, setPricing] = useState<PricingConfig>(() =>
    cloneData(DEFAULT_PRICING_CONFIG)
  );
  const [usdToInrRate, setUsdToInrRate] = useState<number>(
    DEFAULT_PRICING_CONFIG.defaultUsdToInrRate
  );
  const [scenario, setScenario] = useState<ScenarioConfig>(() =>
    cloneData(SCENARIO_PRESETS[0])
  );
  const [customSnapshots, setCustomSnapshots] = useState<ScenarioConfig[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<LayerId | 'all'>('all');
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [blueprintExpanded, setBlueprintExpanded] = useState<boolean>(true);
  const [infoModalContent, setInfoModalContent] = useState<InfoModalContent | null>(null);

  const result = useMemo(
    () => calculateCostModel(scenario, pricing),
    [scenario, pricing]
  );

  const handleApplyPreset = (presetId: string) => {
    const found = SCENARIO_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setScenario(cloneData(found));
    }
  };

  const handleLoadScenario = (target: ScenarioConfig) => {
    setScenario(cloneData(target));
    setActiveView('modeler');
  };

  const handleSaveSnapshot = (name: string) => {
    const snapshot: ScenarioConfig = {
      ...cloneData(scenario),
      id: `snap_${Date.now()}`,
      name,
    };
    setCustomSnapshots((prev) => [...prev, snapshot]);
  };

  const handleDeleteSnapshot = (id: string) => {
    setCustomSnapshots((prev) => prev.filter((s) => s.id !== id));
  };

  const handleResetPricing = () => {
    setPricing(cloneData(DEFAULT_PRICING_CONFIG));
    setUsdToInrRate(DEFAULT_PRICING_CONFIG.defaultUsdToInrRate);
  };

  const handleImportJson = (rawJson: string): { ok: boolean; message: string } => {
    try {
      const parsed = JSON.parse(rawJson);
      if (parsed && parsed.scenario && parsed.pricingConfig) {
        setScenario(parsed.scenario as ScenarioConfig);
        setPricing(parsed.pricingConfig as PricingConfig);
        if (typeof parsed.usdToInrRate === 'number' && parsed.usdToInrRate > 0) {
          setUsdToInrRate(parsed.usdToInrRate);
        }
        return { ok: true, message: 'Imported scenario and pricing rate card successfully.' };
      }
      if (parsed && Array.isArray(parsed.components) && Array.isArray(parsed.layers)) {
        setPricing(parsed as PricingConfig);
        return { ok: true, message: 'Imported pricing rate card successfully.' };
      }
      if (parsed && parsed.componentUsages && Array.isArray(parsed.connectors)) {
        setScenario(parsed as ScenarioConfig);
        return { ok: true, message: 'Imported scenario configuration successfully.' };
      }
      return { ok: false, message: 'Unrecognized JSON structure for scenario or rate card.' };
    } catch {
      return { ok: false, message: 'Invalid JSON file. Please verify the file contents.' };
    }
  };

  const handleJumpToLayer = (layerId: LayerId | 'all') => {
    setSelectedLayerId(layerId);
    setSelectedComponentId(null);
    setActiveView('modeler');
  };

  const handleSelectComponent = (layerId: LayerId, componentId: string | null) => {
    setSelectedLayerId(layerId);
    setSelectedComponentId(componentId);
    setActiveView('modeler');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header
        activeView={activeView}
        onChangeView={setActiveView}
        currency={currency}
        onChangeCurrency={setCurrency}
        usdToInrRate={usdToInrRate}
        onChangeUsdToInrRate={setUsdToInrRate}
        defaultUsdToInrRate={pricing.defaultUsdToInrRate}
        onExportJson={() =>
          exportBundleAsJson(scenario, pricing, currency, usdToInrRate, result)
        }
        onExportCsv={() => exportBreakdownAsCsv(result, currency, usdToInrRate)}
        onExportRateCard={() => exportRateCardAsJson(pricing)}
      />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Second Row (Desktop ! trigger on LHS + Page Title + ? Info Trigger) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setActiveView('formulas')}
              title="Formulas & Rate Card"
              aria-label="Formulas & Rate Card"
              aria-pressed={activeView === 'formulas'}
              className={`hidden lg:inline-flex items-center justify-center w-7 h-7 rounded-md border font-mono font-bold text-sm transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600 ${
                activeView === 'formulas'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
              }`}
            >
              !
            </button>
            <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight text-slate-900 text-balance">
              AI FinOps — Enterprise Infrastructure Cost Modeler
            </h1>
            <HelpIconButton
              label="About AI FinOps"
              onClick={() =>
                setInfoModalContent({
                  title: 'AI FinOps — Enterprise Infrastructure Cost Modeler',
                  category: 'Deterministic FinOps Workbench',
                  description:
                    'Models upfront CapEx, recurring monthly OpEx, Legacy Stack Reuse credits, and multi-year TCO across a 6-layer enterprise AI & EAI architecture. Every calculation runs 100% deterministically in TypeScript with zero runtime LLM calls.',
                  details: [
                    { label: 'Rate Card Updated', value: pricing.lastUpdated },
                    { label: 'Exchange Rate', value: `1 USD = ₹${usdToInrRate.toFixed(2)}` },
                    { label: 'Active Currency', value: currency },
                    { label: 'Active Scenario', value: scenario.name },
                  ],
                  guidance:
                    'Click the "!" button on the left side to inspect live formulas or edit unit rates.',
                })
              }
            />
          </div>

          <div className="text-xs font-mono tabular-nums text-slate-500">
            {scenario.name} · {currency === 'INR' ? `1 USD = ₹${usdToInrRate.toFixed(2)}` : 'USD Base'}
          </div>
        </div>

        {/* Executive Summary visible on Modeler & Connectors */}
        {(activeView === 'modeler' || activeView === 'connectors') && (
          <ExecutiveSummary
            result={result}
            currency={currency}
            usdToInrRate={usdToInrRate}
            onSelectLayer={handleJumpToLayer}
            onOpenInfo={setInfoModalContent}
          />
        )}

        {/* Active Workspace View */}
        {activeView === 'modeler' && (
          <>
            <ArchitectureBlueprint
              scenario={scenario}
              pricing={pricing}
              result={result}
              currency={currency}
              usdToInrRate={usdToInrRate}
              selectedLayerId={selectedLayerId}
              selectedComponentId={selectedComponentId}
              isExpanded={blueprintExpanded}
              onToggleExpand={() => setBlueprintExpanded((prev) => !prev)}
              onSelectLayer={handleJumpToLayer}
              onSelectComponent={handleSelectComponent}
              onOpenConnectors={() => setActiveView('connectors')}
              onOpenInfo={setInfoModalContent}
            />

            <LayerModeler
              scenario={scenario}
              pricing={pricing}
              result={result}
              presets={SCENARIO_PRESETS}
              currency={currency}
              usdToInrRate={usdToInrRate}
              selectedLayerId={selectedLayerId}
              selectedComponentId={selectedComponentId}
              onSelectLayer={handleJumpToLayer}
              onSelectComponent={handleSelectComponent}
              onApplyPreset={handleApplyPreset}
              onUpdateScenario={setScenario}
              onOpenConnectorBuilder={() => setActiveView('connectors')}
              onOpenInfo={setInfoModalContent}
            />
          </>
        )}

        {activeView === 'connectors' && (
          <ConnectorBuilder
            scenario={scenario}
            pricing={pricing}
            result={result}
            currency={currency}
            usdToInrRate={usdToInrRate}
            onUpdateScenario={setScenario}
            onOpenInfo={setInfoModalContent}
          />
        )}

        {activeView === 'scenarios' && (
          <ScenarioComparison
            activeScenario={scenario}
            presets={SCENARIO_PRESETS}
            customSnapshots={customSnapshots}
            pricing={pricing}
            currency={currency}
            usdToInrRate={usdToInrRate}
            onLoadScenario={handleLoadScenario}
            onSaveSnapshot={handleSaveSnapshot}
            onDeleteSnapshot={handleDeleteSnapshot}
            onOpenInfo={setInfoModalContent}
          />
        )}

        {activeView === 'formulas' && (
          <FormulaAndRateCard
            pricing={pricing}
            result={result}
            currency={currency}
            usdToInrRate={usdToInrRate}
            onUpdatePricing={setPricing}
            onResetPricing={handleResetPricing}
            onImportJson={handleImportJson}
            onOpenInfo={setInfoModalContent}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            AI FinOps · Deterministic Client-Side Cost Modeler
          </span>
          <span className="font-mono tabular-nums">
            pricingConfig.ts ({pricing.lastUpdated}) · 1 USD = ₹{usdToInrRate.toFixed(2)}
          </span>
        </div>
      </footer>

      <InfoModal
        content={infoModalContent}
        onClose={() => setInfoModalContent(null)}
      />
    </div>
  );
}
