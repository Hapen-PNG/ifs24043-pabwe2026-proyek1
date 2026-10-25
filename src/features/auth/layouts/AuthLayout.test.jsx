import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import AuthLayout from './AuthLayout.jsx'

function renderAuthLayout(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<p>Form login</p>} />
          <Route path="register" element={<p>Form daftar</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('AuthLayout', () => {
  it('renders the login heading, outlet, and one main landmark', () => {
    renderAuthLayout('/auth/login')

    expect(screen.getByRole('heading', { level: 1, name: 'Masuk' })).toBeInTheDocument()
    expect(screen.getByText('Form login')).toBeInTheDocument()
    expect(screen.getAllByRole('main')).toHaveLength(1)
  })

  it('renders the registration heading and outlet', () => {
    renderAuthLayout('/auth/register')

    expect(screen.getByRole('heading', { level: 1, name: 'Daftar' })).toBeInTheDocument()
    expect(screen.getByText('Form daftar')).toBeInTheDocument()
    expect(screen.getAllByRole('main')).toHaveLength(1)
  })
})
