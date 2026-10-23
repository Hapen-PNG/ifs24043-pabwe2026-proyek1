# Pemutar Musik Mini

Aplikasi pemutar musik berbasis React dan Vite dengan playlist, lirik tersinkron, visualizer frekuensi, dan kontrol pemutaran yang responsif.

Navigasi multi-halaman menggunakan React Router. Halaman player hanya dapat diakses setelah login; autentikasi simulasi berjalan di browser tanpa backend.

Autentikasi hanya untuk simulasi/demo: data pengguna dan sesi disimpan di browser sehingga bukan pengganti autentikasi server untuk aplikasi produksi.

## Fitur

- Pemutaran playlist dengan kontrol play/pause, lagu berikutnya/sebelumnya, shuffle, dan repeat.
- Unggah file audio dari perangkat; lagu unggahan tersedia selama halaman masih terbuka.
- Progress lagu, pengaturan volume, dan shortcut keyboard.
- Lirik tersinkron yang dapat dipilih untuk melompat ke bagian lagu.
- Visualizer frekuensi menggunakan Web Audio API.
- Preferensi volume, lagu terakhir, shuffle, repeat, dan tema disimpan di `localStorage`.
- Mode gelap dan terang.
- Halaman Beranda, Pencarian, Koleksi, dan Profil dengan navigasi responsif.
- Pencarian lagu, artis, dan album dengan autocomplete, filter, pengurutan, dan riwayat per pengguna.
- Koleksi lagu favorit dan playlist pengguna yang dapat dibuat, diubah, dihapus, dan diputar.
- Profil pengguna dengan statistik pemutaran, pengaturan akun, dan pengelolaan kata sandi.
- Login/register simulasi dan akun demo (`demo@musik.com` / `demo123`).

## Menjalankan secara lokal

Persyaratan: Node.js dan npm.

```bash
npm install
npm run dev
```

Buka URL lokal yang dicetak Vite di terminal.

Untuk mencoba akun demo, gunakan email `demo@musik.com` dan kata sandi `demo123`. Halaman login dan register bersifat publik; halaman lain memerlukan login.

| Akses | Halaman | Path |
|---|---|---|
| Publik | Masuk | `/login` |
| Publik | Daftar | `/register` |
| Terproteksi | Beranda | `/` |
| Terproteksi | Pencarian | `/search` |
| Terproteksi | Koleksi | `/library` |
| Terproteksi | Profil | `/profile` |
| Publik | Tidak ditemukan | Path lain |

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

## Deploy ke Netlify

Konfigurasi Netlify tersedia di `netlify.toml`: build menggunakan `npm run build`, hasil diterbitkan dari `dist`, route SPA diarahkan ke `index.html`, dan aset build mendapat cache immutable. File audio di `/audio/*` diberi header `Accept-Ranges` untuk mendukung permintaan byte-range. Versi Node deploy disetel ke `24.21.0`, sama dengan versi di lingkungan pengembangan proyek ini. File `public/_redirects` dan `public/_headers` menyediakan aturan yang sama di dalam `dist`, termasuk saat deploy dengan drag and drop yang tidak membaca `netlify.toml`.

### Melalui GitHub

1. Push proyek ke repository GitHub.
2. Masuk ke [Netlify](https://www.netlify.com/) dan pilih **Add new site → Import an existing project**.
3. Hubungkan GitHub dan pilih repository proyek.
4. Netlify membaca pengaturan build dan versi Node dari `netlify.toml`. Pastikan build command `npm run build` dan publish directory `dist`.
5. Pilih **Deploy site**. Deployment selanjutnya berjalan otomatis saat perubahan di-push ke branch yang terhubung.

### Drag and drop folder `dist`

1. Jalankan `npm run build` secara lokal.
2. Buka halaman [Netlify Drop](https://app.netlify.com/drop).
3. Seret folder `dist` hasil build ke halaman tersebut.

Cara ini menerbitkan hasil build yang sudah dibuat. Untuk build ulang otomatis, gunakan deploy melalui repository atau Netlify CLI.

### Netlify CLI

```bash
npm install
npm run build
npx netlify-cli login
npx netlify-cli deploy --prod --dir=dist
```

Saat diminta, pilih atau buat site Netlify. Untuk melakukan deploy preview terlebih dahulu, jalankan `npx netlify-cli deploy --dir=dist`; gunakan URL preview yang ditampilkan untuk memeriksa site, lalu deploy production dengan perintah `--prod`.
