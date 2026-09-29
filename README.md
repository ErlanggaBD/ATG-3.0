# Otomasi Pengujian ATG Horizontal — Panduan Penggunaan (Operator)

Aplikasi desktop untuk mengontrol motor stepper dan melakukan kalibrasi / pengujian
metrologi ATG Horizontal pada rentang **1.0 – 17.0 meter**. Berjalan di **Linux** dan
**Windows**.

> **Penting:** Aplikasi terhubung ke perangkat (hardware) melalui jaringan
> Ethernet/UDP. **Semua perintah yang menggerakkan hardware hanya bisa dijalankan
> setelah aplikasi terhubung ke perangkat.** Jika belum terhubung, tombol-tombol
> tersebut terkunci dan muncul peringatan — silakan periksa koneksi terlebih dahulu.

---

## 1. Menjalankan Aplikasi

### Persyaratan
- Node.js + npm (untuk mode pengembangan).
- Kabel Ethernet antar komputer dan perangkat ATG.
- Perangkat ATG (Arduino + Ethernet shield W5100) menyala dengan firmware
  **`Basic_Test_UDP.ino`** (lihat Lampiran A untuk cara flash). Aplikasi ini
  **tidak** kompatibel dengan perintah protokol firmware lama (`SlaveUDP.ino`).
- Alamat tetap firmware: **`192.168.1.103`** port **`8888`** (dapat diubah di menu PENGATURAN).

### Mode pengembangan (Linux / Windows)
```bash
npm install
npm run desktop:dev
```

### Paket / installer
- **Windows:** `npm run desktop:build` → installer NSIS di folder `release/`.
- **Linux:** `npm run desktop:build` → paket **AppImage** dan **.deb** di folder `release/`
  (selain itu bisa dijalankan langsung via `npm run desktop:dev`).

---

## 2. Menghubungkan ke Perangkat

1. Nyalakan perangkat ATG dan pastikan kabel Ethernet terpasang di komputer Anda.
2. Di bagian atas aplikasi (header), perhatikan **indikator status**:
   - **Hijau berkedip + `192.168.1.103:8888`** → sudah **TERHUBUNG**.
   - **Merah + `DISCONNECTED`** → **BELUM terhubung**.
3. **Klik tombol status** (yang bertuliskan `DISCONNECTED` atau `host:port`) untuk
   **menghubungkan** atau **memutuskan** koneksi.
4. Bila gagal, buka menu **PENGATURAN** untuk memeriksa IP, Port, dan Timeout.

> Setelah terhubung (status hijau), semua tombol kontrol motor baru siap setelah
> **kalibrasi bertingkat** selesai — operator menekan **HOME (17m)** dulu (motor
> ke arah 17 m sampai limit A1 di ujung setelah 17 m → `HOME_DONE`), lalu
> **ZERO (0m)** (motor mundur sampai limit A1 di ujung sebelum 5 m → `ZERO_DONE`).
> Sebelum itu tombol ZERO (0m) / PENGUJIAN NAIK & TURUN **non-aktif** dan
> penggerakan posisi (`@<mm>`) ditolak firmware (`NOT_HOMED` / `NOT_ZEROED`).

### Auto Reconnect (otomatis tersambung ulang)

Jika opsi **Auto Reconnect** dicentang pada menu **PENGATURAN**:

- Saat koneksi terputus (mis. kabel LAN dicabut atau perangkat mati), aplikasi otomatis
  mencoba tersambung ulang **setiap 5 detik** — begitu kabel dicolok kembali / perangkat
  online / konfigurasi sesuai, status langsung kembali **hijau tanpa perlu klik**.
- Catatan: koneksi yang **diputus manual** (klik tombol status saat terhubung) tidak akan
  otomatis menyambung kembali — hubungkan manual sekali lagi bila memang ingin menyambung.


---

## 3. Proteksi Saat Belum Terhubung (Aturan Penting)

Selama aplikasi **belum terhubung ke jaringan hardware**, perintah berikut **dikunci**:

