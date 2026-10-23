import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
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

function Profile() {
  const {
    user,
    updateProfile,
    changePassword,
    logout,
    deleteAccount,
  } = useAuth()
  const { favoriteSongs, playlists } = useLibrary()
  const { songs, volume, setVolume, totalPlayCount, topPlayedSongs, playCounts } =
    usePlayer()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [name, setName] = useState(user?.name ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const handleProfileSubmit = (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setSavingProfile(true)
    try {
      updateProfile(name, bio)
      setMessage('Profil berhasil diperbarui.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Profil gagal diperbarui.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setSavingPassword(true)
    try {
      await changePassword(oldPassword, newPassword, confirmPassword)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMessage('Kata sandi berhasil diganti.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Kata sandi gagal diganti.')
    } finally {
      setSavingPassword(false)
    }
  }

  const clearSearchHistory = () => {
    try {
      window.localStorage.removeItem(
        `mini-music-player:search-history:${user?.id ?? user?.email ?? 'anonymous'}`,
      )
      setMessage('Riwayat pencarian berhasil dihapus.')
      setError('')
    } catch (cause) {
      console.error('Gagal menghapus riwayat pencarian.', cause)
      setError('Riwayat pencarian tidak dapat dihapus.')
      setMessage('')
    }
  }

  const handleLogout = () => {
    try {
      logout()
      navigate('/login', { replace: true })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Gagal keluar dari akun.')
    }
  }

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      'Hapus akun dan seluruh data lokal akun ini? Tindakan ini tidak dapat dibatalkan.',
    )
    if (!confirmed) return
    try {
      deleteAccount()
      navigate('/register', { replace: true })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Akun gagal dihapus.')
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
      {message && (
        <p role="status" aria-live="polite" className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-300">
          {message}
        </p>
      )}

      <section className="flex flex-wrap items-center gap-5 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div
          aria-label={`Avatar ${getInitials(user?.name)}`}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 text-2xl font-bold text-white shadow-lg shadow-violet-950/40"
        >
          {getInitials(user?.name)}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-2xl font-bold text-white">{user?.name}</h2>
          <p className="mt-1 truncate text-slate-400">{user?.email}</p>
          <p className="mt-2 text-sm text-slate-500">Bergabung {formatDate(user?.joinedAt)}</p>
          {user?.bio && <p className="mt-3 max-w-2xl text-sm text-slate-300">{user.bio}</p>}
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
            <label htmlFor="profile-bio" className="block text-sm font-medium text-slate-300">Bio singkat</label>
            <textarea
              id="profile-bio"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              maxLength={160}
              rows={3}
              placeholder="Ceritakan sedikit tentang diri Anda"
              className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
            />
            <p className="mt-1 text-right text-xs text-slate-500">{bio.length}/160</p>
          </div>
          <button
            type="submit"
            disabled={savingProfile}
            className="rounded-xl bg-violet-400 px-5 py-3 font-semibold text-slate-950 transition-colors hover:bg-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60"
          >
            {savingProfile ? 'Menyimpan...' : 'Simpan profil'}
          </button>
        </form>
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
          <p className="mt-1 text-sm text-slate-400">Keluar atau hapus akun dan data lokalnya.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            Keluar
          </button>
          <button
            type="button"
            onClick={handleDeleteAccount}
            className="rounded-xl bg-rose-500/15 px-4 py-2 text-sm font-semibold text-rose-300 transition-colors hover:bg-rose-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            Hapus akun
          </button>
        </div>
      </section>

      <p className="pb-4 text-xs text-slate-500">
        Akun menggunakan autentikasi simulasi di browser dan bukan layanan backend.
      </p>
    </div>
  )
}

export default Profile
