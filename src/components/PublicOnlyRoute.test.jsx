import { configureStore } from '@reduxjs/toolkit'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import authReducer from '../features/auth/states/reducer.js'
import usersReducer from '../features/users/states/reducer.js'
import PublicOnlyRoute from './PublicOnlyRoute.jsx'

function renderRoute(authState, initialPath = '/auth/login') {
  const store = configureStore({
    reducer: { auth: authReducer, users: usersReducer },
    preloadedState: {
      auth: authState,
      users: { user: null, status: 'idle', error: null },
    },
  })

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/auth/login" element={<p>Konten login</p>} />
          </Route>
          <Route path="/" element={<p>Beranda</p>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
}

describe('PublicOnlyRoute', () => {
  it('renders public child content when there is no token', () => {
    renderRoute({ token: null, isInitializing: false, status: 'idle', error: null })

    expect(screen.getByText('Konten login')).toBeInTheDocument()
  })

  it('redirects authenticated users away from the login route', () => {
    renderRoute({ token: 'test-token', isInitializing: false, status: 'idle', error: null })

    expect(screen.getByText('Beranda')).toBeInTheDocument()
  })

  it('shows a session loading state while the token is being restored', () => {
    renderRoute({ token: 'test-token', isInitializing: true, status: 'idle', error: null })

    expect(screen.getByRole('heading', { name: 'Memuat sesi pengguna...' })).toBeInTheDocument()
    expect(screen.getAllByRole('main')).toHaveLength(1)
  })
})
