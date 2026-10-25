import loadSweetAlert from './loadSweetAlert.js'

export async function showApiError(error) {
  const Swal = await loadSweetAlert()
  await Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 1800,
    timerProgressBar: true,
  }).fire({
    icon: 'error',
    title: error instanceof Error ? error.message : 'Permintaan gagal. Coba lagi.',
  })
}
