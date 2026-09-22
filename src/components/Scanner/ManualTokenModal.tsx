import React, { useState } from 'react';
import { X, Keyboard, ArrowRight, Clipboard, Sparkles } from 'lucide-react';
import { extractTokenFromQR } from '../../utils/qr';

interface ManualTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitToken: (token: string) => void;
  isLoading: boolean;
}

export const ManualTokenModal: React.FC<ManualTokenModalProps> = ({
  isOpen,
  onClose,
  onSubmitToken,
  isLoading,
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const extracted = extractTokenFromQR(tokenInput);
    if (!extracted) {
      setError('Please enter a valid 64-character token or entry pass URL.');
      return;
    }

    onSubmitToken(extracted);
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setTokenInput(text.trim());
          setError(null);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleFillDemoToken = () => {
    setTokenInput('4c2c6c2c8a709e24fd0d256e25a072e7c9009077e0c7343b778948bcfdb8ee5e');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Enter Pass Token</h3>
              <p className="text-xs text-slate-500">Manual lookup fallback for unscannable QR</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="touch-target p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="token-input" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                64-Character Token / URL
              </label>
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                <Clipboard className="w-3 h-3" />
                Paste
              </button>
            </div>

            <textarea
              id="token-input"
              rows={3}
              value={tokenInput}
              onChange={(e) => {
                setTokenInput(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. 4c2c6c2c8a709e24fd0d256e25a072e7c9009077e0c7343b778948bcfdb8ee5e or pass link"
              className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 placeholder-slate-400 transition-all resize-none"
              disabled={isLoading}
              autoFocus
            />

            {error && (
              <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>
            )}
          </div>

          {/* Quick Demo Helper */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Quick Test Pass:
              </span>
              <button
                type="button"
                onClick={handleFillDemoToken}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
              >
                Insert Ashok Pass
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="touch-target flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!tokenInput.trim() || isLoading}
              className="touch-target flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
            >
              {isLoading ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <span>Verify</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
