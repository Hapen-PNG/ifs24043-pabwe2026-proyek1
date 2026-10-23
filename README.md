# Pemutar Musik Mini

Aplikasi pemutar musik berbasis React dan Vite dengan playlist, lirik tersinkron, visualizer frekuensi, dan kontrol pemutaran yang responsif. Autentikasi menggunakan API Delcom melalui Redux Toolkit.

Navigasi multi-halaman menggunakan React Router. Halaman player hanya dapat diakses setelah login. Token sesi disimpan di `localStorage` untuk mempertahankan login saat halaman dimuat ulang.

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
- Pendaftaran, login, profil, perubahan kata sandi, dan logout melalui API Delcom.

## Menjalankan secara lokal

Persyaratan: Bun dan akses ke Delcom Open API.

```bash
bun install
bun run dev
```

Buka URL lokal yang dicetak Vite di terminal.

Konfigurasi API ada di `.env` pada root proyek:

```dotenv
VITE_DELCOM_BASEURL=https://open-api.delcom.org/api/v1
```

`VITE_DELCOM_BASEURL` adalah satu-satunya variabel environment aplikasi. Karena variabel berawalan `VITE_` tersedia pada bundle browser, jangan menyimpan rahasia di dalamnya. `.env` tercantum di `.gitignore`; atur variabel yang sama pada environment deployment. Halaman login dan register bersifat publik; halaman lain memerlukan token API.

| Akses | Halaman | Path |
|---|---|---|
| Publik | Masuk | `/auth/login` |
| Publik | Daftar | `/auth/register` |
| Terproteksi | Beranda | `/` |
| Terproteksi | Pencarian | `/search` |
| Terproteksi | Koleksi | `/library` |
| Terproteksi | Profil | `/profile` |
| Publik | Tidak ditemukan | Path lain |

Sumber halaman utama: `src/pages/`. Modul autentikasi berada di `src/features/auth/`, profil API di `src/features/users/`, helper fetch di `src/helpers/api.js`, dan konfigurasi Redux di `src/app/store.js`.

Endpoint autentikasi dan bentuk respons mengikuti dokumentasi resmi [Delcom Open API](https://open-api.delcom.org/docs/1.0/api-auth); endpoint profil, foto profil, dan ubah kata sandi mengikuti [Users Endpoint](https://open-api.delcom.org/docs/1.0/api-users). Data profil dimuat dari API saat aplikasi dibuka dengan token yang tersimpan. API tidak mendokumentasikan penghapusan akun atau bio profil, sehingga kedua fitur tersebut tidak disediakan.

Untuk memeriksa build produksi secara lokal:

```bash
bun run build
bun run preview
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
5. Tambahkan `VITE_DELCOM_BASEURL` dengan base URL API yang digunakan saat build, lalu pilih **Deploy**.
6. Setelah deploy, setiap push ke branch yang terhubung akan memicu deployment baru.

Vercel mendeteksi konfigurasi Vite secara otomatis; tidak diperlukan konfigurasi rewrite khusus untuk aplikasi ini.

## Deploy ke Netlify

Konfigurasi Netlify tersedia di `netlify.toml`: build menggunakan `npm run build`, hasil diterbitkan dari `dist`, route SPA diarahkan dari `/*` ke `/index.html` dengan status 200, dan aset build mendapat cache immutable. File audio di `/audio/*` diberi header `Accept-Ranges` untuk mendukung permintaan byte-range. Versi Node deploy disetel ke `24.21.0`. File `public/_redirects` dan `public/_headers` menyediakan aturan yang sama di dalam `dist`, termasuk saat deploy dengan drag and drop yang tidak membaca `netlify.toml`.

### Melalui GitHub

1. Push proyek ke repository GitHub.
2. Masuk ke [Netlify](https://www.netlify.com/) dan pilih **Add new site → Import an existing project**.
3. Hubungkan GitHub dan pilih repository proyek.
4. Netlify membaca pengaturan build dan versi Node dari `netlify.toml`. Pastikan build command `npm run build` dan publish directory `dist`, lalu tambahkan `VITE_DELCOM_BASEURL` pada environment variables site.
5. Pilih **Deploy site**. Deployment selanjutnya berjalan otomatis saat perubahan di-push ke branch yang terhubung.

### Drag and drop folder `dist`

1. Jalankan `npm run build` secara lokal.
2. Buka halaman [Netlify Drop](https://app.netlify.com/drop).
3. Seret folder `dist` hasil build ke halaman tersebut.

Cara ini menerbitkan hasil build yang sudah dibuat. Untuk build ulang otomatis, gunakan deploy melalui repository atau Netlify CLI.

### Netlify CLI

```bash
bun install
bun run build
bunx netlify-cli login
bunx netlify-cli deploy --prod --dir=dist
```

Saat diminta, pilih atau buat site Netlify dan pastikan `VITE_DELCOM_BASEURL` dikonfigurasi sebelum build. Untuk melakukan deploy preview terlebih dahulu, jalankan `bunx netlify-cli deploy --dir=dist`; gunakan URL preview yang ditampilkan untuk memeriksa site, lalu deploy production dengan perintah `--prod`.
