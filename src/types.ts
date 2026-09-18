export interface AtgTestRow {
  meter: number; // 1 to 17
  selected: boolean;
  // Pembacaan ALG (Automatic Liquid Gauge)
  algNaik: string;
  algTurun: string;
  algDiskSebelum: string;
  algDiskSetelah: string;
  // Standard readings captured during the upward and downward sequences.
  stdNaik: string;
  stdTurun: string;
}

export type TestType = 
  | 'KALIBRASI' 
  | 'TERA_ULANG' 
  | 'EVALUASI_AKURASI' 
  | 'EVALUASI_DISKRIMINASI';

export interface TcpConnectionConfig {
  host: string;
  port: number;
  timeoutMs: number;
  autoReconnect: boolean;
}

export interface MotorStatus {
  connected: boolean;
  currentPositionMeter: number;
  targetPositionMeter: number;
  isMoving: boolean;
  direction: 'UP' | 'DOWN' | 'IDLE';
  speedMmPerSec: number;
  homeSensorActive: boolean;
  zeroSensorActive: boolean;
  limitMaxSensorActive: boolean;
  stepperTempCelsius: number;
}

export interface ExportSettings {
  operatorName: string;
  nomorSeriAtg: string;
  merkModelAtg: string;
  instansiPemilik: string;
  lokasiPengujian: string;
  batasKesalahanIzinMm: number; // e.g. ±1.0 mm or ±2.0 mm
  suhuRuangan: number;
  kelembapan: number;
  formatEkspor: 'CSV' | 'XLSX_XML';
  fileNamePrefix: string;
}

export interface TcpLogMessage {
  id: string;
  timestamp: string;
  direction: 'TX' | 'RX' | 'SYS';
  payload: string;
  status: 'OK' | 'ERR' | 'INFO';
}
