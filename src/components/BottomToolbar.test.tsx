import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BottomToolbar } from './BottomToolbar';

const toolbarProps = {
  onOpenSettings: () => {},
  onOpenPreview: () => {},
  onCloseApp: () => {},
  onZero5M: () => {},
  onHome17M: () => {},
  onPengujianNaik: () => {},
  onPengujianTurun: () => {},
  lastCalibrationTimestamp: '2026-08-27 09:30:00 WIB',
  isEditAlg: false,
  onToggleEditAlg: () => {},
  isEditStd: false,
  onToggleEditStd: () => {},
  isRunningSequence: false,
};

describe('BottomToolbar', () => {
  it('memuat tombol-tombol utama toolbar', () => {
    render(<BottomToolbar {...toolbarProps} />);
    expect(screen.getByText('PENGATURAN')).toBeTruthy();
    expect(screen.getByText('PREVIEW')).toBeTruthy();
    expect(screen.getByText('EDIT NAIK/TURUN')).toBeTruthy();
    expect(screen.getByText('EDIT STD')).toBeTruthy();
    expect(screen.getByText('ZERO (5m)')).toBeTruthy();
    expect(screen.getByText('HOME (17m)')).toBeTruthy();
    expect(screen.getByText('PENGUJIAN NAIK')).toBeTruthy();
    expect(screen.getByText('PENGUJIAN TURUN')).toBeTruthy();
    expect(screen.getByText('CLOSE')).toBeTruthy();
  });

  it('menampilkan stempel waktu kalibrasi terakhir', () => {
    render(<BottomToolbar {...toolbarProps} />);
    expect(screen.getByText('2026-08-27 09:30:00 WIB')).toBeTruthy();
  });

  it('menampilkan indikator siap saat tidak berjalan', () => {
    render(<BottomToolbar {...toolbarProps} />);
    expect(screen.getByText(/Controller Siap Menerima Perintah TCP/)).toBeTruthy();
  });
});