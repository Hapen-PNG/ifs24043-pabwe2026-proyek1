import { configureStore } from '@reduxjs/toolkit'
import { act, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.jsx'
import { fetchCurrentUser } from './features/users/states/action.js'

vi.mock('./features/users/states/action.js', () => ({
  fetchCurrentUser: vi.fn(() => ({ type: 'users/fetchCurrentUser' })),
}))

vi.mock('./components/PublicOnlyRoute.jsx', async () => {
  const { createElement } = await import('react')
  const { Outlet } = await import('react-router-dom')
  return { default: () => createElement(Outlet) }
})
vi.mock('./components/ProtectedRoute.jsx', async () => {
  const { createElement } = await import('react')
  const { Outlet } = await import('react-router-dom')
  return { default: () => createElement(Outlet) }
})
vi.mock('./features/auth/layouts/AuthLayout.jsx', async () => {
  const { createElement } = await import('react')
  const { Outlet } = await import('react-router-dom')
  return { default: () => createElement(Outlet) }
})

vi.mock('./components/Layout.jsx', async () => {
  const { createElement } = await import('react')
  const { Outlet } = await import('react-router-dom')
  return { default: () => createElement('div', null, createElement(Outlet)) }
})
vi.mock('./components/ProtectedApp.jsx', async () => {
  const { createElement } = await import('react')
  const { Outlet } = await import('react-router-dom')
  return { default: () => createElement(Outlet) }
})
vi.mock('./features/auth/pages/LoginPage.jsx', () => ({ default: () => <p>Login screen</p> }))
vi.mock('./features/auth/pages/RegisterPage.jsx', () => ({ default: () => <p>Register screen</p> }))
vi.mock('./pages/Home.jsx', () => ({ default: () => <p>Home screen</p> }))
vi.mock('./pages/Library.jsx', () => ({ default: () => <p>Library screen</p> }))
vi.mock('./pages/NotFound.jsx', () => ({ default: () => <p>Not found screen</p> }))
vi.mock('./pages/Profile.jsx', () => ({ default: () => <p>Profile screen</p> }))
vi.mock('./pages/Search.jsx', () => ({ default: () => <p>Search screen</p> }))

function makeStore(initialAuth = { token: null, isInitializing: false }) {
  return configureStore({
    reducer: {
      auth(state = initialAuth, action) {
        if (action.type === 'test/setAuth') return action.payload
        return state
      },
      users: (state = { user: null }) => state,
    },
  })
}

function renderApp(path, store = makeStore()) {
  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>
      </Provider>,
    ),
  }
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the requested route and updates the document title', async () => {
    renderApp('/search')

    expect(await screen.findByText('Search screen')).toBeInTheDocument()
    await waitFor(() => expect(document.title).toBe('Pencarian | NadaRuang'))
    expect(fetchCurrentUser).not.toHaveBeenCalled()
  })

  it('renders auth routes and titles', async () => {
    renderApp('/auth/register')

    expect(await screen.findByText('Register screen')).toBeInTheDocument()
    await waitFor(() => expect(document.title).toBe('Daftar | NadaRuang'))
  })

  it('redirects unknown paths to the 404 route and default title', async () => {
    renderApp('/unknown')

    expect(await screen.findByText('Not found screen')).toBeInTheDocument()
    await waitFor(() => expect(document.title).toBe('Halaman tidak ditemukan | NadaRuang'))
  })

  it('requests the authenticated profile once until the token is cleared', async () => {
    const store = makeStore({ token: 'session', isInitializing: true })
    renderApp('/', store)

    await waitFor(() => expect(fetchCurrentUser).toHaveBeenCalledOnce())
    act(() => {
      store.dispatch({ type: 'test/setAuth', payload: { token: 'session', isInitializing: true } })
    })
    expect(fetchCurrentUser).toHaveBeenCalledOnce()

    act(() => {
      store.dispatch({ type: 'test/setAuth', payload: { token: null, isInitializing: false } })
    })
    act(() => {
      store.dispatch({ type: 'test/setAuth', payload: { token: 'next-session', isInitializing: true } })
    })
    await waitFor(() => expect(fetchCurrentUser).toHaveBeenCalledTimes(2))
  })
})
