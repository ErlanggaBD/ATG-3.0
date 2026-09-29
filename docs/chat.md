# Laporan Sesi — Proteksi Aksi Perintah Hardware Saat Belum Terhubung

**Tanggal:** 18 September 2026
**Project:** `ATG-V2.o` (fork/salinan dari `ATG-FMWRCNDTD`)
**Tipe aplikasi:** Desktop (Electron + Vite + React + TypeScript), berjalan di Linux & Windows.

---

## 1. Latar Belakang / Permintaan

Aplikasi desktop kontrol motor stepper ATG (uji naik/turun, kalibrasi, dst.) sebelumnya
**membolehkan operator menjalankan aksi yang berkaitan dengan perintah ke hardware walaupun
aplikasi belum terhubung ke perangkat**. Permintaan user:

> Jika desktop app belum terkoneksi ke jaringan hardware, maka pengujian naik/turun,
> kalibrasi, maupun aksi lain yang mengirim perintah ke hardware TIDAK BOLEH dapat
> dijalankan. Jika operator tetap mengklik tombol tersebut, aplikasi menampilkan
> **popup notifikasi** yang memberi tahu bahwa belum terhubung ke hardware dan
> menyuruh memeriksa koneksi.

Syarat keras: **tidak mengubah tampilan / fitur lain yang sudah ada** — hanya menambahin
proteksi tersebut.

---

## 2. Gambaran Arsitektur yang Terkait

Komunikasi hardware dilakukan lewat UDP:

```
React renderer → window.desktopApp.sendHardware(packet)
  → electron/preload.cjs (ipcRenderer.invoke 'hardware-send')
    → electron/main.cjs udpSocket.send(...)
      → Firmware Arduino (SlaveUDP.ino), IP 192.168.1.103:8888
```

Status koneksi sudah dikelola end-to-end oleh infra yang sudah ada:
- Handshake verifikasi (`response` ⇄ `online`), heartbeat tiap 1500 ms, deteksi putus >4500 ms.
- Broadcast `hardware-state { connected }` dari `electron/main.cjs` → `onHardwareState` di renderer.
- Indikator visual: badge header (hijau `host:port` / merah `DISCONNECTED`), status bar, terminal log.

Implikasi: proteksi cukup ditambahkan di **satu lapisan** renderer dengan mengecek
`motorStatus.connected` — tanpa menyentuh main process, firmware, atau UI yang ada.

---

## 3. Perubahan yang Dilakukan

### 3.1 File baru: `src/components/HardwareOfflineModal.tsx`

Komponen **popup peringatan** bergaya sama dengan modal lain (dark theme, border,
lucide icon). Isi popup:

- Judul **"BELUM TERHUBUNG KE HARDWARE — Perintah tidak dapat dijalankan"**.
- Menyebutkan aksi yang dicoba diblokir (mis. *"Pengujian Naik"*).
- Penjelasan singkat bahwa perintah ke hardware dikunci sampai koneksi perangkat aktif.
- **Langkah periksa koneksi:** (1) cek kabel Ethernet, (2) pastikan perangkat menyala di
  IP `host:port`, (3) klik tombol `DISCONNECTED` di header untuk menghubungkan,
  (4) periksa IP/Port di menu PENGATURAN.
- Tombol **"Tutup"** (tutup popup) dan **"Coba Hubungkan"** (langsung mencoba koneksi ulang).

### 3.2 File diubah: `src/App.tsx`

1. Import `HardwareOfflineModal`.
2. State baru `connRequired: { action: string } | null` — null = popup tertutup.
3. Helper baru **`requireHardwareConnection(action)`** — satu pintu gerbang semua aksi
   perintah hardware:

   ```ts
   if (motorStatus.connected) return true;
   addTcpLog('SYS', `Perintah diblokir — ${action}: belum terhubung ke jaringan hardware. Periksa koneksi.`, 'ERR');
   setConnRequired({ action });
   return false;
   ```

4. Dipasang penjaga di **setiap handler yang mengirim perintah ke hardware**:
   - `handleMoveToMeter` → klik titik track `track-tick-*` & gerak internal sekuens.
   - `handleZero5M` → tombol ZERO (5 m).
   - `handleHome17M` → tombol HOME (17 m).
   - `handlePengujianNaik` → Pengujian Naik.
   - `handlePengujianTurun` → Pengujian Turun.
   - `handleEmergencyStop` → E-STOP.
   - `onSendRawCommand` (terminal `TcpLogDrawer`) → kirim perintah raw.

   Efeknya: **selama offline, klik tombol mana pun di atas hanya menampilkan popup** dan
   tidak menjalankan operasi apa pun.

