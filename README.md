# NadaRuang

NadaRuang adalah aplikasi pemutar musik berbasis React dan Vite. Frontend
menangani halaman, pemutaran audio, autentikasi Delcom, katalog musik, dan
antarmuka koleksi/aktivitas.

## Arsitektur

- `frontend/`: aplikasi React, React Router, Redux Toolkit, dan pemutar audio.
  Auth dan profil akun menggunakan Delcom Open API; katalog serta fitur data
  pengguna menggunakan REST API backend.
- Backend REST diharapkan tersedia secara terpisah pada `VITE_API_BASEURL`.
  Backend menyediakan katalog lagu, favorit, playlist, riwayat pemutaran,
  statistik, dan riwayat pencarian. Source backend tidak termasuk dalam
  checkout repository ini.
- Autentikasi API Delcom menggunakan `VITE_DELCOM_BASEURL`.

## Menjalankan frontend

Persyaratan: Bun dan akses ke Delcom Open API. Jalankan:

```powershell
cd frontend
bun install
bun run dev
```

Buat `frontend/.env` dari `frontend/.env.example` dan sesuaikan nilai:

```dotenv
VITE_DELCOM_BASEURL=https://open-api.delcom.org/api/v1
VITE_API_BASEURL=http://localhost:4000/api
```

`VITE_API_BASEURL` harus menunjuk ke backend REST yang aktif. Untuk memeriksa
build produksi:

```powershell
bun run build
```

Hasil build berada di `frontend/public_html/` dan tidak dilacak Git.

## Halaman

| Akses | Halaman | Path |
|---|---|---|
| Publik | Masuk | `/auth/login` |
| Publik | Daftar | `/auth/register` |
| Terproteksi | Beranda | `/` |
| Terproteksi | Pencarian | `/search` |
| Terproteksi | Koleksi | `/library` |
| Terproteksi | Profil | `/profile` |

## API yang digunakan

| Layanan | Tujuan |
|---|---|
| Delcom Open API | Register/login, profil, pembaruan profil/foto, ganti kata sandi |
| Backend `/api/songs` | Katalog lagu dan lirik |
| Backend `/api/favorites` | Membaca dan mengubah lagu favorit |
| Backend `/api/playlists` | Membuat dan mengelola playlist beserta lagu |
| Backend `/api/recent` | Riwayat pemutaran |
| Backend `/api/stats` | Statistik pemutaran |
| Backend `/api/search-history` | Riwayat pencarian |

Backend REST memakai endpoint health check `GET /api/health`. Saat layanan
backend tidak tersedia, katalog frontend menggunakan data bawaan
`frontend/src/data/songs.js`; data pengguna yang gagal dimuat ditampilkan
sebagai kosong.

## Deploy ke Netlify

Repository ini menyediakan `netlify.toml` di root. Konfigurasinya memakai
`frontend` sebagai base, `bun run build` sebagai perintah build,
`public_html` sebagai direktori publik, serta redirect SPA untuk semua path.
Atur variabel `VITE_DELCOM_BASEURL` dan `VITE_API_BASEURL` pada environment
build Netlify agar mengarah ke layanan yang benar.
