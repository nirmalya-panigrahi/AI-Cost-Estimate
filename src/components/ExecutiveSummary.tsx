import React, { useState } from 'react';
import { CostModelResult, CurrencyCode, LayerId } from '../types/costModel';
import { formatCurrencyCompact, formatCurrencyExact } from '../utils/currency';
import { HelpIconButton, InfoModalContent } from './InfoModal';

interface ExecutiveSummaryProps {
  result: CostModelResult;
  currency: CurrencyCode;
  usdToInrRate: number;
  onSelectLayer?: (layerId: LayerId) => void;
  onOpenInfo: (info: InfoModalContent) => void;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  result,
  currency,
  usdToInrRate,
  onSelectLayer,
  onOpenInfo,
}) => {
  const [hoveredLayerId, setHoveredLayerId] = useState<LayerId | null>(null);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  const legacySavingsPct =
    result.totalGrossMonthlyOpexUsd > 0
      ? (result.totalLegacyOffsetMonthlyUsd / result.totalGrossMonthlyOpexUsd) * 100
      : 0;

  const maxLayerGross = Math.max(
    1,
    ...result.layers.map((l) => l.grossMonthlyUsd)
  );

  const months = result.horizonMonths;
  const chartStep = months <= 12 ? 1 : months <= 36 ? 3 : 6;
  const sampleMonths: number[] = [];
  for (let m = 0; m <= months; m += chartStep) {
    sampleMonths.push(m);
  }
  if (sampleMonths[sampleMonths.length - 1] !== months) {
    sampleMonths.push(months);
  }

  const maxTrajectoryUsd = Math.max(1, result.totalGrossTcoUsd);
  const svgW = 460;
  const svgH = 190;
  const padL = 56;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const xForMonth = (m: number) => padL + (m / months) * plotW;
  const yForUsd = (usd: number) => padT + plotH - (usd / maxTrajectoryUsd) * plotH;

  const grossPoints = sampleMonths
    .map((m) => `${xForMonth(m).toFixed(1)},${yForUsd(result.capex.totalCapexUsd + result.totalGrossMonthlyOpexUsd * m).toFixed(1)}`)
    .join(' ');
  const netPoints = sampleMonths
    .map((m) => `${xForMonth(m).toFixed(1)},${yForUsd(result.capex.totalCapexUsd + result.totalNetMonthlyOpexUsd * m).toFixed(1)}`)
    .join(' ');

  const netAreaPoints = `${xForMonth(0).toFixed(1)},${yForUsd(0).toFixed(1)} ${netPoints} ${xForMonth(months).toFixed(1)},${yForUsd(0).toFixed(1)}`;

  return (
    <section aria-label="Executive Cost Summary" className="space-y-6">
      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
        <div className="p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-medium text-slate-500">Net Monthly Infra OpEx</div>
            <HelpIconButton
              label="Net Monthly Infra OpEx"
              onClick={() =>
                onOpenInfo({
                  title: 'Net Monthly Infrastructure OpEx',
                  category: 'Executive KPI',
                  description:
                    'Sum of net recurring monthly spend across all 6 architectural layers plus ongoing OOTB connector licenses and bespoke connector maintenance, after subtracting Legacy Stack Reuse Offset credits.',
                  details: [
                    {
                      label: 'Gross Monthly OpEx',
                      value: formatCurrencyExact(result.totalGrossMonthlyOpexUsd, currency, usdToInrRate),
                    },
                    {
                      label: 'Legacy Offset Credit',
                      value: `−${formatCurrencyExact(result.totalLegacyOffsetMonthlyUsd, currency, usdToInrRate)}`,
                    },
                    {
                      label: 'Net Monthly OpEx',
                      value: formatCurrencyExact(result.totalNetMonthlyOpexUsd, currency, usdToInrRate),
                    },
                  ],
                  formula: 'Total Net Monthly = Σ max(0, C_gross,i − L_i) + Connector_Monthly_OpEx',
                })
              }
            />
          </div>
          <div className="mt-1.5 text-2xl font-display font-bold font-mono tabular-nums text-slate-900">
            {formatCurrencyCompact(result.totalNetMonthlyOpexUsd, currency, usdToInrRate)}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 font-mono tabular-nums">
            <span>{formatCurrencyExact(result.totalNetMonthlyOpexUsd, currency, usdToInrRate)}/mo</span>
            <span aria-hidden="true">·</span>
            <span>Gross {formatCurrencyCompact(result.totalGrossMonthlyOpexUsd, currency, usdToInrRate)}</span>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-medium text-slate-500">One-Time Implementation CapEx</div>
            <HelpIconButton
              label="One-Time Implementation CapEx"
              onClick={() =>
                onOpenInfo({
                  title: 'One-Time Implementation CapEx',
                  category: 'Executive KPI',
                  description:
                    'Upfront engineering and migration capital expenditure covering OOTB connector setup hours, Bespoke custom adapter design/build/test hours scaled by protocol complexity, and legacy system extraction / strangler glue.',
                  details: [
                    {
                      label: 'OOTB Setup CapEx',
                      value: formatCurrencyExact(result.capex.ootbConnectorsCapexUsd, currency, usdToInrRate),
                    },
                    {
                      label: 'Bespoke Build CapEx',
                      value: formatCurrencyExact(result.capex.bespokeConnectorsCapexUsd, currency, usdToInrRate),
                    },
                    {
                      label: 'Legacy Extraction Glue',
                      value: formatCurrencyExact(result.capex.legacyExtractionCapexUsd, currency, usdToInrRate),
                    },
                    {
                      label: 'Total CapEx',
                      value: formatCurrencyExact(result.capex.totalCapexUsd, currency, usdToInrRate),
                    },
                  ],
                  formula: 'CapEx = CapEx_OOTB + CapEx_Bespoke + (LegacySystems × SyncFactor × MigrationBase)',
                })
              }
            />
          </div>
          <div className="mt-1.5 text-2xl font-display font-bold font-mono tabular-nums text-slate-900">
            {formatCurrencyCompact(result.capex.totalCapexUsd, currency, usdToInrRate)}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 font-mono tabular-nums">
            <span>Connectors {formatCurrencyCompact(result.capex.ootbConnectorsCapexUsd + result.capex.bespokeConnectorsCapexUsd, currency, usdToInrRate)}</span>
            <span aria-hidden="true">·</span>
            <span>Glue {formatCurrencyCompact(result.capex.legacyExtractionCapexUsd, currency, usdToInrRate)}</span>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-medium text-slate-500">
              {result.horizonMonths}-Month Net TCO
            </div>
            <HelpIconButton
              label="Horizon Net TCO"
              onClick={() =>
                onOpenInfo({
                  title: `${result.horizonMonths}-Month Net Total Cost of Ownership`,
                  category: 'Executive KPI',
                  description:
                    'Combined upfront Implementation CapEx plus cumulative Net Monthly Infra OpEx across the selected planning horizon.',
                  details: [
                    {
                      label: 'One-Time CapEx',
                      value: formatCurrencyExact(result.capex.totalCapexUsd, currency, usdToInrRate),
                    },
                    {
                      label: `${result.horizonMonths}m Net OpEx`,
                      value: formatCurrencyExact(result.totalNetOpexOverHorizonUsd, currency, usdToInrRate),
                    },
                    {
                      label: 'Total Net TCO',
                      value: formatCurrencyExact(result.totalNetTcoUsd, currency, usdToInrRate),
                    },
                  ],
                  formula: `TCO = CapEx + (Net_Monthly_OpEx × ${result.horizonMonths} months)`,
                })
              }
            />
          </div>
          <div className="mt-1.5 text-2xl font-display font-bold font-mono tabular-nums text-blue-700">
            {formatCurrencyCompact(result.totalNetTcoUsd, currency, usdToInrRate)}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 font-mono tabular-nums">
            <span>OpEx {formatCurrencyCompact(result.totalNetOpexOverHorizonUsd, currency, usdToInrRate)}</span>
            <span aria-hidden="true">·</span>
            <span>+ CapEx</span>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-medium text-slate-500">Legacy Stack Reuse Savings</div>
            <HelpIconButton
              label="Legacy Stack Reuse Savings"
              onClick={() =>
                onOpenInfo({
                  title: 'Legacy Stack Reuse Savings',
                  category: 'Executive KPI',
                  description:
                    'Total OpEx avoided over the planning horizon by reusing existing enterprise assets (e.g., Corporate IdP, APIM, ESB/Kafka, Kubernetes headroom, pgvector, or Observability suites).',
                  details: [
                    {
                      label: 'Monthly OpEx Saved',
                      value: formatCurrencyExact(result.totalLegacyOffsetMonthlyUsd, currency, usdToInrRate),
                    },
                    {
                      label: `${result.horizonMonths}m Total Savings`,
                      value: formatCurrencyExact(result.totalLegacySavingsOverHorizonUsd, currency, usdToInrRate),
                    },
                    {
                      label: 'Effective Gross Offset',
                      value: `${legacySavingsPct.toFixed(1)}%`,
                    },
                  ],
                  formula: 'L_i = C_gross,i × ReusePercentage_i × IntegrationEfficiencyFactor_i',
                })
              }
            />
          </div>
          <div className="mt-1.5 text-2xl font-display font-bold font-mono tabular-nums text-emerald-700">
            {formatCurrencyCompact(result.totalLegacySavingsOverHorizonUsd, currency, usdToInrRate)}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 font-mono tabular-nums">
            <span className="text-emerald-700 font-medium">{legacySavingsPct.toFixed(1)}% Offset</span>
            <span aria-hidden="true">·</span>
            <span>{formatCurrencyCompact(result.totalLegacyOffsetMonthlyUsd, currency, usdToInrRate)}/mo</span>
          </div>
        </div>
      </div>

      {/* 2-Column Analytical Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: 6-Layer Cost Distribution */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-display font-semibold text-slate-900">
                  6-Layer Monthly Infrastructure Breakdown
                </h2>
                <HelpIconButton
                  label="6-Layer Monthly Infrastructure Breakdown"
                  onClick={() =>
                    onOpenInfo({
                      title: '6-Layer Monthly Infrastructure Breakdown',
                      category: 'Cost Distribution Chart',
                      description:
                        'Solid bars represent Net Monthly OpEx per architectural layer. Green segments on the right show the Legacy Stack Offset Credit avoided through existing platform reuse. Click any layer bar to focus that layer in the modeler.',
                    })
                  }
                />
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-500 whitespace-nowrap">
                Click layer to inspect
              </span>
            </div>

            <div className="space-y-3">
              {result.layers.map((layer) => {
                const netPct = (layer.netMonthlyUsd / maxLayerGross) * 100;
                const offsetPct = (layer.legacyOffsetMonthlyUsd / maxLayerGross) * 100;
                const isHovered = hoveredLayerId === layer.layerId;

                return (
                  <button
                    key={layer.layerId}
                    type="button"
                    onMouseEnter={() => setHoveredLayerId(layer.layerId)}
                    onMouseLeave={() => setHoveredLayerId(null)}
                    onClick={() => onSelectLayer?.(layer.layerId)}
                    className={`w-full text-left group rounded-lg px-2 py-1.5 -mx-2 transition-colors ${
                      isHovered ? 'bg-slate-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1 gap-2">
                      <span className="font-medium text-slate-800 group-hover:text-blue-700 transition-colors truncate">
                        0{layer.layerNumber}. {layer.shortTitle}
                      </span>
                      <div className="flex items-center gap-2 font-mono tabular-nums shrink-0">
                        {layer.legacyOffsetMonthlyUsd > 0 && (
                          <span className="text-emerald-700">
                            −{formatCurrencyCompact(layer.legacyOffsetMonthlyUsd, currency, usdToInrRate)} saved
                          </span>
                        )}
                        <span className="font-semibold text-slate-900">
                          {formatCurrencyCompact(layer.netMonthlyUsd, currency, usdToInrRate)}/mo
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-sm overflow-hidden flex">
                      <div
                        className="h-full transition-all duration-200"
                        style={{
                          width: `${Math.max(netPct, layer.netMonthlyUsd > 0 ? 1.5 : 0)}%`,
                          backgroundColor: layer.accentColor,
                        }}
                      />
                      {layer.legacyOffsetMonthlyUsd > 0 && (
                        <div
                          className="h-full bg-emerald-200/90 border-l border-emerald-400 transition-all duration-200"
                          style={{
                            width: `${Math.max(offsetPct, 1)}%`,
                          }}
                          title={`Legacy offset credit: ${formatCurrencyExact(layer.legacyOffsetMonthlyUsd, currency, usdToInrRate)}/mo`}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Deterministic TCO Trajectory SVG Chart */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-display font-semibold text-slate-900">
                  Cumulative {result.horizonMonths}-Month TCO
                </h2>
                <HelpIconButton
                  label="Cumulative TCO Trajectory"
                  onClick={() =>
                    onOpenInfo({
                      title: `Cumulative ${result.horizonMonths}-Month TCO Trajectory`,
                      category: 'TCO Projection',
                      description:
                        'Compares cumulative Greenfield Gross TCO (dashed line, assuming zero legacy reuse) against Net TCO (solid line, after Legacy Stack Offset credits). Both trajectories start at Month 0 with One-Time Implementation CapEx.',
                      formula: 'TCO(m) = CapEx + (Monthly_OpEx × m)',
                    })
                  }
                />
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-600 shrink-0">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-0.5 bg-slate-400 border-t border-dashed border-slate-500" />
                  Gross
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-0.5 bg-blue-700" />
                  Net
                </span>
              </div>
            </div>

            <div className="relative">
              <svg
                viewBox={`0 0 ${svgW} ${svgH}`}
                className="w-full h-auto overflow-visible"
                role="img"
                aria-label="Cumulative TCO Trajectory Chart"
              >
                {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                  const val = maxTrajectoryUsd * frac;
                  const y = yForUsd(val);
                  return (
                    <g key={frac}>
                      <line
                        x1={padL}
                        x2={svgW - padR}
                        y1={y}
                        y2={y}
                        stroke="#E2E8F0"
                        strokeWidth="1"
                      />
                      <text
                        x={padL - 6}
                        y={y + 3}
                        textAnchor="end"
                        className="fill-slate-500 text-[9px] font-mono tabular-nums"
                      >
                        {formatCurrencyCompact(val, currency, usdToInrRate)}
                      </text>
                    </g>
                  );
                })}

                {sampleMonths
                  .filter((_, idx) => idx === 0 || idx === sampleMonths.length - 1 || idx % 2 === 0)
                  .map((m) => (
                    <text
                      key={m}
                      x={xForMonth(m)}
                      y={svgH - 8}
                      textAnchor="middle"
                      className="fill-slate-500 text-[9px] font-mono tabular-nums"
                    >
                      M{m}
                    </text>
                  ))}

                <polygon points={netAreaPoints} fill="rgba(29, 78, 216, 0.08)" />

                <polyline
                  fill="none"
                  stroke="#94A3B8"
                  strokeWidth="1.75"
                  strokeDasharray="4 3"
                  points={grossPoints}
                />

                <polyline
                  fill="none"
                  stroke="#1D4ED8"
                  strokeWidth="2.25"
                  points={netPoints}
                />

                {sampleMonths.map((m) => {
                  const netVal = result.capex.totalCapexUsd + result.totalNetMonthlyOpexUsd * m;
                  const cx = xForMonth(m);
                  const cy = yForUsd(netVal);
                  return (
                    <g key={m}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={hoveredMonth === m ? 4.5 : 2.5}
                        fill="#1D4ED8"
                        className="transition-all"
                      />
                      <circle
                        cx={cx}
                        cy={cy}
                        r={12}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredMonth(m)}
                        onMouseLeave={() => setHoveredMonth(null)}
                      />
                    </g>
                  );
                })}
              </svg>

              {hoveredMonth !== null && (
                <div className="mt-1 px-2.5 py-1.5 bg-slate-900 text-white rounded text-[11px] font-mono tabular-nums flex items-center justify-between">
                  <span>Month {hoveredMonth}</span>
                  <span>
                    Net: {formatCurrencyCompact(result.capex.totalCapexUsd + result.totalNetMonthlyOpexUsd * hoveredMonth, currency, usdToInrRate)}
                    {' · '}
                    Gross: {formatCurrencyCompact(result.capex.totalCapexUsd + result.totalGrossMonthlyOpexUsd * hoveredMonth, currency, usdToInrRate)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs">
            <div>
              <div className="text-slate-500">OOTB CapEx</div>
              <div className="font-mono tabular-nums font-semibold text-slate-900">
                {formatCurrencyCompact(result.capex.ootbConnectorsCapexUsd, currency, usdToInrRate)}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Bespoke CapEx</div>
              <div className="font-mono tabular-nums font-semibold text-slate-900">
                {formatCurrencyCompact(result.capex.bespokeConnectorsCapexUsd, currency, usdToInrRate)}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Strangler Glue</div>
              <div className="font-mono tabular-nums font-semibold text-slate-900">
                {formatCurrencyCompact(result.capex.legacyExtractionCapexUsd, currency, usdToInrRate)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