| Tombol / Aksi | Lokasi |
|---|---|
| ZERO (0m) → perintah `-` (kalibrasi) | Toolbar bawah & menu *Motor & UDP* |
| HOME (17m) → perintah `+` (kalibrasi) | Toolbar bawah & menu *Motor & UDP* |
| MAJU → perintah `+` | Toolbar bawah & menu *Motor & UDP* |
| MUNDUR → perintah `-` | Toolbar bawah & menu *Motor & UDP* |
| UKUR → perintah `%` | Toolbar bawah & menu *Motor & UDP* |
| PENGUJIAN NAIK | Toolbar bawah, menu *Pengujian Metrologi* |
| PENGUJIAN TURUN | Toolbar bawah, menu *Pengujian Metrologi* |
| Klik titik pada lintasan rel (5–17 m) | Visualisasi rel (atas) |
| E-STOP | Header & menu *Motor & UDP* |
| Perintah teks / terminal UDP | Drawer Log UDP (macro & kotak kirim) |

Jika operator tetap mengklik salah satu aksi di atas saat belum terhubung, muncul
**popup peringatan "BELUM TERHUBUNG KE HARDWARE"** berisi:

- Nama aksi yang diblokir;
- Instruksi memeriksa koneksi (kabel, daya perangkat, IP/Port);
- Tombol **"Coba Hubungkan"** untuk langsung mencoba koneksi ulang;
- Tombol **"Tutup"** untuk menutup peringatan.

💡 Popup hanya muncul sebagai peringatan — **tidak ada perintah apa pun yang dikirim**
ke perangkat selama belum terhubung, demi keselamatan perangkat.

---

## 4. Tombol Kontrol Motor

Setelah koneksi aktif (status hijau), setiap tombol mengirim **satu paket UDP**
sesuai logika firmware `Basic_Test_UDP.ino`:

| Tombol | Perintah UDP | Perilaku Firmware |
|---|---|---|
| **HOME (17m)** | `+` | **Kalibrasi HOME (wajib dulu)**: motor berjalan ke arah 17 m sampai sensor A1 (plat pemicu di ujung setelah 17 m) → `HOME_DONE`, posisi ≈ 17.0 m. Syarat agar tombol **ZERO (0m)** aktif. |
| **ZERO (0m)** | `-` | **Kalibrasi ZERO**: motor mundur sampai sensor A1 (plat pemicu di ujung sebelum 5 m) → `ZERO_DONE`, posisi = 0. Syarat agar tombol PENGUJIAN aktif & `@<mm>` diizinkan. |
| **E-STOP** | `s` | Memotong semua loop gerak seketika (respon `ESTOP`) |
| **Klik angka lintasan / PENGUJIAN** | `@<mm>` | Pindah ke posisi absolut; meter ×1000 → mm (respon `POS_DONE:<mm>`; ditolak `NOT_HOMED` bila belum HOME, `NOT_ZEROED` bila belum ZERO) |

> **Syarat kalibrasi bertingkat.** Di awal setiap sesi, operator wajib menekan
> **HOME (17m)** dulu, lalu **ZERO (0m)**. Jika tidak, firmware membalas
> `NOT_HOMED` / `NOT_ZEROED` untuk setiap `@<mm>` dan aplikasi menonaktifkan
> tombol ZERO / PENGUJIAN NAIK & TURUN serta klik titik pada lintasan rel.

> **Sensor penanda meter (A0).** Di rel dipasang satu flag sensor tiap meter
> (5–17 m). Selama gerakan posisi naik/turun setelah kalibrasi (HOME+ZERO),
> motor berhenti **tepat di meter flag yang dicentang** (pola baca sama seperti
> A1). Posisi pada rel disinkronkan dari respon `POS_DONE:<mm>`; indikator
> **Sensor Zero** menyala saat motor di limit sebelum 5 m (posisi 0) dan
> **Sensor Home** menyala saat motor di limit setelah 17 m.

Perintah lanjutan **`@0`** (sama dengan `-`: kalibrasi ZERO, respon `ZERO_DONE`),
**`x`** (alias `+`: kalibrasi HOME, respon `HOME_DONE`), dan **`%`** (mode ukur,
respon `ACK` → `UKUR_DONE`) **tidak punya tombol utama di toolbar** — kirim
lewat **Terminal UDP** (kotak kirim raw) jika diperlukan.

---

## 5. Menjalankan Pengujian (Naik / Turun)

1. Pastikan sudah **terhubung** (lihat bagian 2).
2. **Kalibrasi bertingkat wajib dulu**:
   a. Klik **HOME (17m)** → motor ke arah 17 m sampai limit A1 (ujung setelah
      17 m) → balasan `HOME_DONE`; tombol **ZERO (0m)** menjadi aktif.
   b. Klik **ZERO (0m)** → motor mundur sampai limit A1 (ujung sebelum 5 m,
      posisi 0) → balasan `ZERO_DONE`; tombol PENGUJIAN menjadi aktif.
