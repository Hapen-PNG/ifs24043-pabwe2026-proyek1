import { configureStore } from '@reduxjs/toolkit'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import ProtectedRoute from './ProtectedRoute.jsx'
import authReducer from '../features/auth/states/reducer.js'
import usersReducer from '../features/users/states/reducer.js'

function renderProtectedRoute(token) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      users: usersReducer,
    },
    preloadedState: {
      auth: {
        token,
        isInitializing: false,
        status: 'idle',
        error: null,
      },
      users: {
        user: null,
        status: 'idle',
        error: null,
      },
    },
  })

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<p>Konten terlindungi</p>} />
          </Route>
          <Route path="/auth/login" element={<p>Halaman login</p>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
}

describe('ProtectedRoute', () => {
  it('redirects users without a token to /auth/login', () => {
    renderProtectedRoute(null)

    expect(screen.getByText('Halaman login')).toBeInTheDocument()
  })

  it('renders Outlet content when a token is present and initialization is complete', () => {
    renderProtectedRoute('test-token')

    expect(screen.getByText('Konten terlindungi')).toBeInTheDocument()
  })
})
