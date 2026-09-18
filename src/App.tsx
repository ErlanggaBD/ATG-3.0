/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  AtgTestRow, 
  TestType, 
  MotorStatus, 
  TcpConnectionConfig, 
  ExportSettings, 
  TcpLogMessage 
} from './types';
import { Header } from './components/Header';
import { MotorTrackVisualizer } from './components/MotorTrackVisualizer';
import { TestingMenuLeft } from './components/TestingMenuLeft';
import { TestingTable } from './components/TestingTable';
import { BottomToolbar } from './components/BottomToolbar';
import { SettingsModal } from './components/SettingsModal';
import { PreviewModal } from './components/PreviewModal';
import { TcpLogDrawer } from './components/TcpLogDrawer';
import { MeasurementModal } from './components/MeasurementModal';
import { DesktopWindowFrame } from './components/DesktopWindowFrame';
import { HardwareOfflineModal } from './components/HardwareOfflineModal';

declare global {
  interface Window {
    desktopApp?: {
      isDesktop: boolean;
      close: () => void;
      loadLastCalibration?: () => Promise<CalibrationSnapshot | null>;
      saveLastCalibration?: (data: CalibrationSnapshot) => boolean;
      connectHardware?: (config: TcpConnectionConfig) => Promise<{ ok: boolean; connected: boolean; message?: string }>;
      disconnectHardware?: () => Promise<{ ok: boolean; connected: boolean; message?: string }>;
      sendHardware?: (payload: string) => Promise<{ ok: boolean; message?: string }>;
      onHardwareLog?: (callback: (log: { direction: 'TX' | 'RX' | 'SYS'; payload: string; status: 'OK' | 'ERR' | 'INFO' }) => void) => () => void;
      onHardwareState?: (callback: (state: { connected: boolean }) => void) => () => void;
    };
  }
}

interface CalibrationSnapshot {
  rows: AtgTestRow[];
  exportSettings: ExportSettings;
  lastCalibrationTimestamp: string;
}

const MIN_TEST_METER = 5;
const MAX_TEST_METER = 17;

// Generate default rows for test points 5m through 17m
const createInitialRows = (): AtgTestRow[] => {
  return Array.from({ length: MAX_TEST_METER - MIN_TEST_METER + 1 }, (_, i) => {
    const meter = MIN_TEST_METER + i;
    const nominalMm = meter * 1000;
    return {
      meter,
      selected: true,
      algNaik: '0',
      algTurun: '0',
      algDiskSebelum: '0',
      algDiskSetelah: '0',
      stdNaik: '0',
      stdTurun: '0',
    };
  });
};

