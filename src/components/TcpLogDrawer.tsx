import React, { useState } from 'react';
import { TcpLogMessage } from '../types';
import { Terminal, X, Trash2, Send, CornerDownLeft, ShieldCheck } from 'lucide-react';

interface TcpLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: TcpLogMessage[];
  onClearLogs: () => void;
  onSendRawCommand: (cmd: string) => void;
  isConnected: boolean;
}

export const TcpLogDrawer: React.FC<TcpLogDrawerProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
  onSendRawCommand,
  isConnected
}) => {
  const [customCmd, setCustomCmd] = useState('');

  if (!isOpen) return null;

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customCmd.trim()) return;
    onSendRawCommand(customCmd.trim());
    setCustomCmd('');
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-[#0e1118] border-l border-zinc-700/80 shadow-2xl flex flex-col text-xs text-zinc-200">
      {/* Header */}
      <div className="bg-[#131620] border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-zinc-100 text-xs">TERMINAL SOKET TCP/IP MOTOR CONTROLLER</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onClearLogs}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            title="Bersihkan Log"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            title="Tutup Terminal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Info bar */}
      <div className="bg-zinc-950 px-4 py-1.5 border-b border-zinc-850 flex items-center justify-between text-[11px] font-mono text-zinc-400">
        <span>Port: 8080 (ASCII Packet Protocol)</span>
        <span className={isConnected ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
          {isConnected ? '• ONLINE (STREAM ACTIVE)' : '• OFFLINE'}
        </span>
      </div>

      {/* Log list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 font-mono text-[11px]">
        {logs.length === 0 ? (
          <div className="text-zinc-600 text-center py-10">Belum ada lalu lintas data TCP/IP.</div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={`p-1.5 rounded flex items-start gap-2 border ${
                log.direction === 'TX'
                  ? 'bg-blue-950/20 border-blue-900/30 text-blue-300'
                  : log.direction === 'RX'
                  ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              <span className="text-[9px] text-zinc-500 shrink-0 font-mono mt-0.5">{log.timestamp}</span>
              <span className={`px-1 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                log.direction === 'TX' ? 'bg-blue-600 text-white' : log.direction === 'RX' ? 'bg-emerald-600 text-white' : 'bg-zinc-700 text-zinc-200'
              }`}>
                {log.direction}
              </span>
              <span className="break-all whitespace-pre-wrap">{log.payload}</span>
            </div>
          ))
        )}
      </div>

      {/* Quick Macro Commands */}
      <div className="bg-[#12151e] border-t border-zinc-800 p-2 grid grid-cols-3 gap-1.5 text-[10px]">
        <button
          onClick={() => onSendRawCommand('CMD:GOTO_ZERO_5M')}
          className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-mono"
        >
          ZERO (5M)
        </button>
        <button
          onClick={() => onSendRawCommand('CMD:GOTO_HOME_17M')}
          className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-emerald-300 font-mono"
        >
          HOME (17M)
        </button>
        <button
          onClick={() => onSendRawCommand('CMD:GET_STATUS')}
          className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-blue-300 font-mono"
        >
          GET_STATUS
        </button>
      </div>

      {/* Input row */}
      <form onSubmit={handleSend} className="bg-[#151924] border-t border-zinc-800 p-2.5 flex items-center gap-2">
        <input
          type="text"
          value={customCmd}
          onChange={(e) => setCustomCmd(e.target.value)}
          placeholder="Ketik perintah raw TCP (misal: CMD:MOVE_POS:8.500)..."
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-100 font-mono focus:border-cyan-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!customCmd.trim()}
          className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1 transition"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Kirim</span>
        </button>
      </form>
    </div>
  );
};