3. Pilih **mode pengujian** pada menu kiri (KALIBRASI, TERA ULANG, EVALUASI AKURASI,
   EVALUASI DISKRIMINASI).
4. **Centang titik uji** yang ingin diuji pada tabel (kolom *Uji*). Gunakan
   **"Pilih Semua Titik"** untuk semua titik 5–17 m.
   > Catatan: pada mode **TERA ULANG** maksimal 5 titik dapat dipilih.
5. Klik **PENGUJIAN NAIK** atau **PENGUJIAN TURUN** di toolbar bawah.
   - Motor bergerak dari titik terendah menuju tertinggi (NAIK), atau sebaliknya (TURUN).
   - Di setiap titik, motor **berhenti fisik** pada flag sensor meter (A0) dan
     firmware membalas `POS_DONE:<mm>` — **hanya setelah itu** jendela
     **INPUT HASIL PENGUJIAN** muncul. Isi nilai pembacaan standar, lalu
     **Simpan** (Enter) untuk lanjut, atau **Batal** (Esc) untuk melompati.
6. Status "Sekuens Motor Sedang Berjalan..." tampil selama proses; selesai kembali ke
   "Controller Siap Menerima Perintah UDP".

> Selama sekuens berjalan, tombol pengujian lain tidak dapat dimulai ulang.
> Urutan popup mengikuti kedatangan `POS_DONE:<mm>` yang nyata dari firmware —
> bukan simulasi animasi lokal.

---

## 6. Data, Preview, dan Ekspor

- **Data tabel** — masukkan/ubah nilai ALG (Naik/Turun) atau Std dengan tombol
  **EDIT NAIK/TURUN** dan **EDIT STD** di toolbar bawah, lalu **KUNCI** kembali bila selesai.
- **PREVIEW** — lihat laporan hasil uji sebelum diekspor.
- **Ekspor** — dari jendela preview, klik ekspor untuk menghasilkan file CSV
  (nama file mengikuti metadata instansi, mis. `Hasil_Uji_ATG_Horizontal_...csv`).
- **PENGATURAN** — ubah metadata instansi (operator, nomor seri, BKD, suhu, dll.) dan
  alamat TCP/IP.
- **Log UDP** — terminal lalu lintas data untuk diagnosa; termasuk tombol cepat
  ZERO (`@0`), HOME (`x`), PING (`y`) dan kotak kirim perintah raw UDP
  (contoh: `@5000`, `+`, `-`, `%`, `s`).

---

## 7. Cara Menutup Aplikasi

Gunakan tombol **CLOSE** (toolbar bawah), menu *File → Keluar Aplikasi (Exit)*, atau
tombol X pada jendela. Aplikasi akan menanyakan konfirmasi, menghentikan motor dengan
aman, menyimpan data kalibrasi terakhir, lalu menutup.

---

## 8. Troubleshooting Koneksi

| Masalah | Langkah Perbaikan |
|---|---|
| Status merah `DISCONNECTED`, popup muncul saat klik tombol | Pastikan kabel Ethernet terpasang, perangkat menyala; klik status untuk menghubungkan. |
| Gagal connect | Cek IP/Port di **PENGATURAN** (default `192.168.1.103:8888`); pastikan tidak ada konflik IP di jaringan. |
| Koneksi terputus mendadak | Aplikasi otomatis menghentikan motor dan menutup koneksi bila firmware berhenti membalas. Periksa daya/perangkat, lalu hubungkan kembali. |
| IP perangkat tidak dikenal | Tanyakan ke tim teknis / lihat konfigurasi firmware `Basic_Test_UDP.ino` (IP default `192.168.1.103`). |

---

## Lampiran A — Firmware & Protokol UDP

### A.1. Flash firmware (sekali saja)

Aplikasi ini bekerja dengan firmware baru **`Basic_Test_UDP.ino`** (turunan dari
`Basic_Test.ino` + jalur UDP + perintah E-STOP `s` + sensor penanda meter A0 +
pengunci kalibrasi bertingkat `homeDone`/`zeroDone`). Flash dengan Arduino IDE
(ATAU perintah `arduino-cli`):

```bash
arduino-cli compile --fqbn arduino:avr:uno Basic_Test_UDP
arduino-cli upload -p /dev/ttyUSB0 --fqbn arduino:avr:uno Basic_Test_UDP
```

