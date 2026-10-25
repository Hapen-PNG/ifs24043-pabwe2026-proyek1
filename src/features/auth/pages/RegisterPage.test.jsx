import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import authReducer from '../states/reducer.js'
import usersReducer from '../../../features/users/states/reducer.js'
import RegisterPage from './RegisterPage.jsx'

const { loginApi, registerApi, swalFire } = vi.hoisted(() => ({
  loginApi: vi.fn(),
  registerApi: vi.fn(),
  swalFire: vi.fn(),
}))

vi.mock('../api/authApi.js', () => ({
  loginApi,
  registerApi,
  logoutApi: vi.fn(),
  changePasswordApi: vi.fn(),
}))

vi.mock('sweetalert2', () => ({
  default: { fire: swalFire },
}))

function renderRegisterPage() {
  const store = configureStore({
    reducer: { auth: authReducer, users: usersReducer },
    preloadedState: {
      auth: { token: null, isInitializing: false, status: 'idle', error: null },
      users: { user: null, status: 'idle', error: null },
    },
  })

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/auth/register']}>
        <Routes>
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/login" element={<p>Halaman login</p>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders name, email, and password inputs', () => {
    renderRegisterPage()

    expect(screen.getByLabelText('Nama')).toHaveAttribute('type', 'text')
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText('Kata sandi')).toHaveAttribute('type', 'password')
    expect(screen.getByRole('button', { name: 'Daftar' })).toHaveAttribute('type', 'submit')
  })

  it('submits the entered name, email, and password to the register action', async () => {
    registerApi.mockResolvedValue({ status: 'success' })
    renderRegisterPage()

    fireEvent.change(screen.getByLabelText('Nama'), {
      target: { value: 'Nara' },
    })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'nara@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Kata sandi'), {
      target: { value: 'secret123' },
    })
    fireEvent.submit(screen.getByLabelText('Nama').closest('form'))

    await waitFor(() => {
      expect(registerApi).toHaveBeenCalledWith({
        name: 'Nara',
        email: 'nara@example.com',
        password: 'secret123',
      })
    })
  })

  it('shows the API error message when registration fails', async () => {
    registerApi.mockRejectedValue(new Error('Email sudah digunakan'))
    renderRegisterPage()

    fireEvent.change(screen.getByLabelText('Nama'), {
      target: { value: 'Nara' },
    })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'nara@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Kata sandi'), {
      target: { value: 'secret123' },
    })
    fireEvent.submit(screen.getByLabelText('Nama').closest('form'))

    await waitFor(() => {
      expect(swalFire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'error',
          title: 'Pendaftaran gagal',
          text: 'Email sudah digunakan',
        }),
      )
    })
  })
})
