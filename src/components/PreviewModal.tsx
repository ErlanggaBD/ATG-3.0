import React from 'react';
import { AtgTestRow, ExportSettings, TestType } from '../types';
import { X, FileSpreadsheet, Download, CheckCircle, AlertTriangle, Printer } from 'lucide-react';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  rows: AtgTestRow[];
  activeTestMode: TestType;
  exportSettings: ExportSettings;
  lastCalibrationTimestamp: string;
  onExportCsv: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  rows,
  activeTestMode,
  exportSettings,
  lastCalibrationTimestamp,
  onExportCsv
}) => {
  if (!isOpen) return null;

  const testedRows = rows.filter((r) => r.selected);
  const isCalibration = activeTestMode === 'KALIBRASI';
  
  // Calculate summary stats
  let maxDev = 0;
  let passCount = 0;

  testedRows.forEach((r) => {
    const naik = parseFloat(isCalibration ? r.stdNaik : r.algNaik) || 0;
    const turun = parseFloat(isCalibration ? r.stdTurun : r.algTurun) || 0;
    const deviasi = Math.abs(naik - turun);

    if (deviasi <= exportSettings.batasKesalahanIzinMm) {
      passCount++;
    }
    if (deviasi > maxDev) maxDev = deviasi;
  });

  const isAllPass = passCount === testedRows.length && testedRows.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        id="modal-preview"
        className="bg-[#151822] border border-zinc-700 rounded-xl w-full max-w-4xl text-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="bg-[#12141c] border-b border-zinc-800 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">PREVIEW LAPORAN PENGUJIAN ATG (1 - 17 METER)</h2>
              <p className="text-xs text-zinc-400">Verifikasi data metrologi sebelum ekspor ke file format Excel / CSV</p>
            </div>
          </div>
          <button
            id="btn-close-modal-preview"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Metadata Card */}
          <div className="bg-[#10121a] border border-zinc-800 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-zinc-300">
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Alat Uji (DUT)</span>
              <strong className="text-zinc-100">{exportSettings.merkModelAtg}</strong>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Nomor Seri</span>
              <strong className="text-zinc-100 font-mono">{exportSettings.nomorSeriAtg}</strong>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Operator Penguji</span>
              <strong className="text-zinc-100">{exportSettings.operatorName}</strong>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Instansi Pemilik</span>
              <strong className="text-zinc-100">{exportSettings.instansiPemilik}</strong>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Lokasi Uji</span>
              <span className="text-zinc-300">{exportSettings.lokasiPengujian}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Suhu & Kelembapan</span>
              <span className="text-zinc-300">{exportSettings.suhuRuangan}°C / {exportSettings.kelembapan}% RH</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Batas Toleransi (BKD)</span>
              <strong className="text-blue-400 font-mono">± {exportSettings.batasKesalahanIzinMm.toFixed(1)} mm</strong>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Waktu Kalibrasi</span>
              <span className="text-zinc-300 font-mono text-[11px]">{lastCalibrationTimestamp}</span>
            </div>
          </div>

          {/* Verdict Banner */}
          <div className={`p-3 rounded-lg border flex items-center justify-between ${
            isAllPass 
              ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-300' 
              : 'bg-amber-950/40 border-amber-600/50 text-amber-300'
          }`}>
            <div className="flex items-center gap-2">
              {isAllPass ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-amber-400" />}
              <div>
                <strong className="block text-xs">
                  {isAllPass ? 'KESIMPULAN: MEMENUHI PERSYARATAN METROLOGI (LULUS)' : 'KESIMPULAN: PERLU PENGECEKAN / ADJUSTMENT SPAN'}
                </strong>
                <span className="text-[11px] opacity-80">
                  {passCount} dari {testedRows.length} titik uji berada dalam toleransi BKD (±{exportSettings.batasKesalahanIzinMm} mm). Deviasi Maksimum: {maxDev.toFixed(2)} mm.
                </span>
              </div>
            </div>
          </div>

          {/* Table Preview */}
          <div className="border border-zinc-800 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead className="bg-zinc-900 text-zinc-300 border-b border-zinc-800 text-[11px]">
                <tr>
                  <th className="py-2 px-2.5 text-center">Titik (m)</th>
                  <th className="py-2 px-2 text-right text-blue-300">ALG Naik (mm)</th>
                  <th className="py-2 px-2 text-right text-blue-300">ALG Turun (mm)</th>
                  <th className="py-2 px-2 text-right text-emerald-300">Std Naik (mm)</th>
                  <th className="py-2 px-2 text-right text-emerald-300">Std Turun (mm)</th>
                  <th className="py-2 px-2 text-right text-emerald-300">Deviasi (mm)</th>
                  <th className="py-2 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 bg-[#0f121a]">
                {rows.map((r) => {
                  const naik = parseFloat(isCalibration ? r.stdNaik : r.algNaik) || 0;
                  const turun = parseFloat(isCalibration ? r.stdTurun : r.algTurun) || 0;
                  const deviasi = Math.abs(naik - turun);
                  const isPass = deviasi <= exportSettings.batasKesalahanIzinMm;

                  return (
                    <tr key={r.meter} className={r.selected ? '' : 'opacity-30'}>
                      <td className="py-1.5 px-2.5 text-center font-sans font-bold text-zinc-200">{r.meter} m</td>
                      <td className="py-1.5 px-2 text-right text-zinc-300">{r.algNaik}</td>
                      <td className="py-1.5 px-2 text-right text-zinc-300">{r.algTurun}</td>
                      <td className="py-1.5 px-2 text-right text-emerald-300">{r.stdNaik}</td>
                      <td className="py-1.5 px-2 text-right text-emerald-300">{r.stdTurun}</td>
                      <td className="py-1.5 px-2 text-center text-emerald-300">{deviasi.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-center font-sans">
                        {r.selected ? (
                          isPass ? (
                            <span className="text-emerald-400 font-bold text-[10px]">LULUS</span>
                          ) : (
                            <span className="text-rose-400 font-bold text-[10px]">PERIKSA</span>
                          )
                        ) : (
                          <span className="text-zinc-600 text-[10px]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-[#12141c] border-t border-zinc-800 px-5 py-3 flex items-center justify-between">
          <span className="text-zinc-400 text-xs">
            File Output: <strong className="text-zinc-200">Hasil_Uji_ATG_Horizontal.csv</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
            >
              Tutup
            </button>
            <button
              id="btn-download-csv-export"
              onClick={onExportCsv}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor File Excel (.CSV)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
