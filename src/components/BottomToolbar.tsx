import React from 'react';
import { 
  Settings, 
  FileText, 
  X, 
  Minus, 
  Home, 
  ArrowUp, 
  ArrowDown, 
  Clock,
  Sparkles,
  Play,
  Square,
  Pencil
} from 'lucide-react';

interface BottomToolbarProps {
  onOpenSettings: () => void;
  onOpenPreview: () => void;
  onCloseApp: () => void;
  onZero5M: () => void;
  onHome17M: () => void;
  onPengujianNaik: () => void;
  onPengujianTurun: () => void;
  lastCalibrationTimestamp: string;
  isEditAlg: boolean;
  onToggleEditAlg: () => void;
  isEditStd: boolean;
  onToggleEditStd: () => void;
  isRunningSequence: boolean;
}

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  onOpenSettings,
  onOpenPreview,
  onCloseApp,
  onZero5M,
  onHome17M,
  onPengujianNaik,
  onPengujianTurun,
  lastCalibrationTimestamp,
  isEditAlg,
  onToggleEditAlg,
  isEditStd,
  onToggleEditStd,
  isRunningSequence
}) => {
  return (
    <footer id="toolbar-bawah" className="bg-[#12141c] border-t border-zinc-800 p-3 select-none text-zinc-200 shadow-2xl">
      {/* Top row in footer: Timestamp & Active Status indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-zinc-850 text-xs">
        <div className="flex items-center gap-2 text-zinc-300">
          <Clock className="w-4 h-4 text-blue-400" />
          <span className="text-zinc-400">Kalibrasi Terakhir:</span>
          <span id="lbl-last-calibration" className="font-mono font-semibold text-zinc-100 bg-black/40 px-2 py-0.5 rounded border border-zinc-800">
            {lastCalibrationTimestamp}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {isRunningSequence ? (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Sekuens Motor Sedang Berjalan...
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Controller Siap Menerima Perintah TCP
            </span>
          )}
        </div>
      </div>

      {/* Main Buttons Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Left Group: Pengaturan, Preview, Edit ALG, Edit STD */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol PENGATURAN (ikon gerigi) */}
          <button
            id="btn-toolbar-pengaturan"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer"
            title="Konfigurasi parameter ekspor Excel & TCP/IP"
          >
            <Settings className="w-4 h-4 text-blue-400" />
            <span>PENGATURAN</span>
          </button>

          {/* Tombol PREVIEW (ikon dokumen) */}
          <button
            id="btn-toolbar-preview"
            onClick={onOpenPreview}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer"
            title="Preview laporan pengujian sebelum diekspor"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>PREVIEW</span>
          </button>

          <div className="w-[1px] h-6 bg-zinc-800 hidden sm:block"></div>

          <button
            id="btn-toolbar-edit-alg"
            onClick={onToggleEditAlg}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition active:scale-95 cursor-pointer ${
              isEditAlg
                ? 'bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-900/40'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-300'
            }`}
            title="Buka atau kunci input Naik dan Turun"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>{isEditAlg ? 'KUNCI NAIK/TURUN' : 'EDIT NAIK/TURUN'}</span>
          </button>

          <button
            id="btn-toolbar-edit-std"
            onClick={onToggleEditStd}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition active:scale-95 cursor-pointer ${
              isEditStd
                ? 'bg-emerald-600 border-emerald-400 text-white shadow-md shadow-emerald-900/40'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-300'
            }`}
            title="Buka atau kunci input Std Naik dan Std Turun"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>{isEditStd ? 'KUNCI STD' : 'EDIT STD'}</span>
          </button>

        </div>

        {/* Center/Right Group: Motor Control Commands (ZERO 5m, HOME 17m, UJI NAIK, UJI TURUN, CLOSE) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol ZERO (ikon garis tengah) -> Pindah motor ke area 5 meter */}
          <button
            id="btn-toolbar-zero"
            onClick={onZero5M}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600/90 hover:bg-amber-600 border border-amber-400 text-white text-xs font-bold shadow-md shadow-amber-950/40 transition active:scale-95 cursor-pointer"
            title="Kirim perintah TCP/IP: Pindahkan motor ke Area 5.0 Meter (ZERO)"
          >
            <Minus className="w-4 h-4 stroke-[3]" />
            <span>ZERO (5m)</span>
          </button>

          {/* Tombol HOME (ikon rumah) -> Pindah motor ke area 17 meter */}
          <button
            id="btn-toolbar-home"
            onClick={onHome17M}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600/90 hover:bg-emerald-600 border border-emerald-400 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition active:scale-95 cursor-pointer"
            title="Kirim perintah TCP/IP: Pindahkan motor ke Area 17.0 Meter (HOME)"
          >
            <Home className="w-4 h-4" />
            <span>HOME (17m)</span>
          </button>

          <div className="w-[1px] h-6 bg-zinc-800 hidden sm:block"></div>

          {/* Tombol PENGUJIAN NAIK (ikon panah atas) */}
          <button
            id="btn-toolbar-uji-naik"
            onClick={onPengujianNaik}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 border border-blue-500 text-white text-xs font-bold shadow-md transition active:scale-95 cursor-pointer"
            title="Mulai sekuens pengujian naik sesuai titik tercentang"
          >
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            <span>PENGUJIAN NAIK</span>
          </button>

          {/* Tombol PENGUJIAN TURUN (ikon panah bawah) */}
          <button
            id="btn-toolbar-uji-turun"
            onClick={onPengujianTurun}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-600 border border-indigo-500 text-white text-xs font-bold shadow-md transition active:scale-95 cursor-pointer"
            title="Mulai sekuens pengujian turun sesuai titik tercentang"
          >
            <ArrowDown className="w-4 h-4 stroke-[2.5]" />
            <span>PENGUJIAN TURUN</span>
          </button>

          {/* Tombol CLOSE (ikon X) */}
          <button
            id="btn-toolbar-close"
            onClick={onCloseApp}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 hover:bg-rose-950/70 border border-zinc-700 hover:border-rose-700 text-zinc-300 hover:text-rose-300 text-xs font-semibold transition active:scale-95 cursor-pointer"
            title="Tutup / Akhiri Sesi Aplikasi"
          >
            <X className="w-4 h-4 text-rose-400" />
            <span>CLOSE</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
