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
      payload: 'Soket UDP siap. Menunggu koneksi firmware Arduino (192.168.1.103:8888).',
      status: 'INFO'
    },
    {
      id: '2',
      timestamp: '09:30:01',
      direction: 'TX',
      payload: 'CONNECT 192.168.1.103:8888 (UDP)',
      status: 'OK'
    },
    {
      id: '3',
      timestamp: '09:30:01',
      direction: 'RX',
      payload: 'OK (firmware Basic_Test_UDP terhubung)',
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

  // Pengunci kalibrasi bertingkat: HOME (HOME_DONE, motor di ujung >17 m)
  // lalu ZERO (ZERO_DONE, motor di ujung <5 m, posisi 0). Pengujian naik/turun
  // & pergerakan posisi (@<mm>) baru boleh dijalankan setelah ZERO_DONE.
  const [isHomed, setIsHomed] = useState(false);
  const [isZeroed, setIsZeroed] = useState(false);
  const [calibrationRequired, setCalibrationRequired] = useState<{ action: string } | null>(null);

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
  // Sekuens MENUNGGU POS_DONE asli dari firmware sebelum lanjut ke titik
  // berikutnya / popup. pendingSeqMoveRef = pergerakan posisi sekuens belum
  // dikonfirmasi tiba secara fisik.
  const pendingSeqMoveRef = useRef(false);
  const isRunningSequenceRef = useRef(isRunningSequence);
  isRunningSequenceRef.current = isRunningSequence;
  const onSequenceArrivedRef = useRef<(() => void) | null>(null);

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

  // Kunci kalibrasi bertingkat (sesuai alur operator):
  //   Tahap 1 — HOME: tombol HOME (17m) mengirim '+' → motor ke arah 17 m sampai
  //            limit A1 (ujung >17 m) → HOME_DONE. Wajib pertama kali.
  //   Tahap 2 — ZERO: tombol ZERO (0m) mengirim '-' → motor mundur sampai limit
  //            A1 (ujung <5 m, posisi 0) → ZERO_DONE.
  //   Setelah ZERO_DONE barulah pengujian naik/turun (@<mm> via A0) boleh.
  const requireHome = (action: string): boolean => {
    if (isHomed) return true;
    addTcpLog('SYS', `Perintah diblokir — ${action}: motor belum di-HOME. Klik HOME (17m) dulu.`, 'ERR');
    setCalibrationRequired({
      action: `${action}: motor belum di-HOME. Klik tombol HOME (17m) dulu agar motor mencari limit A1 di ujung 17 m.`
    });
    return false;
  };

  const requireZero = (action: string): boolean => {
    if (isZeroed) return true;
    if (!isHomed) {
      addTcpLog('SYS', `Perintah diblokir — ${action}: motor belum di-HOME (17m).`, 'ERR');
      setCalibrationRequired({
        action: `${action}: motor belum di-HOME. Klik tombol HOME (17m) dulu.`
      });
      return false;
    }
    addTcpLog('SYS', `Perintah diblokir — ${action}: motor belum di-ZERO. Klik ZERO (0m) dulu.`, 'ERR');
    setCalibrationRequired({
      action: `${action}: motor sudah di-HOME tapi belum di-ZERO. Klik tombol ZERO (0m) dulu agar motor mencari limit A1 di ujung sebelum 5 m (posisi 0).`
    });
    return false;
  };

  useEffect(() => {
    const unsubscribe = window.desktopApp?.onHardwareLog?.((entry) => {
      addTcpLog(entry.direction, entry.payload, entry.status);
      // Respon firmware Basic_Test_UDP: "..._DONE" menandakan gerakan selesai →
      // sinkronkan posisi lokal dan hentikan status bergerak. Token "OK" hanya
      // balasan ping heartbeat — TIDAK menghentikan status gerak.
      if (entry.direction !== 'RX') return;
      const p = String(entry.payload).trim();
      if (p.startsWith('POS_DONE:')) {
        const mm = Number(p.substring(9));
        const posMeter = Number.isNaN(mm) ? null : mm / 1000;
        if (posMeter !== null) {
          setMotorStatus((prev) => ({
            ...prev,
            currentPositionMeter: posMeter,
            targetPositionMeter: posMeter,
            isMoving: false,
            direction: 'IDLE'
          }));
          // Sekuens: motor sudah berhenti fisik di titik (A0/posisi) → lanjut.
          if (pendingSeqMoveRef.current && isRunningSequenceRef.current) {
            pendingSeqMoveRef.current = false;
            onSequenceArrivedRef.current?.();
          }
        }
      } else if (p === 'HOME_DONE') {
        // Kalibrasi HOME selesai: motor berhenti di limit A1 ujung >17 m.
        // (Selanjutnya operator harus ZERO (0m) sebelum pengujian.)
        setIsHomed(true);
        setMotorStatus((prev) => ({
          ...prev,
          currentPositionMeter: 17.0,
          targetPositionMeter: 17.0,
          isMoving: false,
          direction: 'IDLE',
          homeSensorActive: true
        }));
      } else if (p === 'ZERO_DONE') {
        // Kalibrasi ZERO selesai: motor berhenti di limit A1 ujung <5 m (posisi 0).
        // Setelah ini pengujian naik/turun (@<mm> via A0) boleh dijalankan.
        setIsHomed(true);
        setIsZeroed(true);
        setMotorStatus((prev) => ({
          ...prev,
          currentPositionMeter: 0,
          targetPositionMeter: 0,
          isMoving: false,
          direction: 'IDLE',
          zeroSensorActive: true
        }));
      } else if (p === 'NOT_HOMED') {
        // Firmware menolak karena motor belum di-HOME (klik HOME (17m) dulu).
        setIsHomed(false);
        setIsZeroed(false);
        setMotorStatus((prev) => ({ ...prev, isMoving: false, direction: 'IDLE' }));
        setCalibrationRequired({ action: 'Firmware menolak: motor belum di-HOME. Klik HOME (17m) dulu.' });
      } else if (p === 'NOT_ZEROED') {
        // Firmware menolak karena sudah HOME tapi belum ZERO (klik ZERO (0m) dulu).
        setMotorStatus((prev) => ({ ...prev, isMoving: false, direction: 'IDLE' }));
        setCalibrationRequired({ action: 'Firmware menolak: motor sudah di-HOME tapi belum di-ZERO. Klik ZERO (0m) dulu.' });
      } else if (p === 'UKUR_DONE') {
        // Stroke ukur selesai.
        setMotorStatus((prev) => ({ ...prev, isMoving: false, direction: 'IDLE' }));
      } else if (p === 'ACK') {
        // Mode ukur mulai: motor sedang melakukan stroke ukur.
        setMotorStatus((prev) => ({ ...prev, isMoving: true }));
      }
    });
    return unsubscribe;
  }, []);

  // Auto-deteksi koneksi putus dari main process (ping 'y' tidak lagi dibalas)
  // → hentikan motor, tutup modal, dan reset status.
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
        pendingSeqMoveRef.current = false;
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

  // Dipanggil saat motor BENAR-BENAR berhenti di titik (firmware POS_DONE:<mm>).
  // Buka modal input nilai, atau lanjut ke titik berikutnya yang dicentang.
  // (Sekuens tidak lagi bergantung pada simulasi animasi lokal — popup hanya
  // muncul setelah kedatangan fisik terkonfirmasi lewat POS_DONE.)
  const onSequenceArrived = () => {
    const direction = sequenceDirectionRef.current;
    const meter = sequenceStepRef.current;
    if (!direction || meter === null || completedSequenceStepRef.current === meter) return;

    completedSequenceStepRef.current = meter;
    sequenceAdvanceTimeoutRef.current = setTimeout(() => {
      if (rowsRef.current.some((row) => row.meter === meter && row.selected)) {
        // Motor berhenti di titik tercentang → buka modal input nilai.
        waitingForInputRef.current = true;
        requestSequenceMeasurement(meter, direction);
        return;
      }
      advanceSequence(direction);
    }, 0);
  };
  onSequenceArrivedRef.current = onSequenceArrived;

  // Handler: Move motor to specific meter (kirim posisi absolut dalam mm)
  const handleMoveToMeter = (meter: number) => {
    if (!requireHardwareConnection(`Gerakkan motor ke ${meter} m`)) return;
    if (!requireZero(`Gerakkan motor ke ${meter} m`)) return;
    const targetMm = Math.round(meter * 1000);
    addTcpLog('TX', `@${targetMm} (pindah ke posisi ${meter.toFixed(3)} m)`);
    if (motorStatus.connected) {
      void sendHardwarePacket(`@${targetMm}`);
    }
    // Saat sedang sekuens: motor belum dianggap tiba sampai firmware
    // membalas POS_DONE:<mm> (berhenti fisik via sensor A0 / posisi).
    // Dipakai sequenceDirectionRef (bukan state isRunningSequence) supaya
    // pergerakan pertama sekuens ikut terdeteksi sebelum re-render.
    if (sequenceDirectionRef.current) pendingSeqMoveRef.current = true;
    setMotorStatus((prev) => ({
      ...prev,
      targetPositionMeter: meter,
      isMoving: true,
      direction: meter > prev.currentPositionMeter ? 'UP' : 'DOWN'
    }));
  };

  // Handler: ZERO — kalibrasi ke limit A1 di ujung sebelum 5 m: perintah '-'
  // firmware (motor mundur sampai A1, posisi -> 0, respons ZERO_DONE).
  // Syarat: HOME_DONE dulu (kalibrasi bertingkat).
  const handleZero = () => {
    if (!requireHardwareConnection('Kalibrasi ZERO (cari limit A1)')) return;
    if (!requireHome('Kalibrasi ZERO (0m)')) return;
    addTcpLog('TX', '- (ZERO - kalibrasi: motor mundur sampai limit A1 di ujung sebelum 5 m, posisi -> 0)');
    if (motorStatus.connected) {
      void sendHardwarePacket('-');
    }
    setMotorStatus((prev) => ({
      ...prev,
      targetPositionMeter: 0,
      isMoving: true,
      direction: 0 > prev.currentPositionMeter ? 'UP' : 'DOWN'
    }));
    updateTimestamp();
  };

  // Handler: HOME — kalibrasi awal: perintah '+' firmware (motor ke arah 17 m
  // sampai limit A1 di ujung setelah 17 m, respons HOME_DONE). Wajib pertama
  // kali saat program baru dinyalakan; SYARAT sebelum ZERO & pengujian naik/turun.
  const handleHome = () => {
    if (!requireHardwareConnection('Kalibrasi HOME (cari limit A1)')) return;
    addTcpLog('TX', '+ (HOME - kalibrasi: motor ke arah 17 m sampai limit A1 di ujung setelah 17 m)');
    if (motorStatus.connected) {
      void sendHardwarePacket('+');
    }
    setMotorStatus((prev) => ({
      ...prev,
      targetPositionMeter: 17.0,
      isMoving: true,
      direction: 17.0 > prev.currentPositionMeter ? 'UP' : 'DOWN'
    }));
    updateTimestamp();
  };

  // Handler: Pengujian Naik — mulai dari titik checked terendah, berhenti di tertinggi
  const handlePengujianNaik = () => {
    if (isRunningSequence) return;
    if (!requireHardwareConnection('Pengujian Naik')) return;
    if (!requireZero('Pengujian Naik')) return;

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
    if (!requireZero('Pengujian Turun')) return;

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
    pendingSeqMoveRef.current = false;
    setMeasurementPrompt(null);
    setIsRunningSequence(false);
    addTcpLog('TX', 's (EMERGENCY STOP)', 'ERR');
    if (motorStatus.connected) {
      void sendHardwarePacket('s');
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
    } else if (mode === 'KALIBRASI') {
      // KALIBRASI wajib menguji SETIAP meter 5-17 m, jadi semua titik otomatis
      // dicentang saat mode ini dipilih. Tanpa ini, sisa centang dari mode
      // sebelumnya (mis. TERA_ULANG yang mengosongkan semua) ikut terbawa dan
      // motor bisa melewati meter tanpa popup pengukuran.
      setRows((prev) => prev.map((row) => ({ ...row, selected: true })));
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
      onZero={handleZero}
      onHome={handleHome}
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
            onZero={handleZero}
            onHome={handleHome}
            onPengujianNaik={handlePengujianNaik}
            onPengujianTurun={handlePengujianTurun}
            lastCalibrationTimestamp={lastCalibrationTimestamp}
            isEditAlg={isEditAlgEnabled}
            onToggleEditAlg={() => setIsEditAlgEnabled((enabled) => !enabled)}
            isEditStd={isEditStdEnabled}
            onToggleEditStd={() => setIsEditStdEnabled((enabled) => !enabled)}
            isRunningSequence={isRunningSequence}
            isHomed={isHomed}
            isZeroed={isZeroed}
            isConnected={motorStatus.connected}
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

      {/* Modal peringatan kalibrasi: pengujian/gerakan posisi diblokir sampai
          operator klik HOME (17m) lalu ZERO (0m), sesuai balasan firmware
          HOME_DONE / ZERO_DONE (atau NOT_HOMED / NOT_ZEROED). */}
      {calibrationRequired && (
        <div
          className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4"
          onClick={() => setCalibrationRequired(null)}
        >
          <div
            id="modal-calibration-required"
            className="bg-[#1b1e2a] border border-amber-600/60 rounded-lg shadow-2xl max-w-md w-full p-5"
          >
            <h3 className="text-amber-300 font-bold text-sm mb-2 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              MOTOR BELUM DIKALIBRASI
            </h3>
            <p className="text-zinc-300 text-sm mb-3">{calibrationRequired.action}</p>
            <p className="text-zinc-400 text-xs mb-4">
              Klik tombol <span className="text-zinc-100 font-semibold">HOME (17m)</span> agar motor
              mencari limit A1 di ujung 17 m, lalu{' '}
              <span className="text-zinc-100 font-semibold">ZERO (0m)</span> di ujung sebelum 5 m —
              syarat wajib sebelum pengujian naik/turun atau pergerakan ke titik meter.
            </p>
            <button
              id="btn-calibration-close"
              onClick={() => setCalibrationRequired(null)}
              className="px-4 py-1.5 rounded bg-amber-500/20 border border-amber-500/60 text-amber-200 text-xs font-semibold hover:bg-amber-500/30"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </DesktopWindowFrame>
  );
}
