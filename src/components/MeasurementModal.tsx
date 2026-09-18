import React, { useEffect, useRef, useState } from 'react';
import { X, Save } from 'lucide-react';

interface MeasurementModalProps {
  meter: number;
  direction: 'UP' | 'DOWN';
  isCalibration: boolean;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: number) => void;
}

export const MeasurementModal: React.FC<MeasurementModalProps> = ({
  meter,
  direction,
  isCalibration,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setInput('');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen, meter, direction]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const value = Number(input);
    if (input.trim() === '' || !Number.isFinite(value)) {
      setError('Nilai harus berupa angka.');
      if (inputRef.current) inputRef.current.focus();
      return;
    }
    onConfirm(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      setError('');
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="modal-measurement"
        className="bg-[#151822] border border-blue-700/60 rounded-xl w-full max-w-md text-zinc-200 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-[#12141c] border-b border-zinc-800 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Save className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">INPUT HASIL PENGUJIAN</h2>
              <p className="text-xs text-zinc-400">
                Titik {meter} m — Uji {direction === 'UP' ? 'Naik' : 'Turun'}
                {isCalibration ? ' (nilai standar kalibrasi)' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3">
          <label className="block text-zinc-400 text-xs font-medium">
            Nilai Pembacaan ({isCalibration ? 'mm standar' : 'mm'})
          </label>
          <input
            ref={inputRef}
            id="input-measurement-value"
            type="number"
            step="0.001"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 font-mono focus:border-blue-500 focus:outline-none"
            placeholder="Contoh: 5000.000"
          />
          {error && (
            <p id="lbl-measurement-error" className="text-rose-400 text-[11px]">
              {error}
            </p>
          )}
          <p className="text-[11px] text-zinc-500">
            Tekan Enter untuk menyimpan, atau Esc untuk membatalkan.
          </p>
        </div>

        {/* Footer */}
        <div className="bg-[#12141c] border-t border-zinc-800 px-5 py-3 flex items-center justify-end gap-2.5">
          <button
            onClick={() => {
              setError('');
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
          >
            Batal
          </button>
          <button
            id="btn-measurement-save"
            onClick={handleConfirm}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition"
          >
            <Save className="w-4 h-4" />
            <span>Simpan</span>
          </button>
        </div>
      </div>
    </div>
  );
};