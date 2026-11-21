import React from 'react';
import {
  Shield,
  Globe,
  Network,
  Webhook,
  KeyRound,
  Gauge,
  Lock,
  ArrowLeftRight,
  Radio,
  DatabaseZap,
  GitBranch,
  Plug,
  Cpu,
  Sparkles,
  Binary,
  Boxes,
  Zap,
  Share2,
  SearchCode,
  Database,
  FileJson,
  MemoryStick,
  HardDrive,
  Activity,
  BookOpen,
  GitPullRequest,
  Receipt,
  ChevronDown,
  ChevronUp,
  Layers,
} from 'lucide-react';
import {
  CostModelResult,
  CurrencyCode,
  LayerId,
  PricingConfig,
  ScenarioConfig,
} from '../types/costModel';
import { formatCurrencyCompact, formatCurrencyExact, formatUnitRate } from '../utils/currency';
import { HelpIconButton, InfoModalContent } from './InfoModal';

interface ArchitectureBlueprintProps {
  scenario: ScenarioConfig;
  pricing: PricingConfig;
  result: CostModelResult;
  currency: CurrencyCode;
  usdToInrRate: number;
  selectedLayerId: LayerId | 'all';
  selectedComponentId: string | null;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelectLayer: (layerId: LayerId | 'all') => void;
  onSelectComponent: (layerId: LayerId, componentId: string) => void;
  onOpenConnectors: () => void;
  onOpenInfo: (info: InfoModalContent) => void;
}

const COMPONENT_ICONS: Record<string, React.ReactNode> = {
  waf_ddos: <Shield className="w-3.5 h-3.5 text-slate-600 shrink-0" />,
  cdn_edge: <Globe className="w-3.5 h-3.5 text-slate-600 shrink-0" />,
  api_gateway: <Network className="w-3.5 h-3.5 text-slate-600 shrink-0" />,
  webhook_engine: <Webhook className="w-3.5 h-3.5 text-slate-600 shrink-0" />,
  idp_auth: <KeyRound className="w-3.5 h-3.5 text-slate-600 shrink-0" />,
  quota_engine: <Gauge className="w-3.5 h-3.5 text-slate-600 shrink-0" />,
  s2s_vault: <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />,
  sync_mediation: <ArrowLeftRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />,
  event_hub: <Radio className="w-3.5 h-3.5 text-slate-600 shrink-0" />,
  cdc_outbox: <DatabaseZap className="w-3.5 h-3.5 text-slate-600 shrink-0" />,
  saga_engine: <GitBranch className="w-3.5 h-3.5 text-slate-600 shrink-0" />,
  gpu_nodes: <Cpu className="w-3.5 h-3.5 text-slate-600 shrink-0" />,
  llm_token_api: <Sparkles className="w-3.5 h-3.5 text-slate-600 shrink-0" />,
  embedding_pipeline: <Binary className="w-3.5 h-3.5 text-slate-600 shrink-0" />,
  k8s_orchestration: <Boxes className="w-3.5 h-3.5 text-slate-600 shrink-0" />,
  serverless_faas: <Zap className="w-3.5 h-3.5 text-slate-600 shrink-0" />,
  service_mesh_registry: <Share2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />,
  vector_db: <SearchCode className="w-3.5 h-3.5 text-slate-600 shrink-0" />,
  operational_rdbms: <Database className="w-3.5 h-3.5 text-slate-600 shrink-0" />,
  nosql_store: <FileJson className="w-3.5 h-3.5 text-slate-600 shrink-0" />,
  semantic_cache: <MemoryStick className="w-3.5 h-3.5 text-slate-600 shrink-0" />,
  object_storage: <HardDrive className="w-3.5 h-3.5 text-slate-600 shrink-0" />,
  apm_telemetry: <Activity className="w-3.5 h-3.5 text-slate-600 shrink-0" />,
  dev_portal: <BookOpen className="w-3.5 h-3.5 text-slate-600 shrink-0" />,
  cicd_gates: <GitPullRequest className="w-3.5 h-3.5 text-slate-600 shrink-0" />,
  finops_metering: <Receipt className="w-3.5 h-3.5 text-slate-600 shrink-0" />,
};