5. Refactor aman `handleEmergencyStop`: inti logika diisolasi ke `stopMotorInternal()`
   (stop interval, reset state, kirim `@J50_50_50_1?` bila terhubung). `handleEmergencyStop`
   = `requireHardwareConnection` + `stopMotorInternal()`. `handleCloseApp` tetap memanggil
   `stopMotorInternal()` langsung, sehingga **menutup aplikasi saat offline tidak memicu popup**.

6. Render `<HardwareOfflineModal />` di dalam `DesktopWindowFrame`, `z-[70]` (di atas modal lain).

### 3.3 File diubah: `src/App.test.tsx`

- Tambah `installDesktopBridge()` → mock `window.desktopApp` (connect/disconnect/send/log/state)
  karena bridge hanya ada di Electron.
- Tes sekuens lama yang sebelumnya "berjalan tanpa koneksi" kini **wajib connect dulu**
  (`connectViaHeader()`), sesuai aturan baru.
- Tambah 3 kasus uji baru untuk proteksi:
  1. Klik PENGUJIAN NAIK saat offline → popup muncul, sekuens tidak berjalan.
  2. ZERO / HOME / klik titik track / E-STOP saat offline → popup muncul untuk semuanya.
  3. Setelah terhubung → ZERO / HOME berjalan tanpa popup.

---

## 4. Verifikasi

| Pemeriksaan | Perintah | Hasil |
|---|---|---|
| TypeScript / typecheck | `npm run lint` (tsc --noEmit) | ✅ Lolos, tanpa error |
| Unit test | `npx vitest run` | ✅ **21/21 lolos** (4 file tes) |
| Build produksi | `npm run build` (vite build) | ✅ Berhasil |
| Uji langsung di Electron | harness `electron + preload + dist/` | ✅ Lolos (di bawah) |

### Hasil uji langsung (desktop app sungguhan via Electron)

| Skenario | Popup muncul? | Aksi terblokir? | Status |
|---|---|---|---|
| OFFLINE → klik Pengujian Naik | ✅ Ya | ✅ Ya (sekuens tidak jalan) | LULUS |
| OFFLINE → klik E-STOP | ✅ Ya | ✅ Ya | LULUS |
| OFFLINE → klik ZERO | ✅ Ya | ✅ Ya | LULUS |
| Connect (simulasi sukses) | — | — | Header jadi hijau `host:port` ✅ |
| CONNECTED → klik Pengujian Naik | ❌ Tidak | — (sekuens jalan) | LULUS |

Bukti visual disimpan di `docs/screenshots/`:
`01-offline-boot.png`, `02-offline-naik-popup.png`, `03-offline-estop-popup.png`,
`04-connected.png`, `05-connected-seq.png`.

### Verifikasi build Windows (via Wine 11.17 staging)

Dijalankan dengan `~/Applications/wine-11.17-staging-amd64` + prefix `~/.wine-atg11`:

```
release/win-unpacked/Otomasi Pengujian ATG.exe --remote-debugging-port=9222
```

Diperiksa lewat Chrome DevTools Protocol (DOM asli di dalam Wine):

| Skenario | Hasil |
|---|---|
| Tab berjudul "Otomasi Pengujian ATG Horizontal" | ✅ |
| Status awal `DISCONNECTED` | ✅ |
| OFFLINE klik Pengujian Naik → popup muncul, sekuens tidak jalan | ✅ |
| OFFLINE klik E-STOP → popup muncul | ✅ |
| OFFLINE klik ZERO → popup muncul | ✅ |

Catatan: **wine-5.12 TkG (lama) GAGAL** menjalankan Electron 36
(`unimplemented function KERNEL32.dll.SetThreadInformation`); **wine-11.17 berhasil**.
Bukti: `docs/screenshots/win-offline-naik-popup.png` &
`docs/screenshots/win-offline-zero-popup.png`.

### Penting: bangun ulang paket `release/`