- Atur IP firmware pada baris `IPAddress ip(192, 168, 1, 103);` sesuai LAN Anda.
- Verifikasi UDP server pada Serial Monitor 9600 (setup mencetak alamat IP).

### A.2. Tabel protokol perintah (port UDP 8888)

| Perintah | Respon firmware | Arti |
|---|---|---|
| `y` | `OK` | Ping / verifikasi koneksi (heartbeat) |
| `+` atau `x` | `MAJU`/`READY` → `HOME_DONE` | **Kalibrasi HOME**: motor ke arah 17 m sampai A1 (ujung setelah 17 m), posisi ≈ 17000, homeDone = true. Satu-satunya perintah yang boleh saat program baru dinyalakan |
| `-` atau `@0` | `MUNDUR` → `ZERO_DONE` | **Kalibrasi ZERO**: motor mundur sampai A1 (ujung sebelum 5 m), posisi = 0, zeroDone = true (butuh HOME dulu) |
| `@<mm>` (≠0) | `POS_DONE:<mm>` | Pindah ke posisi absolut (mm); berhenti di flag penanda (A0) bila = target (butuh HOME+ZERO) |
| `@<mm>` (≠0) / `-` / `@0` / `%` sebelum HOME | `NOT_HOMED` | Ditolak tanpa gerak — wajib **HOME (17m)** dulu |
| `@<mm>` (≠0) / `%` setelah HOME, sebelum ZERO | `NOT_ZEROED` | Ditolak tanpa gerak — wajib **ZERO (0m)** dulu |
| `%` (atau `#`) | `ACK` → `UKUR_DONE` | Toggle mode ukur ±10 mm (butuh HOME+ZERO) |
| `s` | `ESTOP` | Emergency stop — memotong loop gerak |

> **Sensor A0 — penanda meter (tambahan firmware UDP).** Satu flag sensor tiap
> meter di rel (5–17 m), pola baca persis seperti A1 (`INPUT_PULLUP`, stop saat
> `digitalRead == 1`). Selama gerakan posisi `@<mm>` setelah kalibrasi (HOME+ZERO):
> posisi disinkronkan ke meter flag yang dilewati; bila meter flag == target, motor
> berhenti tepat di titik itu (respon tetap `POS_DONE:<mm>`). A0 non-aktif saat
> kalibrasi HOME/ZERO (`+`/`x`/`-`/`@0`) dan jog ukur (`%`).

Konversi app: nilai meter pada rel (5–17 m) dikirim firmware sebagai milimeter,
yaitu **meter × 1000** (contoh: 8.5 m → `@8500`).

### A.3. Catatan teknis

- Firmware **`Basic_Test.ino` asli tidak diubah**; jalur Serial (9600 baud) tetap
  dipertahankan di `Basic_Test_UDP.ino` untuk debugging.
- **Pengunci kalibrasi bertingkat (homeDone → zeroDone):** penggerakan posisi
  `@<mm>` dan mode ukur `%` hanya valid setelah **HOME_DONE** lalu **ZERO_DONE**.
  Sebelum HOME_DONE firmware membalas `NOT_HOMED`; setelah HOME tapi sebelum
  ZERO_DONE membalas `NOT_ZEROED` — tanpa menggerakkan motor. Alur operator:
  **klik HOME (17m) dulu, lalu ZERO (0m)**.
- **Stop di titik meter (sensor A0):** selama `@<mm>` setelah kalibrasi, flag penanda
  meter di rel membuat motor berhenti tepat di meter yang dituju; posisi dipakai ulang
  (`posisi = meter × 1000`) sehingga drift open-loop ter-koreksi tiap meter.
- Perintah gerak bersifat *blocking* di firmware; selama gerak, ping `y` tetap
  dibalas (firmware memproses UDP di dalam loop gerak), sehingga koneksi tidak
  pernah dianggap putus hanya karena motor sedang berjalan.
- Setelah E-STOP, kirim perintah gerak apa pun (HOME (17m)/ZERO (0m) di toolbar, atau `@<mm>`/`x`/`@0`/`+`/`-`/`%` via Terminal UDP) untuk melanjutkan; setiap perintah gerak baru otomatis me-reset status E-STOP.

---

*Dokumen ini adalah panduan operator. Untuk detail teknis / laporan pengembangan,
lihat `docs/chat.md`.*