const BAND_STYLES: Record<LayerId, { bg: string; border: string; activeRing: string; titleColor: string }> = {
  layer1_edge: {
    bg: 'bg-[#E5E3F4]',
    border: 'border-[#C9C4E4]',
    activeRing: 'ring-2 ring-blue-700',
    titleColor: 'text-slate-900',
  },
  layer2_identity: {
    bg: 'bg-[#DCEAF4]',
    border: 'border-[#B9D3E6]',
    activeRing: 'ring-2 ring-blue-700',
    titleColor: 'text-slate-900',
  },
  layer3_integration: {
    bg: 'bg-[#DCEBDD]',
    border: 'border-[#B6D3BA]',
    activeRing: 'ring-2 ring-blue-700',
    titleColor: 'text-slate-900',
  },
  layer4_compute: {
    bg: 'bg-[#FBE4D2]',
    border: 'border-[#E8C5AA]',
    activeRing: 'ring-2 ring-blue-700',
    titleColor: 'text-slate-900',
  },
  layer5_data: {
    bg: 'bg-[#F1E2BD]',
    border: 'border-[#DBC48E]',
    activeRing: 'ring-2 ring-blue-700',
    titleColor: 'text-slate-900',
  },
  layer6_observability: {
    bg: 'bg-[#E4E9EE]',
    border: 'border-[#C5D0DA]',
    activeRing: 'ring-2 ring-blue-700',
    titleColor: 'text-slate-900',
  },
};

function FlowArrowDown() {
  return (
    <div className="flex justify-center -my-1.5 relative z-10 pointer-events-none" aria-hidden="true">
      <svg width="160" height="18" viewBox="0 0 160 18" className="overflow-visible">
        <line x1="40" y1="0" x2="40" y2="12" stroke="#64748B" strokeWidth="1.25" />
        <polygon points="36,11 44,11 40,17" fill="#64748B" />
        <line x1="80" y1="0" x2="80" y2="12" stroke="#64748B" strokeWidth="1.25" />
        <polygon points="76,11 84,11 80,17" fill="#64748B" />
        <line x1="120" y1="0" x2="120" y2="12" stroke="#64748B" strokeWidth="1.25" />
        <polygon points="116,11 124,11 120,17" fill="#64748B" />
      </svg>
    </div>
  );
}

