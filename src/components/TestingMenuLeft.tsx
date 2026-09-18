import React from 'react';
import { 
  Target, 
  RotateCw, 
  Ruler, 
  Scale, 
  CheckCircle2, 
  Play, 
  Info,
  ChevronRight
} from 'lucide-react';
import { TestType } from '../types';

interface TestingMenuLeftProps {
  activeTestMode: TestType;
  onSelectTestMode: (mode: TestType) => void;
  isRunningSequence: boolean;
  onFillPresetData: (type: TestType) => void;
}

export const TestingMenuLeft: React.FC<TestingMenuLeftProps> = ({
  activeTestMode,
  onSelectTestMode,
  isRunningSequence,
  onFillPresetData
}) => {
  const testOptions = [
    {
      id: 'KALIBRASI' as TestType,
      btnId: 'btn-menu-kalibrasi',
      title: '1. KALIBRASI',
      subtitle: 'Standar Acuan Titik Nol & Span',
      desc: 'Penetapan nilai deviasi instrumen ATG terhadap standar ukur acuan metrologi.',
      icon: Target,
      color: 'from-blue-600/20 to-blue-900/10 border-blue-500/40 text-blue-400',
      activeBg: 'bg-blue-600/30 border-blue-400 text-white shadow-lg shadow-blue-950/50'
    },
    {
      id: 'TERA_ULANG' as TestType,
      btnId: 'btn-menu-tera-ulang',
      title: '2. TERA ULANG',
      subtitle: 'Verifikasi Periodik Lapangan',
      desc: 'Pengujian berkala legal metrologi untuk memastikan keabsahan transaksi tangki.',
      icon: RotateCw,
      color: 'from-emerald-600/20 to-emerald-900/10 border-emerald-500/40 text-emerald-400',
      activeBg: 'bg-emerald-600/30 border-emerald-400 text-white shadow-lg shadow-emerald-950/50'
    },
    {
      id: 'EVALUASI_AKURASI' as TestType,
      btnId: 'btn-menu-eval-akurasi',
      title: '3. EVALUASI AKURASI',
      subtitle: 'Pengujian Titik 5m s.d 17m',
      desc: 'Uji linieritas dan kesalahan penunjukan (BKD: ±1.0 mm) di sepanjang rel uji.',
      icon: Ruler,
      color: 'from-purple-600/20 to-purple-900/10 border-purple-500/40 text-purple-400',
      activeBg: 'bg-purple-600/30 border-purple-400 text-white shadow-lg shadow-purple-950/50'
    },
    {
      id: 'EVALUASI_DISKRIMINASI' as TestType,
      btnId: 'btn-menu-eval-diskriminasi',
      title: '4. EVALUASI DISKRIMINASI',
      subtitle: 'Uji Kepekaan Ambang Sinyal',
      desc: 'Verifikasi respon ATG saat diberi beban perubahan tinggi cairan sebelum & sesudah.',
      icon: Scale,
      color: 'from-amber-600/20 to-amber-900/10 border-amber-500/40 text-amber-400',
      activeBg: 'bg-amber-600/30 border-amber-400 text-white shadow-lg shadow-amber-950/50'
    }
  ];

  return (
    <aside id="panel-menu-kiri" className="w-full lg:w-72 bg-[#12141a] border-r border-zinc-800 p-3 flex flex-col justify-between select-none">
      <div>
        {/* Menu Header */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              MENU PENGUJIAN
            </h2>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">4 MODE UJI</span>
        </div>

        {/* 4 Tombol Besar */}
        <div className="space-y-2.5">
          {testOptions.map((opt) => {
            const Icon = opt.icon;
            const isActive = activeTestMode === opt.id;

            return (
              <button
                key={opt.id}
                id={opt.btnId}
                onClick={() => onSelectTestMode(opt.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col gap-1 relative overflow-hidden group ${
                  isActive
                    ? opt.activeBg
                    : 'bg-zinc-900/80 hover:bg-zinc-850 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                }`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-blue-400"></div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/10 text-white' : 'bg-zinc-800 text-zinc-300 group-hover:text-white'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs tracking-wide">{opt.title}</span>
                  </div>
                  {isActive ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition" />
                  )}
                </div>

                <div className="text-[11px] text-zinc-400 pl-7 font-medium">
                  {opt.subtitle}
                </div>

                <div className="text-[10px] text-zinc-500 pl-7 leading-tight line-clamp-2 mt-0.5">
                  {opt.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Helper / Presets for Inspection */}
      <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-zinc-400">
          <span className="flex items-center gap-1">
            <Info className="w-3 h-3 text-zinc-500" />
            Auto-Fill Data Simulasi:
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            id="btn-preset-nominal"
            onClick={() => onFillPresetData(activeTestMode)}
            className="px-2 py-1.5 text-[11px] rounded bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-center transition"
          >
            Nilai Nominal
          </button>
          <button
            id="btn-preset-real"
            onClick={() => onFillPresetData('EVALUASI_AKURASI')}
            className="px-2 py-1.5 text-[11px] rounded bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-center transition"
          >
            Data Deviasi Uji
          </button>
        </div>
      </div>
    </aside>
  );
};
