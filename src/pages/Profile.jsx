import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import {
  changePassword as changePasswordAction,
  logout as logoutAction,
} from '../features/auth/states/action.js'
import {
  updateCurrentUser,
  updateCurrentUserPhoto,
} from '../features/users/states/action.js'
import { useLibrary } from '../context/LibraryContext.jsx'
import { usePlayer } from '../context/PlayerContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toLocaleUpperCase())
    .join('') || '?'
}

function formatDate(value) {
  if (!value) return 'Tidak tersedia'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Tidak tersedia'
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function getPhotoUrl(photo) {
  if (!photo) return null
  if (/^https?:\/\//i.test(photo)) return photo

  try {
    const apiBase = new URL(import.meta.env.VITE_DELCOM_BASEURL)
    return new URL(photo.replace(/^\/+/, ''), apiBase.origin).href
  } catch (error) {
    console.error('URL foto profil dari API tidak valid.', error)
    return photo
  }
}

function Profile() {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.users.user)
  const userStatus = useSelector((state) => state.users.status)
  const userError = useSelector((state) => state.users.error)
  const { favoriteSongs, playlists } = useLibrary()
  const { songs, volume, setVolume, totalPlayCount, topPlayedSongs, playCounts } =
    usePlayer()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    setName(user?.name ?? '')
    setEmail(user?.email ?? '')
  }, [user?.email, user?.name])

  const showError = async (title, cause) => {
    const message = typeof cause === 'string'
      ? cause
      : cause?.message ?? 'Permintaan gagal. Silakan coba lagi.'
    setError(message)
    await Swal.fire({ icon: 'error', title, text: message })
  }

  const handleProfileSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setSavingProfile(true)
    try {
      await dispatch(updateCurrentUser({ name, email })).unwrap()
      setMessage('Profil berhasil diperbarui.')
      await Swal.fire({ icon: 'success', title: 'Profil berhasil diperbarui' })
    } catch (cause) {
      await showError('Profil gagal diperbarui', cause)
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePhotoChange = async (event) => {
    const photo = event.target.files?.[0]
    if (!photo) return
    setError('')
    setMessage('')
    try {
      await dispatch(updateCurrentUserPhoto(photo)).unwrap()
      setMessage('Foto profil berhasil diperbarui.')
      await Swal.fire({ icon: 'success', title: 'Foto profil berhasil diperbarui' })
    } catch (cause) {
      await showError('Foto profil gagal diperbarui', cause)
    } finally {
      event.target.value = ''
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setSavingPassword(true)
    try {
      await dispatch(changePasswordAction({
        password: oldPassword,
        newPassword,
        newPasswordConfirmation: confirmPassword,
      })).unwrap()
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMessage('Kata sandi berhasil diganti.')
      await Swal.fire({ icon: 'success', title: 'Kata sandi berhasil diganti' })
    } catch (cause) {
      await showError('Kata sandi gagal diganti', cause)
    } finally {
      setSavingPassword(false)
    }
  }

  const clearSearchHistory = () => {
    if (user?.id === undefined || user?.id === null) return
    try {
      window.localStorage.removeItem(
        `mini-music-player:search-history:${user.id}`,
      )
      setMessage('Riwayat pencarian berhasil dihapus.')
      setError('')
    } catch (cause) {
      console.error('Gagal menghapus riwayat pencarian.', cause)
      setError('Riwayat pencarian tidak dapat dihapus.')
      setMessage('')
    }
  }

  const handleLogout = async () => {
    try {
      await dispatch(logoutAction()).unwrap()
      await Swal.fire({
        icon: 'success',
        title: 'Berhasil keluar',
        timer: 1200,
        showConfirmButton: false,
      })
      navigate('/auth/login', { replace: true })
    } catch (cause) {
      await showError('Sesi diakhiri', cause)
      navigate('/auth/login', { replace: true })
    }
  }

  const mostPlayed = topPlayedSongs
    .map(({ id, count }) => ({
      song: songs.find((item) => String(item.id) === id),
      count,
    }))
    .filter((entry) => entry.song)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-violet-300">Akun</p>
        <h1 className="mt-2 text-3xl font-bold">Profil</h1>
      </header>

      {error && (
        <p role="alert" aria-live="polite" className="rounded-xl bg-rose-500/10 p-3 text-sm text-rose-300">
          {error}
        </p>
      )}
      {userError && !error && (
        <p role="alert" aria-live="polite" className="rounded-xl bg-rose-500/10 p-3 text-sm text-rose-300">
          {userError}
        </p>
      )}
      {message && (
        <p role="status" aria-live="polite" className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-300">
          {message}
        </p>
      )}

      <section className="flex flex-wrap items-center gap-5 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        {user?.photo ? (
          <img
            src={getPhotoUrl(user.photo)}
            alt={`Foto profil ${user.name}`}
            className="h-20 w-20 rounded-full object-cover"
          />
        ) : (
          <div
            aria-label={`Avatar ${getInitials(user?.name)}`}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 text-2xl font-bold text-white shadow-lg shadow-violet-950/40"
          >
            {getInitials(user?.name)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-2xl font-bold text-white">{user?.name}</h2>
          <p className="mt-1 truncate text-slate-400">{user?.email}</p>
          <p className="mt-2 text-sm text-slate-500">Bergabung {formatDate(user?.created_at)}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-xl font-semibold">Statistik musik</h2>
        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['Lagu favorit', favoriteSongs.length],
            ['Playlist', playlists.length],
            ['Total diputar', totalPlayCount],
            ['Top lagu', mostPlayed.length],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-slate-950/60 p-4">
              <dd className="text-2xl font-bold text-violet-200">{value}</dd>
              <dt className="mt-1 text-xs text-slate-400">{label}</dt>
            </div>
          ))}
        </dl>
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-200">3 lagu paling sering diputar</h3>
          {mostPlayed.length ? (
            <ol className="mt-3 space-y-2">
              {mostPlayed.map(({ song, count }, index) => (
                <li key={song.id} className="flex items-center gap-3 rounded-xl bg-slate-950/50 px-4 py-3">
                  <span className="text-sm font-semibold text-violet-300">{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">{song.title}</span>
                  <span className="text-xs text-slate-400">{count} kali</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm text-slate-400">Belum ada data pemutaran.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-xl font-semibold">Edit profil</h2>
        <form onSubmit={handleProfileSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="profile-name" className="block text-sm font-medium text-slate-300">Nama</label>
            <input
              id="profile-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              autoComplete="name"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
            />
          </div>
          <div>
            <label htmlFor="profile-email" className="block text-sm font-medium text-slate-300">Email</label>
            <input
              id="profile-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
            />
          </div>
          <button
            type="submit"
            disabled={savingProfile || userStatus === 'loading'}
            className="rounded-xl bg-violet-400 px-5 py-3 font-semibold text-slate-950 transition-colors hover:bg-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60"
          >
            {savingProfile || userStatus === 'loading' ? 'Menyimpan...' : 'Simpan profil'}
          </button>
        </form>
        <div className="mt-5">
          <label htmlFor="profile-photo" className="block text-sm font-medium text-slate-300">
            Foto profil
          </label>
          <input
            id="profile-photo"
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            disabled={userStatus === 'loading'}
            className="mt-2 block w-full text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-violet-400 file:px-4 file:py-2 file:font-semibold file:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:opacity-60"
          />
          <p className="mt-2 text-xs text-slate-500">Foto akan diunggah ke API Delcom.</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-xl font-semibold">Ganti kata sandi</h2>
        <form onSubmit={handlePasswordSubmit} className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="old-password" className="block text-sm font-medium text-slate-300">Kata sandi lama</label>
            <input
              id="old-password"
              type="password"
              autoComplete="current-password"
              value={oldPassword}
              onChange={(event) => setOldPassword(event.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
            />
          </div>
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-slate-300">Kata sandi baru</label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-300">Konfirmasi kata sandi</label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
            />
          </div>
          <button
            type="submit"
            disabled={savingPassword}
            className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-200 transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:opacity-60 sm:col-span-3 sm:justify-self-start"
          >
            {savingPassword ? 'Memproses...' : 'Ganti kata sandi'}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-xl font-semibold">Pengaturan</h2>
        <div className="mt-5 divide-y divide-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0">
            <div>
              <h3 className="font-medium text-white">Tema</h3>
              <p className="mt-1 text-sm text-slate-400">Mode {theme === 'dark' ? 'gelap' : 'terang'}</p>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              aria-pressed={theme === 'light'}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              Ganti tema
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div>
              <label htmlFor="default-volume" className="font-medium text-white">Volume bawaan</label>
              <p className="mt-1 text-sm text-slate-400">Disimpan untuk pemutaran berikutnya</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                id="default-volume"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(event) => setVolume(Number(event.target.value))}
                className="accent-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              />
              <output htmlFor="default-volume" className="w-12 text-right text-sm tabular-nums text-slate-300">
                {Math.round(volume * 100)}%
              </output>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div>
              <h3 className="font-medium text-white">Riwayat pencarian</h3>
              <p className="mt-1 text-sm text-slate-400">Hapus pencarian tersimpan untuk akun ini</p>
            </div>
            <button
              type="button"
              onClick={clearSearchHistory}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 transition-colors hover:border-rose-400/50 hover:bg-rose-500/10 hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              Hapus riwayat pencarian
            </button>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-900/50 bg-slate-900 p-6">
        <div>
          <h2 className="font-semibold text-white">Zona akun</h2>
          <p className="mt-1 text-sm text-slate-400">
            Penghapusan akun belum tersedia di dokumentasi API Delcom.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            Keluar
          </button>
        </div>
      </section>

      <p className="pb-4 text-xs text-slate-500">
        Profil dan autentikasi dikelola melalui API Delcom. Bio dan penghapusan akun tidak ditampilkan karena endpoint-nya tidak dijelaskan dalam dokumentasi.
      </p>
    </div>
  )
}

export default Profile