export const ArchitectureBlueprint: React.FC<ArchitectureBlueprintProps> = ({
  scenario,
  pricing,
  result,
  currency,
  usdToInrRate,
  selectedLayerId,
  selectedComponentId,
  isExpanded,
  onToggleExpand,
  onSelectLayer,
  onSelectComponent,
  onOpenConnectors,
  onOpenInfo,
}) => {
  const horizontalLayers = result.layers.filter((l) => l.layerId !== 'layer6_observability');
  const layer6 = result.layers.find((l) => l.layerId === 'layer6_observability');

  const activeLegacyToggles = pricing.legacyToggles.filter(
    (t) => scenario.legacyToggles[t.id]?.enabled
  );

  const openComponentModal = (componentId: string) => {
    const def = pricing.components.find((c) => c.id === componentId);
    const compResult = result.layers
      .flatMap((l) => l.components)
      .find((c) => c.componentId === componentId);
    const layerDef = pricing.layers.find((l) => l.id === def?.layerId);

    if (!def || !compResult) return;

    onOpenInfo({
      title: compResult.name,
      category: layerDef ? `0${layerDef.number}. ${layerDef.shortTitle}` : undefined,
      description: def.description,
      details: [
        { label: 'Current Sizing', value: `${compResult.usageUnits} ${compResult.unitLabel}` },
        { label: 'Base Fixed Cost', value: formatUnitRate(compResult.baseFixedUsd, currency, usdToInrRate) },
        { label: 'Unit Rate', value: `${formatUnitRate(compResult.unitRateUsd, currency, usdToInrRate)} / unit` },
        { label: 'HA / DR & Env Scaling', value: `${compResult.haDrMultiplierApplied.toFixed(2)}x HA · ${compResult.nonProdMultiplierApplied.toFixed(2)}x Env` },
        { label: 'Gross Monthly', value: formatCurrencyExact(compResult.grossMonthlyUsd, currency, usdToInrRate) },
        { label: 'Legacy Credit', value: `−${formatCurrencyExact(compResult.legacyOffsetMonthlyUsd, currency, usdToInrRate)}` },
        { label: 'Net Monthly OpEx', value: formatCurrencyExact(compResult.netMonthlyUsd, currency, usdToInrRate) },
      ],
      formula: compResult.substitutedFormula,
    });
  };

  const renderComponentTile = (layerId: LayerId, componentId: string) => {
    const layerResult = result.layers.find((l) => l.layerId === layerId);
    const comp = layerResult?.components.find((c) => c.componentId === componentId);
    if (!comp) return null;

    const isFocused = selectedComponentId === componentId;
    const hasOffset = comp.legacyOffsetMonthlyUsd > 0;

    return (
      <div
        key={comp.componentId}
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          onSelectComponent(layerId, comp.componentId);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            onSelectComponent(layerId, comp.componentId);
          }
        }}
        className={`group relative bg-white/95 hover:bg-white border rounded-lg px-2.5 py-2 cursor-pointer transition-all flex flex-col justify-between min-w-0 ${
          isFocused
            ? 'border-blue-700 ring-2 ring-blue-600/30 shadow-xs'
            : 'border-slate-300/80 hover:border-blue-400'
        }`}
      >
        <div className="flex items-start justify-between gap-1.5">
          <div className="flex items-start gap-1.5 min-w-0">
            <span className="mt-0.5">{COMPONENT_ICONS[comp.componentId]}</span>
            <span className="text-[11px] font-semibold text-slate-900 leading-tight line-clamp-2">
              {comp.name}
            </span>
          </div>
          <HelpIconButton
            label={comp.name}
            onClick={() => openComponentModal(comp.componentId)}
            className="-mr-1 -mt-0.5"
          />
        </div>

        <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-baseline justify-between gap-1 font-mono tabular-nums text-[10px]">
          <span className="text-slate-500 truncate">
            {comp.usageUnits} {comp.unitLabel.split(' ')[0]}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {hasOffset && (
              <span className="text-emerald-700 font-medium">
                −{formatCurrencyCompact(comp.legacyOffsetMonthlyUsd, currency, usdToInrRate)}
              </span>
            )}
            <span className="font-bold text-slate-900">
              {formatCurrencyCompact(comp.netMonthlyUsd, currency, usdToInrRate)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section
      aria-label="Visual Architecture Blueprint"
      className="bg-white border border-slate-200 rounded-xl overflow-hidden"
    >
      {/* Blueprint Header */}
      <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50/70">
        <div className="flex items-center gap-2 min-w-0">
          <Layers className="w-4 h-4 text-blue-700 shrink-0" />
          <h2 className="text-sm font-display font-semibold text-slate-900 truncate">
            Interactive Enterprise AI & Integration Blueprint
          </h2>
          <HelpIconButton
            label="Visual Architecture Blueprint"
            onClick={() =>
              onOpenInfo({
                title: 'Visual 6-Layer Architecture Blueprint',
                category: 'Interactive Topology Map',
                description:
                  'This blueprint maps all 6 infrastructure layers and 25 costed components visually. Horizontal bands (Layers 1–5) show runtime request and data flow from perimeter exposure down to vector and operational state. The left rail shows Legacy Tech Stack Reuse Offsets feeding cost credits back into each layer; the right column shows Layer 6 cross-cutting Observability, CI/CD, and Developer Portal tooling.',
                guidance:
                  'Click any layer band or component tile to focus and configure its sizing sliders and legacy reuse controls directly below.',
              })
            }
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {selectedLayerId !== 'all' && (
            <button
              type="button"
              onClick={() => onSelectLayer('all')}
              className="text-xs font-medium text-blue-700 hover:underline whitespace-nowrap"
            >
              Show All 6 Layers
            </button>
          )}
          <button
            type="button"
            onClick={onToggleExpand}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1 bg-white border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
          >
            <span>{isExpanded ? 'Hide Diagram' : 'Show Diagram'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-5 bg-[#FBFBF9]">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-stretch">
            {/* LEFT PILLAR: Legacy Tech Stack Reuse Offsets */}
            <div className="xl:col-span-2 flex flex-col justify-between bg-[#DDE6D5] border border-[#B9C9AD] rounded-xl p-3.5">
              <div>
                <div className="flex items-start justify-between gap-1">
                  <h3 className="text-xs font-display font-bold text-slate-900 leading-snug">
                    Legacy Tech Stack Reuse Offsets
                  </h3>
                  <HelpIconButton
                    label="Legacy Tech Stack Reuse Offsets"
                    onClick={() =>
                      onOpenInfo({
                        title: 'Legacy Tech Stack Reuse Offsets',
                        category: 'Cost Credit Mechanism',
                        description:
                          'Represents existing enterprise platforms (Corporate IdP, ESB/Kafka, Kubernetes headroom, VMware, pgvector, Datadog/Splunk, APIM) that absorb part of the new AI workload.',
                        formula: 'Credit L_i = C_gross,i × ReusePercentage_i × EfficiencyFactor_i',
                        guidance:
                          'Enable legacy reuse toggles inside any layer panel below to reduce Net Monthly OpEx while tracking one-time strangler glue CapEx.',
                      })
                    }
                  />
                </div>
                <div className="mt-2 font-mono tabular-nums">
                  <div className="text-[11px] text-slate-600">Monthly Cost Credits</div>
                  <div className="text-base font-bold text-emerald-800">
                    −{formatCurrencyCompact(result.totalLegacyOffsetMonthlyUsd, currency, usdToInrRate)}/mo
                  </div>
                </div>
              </div>

              <div className="my-3 space-y-1.5 text-[11px] text-slate-700">
                <div className="font-semibold text-slate-800">
                  Active Reuses ({activeLegacyToggles.length})
                </div>
                {activeLegacyToggles.length === 0 ? (
                  <p className="text-slate-600 leading-snug">
                    Greenfield mode (0% legacy reuse active).
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {activeLegacyToggles.slice(0, 5).map((t) => (
                      <li key={t.id} className="truncate text-emerald-900 font-medium">
                        ← {t.name.replace('Reuse Existing ', '').replace('Reuse ', '')}
                      </li>
                    ))}
                    {activeLegacyToggles.length > 5 && (
                      <li className="text-slate-600">+{activeLegacyToggles.length - 5} more</li>
                    )}
                  </ul>
                )}
              </div>

              <div className="pt-2 border-t border-[#B9C9AD] text-[10px] font-mono text-slate-700 flex items-center justify-between">
                <span>⇄ Cost Offsets</span>
                <span>Credits</span>
              </div>
            </div>

            {/* CENTER STACK: Layers 1 to 5 */}
            <div className="xl:col-span-8 flex flex-col">
              {horizontalLayers.map((layer, idx) => {
                const layerDef = pricing.layers.find((l) => l.id === layer.layerId)!;
                const style = BAND_STYLES[layer.layerId];
                const isSelected = selectedLayerId === layer.layerId;
                const colsClass =
                  layer.components.length >= 6
                    ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                    : layer.components.length === 5
                    ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
                    : layer.components.length === 4
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                    : 'grid-cols-1 sm:grid-cols-3';

                return (
                  <React.Fragment key={layer.layerId}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelectLayer(layer.layerId)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectLayer(layer.layerId);
                        }
                      }}
                      className={`${style.bg} border ${style.border} ${
                        isSelected ? style.activeRing : 'hover:brightness-[0.985]'
                      } rounded-xl p-3 transition-all cursor-pointer`}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        {/* Layer Left Label Column */}
                        <div className="md:col-span-3 flex flex-col justify-between gap-1">
                          <div className="flex items-start justify-between gap-1">
                            <span className={`text-xs font-display font-bold leading-snug ${style.titleColor}`}>
                              {layer.layerNumber}. {layer.shortTitle}
                            </span>
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
                                      label: 'Legacy Reuse Credit',
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
                          <div className="flex items-center gap-2 font-mono tabular-nums text-[11px]">
                            <span className="font-bold text-slate-900">
                              {formatCurrencyCompact(layer.netMonthlyUsd, currency, usdToInrRate)}/mo
                            </span>
                            {layer.legacyOffsetMonthlyUsd > 0 && (
                              <span className="text-emerald-800 font-medium">
                                (−{formatCurrencyCompact(layer.legacyOffsetMonthlyUsd, currency, usdToInrRate)})
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Layer Inner Component Tiles */}
                        <div className={`md:col-span-9 grid ${colsClass} gap-2`}>
                          {layer.components.map((c) => renderComponentTile(layer.layerId, c.componentId))}

                          {/* Layer 3 also displays the OOTB & Bespoke Connectors Tile */}
                          {layer.layerId === 'layer3_integration' && (
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenConnectors();
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onOpenConnectors();
                                }
                              }}
                              className="bg-white/95 hover:bg-white border border-slate-300/80 hover:border-blue-500 rounded-lg px-2.5 py-2 cursor-pointer transition-all flex flex-col justify-between"
                            >
                              <div className="flex items-start justify-between gap-1.5">
                                <div className="flex items-start gap-1.5 min-w-0">
                                  <Plug className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                                  <span className="text-[11px] font-semibold text-slate-900 leading-tight">
                                    Channel Adapters (OOTB & Bespoke)
                                  </span>
                                </div>
                              </div>
                              <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-baseline justify-between gap-1 font-mono tabular-nums text-[10px]">
                                <span className="text-slate-500">
                                  {result.connectorResults.reduce((a, b) => a + b.quantity, 0)} adapters
                                </span>
                                <span className="font-bold text-slate-900">
                                  {formatCurrencyCompact(layer.connectorOpexMonthlyUsd, currency, usdToInrRate)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {idx < horizontalLayers.length - 1 && <FlowArrowDown />}
                  </React.Fragment>
                );
              })}
            </div>

            {/* RIGHT PILLAR: Layer 6 Observability, CI/CD & Ops Portal */}
            {layer6 && (
              <div
                role="button"
                tabIndex={0}
                onClick={() => onSelectLayer('layer6_observability')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectLayer('layer6_observability');
                  }
                }}
                className={`xl:col-span-2 flex flex-col justify-between bg-[#E3E9EE] border border-[#C3CFD9] ${
                  selectedLayerId === 'layer6_observability' ? 'ring-2 ring-blue-700' : 'hover:brightness-[0.985]'
                } rounded-xl p-3.5 cursor-pointer transition-all`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="text-xs font-display font-bold text-slate-900 leading-snug">
                      6. Observability, CI/CD & Ops Portal
                    </h3>
                    <HelpIconButton
                      label="Layer 6: Observability & Operations"
                      onClick={() => {
                        const def = pricing.layers.find((l) => l.id === 'layer6_observability')!;
                        onOpenInfo({
                          title: def.title,
                          category: 'Cross-Cutting Operations Pillar',
                          description: def.subtitle,
                          details: [
                            {
                              label: 'Gross Monthly OpEx',
                              value: formatCurrencyExact(layer6.grossMonthlyUsd, currency, usdToInrRate),
                            },
                            {
                              label: 'Legacy Reuse Credit',
                              value: `−${formatCurrencyExact(layer6.legacyOffsetMonthlyUsd, currency, usdToInrRate)}`,
                            },
                            {
                              label: 'Net Monthly OpEx',
                              value: formatCurrencyExact(layer6.netMonthlyUsd, currency, usdToInrRate),
                            },
                          ],
                        });
                      }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 font-mono tabular-nums text-[11px]">
                    <span className="font-bold text-slate-900">
                      {formatCurrencyCompact(layer6.netMonthlyUsd, currency, usdToInrRate)}/mo
                    </span>
                    {layer6.legacyOffsetMonthlyUsd > 0 && (
                      <span className="text-emerald-800 font-medium">
                        (−{formatCurrencyCompact(layer6.legacyOffsetMonthlyUsd, currency, usdToInrRate)})
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {layer6.components.map((c) => renderComponentTile('layer6_observability', c.componentId))}
                </div>

                <div className="mt-3 pt-2 border-t border-[#C3CFD9] text-[10px] font-mono text-slate-600">
                  ← Cross-layer telemetry & gates
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
