import React from 'react';
import { 
  Wifi, 
  WifiOff, 
  AlertOctagon, 
  FileSpreadsheet,
  Terminal,
  Zap
} from 'lucide-react';
import { MotorStatus, TcpConnectionConfig } from '../types';

interface HeaderProps {
  motorStatus: MotorStatus;
  tcpConfig: TcpConnectionConfig;
  onToggleTcp: () => void;
  onEmergencyStop: () => void;
  onOpenTcpLog: () => void;
  activeTestMode: string;
}

export const Header: React.FC<HeaderProps> = ({
  motorStatus,
  tcpConfig,
  onToggleTcp,
  onEmergencyStop,
  onOpenTcpLog,
  activeTestMode
}) => {
  return (
    <header id="header-main" className="bg-[#12141a] border-b border-zinc-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 select-none text-zinc-100 shadow-md">
      {/* Title & Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black tracking-wider">
          ATG
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-zinc-100 tracking-wide">
              OTOMASI PENGUJIAN ATG HORIZONTAL
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider rounded bg-zinc-800 text-blue-400 border border-zinc-700">
              1.0 - 17.0 M
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Sistem Kontrol Motor Stepper & Kalibrasi Metrologi Akurasi Alat Ukur Panjang
          </p>
        </div>
      </div>

      {/* Middle Status Indicators */}
      <div className="flex items-center gap-4 bg-zinc-900/90 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs">
        {/* TCP Connection Status */}
        <button
          id="btn-toggle-tcp"
          onClick={onToggleTcp}
          className="flex items-center gap-1.5 hover:opacity-80 transition cursor-pointer"
          title="Klik untuk Connect / Disconnect Soket UDP"
        >
          {motorStatus.connected ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <Wifi className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 font-mono font-medium">
                {tcpConfig.host}:{tcpConfig.port}
              </span>
            </>
          ) : (
            <>
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
              <WifiOff className="w-4 h-4 text-rose-400" />
              <span className="text-rose-400 font-mono">DISCONNECTED</span>
            </>
          )}
        </button>

        <div className="w-[1px] h-4 bg-zinc-800"></div>

        {/* Active Mode */}
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-400">Mode:</span>
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-950/60 text-blue-300 border border-blue-800/50">
            {activeTestMode}
          </span>
        </div>
      </div>

      {/* Right Action Tools & Switchers */}
      <div className="flex items-center gap-2">
        {/* TCP Live Log Button */}
        <button
          id="btn-open-tcplog"
          onClick={onOpenTcpLog}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 transition"
          title="Buka Terminal Log UDP"
        >
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span>Log UDP</span>
        </button>

        {/* Emergency Stop Button */}
        <button
          id="btn-emergency-stop"
          onClick={onEmergencyStop}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs tracking-wider shadow-lg shadow-rose-950/40 border border-rose-500 transition cursor-pointer active:scale-95"
          title="Emergency Stop Motor Stepper"
        >
          <AlertOctagon className="w-4 h-4" />
          <span>E-STOP</span>
        </button>
      </div>
    </header>
  );
};
