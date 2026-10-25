import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { register } from '../states/action.js'
import loadSweetAlert from '../../../helpers/loadSweetAlert.js'

function RegisterPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const status = useSelector((state) => state.auth.status)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const loading = status === 'loading'

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      await dispatch(register({ name, email, password })).unwrap()
      navigate('/auth/login', { replace: true })
      const Swal = await loadSweetAlert()
      void Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Pendaftaran berhasil',
        text: 'Silakan masuk dengan akun yang baru dibuat.',
        timer: 1500,
        showConfirmButton: false,
      })
    } catch (error) {
      const Swal = await loadSweetAlert()
      void Swal.fire({
        icon: 'error',
        title: 'Pendaftaran gagal',
        text: error?.message ?? 'Silakan periksa data dan koneksi.',
      })
    }
  }

  return (
    <>
      <p className="mt-2 text-sm text-slate-400">Daftar untuk menyimpan pengalaman musikmu.</p>
      <form onSubmit={handleSubmit} className="mt-7 space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-200">Nama</label>
          <input
            id="name"
            type="text"
            name="name"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
          />
        </div>
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
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-200">Kata sandi</label>
          <input
            id="password"
            type="password"
            name="password"
            autoComplete="new-password"
            minLength={6}
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
          Daftar
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">
        Sudah memiliki akun?{' '}
        <Link to="/auth/login" className="font-semibold text-violet-300 hover:text-violet-200 focus-visible:outline-none focus-visible:underline">
          Masuk
        </Link>
      </p>
    </>
  )
}

export default RegisterPage