Perubahan hanya masuk ke `dist/` (source build). Paket installer lama di `release/`
(`Setup.exe` 18 Sep 14:32 & `AppImage` 17 Sep) **tidak memuat fitur**. Setelah pengerjaan,
`release/` dibangun ulang (18 Sep 17:30–17:31) sehingga **`Setup.exe` dan `AppImage`
saat ini sudah memuat fitur** — pengguna harus memakai installer/AppImage versi baru ini
atau menjalankan `npm run desktop:dev`.

Catatan transportasi: seluruh logika JSON UI tidak berubah; `dist/` di-rebuild ulang normal.

---

## 5. Platform Linux & Windows

Proteksi berada sepenuhnya di **kode renderer** (React + preload bridge) yang sama untuk
kedua OS. Artinya perilaku "kunci aksi saat offline + popup" **identik di Linux dan Windows** —
tidak perlu penyesuaian platform. Catatan: konfigurasi `electron-builder` saat ini baru
mendefinisikan target Windows (`win` → NSIS); bila ingin *installer* Linux, tambahkan
bagian `linux` pada `build` di `package.json` (di luar cakupan permintaan ini).

---

## 6. Catatan / Hal yang Tidak Diubah

- Tidak ada perubahan tampilan, layout, warna, atau fitur yang sudah ada.
- Tidak ada perubahan `electron/main.cjs`, `electron/preload.cjs`, atau firmware `SlaveUDP/`.
- Kontrak paket UDP (`@J...?`, heartbeat `response`) tetap sama.

---

## 7. Auto-Reconnect (18 Sep 2026, 19:23–19:40)

**Permintaan:** setelah kabel LAN dicabut (auto-disconnect sudah berjalan), saat kabel
dicolok kembali / perangkat online / konfigurasi sesuai, aplikasi harus **tersambung ulang
otomatis tanpa klik** tombol status. Bekerja identik di Linux & Windows, cukup lewat
checkbox **Auto Reconnect** di PENGATURAN.

**Sebelumnya:** `tcpConfig.autoReconnect` hanya disimpan sebagai status (tidak ada kode yang
membacanya) — lihat catatan sesi sebelumnya `docs/dev-session-log.md:123`.

**Implementasi** (`src/App.tsx` saja — logika renderer, berlaku untuk kedua OS):
- `skipAutoReconnectRef` — penanda jeda auto-reconnect saat koneksi diputus **manual**.
- `useEffect` auto-reconnect: saat `!motorStatus.connected && tcpConfig.autoReconnect` dan
  bukan pemutusan manual, jadwalkan `window.desktopApp.connectHardware(tcpConfig)` setiap
  **5 detik** via `setTimeout` (bukan `setInterval`, agar tidak menumpuk saat pengguna
  terhubung manual di tengah jalan). Saat berhasil: set `connectedRef.current = true`,
  `motorStatus.connected = true`, dan tulis log `SYS Auto-reconnect: terhubung kembali … 'OK'`.
  Saat `connected` → effect berhenti & bersihkan timer (return cleanup).
- Di `handleToggleTcp`: cabang pemutusan manual meng-set `skipAutoReconnectRef.current = true`
  sehingga seluruhnya (misal operator memutus sengaja lalu kabel tetap tersambung) **tidak**
  otomatis nyambung lagi; flag di-reset setelah terhubung (manual/auto).

**Alasan `setTimeout` + cleanup, bukan `setInterval`:** jika pengguna meng-klik tombol
status saat masih `DISCONNECTED`, connect manual akan jalan bersamaan interval → koneksi
ganda/dobel. `setTimeout` yang dibersihkan via efek menghindari tumpang tindih.

**Verifikasi:**
- `npm run lint` (tsc --noEmit): ✅ lolos.
- `npx vitest run`: **23/23 tes** lolos (2 tes baru:
  "menyambung otomatis setelah koneksi putus tanpa perlu klik manual" +
  "tidak auto-reconnect setelah diputus secara manual").
- `npm run build` + `npx electron-builder --linux AppImage --win nsis`: ✅ dibangun ulang.
- Asar `release/win-unpacked` & `release/linux-unpacked`: string `Auto-reconnect` ditemukan
  di bundle bawaan keduanya → fitur masuk ke **Setup.exe (baru)** dan **AppImage (baru)**.