export default function App() {
  // Active Test Mode
  const [activeTestMode, setActiveTestMode] = useState<TestType>('KALIBRASI');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // 17 Data Rows
  const [rows, setRows] = useState<AtgTestRow[]>(createInitialRows);
  const [isEditAlgEnabled, setIsEditAlgEnabled] = useState(false);
  const [isEditStdEnabled, setIsEditStdEnabled] = useState(false);

  // Timestamp
  const [lastCalibrationTimestamp, setLastCalibrationTimestamp] = useState('2026-08-27 09:30:00 WIB');
  const saveCalibrationSnapshot = () => {
    window.desktopApp?.saveLastCalibration?.({
      rows,
      exportSettings,
      lastCalibrationTimestamp
    });
  };

  useEffect(() => {
    let cancelled = false;
    window.desktopApp?.loadLastCalibration?.().then?.((snapshot) => {
      if (cancelled || !snapshot) return;
      setRows(snapshot.rows);
      setExportSettings(snapshot.exportSettings);
      setLastCalibrationTimestamp(snapshot.lastCalibrationTimestamp);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const saveBeforeClose = () => saveCalibrationSnapshot();
    window.addEventListener('beforeunload', saveBeforeClose);
    return () => window.removeEventListener('beforeunload', saveBeforeClose);
  });

  // TCP Config
  const [tcpConfig, setTcpConfig] = useState<TcpConnectionConfig>({
    host: '192.168.1.103',
    port: 8888,
    timeoutMs: 3000,
    autoReconnect: true
  });

  // Motor Status
  const [motorStatus, setMotorStatus] = useState<MotorStatus>({
    connected: false,
    currentPositionMeter: 0.000,
    targetPositionMeter: 0.000,
    isMoving: false,
    direction: 'IDLE',
    speedMmPerSec: 50,
    homeSensorActive: false,
    zeroSensorActive: false,
    limitMaxSensorActive: false,
    stepperTempCelsius: 38.5
  });

  // Export Settings
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    operatorName: 'Budi Santoso, S.T.',
    nomorSeriAtg: 'ATG-HOR-2026-889',
    merkModelAtg: 'ATG Horizontal Metrology Grade 17M',
    instansiPemilik: 'Balai Standardisasi Metrologi Legal',
    lokasiPengujian: 'Laboratorium Uji Panjang ATG',
    batasKesalahanIzinMm: 1.0,
    suhuRuangan: 20.2,
    kelembapan: 58,
    formatEkspor: 'CSV',
    fileNamePrefix: 'Hasil_Uji_ATG_Horizontal'
  });

  // TCP Log Traffic
  const [tcpLogs, setTcpLogs] = useState<TcpLogMessage[]>([
    {
      id: '1',
      timestamp: '09:30:00',
      direction: 'SYS',
      payload: 'WSAStartup 2.2 Initialized. Soket TCP siap.',
      status: 'INFO'
    },
    {
      id: '2',
      timestamp: '09:30:01',
      direction: 'TX',
      payload: 'CONNECT 192.168.1.100:8080',
      status: 'OK'
    },
    {
      id: '3',
      timestamp: '09:30:01',
      direction: 'RX',
      payload: 'ACK:CONNECTED;DEV=ATG_STEPPER_CTRL_V3;POS=0.000;STAT=READY',
      status: 'OK'
    }
  ]);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isTcpLogOpen, setIsTcpLogOpen] = useState(false);

  // Popup peringatan saat operator mencoba menjalankan perintah hardware
  // padahal aplikasi belum terhubung ke jaringan hardware.
  const [connRequired, setConnRequired] = useState<{ action: string } | null>(null);

  // Sequence state
  const [isRunningSequence, setIsRunningSequence] = useState(false);
  const [measurementPrompt, setMeasurementPrompt] = useState<
    { meter: number; direction: 'UP' | 'DOWN' } | null
  >(null);
  const sequenceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sequenceDirectionRef = useRef<'UP' | 'DOWN' | null>(null);
  const sequenceStepRef = useRef<number | null>(null);
  const completedSequenceStepRef = useRef<number | null>(null);
  const sequenceAdvanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const waitingForInputRef = useRef(false);
  const skipAutoReconnectRef = useRef(false);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const sendHardwarePacket = async (packet: string) => {
    if (!window.desktopApp?.sendHardware) return false;
    const result = await window.desktopApp.sendHardware(packet);
    return result.ok;
  };

  // Helper to add TCP Log
  const addTcpLog = (direction: 'TX' | 'RX' | 'SYS', payload: string, status: 'OK' | 'ERR' | 'INFO' = 'OK') => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    setTcpLogs((prev) => [
      {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: timeStr,
        direction,
        payload,
        status
      },
      ...prev.slice(0, 99)
    ]);
  };

  // Kunci aksi perintah hardware: hanya boleh dijalankan saat aplikasi sudah
  // terhubung ke jaringan hardware. Jika belum terhubung, tampilkan popup yang
  // memberi tahu operator untuk memeriksa koneksi.
  const requireHardwareConnection = (action: string): boolean => {
    if (motorStatus.connected) return true;
    addTcpLog('SYS', `Perintah diblokir — ${action}: belum terhubung ke jaringan hardware. Periksa koneksi.`, 'ERR');
    setConnRequired({ action });
    return false;
  };

  useEffect(() => {
    const unsubscribe = window.desktopApp?.onHardwareLog?.((entry) => {
      addTcpLog(entry.direction, entry.payload, entry.status);
    });
    return unsubscribe;
  }, []);

  // Auto-deteksi koneksi putus dari main process (firmware berhenti membalas
  // 'online') → hentikan motor, tutup modal, dan reset status.
  const connectedRef = useRef(motorStatus.connected);
  connectedRef.current = motorStatus.connected;
  useEffect(() => {
    const unsubscribe = window.desktopApp?.onHardwareState?.((state) => {
      if (state.connected === false && connectedRef.current) {
        connectedRef.current = false;
        if (sequenceAdvanceTimeoutRef.current !== null) {
          clearTimeout(sequenceAdvanceTimeoutRef.current);
          sequenceAdvanceTimeoutRef.current = null;
        }
        sequenceDirectionRef.current = null;
        sequenceStepRef.current = null;
        completedSequenceStepRef.current = null;
        waitingForInputRef.current = false;
        setMeasurementPrompt(null);
        setIsRunningSequence(false);
        setMotorStatus((prev) => ({
          ...prev,
          connected: false,
          isMoving: false,
          direction: 'IDLE',
          targetPositionMeter: prev.currentPositionMeter
        }));
        addTcpLog('SYS', 'Koneksi ke firmware terputus. Motor dihentikan.', 'ERR');
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!motorStatus.connected || !motorStatus.isMoving) return;

    const zValue = motorStatus.direction === 'UP' ? 100 : 0;
    const interval = setInterval(() => {
      void sendHardwarePacket(`@J50_50_${zValue}_1?`);
    }, 100);

    return () => clearInterval(interval);
  }, [motorStatus.connected, motorStatus.isMoving, motorStatus.direction]);

  // ===== AUTO-RECONNECT =====
  // Saat koneksi putus (kabel LAN dicabut, perangkat mati, dsb) dan opsi
  // "Auto Reconnect" aktif di PENGATURAN, aplikasi mencoba terhubung ulang
  // otomatis tiap 5 detik — tanpa perlu klik tombol status di header.
  // Jika diputus secara manual lewat tombol, auto-reconnect dijeda.
  useEffect(() => {
    if (motorStatus.connected) {
      if (skipAutoReconnectRef.current) skipAutoReconnectRef.current = false;
      return;
    }
    if (!tcpConfig.autoReconnect) return;
    if (skipAutoReconnectRef.current) return;
    if (!window.desktopApp?.connectHardware) return;

    const timer = setTimeout(async () => {
      try {
        const result = await window.desktopApp?.connectHardware?.(tcpConfig);
        if (result?.ok) {
          connectedRef.current = true;
          setMotorStatus((prev) => ({ ...prev, connected: true }));
          addTcpLog('SYS', `Auto-reconnect: terhubung kembali ke firmware UDP ${tcpConfig.host}:${tcpConfig.port}`, 'OK');
        }
      } catch {
        // gagal → akan dicoba lagi 5 detik kemudian
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [
    motorStatus.connected,
    tcpConfig.autoReconnect,
    tcpConfig.host,
    tcpConfig.port,
    tcpConfig.timeoutMs
  ]);

  // Motor movement simulation effect
  useEffect(() => {
    if (!motorStatus.isMoving) return;

    const interval = setInterval(() => {
      setMotorStatus((prev) => {
        const diff = prev.targetPositionMeter - prev.currentPositionMeter;
        if (Math.abs(diff) < 0.05) {
          // Reached target
          const finalPos = prev.targetPositionMeter;
          addTcpLog('RX', `ACK:POS_REACHED;POS=${finalPos.toFixed(3)}m;LIMIT_HOME=${finalPos >= 16.9 ? '1' : '0'};LIMIT_ZERO=${Math.abs(finalPos - 5.0) < 0.1 ? '1' : '0'}`);
          return {
            ...prev,
            currentPositionMeter: finalPos,
            isMoving: false,
            direction: 'IDLE',
            zeroSensorActive: Math.abs(finalPos - 5.0) < 0.1,
            homeSensorActive: finalPos >= 16.9,
            limitMaxSensorActive: finalPos >= 17.2
          };
        }

        const step = diff > 0 ? 0.075 : -0.075;
        const nextPos = prev.currentPositionMeter + step;
        const reachesTarget = diff > 0 ? nextPos >= prev.targetPositionMeter : nextPos <= prev.targetPositionMeter;
        const newPos = reachesTarget ? prev.targetPositionMeter : nextPos;
        return {
          ...prev,
          currentPositionMeter: newPos,
          zeroSensorActive: Math.abs(newPos - 5.0) < 0.2,
          homeSensorActive: newPos >= 16.8
        };
      });
    }, 250);

    return () => clearInterval(interval);
  }, [motorStatus.isMoving]);

  const requestSequenceMeasurement = (meter: number, direction: 'UP' | 'DOWN') => {
    setMeasurementPrompt({ meter, direction });
  };

  const applySequenceMeasurement = (meter: number, direction: 'UP' | 'DOWN', rawValue: number) => {
    const value = rawValue;
    const isCalibration = activeTestMode === 'KALIBRASI';
    const fields = isCalibration
      ? direction === 'UP'
        ? { target: 'stdNaik' as const, display: 'algDiskSebelum' as const }
        : { target: 'stdTurun' as const, display: 'algDiskSetelah' as const }
      : direction === 'UP'
        ? { target: 'algNaik' as const }
        : { target: 'algTurun' as const };

    setRows((prev) => prev.map((row) => (
      row.meter === meter
        ? {
            ...row,
            [fields.target]: value.toFixed(3),
            ...(isCalibration && fields.display ? { [fields.display]: value.toFixed(3) } : {})
          }
        : row
    )));
  };

  // Advance the sequence to the next checked point. Only called after the
  // measurement modal has been answered (saved or cancelled), so the motor
  // stays stationary while the operator enters the value.
  const advanceSequence = (direction: 'UP' | 'DOWN') => {
    const currentMeter = sequenceStepRef.current;
    if (currentMeter === null) return;

    waitingForInputRef.current = false;

    const checkedMeters = rowsRef.current
      .filter((r) => r.selected)
      .map((r) => r.meter)
      .sort((a, b) => a - b);

    let nextMeter: number | null = null;
    if (direction === 'UP') {
      nextMeter = checkedMeters.find((m) => m > currentMeter) ?? null;
    } else {
      for (let i = checkedMeters.length - 1; i >= 0; i--) {
        if (checkedMeters[i] < currentMeter) {
          nextMeter = checkedMeters[i];
          break;
        }
      }
    }

    if (nextMeter === null) {
      sequenceDirectionRef.current = null;
      sequenceStepRef.current = null;
      setIsRunningSequence(false);
      addTcpLog('RX', `ACK:SEQ_COMPLETE_${direction};TOTAL_POINTS=${checkedMeters.length};STATUS=SUCCESS`);
      return;
    }

    sequenceStepRef.current = nextMeter;
    completedSequenceStepRef.current = null;
    handleMoveToMeter(nextMeter);
  };

  // Continue the sequence only after the motor has stopped at the current point.
  useEffect(() => {
    if (motorStatus.isMoving || !isRunningSequence || waitingForInputRef.current) return;

    const direction = sequenceDirectionRef.current;
    const meter = sequenceStepRef.current;
    if (!direction || meter === null || completedSequenceStepRef.current === meter) return;

    completedSequenceStepRef.current = meter;
    sequenceAdvanceTimeoutRef.current = setTimeout(() => {
      if (rowsRef.current.some((row) => row.meter === meter && row.selected)) {
        // Stop the sequence and open the input modal.
        // The motor stays at this point until the operator saves the value.
        waitingForInputRef.current = true;
        requestSequenceMeasurement(meter, direction);
        return;
      }
      advanceSequence(direction);
    }, 0);

    return () => {
      if (sequenceAdvanceTimeoutRef.current) {
        clearTimeout(sequenceAdvanceTimeoutRef.current);
        sequenceAdvanceTimeoutRef.current = null;
      }
    };
  }, [motorStatus.isMoving, isRunningSequence]);

  // Handler: Move motor to specific meter
  const handleMoveToMeter = (meter: number) => {
    if (!requireHardwareConnection(`Gerakkan motor ke ${meter} m`)) return;
    addTcpLog('TX', `CMD:MOVE_POS:${meter.toFixed(3)}\\r\\n`);
    if (motorStatus.connected) {
      void sendHardwarePacket(`@J50_50_${meter > motorStatus.currentPositionMeter ? 100 : 0}_1?`);
    }
    setMotorStatus((prev) => ({
      ...prev,
      targetPositionMeter: meter,
      isMoving: true,
      direction: meter > prev.currentPositionMeter ? 'UP' : 'DOWN'
    }));
  };

  // Handler: ZERO (Area 5m)
  const handleZero5M = () => {
    if (!requireHardwareConnection('Gerakkan motor ke ZERO (5 m)')) return;
    addTcpLog('TX', `CMD:GOTO_ZERO_5M\\r\\n`);
    setMotorStatus((prev) => ({
      ...prev,
      targetPositionMeter: 5.000,
      isMoving: true,
      direction: 5.000 > prev.currentPositionMeter ? 'UP' : 'DOWN'
    }));
    updateTimestamp();
  };

  // Handler: HOME (Area 17m)
  const handleHome17M = () => {
    if (!requireHardwareConnection('Gerakkan motor ke HOME (17 m)')) return;
    addTcpLog('TX', `CMD:GOTO_HOME_17M\\r\\n`);
    setMotorStatus((prev) => ({
      ...prev,
      targetPositionMeter: 17.000,
      isMoving: true,
      direction: 17.000 > prev.currentPositionMeter ? 'UP' : 'DOWN'
    }));
    updateTimestamp();
  };

  // Handler: Pengujian Naik — mulai dari titik checked terendah, berhenti di tertinggi
  const handlePengujianNaik = () => {
    if (isRunningSequence) return;
    if (!requireHardwareConnection('Pengujian Naik')) return;

    const checkedMeters = rowsRef.current
      .filter((r) => r.selected)
      .map((r) => r.meter)
      .sort((a, b) => a - b);
    if (checkedMeters.length === 0) return;

    const startMeter = checkedMeters[0];
    const endMeter = checkedMeters[checkedMeters.length - 1];
    setIsRunningSequence(true);
    addTcpLog('TX', `CMD:SEQ_START_UP:${startMeter}TO${endMeter}\\r\\n`);

    sequenceDirectionRef.current = 'UP';
    sequenceStepRef.current = startMeter;
    completedSequenceStepRef.current = null;
    handleMoveToMeter(startMeter);
  };

  // Handler: Pengujian Turun — mulai dari titik checked tertinggi, berhenti di terendah
  const handlePengujianTurun = () => {
    if (isRunningSequence) return;
    if (!requireHardwareConnection('Pengujian Turun')) return;

    const checkedMeters = rowsRef.current
      .filter((r) => r.selected)
      .map((r) => r.meter)
      .sort((a, b) => b - a);
    if (checkedMeters.length === 0) return;

    const startMeter = checkedMeters[0];
    const endMeter = checkedMeters[checkedMeters.length - 1];
    setIsRunningSequence(true);
    addTcpLog('TX', `CMD:SEQ_START_DOWN:${startMeter}TO${endMeter}\\r\\n`);

    sequenceDirectionRef.current = 'DOWN';
    sequenceStepRef.current = startMeter;
    completedSequenceStepRef.current = null;
    handleMoveToMeter(startMeter);
  };

  // Inti Emergency Stop (tanpa pemeriksaan koneksi). Dipakai oleh E-STOP yang
  // sudah terhubung dan oleh rutinitas penutupan aplikasi.
  const stopMotorInternal = () => {
    if (sequenceIntervalRef.current) clearInterval(sequenceIntervalRef.current);
    if (sequenceAdvanceTimeoutRef.current) clearTimeout(sequenceAdvanceTimeoutRef.current);
    sequenceDirectionRef.current = null;
    sequenceStepRef.current = null;
    completedSequenceStepRef.current = null;
    waitingForInputRef.current = false;
    setMeasurementPrompt(null);
    setIsRunningSequence(false);
    addTcpLog('TX', 'CMD:EMERGENCY_STOP\\r\\n', 'ERR');
    if (motorStatus.connected) {
      void sendHardwarePacket('@J50_50_50_1?');
    }
    setMotorStatus((prev) => ({
      ...prev,
      isMoving: false,
      direction: 'IDLE',
      targetPositionMeter: prev.currentPositionMeter
    }));
    addTcpLog('RX', 'ACK:EMERGENCY_STOP_ACTIVE;MOTOR_HALTED', 'ERR');
  };

  // Handler: Emergency Stop
  const handleEmergencyStop = () => {
    if (!requireHardwareConnection('Emergency Stop (E-STOP)')) return;
    stopMotorInternal();
  };

  // Handler: Update Row Data
  const handleRowChange = (index: number, updated: Partial<AtgTestRow>) => {
    setRows((prev) => {
      if (
        activeTestMode === 'TERA_ULANG' &&
        updated.selected === true &&
        prev.filter((row) => row.selected).length >= 5
      ) {
        return prev;
      }
      const next = [...prev];
      next[index] = { ...next[index], ...updated };
      return next;
    });
  };

  // Handler: Toggle All Checkboxes
  const handleToggleAll = (checked: boolean) => {
    setRows((prev) => {
      if (activeTestMode === 'TERA_ULANG') {
        return prev.map((row, index) => ({ ...row, selected: checked && index < 5 }));
      }
      return prev.map((r) => ({ ...r, selected: checked }));
    });
  };

  // Handler: Timestamp
  const updateTimestamp = () => {
    const now = new Date();
    const str = now.toISOString().replace('T', ' ').substring(0, 19) + ' WIB';
    setLastCalibrationTimestamp(str);
  };

  // Handler: Toggle TCP Connection
  const handleToggleTcp = async () => {
    if (!window.desktopApp?.connectHardware || !window.desktopApp?.disconnectHardware) {
      addTcpLog('SYS', 'Bridge hardware hanya tersedia di desktop app.', 'ERR');
      return;
    }

    if (motorStatus.connected) {
      skipAutoReconnectRef.current = true;
      connectedRef.current = false;
      setMotorStatus((prev) => ({ ...prev, connected: false }));
      await window.desktopApp.disconnectHardware();
      addTcpLog('SYS', 'Koneksi ke firmware diputus.', 'INFO');
      return;
    }

    const result = await window.desktopApp.connectHardware(tcpConfig);
    if (result.ok) {
      setMotorStatus((prev) => ({ ...prev, connected: true }));
      addTcpLog('SYS', `Terhubung ke firmware UDP ${tcpConfig.host}:${tcpConfig.port}`, 'OK');
    } else {
      addTcpLog('SYS', result.message ?? 'Gagal terhubung ke firmware.', 'ERR');
    }
  };

  // Handler: Select Menu Kiri
  const handleSelectTestMode = (mode: TestType) => {
    setActiveTestMode(mode);
    if (mode === 'TERA_ULANG') {
      setRows((prev) => prev.map((row) => ({ ...row, selected: false })));
    }
    addTcpLog('TX', `CMD:SET_MODE:${mode}\\r\\n`);
    updateTimestamp();
  };

  // Handler: Presets
  const handleFillPresetData = (type: TestType) => {
    setRows((prev) =>
      prev.map((r) => {
        const nominal = r.meter * 1000;
        if (type === 'EVALUASI_AKURASI') {
          // Add realistic micrometer/millimeter deviation
          const noiseNaik = Math.sin(r.meter) * 0.45;
          const noiseTurun = Math.cos(r.meter) * 0.35;
          return {
            ...r,
            algNaik: (nominal + noiseNaik).toFixed(0),
            algTurun: (nominal + noiseTurun).toFixed(0),
            stdNaik: '0',
            stdTurun: '0',
          };
        } else {
          return {
            ...r,
            algNaik: nominal.toFixed(0),
            algTurun: nominal.toFixed(0),
            stdNaik: '0',
            stdTurun: '0',
          };
        }
      })
    );
    addTcpLog('SYS', `Data preset untuk ${type} berhasil dimuat ke tabel.`);
  };

  // Handler: Export CSV File
  const handleExportCsv = () => {
    let csv = `LAPORAN HASIL PENGUJIAN OTOMASI ATG HORIZONTAL (1 - 17 METER)\n`;
    csv += `Tanggal Pengujian,${lastCalibrationTimestamp}\n`;
    csv += `Alat Uji (DUT),${exportSettings.merkModelAtg}\n`;
    csv += `Nomor Seri,${exportSettings.nomorSeriAtg}\n`;
    csv += `Operator Penguji,${exportSettings.operatorName}\n`;
    csv += `Instansi Pemilik,${exportSettings.instansiPemilik}\n`;
    csv += `Batas Kesalahan Izin (BKD),±${exportSettings.batasKesalahanIzinMm} mm\n\n`;

    csv += `No,Titik Uji (m),Status,ALG Naik (mm),ALG Turun (mm),Std Naik (mm),Std Turun (mm),Deviasi (mm),Hasil BKD\n`;

    rows.forEach((r, idx) => {
      const naik = parseFloat(activeTestMode === 'KALIBRASI' ? r.stdNaik : r.algNaik) || 0;
      const turun = parseFloat(activeTestMode === 'KALIBRASI' ? r.stdTurun : r.algTurun) || 0;
      const deviasi = Math.abs(naik - turun);
      const isPass = deviasi <= exportSettings.batasKesalahanIzinMm;

      csv += `${idx + 1},${r.meter},${r.selected ? 'Diuji' : 'Dilewati'},${r.algNaik},${r.algTurun},${r.stdNaik},${r.stdTurun},${deviasi.toFixed(3)},${isPass ? 'LULUS' : 'PERIKSA'}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exportSettings.fileNamePrefix}_${exportSettings.nomorSeriAtg}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addTcpLog('SYS', `File CSV '${link.download}' berhasil diekspor.`);
  };

  // Handler: Close App
  const handleCloseApp = () => {
    if (confirm("Apakah Anda ingin menutup aplikasi dan menghentikan seluruh pergerakan motor stepper?")) {
      saveCalibrationSnapshot();
      stopMotorInternal();
      addTcpLog('SYS', 'Aplikasi ditutup.');
      window.desktopApp?.close();
    }
  };

  return (
    <DesktopWindowFrame
      theme={theme}
      onToggleTheme={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
      motorStatus={motorStatus}
      tcpConfig={tcpConfig}
      onOpenSettings={() => setIsSettingsOpen(true)}
      onOpenPreview={() => setIsPreviewOpen(true)}
      onOpenTcpLog={() => setIsTcpLogOpen(true)}
      onToggleTcp={handleToggleTcp}
      onEmergencyStop={handleEmergencyStop}
      onZero5M={handleZero5M}
      onHome17M={handleHome17M}
      onPengujianNaik={handlePengujianNaik}
      onPengujianTurun={handlePengujianTurun}
      onCloseApp={handleCloseApp}
    >
      {/* Header Bar */}
      <Header
        motorStatus={motorStatus}
        tcpConfig={tcpConfig}
        onToggleTcp={handleToggleTcp}
        onEmergencyStop={handleEmergencyStop}
        onOpenTcpLog={() => setIsTcpLogOpen(true)}
        activeTestMode={activeTestMode}
      />

      <>
          {/* Motor Linear Track Visualizer (0 - 17m) */}
          <MotorTrackVisualizer
            motorStatus={motorStatus}
            onMoveToMeter={handleMoveToMeter}
          />

          {/* Main Work Area: Left Menu + Center/Right 5-17m Table */}
          <main className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
            {/* 1. Bagian Kiri: 4 Tombol Menu Pengujian */}
            <TestingMenuLeft
              activeTestMode={activeTestMode}
              onSelectTestMode={handleSelectTestMode}
              isRunningSequence={isRunningSequence}
              onFillPresetData={handleFillPresetData}
            />

            {/* 2. Bagian Tengah & Kanan: Tabel Bersusun 5-17 Meter */}
            <TestingTable
              rows={rows}
              onRowChange={handleRowChange}
              onToggleAll={handleToggleAll}
              isEditAlgEnabled={isEditAlgEnabled}
              isEditStdEnabled={isEditStdEnabled}
              activeTestMode={activeTestMode}
              currentMotorPos={motorStatus.currentPositionMeter}
              batasKesalahanMm={exportSettings.batasKesalahanIzinMm}
            />
          </main>

          {/* 3. Bagian Bawah: Toolbar Kontrol Motor & Manajemen Data */}
          <BottomToolbar
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenPreview={() => setIsPreviewOpen(true)}
            onCloseApp={handleCloseApp}
            onZero5M={handleZero5M}
            onHome17M={handleHome17M}
            onPengujianNaik={handlePengujianNaik}
            onPengujianTurun={handlePengujianTurun}
            lastCalibrationTimestamp={lastCalibrationTimestamp}
            isEditAlg={isEditAlgEnabled}
            onToggleEditAlg={() => setIsEditAlgEnabled((enabled) => !enabled)}
            isEditStd={isEditStdEnabled}
            onToggleEditStd={() => setIsEditStdEnabled((enabled) => !enabled)}
            isRunningSequence={isRunningSequence}
          />
      </>

      {/* Modals & Drawers */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        exportSettings={exportSettings}
        onSaveExportSettings={setExportSettings}
        tcpConfig={tcpConfig}
        onSaveTcpConfig={setTcpConfig}
      />

      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        rows={rows}
        activeTestMode={activeTestMode}
        exportSettings={exportSettings}
        lastCalibrationTimestamp={lastCalibrationTimestamp}
        onExportCsv={handleExportCsv}
      />


      <MeasurementModal
        meter={measurementPrompt?.meter ?? MIN_TEST_METER}
        direction={measurementPrompt?.direction ?? 'UP'}
        isCalibration={activeTestMode === 'KALIBRASI'}
        isOpen={measurementPrompt !== null}
        onClose={() => {
          // Operator menekan Batal/Esc: lewati titik ini dan lanjut ke titik berikutnya
          setMeasurementPrompt(null);
          waitingForInputRef.current = false;
          const dir = sequenceDirectionRef.current;
          if (dir) advanceSequence(dir);
        }}
        onConfirm={(value) => {
          if (measurementPrompt) {
            applySequenceMeasurement(measurementPrompt.meter, measurementPrompt.direction, value);
          }
          setMeasurementPrompt(null);
          waitingForInputRef.current = false;
          const dir = sequenceDirectionRef.current;
          if (dir) advanceSequence(dir);
        }}
      />

      <TcpLogDrawer
        isOpen={isTcpLogOpen}
        onClose={() => setIsTcpLogOpen(false)}
        logs={tcpLogs}
        onClearLogs={() => setTcpLogs([])}
        onSendRawCommand={(cmd) => {
          if (!requireHardwareConnection('Kirim perintah terminal')) return;
          addTcpLog('TX', `${cmd}\\r\\n`);
          void sendHardwarePacket(cmd.trim()).then((ok) => {
            if (!ok) addTcpLog('SYS', 'Perintah tidak terkirim: tidak terhubung ke firmware.', 'ERR');
          });
        }}
        isConnected={motorStatus.connected}
      />

      <HardwareOfflineModal
        isOpen={connRequired !== null}
        actionLabel={connRequired?.action ?? ''}
        host={tcpConfig.host}
        port={tcpConfig.port}
        onClose={() => setConnRequired(null)}
        onTryConnect={() => {
          setConnRequired(null);
          void handleToggleTcp();
        }}
      />
    </DesktopWindowFrame>
  );
}
