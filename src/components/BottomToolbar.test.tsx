import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BottomToolbar } from './BottomToolbar';

const toolbarProps = {
  onOpenSettings: () => {},
  onOpenPreview: () => {},
  onCloseApp: () => {},
  onZero: () => {},
  onHome: () => {},
  onPengujianNaik: () => {},
  onPengujianTurun: () => {},
  lastCalibrationTimestamp: '2026-08-27 09:30:00 WIB',
  isEditAlg: false,
  onToggleEditAlg: () => {},
  isEditStd: false,
  onToggleEditStd: () => {},
  isRunningSequence: false,
  isHomed: true,
  isZeroed: true,
  isConnected: true,
};

describe('BottomToolbar', () => {
  it('memuat tombol-tombol utama toolbar', () => {
    render(<BottomToolbar {...toolbarProps} />);
    expect(screen.getByText('PENGATURAN')).toBeTruthy();
    expect(screen.getByText('PREVIEW')).toBeTruthy();
    expect(screen.getByText('EDIT NAIK/TURUN')).toBeTruthy();
    expect(screen.getByText('EDIT STD')).toBeTruthy();
    expect(screen.getByText('ZERO (0m)')).toBeTruthy();
    expect(screen.getByText('HOME (17m)')).toBeTruthy();
    expect(screen.getByText('PENGUJIAN NAIK')).toBeTruthy();
    expect(screen.getByText('PENGUJIAN TURUN')).toBeTruthy();
    expect(screen.getByText('CLOSE')).toBeTruthy();
  });

  it('menonaktifkan ZERO/PENGUJIAN saat terhubung tetapi belum HOME (kalibrasi awal)', () => {
    render(
      <BottomToolbar
        {...toolbarProps}
        isHomed={false}
        isZeroed={false}
        isConnected={true}
      />
    );
    expect((document.getElementById('btn-toolbar-zero') as HTMLButtonElement).disabled).toBe(true);
    expect((document.getElementById('btn-toolbar-uji-naik') as HTMLButtonElement).disabled).toBe(true);
    expect((document.getElementById('btn-toolbar-uji-turun') as HTMLButtonElement).disabled).toBe(true);
    // HOME (kalibrasi) tetap aktif
    expect((document.getElementById('btn-toolbar-home') as HTMLButtonElement).disabled).toBe(false);
    // Indikator peringatan kalibrasi tahap HOME ditampilkan
    expect(screen.getByText(/Belum Kalibrasi — Klik HOME \(17m\) dulu/)).toBeTruthy();
  });

  it('setelah HOME, ZERO aktif tetapi PENGUJIAN tetap non-aktif sampai ZERO_DONE', () => {
    render(
      <BottomToolbar
        {...toolbarProps}
        isHomed={true}
        isZeroed={false}
        isConnected={true}
      />
    );
    expect((document.getElementById('btn-toolbar-zero') as HTMLButtonElement).disabled).toBe(false);
    expect((document.getElementById('btn-toolbar-uji-naik') as HTMLButtonElement).disabled).toBe(true);
    expect((document.getElementById('btn-toolbar-uji-turun') as HTMLButtonElement).disabled).toBe(true);
    // Indikator peringatan kalibrasi tahap ZERO ditampilkan
    expect(screen.getByText(/Belum Kalibrasi ZERO — Klik ZERO \(0m\) dulu/)).toBeTruthy();
  });

  it('setelah HOME lalu ZERO selesai, semua tombol pergerakan aktif', () => {
    render(<BottomToolbar {...toolbarProps} />);
    expect((document.getElementById('btn-toolbar-zero') as HTMLButtonElement).disabled).toBe(false);
    expect((document.getElementById('btn-toolbar-uji-naik') as HTMLButtonElement).disabled).toBe(false);
    expect((document.getElementById('btn-toolbar-uji-turun') as HTMLButtonElement).disabled).toBe(false);
    expect((document.getElementById('btn-toolbar-home') as HTMLButtonElement).disabled).toBe(false);
  });

  it('menampilkan stempel waktu kalibrasi terakhir', () => {
    render(<BottomToolbar {...toolbarProps} />);
    expect(screen.getByText('2026-08-27 09:30:00 WIB')).toBeTruthy();
  });

  it('menampilkan indikator siap saat tidak berjalan', () => {
    render(<BottomToolbar {...toolbarProps} />);
    expect(screen.getByText(/Controller Siap Menerima Perintah UDP/)).toBeTruthy();
  });
});