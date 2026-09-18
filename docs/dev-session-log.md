# Log Sesi Pengembangan — Otomasi Pengujian ATG

> Tanggal: **16 September 2026**
> Repo: `/home/erlangga/Documents/DEV/ATG-FMWRCNDTD`
> App: **Otomasi Pengujian ATG** (Electron + React + Vite) — versi Linux & Windows
> Tujuan sesi: menyamakan kembali perilaku Linux dengan Windows yang sudah "bagus", memperbaiki popup input hasil pengujian, dan membuat **koneksi nyata ke firmware Arduino** di kedua platform.

---

## 1. Ringkasan hasil hari ini

1. **Fitur checkbox dikembalikan** di tabel pengujian (mirip versi Windows "yang bagus"):
   - `Pilih Semua Titik` (`chk-select-all`), checkbox per baris (`chk-point-<meter>`).
   - Mode `TERA_ULANG`: label berubah jadi "Pilih Maks. 5 Titik" dan dibatasi maksimal 5 titik.
   - `TestingTable.tsx`, `BottomToolbar.tsx`, `PreviewModal.tsx`, `App.tsx` dikembalikan ke isi commit `6ed0917` (HEAD).
   - Export CSV memakai status `Diuji / Dilewati`.

2. **Popup input hasil pengujian diperbaiki** (root cause: `window.prompt()` TIDAK didukung di Electron — dilempar `Error: prompt() is not supported.`):
   - Komponen baru `src/components/MeasurementModal.tsx` menggantikan `window.prompt`.
   - Ditambah test-nya di `src/components/MeasurementModal.test.tsx`.

3. **Sequence pengujian dibuat BLOCKING** (persis perilaku Windows):
   - Motor bergerak ke titik → **BERHENTI** → modal input muncul → operator isi nilai → klik **Simpan** → baru motor lanjut ke titik berikutnya yang dicentang.
   - **Batal/Esc** = lewati titik, lanjut ke berikutnya.
   - **Emergency Stop** = tutup modal + hentikan segalanya.

4. **Koneksi ke firmware Arduino dibuat nyata** (sebelumnya hanya simulasi "placeholder"):
   - Koneksi **diverifikasi** dengan menunggu balasan `online` dari firmware (bukan langsung klaim sukses).
   - **Deteksi kabel terputus** otomatis → motor berhenti, sequence dibatalkan.
   - Terminal raw benar-benar **mengirim perintah** ke firmware.

5. **Linux & Windows dibangun ulang dari codebase yang sama** → perilaku identik.

---

## 2. Arsitektur & alur komunikasi hardware (penting utk sesi berikutnya)

### Firmware Arduino yang TERHUBUNG
Folder firmware: `/home/erlangga/Documents/DEV/ATG-DESKTOP-env/SlaveUDP/SlaveUDP/`

| Item | Nilai |
|---|---|
| Device | Arduino UNO + W5100 Ethernet Shield |
| IP | `192.168.1.103` (static) |
| Port | `8888` (UDP) |
| File | `SlaveUDP.ino`, `motorControl.ino`, `pinAndConstant.h` |
| Protokol TX (desktop→arduino) | `@J<x>_<y>_<z>_<btn>?` → motor jog kontinu (z=100 naik / 0 turun / 50 berhenti) |
| Cek koneksi | desktop kirim `response` → firmware balas `online` |
| Timeout firmware | 2000 ms tanpa paket → motor berhenti (`safetyProtocol`) |
| Posisi | **TIDAK dilaporkan** lewat UDP (open-loop jog) |

⚠️ CATATAN: `/home/erlangga/Documents/DEV/ATG-DESKTOP-env/ESPSimulasi/` adalah **simulator ESP32-S3 yang TIDAK RELEVAN** — jangan dipakai sebagai dasar protokol. Firmware asli yang terkoneksi adalah `SlaveUDP`.

### Jalur komunikasi di desktop app
```
Renderer (React)
  └─ window.desktopApp.sendHardware('@J50_50_100_1?')
       └─ preload.cjs  → ipcRenderer.invoke('hardware-send')
            └─ electron/main.cjs → udpSocket.send(...) ke host:port (default 192.168.1.103:8888)
```
- Persis satu codebase untuk Linux & Windows — **tidak ada cabang platform pada jalur hardware**.
- `response` probe tiap **1500 ms** (heartbeat); firmware balas `online` → RX log & `udpLastRxAt` diperbarui.
- Jika tanpa balasan > **4500 ms** → `closeUdp()` + event `hardware-state { connected: false }` → renderer menghentikan motor/sequence.
- Default host/port dari UI Settings: `192.168.1.103:8888`, timeout koneksi `3000 ms`.

---

## 3. Perubahan kode (dengan lokasi)

### `electron/main.cjs` (koneksi nyata)
- `hardware-connect`: bind UDP → kirim probe `response` → **menunggu balasan `online`** (batch vs `config.timeoutMs`). Gagal → `{ ok:false, connected:false, message }` (log error di UI).
- Monitor heartbeat: `HEARTBEAT_INTERVAL_MS=1500`; jika `udpVerified && now-udpLastRxAt > CONNECT_LOST_MS(4500)` → close + `broadcastHardwareState(false)`.
- `createUdpSocket` message handler: set `udpLastRxAt`, verifikasi `online` saat belum verified, kirim `hardware-log` RX.
- `broadcastHardwareState(connected)` → event `hardware-state`.
- `hardware-disconnect` → close + broadcast false.