**Catatan:** auto-reconnect tetap menghormati proteksi "opsi Nonaktif"; jika di-uncheck di
PENGATURAN, tidak ada percobaan ulang. Tanpa perangkat/firmware aktif, setiap percobaan akan
gagal (log di main process) dan dicoba lagi 5 detik kemudian — perilaku normal.
---

## 8. Sensor A0 (penanda meter) + Pengunci Kalibrasi + Sekuens Tunggu POS_DONE (28 Sep 2026)

**Permintaan:** motor harus berhenti fisik di titik meter yang dicentang (5–17 m) via sensor
baru **A0** (satu flag tiap meter pada rel), operator wajib klik **HOME** (kalibrasi) dulu,
dan popup input nilai di sekuens pengujian muncul **setelah motor benar-benar berhenti**
(tunggu `POS_DONE` nyata dari firmware), bukan dari simulasi animasi lokal.

### Firmware `Basic_Test_UDP.ino` (Basic_Test.ino asli TIDAK diubah)
- `#define sensePin A0` + `pinMode(sensePin, INPUT_PULLUP)` — pola baca persis A1.
- `bool homed` — true setelah A1 mendeteksi home/zero (`x`/`@0`/`+`/`-`).
- Gate kalibrasi: `@<mm>` (≠0) dan `%`/`#` sebelum homed → respon `NOT_HOMED` tanpa gerak.
- `checkA0Flag()`: selama gerakan posisi (`moveTargetMm > 0`), tiap step dicek A0 HIGH.
  Posisi disinkronkan ke meter flag terdekat (`posisi = flagMeter*1000`, koreksi drift
  open-loop); jika meter flag == target → `sensorArrived`, loop berhenti (Rot + sisa byMM),
  respon tetap `POS_DONE:<mm>`. A0 non-aktif saat homing & jog ukur.
- Kompilasi bersih: **55% flash, 36% RAM** (arduino-cli, Uno + W5100).

### App (`src/App.tsx`, `BottomToolbar.tsx`, `DesktopWindowFrame.tsx`)
- HOME button → perintah **`x`** (kalibrasi cari limit → posisi 0), label **HOME (0m)**;
  ZERO (5m) tetap `@5000`.
- State `isHomed` (true dari `HOME_DONE`/`ZERO_DONE`/`MAJU_DONE`/`MUNDUR_DONE`):
  - tombol ZERO / PENGUJIAN NAIK & TURUN **disabled** (`movementBlocked = connected && !isHomed`),
  - klik lintasan / pergerakan ditolak + modal **"MOTOR BELUM DIKALIBRASI"** (klik HOME dulu),
  - badge peringatan amber "⚠ Belum Kalibrasi — Klik HOME (0m) dulu" di toolbar.
- RX `NOT_HOMED` → isHomed false + modal peringatan kalibrasi.
- Sekuens: `pendingSeqMoveRef` ditandai saat `handleMoveToMeter` dalam sekuens; popup/lanjut
  hanya dipicu callback RX `POS_DONE:<mm>` (`onSequenceArrived`), bukan animasi lokal.
  Effect lama berbasis `motorStatus.isMoving` dihapus.
- E-STOP & disconnect mereset `pendingSeqMoveRef`.

### Verifikasi
- `npm run lint` ✅, `npx vitest run`: **24/24** lolos (tes baru: disabled-state, sekuens
  tunggu `POS_DONE` asli, kalibrasi-HOME-duluan; bridge test kini meng-capture `onHardwareLog`
  untuk mensimulasikan RX firmware).
- `npm run build` (vite) ✅. Paket desktop dibangun ulang → `release/` **1.0.0**.
- Field test berikutnya: flash firmware, HOME (`x`→`HOME_DONE`), PENGUJIAN NAIK → motor
  berhenti di flag tiap meter dicentang → popup → lanjut.
---

## 9. KOREKSI: Kalibrasi Bertingkat HOME (17m) → ZERO (0m) + Arah Naik/Turun (28 Sep 2026)

**Kekeliruan pada bagian 8:** HOME dikira berada di limit yang sama dengan posisi 0 m. 
Fisik sebenarnya (dikonfirmasi operator):

- **Sensor A1 tunggal dengan DUA plat pemicu** di kedua ujung rel:
  - **HOME** = ujung **setelah titik 17 m** — ditemukan dengan perintah **`+`** (motor ke arah
    17 m) sampai A1 terpicu (true).
  - **ZERO** = ujung **sebelum titik 5 m** — ditemukan dengan perintah **`-`** (motor mundur)
    sampai A1 terpicu. Ini titik acuan **posisi 0 mm**; pengujian dimulai dari titik 5 m.
