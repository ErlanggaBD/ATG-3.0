import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MeasurementModal } from './MeasurementModal';

const baseProps = {
  meter: 5,
  direction: 'UP' as const,
  isCalibration: false,
  isOpen: true,
  onClose: () => {},
  onConfirm: () => {},
};

describe('MeasurementModal', () => {
  it('tidak dirender saat tertutup', () => {
    render(<MeasurementModal {...baseProps} isOpen={false} />);
    expect(screen.queryByText('INPUT HASIL PENGUJIAN')).toBeNull();
  });

  it('menampilkan titik dan arah uji', () => {
    render(<MeasurementModal {...baseProps} meter={7} direction="DOWN" />);
    expect(screen.getByText('INPUT HASIL PENGUJIAN')).toBeTruthy();
    expect(screen.getByText(/Titik 7 m/)).toBeTruthy();
    expect(screen.getByText(/Uji Turun/)).toBeTruthy();
  });

  it('label kalibrasi tampil saat mode KALIBRASI', () => {
    render(<MeasurementModal {...baseProps} isCalibration={true} />);
    expect(screen.getByText(/nilai standar kalibrasi/)).toBeTruthy();
  });

  it('menolak input non-angka dan menampilkan error', () => {
    render(<MeasurementModal {...baseProps} onConfirm={() => {}} />);
    const input = document.getElementById('input-measurement-value') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.click(document.getElementById('btn-measurement-save') as HTMLButtonElement);
    expect(screen.getByText('Nilai harus berupa angka.')).toBeTruthy();
  });

  it('menyimpan nilai valid lewat onConfirm', () => {
    const onConfirm = vi.fn();
    render(<MeasurementModal {...baseProps} onConfirm={onConfirm} />);
    const input = document.getElementById('input-measurement-value') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '5000.000' } });
    fireEvent.click(document.getElementById('btn-measurement-save') as HTMLButtonElement);
    expect(onConfirm).toHaveBeenCalledWith(5000);
  });

  it('Enter menyimpan nilai, Escape membatalkan', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(<MeasurementModal {...baseProps} onConfirm={onConfirm} onClose={onClose} />);
    const input = document.getElementById('input-measurement-value') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '12.5' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onConfirm).toHaveBeenCalledWith(12.5);

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});