import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TestingTable } from './TestingTable';
import { AtgTestRow } from '../types';

const sampleRows: AtgTestRow[] = [
  { meter: 5, selected: true, algNaik: '1', algTurun: '2', algDiskSebelum: '0', algDiskSetelah: '0', stdNaik: '100', stdTurun: '102' },
  { meter: 6, selected: true, algNaik: '3', algTurun: '4', algDiskSebelum: '0', algDiskSetelah: '0', stdNaik: '200', stdTurun: '205' },
];

const baseProps = {
  rows: sampleRows,
  onRowChange: () => {},
  onToggleAll: () => {},
  isEditAlgEnabled: false,
  isEditStdEnabled: false,
  activeTestMode: 'KALIBRASI' as const,
  currentMotorPos: 5,
  batasKesalahanMm: 1.0,
};

describe('TestingTable', () => {
  it('kolom Uji dan checkbox per titik muncul', () => {
    render(<TestingTable {...baseProps} />);
    expect(screen.getByText('Uji')).toBeTruthy();
    expect(screen.queryAllByRole('checkbox').length).toBeGreaterThan(0);
    expect(screen.getByText(/Pilih Semua Titik/)).toBeTruthy();
  });

  it('tampilkan jumlah titik aktif', () => {
    render(<TestingTable {...baseProps} />);
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('mode KALIBRASI: kolom STD dapat diedit, kolom Naik/Turun terkunci', () => {
    render(<TestingTable {...baseProps} isEditStdEnabled={true} currentMotorPos={-1} />);
    const stdNaik = document.getElementById('input-alg-disk-sblm-5') as HTMLInputElement;
    const stdTurun = document.getElementById('input-alg-disk-ssdh-5') as HTMLInputElement;
    const algNaik = document.getElementById('input-alg-naik-5') as HTMLInputElement;
    const algTurun = document.getElementById('input-alg-turun-6') as HTMLInputElement;
    expect(stdNaik).not.toBeNull();
    expect(stdNaik.disabled).toBe(false);
    expect(stdTurun.disabled).toBe(false);
    expect(algNaik.disabled).toBe(true);
    expect(algTurun.disabled).toBe(true);
  });

  it('mode TERA_ULANG: label berubah jadi "Pilih Maks. 5 Titik"', () => {
    render(<TestingTable {...baseProps} activeTestMode="TERA_ULANG" />);
    expect(screen.getByText(/Pilih Maks\. 5 Titik/)).toBeTruthy();
  });

  it('mode TERA_ULANG: kolom Naik/Turun dapat diedit, kolom STD terkunci', () => {
    render(
      <TestingTable
        {...baseProps}
        activeTestMode="TERA_ULANG"
        isEditAlgEnabled={true}
        currentMotorPos={-1}
      />
    );
    const algNaik = document.getElementById('input-alg-naik-5') as HTMLInputElement;
    const algTurun = document.getElementById('input-alg-turun-5') as HTMLInputElement;
    const stdNaik = document.getElementById('input-alg-disk-sblm-5') as HTMLInputElement;
    const stdTurun = document.getElementById('input-alg-disk-ssdh-5') as HTMLInputElement;
    expect(algNaik.disabled).toBe(false);
    expect(algTurun.disabled).toBe(false);
    expect(stdNaik.disabled).toBe(true);
    expect(stdTurun.disabled).toBe(true);
  });

  it('deviasi dihitung dari kolom yang digunakan sesuai mode', () => {
    render(<TestingTable {...baseProps} currentMotorPos={-1} />);
    expect(screen.getByText('2.00')).toBeTruthy();
    expect(screen.getAllByText('PERIKSA').length).toBeGreaterThan(0);
  });

  it('onToggleAll dipanggil saat tombol select-all diklik', () => {
    const toggleAll = vi.fn();
    render(<TestingTable {...baseProps} onToggleAll={toggleAll} />);
    const btn = document.getElementById('chk-select-all') as HTMLButtonElement;
    fireEvent.click(btn);
    expect(toggleAll).toHaveBeenCalledWith(false);
  });
});
