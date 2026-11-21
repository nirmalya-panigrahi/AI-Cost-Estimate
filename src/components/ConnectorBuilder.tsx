import React from 'react';
import { Plus, Trash2, Copy } from 'lucide-react';
import {
  ConnectorComplexity,
  ConnectorItem,
  ConnectorType,
  CostModelResult,
  CurrencyCode,
  PricingConfig,
  ScenarioConfig,
} from '../types/costModel';
import { formatCurrencyCompact, formatCurrencyExact } from '../utils/currency';
import { HelpIconButton, InfoModalContent } from './InfoModal';

interface ConnectorBuilderProps {
  scenario: ScenarioConfig;
  pricing: PricingConfig;
  result: CostModelResult;
  currency: CurrencyCode;
  usdToInrRate: number;
  onUpdateScenario: (updater: (prev: ScenarioConfig) => ScenarioConfig) => void;
  onOpenInfo: (info: InfoModalContent) => void;
}

const CONNECTOR_TEMPLATES: Omit<ConnectorItem, 'id'>[] = [
  {
    name: 'SAP S/4HANA OData Adapter',
    type: 'OOTB',
    protocol: 'OData v4 / REST',
    transformationNote: 'Standard entity mapping to RAG metadata',
    quantity: 1,
    complexity: 'medium',
    setupHours: 24,
    monthlyLicenseUsd: 260,
    designHours: 0,
    buildHours: 0,
    testHours: 0,
    monthlyMaintenanceHours: 0,
  },
  {
    name: 'PostgreSQL Debezium CDC',
    type: 'OOTB',
    protocol: 'JDBC / WAL CDC',
    transformationNote: 'Outbox table streaming to Kafka topic',
    quantity: 1,
    complexity: 'low',
    setupHours: 16,
    monthlyLicenseUsd: 180,
    designHours: 0,
    buildHours: 0,
    testHours: 0,
    monthlyMaintenanceHours: 0,
  },
  {
    name: 'IBM Mainframe CICS / COBOL Bridge',
    type: 'Bespoke',
    protocol: 'SNA / Copybook Binary',
    transformationNote: 'EBCDIC-to-JSON transform + Saga compensating rollback',
    quantity: 1,
    complexity: 'critical',
    setupHours: 0,
    monthlyLicenseUsd: 0,
    designHours: 48,
    buildHours: 160,
    testHours: 72,
    monthlyMaintenanceHours: 16,
  },
  {
    name: 'Proprietary ERP SOAP/XML Mediation',
    type: 'Bespoke',
    protocol: 'SOAP 1.1 / XML / XSLT',
    transformationNote: 'Canonical data model adapter & retry idempotency',
    quantity: 1,
    complexity: 'high',
    setupHours: 0,
    monthlyLicenseUsd: 0,
    designHours: 32,
    buildHours: 110,
    testHours: 48,
    monthlyMaintenanceHours: 10,
  },
];

