import apiFetch from '../../../helpers/api.js'

function requireSuccess(response, fallbackMessage) {
  if (response?.status !== 'success') {
    throw new Error(response?.message || fallbackMessage)
  }
  return response
}

function requireUser(response, fallbackMessage) {
  const user = requireSuccess(response, fallbackMessage).data?.user
  if (!user) throw new Error(fallbackMessage)
  return user
}

export async function getCurrentUserApi() {
  return requireUser(
    await apiFetch('/users/me'),
    'Respons profil API tidak memuat data pengguna.',
  )
}

export async function updateCurrentUserApi({ name, email }) {
  return requireUser(
    await apiFetch('/users/me', {
      method: 'PUT',
      body: { name, email },
    }),
    'Respons pembaruan profil API tidak memuat data pengguna.',
  )
}

export async function updateCurrentUserPhotoApi(photo) {
  const body = new FormData()
  body.append('photo', photo)
  await requireSuccess(
    await apiFetch('/users/me/photo', {
      method: 'POST',
      body,
    }),
    'Foto profil gagal diperbarui.',
  )
  return getCurrentUserApi()
}
