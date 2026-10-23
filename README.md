# Pemutar Musik Mini

Aplikasi pemutar musik berbasis React dan Vite dengan playlist, lirik tersinkron, visualizer frekuensi, dan kontrol pemutaran yang responsif.

## Fitur

- Pemutaran playlist dengan kontrol play/pause, lagu berikutnya/sebelumnya, shuffle, dan repeat.
- Unggah file audio dari perangkat; lagu unggahan tersedia selama halaman masih terbuka.
- Progress lagu, pengaturan volume, dan shortcut keyboard.
- Lirik tersinkron yang dapat dipilih untuk melompat ke bagian lagu.
- Visualizer frekuensi menggunakan Web Audio API.
- Preferensi volume, lagu terakhir, shuffle, repeat, dan tema disimpan di `localStorage`.
- Mode gelap dan terang.

## Menjalankan secara lokal

Persyaratan: Node.js dan npm.

```bash
npm install
npm run dev
```

Buka URL lokal yang dicetak Vite di terminal.

Untuk memeriksa build produksi secara lokal:

```bash
npm run build
npm run preview
```

File audio dan gambar statis opsional dapat ditempatkan di `public/audio` dan `public/images`. Lagu bawaan didefinisikan di `src/data/songs.js`. Audio yang diunggah pengguna tidak disimpan sebagai file proyek dan perlu diunggah kembali setelah halaman dimuat ulang.

## Shortcut keyboard

- `Spasi`: putar/jeda.
- `Panah kiri/kanan`: mundur/maju 5 detik.
- `Panah atas/bawah`: naik/turunkan volume.

Shortcut tidak aktif saat fokus berada di kontrol formulir, tombol, atau area yang dapat diedit.

## Deploy ke Vercel

1. Push proyek ke repository GitHub, GitLab, atau Bitbucket.
2. Masuk ke [Vercel](https://vercel.com/) dan pilih **Add New... → Project**.
3. Import repository proyek ini.
4. Pastikan pengaturan framework **Vite** dengan:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install` (default)
5. Pilih **Deploy**. Tidak ada environment variable khusus yang diperlukan.
6. Setelah deploy, setiap push ke branch yang terhubung akan memicu deployment baru.

Vercel mendeteksi konfigurasi Vite secara otomatis; tidak diperlukan konfigurasi rewrite khusus untuk aplikasi ini.
