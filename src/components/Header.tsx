import React, { useState } from 'react';
import { Download, ChevronDown, RotateCcw } from 'lucide-react';
import { CurrencyCode } from '../types/costModel';

export type AppView = 'modeler' | 'connectors' | 'scenarios' | 'formulas';

interface HeaderProps {
  activeView: AppView;
  onChangeView: (view: AppView) => void;
  currency: CurrencyCode;
  onChangeCurrency: (currency: CurrencyCode) => void;
  usdToInrRate: number;
  onChangeUsdToInrRate: (rate: number) => void;
  defaultUsdToInrRate: number;
  onExportJson: () => void;
  onExportCsv: () => void;
  onExportRateCard: () => void;
}

const NAV_ITEMS: { id: Exclude<AppView, 'formulas'>; label: string }[] = [
  { id: 'modeler', label: 'Cost Modeler' },
  { id: 'connectors', label: 'Connector Builder' },
  { id: 'scenarios', label: 'Scenario Compare' },
];

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onChangeView,
  currency,
  onChangeCurrency,
  usdToInrRate,
  onChangeUsdToInrRate,
  defaultUsdToInrRate,
  onExportJson,
  onExportCsv,
  onExportRateCard,
}) => {
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [rateDraft, setRateDraft] = useState<string>(usdToInrRate.toFixed(2));

  React.useEffect(() => {
    setRateDraft(String(usdToInrRate));
  }, [usdToInrRate]);

  const handleRateChange = (raw: string) => {
    setRateDraft(raw);
    const parsed = parseFloat(raw);
    if (Number.isFinite(parsed) && parsed > 0 && parsed <= 10000) {
      onChangeUsdToInrRate(parsed);
    }
  };

  const handleRateBlur = () => {
    const parsed = parseFloat(rateDraft);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setRateDraft(defaultUsdToInrRate.toFixed(2));
      onChangeUsdToInrRate(defaultUsdToInrRate);
    } else {
      setRateDraft(parsed.toFixed(2));
    }
  };

  const isFormulasActive = activeView === 'formulas';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Logo + App Brand Name (AI FinOps) */}
        <button
          type="button"
          onClick={() => onChangeView('modeler')}
          className="flex items-center gap-2.5 text-left shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600 rounded-lg"
        >
          <span className="w-8 h-8 rounded-lg border border-slate-200 bg-white overflow-hidden flex items-center justify-center shrink-0">
            <img
              src="/src/assets/images/ai_finops_logo_1795274879488.jpg"
              alt="AI FinOps logo"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </span>
          <span className="text-lg font-display font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            AI FinOps
          </span>
        </button>

        {/* Zone 2: Primary Navigation Links */}
        <nav
          aria-label="Primary Workspace Navigation"
          className="hidden lg:flex items-center gap-6"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeView(item.id)}
                className={`py-5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600 ${
                  isActive
                    ? 'border-blue-700 text-blue-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Prominent Currency Toggle + Editable USD/INR Rate + Export */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            role="group"
            aria-label="Display Currency"
            className="flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-lg shrink-0"
          >
            <button
              type="button"
              onClick={() => onChangeCurrency('USD')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                currency === 'USD'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              USD ($)
            </button>
            <button
              type="button"
              onClick={() => onChangeCurrency('INR')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                currency === 'INR'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              INR (₹)
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg shrink-0">
            <label
              htmlFor="usd-inr-rate-input"
              className="text-xs font-medium text-slate-600 whitespace-nowrap"
            >
              USD→INR
            </label>
            <input
              id="usd-inr-rate-input"
              type="number"
              step="0.05"
              min="1"
              max="5000"
              value={rateDraft}
              onChange={(e) => handleRateChange(e.target.value)}
              onBlur={handleRateBlur}
              className="w-16 text-right font-mono tabular-nums text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded px-1.5 py-1 focus:outline-none focus:border-blue-600"
              aria-label="USD to INR exchange rate"
            />
            {Math.abs(usdToInrRate - defaultUsdToInrRate) > 0.001 && (
              <button
                type="button"
                onClick={() => onChangeUsdToInrRate(defaultUsdToInrRate)}
                title={`Reset rate to ${defaultUsdToInrRate.toFixed(2)}`}
                className="p-0.5 text-slate-500 hover:text-slate-900 rounded"
                aria-label="Reset USD to INR rate"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setExportMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>

            {exportMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setExportMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20">
                  <button
                    type="button"
                    onClick={() => {
                      onExportCsv();
                      setExportMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  >
                    Export Cost Breakdown (CSV)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onExportJson();
                      setExportMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  >
                    Export Scenario & Summary (JSON)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onExportRateCard();
                      setExportMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  >
                    Export Pricing Rate Card (JSON)
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Secondary Nav Bar: Exclamation button at Left End + 3 Workspace Tabs */}
      <div className="lg:hidden border-t border-slate-200 px-4 py-2 flex items-center justify-between gap-3 overflow-x-auto bg-slate-50">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChangeView('formulas')}
            title="Formulas & Rate Card"
            aria-label="Formulas & Rate Card"
            aria-pressed={isFormulasActive}
            className={`inline-flex items-center justify-center w-7 h-7 rounded-md border font-mono font-bold text-xs shrink-0 transition-colors ${
              isFormulasActive
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
            }`}
          >
            !
          </button>
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeView(item.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                  isActive
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        <div className="sm:hidden flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] text-slate-600">Rate</span>
          <input
            type="number"
            step="0.05"
            min="1"
            value={rateDraft}
            onChange={(e) => handleRateChange(e.target.value)}
            onBlur={handleRateBlur}
            className="w-14 text-right font-mono tabular-nums text-xs bg-white border border-slate-200 rounded px-1 py-1"
            aria-label="USD to INR rate mobile"
          />
        </div>
      </div>
    </header>
  );
};