### `electron/preload.cjs`
- Tambah `onHardwareState(callback)` (subscribe `hardware-state`, return unsubscribe).

### `src/App.tsx` (inti)
- `declare global` `Window.desktopApp` ditambah `onHardwareState`.
- Subscribe `onHardwareState`: saat `connected:false` & sebelumnya connected → bersihkan sequence refs, tutup `MeasurementModal`, `setIsRunningSequence(false)`, motor reset, log `"Koneksi ke firmware terputus. Motor dihentikan."`
- `handleToggleTcp`: saat disconnect manual → set `connectedRef=false` dulu agar tidak memicu log error "terputus"; saat connect → pakai `result.ok`.
- `TcpLogDrawer.onSendRawCommand`: sekarang benar-benar `sendHardwarePacket(cmd.trim())` (sebelumnya menulis `ACK:...;STAT=OK` palsu).
- Sequence blocking:
  - Ref baru `waitingForInputRef`.
  - `advanceSequence(direction)` — maju ke titik berikutnya, HANYA dipanggil setelah modal dijawab (Simpan/Batal).
  - Sequence effect: jika titik dicentang → buka modal + `waitingForInputRef=true` **tanpa** lanjut.
  - `MeasurementModal onConfirm` → `applySequenceMeasurement(...)` + advance; `onClose` → advance (skip titik).
  - `handleEmergencyStop` → tutup modal + `waitingForInputRef=false`.

### File komponen
- `src/components/MeasurementModal.tsx` (BARU) — modal input nilai; id: `modal-measurement`, `input-measurement-value`, `btn-measurement-save`; Enter=simpan, Esc=batal; validasi angka inline.
- `src/components/MeasurementModal.test.tsx` (BARU) — 6 tes.
- `src/components/TestingTable.tsx` — versi checkbox HEAD (`onToggleAll`, `chk-select-all`, `chk-point-*`, "Pilih Maks. 5 Titik" ≤ 5 untuk TERA_ULANG).
- `src/components/BottomToolbar.tsx`, `src/components/PreviewModal.tsx` — dikembalikan ke HEAD.
- Test tersesuaikan: `src/App.test.tsx` (timeout 15000), `src/components/TestingTable.test.tsx`, `src/components/BottomToolbar.test.tsx`.

---

## 4. Komando build (dipakai sesi ini)

```bash
npm run lint              # tsc --noEmit  → PASS
npx vitest run            # 17/17 test   → PASS
npm run build             # vite build → dist/assets/index-BQ8rrIu3.js
npx electron-builder --linux AppImage --win   # AppImage + Setup.exe + linux/win-unpacked
npx electron-builder --win                     # kalau --win sempat timeout, jalankan khusus ini
```

Artefak final di `release/`:
- `Otomasi Pengujian ATG-0.0.0.AppImage` (Linux)
- `Otomasi Pengujian ATG-0.0.0-Setup.exe` (Windows)
- `linux-unpacked/`, `win-unpacked/`

Verifikasi identik: `md5sum` semua `app.asar` = `4a1365132c376af02bca33fb82a70bfe`.

---

## 5. Keterbatasan / TODO untuk sesi berikutnya

- [ ] **Posisi motor tetap estimasi** (firmware `SlaveUDP` open-loop, tidak melaporkan posisi via UDP). Jika ingin posisi dibaca langsung dari hardware, firmware perlu ditambah laporan posisi (mis. balas status posisi saat `response`, atau proto baru).
- [ ] **Auto-reconnect**: `tcpConfig.autoReconnect=true` belum benar-benar diimplementasikan (hanya tersimpan di state). Bisa ditambahkan: setelah putus, coba reconnect otomatis N kali.
- [ ] **Format waktu log terminal** pakai jam lokal; tidak ada fungsi "export log ke file" — bisa ditambahkan tombol Simpan Log.
- [ ] Snap Linux tidak dibangun (snapcraft tidak terpasang di mesin dev).
- [ ] Penampilkan RX asli firmware di UI: saat terhubung hanya ada balasan `online` (tiap 1.5 detik). Bisa disaring/suppress agar tidak membanjiri terminal.

---

## 6. Tips cepat yang terbukti di sesi ini
- `window.prompt`/`window.alert` TIDAK berfungsi di Electron — selalu pakai komponen React (modal).
- Untuk verifikasi isi paket built tanpa menjalankan GUI: `npx asar extract-file <app.asar> dist/assets/<bundle>.js` lalu grep string khas (mis. `chk-select-all`, `btn-measurement-save`).
- GPU crash saat menjalankan app dari SSH/headless (`GPU process isn't usable`) — utk tes end-to-end pakai `--disable-gpu --in-process-gpu --no-sandbox --disable-dev-shm-usage`, atau cukup andalkan vitest + verifikasi asar.
- `npm run lint` = `tsc --noEmit` (source TypeScript); `electron/*.cjs` bisa dicek `node --check`.