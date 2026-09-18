import React from 'react';
import { AlertOctagon, RefreshCcw, WifiOff, X } from 'lucide-react';

interface HardwareOfflineModalProps {
  isOpen: boolean;
  actionLabel: string;
  host: string;
  port: number;
  onClose: () => void;
  onTryConnect: () => void;
}

export const HardwareOfflineModal: React.FC<HardwareOfflineModalProps> = ({
  isOpen,
  actionLabel,
  host,
  port,
  onClose,
  onTryConnect
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="modal-connection-required"
      className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#151822] border border-rose-700/60 rounded-xl w-full max-w-md text-zinc-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#12141c] border-b border-zinc-800 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30">
              <WifiOff className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">BELUM TERHUBUNG KE HARDWARE</h2>
              <p className="text-xs text-zinc-400">Perintah tidak dapat dijalankan</p>
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
        <div className="p-5 space-y-3 text-xs">
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-950/30 border border-rose-900/40">
            <AlertOctagon className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
            <p className="text-zinc-300 leading-relaxed">
              Aksi <strong className="text-white">&quot;{actionLabel}&quot;</strong> diblokir karena
              aplikasi <strong className="text-white">belum terhubung ke jaringan hardware</strong>.
              Perintah yang berkaitan dengan pergerakan/aksi fisik hardware hanya dapat dijalankan
              setelah koneksi ke perangkat aktif.
            </p>
          </div>

          <div>
            <p className="font-bold text-zinc-100 mb-1.5">Silakan periksa koneksi berikut:</p>
            <ol className="list-decimal list-inside space-y-1 text-zinc-400 leading-relaxed">
              <li>Pastikan kabel jaringan (Ethernet) antara komputer dan perangkat ATG terpasang dengan benar.</li>
              <li>Pastikan perangkat ATG / firmware menyala dan berada pada IP <span className="font-mono text-cyan-300">{host}:{port}</span>.</li>
              <li>Klik tombol <strong className="text-zinc-200">DISCONNECTED</strong> di bagian atas aplikasi untuk menghubungkan kembali.</li>
              <li>Jika masih gagal, periksa kembali IP/Port pada menu <strong className="text-zinc-200">PENGATURAN</strong>.</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#12141c] border-t border-zinc-800 px-5 py-3 flex items-center justify-end gap-2.5">
          <button
            id="btn-connection-close"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
          >
            Tutup
          </button>
          <button
            id="btn-connection-retry"
            onClick={onTryConnect}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Coba Hubungkan</span>
          </button>
        </div>
      </div>
    </div>
  );
};