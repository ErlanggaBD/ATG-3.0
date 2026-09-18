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
- Perangkat ATG (firmware Arduino/W5100) menyala.
- Alamat tetap firmware: **`192.168.1.103`** port **`8888`** (dapat diubah di menu PENGATURAN).

### Mode pengembangan (Linux / Windows)
```bash
npm install
npm run desktop:dev
```

### Paket / installer
- **Windows:** `npm run desktop:build` → installer NSIS di folder `release/`.
- **Linux:** jalankan langsung via `npm run desktop:dev`, atau bangun paket Linux
  dengan menambahkan target `linux` pada konfigurasi `electron-builder` (`package.json`).

---

## 2. Menghubungkan ke Perangkat

1. Nyalakan perangkat ATG dan pastikan kabel Ethernet terpasang di komputer Anda.
2. Di bagian atas aplikasi (header), perhatikan **indikator status**:
   - **Hijau berkedip + `192.168.1.103:8888`** → sudah **TERHUBUNG**.
   - **Merah + `DISCONNECTED`** → **BELUM terhubung**.
3. **Klik tombol status** (yang bertuliskan `DISCONNECTED` atau `host:port`) untuk
   **menghubungkan** atau **memutuskan** koneksi.
4. Bila gagal, buka menu **PENGATURAN** untuk memeriksa IP, Port, dan Timeout.

> Setelah terhubung (status hijau), semua tombol kontrol motor siap digunakan.

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
| ZERO (5m) | Toolbar bawah & menu *Motor & TCP* |
| HOME (17m) | Toolbar bawah & menu *Motor & TCP* |
| PENGUJIAN NAIK | Toolbar bawah, menu *Pengujian Metrologi* |
| PENGUJIAN TURUN | Toolbar bawah, menu *Pengujian Metrologi* |
| Klik titik pada lintasan rel (5–17 m) | Visualisasi rel (atas) |
| E-STOP | Header & menu *Motor & TCP* |
| Perintah teks / terminal TCP | Drawer Log TCP (macro & kotak kirim) |

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

Setelah koneksi aktif (status hijau):

- **ZERO (5m)** — Menggerakkan motor ke titik acuan 5.0 meter.
- **HOME (17m)** — Menggerakkan motor ke titik acuan 17.0 meter.
- **E-STOP** — Menghentikan seluruh gerakan motor seketika (keadaan darurat).
- **Klik angka pada lintasan rel** — Menggerakkan motor langsung ke angka tersebut
  (misal klik `8` → motor menuju 8.0 m).

> Indikator sensor: lampu **Sensor 5m (Zero)** dan **Sensor 17m (Home)** menyala saat
> motor tepat pada titik tersebut.

---

## 5. Menjalankan Pengujian (Naik / Turun)

1. Pastikan sudah **terhubung** (lihat bagian 2).
2. Pilih **mode pengujian** pada menu kiri (KALIBRASI, TERA ULANG, EVALUASI AKURASI,
   EVALUASI DISKRIMINASI).
3. **Centang titik uji** yang ingin diuji pada tabel (kolom *Uji*). Gunakan
   **"Pilih Semua Titik"** untuk semua titik 5–17 m.
   > Catatan: pada mode **TERA ULANG** maksimal 5 titik dapat dipilih.
4. Klik **PENGUJIAN NAIK** atau **PENGUJIAN TURUN** di toolbar bawah.
   - Motor bergerak dari titik terendah menuju tertinggi (NAIK), atau sebaliknya (TURUN).
   - Di setiap titik muncul jendela **INPUT HASIL PENGUJIAN** — isi nilai pembacaan
     standar, lalu **Simpan** (Enter) untuk lanjut, atau **Batal** (Esc) untuk melompati.
5. Status "Sekuens Motor Sedang Berjalan..." tampil selama proses; selesai kembali ke
   "Controller Siap Menerima Perintah TCP".

> Selama sekuens berjalan, tombol pengujian lain tidak dapat dimulai ulang.

---

## 6. Data, Preview, dan Ekspor

- **Data tabel** — masukkan/ubah nilai ALG (Naik/Turun) atau Std dengan tombol
  **EDIT NAIK/TURUN** dan **EDIT STD** di toolbar bawah, lalu **KUNCI** kembali bila selesai.
- **PREVIEW** — lihat laporan hasil uji sebelum diekspor.
- **Ekspor** — dari jendela preview, klik ekspor untuk menghasilkan file CSV
  (nama file mengikuti metadata instansi, mis. `Hasil_Uji_ATG_Horizontal_...csv`).
- **PENGATURAN** — ubah metadata instansi (operator, nomor seri, BKD, suhu, dll.) dan
  alamat TCP/IP.
- **Log TCP** — terminal lalu lintas data untuk diagnosa; termasuk tombol cepat
  ZERO/HOME/GET_STATUS dan kotak kirim perintah.

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
| IP perangkat tidak dikenal | Tanyakan ke tim teknis / lihat konfigurasi firmware `SlaveUDP.ino`. |

---

*Dokumen ini adalah panduan operator. Untuk detail teknis / laporan pengembangan,
lihat `docs/chat.md`.*