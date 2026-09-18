import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import App from './App';

// Bridge desktopApp hanya tersedia di dalam Electron. Di lingkungan test kita
// install mock agar alur connect/disconnect dan pengiriman paket bisa diuji.
function installDesktopBridge() {
  Object.defineProperty(window, 'desktopApp', {
    configurable: true,
    value: {
      isDesktop: true,
      close: vi.fn(),
      loadLastCalibration: vi.fn(async () => null),
      saveLastCalibration: vi.fn(() => true),
      connectHardware: vi.fn(async () => ({ ok: true, connected: true, message: 'ok' })),
      disconnectHardware: vi.fn(async () => ({ ok: true, connected: false, message: 'ok' })),
      sendHardware: vi.fn(async () => ({ ok: true, message: 'sent' })),
      onHardwareLog: vi.fn(() => () => {}),
      onHardwareState: vi.fn(() => () => {})
    }
  });
}

const connectViaHeader = async () => {
  fireEvent.click(document.getElementById('btn-toggle-tcp') as HTMLButtonElement);
  await act(async () => {});
};

describe('App (smoke test)', () => {
  it('aplikasi boot tanpa error dan menampilkan menu + tabel dengan checkbox', { timeout: 15000 }, () => {
    render(<App />);
    // Mode KALIBRASI aktif di awal
    expect(screen.getByText('1. KALIBRASI')).toBeTruthy();
    // Kolom header tabel yang diharapkan (versi dengan kolom Uji/Check)
    expect(screen.getByText('Uji')).toBeTruthy();
    expect(screen.getByText('Std Naik')).toBeTruthy();
    expect(screen.getByText('Std Turun')).toBeTruthy();
    expect(screen.getByText('Naik (mm)')).toBeTruthy();
    expect(screen.getByText('Turun (mm)')).toBeTruthy();
    // Checkbox titik uji tersedia
    expect(screen.queryAllByRole('checkbox').length).toBeGreaterThan(0);
    expect(screen.getByText(/Pilih Semua Titik/)).toBeTruthy();
  });
});

describe('App — proteksi saat belum terhubung ke hardware', () => {
  beforeEach(() => {
    installDesktopBridge();
  });

  afterEach(() => {
    cleanup();
  });

  it('memblokir aksi perintah hardware saat offline dan menampilkan popup peringatan', () => {
    render(<App />);

    // Klik PENGUJIAN NAIK saat belum terhubung → sekuens TIDAK berjalan, muncul popup
    fireEvent.click(document.getElementById('btn-toolbar-uji-naik') as HTMLButtonElement);
    expect(screen.getByText(/BELUM TERHUBUNG KE HARDWARE/)).toBeTruthy();
    expect(screen.queryByText(/Sekuens Motor Sedang Berjalan/)).toBeNull();

    // Tutup popup
    fireEvent.click(document.getElementById('btn-connection-close') as HTMLButtonElement);
    expect(screen.queryByText(/BELUM TERHUBUNG KE HARDWARE/)).toBeNull();
  });

  it('menampilkan popup saat ZERO/HOME/klik titik track/E-STOP ditekan dalam keadaan offline', () => {
    render(<App />);

    const expectBlocked = () => {
      expect(screen.getByText(/BELUM TERHUBUNG KE HARDWARE/)).toBeTruthy();
      fireEvent.click(document.getElementById('btn-connection-close') as HTMLButtonElement);
      expect(screen.queryByText(/BELUM TERHUBUNG KE HARDWARE/)).toBeNull();
    };

    fireEvent.click(document.getElementById('btn-toolbar-zero') as HTMLButtonElement);
    expectBlocked();

    fireEvent.click(document.getElementById('btn-toolbar-home') as HTMLButtonElement);
    expectBlocked();

    fireEvent.click(document.getElementById('track-tick-6') as HTMLButtonElement);
    expectBlocked();

    fireEvent.click(document.getElementById('btn-emergency-stop') as HTMLButtonElement);
    expectBlocked();
  });

  it('saat sudah terhubung, tombol pergerakan motor berjalan tanpa popup', async () => {
    render(<App />);
    await connectViaHeader();

    // Terhubung → host:port tampil di header & status bar
    expect(screen.getAllByText(/192\.168\.1\.103:8888/).length).toBeGreaterThan(0);

    // ZERO & HOME dapat dijalankan tanpa popup
    fireEvent.click(document.getElementById('btn-toolbar-zero') as HTMLButtonElement);
    expect(screen.queryByText(/BELUM TERHUBUNG KE HARDWARE/)).toBeNull();

    fireEvent.click(document.getElementById('btn-toolbar-home') as HTMLButtonElement);
    expect(screen.queryByText(/BELUM TERHUBUNG KE HARDWARE/)).toBeNull();
  });
});

