import React, { useState } from 'react';
import { 
  Layers, 
  Terminal, 
  Download,
  Settings, 
  FileSpreadsheet, 
  Wifi, 
  WifiOff, 
  HardDrive,
  Info,
  HelpCircle,
  Play,
  RotateCcw,
  ShieldCheck,
  Sun,
  Moon
} from 'lucide-react';
import { MotorStatus, TcpConnectionConfig } from '../types';

interface DesktopWindowFrameProps {
  children: React.ReactNode;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  motorStatus: MotorStatus;
  tcpConfig: TcpConnectionConfig;
  onOpenSettings: () => void;
  onOpenPreview: () => void;
  onOpenTcpLog: () => void;
  onToggleTcp: () => void;
  onEmergencyStop: () => void;
  onZero5M: () => void;
  onHome17M: () => void;
  onPengujianNaik: () => void;
  onPengujianTurun: () => void;
  onCloseApp: () => void;
}

export const DesktopWindowFrame: React.FC<DesktopWindowFrameProps> = ({
  children,
  theme,
  onToggleTheme,
  motorStatus,
  tcpConfig,
  onOpenSettings,
  onOpenPreview,
  onOpenTcpLog,
  onToggleTcp,
  onEmergencyStop,
  onZero5M,
  onHome17M,
  onPengujianNaik,
  onPengujianTurun,
  onCloseApp
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const closeMenu = () => setActiveMenu(null);

  return (
    <div className={`app-shell ${theme === 'light' ? 'theme-light' : ''} flex flex-col h-screen w-screen bg-[#0a0c10] text-zinc-200 overflow-hidden font-sans`}>
      {/* Desktop Window Container */}
      <div className="flex-1 flex flex-col bg-[#12141c] border border-zinc-700/80 rounded-lg shadow-2xl overflow-hidden min-h-0">
        {/* Windows Native Menu Bar (File, Motor TCP, Metrologi, Tools, Bantuan) */}
        <div 
          id="win32-menubar" 
          className="bg-[#191c26] border-b border-zinc-800/80 px-2 py-0.5 flex items-center gap-1 text-xs select-none relative z-30 shrink-0"
        >
          {/* Menu: File */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
              className={`px-2.5 py-1 rounded text-zinc-300 hover:bg-zinc-800 cursor-pointer ${
                activeMenu === 'file' ? 'bg-zinc-800 text-white font-medium' : ''
              }`}
            >
              File
            </button>
            {activeMenu === 'file' && (
              <div className="absolute left-0 top-full mt-1 w-56 bg-[#1b1e2a] border border-zinc-700 rounded-md shadow-xl py-1 z-40 text-xs">
                <button 
                  onClick={() => { onOpenPreview(); closeMenu(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between"
                >
                  <span>Lihat & Ekspor Hasil Uji...</span>
                  <span className="text-[10px] text-zinc-500">Ctrl+E</span>
                </button>
                <button 
                  onClick={() => { onOpenSettings(); closeMenu(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between"
                >
                  <span>Pengaturan Metadata & Instansi...</span>
                  <span className="text-[10px] text-zinc-500">Ctrl+P</span>
                </button>
                <div className="my-1 border-t border-zinc-700/60"></div>
                <button 
                  onClick={() => { onCloseApp(); closeMenu(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-rose-600 hover:text-white text-rose-300"
                >
                  Keluar Aplikasi (Exit)
                </button>
              </div>
            )}
          </div>

          {/* Menu: Motor & TCP */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'motor' ? null : 'motor')}
              className={`px-2.5 py-1 rounded text-zinc-300 hover:bg-zinc-800 cursor-pointer ${
                activeMenu === 'motor' ? 'bg-zinc-800 text-white font-medium' : ''
              }`}
            >
              Motor & TCP
            </button>
            {activeMenu === 'motor' && (
              <div className="absolute left-0 top-full mt-1 w-60 bg-[#1b1e2a] border border-zinc-700 rounded-md shadow-xl py-1 z-40 text-xs">
                <button 
                  onClick={() => { onToggleTcp(); closeMenu(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between"
                >
                  <span>{motorStatus.connected ? 'Putuskan Soket TCP' : 'Hubungkan Soket TCP'}</span>
                  <span className="text-[10px] text-zinc-500">Ctrl+T</span>
                </button>
                <button 
                  onClick={() => { onOpenTcpLog(); closeMenu(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white"
                >
                  Buka Console Traffic Log TCP...
                </button>
                <div className="my-1 border-t border-zinc-700/60"></div>
                <button 
                  onClick={() => { onZero5M(); closeMenu(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white"
                >
                  Gerakkan ke Titik ZERO (5.0 m)
                </button>
                <button 
                  onClick={() => { onHome17M(); closeMenu(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white"
                >
                  Gerakkan ke Titik HOME (17.0 m)
                </button>
                <div className="my-1 border-t border-zinc-700/60"></div>
                <button 
                  onClick={() => { onEmergencyStop(); closeMenu(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-rose-600 hover:text-white text-rose-300 font-bold"
                >
                  EMERGENCY STOP (Hentikan Motor)
                </button>
              </div>
            )}
          </div>

          {/* Menu: Sekuens Uji */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'sekuens' ? null : 'sekuens')}
              className={`px-2.5 py-1 rounded text-zinc-300 hover:bg-zinc-800 cursor-pointer ${
                activeMenu === 'sekuens' ? 'bg-zinc-800 text-white font-medium' : ''
              }`}
            >
              Pengujian Metrologi
            </button>
            {activeMenu === 'sekuens' && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-[#1b1e2a] border border-zinc-700 rounded-md shadow-xl py-1 z-40 text-xs">
                <button 
                  onClick={() => { onPengujianNaik(); closeMenu(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white"
                >
                  Mulai Pengujian Naik (titik tercentang)
                </button>
                <button 
                  onClick={() => { onPengujianTurun(); closeMenu(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white"
                >
                  Mulai Pengujian Turun (titik tercentang)
                </button>
              </div>
            )}
          </div>

          {/* Menu: Bantuan */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'help' ? null : 'help')}
              className={`px-2.5 py-1 rounded text-zinc-300 hover:bg-zinc-800 cursor-pointer ${
                activeMenu === 'help' ? 'bg-zinc-800 text-white font-medium' : ''
              }`}
            >
              Bantuan
            </button>
            {activeMenu === 'help' && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-[#1b1e2a] border border-zinc-700 rounded-md shadow-xl py-1 z-40 text-xs">
                <button 
                  onClick={() => { 
                    alert("Aplikasi Otomasi Pengujian ATG Horizontal dirancang khusus sebagai aplikasi desktop Windows dengan arsitektur C Win32 API murni & komunikasi TCP/IP untuk kontrol motor stepper pada lintasan 1 - 17 meter.");
                    closeMenu(); 
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white"
                >
                  Tentang Aplikasi Desktop Win32
                </button>
                <button 
                  onClick={() => { 
                    alert("Batas Kesalahan Izin (BKD) standar metrologi adalah ±1.0 mm untuk pengujian linieritas ATG rentang 1 s.d 17 meter.");
                    closeMenu(); 
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white"
                >
                  Standar Toleransi Metrologi BKD
                </button>
              </div>
            )}
          </div>

          <button
            id="btn-toggle-theme"
            onClick={onToggleTheme}
            className="ml-auto px-2.5 py-1 rounded text-zinc-300 hover:bg-zinc-800 flex items-center gap-1.5 cursor-pointer"
            title={theme === 'dark' ? 'Gunakan tema terang' : 'Gunakan tema gelap'}
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-blue-500" />}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>

          {/* Backdrop to close menus on click outside */}
          {activeMenu && (
            <div 
              className="fixed inset-0 z-30" 
              onClick={closeMenu}
            />
          )}
        </div>

        {/* 3. Main Window Body (App Content) */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#0d1017]">
          {children}
        </div>

        {/* 4. Windows Desktop Status Bar (Bottom) */}
        <div 
          id="win32-statusbar" 
          className="h-6 bg-[#13151f] border-t border-zinc-800/90 px-3 flex items-center justify-between text-[11px] text-zinc-400 font-mono select-none shrink-0"
        >
          {/* Status Left */}
          <div className="flex items-center gap-4 truncate">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${motorStatus.connected ? 'bg-emerald-400' : 'bg-rose-500'}`}></span>
              <span className="text-zinc-300">
                TCP: {motorStatus.connected ? `${tcpConfig.host}:${tcpConfig.port} (CONNECTED)` : 'OFFLINE'}
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-1 text-zinc-400">
              <span>Motor:</span>
              <span className="text-zinc-200 font-bold">
                {motorStatus.isMoving ? `MOVING (${motorStatus.direction})` : 'IDLE / READY'}
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-1 text-zinc-400">
              <span>Sensors:</span>
              <span className="text-zinc-200">
                ZERO={motorStatus.zeroSensorActive ? 'ACTIVE(5m)' : '0'} | HOME={motorStatus.homeSensorActive ? 'ACTIVE(17m)' : '0'}
              </span>
            </div>
          </div>

          {/* Status Right (System & Target Platform) */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden sm:inline-block text-zinc-500">
              Win32 GUI / Winsock2
            </span>
            <span className="px-1.5 py-0.2 bg-zinc-800 rounded text-zinc-300 border border-zinc-700">
              Target: Windows 10/11 x64 (.exe)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
