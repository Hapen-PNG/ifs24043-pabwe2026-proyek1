import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)
const USERS_KEY = 'mini-music-player:users'
const SESSION_KEY = 'mini-music-player:user'
const DEMO_EMAIL = 'demo@musik.com'
const DEMO_PASSWORD_HASH =
  'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791'
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function readStoredUsers() {
  try {
    const savedUsers = window.localStorage.getItem(USERS_KEY)
    const users = savedUsers ? JSON.parse(savedUsers) : [
      {
        id: 'demo',
        name: 'Pengguna Demo',
        email: DEMO_EMAIL,
        bio: '',
        joinedAt: '2026-10-23T00:00:00.000Z',
        passwordHash: DEMO_PASSWORD_HASH,
      },
    ]

    if (!Array.isArray(users)) {
      throw new Error('Data akun tersimpan tidak valid.')
    }

    if (!savedUsers) {
      window.localStorage.setItem(USERS_KEY, JSON.stringify(users))
    }
    return users
  } catch (error) {
    console.error('Gagal membaca daftar pengguna.', error)
    return [
      {
        id: 'demo',
        name: 'Pengguna Demo',
        email: DEMO_EMAIL,
        bio: '',
        joinedAt: '2026-10-23T00:00:00.000Z',
        passwordHash: DEMO_PASSWORD_HASH,
      },
    ]
  }
}

async function hashPassword(password) {
  if (!window.crypto?.subtle) {
    throw new Error('Browser tidak mendukung autentikasi aman. Gunakan HTTPS.')
  }

  const bytes = new TextEncoder().encode(password)
  const hash = await window.crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(hash), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}

function readSession() {
  try {
    const user = window.localStorage.getItem(SESSION_KEY)
    return user ? JSON.parse(user) : null
  } catch (error) {
    console.error('Gagal membaca sesi pengguna.', error)
    return null
  }
}

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(readStoredUsers)
  const [user, setUser] = useState(readSession)

  useEffect(() => {
    try {
      window.localStorage.setItem(USERS_KEY, JSON.stringify(users))
    } catch (error) {
      console.error('Gagal menyimpan daftar pengguna.', error)
    }
  }, [users])

  const register = async (name, email, password) => {
    const normalizedName = name.trim()
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedName) throw new Error('Nama wajib diisi.')
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      throw new Error('Masukkan alamat email yang valid.')
    }
    if (password.length < 6) {
      throw new Error('Kata sandi harus terdiri dari minimal 6 karakter.')
    }
    if (users.some((account) => account.email === normalizedEmail)) {
      throw new Error('Email tersebut sudah terdaftar.')
    }

    const account = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: normalizedName,
      email: normalizedEmail,
      bio: '',
      joinedAt: new Date().toISOString(),
      passwordHash: await hashPassword(password),
    }
    const nextUsers = [...users, account]
    const session = {
      id: account.id,
      name: account.name,
      email: account.email,
      bio: account.bio,
      joinedAt: account.joinedAt,
    }
    try {
      window.localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers))
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    } catch (error) {
      console.error('Gagal menyimpan akun baru.', error)
      throw new Error('Akun tidak dapat disimpan di browser ini.')
    }
    setUsers(nextUsers)
    setUser(session)
  }

  const login = async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase()
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      throw new Error('Masukkan alamat email yang valid.')
    }
    if (password.length < 6) {
      throw new Error('Kata sandi harus terdiri dari minimal 6 karakter.')
    }

    const account = users.find((entry) => entry.email === normalizedEmail)
    if (!account || (await hashPassword(password)) !== account.passwordHash) {
      throw new Error('Email atau kata sandi tidak cocok.')
    }

    const session = {
      id: account.id,
      name: account.name,
      email: account.email,
      bio: account.bio ?? '',
      joinedAt: account.joinedAt ?? '',
    }
    try {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    } catch (error) {
      console.error('Gagal menyimpan sesi pengguna.', error)
      throw new Error('Sesi tidak dapat disimpan di browser ini.')
    }
    setUser(session)
  }

  const logout = () => {
    try {
      window.localStorage.removeItem(SESSION_KEY)
    } catch (error) {
      console.error('Gagal menghapus sesi pengguna.', error)
      throw new Error('Tidak dapat mengakhiri sesi. Silakan coba lagi.')
    }
    setUser(null)
  }

  const updateProfile = (name, bio) => {
    const normalizedName = name.trim()
    const normalizedBio = bio.trim()
    if (!normalizedName) throw new Error('Nama wajib diisi.')
    if (!user) throw new Error('Tidak ada pengguna yang sedang masuk.')

    const nextUser = { ...user, name: normalizedName, bio: normalizedBio }
    const nextUsers = users.map((account) =>
      account.id === user.id
        ? { ...account, name: normalizedName, bio: normalizedBio }
        : account,
    )
    try {
      window.localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers))
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser))
    } catch (error) {
      console.error('Gagal menyimpan perubahan profil.', error)
      throw new Error('Perubahan profil tidak dapat disimpan.')
    }
    setUsers(nextUsers)
    setUser(nextUser)
  }

  const changePassword = async (oldPassword, newPassword, confirmation) => {
    if (!user) throw new Error('Tidak ada pengguna yang sedang masuk.')
    if (newPassword.length < 6) {
      throw new Error('Kata sandi baru harus minimal 6 karakter.')
    }
    if (newPassword !== confirmation) {
      throw new Error('Konfirmasi kata sandi baru tidak cocok.')
    }
    const account = users.find((entry) => entry.id === user.id)
    if (!account || (await hashPassword(oldPassword)) !== account.passwordHash) {
      throw new Error('Kata sandi lama tidak benar.')
    }
    const passwordHash = await hashPassword(newPassword)
    const nextUsers = users.map((entry) =>
      entry.id === user.id ? { ...entry, passwordHash } : entry,
    )
    try {
      window.localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers))
    } catch (error) {
      console.error('Gagal menyimpan kata sandi baru.', error)
      throw new Error('Kata sandi baru tidak dapat disimpan.')
    }
    setUsers(nextUsers)
  }

  const deleteAccount = () => {
    if (!user) throw new Error('Tidak ada pengguna yang sedang masuk.')
    const nextUsers = users.filter((account) => account.id !== user.id)
    try {
      window.localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers))
      window.localStorage.removeItem(SESSION_KEY)
      const prefix = 'mini-music-player:'
      for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
        const key = window.localStorage.key(index)
        if (
          key?.startsWith(prefix) &&
          key.endsWith(`:${user.id}`) &&
          key !== USERS_KEY &&
          key !== SESSION_KEY
        ) {
          window.localStorage.removeItem(key)
        }
      }
    } catch (error) {
      console.error('Gagal menghapus data akun.', error)
      throw new Error('Data akun tidak dapat dihapus sepenuhnya.')
    }
    setUsers(nextUsers)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        register,
        login,
        logout,
        updateProfile,
        changePassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('useAuth harus digunakan di dalam AuthProvider.')
  return auth
}
