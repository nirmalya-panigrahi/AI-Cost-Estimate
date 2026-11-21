import React, { useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';

export interface InfoModalContent {
  title: string;
  category?: string;
  description: string;
  details?: { label: string; value: string }[];
  formula?: string;
  guidance?: string;
}

interface HelpIconButtonProps {
  onClick: (e: React.MouseEvent) => void;
  label: string;
  className?: string;
}

export const HelpIconButton: React.FC<HelpIconButtonProps> = ({
  onClick,
  label,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      aria-label={`More info: ${label}`}
      title={`Explain: ${label}`}
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600 ${className}`}
    >
      <HelpCircle className="w-3.5 h-3.5" />
    </button>
  );
};

interface InfoModalProps {
  content: InfoModalContent | null;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ content, onClose }) => {
  useEffect(() => {
    if (!content) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [content, onClose]);

  if (!content) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="info-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50">
          <div>
            {content.category && (
              <div className="text-[11px] font-medium text-blue-700 mb-0.5">
                {content.category}
              </div>
            )}
            <h3
              id="info-modal-title"
              className="text-base font-display font-semibold text-slate-900"
            >
              {content.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-sm text-slate-700 leading-relaxed">
          <p>{content.description}</p>

          {content.details && content.details.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg divide-y divide-slate-200 text-xs">
              {content.details.map((item) => (
                <div
                  key={item.label}
                  className="px-3.5 py-2 flex items-center justify-between gap-4"
                >
                  <span className="text-slate-500">{item.label}</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900 text-right">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {content.formula && (
            <div className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-[11px] leading-relaxed overflow-x-auto">
              {content.formula}
            </div>
          )}

          {content.guidance && (
            <div className="text-xs text-slate-600 bg-blue-50/60 border border-blue-100 rounded-lg p-3">
              <span className="font-semibold text-slate-800">Architectural Guidance: </span>
              {content.guidance}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
