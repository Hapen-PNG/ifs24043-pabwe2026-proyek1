import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import authReducer from '../states/reducer.js'
import usersReducer from '../../../features/users/states/reducer.js'
import LoginPage from './LoginPage.jsx'

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

function renderLoginPage() {
  const store = configureStore({
    reducer: { auth: authReducer, users: usersReducer },
    preloadedState: {
      auth: { token: null, isInitializing: false, status: 'idle', error: null },
      users: { user: null, status: 'idle', error: null },
    },
  })

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/auth/login']}>
        <Routes>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/" element={<p>Beranda</p>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders email and password inputs', () => {
    renderLoginPage()

    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText('Kata sandi')).toHaveAttribute('type', 'password')
    expect(screen.getByRole('button', { name: 'Masuk' })).toHaveAttribute('type', 'submit')
  })

  it('submits the entered email and password to the login action', async () => {
    loginApi.mockResolvedValue({
      token: 'test-token',
      user: { id: 1, name: 'Nara' },
    })
    renderLoginPage()

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'nara@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Kata sandi'), {
      target: { value: 'secret123' },
    })
    fireEvent.submit(screen.getByLabelText('Email').closest('form'))

    await waitFor(() => {
      expect(loginApi).toHaveBeenCalledWith({
        email: 'nara@example.com',
        password: 'secret123',
      })
    })
  })

  it('shows the API error message when login fails', async () => {
    loginApi.mockRejectedValue(new Error('Email atau kata sandi salah'))
    renderLoginPage()

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'nara@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Kata sandi'), {
      target: { value: 'wrong-password' },
    })
    fireEvent.submit(screen.getByLabelText('Email').closest('form'))

    await waitFor(() => {
      expect(swalFire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'error',
          title: 'Gagal masuk',
          text: 'Email atau kata sandi salah',
        }),
      )
    })
  })
})