export const ConnectorBuilder: React.FC<ConnectorBuilderProps> = ({
  scenario,
  pricing,
  result,
  currency,
  usdToInrRate,
  onUpdateScenario,
  onOpenInfo,
}) => {
  const addConnector = (type: ConnectorType, template?: Omit<ConnectorItem, 'id'>) => {
    const newItem: ConnectorItem = template
      ? { ...template, id: `conn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` }
      : {
          id: `conn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: type === 'OOTB' ? 'New SaaS / DB OOTB Connector' : 'New Custom Protocol Adapter',
          type,
          protocol: type === 'OOTB' ? 'REST / JSON' : 'Custom Socket / XML',
          transformationNote:
            type === 'OOTB'
              ? 'Pre-built schema field mapping'
              : 'Custom data structure & representation translation',
          quantity: 1,
          complexity: type === 'OOTB' ? 'low' : 'high',
          setupHours: type === 'OOTB' ? pricing.ootbDefaultSetupHours : 0,
          monthlyLicenseUsd: type === 'OOTB' ? pricing.ootbDefaultMonthlyLicenseUsd : 0,
          designHours: type === 'Bespoke' ? pricing.bespokeDefaultDesignHours : 0,
          buildHours: type === 'Bespoke' ? pricing.bespokeDefaultBuildHours : 0,
          testHours: type === 'Bespoke' ? pricing.bespokeDefaultTestHours : 0,
          monthlyMaintenanceHours: type === 'Bespoke' ? 10 : 0,
        };

    onUpdateScenario((prev) => ({
      ...prev,
      connectors: [...prev.connectors, newItem],
    }));
  };

  const updateConnector = (id: string, patch: Partial<ConnectorItem>) => {
    onUpdateScenario((prev) => ({
      ...prev,
      connectors: prev.connectors.map((c) => {
        if (c.id !== id) return c;
        const updated = { ...c, ...patch };
        if (patch.type === 'OOTB' && c.type === 'Bespoke') {
          updated.setupHours = updated.setupHours || pricing.ootbDefaultSetupHours;
          updated.monthlyLicenseUsd = updated.monthlyLicenseUsd || pricing.ootbDefaultMonthlyLicenseUsd;
        } else if (patch.type === 'Bespoke' && c.type === 'OOTB') {
          updated.designHours = updated.designHours || pricing.bespokeDefaultDesignHours;
          updated.buildHours = updated.buildHours || pricing.bespokeDefaultBuildHours;
          updated.testHours = updated.testHours || pricing.bespokeDefaultTestHours;
          updated.monthlyMaintenanceHours = updated.monthlyMaintenanceHours || 10;
        }
        return updated;
      }),
    }));
  };

  const duplicateConnector = (item: ConnectorItem) => {
    const clone: ConnectorItem = {
      ...item,
      id: `conn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: `${item.name} (Copy)`,
    };
    onUpdateScenario((prev) => ({
      ...prev,
      connectors: [...prev.connectors, clone],
    }));
  };

  const removeConnector = (id: string) => {
    onUpdateScenario((prev) => ({
      ...prev,
      connectors: prev.connectors.filter((c) => c.id !== id),
    }));
  };

  const totalCount = scenario.connectors.reduce((a, b) => a + b.quantity, 0);
  const ootbCount = scenario.connectors
    .filter((c) => c.type === 'OOTB')
    .reduce((a, b) => a + b.quantity, 0);
  const bespokeCount = scenario.connectors
    .filter((c) => c.type === 'Bespoke')
    .reduce((a, b) => a + b.quantity, 0);

  const totalMonthlyConnectorOpex = result.connectorResults.reduce(
    (a, b) => a + b.monthlyOpexUsd,
    0
  );

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-display font-semibold text-slate-900">
              Connector & Integration Builder (OOTB vs. Bespoke)
            </h2>
            <HelpIconButton
              label="Connector & Integration Builder"
              onClick={() =>
                onOpenInfo({
                  title: 'OOTB vs. Bespoke Connectors',
                  category: 'Layer 3 · Integration & EAI',
                  description:
                    'Out-of-the-Box (OOTB) connectors cover standard SaaS, JDBC, REST, GraphQL, and gRPC adapters with low setup hours and recurring SaaS licensing. Bespoke connectors model custom channel adapters for mainframes, proprietary ERPs, or non-standard protocols requiring design, build, contract testing, and ongoing maintenance.',
                  formula:
                    'OOTB CapEx = N × SetupHrs × EngRate | Bespoke CapEx = N × (Design + Build + Test) × EngRate × Complexity',
                })
              }
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => addConnector('OOTB')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add OOTB Connector</span>
            </button>
            <button
              type="button"
              onClick={() => addConnector('Bespoke')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Bespoke Connector</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 divide-x divide-slate-200">
          <div className="p-4">
            <div className="text-xs text-slate-500">Total Adapters</div>
            <div className="mt-1 text-xl font-display font-bold font-mono tabular-nums text-slate-900">
              {totalCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 font-mono tabular-nums">
              {ootbCount} OOTB · {bespokeCount} Bespoke
            </div>
          </div>
          <div className="p-4">
            <div className="text-xs text-slate-500">OOTB Setup CapEx</div>
            <div className="mt-1 text-xl font-display font-bold font-mono tabular-nums text-slate-900">
              {formatCurrencyCompact(result.capex.ootbConnectorsCapexUsd, currency, usdToInrRate)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 font-mono tabular-nums">
              @ {formatCurrencyExact(pricing.engineeringHourlyRateUsd, currency, usdToInrRate)}/hr eng rate
            </div>
          </div>
          <div className="p-4">
            <div className="text-xs text-slate-500">Bespoke Build CapEx</div>
            <div className="mt-1 text-xl font-display font-bold font-mono tabular-nums text-slate-900">
              {formatCurrencyCompact(result.capex.bespokeConnectorsCapexUsd, currency, usdToInrRate)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Design + Build + Test × Complexity
            </div>
          </div>
          <div className="p-4">
            <div className="text-xs text-slate-500">Monthly Connector OpEx</div>
            <div className="mt-1 text-xl font-display font-bold font-mono tabular-nums text-blue-700">
              {formatCurrencyExact(totalMonthlyConnectorOpex, currency, usdToInrRate)}/mo
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Rolled into Layer 3 OpEx
            </div>
          </div>
        </div>
      </div>

      {/* Quick Templates */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-500 font-medium">Quick-add templates:</span>
        {CONNECTOR_TEMPLATES.map((tpl) => (
          <button
            key={tpl.name}
            type="button"
            onClick={() => addConnector(tpl.type, tpl)}
            className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-700 rounded-lg transition-colors whitespace-nowrap"
          >
            + {tpl.name} ({tpl.type})
          </button>
        ))}
      </div>

      {scenario.connectors.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <h3 className="text-sm font-display font-semibold text-slate-900">
            No Connectors Configured
          </h3>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => addConnector('OOTB')}
              className="px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Add First OOTB Connector
            </button>
            <button
              type="button"
              onClick={() => addConnector('Bespoke')}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800"
            >
              Add First Bespoke Connector
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200 overflow-hidden">
          {scenario.connectors.map((conn) => {
            const calc = result.connectorResults.find((r) => r.connectorId === conn.id);

            return (
              <div key={conn.id} className="p-5 space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                  <div className="lg:col-span-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={conn.name}
                        onChange={(e) => updateConnector(conn.id, { name: e.target.value })}
                        className="w-full text-sm font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-600"
                        aria-label="Connector name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={conn.protocol}
                        onChange={(e) => updateConnector(conn.id, { protocol: e.target.value })}
                        placeholder="Protocol (e.g. REST/OData)"
                        className="text-xs text-slate-700 bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-blue-600"
                        aria-label="Connector protocol"
                      />
                      <input
                        type="text"
                        value={conn.transformationNote}
                        onChange={(e) =>
                          updateConnector(conn.id, { transformationNote: e.target.value })
                        }
                        placeholder="Transformation note"
                        className="text-xs text-slate-700 bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-blue-600"
                        aria-label="Transformation mapping note"
                      />
                    </div>
                  </div>

                  <div className="lg:col-span-4 grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Type</label>
                      <select
                        value={conn.type}
                        onChange={(e) =>
                          updateConnector(conn.id, { type: e.target.value as ConnectorType })
                        }
                        className="w-full text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-600"
                      >
                        <option value="OOTB">OOTB</option>
                        <option value="Bespoke">Bespoke</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Quantity</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={conn.quantity}
                        onChange={(e) =>
                          updateConnector(conn.id, {
                            quantity: Math.max(1, parseInt(e.target.value, 10) || 1),
                          })
                        }
                        className="w-full text-right font-mono tabular-nums text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Complexity</label>
                      <select
                        value={conn.complexity}
                        disabled={conn.type === 'OOTB'}
                        onChange={(e) =>
                          updateConnector(conn.id, {
                            complexity: e.target.value as ConnectorComplexity,
                          })
                        }
                        className="w-full text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 disabled:opacity-50 focus:outline-none focus:border-blue-600"
                      >
                        {Object.entries(pricing.connectorComplexityMultipliers).map(
                          ([key, info]) => (
                            <option key={key} value={key}>
                              {info.label}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="lg:col-span-4 flex items-start justify-between lg:justify-end gap-4">
                    <div className="text-left lg:text-right font-mono tabular-nums">
                      <div className="text-xs text-slate-500">One-Time CapEx</div>
                      <div className="text-sm font-bold text-slate-900">
                        {formatCurrencyExact(calc?.oneTimeCapexUsd ?? 0, currency, usdToInrRate)}
                      </div>
                      <div className="text-xs text-blue-700 font-medium mt-0.5">
                        +{formatCurrencyExact(calc?.monthlyOpexUsd ?? 0, currency, usdToInrRate)}/mo OpEx
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => duplicateConnector(conn)}
                        title="Duplicate connector"
                        className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        aria-label={`Duplicate ${conn.name}`}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeConnector(conn.id)}
                        title="Remove connector"
                        className="p-2 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label={`Remove ${conn.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {conn.type === 'OOTB' ? (
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-600">Setup & Config Hours / unit</span>
                      <input
                        type="number"
                        min={0}
                        step={2}
                        value={conn.setupHours}
                        onChange={(e) =>
                          updateConnector(conn.id, {
                            setupHours: Math.max(0, parseFloat(e.target.value) || 0),
                          })
                        }
                        className="w-20 text-right font-mono tabular-nums font-semibold bg-slate-50 border border-slate-200 rounded px-2 py-1"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-600">Monthly License (USD base / unit)</span>
                      <input
                        type="number"
                        min={0}
                        step={10}
                        value={conn.monthlyLicenseUsd}
                        onChange={(e) =>
                          updateConnector(conn.id, {
                            monthlyLicenseUsd: Math.max(0, parseFloat(e.target.value) || 0),
                          })
                        }
                        className="w-24 text-right font-mono tabular-nums font-semibold bg-slate-50 border border-slate-200 rounded px-2 py-1"
                      />
                    </div>
                    <div className="text-[11px] font-mono tabular-nums text-slate-500 sm:text-right">
                      {calc?.capexFormula}
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 items-center text-xs">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">
                        Design Hours
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={4}
                        value={conn.designHours}
                        onChange={(e) =>
                          updateConnector(conn.id, {
                            designHours: Math.max(0, parseFloat(e.target.value) || 0),
                          })
                        }
                        className="w-full text-right font-mono tabular-nums font-semibold bg-slate-50 border border-slate-200 rounded px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">
                        Build Hours
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={8}
                        value={conn.buildHours}
                        onChange={(e) =>
                          updateConnector(conn.id, {
                            buildHours: Math.max(0, parseFloat(e.target.value) || 0),
                          })
                        }
                        className="w-full text-right font-mono tabular-nums font-semibold bg-slate-50 border border-slate-200 rounded px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">
                        Test & Contract QA Hours
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={4}
                        value={conn.testHours}
                        onChange={(e) =>
                          updateConnector(conn.id, {
                            testHours: Math.max(0, parseFloat(e.target.value) || 0),
                          })
                        }
                        className="w-full text-right font-mono tabular-nums font-semibold bg-slate-50 border border-slate-200 rounded px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">
                        Ongoing Maint. Hrs / mo
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={conn.monthlyMaintenanceHours}
                        onChange={(e) =>
                          updateConnector(conn.id, {
                            monthlyMaintenanceHours: Math.max(0, parseFloat(e.target.value) || 0),
                          })
                        }
                        className="w-full text-right font-mono tabular-nums font-semibold bg-slate-50 border border-slate-200 rounded px-2 py-1"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