describe('App — auto-reconnect', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    installDesktopBridge();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('menyambung otomatis setelah koneksi putus tanpa perlu klik manual', async () => {
    render(<App />);
    // Awal: belum terhubung
    expect((document.getElementById('btn-toggle-tcp') as HTMLButtonElement).textContent).toContain('DISCONNECTED');

    // Tunggu 5 detik → auto-reconnect mencoba dan berhasil
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    await act(async () => {});

    expect((document.getElementById('btn-toggle-tcp') as HTMLButtonElement).textContent).toContain('192.168.1.103:8888');
    expect(screen.getAllByText(/192\.168\.1\.103:8888/).length).toBeGreaterThan(0);
  });

  it('tidak auto-reconnect setelah diputus secara manual', async () => {
    render(<App />);

    // Hubungkan manual → sudah terhubung
    fireEvent.click(document.getElementById('btn-toggle-tcp') as HTMLButtonElement);
    await act(async () => {});
    expect((document.getElementById('btn-toggle-tcp') as HTMLButtonElement).textContent).toContain('192.168.1.103:8888');

    // Putus manual
    fireEvent.click(document.getElementById('btn-toggle-tcp') as HTMLButtonElement);
    await act(async () => {});
    expect((document.getElementById('btn-toggle-tcp') as HTMLButtonElement).textContent).toContain('DISCONNECTED');

    // Setelah 5 detik, tetap tidak tersambung (diputus manual = jangan auto-konek)
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    await act(async () => {});
    expect((document.getElementById('btn-toggle-tcp') as HTMLButtonElement).textContent).toContain('DISCONNECTED');
  });
});

describe('App — pengujian hanya mengunjungi titik yang dicentang', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    installDesktopBridge();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('PENGUJIAN NAIK berhenti di titik terakhir yang dicentang (14m), tidak lanjut ke 17m/home', { timeout: 30000 }, async () => {
    render(<App />);

    // Hubungkan ke hardware terlebih dahulu (syarat sebelum sekuens berjalan)
    await connectViaHeader();

    // Matikan titik 15, 16, 17 → hanya 5..14 yang aktif (10 titik)
    fireEvent.click(document.getElementById('chk-point-15') as HTMLInputElement);
    fireEvent.click(document.getElementById('chk-point-16') as HTMLInputElement);
    fireEvent.click(document.getElementById('chk-point-17') as HTMLInputElement);

    // Hanya 5..14 yang tetap tercentang
    expect((document.getElementById('chk-point-5') as HTMLInputElement).checked).toBe(true);
    expect((document.getElementById('chk-point-14') as HTMLInputElement).checked).toBe(true);
    expect((document.getElementById('chk-point-15') as HTMLInputElement).checked).toBe(false);
    expect((document.getElementById('chk-point-17') as HTMLInputElement).checked).toBe(false);

    // Mulai PENGUJIAN NAIK
    fireEvent.click(document.getElementById('btn-toolbar-uji-naik') as HTMLButtonElement);
    expect(screen.getByText(/Sekuens Motor Sedang Berjalan/)).toBeTruthy();

    const visitedMeters: number[] = [];

    // Motor bergerak dari posisi awal (0m). Antri dan isi modal di setiap titik.
    for (let step = 0; step < 10; step++) {
      let guard = 0;
      // Majukan waktu (tiap 250ms motor bergerak 0.075m) sampai modal muncul
      while (!document.getElementById('modal-measurement')) {
        guard += 1;
        if (guard > 5000) throw new Error('Modal hasil pengujian tidak muncul.');
        act(() => {
          vi.advanceTimersByTime(250);
        });
      }

      const modal = document.getElementById('modal-measurement') as HTMLElement;
      const match = modal.textContent?.match(/Titik\s+(\d+)\s+m\s*[—-]\s*Uji Naik/);
      expect(match).not.toBeNull();
      visitedMeters.push(Number(match?.[1]));

      // Isi nilai lalu Simpan
      fireEvent.change(document.getElementById('input-measurement-value') as HTMLInputElement, {
        target: { value: (Number(match?.[1]) * 1000).toString() }
      });
      fireEvent.click(document.getElementById('btn-measurement-save') as HTMLButtonElement);
    }

    // Urutan titik yang dikunjungi harus 5,6,7,...,14
    expect(visitedMeters).toEqual([5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);

    // Pastikan tidak ada titik > 14 yang dikunjungi
    expect(Math.max(...visitedMeters)).toBeLessThanOrEqual(14);

    // Majukan waktu lebih jauh untuk memastikan motor tidak lanjut ke 15/16/17
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Sequence selesai → status siap kembali
    expect(screen.queryByText(/Sekuens Motor Sedang Berjalan/)).toBeNull();
    expect(screen.getByText(/Controller Siap Menerima Perintah TCP/)).toBeTruthy();

    // Motor berhenti di 14m, bukan di home/17m
    expect(screen.getByText(/14\.000m/)).toBeTruthy();
  });
});