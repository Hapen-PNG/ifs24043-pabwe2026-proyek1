import apiFetch from '../../../helpers/api.js'

function requireSuccess(response) {
  if (response?.status !== 'success') {
    throw new Error(response?.message || 'Permintaan autentikasi gagal.')
  }
  return response
}

export async function registerApi({ name, email, password }) {
  const response = await apiFetch('/auth/register', {
    method: 'POST',
    body: { name, email, password },
  })
  return requireSuccess(response)
}

export async function loginApi({ email, password }) {
  const response = requireSuccess(
    await apiFetch('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),
  )
  const token = response.data?.token
  const user = response.data?.user

  if (typeof token !== 'string' || !token || !user) {
    throw new Error('Respons login API tidak memuat token dan data pengguna.')
  }

  try {
    window.localStorage.setItem('token', token)
  } catch (error) {
    console.error('Token API tidak dapat disimpan.', error)
    throw new Error('Sesi tidak dapat disimpan di browser ini.')
  }

  return { token, user }
}

export async function logoutApi() {
  try {
    const response = await apiFetch('/auth/logout', { method: 'POST' })
    return requireSuccess(response)
  } finally {
    window.localStorage.removeItem('token')
  }
}

export async function changePasswordApi({
  password,
  newPassword,
  newPasswordConfirmation,
}) {
  const response = await apiFetch('/users/password', {
    method: 'PUT',
    body: {
      password,
      new_password: newPassword,
      new_password_confirmation: newPasswordConfirmation,
    },
  })
  return requireSuccess(response)
}
