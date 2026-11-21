import {
  CapExBreakdown,
  ComponentCostResult,
  ComponentRateDefinition,
  ConnectorCostResult,
  LayerCostResult,
  PricingConfig,
  ScenarioConfig,
  CostModelResult,
} from '../types/costModel';

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function resolveVolumeDiscount(
  component: ComponentRateDefinition,
  usageUnits: number
): { multiplier: number; label: string } {
  if (!component.volumeDiscountTiers || component.volumeDiscountTiers.length === 0) {
    return { multiplier: 1.0, label: 'Flat Rate (1.00x)' };
  }
  let matched = component.volumeDiscountTiers[0];
  for (const tier of component.volumeDiscountTiers) {
    if (usageUnits >= tier.minUnits) {
      matched = tier;
    }
  }
  return {
    multiplier: matched.discountMultiplier,
    label: matched.label,
  };
}

/**
 * 100% deterministic client-side cost calculation engine.
 * Identical ScenarioConfig + PricingConfig inputs always yield bit-for-bit identical outputs.
 */
export function calculateCostModel(
  scenario: ScenarioConfig,
  pricing: PricingConfig
): CostModelResult {
  const haDrMultiplier = pricing.haDrMultipliers[scenario.haDrTier]?.multiplier ?? 1.0;
  const nonProdMultiplier = Math.max(1.0, scenario.nonProdMultiplier || 1.0);
  const horizonMonths = Math.max(1, Math.round(scenario.horizonMonths || 12));
  const engRate = Math.max(0, pricing.engineeringHourlyRateUsd);

  // 1. Evaluate all Connectors (OOTB vs Bespoke)
  const connectorResults: ConnectorCostResult[] = scenario.connectors.map((conn) => {
    const qty = Math.max(0, conn.quantity);
    const complexityMult = pricing.connectorComplexityMultipliers[conn.complexity]?.multiplier ?? 1.0;

    if (conn.type === 'OOTB') {
      // OOTB CapEx: N_ootb * (SetupHours_ootb * EngRate)
      const capex = round2(qty * conn.setupHours * engRate);
      const opex = round2(qty * conn.monthlyLicenseUsd);
      return {
        connectorId: conn.id,
        name: conn.name,
        type: 'OOTB',
        quantity: qty,
        complexityMultiplier: 1.0,
        oneTimeCapexUsd: capex,
        monthlyOpexUsd: opex,
        capexFormula: `${qty} × (${conn.setupHours} hrs × $${engRate}/hr) = $${capex.toLocaleString('en-US')}`,
        opexFormula: `${qty} × $${conn.monthlyLicenseUsd}/mo = $${opex.toLocaleString('en-US')}/mo`,
      };
    }

    // Bespoke CapEx: N_bespoke * (DesignHours + BuildHours + TestHours) * EngRate * ComplexityMultiplier
    const totalHoursPerConnector = conn.designHours + conn.buildHours + conn.testHours;
    const capex = round2(qty * totalHoursPerConnector * engRate * complexityMult);
    const opex = round2(qty * conn.monthlyMaintenanceHours * engRate);
    return {
      connectorId: conn.id,
      name: conn.name,
      type: 'Bespoke',
      quantity: qty,
      complexityMultiplier: complexityMult,
      oneTimeCapexUsd: capex,
      monthlyOpexUsd: opex,
      capexFormula: `${qty} × (${conn.designHours}d + ${conn.buildHours}b + ${conn.testHours}t hrs) × $${engRate}/hr × ${complexityMult.toFixed(2)}x = $${capex.toLocaleString('en-US')}`,
      opexFormula: `${qty} × ${conn.monthlyMaintenanceHours} maint hrs/mo × $${engRate}/hr = $${opex.toLocaleString('en-US')}/mo`,
    };
  });

  const ootbConnectorsCapexUsd = round2(
    connectorResults
      .filter((c) => c.type === 'OOTB')
      .reduce((acc, c) => acc + c.oneTimeCapexUsd, 0)
  );
  const bespokeConnectorsCapexUsd = round2(
    connectorResults
      .filter((c) => c.type === 'Bespoke')
      .reduce((acc, c) => acc + c.oneTimeCapexUsd, 0)
  );
  const totalConnectorOpexMonthlyUsd = round2(
    connectorResults.reduce((acc, c) => acc + c.monthlyOpexUsd, 0)
  );

  // Legacy Extraction / Strangler Glue CapEx
  const legacyCount = Math.max(0, scenario.legacySystemsCount);
  const syncFactor = pricing.dataSyncComplexityFactors[scenario.dataSyncMode]?.factor ?? 1.0;
  const migrationBase = Math.max(0, pricing.migrationBaseCostPerSystemUsd);
  const legacyExtractionCapexUsd = round2(legacyCount * syncFactor * migrationBase);

  const totalCapexUsd = round2(
    ootbConnectorsCapexUsd + bespokeConnectorsCapexUsd + legacyExtractionCapexUsd
  );

  const capex: CapExBreakdown = {
    ootbConnectorsCapexUsd,
    bespokeConnectorsCapexUsd,
    legacyExtractionCapexUsd,
    totalCapexUsd,
    ootbFormula: `Σ [ N_ootb × (SetupHours × $${engRate}/hr) ]`,
    bespokeFormula: `Σ [ N_bespoke × (Design + Build + Test) × $${engRate}/hr × Complexity ]`,
    legacyExtractionFormula: `${legacyCount} systems × ${syncFactor.toFixed(2)}x (${scenario.dataSyncMode}) × $${migrationBase.toLocaleString('en-US')}`,
  };

  // 2. Evaluate all 6 Architectural Layers & Components
  const layerResults: LayerCostResult[] = pricing.layers.map((layerDef) => {
    const layerComponents = pricing.components.filter((c) => c.layerId === layerDef.id);
    const layerToggles = pricing.legacyToggles.filter((t) => t.layerId === layerDef.id);

    const componentResults: ComponentCostResult[] = layerComponents.map((comp) => {
      const usageUnits = Math.max(0, scenario.componentUsages[comp.id] ?? comp.defaultUsageUnits);
      const { multiplier: volumeDiscountMultiplier, label: volumeDiscountTierLabel } =
        resolveVolumeDiscount(comp, usageUnits);

      const appliedHaDr = comp.appliesHaDr ? haDrMultiplier : 1.0;
      const appliedNonProd = comp.appliesHaDr ? nonProdMultiplier : 1.0;

      // Gross Monthly Infra Cost:
      // C_gross = BaseFixed + (UsageUnits * UnitRate * VolumeDiscount * HaDrMultiplier * NonProdMultiplier)
      // Note: if usageUnits === 0 and component has no active usage, BaseFixed still applies unless merged/eliminated or usage explicitly 0?
      // Keeping faithful to formula: BaseFixed + (UsageUnits * UnitRate * HaDrMultiplier * ...)
      // If a user sets usageUnits === 0 and wants 0 fixed cost, BaseFixed applies for provisioned service unless eliminated by legacy toggle.
      const variableMonthly =
        usageUnits *
        comp.unitRateUsd *
        volumeDiscountMultiplier *
        appliedHaDr *
        appliedNonProd;
      const grossMonthlyUsd = round2(comp.baseFixedUsd + variableMonthly);

      // Compute Legacy Offset Credit L_i = C_gross * ReusePercentage * IntegrationEfficiencyFactor
      const activeTargetingToggles = layerToggles.filter((tDef) => {
        const state = scenario.legacyToggles[tDef.id];
        return state?.enabled && tDef.targetComponentIds.includes(comp.id);
      });

      let effectiveReuseRatio = 0;
      let effectiveEfficiencyFactor = 0;
      const appliedLegacyToggleNames: string[] = [];

      if (activeTargetingToggles.length > 0) {
        let sumReuse = 0;
        let weightedEffNumerator = 0;

        for (const tDef of activeTargetingToggles) {
          const state = scenario.legacyToggles[tDef.id];
          const r = Math.min(1, Math.max(0, (state?.reusePercentage ?? tDef.defaultReusePercentage) / 100));
          const eff = Math.min(1, Math.max(0, state?.efficiencyFactor ?? tDef.defaultEfficiencyFactor));
          sumReuse += r;
          weightedEffNumerator += r * eff;
          appliedLegacyToggleNames.push(tDef.name);
        }

        effectiveReuseRatio = Math.min(1, round2(sumReuse));
        effectiveEfficiencyFactor =
          sumReuse > 0 ? Math.min(1, round2(weightedEffNumerator / sumReuse)) : 0;
      }

      const rawOffset = grossMonthlyUsd * effectiveReuseRatio * effectiveEfficiencyFactor;
      const legacyOffsetMonthlyUsd = round2(Math.min(grossMonthlyUsd, rawOffset));
      const netMonthlyUsd = round2(Math.max(0, grossMonthlyUsd - legacyOffsetMonthlyUsd));

      const haPart = comp.appliesHaDr
        ? ` × ${appliedHaDr.toFixed(2)}x HA × ${appliedNonProd.toFixed(2)}x Env`
        : '';
      const discPart =
        volumeDiscountMultiplier < 1 ? ` × ${volumeDiscountMultiplier.toFixed(2)}x Vol` : '';

      return {
        componentId: comp.id,
        layerId: layerDef.id,
        name: comp.name,
        unitLabel: comp.unitLabel,
        usageUnits,
        baseFixedUsd: comp.baseFixedUsd,
        unitRateUsd: comp.unitRateUsd,
        volumeDiscountMultiplier,
        volumeDiscountTierLabel,
        haDrMultiplierApplied: appliedHaDr,
        nonProdMultiplierApplied: appliedNonProd,
        grossMonthlyUsd,
        effectiveReuseRatio,
        effectiveEfficiencyFactor,
        legacyOffsetMonthlyUsd,
        netMonthlyUsd,
        appliedLegacyToggleNames,
        formulaString:
          'C_net = max(0, [BaseFixed + (Usage × UnitRate × VolDisc × HA/DR × Env)] − [C_gross × Reuse% × Efficiency])',
        substitutedFormula: `Gross = $${comp.baseFixedUsd} + (${usageUnits} × $${comp.unitRateUsd}${discPart}${haPart}) = $${grossMonthlyUsd.toFixed(2)} | Offset = $${grossMonthlyUsd.toFixed(2)} × ${(effectiveReuseRatio * 100).toFixed(0)}% × ${effectiveEfficiencyFactor.toFixed(2)} = $${legacyOffsetMonthlyUsd.toFixed(2)} | Net = $${netMonthlyUsd.toFixed(2)}`,
      };
    });

    // Connector recurring monthly OpEx belongs to Layer 3 (Integration & Connectors)
    const connectorOpexMonthlyUsd =
      layerDef.id === 'layer3_integration' ? totalConnectorOpexMonthlyUsd : 0;

    const grossMonthlyUsd = round2(
      componentResults.reduce((acc, c) => acc + c.grossMonthlyUsd, 0) + connectorOpexMonthlyUsd
    );
    const legacyOffsetMonthlyUsd = round2(
      componentResults.reduce((acc, c) => acc + c.legacyOffsetMonthlyUsd, 0)
    );
    const netMonthlyUsd = round2(Math.max(0, grossMonthlyUsd - legacyOffsetMonthlyUsd));
    const netHorizonUsd = round2(netMonthlyUsd * horizonMonths);

    return {
      layerId: layerDef.id,
      layerNumber: layerDef.number,
      title: layerDef.title,
      shortTitle: layerDef.shortTitle,
      accentColor: layerDef.accentColor,
      components: componentResults,
      connectorOpexMonthlyUsd,
      grossMonthlyUsd,
      legacyOffsetMonthlyUsd,
      netMonthlyUsd,
      netHorizonUsd,
    };
  });

  const totalGrossMonthlyOpexUsd = round2(
    layerResults.reduce((acc, l) => acc + l.grossMonthlyUsd, 0)
  );
  const totalLegacyOffsetMonthlyUsd = round2(
    layerResults.reduce((acc, l) => acc + l.legacyOffsetMonthlyUsd, 0)
  );
  const totalNetMonthlyOpexUsd = round2(
    layerResults.reduce((acc, l) => acc + l.netMonthlyUsd, 0)
  );

  const totalGrossOpexOverHorizonUsd = round2(totalGrossMonthlyOpexUsd * horizonMonths);
  const totalNetOpexOverHorizonUsd = round2(totalNetMonthlyOpexUsd * horizonMonths);
  const totalLegacySavingsOverHorizonUsd = round2(totalLegacyOffsetMonthlyUsd * horizonMonths);

  const totalGrossTcoUsd = round2(totalCapexUsd + totalGrossOpexOverHorizonUsd);
  const totalNetTcoUsd = round2(totalCapexUsd + totalNetOpexOverHorizonUsd);

  return {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    horizonMonths,
    layers: layerResults,
    connectorResults,
    capex,
    totalGrossMonthlyOpexUsd,
    totalLegacyOffsetMonthlyUsd,
    totalNetMonthlyOpexUsd,
    totalGrossOpexOverHorizonUsd,
    totalNetOpexOverHorizonUsd,
    totalLegacySavingsOverHorizonUsd,
    totalGrossTcoUsd,
    totalNetTcoUsd,
  };
}
