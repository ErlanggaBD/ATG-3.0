import React from 'react';
import { AtgTestRow, TestType } from '../types';
import { 
  CheckSquare, 
  Square, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sliders, 
  AlertCircle, 
  CheckCircle, 
  Lock,
  Unlock
} from 'lucide-react';

interface TestingTableProps {
  rows: AtgTestRow[];
  onRowChange: (index: number, updated: Partial<AtgTestRow>) => void;
  onToggleAll: (checked: boolean) => void;
  isEditAlgEnabled: boolean;
  isEditStdEnabled: boolean;
  activeTestMode: TestType;
  currentMotorPos: number;
  batasKesalahanMm: number;
}

const formatInteger = (value: string) => {
  if (value.trim() === '') return '';
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? Math.round(numericValue).toString() : value;
};

export const TestingTable: React.FC<TestingTableProps> = ({
  rows,
  onRowChange,
  onToggleAll,
  isEditAlgEnabled,
  isEditStdEnabled,
  activeTestMode,
  currentMotorPos,
  batasKesalahanMm
}) => {
  const allChecked = rows.every((r) => r.selected);
  const selectedCount = rows.filter((r) => r.selected).length;
  const isTeraUlang = activeTestMode === 'TERA_ULANG';
  const isKalibrasi = activeTestMode === 'KALIBRASI';
  const canEditAlg = isEditAlgEnabled && activeTestMode !== 'KALIBRASI';
  const canEditStd = isEditStdEnabled && activeTestMode === 'KALIBRASI';
  // Kalibrasi idealnya menguji semua meter. Operator tetap boleh men-uncheck,
  // jadi di sini hanya diberi peringatan visual, bukan dikunci.
  const kurangDiKalibrasi = isKalibrasi && selectedCount < rows.length;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#0d1017] overflow-hidden">
      {/* Table Top Action Bar */}
      <div className="bg-[#12151e] border-b border-zinc-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              id="chk-select-all"
              onClick={() => onToggleAll(!allChecked)}
              className="flex items-center gap-1.5 text-zinc-300 hover:text-white font-medium cursor-pointer"
            >
              {allChecked ? (
                <CheckSquare className="w-4 h-4 text-blue-400" />
              ) : (
                <Square className="w-4 h-4 text-zinc-500" />
              )}
              <span>{isTeraUlang ? 'Pilih Maks. 5 Titik' : 'Pilih Semua Titik (5-17m)'}</span>
            </button>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">
              Aktif: <strong className="text-blue-400">{selectedCount}</strong>{isTeraUlang ? ' dari maks. 5 Titik' : ' dari 13 Titik'}
            </span>
            {kurangDiKalibrasi && (
              <span
                id="warn-kalibrasi-belum-lengkap"
                className="flex items-center gap-1 rounded border border-amber-500/60 bg-amber-950/40 px-1.5 py-0.5 text-[11px] text-amber-300"
              >
                Kurang {rows.length - selectedCount} titik — mode KALIBRASI idealnya semua titik aktif
              </span>
            )}
          </div>
        </div>

        {/* Lock / Unlock State Indicators */}
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 border ${
            canEditAlg 
              ? 'bg-blue-950/70 border-blue-600/60 text-blue-300' 
              : 'bg-zinc-850 border-zinc-700 text-zinc-400'
          }`}>
            {canEditAlg ? <Unlock className="w-3 h-3 text-blue-400" /> : <Lock className="w-3 h-3 text-zinc-500" />}
            ALG: {canEditAlg ? 'Mode Edit Aktif' : 'Terkunci'}
          </span>
          <span className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 border ${
            canEditStd ? 'bg-emerald-950/70 border-emerald-600/60 text-emerald-300' : 'bg-zinc-850 border-zinc-700 text-zinc-400'
          }`}>
            {canEditStd ? <Unlock className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3 text-zinc-500" />}
            STD: {canEditStd ? 'Mode Edit Aktif' : 'Terkunci'}
          </span>

          <span className="text-zinc-500 text-[11px]">
            Toleransi BKD: <strong className="text-zinc-300 font-mono">±{batasKesalahanMm.toFixed(1)} mm</strong>
          </span>
        </div>
      </div>

      {/* Scrollable Table Area */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <table id="tbl-atg-points" className="w-full text-left border-collapse text-xs select-none">
          {/* Header Row */}
          <thead className="bg-[#151922] text-zinc-300 sticky top-0 z-20 border-b border-zinc-800 shadow-sm">
            <tr>
              <th className="py-2.5 px-3 w-12 text-center">Uji</th>
              <th className="py-2.5 px-2 w-16 text-center font-bold">Meter</th>
              <th className="py-2.5 px-2 text-center bg-blue-950/30 border-l border-r border-blue-900/30 text-blue-300" colSpan={4}>
                PEMBACAAN ALG (AUTOMATIC LIQUID GAUGE)
              </th>
              <th className="py-2.5 px-2 text-center bg-emerald-950/30 border-r border-emerald-900/30 text-emerald-300" rowSpan={2}>
                Deviasi (mm)
              </th>
              <th className="py-2.5 px-2 text-center w-20" rowSpan={2}>Status BKD</th>
            </tr>
            <tr className="text-[10px] text-zinc-400 bg-[#12151e] border-b border-zinc-800/80">
              <th className="py-1 px-2 text-center">Check</th>
              <th className="py-1 px-2 text-center">Posisi</th>
              <th className="py-1 px-2 text-center text-blue-200">Naik (mm)</th>
              <th className="py-1 px-2 text-center text-blue-200">Turun (mm)</th>
              <th className="py-1 px-2 text-center text-emerald-200">Std Naik</th>
              <th className="py-1 px-2 text-center text-emerald-200">Std Turun</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800/60 font-mono">
            {rows.map((row, idx) => {
              const isAtCurrentPos = Math.abs(currentMotorPos - row.meter) < 0.1;

              const naik = parseFloat(activeTestMode === 'KALIBRASI' ? row.stdNaik : row.algNaik) || 0;
              const turun = parseFloat(activeTestMode === 'KALIBRASI' ? row.stdTurun : row.algTurun) || 0;
              const deviasi = Math.abs(naik - turun);
              const isPass = deviasi <= batasKesalahanMm;

              return (
                <tr
                  key={row.meter}
                  id={`row-meter-${row.meter}`}
                  className={`transition-colors ${
                    isAtCurrentPos 
                      ? 'bg-blue-950/40 border-l-4 border-l-blue-500' 
                      : row.selected 
                        ? 'hover:bg-zinc-850/50 bg-[#0f121a]' 
                        : 'opacity-40 bg-zinc-950'
                  }`}
                >
                  {/* Checkbox Titik Uji */}
                  <td className="py-1.5 px-3 text-center">
                    <input
                      type="checkbox"
                      id={`chk-point-${row.meter}`}
                      checked={row.selected}
                      disabled={isTeraUlang && !row.selected && selectedCount >= 5}
                      onChange={(e) => onRowChange(idx, { selected: e.target.checked })}
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                  </td>

                  {/* Meter Column with tags for Zero & Home */}
                  <td className="py-1.5 px-2 text-center">
                    <div className="flex items-center justify-center gap-1 font-sans">
                      <span className="font-bold text-xs text-zinc-100">{row.meter} m</span>
                    </div>
                  </td>

                  {/* FIELD PEMBACAAN ALG: Naik */}
                  <td className="py-1.5 px-1.5">
                    <input
                      type="text"
                      id={`input-alg-naik-${row.meter}`}
                      disabled={!canEditAlg}
                      value={formatInteger(row.algNaik)}
                      onChange={(e) => onRowChange(idx, { algNaik: e.target.value })}
                      className={`w-full text-center px-1.5 py-1 rounded text-xs border transition ${
                        canEditAlg 
                          ? 'bg-zinc-900 text-blue-300 border-zinc-700 focus:border-blue-500 focus:bg-zinc-850' 
                          : 'bg-zinc-900/50 text-zinc-300 border-transparent cursor-default'
                      }`}
                    />
                  </td>

                  {/* FIELD PEMBACAAN ALG: Turun */}
                  <td className="py-1.5 px-1.5">
                    <input
                      type="text"
                      id={`input-alg-turun-${row.meter}`}
                      disabled={!canEditAlg}
                      value={formatInteger(row.algTurun)}
                      onChange={(e) => onRowChange(idx, { algTurun: e.target.value })}
                      className={`w-full text-center px-1.5 py-1 rounded text-xs border transition ${
                        canEditAlg 
                          ? 'bg-zinc-900 text-blue-300 border-zinc-700 focus:border-blue-500 focus:bg-zinc-850' 
                          : 'bg-zinc-900/50 text-zinc-300 border-transparent cursor-default'
                      }`}
                    />
                  </td>

                  {/* Nilai standar yang dimasukkan pada popup uji naik */}
                  <td className="py-1.5 px-1.5">
                    <input
                      type="text"
                      id={`input-alg-disk-sblm-${row.meter}`}
                      disabled={!canEditStd}
                      value={formatInteger(row.stdNaik)}
                      onChange={(e) => onRowChange(idx, { stdNaik: e.target.value, algDiskSebelum: e.target.value })}
                      className={`w-full text-center px-1.5 py-1 rounded text-xs border transition ${
                        canEditStd ? 'bg-zinc-900 text-emerald-300 border-zinc-700 focus:border-emerald-500 focus:bg-zinc-850' : 'bg-zinc-900/50 text-zinc-500 border-transparent cursor-not-allowed'
                      }`}
                    />
                  </td>

                  {/* Nilai standar yang dimasukkan pada popup uji turun */}
                  <td className="py-1.5 px-1.5 border-r border-zinc-800">
                    <input
                      type="text"
                      id={`input-alg-disk-ssdh-${row.meter}`}
                      disabled={!canEditStd}
                      value={formatInteger(row.stdTurun)}
                      onChange={(e) => onRowChange(idx, { stdTurun: e.target.value, algDiskSetelah: e.target.value })}
                      className={`w-full text-center px-1.5 py-1 rounded text-xs border transition ${
                        canEditStd ? 'bg-zinc-900 text-emerald-300 border-zinc-700 focus:border-emerald-500 focus:bg-zinc-850' : 'bg-zinc-900/50 text-zinc-500 border-transparent cursor-not-allowed'
                      }`}
                    />
                  </td>

                  {/* DEVIASI STANDAR */}
                  <td className="py-1.5 px-2 text-center text-[11px] border-r border-zinc-800 text-emerald-300">
                    {deviasi.toFixed(2)}
                  </td>

                  {/* STATUS BKD */}
                  <td className="py-1.5 px-2 text-center">
                    {isPass ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                        LULUS
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-bold bg-rose-950/60 text-rose-400 border border-rose-800/60">
                        PERIKSA
                      </span>
                    )}
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