- **Alur wajib saat program baru dinyalakan:** hanya **HOME (`+`)** boleh → `HOME_DONE` →
  lalu **ZERO (`-`)** boleh → `ZERO_DONE` → baru **PENGUJIAN** (menggunakan sensor A0 / flag
  meter 5–17 m).

### Firmware `Basic_Test_UDP.ino` (perubahan dari bagian 8)
- `bool homed` diganti **`homeDone`** dan **`zeroDone`** (kalibrasi bertingkat).
- `+` dan `x` → **HOME**: motor ke arah 17 m sampai A1 → `HOME_DONE`, `posisi = 17000`.
- `-` dan `@0` → **ZERO**: motor mundur sampai A1 → `ZERO_DONE`, `posisi = 0`. Sebelum
  `HOME_DONE` dibalas `NOT_HOMED`.
- `Move*_Init` sekarang **`bool`**: `false` bila loop diputus E-STOP sebelum limit → flag
  tidak diklaim selesai (`HOME_DONE`/`ZERO_DONE` tidak dikirim).
- Gate bertingkat: sebelum HOME_DONE → `NOT_HOMED` (untuk `-`/`@0`/`@<mm>`/`%`); setelah HOME
  tapi belum ZERO_DONE → `NOT_ZEROED` (untuk `@<mm>`/`%`).
- **Arah posisi di-balik** mengikuti fisik: `value > posisi` (naik, menuju 17 m) memakai
  fungsi arah HIGH (searah `+`/HOME); `value < posisi` (turun, menuju zero) memakai arah LOW
  (searah `-`). Komisioning lapangan tetap memverifikasi arah; bila terbalik cukup tukar
  HIGH/LOW di `Move*ByRot`/`Move*_Init`.
- `@0` tidak lagi back-off + MoveKiri_Init; langsung `MoveMundur_Init()` (kalibrasi ZERO).

### App (`App.tsx`, `BottomToolbar.tsx`, `DesktopWindowFrame.tsx`)
- **HOME (17m)** → perintah **`+`**; **ZERO (0m)** → perintah **`-`** (kalibrasi limit,
  bukan lagi `@5000`).
- State `isHomed` (dari `HOME_DONE`) → mengaktifkan tombol **ZERO**; `isZeroed` (dari
  `ZERO_DONE`) → mengaktifkan **PENGUJIAN NAIK/TURUN** + klik lintasan.
- Badge tahap: "⚠ Belum Kalibrasi — Klik HOME (17m) dulu" → "⚠ Belum Kalibrasi ZERO — Klik
  ZERO (0m) dulu" → "Controller Siap Menerima Perintah UDP".
- RX: `HOME_DONE` → posisi tampil 17.000 m; `ZERO_DONE` → 0.000 m; `NOT_HOMED`/`NOT_ZEROED`
  → modal peringatan tahap terkait. `MAJU_DONE`/`MUNDUR_DONE` tidak lagi dipakai app.
- Sekuens PENGUJIAN tetap menunggu `POS_DONE:<mm>` fisik (tidak berubah dari bagian 8).

### Verifikasi (bagian 9)
- `arduino-cli compile`: ✅ **55% flash, 35% RAM**.
- `npm run lint` ✅; `npx vitest run`: **26/26** lolos (tes alur 3 tahap: belum-HOME → setelah
  HOME_DONE → setelah ZERO_DONE; label ZERO (0m)/HOME (17m); sekuens tetap tunggu POS_DONE).
- `npm run build` (vite) ✅; paket desktop dibangun ulang → `release/` **1.0.0**.
- Field test berikutnya: flash firmware → **HOME (17m)** (`+` → motor lari ke 17 m, stop di
  A1 >17 m, `HOME_DONE`) → **ZERO (0m)** (`-` → motor mundur sampai <5 m, `ZERO_DONE`) →
  PENGUJIAN NAIK stop di tiap flag dicentang (A0) → popup → lanjut; uji E-STOP `s`.
  ⚠ Periksa arah motor: jika HOME malah lari ke arah zero, balik HIGH/LOW dirPin di firmware.
