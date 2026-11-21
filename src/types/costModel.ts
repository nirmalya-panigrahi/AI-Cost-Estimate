export type CurrencyCode = 'USD' | 'INR';

export type LayerId =
  | 'layer1_edge'
  | 'layer2_identity'
  | 'layer3_integration'
  | 'layer4_compute'
  | 'layer5_data'
  | 'layer6_observability';

export type HaDrTier = 'single_zone' | 'multi_az' | 'active_active';

export type DataSyncMode = 'shared_db_view' | 'full_cdc_outbox';

export type ConnectorType = 'OOTB' | 'Bespoke';

export type ConnectorComplexity = 'low' | 'medium' | 'high' | 'critical';

export interface VolumeDiscountTier {
  minUnits: number;
  discountMultiplier: number; // e.g., 1.0 = full price, 0.85 = 15% volume discount
  label: string;
}

export interface ComponentRateDefinition {
  id: string;
  layerId: LayerId;
  name: string;
  description: string;
  unitLabel: string;
  baseFixedUsd: number;
  unitRateUsd: number;
  defaultUsageUnits: number;
  minUsageUnits: number;
  maxUsageUnits: number;
  stepUsageUnits: number;
  appliesHaDr: boolean;
  volumeDiscountTiers?: VolumeDiscountTier[];
}

export interface LegacyToggleDefinition {
  id: string;
  layerId: LayerId;
  name: string;
  description: string;
  targetComponentIds: string[];
  defaultEfficiencyFactor: number; // 0..1
  defaultReusePercentage: number; // 0..100
  isEliminationToggle?: boolean; // e.g. Merge WAF/CDN eliminates standalone WAF
}

export interface LayerDefinition {
  id: LayerId;
  number: number;
  title: string;
  shortTitle: string;
  subtitle: string;
  accentColor: string;
}

export interface PricingConfig {
  version: string;
  lastUpdated: string;
  defaultUsdToInrRate: number;
  engineeringHourlyRateUsd: number;
  migrationBaseCostPerSystemUsd: number;
  haDrMultipliers: Record<HaDrTier, { label: string; multiplier: number; description: string }>;
  dataSyncComplexityFactors: Record<DataSyncMode, { label: string; factor: number; description: string }>;
  connectorComplexityMultipliers: Record<ConnectorComplexity, { label: string; multiplier: number }>;
  ootbDefaultSetupHours: number;
  ootbDefaultMonthlyLicenseUsd: number;
  bespokeDefaultDesignHours: number;
  bespokeDefaultBuildHours: number;
  bespokeDefaultTestHours: number;
  bespokeMonthlyMaintHoursPct: number; // e.g. 0.015 of build hours per month ongoing maintenance
  layers: LayerDefinition[];
  components: ComponentRateDefinition[];
  legacyToggles: LegacyToggleDefinition[];
}

export interface ConnectorItem {
  id: string;
  name: string;
  type: ConnectorType;
  protocol: string;
  transformationNote: string;
  quantity: number;
  complexity: ConnectorComplexity;
  // OOTB fields
  setupHours: number;
  monthlyLicenseUsd: number;
  // Bespoke fields
  designHours: number;
  buildHours: number;
  testHours: number;
  monthlyMaintenanceHours: number;
}

export interface LegacyToggleState {
  enabled: boolean;
  reusePercentage: number; // 0..100
  efficiencyFactor: number; // 0..1
}

export interface ScenarioConfig {
  id: string;
  name: string;
  description: string;
  horizonMonths: number;
  haDrTier: HaDrTier;
  nonProdMultiplier: number; // e.g. 1.0 = Prod only, 1.25 = +Staging, 1.45 = +Dev/QA/Staging
  legacySystemsCount: number;
  dataSyncMode: DataSyncMode;
  componentUsages: Record<string, number>;
  legacyToggles: Record<string, LegacyToggleState>;
  connectors: ConnectorItem[];
}

export interface ComponentCostResult {
  componentId: string;
  layerId: LayerId;
  name: string;
  unitLabel: string;
  usageUnits: number;
  baseFixedUsd: number;
  unitRateUsd: number;
  volumeDiscountMultiplier: number;
  volumeDiscountTierLabel: string;
  haDrMultiplierApplied: number;
  nonProdMultiplierApplied: number;
  grossMonthlyUsd: number;
  effectiveReuseRatio: number; // 0..1
  effectiveEfficiencyFactor: number; // 0..1
  legacyOffsetMonthlyUsd: number;
  netMonthlyUsd: number;
  appliedLegacyToggleNames: string[];
  formulaString: string;
  substitutedFormula: string;
}

export interface ConnectorCostResult {
  connectorId: string;
  name: string;
  type: ConnectorType;
  quantity: number;
  complexityMultiplier: number;
  oneTimeCapexUsd: number;
  monthlyOpexUsd: number;
  capexFormula: string;
  opexFormula: string;
}

export interface LayerCostResult {
  layerId: LayerId;
  layerNumber: number;
  title: string;
  shortTitle: string;
  accentColor: string;
  components: ComponentCostResult[];
  connectorOpexMonthlyUsd: number;
  grossMonthlyUsd: number;
  legacyOffsetMonthlyUsd: number;
  netMonthlyUsd: number;
  netHorizonUsd: number;
}

export interface CapExBreakdown {
  ootbConnectorsCapexUsd: number;
  bespokeConnectorsCapexUsd: number;
  legacyExtractionCapexUsd: number;
  totalCapexUsd: number;
  ootbFormula: string;
  bespokeFormula: string;
  legacyExtractionFormula: string;
}

export interface CostModelResult {
  scenarioId: string;
  scenarioName: string;
  horizonMonths: number;
  layers: LayerCostResult[];
  connectorResults: ConnectorCostResult[];
  capex: CapExBreakdown;
  totalGrossMonthlyOpexUsd: number;
  totalLegacyOffsetMonthlyUsd: number;
  totalNetMonthlyOpexUsd: number;
  totalGrossOpexOverHorizonUsd: number;
  totalNetOpexOverHorizonUsd: number;
  totalLegacySavingsOverHorizonUsd: number;
  totalGrossTcoUsd: number;
  totalNetTcoUsd: number;
}
