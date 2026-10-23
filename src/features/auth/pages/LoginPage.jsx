import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { useDispatch, useSelector } from 'react-redux'
import { login } from '../states/action.js'

function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const status = useSelector((state) => state.auth.status)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const loading = status === 'loading'

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      await dispatch(login({ email, password })).unwrap()
      navigate('/', { replace: true })
      void Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Berhasil masuk',
        text: 'Selamat datang kembali.',
        timer: 1500,
        showConfirmButton: false,
      })
    } catch (error) {
      void Swal.fire({
        icon: 'error',
        title: 'Gagal masuk',
        text: error?.message ?? 'Silakan periksa koneksi dan kredensial.',
      })
    }
  }

  return (
    <>
      <h1 className="mt-6 text-3xl font-bold">Selamat datang kembali</h1>
      <p className="mt-2 text-sm text-slate-400">Masuk untuk melanjutkan musikmu.</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-200">Email</label>
          <input
            id="email"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-200">Kata sandi</label>
          <input
            id="password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-violet-400 px-4 py-3 font-semibold text-slate-950 transition-colors hover:bg-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-wait disabled:opacity-60"
        >
          Masuk
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">
        Belum memiliki akun?{' '}
        <Link to="/auth/register" className="font-semibold text-violet-300 hover:text-violet-200 focus-visible:outline-none focus-visible:underline">
          Daftar
        </Link>
      </p>
    </>
  )
}

export default LoginPage
