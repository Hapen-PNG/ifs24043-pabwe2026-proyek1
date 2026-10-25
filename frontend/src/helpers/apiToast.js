import Swal from 'sweetalert2'

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 1800,
  timerProgressBar: true,
})

export function showApiError(error) {
  Toast.fire({
    icon: 'error',
    title: error instanceof Error ? error.message : 'Permintaan gagal. Coba lagi.',
  })
}
