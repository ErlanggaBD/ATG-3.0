import React, { useState } from 'react';
import { ExportSettings, TcpConnectionConfig } from '../types';
import { X, Settings, FileSpreadsheet, Network, Save, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportSettings: ExportSettings;
  onSaveExportSettings: (settings: ExportSettings) => void;
  tcpConfig: TcpConnectionConfig;
  onSaveTcpConfig: (config: TcpConnectionConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  exportSettings,
  onSaveExportSettings,
  tcpConfig,
  onSaveTcpConfig
}) => {
  const [localExport, setLocalExport] = useState<ExportSettings>({ ...exportSettings });
  const [localTcp, setLocalTcp] = useState<TcpConnectionConfig>({ ...tcpConfig });
  const [activeTab, setActiveTab] = useState<'EXCEL' | 'TCP'>('EXCEL');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveExportSettings(localExport);
    onSaveTcpConfig(localTcp);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        id="modal-settings"
        className="bg-[#151822] border border-zinc-700 rounded-xl w-full max-w-2xl text-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-[#12141c] border-b border-zinc-800 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">PENGATURAN SISTEM & PARAMETER EKSPOR</h2>
              <p className="text-xs text-zinc-400">Konfigurasi laporan Excel metrologi dan soket UDP controller</p>
            </div>
          </div>
          <button
            id="btn-close-modal-settings"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Header */}
        <div className="flex border-b border-zinc-800 bg-[#10121a] px-5 pt-2 text-xs">
          <button
            onClick={() => setActiveTab('EXCEL')}
            className={`flex items-center gap-2 px-4 py-2.5 font-semibold border-b-2 transition ${
              activeTab === 'EXCEL'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Parameter Ekspor Excel</span>
          </button>
          <button
            onClick={() => setActiveTab('TCP')}
            className={`flex items-center gap-2 px-4 py-2.5 font-semibold border-b-2 transition ${
              activeTab === 'TCP'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Network className="w-4 h-4" />
            <span>Koneksi UDP/LAN Controller</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {activeTab === 'EXCEL' ? (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Nama Operator / Penguji</label>
                  <input
                    type="text"
                    value={localExport.operatorName}
                    onChange={(e) => setLocalExport({ ...localExport, operatorName: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Nomor Seri ATG (DUT)</label>
                  <input
                    type="text"
                    value={localExport.nomorSeriAtg}
                    onChange={(e) => setLocalExport({ ...localExport, nomorSeriAtg: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Merk / Tipe Model ATG</label>
                  <input
                    type="text"
                    value={localExport.merkModelAtg}
                    onChange={(e) => setLocalExport({ ...localExport, merkModelAtg: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Instansi / Pemilik Alat</label>
                  <input
                    type="text"
                    value={localExport.instansiPemilik}
                    onChange={(e) => setLocalExport({ ...localExport, instansiPemilik: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Lokasi Pengujian</label>
                  <input
                    type="text"
                    value={localExport.lokasiPengujian}
                    onChange={(e) => setLocalExport({ ...localExport, lokasiPengujian: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Batas Kesalahan Izin / BKD (mm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={localExport.batasKesalahanIzinMm}
                    onChange={(e) => setLocalExport({ ...localExport, batasKesalahanIzinMm: parseFloat(e.target.value) || 1.0 })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5 pt-2 border-t border-zinc-800">
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Suhu Ruang Uji (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={localExport.suhuRuangan}
                    onChange={(e) => setLocalExport({ ...localExport, suhuRuangan: parseFloat(e.target.value) || 20.0 })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Kelembapan (%)</label>
                  <input
                    type="number"
                    value={localExport.kelembapan}
                    onChange={(e) => setLocalExport({ ...localExport, kelembapan: parseFloat(e.target.value) || 55 })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-950/30 border border-blue-800/40 p-3 rounded-lg text-blue-300 text-xs">
                Parameter alamat IP dan Port soket UDP firmware Arduino/W5100 (Ethernet shield) di LAN.
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Alamat IP Controller</label>
                  <input
                    type="text"
                    value={localTcp.host}
                    onChange={(e) => setLocalTcp({ ...localTcp, host: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Port UDP</label>
                  <input
                    type="number"
                    value={localTcp.port}
                    onChange={(e) => setLocalTcp({ ...localTcp, port: parseInt(e.target.value) || 8888 })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Timeout Koneksi (ms)</label>
                <input
                  type="number"
                  value={localTcp.timeoutMs}
                  onChange={(e) => setLocalTcp({ ...localTcp, timeoutMs: parseInt(e.target.value) || 3000 })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="chk-auto-reconnect"
                  checked={localTcp.autoReconnect}
                  onChange={(e) => setLocalTcp({ ...localTcp, autoReconnect: e.target.checked })}
                  className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="chk-auto-reconnect" className="text-zinc-300 cursor-pointer">
                  Auto-Reconnect otomatis jika koneksi UDP terputus
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#12141c] border-t border-zinc-800 px-5 py-3 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
          >
            Batal
          </button>
          <button
            id="btn-save-settings"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition"
          >
            {savedSuccess ? <Check className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
            <span>{savedSuccess ? 'Tersimpan!' : 'Simpan Pengaturan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
